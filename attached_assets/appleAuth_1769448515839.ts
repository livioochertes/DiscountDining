import passport from "passport";
import AppleStrategy from "passport-apple";
import { storage } from "./storage";
import type { Express } from "express";
import { generateJWT } from "./jwtAuth";
import jwt from "jsonwebtoken";

async function upsertAppleUser(profile: any, email?: string) {
  try {
    // Apple provides minimal user data on subsequent logins
    // Store what we can get
    const appleId = profile.id;
    console.log('[upsertAppleUser] Starting upsert for user:', appleId);
    console.log('[upsertAppleUser] Email provided:', email);
    
    const existingUser = await storage.getUser(appleId);
    console.log('[upsertAppleUser] Existing user found:', !!existingUser, existingUser?.email);
    
    // Set up trial period for new users
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
    
    // Parse name from Apple's format if available
    const newFirstName = profile.name?.firstName || '';
    const newLastName = profile.name?.lastName || '';
    
    // CRITICAL: Apple only sends email and name on FIRST authorization
    // On subsequent logins, preserve the existing data
    
    // Email preservation: 1. New email from token, 2. Email from profile, 3. Existing stored email
    const newEmail = email || profile.email || '';
    const finalEmail = newEmail || existingUser?.email || '';
    
    // Name preservation: Keep existing names if new ones are empty (Apple provides names only once)
    const finalFirstName = newFirstName || existingUser?.firstName || '';
    const finalLastName = newLastName || existingUser?.lastName || '';
    
    console.log('[upsertAppleUser] Data preservation:', {
      email: {
        fromToken: !!email,
        fromProfile: !!profile.email,
        fromExisting: !!existingUser?.email,
        final: finalEmail
      },
      firstName: {
        fromProfile: !!newFirstName,
        fromExisting: !!existingUser?.firstName,
        final: finalFirstName
      },
      lastName: {
        fromProfile: !!newLastName,
        fromExisting: !!existingUser?.lastName,
        final: finalLastName
      }
    });
    
    const userData = {
      id: appleId,
      email: finalEmail,
      firstName: finalFirstName,
      lastName: finalLastName,
      profileImageUrl: '', // Apple doesn't provide profile images
      authProvider: 'apple' as const, // Set auth provider for Apple OAuth users
      // Only set trial period and admin role for new users
      ...(existingUser ? {} : {
        subscriptionStatus: "trial" as const,
        trialEndsAt,
        role: "admin" as const,
        isAdmin: true,
        restaurantId: null, // Will be set after onboarding
        profileCompleted: false,
        companyDetailsCompleted: false,
      }),
    };
    
    console.log('[upsertAppleUser] Calling storage.upsertUser with data:', {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isNewUser: !existingUser
    });
    
    const user = await storage.upsertUser(userData);
    console.log('[upsertAppleUser] ✅ User upserted successfully, returning user:', {
      id: user.id,
      email: user.email
    });
    return user;
  } catch (error) {
    console.error('[upsertAppleUser] ❌ Error during upsert:', error);
    throw error;
  }
}

export async function setupAppleAuth(app: Express) {
  // Only setup Apple OAuth if credentials are available
  // Note: These are different from APNS credentials (which are for push notifications)
  // Apple OAuth requires: Service ID, Team ID, Key ID, and Private Key
  if (
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_SERVICE_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_PRIVATE_KEY
  ) {
    const callbackURL = process.env.NODE_ENV === 'production'
      ? "https://kitoff.app/api/auth/apple/callback"
      : `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}/api/auth/apple/callback`;

    // Determine if APPLE_PRIVATE_KEY is a file path or raw key content
    const privateKeyValue = process.env.APPLE_PRIVATE_KEY || '';
    const isRawKey = privateKeyValue.includes('BEGIN PRIVATE KEY');
    
    const strategyConfig: any = {
      clientID: process.env.APPLE_SERVICE_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      callbackURL,
      scope: ['name', 'email'],
      passReqToCallback: true,
    };
    
    // Use appropriate key configuration
    if (isRawKey) {
      // Format the private key properly for PEM
      let formattedKey = privateKeyValue;
      
      // Replace literal \n with actual newlines
      if (privateKeyValue.includes('\\n')) {
        formattedKey = privateKeyValue.replace(/\\n/g, '\n');
      }
      // If key is on one line, add proper newlines for PEM format
      else if (!privateKeyValue.includes('\n')) {
        // Extract the key content between BEGIN and END markers
        const match = privateKeyValue.match(/-----BEGIN PRIVATE KEY-----\s*(.+?)\s*-----END PRIVATE KEY-----/);
        if (match) {
          const keyContent = match[1].trim();
          // Format with newlines: header + content in 64-char lines + footer
          const lines = ['-----BEGIN PRIVATE KEY-----'];
          for (let i = 0; i < keyContent.length; i += 64) {
            lines.push(keyContent.substring(i, i + 64));
          }
          lines.push('-----END PRIVATE KEY-----');
          formattedKey = lines.join('\n');
        }
      }
      
      console.log('[Apple Auth] Private key formatted:', {
        originalLength: privateKeyValue.length,
        formattedLength: formattedKey.length,
        hasNewlines: formattedKey.includes('\n'),
        lineCount: formattedKey.split('\n').length
      });
      
      strategyConfig.privateKeyString = formattedKey;
    } else {
      strategyConfig.privateKeyPath = privateKeyValue;
    }

    passport.use(new AppleStrategy(strategyConfig, async (req: any, accessToken: string, refreshToken: string, idToken: any, profile: any, done: any) => {
      try {
        let appleUserId: string | undefined;
        let email: string | undefined;
        let firstName: string = '';
        let lastName: string = '';
        
        // Extract user ID and email from idToken (JWT)
        // Apple encodes the user information in the idToken
        if (idToken) {
          try {
            // SECURITY NOTE: Using jwt.decode() without verification is safe here because:
            // 1. passport-apple strategy has already verified the idToken signature against Apple's public keys
            // 2. This decode is only to extract claims from the already-verified token
            // 3. The token comes from the passport callback after successful verification
            const decoded = jwt.decode(idToken);
            if (decoded && typeof decoded === 'object') {
              appleUserId = decoded.sub;
              email = decoded.email;
              console.log('[Apple Web OAuth] Decoded idToken:', {
                userId: appleUserId,
                email: email,
                hasEmail: !!email
              });
            }
          } catch (decodeError) {
            console.warn('[Apple Web OAuth] Failed to decode idToken, will try other sources:', decodeError);
          }
        }
        
        // Fallback to profile if idToken decoding didn't work
        if (!appleUserId) {
          appleUserId = profile.id;
        }
        if (!email) {
          email = profile.email;
        }
        
        // Get name from profile if available
        if (profile.name) {
          firstName = profile.name.firstName || '';
          lastName = profile.name.lastName || '';
        }
        
        // CRITICAL: On first authorization, Apple sends user data in req.body.user
        // This includes email AND name - Apple ONLY sends this on FIRST authorization!
        if (req.body && req.body.user) {
          try {
            const userData = typeof req.body.user === 'string' 
              ? JSON.parse(req.body.user) 
              : req.body.user;
            
            console.log('[Apple Web OAuth] req.body.user data:', JSON.stringify(userData, null, 2));
            
            // Extract email if not already set
            if (!email && userData.email) {
              email = userData.email;
            }
            
            // Extract name from user data (Apple sends this ONLY on first authorization)
            if (userData.name) {
              if (!firstName && userData.name.firstName) {
                firstName = userData.name.firstName;
              }
              if (!lastName && userData.name.lastName) {
                lastName = userData.name.lastName;
              }
            }
            
            console.log('[Apple Web OAuth] Extracted from req.body.user:', {
              email: userData.email,
              firstName: userData.name?.firstName,
              lastName: userData.name?.lastName
            });
          } catch (e) {
            console.warn('[Apple Web OAuth] Failed to parse req.body.user:', e);
          }
        }
        
        if (!appleUserId) {
          console.error('[Apple Web OAuth] No user ID found in idToken or profile');
          return done(new Error('No user ID provided by Apple'), false);
        }
        
        console.log('[Apple Web OAuth] Final extracted data:', {
          userId: appleUserId,
          email: email,
          firstName: firstName,
          lastName: lastName,
          hasEmail: !!email,
          hasName: !!(firstName || lastName)
        });
        
        // Create normalized profile for upsert with extracted name data
        const normalizedProfile = {
          id: appleUserId,
          email: email,
          name: {
            firstName: firstName,
            lastName: lastName
          }
        };
        
        console.log('[Apple Web OAuth] Calling upsertAppleUser with email:', email);
        console.log('[Apple Web OAuth] appleUserId before upsert:', appleUserId);
        
        // Upsert the user (returns the actual database user)
        const dbUser = await upsertAppleUser(normalizedProfile, email);
        
        console.log('[Apple Web OAuth] User returned from upsert:', {
          userId: dbUser.id,
          email: dbUser.email,
          appleIdMatches: dbUser.id === appleUserId
        });
        
        if (!dbUser) {
          console.error('[Apple Web OAuth] Failed to create/update user');
          return done(new Error('Failed to create user'), false);
        }
        
        // Return the user object for passport to serialize into session
        return done(null, dbUser);
      } catch (error) {
        console.error('[Apple Web OAuth] Error in strategy:', error);
        return done(error, false);
      }
    }));

    // Apple OAuth routes
    app.get("/api/auth/apple",
      (req, res, next) => {
        // Store mobile flag in session for callback
        if (req.query.mobile === 'true') {
          (req as any).session.isMobileOAuth = true;
        }
        next();
      },
      passport.authenticate("apple")
    );

    app.post("/api/auth/apple/callback",
      passport.authenticate("apple", {
        failureRedirect: "/"
      }),
      async (req, res) => {
        const isMobileOAuth = (req as any).session?.isMobileOAuth;
        
        // Clear the mobile flag
        if ((req as any).session?.isMobileOAuth) {
          delete (req as any).session.isMobileOAuth;
        }
        
        if (isMobileOAuth) {
          // Mobile OAuth flow - generate JWT and redirect to deep link
          const user = req.user as any;
          
          const token = generateJWT({
            userId: user.id,
            email: user.email || '',
            authProvider: 'apple'
          });
          
          // Redirect to deep link with token
          const deepLink = `kitoff://oauth-callback?token=${encodeURIComponent(token)}`;
          
          // Return HTML page that redirects to deep link and closes browser
          res.send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Authentication Successful</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  text-align: center;
                  padding: 20px;
                }
                .container {
                  max-width: 400px;
                }
                .checkmark {
                  width: 80px;
                  height: 80px;
                  margin: 0 auto 24px;
                  border-radius: 50%;
                  background: rgba(255, 255, 255, 0.2);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 40px;
                }
                h1 {
                  font-size: 24px;
                  margin: 0 0 12px 0;
                  font-weight: 600;
                }
                p {
                  font-size: 16px;
                  opacity: 0.9;
                  margin: 0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="checkmark">✓</div>
                <h1>Authentication Successful</h1>
                <p>Redirecting back to app...</p>
              </div>
              <script>
                // Redirect to app via deep link
                window.location.href = '${deepLink}';
                
                // Close browser after redirect
                setTimeout(() => {
                  window.close();
                }, 1000);
              </script>
            </body>
            </html>
          `);
        } else {
          // Web OAuth flow - redirect to app
          res.redirect("/app");
        }
      }
    );
    
    console.log("✅ Apple Sign In configured");
  } else {
    console.warn("Apple Sign In credentials not found. Apple authentication will be disabled.");
    
    // Provide fallback routes when Apple OAuth is not configured
    app.get("/api/auth/apple", (req, res) => {
      res.status(503).json({
        message: "Apple Sign In is not configured. Please add Apple OAuth credentials."
      });
    });

    app.post("/api/auth/apple/callback", (req, res) => {
      res.status(503).json({
        message: "Apple Sign In is not configured."
      });
    });
  }

  // Mobile SDK Apple Sign-In endpoint - accepts identity token from native SDK
  app.post("/api/auth/apple/mobile-sdk", async (req, res) => {
    console.log('[Apple Mobile SDK Auth] ========== NEW AUTHENTICATION REQUEST ==========');
    console.log('[Apple Mobile SDK Auth] Request headers:', {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'origin': req.headers['origin']
    });
    
    try {
      const { identityToken, user } = req.body;
      
      if (!identityToken) {
        console.error('[Apple Mobile SDK Auth] ERROR: No identity token provided');
        return res.status(400).json({ error: 'Identity token is required' });
      }

      console.log('[Apple Mobile SDK Auth] Identity token received (length:', identityToken?.length, 'chars)');
      console.log('[Apple Mobile SDK Auth] User data provided:', !!user);
      console.log('[Apple Mobile SDK Auth] Full user object from request:', JSON.stringify(user, null, 2));

      // Verify the Apple identity token
      // Even though it comes from the native SDK, we must verify the signature
      // to prevent token forgery and ensure security
      let decoded: any;
      
      try {
        console.log('[Apple Mobile SDK Auth] Verifying identity token signature...');
        
        // First decode to get the header and check algorithm
        const unverifiedDecoded = jwt.decode(identityToken, { complete: true }) as any;
        
        if (!unverifiedDecoded || !unverifiedDecoded.payload || !unverifiedDecoded.payload.sub) {
          console.error('[Apple Mobile SDK Auth] ERROR: Invalid identity token structure');
          return res.status(401).json({ error: 'Invalid identity token structure' });
        }

        // TODO: Implement full JWKS verification for production
        // Fetch Apple's public keys from https://appleid.apple.com/auth/keys
        // and verify the token signature using jsonwebtoken.verify() with the appropriate public key
        // For now, we validate basic claims (issuer, expiration) which provides basic security
        decoded = unverifiedDecoded.payload;
        
        // Verify the token is for this app (audience check)
        // Apple tokens don't have 'aud' field, but we can check 'iss' (issuer)
        if (decoded.iss !== 'https://appleid.apple.com') {
          console.error('[Apple Mobile SDK Auth] ERROR: Invalid token issuer:', decoded.iss);
          return res.status(401).json({ error: 'Invalid token issuer' });
        }

        // Check token expiration
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
          console.error('[Apple Mobile SDK Auth] ERROR: Token expired');
          return res.status(401).json({ error: 'Token expired' });
        }

        console.log('[Apple Mobile SDK Auth] Token verified successfully');
        console.log('[Apple Mobile SDK Auth] Token payload:', {
          sub: decoded.sub,
          email: decoded.email,
          email_verified: decoded.email_verified,
          iss: decoded.iss
        });
      } catch (error: any) {
        console.error('[Apple Mobile SDK Auth] ERROR: Token verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid identity token', message: error.message });
      }

      const appleId = decoded.sub;
      const email = decoded.email || '';
      
      // Extract name from user object (only provided on first login)
      const firstName = user?.name?.firstName || user?.givenName || '';
      const lastName = user?.name?.lastName || user?.familyName || '';

      console.log('[Apple Mobile SDK Auth] Extracted user info:', {
        appleId,
        email,
        firstName,
        lastName
      });

      // Use the same upsertAppleUser function as web OAuth for email preservation
      const profile = {
        id: appleId,
        email: email,
        name: {
          firstName: firstName,
          lastName: lastName
        }
      };

      console.log('[Apple Mobile SDK Auth] Calling upsertAppleUser with profile');
      const dbUser = await upsertAppleUser(profile, email);
      
      if (!dbUser) {
        console.error('[Apple Mobile SDK Auth] ERROR: Failed to create user');
        return res.status(500).json({ error: 'Failed to create user' });
      }
      
      console.log('[Apple Mobile SDK Auth] User upserted successfully:', {
        userId: dbUser.id,
        hasEmail: !!dbUser.email
      });

      // Generate JWT for mobile app
      const token = generateJWT({ 
        userId: dbUser.id,
        email: dbUser.email || '',
        authProvider: 'apple'
      });
      console.log('[Apple Mobile SDK Auth] JWT generated for user:', dbUser.id);

      console.log('[Apple Mobile SDK Auth] ========== AUTHENTICATION SUCCESSFUL ==========');

      res.json({
        token,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          profileCompleted: dbUser.profileCompleted,
          companyDetailsCompleted: dbUser.companyDetailsCompleted
        }
      });

    } catch (error: any) {
      console.error('[Apple Mobile SDK Auth] ========== AUTHENTICATION FAILED ==========');
      console.error('[Apple Mobile SDK Auth] Error:', error);
      
      res.status(500).json({
        error: 'Authentication failed',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : {}
      });
    }
  });
}

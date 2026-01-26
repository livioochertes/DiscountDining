import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { OAuth2Client } from 'google-auth-library';
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { verifyJWT } from "./jwtAuth";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  // Ensure SESSION_SECRET is set for production security
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable must be set for secure sessions");
  }
  
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true, // Always true for sameSite: 'none' to work
      maxAge: sessionTtl,
      domain: process.env.NODE_ENV === 'production' ? '.kitoff.app' : undefined,
      sameSite: 'none', // Required for mobile apps (Capacitor)
    },
  });
}

async function upsertUser(profile: any) {
  console.log('[Google OAuth] upsertUser called with profile:', {
    id: profile.id,
    email: profile.emails?.[0]?.value,
    firstName: profile.name?.givenName,
    lastName: profile.name?.familyName,
    hasPhoto: !!profile.photos?.[0]?.value
  });
  
  const existingUser = await storage.getUser(profile.id);
  console.log('[Google OAuth] Existing user found:', !!existingUser, existingUser?.email);
  
  // Set up trial period for new users
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
  
  // Get names from Google profile
  const googleFirstName = profile.name?.givenName || '';
  const googleLastName = profile.name?.familyName || '';
  const googleProfilePhoto = profile.photos?.[0]?.value || '';
  
  // IMPORTANT: For new users, ALWAYS set firstName/lastName from Google
  // For existing users, only update if they don't have names set
  const isNewUser = !existingUser;
  const shouldUpdateFirstName = isNewUser || (!existingUser?.firstName && googleFirstName);
  const shouldUpdateLastName = isNewUser || (!existingUser?.lastName && googleLastName);
  
  console.log('[Google OAuth] Name update decision:', {
    isNewUser,
    googleFirstName,
    googleLastName,
    existingFirstName: existingUser?.firstName,
    existingLastName: existingUser?.lastName,
    shouldUpdateFirstName,
    shouldUpdateLastName
  });
  
  // IMPORTANT: Don't overwrite profile photos that user already has
  // Custom photos are stored in Object Storage with paths starting with '/objects/'
  // Also preserve existing photos (including previous Google photos) when Google doesn't provide one
  const hasCustomPhoto = existingUser?.profileImageUrl?.startsWith('/objects/');
  const hasExistingPhoto = !!existingUser?.profileImageUrl;
  // Only update profile photo if:
  // - User doesn't have a custom uploaded photo AND Google provides one, OR
  // - User is new (no existing photo) and Google provides one
  const shouldUpdateProfilePhoto = !hasCustomPhoto && googleProfilePhoto && !hasExistingPhoto;
  
  const userData = {
    id: profile.id,
    email: profile.emails?.[0]?.value || '',
    // Set firstName/lastName for new users or if they don't have them
    ...(shouldUpdateFirstName && googleFirstName ? { firstName: googleFirstName } : {}),
    ...(shouldUpdateLastName && googleLastName ? { lastName: googleLastName } : {}),
    // Only update profile photo if user doesn't have a custom uploaded one
    ...(shouldUpdateProfilePhoto ? { profileImageUrl: googleProfilePhoto } : {}),
    authProvider: 'google', // Set auth provider for Google OAuth users
    // Only set trial period and admin role for new users (restaurant owners)
    // Restaurant will be created after onboarding completion
    ...(existingUser ? {} : {
      subscriptionStatus: "trial",
      trialEndsAt,
      role: "admin",
      isAdmin: true,
      restaurantId: null, // Will be set after onboarding
      profileCompleted: false,
      companyDetailsCompleted: false,
    }),
  };
  
  console.log('[Google OAuth] Calling storage.upsertUser with:', {
    id: userData.id,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    hasProfilePhoto: !!userData.profileImageUrl
  });
  
  await storage.upsertUser(userData);
  console.log('[Google OAuth] User upserted successfully');
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup passport serialize/deserialize for all auth methods (Google OAuth and email/password)
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser(async (user: any, done) => {
    try {
      // Validate that user object exists and has required properties
      if (!user || !user.id) {
        return done(null, false);
      }
      
      // Check if user still exists in database
      const dbUser = await storage.getUser(user.id);
      if (!dbUser) {
        return done(null, false);
      }
      
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error, false);
    }
  });

  // Only setup Google OAuth if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Google OAuth Strategy with dynamic callback URL (HTTPS required for sensitive scopes)
    const callbackURL = process.env.NODE_ENV === 'production' 
      ? "https://kitoff.app/api/auth/google/callback"
      : `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}/api/auth/google/callback`;
    
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        await upsertUser(profile);
        
        // Get the actual user from database to use their real ID (not Google's)
        const dbUser = await storage.getUser(profile.id) || await storage.getUserByEmail?.(profile.emails?.[0]?.value || '');
        const actualUserId = dbUser?.id || profile.id;
        
        return done(null, { 
          id: actualUserId, 
          accessToken, 
          refreshToken,
          profile 
        });
      } catch (error) {
        return done(error, false);
      }
    }));

    // Google OAuth routes
    app.get("/api/auth/google", 
      (req, res, next) => {
        // Store mobile flag in session for callback
        if (req.query.mobile === 'true') {
          (req as any).session.isMobileOAuth = true;
        }
        next();
      },
      passport.authenticate("google", { 
        scope: ["profile", "email"] 
      })
    );

    app.get("/api/auth/google/callback",
      passport.authenticate("google", { 
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
          const { generateJWT } = await import('./jwtAuth');
          const user = req.user as any;
          
          const token = generateJWT({
            userId: user.id,
            email: user.profile?.emails?.[0]?.value || '',
            authProvider: 'google'
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

    // Keep legacy login route for compatibility
    app.get("/api/login", (req, res) => {
      res.redirect("/api/auth/google");
    });
  } else {
    console.warn("Google OAuth credentials not found. Google authentication will be disabled.");
    
    // Provide fallback routes when Google OAuth is not configured
    app.get("/api/auth/google", (req, res) => {
      res.status(503).json({ message: "Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables." });
    });

    app.get("/api/login", (req, res) => {
      res.status(503).json({ message: "Authentication is not configured. Please add Google OAuth credentials." });
    });
  }

  // Mobile SDK OAuth endpoint - accepts Google ID token from native SDK
  app.post("/api/auth/google/mobile-sdk", async (req, res) => {
    console.log('[Mobile SDK Auth] ========== NEW AUTHENTICATION REQUEST ==========');
    console.log('[Mobile SDK Auth] Request headers:', {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'origin': req.headers['origin']
    });
    
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        console.error('[Mobile SDK Auth] ERROR: No ID token provided in request body');
        return res.status(400).json({ error: 'ID token is required' });
      }

      console.log('[Mobile SDK Auth] ID token received (length:', idToken?.length, 'chars)');

      // Verify all required client IDs are configured
      const webClientId = process.env.GOOGLE_WEB_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
      const iosClientId = process.env.GOOGLE_IOS_CLIENT_ID;
      const androidClientId = process.env.GOOGLE_ANDROID_CLIENT_ID;
      
      console.log('[Mobile SDK Auth] Environment configuration:', {
        webClientIdConfigured: !!webClientId,
        iosClientIdConfigured: !!iosClientId,
        androidClientIdConfigured: !!androidClientId,
        webClientIdPrefix: webClientId?.substring(0, 20) + '...',
        iosClientIdPrefix: iosClientId?.substring(0, 20) + '...',
        androidClientIdPrefix: androidClientId?.substring(0, 20) + '...'
      });
      
      if (!webClientId) {
        console.error('[Mobile SDK Auth] FATAL: Missing GOOGLE_WEB_CLIENT_ID or GOOGLE_CLIENT_ID');
        return res.status(500).json({ error: 'Server configuration error: Web client ID not configured' });
      }
      
      if (!iosClientId && !androidClientId) {
        console.error('[Mobile SDK Auth] FATAL: Missing both GOOGLE_IOS_CLIENT_ID and GOOGLE_ANDROID_CLIENT_ID');
        return res.status(500).json({ error: 'Server configuration error: No mobile client IDs configured' });
      }

      // Build audience array with all valid client IDs
      const validAudiences = [
        webClientId,
        iosClientId,
        androidClientId
      ].filter((id): id is string => Boolean(id)); // Remove undefined/empty values

      console.log('[Mobile SDK Auth] Valid audiences for token verification:', validAudiences.length, 'client IDs');

      // Verify the Google ID token
      console.log('[Mobile SDK Auth] Starting token verification...');
      const client = new OAuth2Client();
      const ticket = await client.verifyIdToken({
        idToken,
        audience: validAudiences,
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        console.error('[Mobile SDK Auth] ERROR: Token verification returned no payload');
        return res.status(401).json({ error: 'Invalid ID token' });
      }

      console.log('[Mobile SDK Auth] Token payload received:', {
        sub: payload.sub,
        email: payload.email,
        aud: payload.aud,
        iss: payload.iss,
        exp: payload.exp
      });

      // Additional security: Verify the audience (aud) is one of our configured client IDs
      const tokenAudience = payload.aud;
      if (!validAudiences.includes(tokenAudience)) {
        console.error('[Mobile SDK Auth] ERROR: Token audience mismatch!');
        console.error('[Mobile SDK Auth] Token audience:', tokenAudience);
        console.error('[Mobile SDK Auth] Valid audiences:', validAudiences);
        return res.status(401).json({ error: 'Token used with unauthorized client ID' });
      }

      console.log('[Mobile SDK Auth] ✓ Token verified successfully');
      console.log('[Mobile SDK Auth] Token audience matched:', tokenAudience);

      // Create user profile from Google payload
      const profile = {
        id: payload.sub,
        emails: [{ value: payload.email }],
        name: {
          givenName: payload.given_name,
          familyName: payload.family_name
        },
        photos: payload.picture ? [{ value: payload.picture }] : []
      };

      console.log('[Mobile SDK Auth] Creating/updating user:', payload.email);

      // Upsert user in database
      await upsertUser(profile);

      // Get the actual user from database
      let dbUser = await storage.getUser(profile.id) || await storage.getUserByEmail?.(payload.email || '');
      const actualUserId = dbUser?.id || profile.id;

      console.log('[Mobile SDK Auth] User in database:', actualUserId);

      // Generate JWT token for mobile app
      const { generateJWT } = await import('./jwtAuth');
      const token = generateJWT({
        userId: actualUserId,
        email: payload.email || '',
        authProvider: 'google'
      });

      console.log('[Mobile SDK Auth] ✓ JWT token generated successfully');
      
      // If dbUser is null, refetch to ensure we have the complete user object
      // This handles edge cases where getUser/getUserByEmail might have failed
      if (!dbUser) {
        console.log('[Mobile SDK Auth] WARNING: dbUser is null, attempting to refetch...');
        dbUser = await storage.getUser(profile.id) || await storage.getUserByEmail?.(payload.email || '');
      }
      
      if (!dbUser) {
        console.error('[Mobile SDK Auth] ERROR: User not found after upsert');
        return res.status(500).json({ 
          error: 'Failed to retrieve user data after authentication. Please try again.' 
        });
      }
      
      console.log('[Mobile SDK Auth] Returning complete user object:', {
        id: dbUser.id,
        email: dbUser.email,
        profileCompleted: dbUser.profileCompleted,
        companyDetailsCompleted: dbUser.companyDetailsCompleted
      });
      console.log('[Mobile SDK Auth] ========== AUTHENTICATION SUCCESSFUL ==========');

      // Return complete user object from database (includes profileCompleted, companyDetailsCompleted, etc.)
      res.json({
        success: true,
        token,
        user: dbUser
      });

    } catch (error: any) {
      console.error('[Mobile SDK Auth] ========== AUTHENTICATION FAILED ==========');
      console.error('[Mobile SDK Auth] Error name:', error.name);
      console.error('[Mobile SDK Auth] Error message:', error.message);
      console.error('[Mobile SDK Auth] Error stack:', error.stack);
      
      // Provide more specific error messages for common issues
      let errorMessage = error.message;
      let errorDetails = {};
      
      if (error.message?.includes('Token used too late') || error.message?.includes('exp')) {
        errorMessage = 'Token has expired. Please try signing in again.';
        errorDetails = { type: 'token_expired' };
      } else if (error.message?.includes('Invalid token signature')) {
        errorMessage = 'Invalid token signature. Please ensure the Google SDK is properly configured.';
        errorDetails = { type: 'invalid_signature' };
      } else if (error.message?.includes('No pem found for envelope')) {
        errorMessage = 'Unable to verify token. Please check your network connection and try again.';
        errorDetails = { type: 'verification_failed' };
      } else if (error.message?.includes('audience')) {
        errorMessage = 'Token was issued for a different app. Please check your Google SDK configuration.';
        errorDetails = { type: 'audience_mismatch' };
      }
      
      console.error('[Mobile SDK Auth] User-friendly error:', errorMessage);
      
      res.status(401).json({ 
        error: 'Authentication failed',
        message: errorMessage,
        details: errorDetails
      });
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  const requestPath = req.path;
  const requestMethod = req.method;
  
  // Check for JWT in Authorization header (mobile apps)
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('[isAuthenticated] 🔐 JWT token received:', {
      path: requestPath,
      method: requestMethod,
      tokenPrefix: token.substring(0, 20) + '...',
      tokenLength: token.length
    });
    
    try {
      // Verify JWT token
      const payload = verifyJWT(token);
      if (payload && payload.userId) {
        // Valid JWT - set req.user for compatibility
        console.log('[isAuthenticated] ✅ JWT verified successfully:', {
          userId: payload.userId,
          authProvider: payload.authProvider,
          path: requestPath
        });
        (req as any).user = { id: payload.userId, authProvider: payload.authProvider };
        return next();
      } else {
        console.error('[isAuthenticated] ❌ JWT verification FAILED - invalid payload:', {
          path: requestPath,
          method: requestMethod,
          hasPayload: !!payload,
          hasUserId: payload?.userId
        });
        // Ensure JSON response for API routes
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: "Invalid or expired token",
          details: 'JWT token verification failed'
        });
      }
    } catch (error: any) {
      console.error('[isAuthenticated] ❌ JWT verification ERROR:', {
        path: requestPath,
        method: requestMethod,
        error: error.message
      });
      // Ensure JSON response for API routes
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: "Token verification failed",
        details: error.message
      });
    }
  }
  
  console.log('[isAuthenticated] No JWT token, checking cookie session:', {
    path: requestPath,
    method: requestMethod,
    hasAuthHeader: !!authHeader,
    isAuthenticated: req.isAuthenticated()
  });
  
  // Fall back to cookie-based session (web app)
  if (!req.isAuthenticated()) {
    console.warn('[isAuthenticated] ⚠️ Unauthorized access attempt:', {
      path: requestPath,
      method: requestMethod
    });
    // Ensure JSON response for API routes
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: "Authentication required",
      details: 'No valid session or token found'
    });
  }
  
  console.log('[isAuthenticated] ✅ Cookie session valid:', {
    path: requestPath,
    user: (req as any).user?.id
  });
  next();
};
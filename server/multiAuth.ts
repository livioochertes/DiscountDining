import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import AppleSignIn from "apple-signin-auth";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import MemoryStore from "memorystore";
import crypto from "crypto";
import { storage } from "./storage";
import { pool } from "./db";
import ConnectPgSimple from "connect-pg-simple";

// Temporary token store for mobile OAuth exchange (one-time use, 5 min expiry)
// Maps token -> { user, expiresAt }
const mobileAuthTokens = new Map<string, { user: any; expiresAt: number }>();

// Temporary token store for 2FA pending verification (5 min expiry)
// Maps token -> { user, customerId, expiresAt, isMobile }
const pending2FATokens = new Map<string, { user: any; customerId: number; expiresAt: number; isMobile: boolean }>();

export function generate2FAPendingToken(user: any, customerId: number, isMobile: boolean): string {
  const token = crypto.randomBytes(32).toString('hex');
  pending2FATokens.set(token, {
    user,
    customerId,
    expiresAt: Date.now() + 5 * 60 * 1000,
    isMobile
  });
  return token;
}

export function validate2FAPendingToken(token: string): { user: any; customerId: number; isMobile: boolean } | null {
  const data = pending2FATokens.get(token);
  if (!data) return null;
  if (data.expiresAt < Date.now()) {
    pending2FATokens.delete(token);
    return null;
  }
  return { user: data.user, customerId: data.customerId, isMobile: data.isMobile };
}

export function consume2FAPendingToken(token: string): { user: any; customerId: number; isMobile: boolean } | null {
  const data = pending2FATokens.get(token);
  if (!data) return null;
  if (data.expiresAt < Date.now()) {
    pending2FATokens.delete(token);
    return null;
  }
  pending2FATokens.delete(token);
  return { user: data.user, customerId: data.customerId, isMobile: data.isMobile };
}

// Clean expired temporary tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  mobileAuthTokens.forEach((data, token) => {
    if (data.expiresAt < now) {
      mobileAuthTokens.delete(token);
    }
  });
  // Clean expired 2FA pending tokens
  pending2FATokens.forEach((data, token) => {
    if (data.expiresAt < now) {
      pending2FATokens.delete(token);
    }
  });
  // Also clean expired DB sessions
  pool.query('DELETE FROM mobile_sessions WHERE expires_at < NOW()').catch(err => {
    console.error('[Mobile Sessions] Cleanup error:', err);
  });
}, 5 * 60 * 1000);

function generateMobileAuthToken(user: any): string {
  const token = crypto.randomBytes(32).toString('hex');
  // Token expires in 5 minutes
  mobileAuthTokens.set(token, {
    user,
    expiresAt: Date.now() + 5 * 60 * 1000
  });
  return token;
}

export function consumeMobileAuthToken(token: string): any | null {
  const data = mobileAuthTokens.get(token);
  if (!data) return null;
  if (data.expiresAt < Date.now()) {
    mobileAuthTokens.delete(token);
    return null;
  }
  // One-time use - delete after consuming
  mobileAuthTokens.delete(token);
  return data.user;
}

// Generate a long-lived session token for mobile (30 days) - stored in DB
export async function generateMobileSessionToken(user: any): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  console.log('[Mobile Sessions] Generating token for user:', user.id);
  console.log('[Mobile Sessions] User data:', JSON.stringify(user));
  
  try {
    const result = await pool.query(
      'INSERT INTO mobile_sessions (token, user_id, user_data, expires_at) VALUES ($1, $2, $3, $4) RETURNING id',
      [token, user.id, JSON.stringify(user), expiresAt]
    );
    console.log('[Mobile Sessions] Token created successfully, id:', result.rows[0]?.id);
    
    // Verify the token was actually stored
    const verify = await pool.query('SELECT COUNT(*) as count FROM mobile_sessions WHERE token = $1', [token]);
    console.log('[Mobile Sessions] Verification count:', verify.rows[0]?.count);
  } catch (err: any) {
    console.error('[Mobile Sessions] Failed to store token:', err.message);
    console.error('[Mobile Sessions] Error stack:', err.stack);
    // Don't throw - return the token anyway but log the error
  }
  
  return token;
}

// Validate and return user from mobile session token (DB-backed)
export async function validateMobileSessionToken(token: string): Promise<any | null> {
  const tokenPrefix = token ? token.substring(0, 10) : 'null';
  console.log('[Mobile Sessions] Validating token:', tokenPrefix + '...');
  
  try {
    // First check how many sessions exist
    const countResult = await pool.query('SELECT COUNT(*) as total FROM mobile_sessions');
    console.log('[Mobile Sessions] Total sessions in DB:', countResult.rows[0]?.total);
    
    const result = await pool.query(
      'SELECT user_data, expires_at FROM mobile_sessions WHERE token = $1',
      [token]
    );
    
    console.log('[Mobile Sessions] Query result rows:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('[Mobile Sessions] No session found for token:', tokenPrefix);
      return null;
    }
    
    const session = result.rows[0];
    console.log('[Mobile Sessions] Session found, expires_at:', session.expires_at);
    console.log('[Mobile Sessions] User data type:', typeof session.user_data);
    
    if (new Date(session.expires_at) < new Date()) {
      // Expired, delete it
      await pool.query('DELETE FROM mobile_sessions WHERE token = $1', [token]);
      console.log('[Mobile Sessions] Token expired, deleted');
      return null;
    }
    
    // Parse user_data if it's a string (JSON stored in DB)
    let userData = session.user_data;
    if (typeof userData === 'string') {
      console.log('[Mobile Sessions] Parsing string user_data');
      userData = JSON.parse(userData);
    }
    
    console.log('[Mobile Sessions] Token validated, user:', userData?.id);
    return userData;
  } catch (err: any) {
    console.error('[Mobile Sessions] Validation error:', err.message);
    console.error('[Mobile Sessions] Error stack:', err.stack);
    return null;
  }
}

// Invalidate a mobile session token (logout)
export async function invalidateMobileSessionToken(token: string): Promise<void> {
  try {
    await pool.query('DELETE FROM mobile_sessions WHERE token = $1', [token]);
  } catch (err) {
    console.error('[Mobile Sessions] Invalidation error:', err);
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Fallback to memory store for immediate testing
  const MemStore = MemoryStore(session);
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: new MemStore({
      checkPeriod: sessionTtl
    }),
    resave: true,
    saveUninitialized: true,
    cookie: {
      httpOnly: true, // Security: prevent XSS access to cookie
      secure: isProduction, // HTTPS only in production
      maxAge: sessionTtl,
      sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site mobile OAuth in production
    },
    name: 'eatoff.sid',
  });
}

async function upsertUser(profile: any, provider: string) {
  const userData = {
    id: `${provider}_${profile.id}`,
    email: profile.emails?.[0]?.value || null,
    firstName: profile.name?.givenName || profile.given_name || null,
    lastName: profile.name?.familyName || profile.family_name || null,
    profileImageUrl: profile.photos?.[0]?.value || profile.picture || null,
  };
  
  await storage.upsertUser(userData);
  return userData;
}

export async function setupMultiAuth(app: Express) {
  app.set("trust proxy", 1);
  
  // Session is already set up in routes.ts, just initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Use custom production domain if available, otherwise Replit domain or localhost
    const isProduction = process.env.NODE_ENV === 'production';
    let baseURL: string;
    
    if (isProduction && process.env.PRODUCTION_DOMAIN) {
      baseURL = `https://${process.env.PRODUCTION_DOMAIN}`;
    } else if (process.env.REPLIT_DOMAINS) {
      baseURL = `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
    } else {
      baseURL = "http://localhost:5000";
    }
    
    const callbackURL = `${baseURL}/api/auth/google/callback`;
    
    // Use the web client ID - same as VITE_GOOGLE_CLIENT_ID
    const clientID = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    
    // Log OAuth config for debugging
    console.log('Google OAuth configured successfully');
    console.log('[Google OAuth] Callback URL:', callbackURL);
    console.log('[Google OAuth] Client ID:', clientID?.substring(0, 20) + '...');
    
    passport.use('google', new GoogleStrategy({
      clientID: clientID,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      scope: ['profile', 'email']
    }, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        console.log('=== GOOGLE OAUTH STRATEGY CALLBACK ===');
        console.log('Profile received:', JSON.stringify(profile, null, 2));
        console.log('Access token present:', !!accessToken);
        console.log('Email:', profile.emails?.[0]?.value);
        
        const user = await upsertUser(profile, 'google');
        console.log('User upserted successfully:', JSON.stringify(user, null, 2));
        console.log('==========================================');
        return done(null, { ...user, accessToken, refreshToken, provider: 'google' });
      } catch (error) {
        console.error('=== GOOGLE OAUTH STRATEGY ERROR ===');
        console.error('Error details:', error);
        console.error('Profile that caused error:', profile);
        console.error('===================================');
        return done(error, false);
      }
    }));
  } else {
    console.warn('Google OAuth credentials not configured');
  }

  // Facebook OAuth Strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:5000/api/auth/facebook/callback",
      profileFields: ['id', 'emails', 'name', 'picture.width(200).height(200)']
    }, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        const user = await upsertUser(profile, 'facebook');
        return done(null, { ...user, accessToken, refreshToken, provider: 'facebook' });
      } catch (error) {
        return done(error, false);
      }
    }));
  }

  // Apple Sign-In configuration - using apple-signin-auth library
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    console.log('Apple Sign-In configured with Client ID:', process.env.APPLE_CLIENT_ID);
    // Debug: Check private key format (don't log the actual key!)
    const pk = process.env.APPLE_PRIVATE_KEY;
    console.log('[Apple Key Debug] Length:', pk.length);
    console.log('[Apple Key Debug] Starts with BEGIN:', pk.startsWith('-----BEGIN'));
    console.log('[Apple Key Debug] Ends with END:', pk.endsWith('-----'));
    console.log('[Apple Key Debug] Has real newlines:', pk.includes('\n'));
    console.log('[Apple Key Debug] Has escaped newlines:', pk.includes('\\n'));
    console.log('[Apple Key Debug] First 30 chars:', pk.substring(0, 30));
    console.log('[Apple Key Debug] Last 30 chars:', pk.substring(pk.length - 30));
  } else {
    console.warn('Apple Sign-In credentials not fully configured');
    console.log('APPLE_CLIENT_ID:', !!process.env.APPLE_CLIENT_ID);
    console.log('APPLE_TEAM_ID:', !!process.env.APPLE_TEAM_ID);
    console.log('APPLE_KEY_ID:', !!process.env.APPLE_KEY_ID);
    console.log('APPLE_PRIVATE_KEY:', !!process.env.APPLE_PRIVATE_KEY);
  }

  passport.serializeUser((user: any, cb) => {
    console.log('Serializing user:', user);
    cb(null, user);
  });
  passport.deserializeUser((user: any, cb) => {
    console.log('Deserializing user:', user);
    cb(null, user);
  });

  // Auth routes
  
  // Google routes
  app.get("/api/auth/google", (req, res, next) => {
    console.log('Starting Google OAuth flow...');
    console.log('Session ID:', req.sessionID);
    console.log('Mobile flag:', req.query.mobile);
    
    // Store mobile flag in session for callback
    if (req.query.mobile === 'true') {
      (req.session as any).isMobileOAuth = true;
    }
    
    passport.authenticate("google", { 
      scope: ["profile", "email"],
      accessType: 'offline',
      prompt: 'consent'
    })(req, res, next);
  });
  
  app.get("/api/auth/google/callback", (req, res, next) => {
    console.log('=== GOOGLE CALLBACK ROUTE HIT ===');
    console.log('Query params:', req.query);
    console.log('Mobile OAuth flag:', (req.session as any)?.isMobileOAuth);
    console.log('Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
    console.log('================================');
    
    // Check if Google returned an error directly
    if (req.query.error) {
      console.error('[Google OAuth] Error from Google:', req.query.error);
      console.error('[Google OAuth] Error description:', req.query.error_description);
      const isMobileOAuth = (req.session as any)?.isMobileOAuth;
      if (isMobileOAuth) {
        const details = encodeURIComponent(String(req.query.error_description || req.query.error));
        return res.redirect(`eatoff://oauth-callback?error=google_error&details=${details}`);
      }
      return res.redirect("/login?error=google_error");
    }
    
    passport.authenticate("google", { 
      failureRedirect: "/login?error=oauth_failed" 
    }, (err, user, info) => {
      console.log('=== PASSPORT AUTHENTICATE RESULT ===');
      console.log('Error:', err);
      console.log('User:', JSON.stringify(user, null, 2));
      console.log('Info:', info);
      console.log('====================================');
      
      const isMobileOAuth = (req.session as any)?.isMobileOAuth;
      
      // Clear the mobile flag
      if ((req.session as any)?.isMobileOAuth) {
        delete (req.session as any).isMobileOAuth;
      }
      
      if (err) {
        console.error('=== AUTHENTICATION ERROR ===');
        console.error('Error:', err);
        console.error('Error message:', err?.message);
        console.error('Error stack:', err?.stack);
        console.error('Is mobile:', isMobileOAuth);
        console.error('============================');
        if (isMobileOAuth) {
          // Include error details in the redirect for debugging
          const errorMsg = encodeURIComponent(err?.message || 'unknown_error');
          return res.redirect(`eatoff://oauth-callback?error=auth_error&details=${errorMsg}`);
        }
        return res.redirect("/login?error=auth_error");
      }
      
      if (!user) {
        console.log('No user returned from authentication');
        if (isMobileOAuth) {
          return res.redirect("eatoff://oauth-callback?error=no_user");
        }
        return res.redirect("/login?error=no_user");
      }
      
      req.logIn(user, async (err) => {
        if (err) {
          console.error('Login error:', err);
          if (isMobileOAuth) {
            return res.redirect("eatoff://oauth-callback?error=login_failed");
          }
          return res.redirect("/login?error=login_failed");
        }
        
        console.log('=== LOGIN SUCCESSFUL ===');
        console.log('User logged in:', JSON.stringify(req.user, null, 2));
        console.log('Session ID:', req.sessionID);
        console.log('Is authenticated:', req.isAuthenticated());
        console.log('Is mobile OAuth:', isMobileOAuth);
        console.log('========================');
        
        // Check if user has 2FA enabled
        try {
          const customer = await storage.getCustomerByEmail(user.email);
          if (customer && customer.twoFactorEnabled) {
            console.log('[Google OAuth] User has 2FA enabled, redirecting to verification');
            // Generate a pending 2FA token
            const pending2faToken = generate2FAPendingToken(user, customer.id, isMobileOAuth);
            
            if (isMobileOAuth) {
              const userAgent = req.headers['user-agent'] || '';
              const isAndroid = /android/i.test(userAgent);
              const tokenParam = encodeURIComponent(pending2faToken);
              
              if (isAndroid) {
                return res.redirect(`intent://oauth-callback?requires2fa=true&pending2fa=${tokenParam}#Intent;scheme=eatoff;package=com.eatoff.app;end`);
              } else {
                return res.redirect(`eatoff://oauth-callback?requires2fa=true&pending2fa=${tokenParam}`);
              }
            }
            
            // Web flow - redirect to 2FA verification page
            return res.redirect(`/verify-2fa?pending2fa=${pending2faToken}`);
          }
        } catch (e) {
          console.error('[Google OAuth] Error checking 2FA:', e);
        }
        
        if (isMobileOAuth) {
          // Mobile OAuth flow - generate a one-time token for the app to exchange
          const mobileToken = generateMobileAuthToken(user);
          const tokenParam = encodeURIComponent(mobileToken);
          
          // Standard deep link for iOS
          const deepLink = `eatoff://oauth-callback?token=${tokenParam}`;
          
          // Android Intent URI - forces app to open without chooser dialog
          const androidIntentUri = `intent://oauth-callback?token=${tokenParam}#Intent;scheme=eatoff;package=com.eatoff.app;end`;
          
          console.log('[Mobile OAuth] Generated token for user:', user.id);
          console.log('[Mobile OAuth] Deep link:', deepLink);
          console.log('[Mobile OAuth] Android Intent URI:', androidIntentUri);
          
          // Detect platform from User-Agent for direct redirect
          const userAgent = req.headers['user-agent'] || '';
          const isAndroid = /android/i.test(userAgent);
          
          console.log('[Mobile OAuth] User-Agent:', userAgent);
          console.log('[Mobile OAuth] Is Android:', isAndroid);
          
          // Direct HTTP 302 redirect - no intermediate page
          if (isAndroid) {
            console.log('[Mobile OAuth] Redirecting to Android Intent URI');
            return res.redirect(androidIntentUri);
          } else {
            console.log('[Mobile OAuth] Redirecting to iOS deep link');
            return res.redirect(deepLink);
          }
        }
        
        return res.redirect("/");
      });
    })(req, res, next);
  });

  // Facebook routes (when credentials are provided)
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    app.get("/api/auth/facebook", 
      passport.authenticate("facebook", { scope: ["email"] })
    );
    app.get("/api/auth/facebook/callback", 
      passport.authenticate("facebook", { failureRedirect: "/login" }),
      (req, res) => res.redirect("/")
    );
  }

  // Apple Sign-In routes (using apple-signin-auth library for token verification)
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    // Apple OAuth initiate - redirect to Apple's authorization page
    app.get("/api/auth/apple", (req, res) => {
      console.log('[Apple OAuth] Starting Apple Sign-In flow...');
      console.log('[Apple OAuth] Mobile flag:', req.query.mobile);
      
      const isMobile = req.query.mobile === 'true';
      
      const isProduction = process.env.NODE_ENV === 'production';
      let baseURL: string;
      
      if (isProduction && process.env.PRODUCTION_DOMAIN) {
        baseURL = `https://${process.env.PRODUCTION_DOMAIN}`;
      } else if (process.env.REPLIT_DOMAINS) {
        baseURL = `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
      } else {
        baseURL = "http://localhost:5000";
      }
      
      const redirectUri = `${baseURL}/api/auth/apple/callback`;
      // Encode mobile flag in state to preserve it across the callback (sessions don't work with form_post)
      const stateData = {
        nonce: crypto.randomBytes(16).toString('hex'),
        mobile: isMobile
      };
      const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');
      
      const authUrl = `https://appleid.apple.com/auth/authorize?` + 
        `client_id=${encodeURIComponent(process.env.APPLE_CLIENT_ID!)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=name%20email` +
        `&response_mode=form_post` +
        `&state=${state}`;
      
      console.log('[Apple OAuth] Redirect URI:', redirectUri);
      console.log('[Apple OAuth] Auth URL:', authUrl);
      console.log('[Apple OAuth] State (mobile encoded):', isMobile);
      
      res.redirect(authUrl);
    });
    
    // Apple OAuth callback - handles form_post response from Apple
    app.post("/api/auth/apple/callback", async (req, res) => {
      console.log('[Apple OAuth] Callback received');
      console.log('[Apple OAuth] Body:', JSON.stringify(req.body, null, 2));
      
      const { code, id_token, state, user: userInfo, error } = req.body;
      
      // Decode mobile flag from state (sessions don't work with Apple's form_post)
      let isMobileOAuth = false;
      try {
        if (state) {
          const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
          isMobileOAuth = stateData.mobile === true;
          console.log('[Apple OAuth] Decoded state:', stateData);
        }
      } catch (e) {
        console.log('[Apple OAuth] Could not decode state, assuming web flow');
      }
      
      console.log('[Apple OAuth] Is mobile OAuth:', isMobileOAuth);
      
      try {
        if (error) {
          console.error('[Apple OAuth] Error from Apple:', error);
          if (isMobileOAuth) {
            return res.redirect(`eatoff://oauth-callback?error=apple_error&details=${encodeURIComponent(error)}`);
          }
          return res.redirect('/login?error=apple_error');
        }
        
        if (!code && !id_token) {
          console.error('[Apple OAuth] No code or id_token received');
          if (isMobileOAuth) {
            return res.redirect('eatoff://oauth-callback?error=no_code');
          }
          return res.redirect('/login?error=no_code');
        }
        
        const isProduction = process.env.NODE_ENV === 'production';
        let baseURL: string;
        
        if (isProduction && process.env.PRODUCTION_DOMAIN) {
          baseURL = `https://${process.env.PRODUCTION_DOMAIN}`;
        } else if (process.env.REPLIT_DOMAINS) {
          baseURL = `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
        } else {
          baseURL = "http://localhost:5000";
        }
        
        const redirectUri = `${baseURL}/api/auth/apple/callback`;
        
        // Process private key - ensure proper PEM format with newlines
        let privateKey = process.env.APPLE_PRIVATE_KEY!;
        
        console.log('[Apple OAuth] Raw key length:', privateKey.length);
        console.log('[Apple OAuth] Raw key has newlines:', privateKey.includes('\n'));
        
        // If the key doesn't have proper newlines, fix it
        if (!privateKey.includes('\n')) {
          // Replace escaped newlines first
          privateKey = privateKey.replace(/\\n/g, '\n');
          
          // If still no newlines, the key might be on one line with spaces
          if (!privateKey.includes('\n')) {
            // Extract the key body (remove headers/footers and extra spaces)
            let keyBody = privateKey
              .replace(/-----BEGIN PRIVATE KEY-----/g, '')
              .replace(/-----END PRIVATE KEY-----/g, '')
              .replace(/\s+/g, '') // Remove all whitespace
              .trim();
            
            // Format as proper PEM with 64-char lines
            const lines = keyBody.match(/.{1,64}/g) || [];
            privateKey = `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
          }
        }
        
        console.log('[Apple OAuth] Processed key - starts with BEGIN:', privateKey.startsWith('-----BEGIN'));
        console.log('[Apple OAuth] Processed key has newlines:', privateKey.includes('\n'));
        console.log('[Apple OAuth] Processed key line count:', privateKey.split('\n').length);
        
        // Generate client secret JWT for Apple
        const clientSecret = AppleSignIn.getClientSecret({
          clientID: process.env.APPLE_CLIENT_ID!,
          teamID: process.env.APPLE_TEAM_ID!,
          privateKey: privateKey,
          keyIdentifier: process.env.APPLE_KEY_ID!,
          expAfter: 15777000 // 6 months
        });
        
        console.log('[Apple OAuth] Generated client secret successfully');
        console.log('[Apple OAuth] Config used:', {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyLength: privateKey.length,
          privateKeyLineCount: privateKey.split('\n').length
        });
        
        // Exchange code for tokens
        console.log('[Apple OAuth] Exchanging authorization code for tokens...');
        console.log('[Apple OAuth] Redirect URI:', redirectUri);
        
        let tokenResponse: any;
        try {
          tokenResponse = await AppleSignIn.getAuthorizationToken(code, {
            clientID: process.env.APPLE_CLIENT_ID!,
            clientSecret: clientSecret,
            redirectUri: redirectUri
          });
          
          console.log('[Apple OAuth] Token response received:', JSON.stringify({
            hasIdToken: !!tokenResponse?.id_token,
            hasAccessToken: !!tokenResponse?.access_token,
            hasRefreshToken: !!tokenResponse?.refresh_token,
            error: tokenResponse?.error || 'none',
            errorDescription: tokenResponse?.error_description || 'none'
          }));
        } catch (tokenError: any) {
          console.error('[Apple OAuth] Token exchange error:', tokenError.message);
          console.error('[Apple OAuth] Token exchange full error:', JSON.stringify(tokenError, null, 2));
          if (isMobileOAuth) {
            return res.redirect(`eatoff://oauth-callback?error=token_exchange_failed&details=${encodeURIComponent(tokenError.message || 'Token exchange failed')}`);
          }
          return res.redirect('/login?error=token_exchange_failed');
        }
        
        if (!tokenResponse || !tokenResponse.id_token) {
          console.error('[Apple OAuth] No id_token in response:', JSON.stringify(tokenResponse, null, 2));
          const errorDetail = tokenResponse?.error_description || tokenResponse?.error || 'Apple did not return id_token';
          if (isMobileOAuth) {
            return res.redirect(`eatoff://oauth-callback?error=no_token&details=${encodeURIComponent(errorDetail)}`);
          }
          return res.redirect('/login?error=no_token');
        }
        
        // Verify the ID token
        const idToken = tokenResponse.id_token;
        console.log('[Apple OAuth] Verifying id_token...');
        
        const appleUser = await AppleSignIn.verifyIdToken(idToken, {
          audience: process.env.APPLE_CLIENT_ID!,
          ignoreExpiration: false
        });
        
        console.log('[Apple OAuth] User verified:', JSON.stringify(appleUser, null, 2));
        
        // Parse user info if provided (only on first sign-in)
        let firstName = null;
        let lastName = null;
        let email = appleUser.email;
        
        if (userInfo) {
          try {
            const parsedUserInfo = typeof userInfo === 'string' ? JSON.parse(userInfo) : userInfo;
            firstName = parsedUserInfo.name?.firstName || null;
            lastName = parsedUserInfo.name?.lastName || null;
            if (parsedUserInfo.email) {
              email = parsedUserInfo.email;
            }
            console.log('[Apple OAuth] User info parsed:', { firstName, lastName, email });
          } catch (e) {
            console.log('[Apple OAuth] Could not parse user info:', e);
          }
        }
        
        // Create/update user in database
        const userData = {
          id: `apple_${appleUser.sub}`,
          email: email || null,
          firstName: firstName,
          lastName: lastName,
          profileImageUrl: null // Apple doesn't provide profile photos
        };
        
        await storage.upsertUser(userData);
        console.log('[Apple OAuth] User upserted:', userData.id);
        
        const user = { ...userData, provider: 'apple' };
        
        // Log in the user
        req.logIn(user, async (err) => {
          if (err) {
            console.error('[Apple OAuth] Login error:', err);
            if (isMobileOAuth) {
              return res.redirect('eatoff://oauth-callback?error=login_failed');
            }
            return res.redirect('/login?error=login_failed');
          }
          
          console.log('[Apple OAuth] Login successful, user:', user.id);
          
          // Check if user has 2FA enabled
          try {
            const customer = user.email ? await storage.getCustomerByEmail(user.email) : null;
            if (customer && customer.twoFactorEnabled) {
              console.log('[Apple OAuth] User has 2FA enabled, redirecting to verification');
              // Generate a pending 2FA token
              const pending2faToken = generate2FAPendingToken(user, customer.id, isMobileOAuth);
              
              if (isMobileOAuth) {
                const userAgent = req.headers['user-agent'] || '';
                const isAndroid = /android/i.test(userAgent);
                const tokenParam = encodeURIComponent(pending2faToken);
                
                if (isAndroid) {
                  return res.redirect(`intent://oauth-callback?requires2fa=true&pending2fa=${tokenParam}#Intent;scheme=eatoff;package=com.eatoff.app;end`);
                } else {
                  return res.redirect(`eatoff://oauth-callback?requires2fa=true&pending2fa=${tokenParam}`);
                }
              }
              
              // Web flow - redirect to 2FA verification page
              return res.redirect(`/verify-2fa?pending2fa=${pending2faToken}`);
            }
          } catch (e) {
            console.error('[Apple OAuth] Error checking 2FA:', e);
          }
          
          if (isMobileOAuth) {
            const mobileToken = generateMobileAuthToken(user);
            const tokenParam = encodeURIComponent(mobileToken);
            
            const userAgent = req.headers['user-agent'] || '';
            const isAndroid = /android/i.test(userAgent);
            
            if (isAndroid) {
              const androidIntentUri = `intent://oauth-callback?token=${tokenParam}#Intent;scheme=eatoff;package=com.eatoff.app;end`;
              console.log('[Apple OAuth] Redirecting to Android Intent');
              return res.redirect(androidIntentUri);
            } else {
              const deepLink = `eatoff://oauth-callback?token=${tokenParam}`;
              console.log('[Apple OAuth] Redirecting to iOS deep link');
              return res.redirect(deepLink);
            }
          }
          
          return res.redirect('/');
        });
        
      } catch (error: any) {
        console.error('[Apple OAuth] Error:', error.message);
        console.error('[Apple OAuth] Stack:', error.stack);
        if (isMobileOAuth) {
          return res.redirect(`eatoff://oauth-callback?error=apple_auth_failed&details=${encodeURIComponent(error.message)}`);
        }
        return res.redirect('/login?error=apple_auth_failed');
      }
    });
  }

  // Logout route
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};
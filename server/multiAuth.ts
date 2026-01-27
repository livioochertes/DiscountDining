import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
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

// Clean expired temporary tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of mobileAuthTokens.entries()) {
    if (data.expiresAt < now) {
      mobileAuthTokens.delete(token);
    }
  }
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

  // Note: Apple and Instagram strategies temporarily disabled for simplified setup

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
      
      req.logIn(user, (err) => {
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
        
        if (isMobileOAuth) {
          // Mobile OAuth flow - generate a one-time token for the app to exchange
          const mobileToken = generateMobileAuthToken(user);
          const tokenParam = encodeURIComponent(mobileToken);
          
          // Standard deep link for iOS and fallback
          const deepLink = `eatoff://oauth-callback?token=${tokenParam}`;
          
          // Android Intent URI - forces app to open without chooser dialog
          // Format: intent://host/path#Intent;scheme=eatoff;package=com.eatoff.app;end
          const androidIntentUri = `intent://oauth-callback?token=${tokenParam}#Intent;scheme=eatoff;package=com.eatoff.app;end`;
          
          console.log('[Mobile OAuth] Generated token for user:', user.id);
          console.log('[Mobile OAuth] Deep link:', deepLink);
          console.log('[Mobile OAuth] Android Intent URI:', androidIntentUri);
          
          // Return HTML page that redirects to deep link
          return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Authentication Successful</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #F5A623 0%, #1A1A1A 100%);
                  color: white;
                  text-align: center;
                  padding: 20px;
                }
                .container { max-width: 400px; }
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
                h1 { font-size: 24px; margin: 0 0 12px 0; font-weight: 600; }
                p { font-size: 16px; opacity: 0.9; margin: 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="checkmark">✓</div>
                <h1>Authentication Successful</h1>
                <p id="status">Redirecting back to EatOff app...</p>
                <a id="openApp" href="${deepLink}" style="display:none; margin-top:20px; padding:12px 24px; background:white; color:#1A1A1A; border-radius:8px; text-decoration:none; font-weight:600;">Open EatOff App</a>
              </div>
              <script>
                console.log('[OAuth Page] Attempting redirect...');
                
                // Detect if Android
                var isAndroid = /android/i.test(navigator.userAgent);
                console.log('[OAuth Page] Is Android:', isAndroid);
                
                if (isAndroid) {
                  // Use Android Intent URI - this bypasses the app chooser dialog
                  console.log('[OAuth Page] Using Android Intent URI');
                  window.location.href = '${androidIntentUri}';
                } else {
                  // iOS and others - use standard deep link
                  console.log('[OAuth Page] Using standard deep link');
                  window.location.href = '${deepLink}';
                }
                
                setTimeout(function() {
                  // If still here after 2 seconds, show manual button
                  document.getElementById('status').textContent = 'Tap below to return to the app';
                  document.getElementById('openApp').style.display = 'inline-block';
                }, 2000);
              </script>
            </body>
            </html>
          `);
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
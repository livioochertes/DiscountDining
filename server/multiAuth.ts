import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import { pool } from "./db";
import ConnectPgSimple from "connect-pg-simple";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
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
      httpOnly: false, // Allow frontend access
      secure: false, // Set to false for development
      maxAge: sessionTtl,
      sameSite: 'lax', // Better for same-origin
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
    const baseURL = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : "http://localhost:5000";
    
    const callbackURL = `${baseURL}/api/auth/google/callback`;
    
    const clientID = "13625494461-c975ns696j2j9ml2afiv56ddec59t52u.apps.googleusercontent.com";
    const clientSecret = "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";
    
    // Reduced OAuth logging for faster startup
    console.log('Google OAuth configured successfully');
    
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
    console.log('Request headers:', req.headers);
    passport.authenticate("google", { 
      scope: ["profile", "email"],
      accessType: 'offline',
      prompt: 'consent'
    })(req, res, next);
  });
  app.get("/api/auth/google/callback", (req, res, next) => {
    console.log('=== GOOGLE CALLBACK ROUTE HIT ===');
    console.log('Query params:', req.query);
    console.log('================================');
    
    passport.authenticate("google", { 
      failureRedirect: "/login?error=oauth_failed" 
    }, (err, user, info) => {
      console.log('=== PASSPORT AUTHENTICATE RESULT ===');
      console.log('Error:', err);
      console.log('User:', JSON.stringify(user, null, 2));
      console.log('Info:', info);
      console.log('====================================');
      
      if (err) {
        console.error('Authentication error:', err);
        return res.redirect("/login?error=auth_error");
      }
      
      if (!user) {
        console.log('No user returned from authentication');
        return res.redirect("/login?error=no_user");
      }
      
      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.redirect("/login?error=login_failed");
        }
        
        console.log('=== LOGIN SUCCESSFUL ===');
        console.log('User logged in:', JSON.stringify(req.user, null, 2));
        console.log('Session ID:', req.sessionID);
        console.log('Is authenticated:', req.isAuthenticated());
        console.log('========================');
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
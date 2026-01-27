import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Register auth-specific routes
// NOTE: /api/auth/user is now handled in userAuth.ts which supports both OAuth and email/password auth
export function registerAuthRoutes(app: Express): void {
  // Additional Replit-specific routes can be added here
  // The main /api/auth/user route is in userAuth.ts
}

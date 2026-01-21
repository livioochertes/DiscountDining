import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { restaurantOwners } from "@shared/schema";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      ownerId?: number;
      owner?: any;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  ownerId?: number;
  owner?: any;
}

// Hash password utility
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password utility
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Authentication middleware for restaurant owners
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const ownerId = req.session?.ownerId;
    
    if (!ownerId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify owner exists and is active
    const [owner] = await db
      .select()
      .from(restaurantOwners)
      .where(eq(restaurantOwners.id, ownerId));

    if (!owner || !owner.isActive) {
      req.session = null;
      return res.status(401).json({ message: "Account not found or inactive" });
    }

    req.ownerId = ownerId;
    req.owner = owner;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Optional authentication middleware (doesn't reject if not authenticated)
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const ownerId = req.session?.ownerId;
    
    if (ownerId) {
      const [owner] = await db
        .select()
        .from(restaurantOwners)
        .where(eq(restaurantOwners.id, ownerId));

      if (owner && owner.isActive) {
        req.ownerId = ownerId;
        req.owner = owner;
      }
    }
    
    next();
  } catch (error) {
    console.error("Optional auth error:", error);
    next();
  }
}

// Session configuration for restaurant portal
declare module "express-session" {
  interface SessionData {
    ownerId?: number;
  }
}
import { Express, Request, Response } from "express";
import { db } from "./db";
import { chefProfiles, chefFollows, customers, restaurants, menuItems, insertChefProfileSchema } from "@shared/schema";
import { eq, desc, sql, and, inArray } from "drizzle-orm";

interface AuthenticatedRequest extends Request {
  ownerId?: number;
}

const optionalAuth = async (req: Request, res: Response, next: any) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    const user = req.user as any;
    const userIdString = String(user.id || user.customerId || '');
    if (userIdString) {
      (req as any).ownerId = parseInt(userIdString) || userIdString;
    }
  } else {
    const sessionOwnerId = (req.session as any)?.ownerId;
    if (sessionOwnerId) {
      (req as any).ownerId = parseInt(sessionOwnerId) || sessionOwnerId;
    }
  }
  return next();
};

const customerAuth = async (req: Request, res: Response, next: any) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    const user = req.user as any;
    const userIdString = String(user.id || user.customerId || '');
    if (userIdString) {
      (req as any).ownerId = parseInt(userIdString) || userIdString;
      return next();
    }
  }
  
  const sessionOwnerId = (req.session as any)?.ownerId;
  if (sessionOwnerId) {
    (req as any).ownerId = parseInt(sessionOwnerId) || sessionOwnerId;
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};

export function registerChefProfileRoutes(app: Express) {
  
  app.get("/api/chef-profiles", async (req: Request, res: Response) => {
    try {
      const { search, restaurantId, featured, limit = "20", offset = "0" } = req.query;

      let query = db
        .select({
          profile: chefProfiles,
          restaurant: {
            id: restaurants.id,
            name: restaurants.name,
            address: restaurants.address,
            imageUrl: restaurants.imageUrl,
          }
        })
        .from(chefProfiles)
        .leftJoin(restaurants, eq(chefProfiles.restaurantId, restaurants.id))
        .where(eq(chefProfiles.isPublic, true))
        .orderBy(desc(chefProfiles.followersCount))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      const profiles = await query;

      let filtered = profiles;
      
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filtered = filtered.filter(p => 
          p.profile.chefName.toLowerCase().includes(searchLower) ||
          p.profile.bio?.toLowerCase().includes(searchLower) ||
          p.profile.title?.toLowerCase().includes(searchLower)
        );
      }

      if (restaurantId) {
        const restId = parseInt(restaurantId as string);
        filtered = filtered.filter(p => p.profile.restaurantId === restId);
      }

      if (featured === 'true') {
        filtered = filtered.filter(p => p.profile.isFeatured);
      }

      res.json(filtered);
    } catch (error) {
      console.error("Error fetching chef profiles:", error);
      res.status(500).json({ message: "Failed to fetch chef profiles" });
    }
  });

  app.get("/api/chef-profiles/featured", async (req: Request, res: Response) => {
    try {
      const { limit = "6" } = req.query;

      const profiles = await db
        .select({
          profile: chefProfiles,
          restaurant: {
            id: restaurants.id,
            name: restaurants.name,
            imageUrl: restaurants.imageUrl,
          }
        })
        .from(chefProfiles)
        .leftJoin(restaurants, eq(chefProfiles.restaurantId, restaurants.id))
        .where(and(
          eq(chefProfiles.isPublic, true),
          eq(chefProfiles.isFeatured, true)
        ))
        .orderBy(desc(chefProfiles.followersCount))
        .limit(parseInt(limit as string));

      res.json(profiles);
    } catch (error) {
      console.error("Error fetching featured chefs:", error);
      res.status(500).json({ message: "Failed to fetch featured chefs" });
    }
  });

  app.get("/api/chef-profiles/:id", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const profileId = parseInt(id);

      const [result] = await db
        .select({
          profile: chefProfiles,
          restaurant: {
            id: restaurants.id,
            name: restaurants.name,
            address: restaurants.address,
            imageUrl: restaurants.imageUrl,
            cuisineType: restaurants.cuisineType,
          }
        })
        .from(chefProfiles)
        .leftJoin(restaurants, eq(chefProfiles.restaurantId, restaurants.id))
        .where(eq(chefProfiles.id, profileId));

      if (!result) {
        return res.status(404).json({ message: "Chef profile not found" });
      }

      if (!result.profile.isPublic) {
        return res.status(403).json({ message: "This profile is private" });
      }

      const signatureDishes = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.signatureChefId, profileId))
        .orderBy(desc(menuItems.createdAt))
        .limit(20);

      let isFollowing = false;
      if (req.ownerId) {
        const [follow] = await db
          .select()
          .from(chefFollows)
          .where(and(
            eq(chefFollows.followerId, req.ownerId as number),
            eq(chefFollows.chefId, profileId)
          ));
        isFollowing = !!follow;
      }

      res.json({
        ...result,
        signatureDishes,
        isFollowing,
      });
    } catch (error) {
      console.error("Error fetching chef profile:", error);
      res.status(500).json({ message: "Failed to fetch chef profile" });
    }
  });

  app.post("/api/chef-profiles/:id/follow", customerAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const chefId = parseInt(id);
      const followerId = req.ownerId as number;

      const [existing] = await db
        .select()
        .from(chefFollows)
        .where(and(
          eq(chefFollows.followerId, followerId),
          eq(chefFollows.chefId, chefId)
        ));

      if (existing) {
        return res.status(400).json({ message: "Already following this chef" });
      }

      await db.insert(chefFollows).values({
        followerId,
        chefId,
      });

      await db
        .update(chefProfiles)
        .set({ followersCount: sql`${chefProfiles.followersCount} + 1` })
        .where(eq(chefProfiles.id, chefId));

      res.json({ message: "Now following chef" });
    } catch (error) {
      console.error("Error following chef:", error);
      res.status(500).json({ message: "Failed to follow chef" });
    }
  });

  app.delete("/api/chef-profiles/:id/follow", customerAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const chefId = parseInt(id);
      const followerId = req.ownerId as number;

      await db
        .delete(chefFollows)
        .where(and(
          eq(chefFollows.followerId, followerId),
          eq(chefFollows.chefId, chefId)
        ));

      await db
        .update(chefProfiles)
        .set({ followersCount: sql`GREATEST(${chefProfiles.followersCount} - 1, 0)` })
        .where(eq(chefProfiles.id, chefId));

      res.json({ message: "Unfollowed chef" });
    } catch (error) {
      console.error("Error unfollowing chef:", error);
      res.status(500).json({ message: "Failed to unfollow chef" });
    }
  });

  app.get("/api/chef-profiles/:id/followers", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const chefId = parseInt(id);
      const { limit = "20", offset = "0" } = req.query;

      const followers = await db
        .select({
          follow: chefFollows,
          customer: {
            id: customers.id,
            name: customers.name,
            profilePicture: customers.profilePicture,
          }
        })
        .from(chefFollows)
        .leftJoin(customers, eq(chefFollows.followerId, customers.id))
        .where(eq(chefFollows.chefId, chefId))
        .orderBy(desc(chefFollows.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      res.json(followers);
    } catch (error) {
      console.error("Error fetching chef followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });
}

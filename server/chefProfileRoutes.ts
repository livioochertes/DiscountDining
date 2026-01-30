import { Express, Request, Response } from "express";
import { db } from "./db";
import { chefProfiles, chefFollows, customers, recipes, insertChefProfileSchema } from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  ownerId?: number;
}

const chefAuth = async (req: Request, res: Response, next: any) => {
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

export function registerChefProfileRoutes(app: Express) {
  
  app.get("/api/chef-profiles", async (req: Request, res: Response) => {
    try {
      const { search, specialty, cuisine, limit = "20", offset = "0" } = req.query;

      const profiles = await db
        .select({
          profile: chefProfiles,
          customer: {
            id: customers.id,
            name: customers.name,
            email: customers.email,
            profilePicture: customers.profilePicture,
          }
        })
        .from(chefProfiles)
        .leftJoin(customers, eq(chefProfiles.customerId, customers.id))
        .where(eq(chefProfiles.isPublic, true))
        .orderBy(desc(chefProfiles.followersCount))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      let filtered = profiles;
      
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filtered = filtered.filter(p => 
          p.profile.chefName.toLowerCase().includes(searchLower) ||
          p.profile.bio?.toLowerCase().includes(searchLower)
        );
      }

      res.json(filtered);
    } catch (error) {
      console.error("Error fetching chef profiles:", error);
      res.status(500).json({ message: "Failed to fetch chef profiles" });
    }
  });

  app.get("/api/chef-profiles/:id", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const profileId = parseInt(id);

      const [profile] = await db
        .select({
          profile: chefProfiles,
          customer: {
            id: customers.id,
            name: customers.name,
            email: customers.email,
            profilePicture: customers.profilePicture,
          }
        })
        .from(chefProfiles)
        .leftJoin(customers, eq(chefProfiles.customerId, customers.id))
        .where(eq(chefProfiles.id, profileId));

      if (!profile) {
        return res.status(404).json({ message: "Chef profile not found" });
      }

      const chefRecipes = await db
        .select()
        .from(recipes)
        .where(and(
          eq(recipes.authorId, profile.profile.customerId),
          eq(recipes.isPublished, true)
        ))
        .orderBy(desc(recipes.createdAt))
        .limit(10);

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
        ...profile,
        recipes: chefRecipes,
        isFollowing,
      });
    } catch (error) {
      console.error("Error fetching chef profile:", error);
      res.status(500).json({ message: "Failed to fetch chef profile" });
    }
  });

  app.get("/api/chef-profiles/by-customer/:customerId", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { customerId } = req.params;
      const custId = parseInt(customerId);

      const [profile] = await db
        .select()
        .from(chefProfiles)
        .where(eq(chefProfiles.customerId, custId));

      if (!profile) {
        return res.status(404).json({ message: "Chef profile not found" });
      }

      res.json(profile);
    } catch (error) {
      console.error("Error fetching chef profile by customer:", error);
      res.status(500).json({ message: "Failed to fetch chef profile" });
    }
  });

  app.get("/api/my-chef-profile", chefAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = req.ownerId as number;

      const [profile] = await db
        .select()
        .from(chefProfiles)
        .where(eq(chefProfiles.customerId, customerId));

      if (!profile) {
        return res.status(404).json({ message: "You don't have a chef profile yet" });
      }

      res.json(profile);
    } catch (error) {
      console.error("Error fetching my chef profile:", error);
      res.status(500).json({ message: "Failed to fetch chef profile" });
    }
  });

  app.post("/api/chef-profiles", chefAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = req.ownerId as number;

      const [existing] = await db
        .select()
        .from(chefProfiles)
        .where(eq(chefProfiles.customerId, customerId));

      if (existing) {
        return res.status(400).json({ message: "You already have a chef profile" });
      }

      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId));

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const profileData = {
        customerId,
        chefName: req.body.chefName || customer.name,
        bio: req.body.bio || null,
        profileImage: req.body.profileImage || customer.profilePicture || null,
        coverImage: req.body.coverImage || null,
        specialties: req.body.specialties || [],
        cuisineExpertise: req.body.cuisineExpertise || [],
        cookingStyles: req.body.cookingStyles || [],
        experienceLevel: req.body.experienceLevel || 'beginner',
        yearsOfExperience: req.body.yearsOfExperience || 0,
        certifications: req.body.certifications || [],
        website: req.body.website || null,
        instagram: req.body.instagram || null,
        youtube: req.body.youtube || null,
        tiktok: req.body.tiktok || null,
        favoriteRecipeIds: req.body.favoriteRecipeIds || [],
        isPublic: req.body.isPublic !== false,
        acceptsCollaborations: req.body.acceptsCollaborations || false,
      };

      const [profile] = await db
        .insert(chefProfiles)
        .values(profileData)
        .returning();

      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating chef profile:", error);
      res.status(500).json({ message: "Failed to create chef profile" });
    }
  });

  app.put("/api/chef-profiles/:id", chefAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const profileId = parseInt(id);
      const customerId = req.ownerId as number;

      const [existing] = await db
        .select()
        .from(chefProfiles)
        .where(eq(chefProfiles.id, profileId));

      if (!existing) {
        return res.status(404).json({ message: "Chef profile not found" });
      }

      if (existing.customerId !== customerId) {
        return res.status(403).json({ message: "Not authorized to edit this profile" });
      }

      const updateData: any = { updatedAt: new Date() };

      if (req.body.chefName !== undefined) updateData.chefName = req.body.chefName;
      if (req.body.bio !== undefined) updateData.bio = req.body.bio;
      if (req.body.profileImage !== undefined) updateData.profileImage = req.body.profileImage;
      if (req.body.coverImage !== undefined) updateData.coverImage = req.body.coverImage;
      if (req.body.specialties !== undefined) updateData.specialties = req.body.specialties;
      if (req.body.cuisineExpertise !== undefined) updateData.cuisineExpertise = req.body.cuisineExpertise;
      if (req.body.cookingStyles !== undefined) updateData.cookingStyles = req.body.cookingStyles;
      if (req.body.experienceLevel !== undefined) updateData.experienceLevel = req.body.experienceLevel;
      if (req.body.yearsOfExperience !== undefined) updateData.yearsOfExperience = req.body.yearsOfExperience;
      if (req.body.certifications !== undefined) updateData.certifications = req.body.certifications;
      if (req.body.website !== undefined) updateData.website = req.body.website;
      if (req.body.instagram !== undefined) updateData.instagram = req.body.instagram;
      if (req.body.youtube !== undefined) updateData.youtube = req.body.youtube;
      if (req.body.tiktok !== undefined) updateData.tiktok = req.body.tiktok;
      if (req.body.favoriteRecipeIds !== undefined) updateData.favoriteRecipeIds = req.body.favoriteRecipeIds;
      if (req.body.isPublic !== undefined) updateData.isPublic = req.body.isPublic;
      if (req.body.acceptsCollaborations !== undefined) updateData.acceptsCollaborations = req.body.acceptsCollaborations;

      const [updated] = await db
        .update(chefProfiles)
        .set(updateData)
        .where(eq(chefProfiles.id, profileId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating chef profile:", error);
      res.status(500).json({ message: "Failed to update chef profile" });
    }
  });

  app.post("/api/chef-profiles/:id/follow", chefAuth, async (req: AuthenticatedRequest, res: Response) => {
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

  app.delete("/api/chef-profiles/:id/follow", chefAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const chefId = parseInt(id);
      const followerId = req.ownerId as number;

      const result = await db
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

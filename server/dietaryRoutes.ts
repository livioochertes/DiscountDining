import { Express, Request, Response, RequestHandler } from "express";
import { dietaryEngine } from "./dietaryRecommendationEngine";
import { insertUserDietaryProfileSchema, insertUserMealHistorySchema } from "@shared/schema";
import { z } from "zod";
import { dietaryStorage } from "./dietaryStorage";
import { isAuthenticated } from "./multiAuth";
import { storage } from "./storage";

interface AuthenticatedRequest extends Request {
  ownerId?: number;
  owner?: any;
}

// Enhanced authentication middleware that maps user ID properly for dietary routes
const dietaryAuth: RequestHandler = async (req, res, next) => {
  // First check for mobile token auth (set by global middleware)
  const mobileUser = (req as any).mobileUser;
  if (mobileUser) {
    const userIdString = String(mobileUser.id || mobileUser.customerId || '');
    if (userIdString) {
      (req as any).ownerId = userIdString;
      return next();
    }
  }
  
  // Then try the standard Passport authentication
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    const user = req.user as any;
    const userIdString = String(user.id || user.customerId || '');
    if (userIdString) {
      (req as any).ownerId = userIdString;
      return next();
    }
  }
  
  // Fallback: Check session directly (since Passport deserialization isn't working for dietary routes)
  const sessionOwnerId = (req.session as any)?.ownerId;
  if (sessionOwnerId) {
    const userIdString = String(sessionOwnerId);
    (req as any).ownerId = userIdString;
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};

export function registerDietaryRoutes(app: Express) {
  // Get user's dietary profile
  app.get("/api/dietary/profile", dietaryAuth, async (req: any, res: Response) => {
    try {
      const userId = req.ownerId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const profile = await dietaryStorage.getUserDietaryProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching dietary profile:", error);
      res.status(500).json({ message: "Failed to fetch dietary profile" });
    }
  });

  // Create or update user's dietary profile
  app.post("/api/dietary/profile", dietaryAuth, async (req: any, res: Response) => {
    try {
      const userId = req.ownerId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const validatedData = insertUserDietaryProfileSchema.parse({
        ...req.body,
        userId: userId
      });

      // Check if profile exists
      const existingProfile = await dietaryStorage.getUserDietaryProfile(userId);
      
      if (existingProfile) {
        await dietaryStorage.updateUserDietaryProfile(userId, validatedData);
      } else {
        await dietaryStorage.createUserDietaryProfile(validatedData);
      }

      res.json({ message: "Dietary profile saved successfully" });
    } catch (error) {
      console.error("Error saving dietary profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save dietary profile" });
    }
  });

  // Generate personalized recommendations
  app.post("/api/dietary/recommendations", dietaryAuth, async (req: any, res: Response) => {
    try {
      const userId = req.ownerId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const { mealType, maxRecommendations = 10, includeRestaurants = true, includeMenuItems = true } = req.body;

      const recommendations = await dietaryEngine.generatePersonalizedRecommendations({
        userId: userId,
        mealType,
        maxRecommendations,
        includeRestaurants,
        includeMenuItems
      });

      res.json({ recommendations });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate recommendations";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Get stored recommendations (auto-generates if none exist)
  app.get("/api/dietary/recommendations", dietaryAuth, async (req: any, res: Response) => {
    try {
      const userId = req.ownerId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      let recommendations = await dietaryEngine.getStoredRecommendations(userId, limit);

      // Auto-generate if no stored recommendations exist
      if (!recommendations || recommendations.length === 0) {
        try {
          console.log(`[AI Recommendations] No stored recommendations for user ${userId}, auto-generating...`);
          const generated = await dietaryEngine.generatePersonalizedRecommendations({
            userId,
            maxRecommendations: 10,
            includeRestaurants: true,
            includeMenuItems: true
          });
          recommendations = generated || [];
          console.log(`[AI Recommendations] Generated ${recommendations.length} recommendations for user ${userId}`);
        } catch (genError) {
          console.error("[AI Recommendations] Auto-generation failed:", genError);
          recommendations = [];
        }
      }

      // Ensure recommendations is always an array
      const validRecommendations = Array.isArray(recommendations) ? recommendations : [];

      // Populate restaurant and menu item data for each recommendation
      const populatedRecommendations = await Promise.all(
        validRecommendations.map(async (rec: any) => {
          if (rec.type === 'restaurant') {
            // Fetch restaurant data
            try {
              const restaurant = await storage.getRestaurantById(rec.targetId);
              return { ...rec, restaurant };
            } catch (error) {
              console.warn(`Failed to fetch restaurant ${rec.targetId}:`, error);
              return rec;
            }
          } else if (rec.type === 'menu_item') {
            // Fetch menu item data and its restaurant
            try {
              const menuItem = await storage.getMenuItemById(rec.targetId);
              if (menuItem && menuItem.restaurantId) {
                const restaurant = await storage.getRestaurantById(menuItem.restaurantId);
                return { ...rec, menuItem, restaurant };
              }
              return rec;
            } catch (error) {
              console.warn(`Failed to fetch menu item ${rec.targetId}:`, error);
              return rec;
            }
          }
          return rec;
        })
      );

      res.json({ recommendations: populatedRecommendations });
    } catch (error) {
      console.error("Error fetching stored recommendations:", error);
      // Return empty array instead of error when no recommendations exist
      res.json({ recommendations: [] });
    }
  });

  app.get("/api/dietary/restaurant/:restaurantId/matching-items", dietaryAuth, async (req: any, res: Response) => {
    try {
      const userId = req.ownerId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const restaurantId = parseInt(req.params.restaurantId);
      if (!restaurantId) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }

      const profile = await dietaryEngine.getUserDietaryProfile(userId);
      const allItems = await storage.getMenuItemsByRestaurant(restaurantId);
      const availableItems = allItems.filter((item: any) => item.isAvailable !== false);

      if (!profile) {
        return res.json({ items: availableItems.slice(0, 6) });
      }

      const scored = availableItems.map((item: any) => {
        let score = 0;
        const tags = (item.dietaryTags || []).map((t: string) => t.toLowerCase());
        const allergens = (item.allergens || []).map((a: string) => a.toLowerCase());
        const userAllergies = (profile.allergies || []).map((a: string) => a.toLowerCase());

        if (userAllergies.some((a: string) => allergens.includes(a))) {
          return { ...item, matchScore: -1 };
        }

        const dietPrefs = profile.dietaryPreferences || [];
        if (dietPrefs.length > 0) {
          for (const dp of dietPrefs) {
            const dt = dp.toLowerCase();
            if (tags.includes(dt) || tags.some((t: string) => t.includes(dt))) { score += 3; break; }
          }
        }

        if (profile.calorieTarget && item.calories) {
          const cal = parseInt(item.calories);
          const target = profile.calorieTarget / 3;
          const diff = Math.abs(cal - target) / target;
          if (diff < 0.2) score += 2;
          else if (diff < 0.4) score += 1;
        }

        const prefCuisines = (profile.preferredCuisines || []).map((c: string) => c.toLowerCase());
        const category = (item.category || '').toLowerCase();
        if (prefCuisines.some((c: string) => category.includes(c))) score += 1;

        if (tags.includes('healthy') || tags.includes('light') || tags.includes('fresh')) score += 1;

        return { ...item, matchScore: score };
      });

      const matching = scored
        .filter((item: any) => item.matchScore >= 0)
        .sort((a: any, b: any) => b.matchScore - a.matchScore)
        .slice(0, 6);

      res.json({ items: matching });
    } catch (error) {
      console.error("Error fetching matching menu items:", error);
      res.json({ items: [] });
    }
  });

  // Record meal history
  app.post("/api/dietary/meal-history", dietaryAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.ownerId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const validatedData = insertUserMealHistorySchema.parse({
        ...req.body,
        userId: req.ownerId.toString(),
        mealDate: new Date()
      });

      await dietaryEngine.recordMealHistory(validatedData);
      res.json({ message: "Meal history recorded successfully" });
    } catch (error) {
      console.error("Error recording meal history:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid meal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to record meal history" });
    }
  });

  // Calculate BMI and get recommendations
  app.post("/api/dietary/bmi", async (req: Request, res: Response) => {
    try {
      const { weight, height } = req.body;

      if (!weight || !height || weight <= 0 || height <= 0) {
        return res.status(400).json({ message: "Valid weight and height are required" });
      }

      const result = await dietaryEngine.calculateBMI(weight, height);
      res.json(result);
    } catch (error) {
      console.error("Error calculating BMI:", error);
      res.status(500).json({ message: "Failed to calculate BMI" });
    }
  });

  // Get personalized restaurant recommendations with dietary filters
  app.get("/api/dietary/restaurant-recommendations", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.ownerId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const mealType = req.query.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack' | undefined;
      const recommendations = await dietaryEngine.generatePersonalizedRecommendations({
        userId: req.ownerId.toString(),
        mealType,
        maxRecommendations: 5,
        includeRestaurants: true,
        includeMenuItems: false
      });

      res.json({ recommendations: recommendations.filter(r => r.type === 'restaurant') });
    } catch (error) {
      console.error("Error generating restaurant recommendations:", error);
      res.status(500).json({ message: "Failed to generate restaurant recommendations" });
    }
  });

  // Get personalized menu item recommendations
  app.get("/api/dietary/menu-recommendations", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.ownerId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const restaurantId = req.query.restaurantId as string;
      const mealType = req.query.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack' | undefined;
      let recommendations = await dietaryEngine.generatePersonalizedRecommendations({
        userId: req.ownerId.toString(),
        mealType,
        maxRecommendations: 10,
        includeRestaurants: false,
        includeMenuItems: true
      });

      // Filter by restaurant if specified
      if (restaurantId) {
        recommendations = recommendations.filter(r => r.type === 'menu_item');
      }

      res.json({ recommendations: recommendations.filter(r => r.type === 'menu_item') });
    } catch (error) {
      console.error("Error generating menu recommendations:", error);
      res.status(500).json({ message: "Failed to generate menu recommendations" });
    }
  });
}
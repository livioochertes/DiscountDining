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
  // First try the standard Passport authentication
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

  // Get stored recommendations
  app.get("/api/dietary/recommendations", dietaryAuth, async (req: any, res: Response) => {
    try {
      const userId = req.ownerId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const recommendations = await dietaryEngine.getStoredRecommendations(userId, limit);

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
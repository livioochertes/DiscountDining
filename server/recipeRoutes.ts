import { Express, Request, Response } from "express";
import { db } from "./db";
import { recipes, recipeLikes, recipeSaves, recipeComments, customers, restaurants, insertRecipeSchema, insertRecipeCommentSchema } from "@shared/schema";
import { eq, desc, sql, and, ilike, or, inArray } from "drizzle-orm";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  ownerId?: number;
}

const recipeAuth = async (req: Request, res: Response, next: any) => {
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

export function registerRecipeRoutes(app: Express) {
  // Get all recipes with filters
  app.get("/api/recipes", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { 
        cuisine, 
        category, 
        difficulty, 
        search, 
        restaurantId,
        authorId,
        dietary,
        featured,
        limit = "20",
        offset = "0"
      } = req.query;

      let query = db
        .select({
          recipe: recipes,
          author: {
            id: customers.id,
            name: customers.name,
            profilePicture: customers.profilePicture,
          },
          restaurant: {
            id: restaurants.id,
            name: restaurants.name,
            cuisine: restaurants.cuisine,
          }
        })
        .from(recipes)
        .leftJoin(customers, eq(recipes.authorId, customers.id))
        .leftJoin(restaurants, eq(recipes.restaurantId, restaurants.id))
        .where(eq(recipes.isPublished, true))
        .orderBy(desc(recipes.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      const allRecipes = await query;

      // Filter in memory for simplicity
      let filtered = allRecipes;
      
      if (cuisine) {
        filtered = filtered.filter(r => r.recipe.cuisine === cuisine);
      }
      if (category) {
        filtered = filtered.filter(r => r.recipe.category === category);
      }
      if (difficulty) {
        filtered = filtered.filter(r => r.recipe.difficulty === difficulty);
      }
      if (restaurantId) {
        filtered = filtered.filter(r => r.recipe.restaurantId === parseInt(restaurantId as string));
      }
      if (authorId) {
        filtered = filtered.filter(r => r.recipe.authorId === parseInt(authorId as string));
      }
      if (featured === 'true') {
        filtered = filtered.filter(r => r.recipe.isFeatured);
      }
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filtered = filtered.filter(r => 
          r.recipe.title.toLowerCase().includes(searchLower) ||
          (r.recipe.description?.toLowerCase().includes(searchLower))
        );
      }
      if (dietary) {
        const tags = (dietary as string).split(',');
        filtered = filtered.filter(r => 
          r.recipe.dietaryTags?.some(tag => tags.includes(tag))
        );
      }

      // Check if current user has liked/saved each recipe
      const userId = req.ownerId;
      let userLikes: number[] = [];
      let userSaves: number[] = [];

      if (userId) {
        const recipeIds = filtered.map(r => r.recipe.id);
        if (recipeIds.length > 0) {
          const likes = await db.select({ recipeId: recipeLikes.recipeId })
            .from(recipeLikes)
            .where(and(
              eq(recipeLikes.userId, userId as number),
              inArray(recipeLikes.recipeId, recipeIds)
            ));
          userLikes = likes.map(l => l.recipeId);

          const saves = await db.select({ recipeId: recipeSaves.recipeId })
            .from(recipeSaves)
            .where(and(
              eq(recipeSaves.userId, userId as number),
              inArray(recipeSaves.recipeId, recipeIds)
            ));
          userSaves = saves.map(s => s.recipeId);
        }
      }

      const result = filtered.map(r => ({
        ...r.recipe,
        author: r.author,
        restaurant: r.restaurant,
        isLiked: userLikes.includes(r.recipe.id),
        isSaved: userSaves.includes(r.recipe.id),
      }));

      res.json(result);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  // Get single recipe by ID
  app.get("/api/recipes/:id", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await db
        .select({
          recipe: recipes,
          author: {
            id: customers.id,
            name: customers.name,
            profilePicture: customers.profilePicture,
          },
          restaurant: {
            id: restaurants.id,
            name: restaurants.name,
            cuisine: restaurants.cuisine,
            imageUrl: restaurants.imageUrl,
          }
        })
        .from(recipes)
        .leftJoin(customers, eq(recipes.authorId, customers.id))
        .leftJoin(restaurants, eq(recipes.restaurantId, restaurants.id))
        .where(eq(recipes.id, parseInt(id)))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      // Increment view count
      await db.update(recipes)
        .set({ viewsCount: sql`${recipes.viewsCount} + 1` })
        .where(eq(recipes.id, parseInt(id)));

      // Check user interactions
      const userId = req.ownerId;
      let isLiked = false;
      let isSaved = false;

      if (userId) {
        const like = await db.select().from(recipeLikes)
          .where(and(eq(recipeLikes.recipeId, parseInt(id)), eq(recipeLikes.userId, userId as number)))
          .limit(1);
        isLiked = like.length > 0;

        const save = await db.select().from(recipeSaves)
          .where(and(eq(recipeSaves.recipeId, parseInt(id)), eq(recipeSaves.userId, userId as number)))
          .limit(1);
        isSaved = save.length > 0;
      }

      // Get comments
      const comments = await db
        .select({
          comment: recipeComments,
          user: {
            id: customers.id,
            name: customers.name,
            profilePicture: customers.profilePicture,
          }
        })
        .from(recipeComments)
        .leftJoin(customers, eq(recipeComments.userId, customers.id))
        .where(eq(recipeComments.recipeId, parseInt(id)))
        .orderBy(desc(recipeComments.createdAt));

      res.json({
        ...result[0].recipe,
        author: result[0].author,
        restaurant: result[0].restaurant,
        isLiked,
        isSaved,
        comments: comments.map(c => ({
          ...c.comment,
          user: c.user,
        })),
      });
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  // Create a new recipe
  app.post("/api/recipes", recipeAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.ownerId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validatedData = insertRecipeSchema.parse({
        ...req.body,
        authorId: userId,
      });

      const [newRecipe] = await db.insert(recipes).values(validatedData).returning();
      
      res.status(201).json(newRecipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid recipe data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  // Update a recipe
  app.patch("/api/recipes/:id", recipeAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.ownerId;

      // Check ownership
      const existing = await db.select().from(recipes).where(eq(recipes.id, parseInt(id))).limit(1);
      if (existing.length === 0) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      if (existing[0].authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this recipe" });
      }

      const [updated] = await db.update(recipes)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(recipes.id, parseInt(id)))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating recipe:", error);
      res.status(500).json({ message: "Failed to update recipe" });
    }
  });

  // Delete a recipe
  app.delete("/api/recipes/:id", recipeAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.ownerId;

      // Check ownership
      const existing = await db.select().from(recipes).where(eq(recipes.id, parseInt(id))).limit(1);
      if (existing.length === 0) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      if (existing[0].authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this recipe" });
      }

      // Delete related data
      await db.delete(recipeLikes).where(eq(recipeLikes.recipeId, parseInt(id)));
      await db.delete(recipeSaves).where(eq(recipeSaves.recipeId, parseInt(id)));
      await db.delete(recipeComments).where(eq(recipeComments.recipeId, parseInt(id)));
      await db.delete(recipes).where(eq(recipes.id, parseInt(id)));

      res.json({ message: "Recipe deleted successfully" });
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // Like/Unlike a recipe
  app.post("/api/recipes/:id/like", recipeAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.ownerId as number;

      const existing = await db.select().from(recipeLikes)
        .where(and(eq(recipeLikes.recipeId, parseInt(id)), eq(recipeLikes.userId, userId)))
        .limit(1);

      if (existing.length > 0) {
        // Unlike
        await db.delete(recipeLikes)
          .where(and(eq(recipeLikes.recipeId, parseInt(id)), eq(recipeLikes.userId, userId)));
        await db.update(recipes)
          .set({ likesCount: sql`${recipes.likesCount} - 1` })
          .where(eq(recipes.id, parseInt(id)));
        res.json({ liked: false });
      } else {
        // Like
        await db.insert(recipeLikes).values({ recipeId: parseInt(id), userId });
        await db.update(recipes)
          .set({ likesCount: sql`${recipes.likesCount} + 1` })
          .where(eq(recipes.id, parseInt(id)));
        res.json({ liked: true });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Save/Unsave a recipe
  app.post("/api/recipes/:id/save", recipeAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.ownerId as number;

      const existing = await db.select().from(recipeSaves)
        .where(and(eq(recipeSaves.recipeId, parseInt(id)), eq(recipeSaves.userId, userId)))
        .limit(1);

      if (existing.length > 0) {
        // Unsave
        await db.delete(recipeSaves)
          .where(and(eq(recipeSaves.recipeId, parseInt(id)), eq(recipeSaves.userId, userId)));
        await db.update(recipes)
          .set({ savesCount: sql`${recipes.savesCount} - 1` })
          .where(eq(recipes.id, parseInt(id)));
        res.json({ saved: false });
      } else {
        // Save
        await db.insert(recipeSaves).values({ recipeId: parseInt(id), userId });
        await db.update(recipes)
          .set({ savesCount: sql`${recipes.savesCount} + 1` })
          .where(eq(recipes.id, parseInt(id)));
        res.json({ saved: true });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      res.status(500).json({ message: "Failed to toggle save" });
    }
  });

  // Add a comment
  app.post("/api/recipes/:id/comments", recipeAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.ownerId as number;

      const validatedData = insertRecipeCommentSchema.parse({
        recipeId: parseInt(id),
        userId,
        content: req.body.content,
        parentCommentId: req.body.parentCommentId,
      });

      const [comment] = await db.insert(recipeComments).values(validatedData).returning();

      await db.update(recipes)
        .set({ commentsCount: sql`${recipes.commentsCount} + 1` })
        .where(eq(recipes.id, parseInt(id)));

      // Get user info
      const user = await db.select({
        id: customers.id,
        name: customers.name,
        profilePicture: customers.profilePicture,
      }).from(customers).where(eq(customers.id, userId)).limit(1);

      res.status(201).json({
        ...comment,
        user: user[0],
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Get user's saved recipes
  app.get("/api/recipes/saved/list", recipeAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.ownerId as number;

      const saved = await db
        .select({
          recipe: recipes,
          author: {
            id: customers.id,
            name: customers.name,
          }
        })
        .from(recipeSaves)
        .innerJoin(recipes, eq(recipeSaves.recipeId, recipes.id))
        .leftJoin(customers, eq(recipes.authorId, customers.id))
        .where(eq(recipeSaves.userId, userId))
        .orderBy(desc(recipeSaves.createdAt));

      res.json(saved.map(s => ({
        ...s.recipe,
        author: s.author,
        isLiked: false,
        isSaved: true,
      })));
    } catch (error) {
      console.error("Error fetching saved recipes:", error);
      res.status(500).json({ message: "Failed to fetch saved recipes" });
    }
  });

  // Get user's own recipes
  app.get("/api/recipes/my/list", recipeAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.ownerId as number;

      const myRecipes = await db
        .select()
        .from(recipes)
        .where(eq(recipes.authorId, userId))
        .orderBy(desc(recipes.createdAt));

      res.json(myRecipes);
    } catch (error) {
      console.error("Error fetching my recipes:", error);
      res.status(500).json({ message: "Failed to fetch my recipes" });
    }
  });
}

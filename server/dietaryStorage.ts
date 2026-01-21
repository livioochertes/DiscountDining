import { db } from "./db";
import { userDietaryProfiles, userMealHistory, personalizedRecommendations } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

interface DietaryProfile {
  userId: string;
  age?: number | null;
  height?: number | null;
  weight?: string | null;
  gender?: string | null;
  activityLevel?: string | null;
  healthGoal?: string | null;
  targetWeight?: string | null;
  dietaryPreferences?: string[] | null;
  allergies?: string[] | null;
  foodIntolerances?: string[] | null;
  dislikedIngredients?: string[] | null;
  preferredCuisines?: string[] | null;
  healthConditions?: string[] | null;
  medications?: string[] | null;
  calorieTarget?: number | null;
  proteinTarget?: number | null;
  carbTarget?: number | null;
  fatTarget?: number | null;
  budgetRange?: string | null;
  diningFrequency?: string | null;
}

interface MealHistoryItem {
  userId: string;
  restaurantId?: number | null;
  menuItemId?: number | null;
  mealType?: string | null;
  mealDate: Date;
  satisfactionRating?: number | null;
  tasteRating?: number | null;
  healthinessRating?: number | null;
  notes?: string | null;
  wouldOrderAgain?: boolean | null;
}

interface AIRecommendation {
  userId: string;
  type: 'restaurant' | 'menu_item';
  targetId: number;
  score: number;
  reasoning: string[];
  nutritionalHighlights: string[];
  cautionaryNotes: string[];
  nutritionalMatch: number;
  preferenceMatch: number;
  healthGoalAlignment: number;
  expiresAt: Date;
}

export class DietaryStorage {
  // Get user's dietary profile
  async getUserDietaryProfile(userId: string): Promise<DietaryProfile | null> {
    try {
      const [profile] = await db
        .select()
        .from(userDietaryProfiles)
        .where(eq(userDietaryProfiles.userId, userId));
      
      return profile || null;
    } catch (error) {
      console.error("Error fetching dietary profile:", error);
      return null;
    }
  }

  // Create new dietary profile
  async createUserDietaryProfile(profileData: DietaryProfile): Promise<void> {
    try {
      await db.insert(userDietaryProfiles).values({
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error creating dietary profile:", error);
      throw new Error("Failed to create dietary profile");
    }
  }

  // Update existing dietary profile
  async updateUserDietaryProfile(userId: string, updates: Partial<DietaryProfile>): Promise<void> {
    try {
      await db
        .update(userDietaryProfiles)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(userDietaryProfiles.userId, userId));
    } catch (error) {
      console.error("Error updating dietary profile:", error);
      throw new Error("Failed to update dietary profile");
    }
  }

  // Record meal history
  async recordMealHistory(mealData: MealHistoryItem): Promise<void> {
    try {
      await db.insert(userMealHistory).values(mealData);
    } catch (error) {
      console.error("Error recording meal history:", error);
      throw new Error("Failed to record meal history");
    }
  }

  // Get user's meal history
  async getUserMealHistory(userId: string, limit: number = 50): Promise<MealHistoryItem[]> {
    try {
      const history = await db
        .select()
        .from(userMealHistory)
        .where(eq(userMealHistory.userId, userId))
        .orderBy(desc(userMealHistory.mealDate))
        .limit(limit);
      
      return history;
    } catch (error) {
      console.error("Error fetching meal history:", error);
      return [];
    }
  }

  // Store AI recommendations
  async storeRecommendations(userId: string, recommendations: AIRecommendation[]): Promise<void> {
    try {
      // Clear old recommendations
      await db
        .delete(personalizedRecommendations)
        .where(eq(personalizedRecommendations.userId, userId));

      // Insert new recommendations
      if (recommendations.length > 0) {
        await db.insert(personalizedRecommendations).values(
          recommendations.map(rec => ({
            ...rec,
            createdAt: new Date(),
          }))
        );
      }
    } catch (error) {
      console.error("Error storing recommendations:", error);
      throw new Error("Failed to store recommendations");
    }
  }

  // Get stored recommendations
  async getStoredRecommendations(userId: string, limit: number = 10): Promise<AIRecommendation[]> {
    try {
      const recommendations = await db
        .select()
        .from(personalizedRecommendations)
        .where(
          and(
            eq(personalizedRecommendations.userId, userId),
            // Only return recommendations that haven't expired
            // expiresAt > new Date()
          )
        )
        .orderBy(desc(personalizedRecommendations.score))
        .limit(limit);
      
      return recommendations;
    } catch (error) {
      console.error("Error fetching stored recommendations:", error);
      return [];
    }
  }

  // Calculate BMI
  async calculateBMI(weight: number, height: number): Promise<{ bmi: number; category: string; recommendations: string[] }> {
    const bmi = weight / ((height / 100) ** 2);
    
    let category: string;
    let recommendations: string[];
    
    if (bmi < 18.5) {
      category = "underweight";
      recommendations = [
        "Consider consulting with a nutritionist for healthy weight gain strategies",
        "Focus on nutrient-dense, calorie-rich foods",
        "Include protein-rich meals in your diet"
      ];
    } else if (bmi < 25) {
      category = "normal";
      recommendations = [
        "Maintain your current healthy weight with balanced nutrition",
        "Continue regular physical activity",
        "Focus on variety in your meal choices"
      ];
    } else if (bmi < 30) {
      category = "overweight";
      recommendations = [
        "Consider portion control and balanced meal planning",
        "Increase physical activity and choose lower-calorie options",
        "Focus on vegetables, lean proteins, and whole grains"
      ];
    } else {
      category = "obese";
      recommendations = [
        "Consult with healthcare professionals for a comprehensive weight management plan",
        "Focus on sustainable lifestyle changes",
        "Prioritize nutrient-dense, lower-calorie meal options"
      ];
    }
    
    return { bmi, category, recommendations };
  }
}

export const dietaryStorage = new DietaryStorage();
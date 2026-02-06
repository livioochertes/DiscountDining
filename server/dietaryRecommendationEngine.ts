import OpenAI from "openai";
import { db } from "./db";
import { 
  userDietaryProfiles, 
  userMealHistory, 
  personalizedRecommendations, 
  restaurants, 
  menuItems 
} from "@shared/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { dietaryStorage } from "./dietaryStorage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  calorieTarget?: number | null;
  proteinTarget?: number | null;
  carbTarget?: number | null;
  fatTarget?: number | null;
  budgetRange?: string | null;
  diningFrequency?: string | null;
}

interface MealHistoryItem {
  restaurantName: string | null;
  menuItemName: string | null;
  mealType: string | null;
  satisfactionRating?: number | null;
  tasteRating?: number | null;
  healthinessRating?: number | null;
  wouldOrderAgain?: boolean | null;
  notes?: string | null;
}

interface RecommendationRequest {
  userId: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  maxRecommendations?: number;
  includeRestaurants?: boolean;
  includeMenuItems?: boolean;
}

interface AIRecommendation {
  type: 'restaurant' | 'menu_item';
  targetId: number;
  score: number;
  reasoning: string[];
  nutritionalHighlights: string[];
  cautionaryNotes: string[];
  nutritionalMatch: number;
  preferenceMatch: number;
  healthGoalAlignment: number;
}

export class DietaryRecommendationEngine {
  
  async generatePersonalizedRecommendations(request: RecommendationRequest): Promise<AIRecommendation[]> {
    try {
      // Get user's dietary profile
      // Check for recent cached recommendations first (within last 2 hours)
      const cachedRecommendations = await this.getCachedRecommendations(request.userId, request.mealType);
      if (cachedRecommendations.length > 0) {
        console.log('Returning cached recommendations for faster response');
        return cachedRecommendations.slice(0, request.maxRecommendations ?? 10);
      }

      const profile = await this.getUserDietaryProfile(request.userId);
      const effectiveProfile: DietaryProfile = profile || {
        userId: request.userId,
        age: null,
        height: null,
        weight: null,
        gender: null,
        activityLevel: 'moderate',
        healthGoal: 'maintain',
        targetWeight: null,
        dietaryPreferences: [],
        allergies: [],
        foodIntolerances: [],
        dislikedIngredients: [],
        preferredCuisines: [],
        healthConditions: [],
        calorieTarget: 2000,
        proteinTarget: null,
        carbTarget: null,
        fatTarget: null,
        budgetRange: 'medium',
        diningFrequency: 'weekly',
      };

      // Parallel data fetching for better performance
      const [mealHistory, availableRestaurants, availableMenuItems] = await Promise.all([
        this.getUserMealHistory(request.userId, 20), // Limit to recent 20 meals
        this.getAvailableRestaurants(),
        request.includeMenuItems ? this.getAvailableMenuItems() : Promise.resolve([])
      ]);

      // Generate AI recommendations with limited data for faster processing
      const aiRecommendations = await this.generateAIRecommendations({
        profile: effectiveProfile,
        mealHistory,
        availableRestaurants: availableRestaurants.slice(0, 20), // Limit for faster AI processing
        availableMenuItems: availableMenuItems.slice(0, 40), // Limit menu items
        mealType: request.mealType,
        includeRestaurants: request.includeRestaurants ?? true,
        includeMenuItems: request.includeMenuItems ?? true
      });

      // Store recommendations in database
      await this.storeRecommendations(request.userId, aiRecommendations);

      return aiRecommendations.slice(0, request.maxRecommendations ?? 10);

    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      throw error;
    }
  }

  async getUserDietaryProfile(userId: string): Promise<DietaryProfile | null> {
    const profile = await db
      .select()
      .from(userDietaryProfiles)
      .where(eq(userDietaryProfiles.userId, userId))
      .limit(1);

    return profile[0] as DietaryProfile || null;
  }

  private async getUserMealHistory(userId: string, limit: number = 50): Promise<MealHistoryItem[]> {
    const history = await db
      .select({
        restaurantName: restaurants.name,
        menuItemName: menuItems.name,
        mealType: userMealHistory.mealType,
        satisfactionRating: userMealHistory.satisfactionRating,
        tasteRating: userMealHistory.tasteRating,
        healthinessRating: userMealHistory.healthinessRating,
        wouldOrderAgain: userMealHistory.wouldOrderAgain,
        notes: userMealHistory.notes
      })
      .from(userMealHistory)
      .leftJoin(restaurants, eq(userMealHistory.restaurantId, restaurants.id))
      .leftJoin(menuItems, eq(userMealHistory.menuItemId, menuItems.id))
      .where(eq(userMealHistory.userId, userId))
      .orderBy(desc(userMealHistory.mealDate))
      .limit(limit);

    return history;
  }

  private async getAvailableRestaurants() {
    return await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        cuisine: restaurants.cuisine,
        priceRange: restaurants.priceRange,
        features: restaurants.features,
        dietaryOptions: restaurants.dietaryOptions,
        allergenInfo: restaurants.allergenInfo,
        healthFocused: restaurants.healthFocused,
        rating: restaurants.rating,
        location: restaurants.location
      })
      .from(restaurants)
      .where(and(
        eq(restaurants.isActive, true),
        eq(restaurants.isApproved, true)
      ));
  }

  private async getAvailableMenuItems() {
    return await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        description: menuItems.description,
        category: menuItems.category,
        price: menuItems.price,
        ingredients: menuItems.ingredients,
        allergens: menuItems.allergens,
        dietaryTags: menuItems.dietaryTags,
        spiceLevel: menuItems.spiceLevel,
        calories: menuItems.calories,
        preparationTime: menuItems.preparationTime,
        restaurantId: menuItems.restaurantId,
        restaurantName: restaurants.name,
        restaurantCuisine: restaurants.cuisine,
        restaurantLocation: restaurants.location,
        restaurantRating: restaurants.rating
      })
      .from(menuItems)
      .leftJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
      .where(and(
        eq(menuItems.isAvailable, true),
        eq(restaurants.isActive, true),
        eq(restaurants.isApproved, true)
      ));
  }

  private async generateAIRecommendations({
    profile,
    mealHistory,
    availableRestaurants,
    availableMenuItems,
    mealType,
    includeRestaurants,
    includeMenuItems
  }: {
    profile: DietaryProfile;
    mealHistory: MealHistoryItem[];
    availableRestaurants: any[];
    availableMenuItems: any[];
    mealType?: string;
    includeRestaurants: boolean;
    includeMenuItems: boolean;
  }): Promise<AIRecommendation[]> {

    const systemPrompt = `You are an AI dietary recommendation engine. Generate personalized restaurant/menu recommendations based on user profile.

User Profile: Health Goal: ${profile.healthGoal || 'general_health'} | Diet: ${profile.dietaryPreferences?.join(', ') || 'none'} | Allergies: ${profile.allergies?.join(', ') || 'none'} | Intolerances: ${profile.foodIntolerances?.join(', ') || 'none'} | Conditions: ${profile.healthConditions?.join(', ') || 'none'} | Activity: ${profile.activityLevel || 'moderate'} | Calories: ${profile.calorieTarget || 'unspecified'} | Budget: ${profile.budgetRange || 'medium'} | Cuisines: ${profile.preferredCuisines?.join(', ') || 'open'}

Context: Meal Type: ${mealType || 'any'} | Include Restaurants: ${includeRestaurants} | Include Menu Items: ${includeMenuItems}

Respond in JSON format:
{
  "recommendations": [
    {
      "type": "restaurant",
      "targetId": 123,
      "score": 0.85,
      "reasoning": ["Brief reason 1", "Brief reason 2"],
      "nutritionalHighlights": ["Highlight 1", "Highlight 2"],
      "cautionaryNotes": ["Note if any"],
      "nutritionalMatch": 0.8,
      "preferenceMatch": 0.9,
      "healthGoalAlignment": 0.85
    }
  ]
}

All scores 0-1, arrays contain strings only.`;

    const userPrompt = `Based on the user profile and meal history above, please recommend the most suitable options from these available choices:

${includeRestaurants ? `
AVAILABLE RESTAURANTS:
${availableRestaurants.map(restaurant => 
  `- ID: ${restaurant.id}, Name: ${restaurant.name}, Cuisine: ${restaurant.cuisine}, Price: ${restaurant.priceRange}, Features: ${restaurant.features?.join(', ') || 'none'}, Health-focused: ${restaurant.healthFocused}, Rating: ${restaurant.rating}`
).join('\n')}
` : ''}

${includeMenuItems ? `
AVAILABLE MENU ITEMS:
${availableMenuItems.slice(0, 30).map(item => // Limit to avoid token overflow
  `- ID: ${item.id}, Name: ${item.name}, Restaurant: ${item.restaurantName}, Category: ${item.category}, Price: €${item.price}, Ingredients: ${item.ingredients?.join(', ') || 'not listed'}, Dietary Tags: ${item.dietaryTags?.join(', ') || 'none'}, Calories: ${item.calories || 'not listed'}, Allergens: ${item.allergens?.join(', ') || 'none'}`
).join('\n')}
` : ''}

Please provide up to 10 personalized recommendations that best match the user's profile, preferences, and health goals.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Lower temperature for faster, more consistent responses
        max_tokens: 1500 // Reduced token limit for faster processing
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
      const recommendations = aiResponse.recommendations || [];
      
      // Validate and fix recommendation structure
      const validatedRecommendations = recommendations.map((rec: any) => ({
        type: rec.type || 'restaurant',
        targetId: rec.targetId || rec.id || 0,
        score: typeof rec.score === 'number' ? rec.score : (typeof rec.recommendation_score === 'number' ? rec.recommendation_score : 0.7),
        reasoning: Array.isArray(rec.reasoning) ? rec.reasoning : (typeof rec.reasoning === 'string' ? [rec.reasoning] : ['AI recommendation']),
        nutritionalHighlights: Array.isArray(rec.nutritionalHighlights) ? rec.nutritionalHighlights : (Array.isArray(rec.nutritional_highlights) ? rec.nutritional_highlights : ['Nutritional analysis pending']),
        cautionaryNotes: Array.isArray(rec.cautionaryNotes) ? rec.cautionaryNotes : (Array.isArray(rec.cautionary_notes) ? rec.cautionary_notes : []),
        nutritionalMatch: typeof rec.nutritionalMatch === 'number' ? rec.nutritionalMatch : (typeof rec.nutritional_match === 'number' ? rec.nutritional_match : 0.7),
        preferenceMatch: typeof rec.preferenceMatch === 'number' ? rec.preferenceMatch : (typeof rec.preference_match === 'number' ? rec.preference_match : 0.7),
        healthGoalAlignment: typeof rec.healthGoalAlignment === 'number' ? rec.healthGoalAlignment : (typeof rec.health_goal_alignment === 'number' ? rec.health_goal_alignment : 0.7)
      }));
      
      return validatedRecommendations;

    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error('Failed to generate AI recommendations');
    }
  }

  private async storeRecommendations(userId: string, recommendations: AIRecommendation[]): Promise<void> {
    console.log('Storing recommendations for user:', userId);
    console.log('Recommendations to store:', JSON.stringify(recommendations, null, 2));
    
    const recommendationData = recommendations.map((rec, index) => {
      console.log(`Processing recommendation ${index}:`, JSON.stringify(rec, null, 2));
      return {
        userId,
        type: rec.type || 'restaurant',
        targetId: rec.targetId || 0,
        recommendationScore: (rec.score || 0.7).toString(),
        reasoningFactors: rec.reasoning || ['AI recommendation'],
        nutritionalMatch: (rec.nutritionalMatch || 0.7).toString(),
        preferenceMatch: (rec.preferenceMatch || 0.7).toString(),
        healthGoalAlignment: (rec.healthGoalAlignment || 0.7).toString(),
        recommendationText: (rec.reasoning || ['AI recommendation']).join('. '),
        nutritionalHighlights: rec.nutritionalHighlights || ['Nutritional analysis pending'],
        cautionaryNotes: rec.cautionaryNotes || [],
        aiModelVersion: 'gpt-4o-2024',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expire in 24 hours
      };
    });

    await db.insert(personalizedRecommendations).values(recommendationData);
  }

  async createUserDietaryProfile(profileData: any): Promise<void> {
    await db.insert(userDietaryProfiles).values({
      ...profileData,
      lastRecommendationUpdate: new Date()
    });
  }

  async updateUserDietaryProfile(userId: string, updates: Partial<DietaryProfile>): Promise<void> {
    await db
      .update(userDietaryProfiles)
      .set({
        ...updates,
        updatedAt: new Date(),
        lastRecommendationUpdate: new Date()
      })
      .where(eq(userDietaryProfiles.userId, userId));
  }

  async recordMealHistory(mealData: any): Promise<void> {
    await db.insert(userMealHistory).values(mealData);
  }

  async getStoredRecommendations(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const recommendations = await db
        .select()
        .from(personalizedRecommendations)
        .where(and(
          eq(personalizedRecommendations.userId, userId),
          gte(personalizedRecommendations.expiresAt, new Date())
        ))
        .orderBy(desc(personalizedRecommendations.recommendationScore))
        .limit(limit);

      // Enhance recommendations with restaurant and menu item details
      const enhancedRecommendations = await Promise.all(
        recommendations.map(async (rec) => {
          let restaurant = null;
          let menuItem = null;

          try {
            if (rec.type === 'restaurant' && rec.targetId) {
              // Fetch restaurant details
              const restaurantResults = await db
                .select()
                .from(restaurants)
                .where(eq(restaurants.id, Number(rec.targetId)));
              restaurant = restaurantResults[0] || null;
            } else if (rec.type === 'menu_item' && rec.targetId) {
              // Fetch menu item details first
              const menuItemResults = await db
                .select()
                .from(menuItems)
                .where(eq(menuItems.id, Number(rec.targetId)));
              menuItem = menuItemResults[0] || null;
              
              // If menu item found, fetch its restaurant
              if (menuItem && menuItem.restaurantId) {
                const restaurantResults = await db
                  .select()
                  .from(restaurants)
                  .where(eq(restaurants.id, menuItem.restaurantId));
                restaurant = restaurantResults[0] || null;
              }
            }
          } catch (error) {
            console.error(`Error fetching details for recommendation ${rec.id}:`, error);
          }

          return {
            ...rec,
            restaurant,
            menuItem
          };
        })
      );

      return enhancedRecommendations;
    } catch (error) {
      console.error("Error fetching stored recommendations:", error);
      return [];
    }
  }

  // Cache recommendations for faster responses (2 hours cache)
  private async getCachedRecommendations(userId: string, mealType?: string): Promise<AIRecommendation[]> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const cachedRecs = await db
      .select()
      .from(personalizedRecommendations)
      .where(and(
        eq(personalizedRecommendations.userId, userId),
        gte(personalizedRecommendations.createdAt, twoHoursAgo),
        gte(personalizedRecommendations.expiresAt, new Date())
      ))
      .orderBy(desc(personalizedRecommendations.recommendationScore))
      .limit(10);

    if (cachedRecs.length === 0) return [];

    console.log(`Found ${cachedRecs.length} cached recommendations for user ${userId}`);

    // Convert database format back to AIRecommendation format
    return cachedRecs.map(rec => ({
      type: rec.type as 'restaurant' | 'menu_item',
      targetId: rec.targetId || 0,
      score: parseFloat(rec.recommendationScore || '0.7'),
      reasoning: rec.reasoningFactors || ['Cached recommendation'],
      nutritionalHighlights: rec.nutritionalHighlights || ['Analysis pending'],
      cautionaryNotes: rec.cautionaryNotes || [],
      nutritionalMatch: parseFloat(rec.nutritionalMatch || '0.7'),
      preferenceMatch: parseFloat(rec.preferenceMatch || '0.7'),
      healthGoalAlignment: parseFloat(rec.healthGoalAlignment || '0.7')
    }));
  }

  async calculateBMI(weight: number, height: number): Promise<{ bmi: number; category: string; recommendations: string[] }> {
    const bmi = weight / Math.pow(height / 100, 2);
    
    let category: string;
    let recommendations: string[];

    if (bmi < 18.5) {
      category = 'underweight';
      recommendations = [
        'Focus on nutrient-dense, calorie-rich foods',
        'Include healthy fats like nuts, avocado, and olive oil',
        'Consider frequent, smaller meals throughout the day',
        'Incorporate protein-rich foods to support muscle growth'
      ];
    } else if (bmi < 25) {
      category = 'normal_weight';
      recommendations = [
        'Maintain a balanced diet with variety',
        'Continue regular physical activity',
        'Focus on whole foods and proper hydration',
        'Monitor portion sizes to maintain current weight'
      ];
    } else if (bmi < 30) {
      category = 'overweight';
      recommendations = [
        'Focus on portion control and mindful eating',
        'Increase vegetable and lean protein intake',
        'Reduce processed foods and added sugars',
        'Consider increasing physical activity gradually'
      ];
    } else {
      category = 'obese';
      recommendations = [
        'Consult with healthcare providers for personalized guidance',
        'Focus on sustainable, gradual weight loss',
        'Prioritize whole foods and vegetables',
        'Consider working with a registered dietitian'
      ];
    }

    return { bmi: Math.round(bmi * 10) / 10, category, recommendations };
  }
}

export const dietaryEngine = new DietaryRecommendationEngine();
import OpenAI from "openai";
import { storage } from "./storage.js";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AssistantContext {
  restaurants?: any[];
  customerPreferences?: {
    cuisine?: string;
    priceRange?: string;
    location?: string;
  };
}

export async function getAIAssistantResponse(
  userMessage: string,
  context: AssistantContext = {},
  userLanguage: string = 'en'
): Promise<{ response: string; suggestions?: string[] }> {
  try {
    // Get current restaurant data for context
    const restaurants = await storage.getRestaurants();
    
    // Build context for the AI
    const contextInfo = {
      availableRestaurants: restaurants.map(r => ({
        name: r.name,
        cuisine: r.cuisine,
        location: r.location,
        rating: r.rating,
        priceRange: r.priceRange,
        description: r.description
      })),
      ...context
    };

    // Language mapping for AI responses
    const languageInstructions = {
      'en': 'Respond in English',
      'es': 'Responde en español',
      'fr': 'Répondez en français',
      'de': 'Antworten Sie auf Deutsch',
      'it': 'Rispondi in italiano',
      'ro': 'Răspundeți în română'
    };

    const languageInstruction = languageInstructions[userLanguage as keyof typeof languageInstructions] || languageInstructions['en'];

    const systemPrompt = `You are EatOff's helpful dining assistant. You help customers discover restaurants and understand voucher packages on our platform.

IMPORTANT: ${languageInstruction}. Always respond in the same language as the user's question. Detect the language from the user's message and respond accordingly.

Available restaurants: ${JSON.stringify(contextInfo.availableRestaurants, null, 2)}

Your capabilities:
- Recommend restaurants based on preferences (cuisine, location, price range)
- Explain voucher packages and their benefits
- Help customers understand discount calculations
- Suggest dining experiences based on customer needs
- Answer questions about restaurant features and ratings

Guidelines:
- Be friendly, helpful, and concise
- Always respond in the same language the user is using
- Focus on the restaurants available on our platform
- Explain voucher benefits clearly (discounted meals, validity periods)
- If asked about specific restaurants not in our system, politely redirect to available options
- Always mention that voucher packages offer great value with flexible meal counts and extended validity
- Respond in JSON format with "response" and optional "suggestions" array
- IMPORTANT: "suggestions" must be an array of simple STRING suggestions, never objects or complex data

Example response format:
{
  "response": "Based on your preference for Italian cuisine, I recommend...",
  "suggestions": ["Check out Mama Mia's voucher packages", "Try the 10-meal package for better value"]
}

CRITICAL: All suggestions must be simple text strings that users can click on, like:
- "Show me Italian restaurants"
- "Explain voucher benefits"
- "Find budget-friendly options"
DO NOT include restaurant objects or complex data in suggestions.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.7
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"response": "I apologize, but I encountered an issue processing your request."}');
    
    // Ensure response is always a string
    let response = result.response;
    if (typeof response !== 'string') {
      response = typeof response === 'object' ? JSON.stringify(response) : String(response);
    }
    
    // Ensure suggestions are always strings and filter out objects
    const suggestions = (result.suggestions || [])
      .filter((suggestion: any) => suggestion !== null && suggestion !== undefined)
      .map((suggestion: any) => {
        if (typeof suggestion === 'string') {
          return suggestion;
        } else if (typeof suggestion === 'object') {
          // If it's an object, extract meaningful text or skip it
          if (suggestion.text || suggestion.name || suggestion.title) {
            return suggestion.text || suggestion.name || suggestion.title;
          }
          return null; // Skip objects without meaningful text
        } else {
          return String(suggestion);
        }
      })
      .filter((suggestion: string | null) => suggestion !== null && suggestion.length > 0);
    
    return {
      response: response,
      suggestions: suggestions
    };

  } catch (error) {
    console.error("AI Assistant error:", error);
    return {
      response: "I'm having trouble right now, but I'm here to help you find great restaurants and voucher deals. Please try asking me again!",
      suggestions: ["Browse our restaurant listings", "Check out popular voucher packages"]
    };
  }
}

export async function getRestaurantRecommendations(
  preferences: {
    cuisine?: string;
    location?: string;
    priceRange?: string;
    occasion?: string;
  }
): Promise<{ recommendations: any[]; reasoning: string }> {
  try {
    const restaurants = await storage.getRestaurants();
    
    const prompt = `Based on these preferences: ${JSON.stringify(preferences)}, recommend the best restaurants from this list: ${JSON.stringify(restaurants.map(r => ({
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      location: r.location,
      rating: r.rating,
      priceRange: r.priceRange,
      description: r.description
    })))}.

Provide recommendations in JSON format with "recommendations" (array of restaurant IDs) and "reasoning" (explanation).`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 300
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"recommendations": [], "reasoning": "No specific recommendations available."}');
    
    // If AI returns restaurant IDs, filter by those IDs
    let recommendedRestaurants = [];
    if (Array.isArray(result.recommendations) && result.recommendations.length > 0) {
      // Check if recommendations are IDs or restaurant objects
      if (typeof result.recommendations[0] === 'number') {
        recommendedRestaurants = restaurants.filter(r => 
          result.recommendations.includes(r.id)
        );
      } else {
        // If AI returned restaurant objects, validate and use them
        recommendedRestaurants = result.recommendations.filter((rec: any) => 
          rec && rec.id && restaurants.some(r => r.id === rec.id)
        ).map((rec: any) => restaurants.find(r => r.id === rec.id)).filter(Boolean);
      }
    }

    // Fallback to top-rated restaurants if no specific recommendations
    if (recommendedRestaurants.length === 0) {
      recommendedRestaurants = restaurants
        .filter(r => {
          if (!r.rating) return false;
          const rating = typeof r.rating === 'string' ? parseFloat(r.rating) : r.rating;
          return rating >= 4.0;
        })
        .slice(0, 6);
    }

    return {
      recommendations: recommendedRestaurants,
      reasoning: result.reasoning || "Based on your preferences, here are some great restaurant options!"
    };

  } catch (error) {
    console.error("Recommendation error:", error);
    const fallbackRestaurants = await storage.getRestaurants();
    return {
      recommendations: fallbackRestaurants.slice(0, 6),
      reasoning: "Here are our featured restaurants to explore!"
    };
  }
}

export async function explainVoucherPackage(
  packageData: {
    mealCount: number;
    originalPrice: number;
    discountedPrice: number;
    discountPercentage: number;
    validityMonths: number;
  }
): Promise<string> {
  try {
    const prompt = `Explain this voucher package in a friendly, clear way: ${JSON.stringify(packageData)}. 
    Focus on the value and benefits. Keep it concise and persuasive.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.5
    });

    return completion.choices[0].message.content || "This voucher package offers great value with flexible dining options!";

  } catch (error) {
    console.error("Package explanation error:", error);
    return `This package includes ${packageData.mealCount} meals at a ${packageData.discountPercentage}% discount, saving you €${(packageData.originalPrice - packageData.discountedPrice).toFixed(2)}! Valid for ${packageData.validityMonths} months.`;
  }
}
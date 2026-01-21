import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { User, Heart, Target, ChefHat, Activity, Calculator } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const dietaryProfileSchema = z.object({
  age: z.number().min(13).max(120).optional(),
  height: z.number().min(100).max(250).optional(),
  weight: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  activityLevel: z.enum(["sedentary", "lightly_active", "moderately_active", "very_active", "extremely_active"]).optional(),
  healthGoal: z.enum(["weight_loss", "weight_gain", "muscle_gain", "maintenance", "general_health"]).optional(),
  targetWeight: z.string().optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  foodIntolerances: z.array(z.string()).optional(),
  preferredCuisines: z.array(z.string()).optional(),
  healthConditions: z.array(z.string()).optional(),
  calorieTarget: z.number().min(800).max(5000).optional(),
  proteinTarget: z.number().min(20).max(300).optional(),
  carbTarget: z.number().min(50).max(500).optional(),
  fatTarget: z.number().min(20).max(200).optional(),
  budgetRange: z.enum(["low", "medium", "high"]).optional(),
  diningFrequency: z.enum(["rarely", "occasionally", "regularly", "frequently"]).optional(),
});

type DietaryProfileFormData = z.infer<typeof dietaryProfileSchema>;

const dietaryOptions = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  pescatarian: "Pescatarian",
  keto: "Ketogenic",
  paleo: "Paleo",
  mediterranean: "Mediterranean",
  gluten_free: "Gluten-Free",
  dairy_free: "Dairy-Free",
  low_carb: "Low Carb",
  high_protein: "High Protein"
};

const allergyOptions = {
  nuts: "Tree Nuts",
  peanuts: "Peanuts",
  dairy: "Dairy",
  gluten: "Gluten",
  shellfish: "Shellfish",
  fish: "Fish",
  eggs: "Eggs",
  soy: "Soy",
  sesame: "Sesame"
};

const cuisineOptions = {
  italian: "Italian",
  chinese: "Chinese",
  mexican: "Mexican",
  indian: "Indian",
  japanese: "Japanese",
  thai: "Thai",
  mediterranean: "Mediterranean",
  american: "American",
  french: "French",
  korean: "Korean"
};

interface DietaryProfileFormProps {
  onSave?: () => void;
}

export function DietaryProfileForm({ onSave }: DietaryProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [bmiData, setBmiData] = useState<{ bmi: number; category: string; recommendations: string[] } | null>(null);
  const { toast } = useToast();

  const form = useForm<DietaryProfileFormData>({
    resolver: zodResolver(dietaryProfileSchema),
    defaultValues: {
      dietaryPreferences: [],
      allergies: [],
      foodIntolerances: [],
      preferredCuisines: [],
      healthConditions: []
    }
  });

  // Load existing profile data on component mount
  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const response = await fetch("/api/dietary/profile");
      if (response.ok) {
        const profile = await response.json();
        if (profile) {
          // Pre-populate form with existing data
          form.reset({
            age: profile.age || undefined,
            gender: profile.gender || undefined,
            height: profile.height || undefined,
            weight: profile.weight || undefined,
            activityLevel: profile.activityLevel || undefined,
            healthGoal: profile.healthGoal || undefined,
            targetWeight: profile.targetWeight || undefined,
            dietaryPreferences: profile.dietaryPreferences || [],
            allergies: profile.allergies || [],
            foodIntolerances: profile.foodIntolerances || [],
            preferredCuisines: profile.preferredCuisines || [],
            healthConditions: profile.healthConditions || [],
            calorieTarget: profile.calorieTarget || undefined,
            proteinTarget: profile.proteinTarget || undefined,
            carbTarget: profile.carbTarget || undefined,
            fatTarget: profile.fatTarget || undefined,
            budgetRange: profile.budgetRange || undefined,
            diningFrequency: profile.diningFrequency || undefined
          });

          // Calculate BMI if height and weight are available
          if (profile.height && profile.weight) {
            const weight = parseFloat(profile.weight);
            if (weight > 0 && profile.height > 0) {
              calculateBMI(weight, profile.height);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading existing profile:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const watchHeight = form.watch("height");
  const watchWeight = form.watch("weight");
  const watchDietaryPreferences = form.watch("dietaryPreferences");
  const watchAllergies = form.watch("allergies");
  const watchFoodIntolerances = form.watch("foodIntolerances");
  const watchPreferredCuisines = form.watch("preferredCuisines");
  const watchHealthConditions = form.watch("healthConditions");

  // Calculate BMI when height and weight are provided
  useEffect(() => {
    if (watchHeight && watchWeight) {
      const weight = parseFloat(watchWeight);
      if (weight > 0 && watchHeight > 0) {
        calculateBMI(weight, watchHeight);
      }
    }
  }, [watchHeight, watchWeight]);

  const calculateBMI = async (weight: number, height: number) => {
    try {
      const response = await fetch("/api/dietary/bmi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight, height })
      });
      const data = await response.json();
      setBmiData(data);
    } catch (error) {
      console.error("Error calculating BMI:", error);
    }
  };

  const onSubmit = async (data: DietaryProfileFormData) => {
    setLoading(true);
    try {
      await fetch("/api/dietary/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      toast({
        title: "Profile Saved",
        description: "Your dietary profile has been saved successfully. AI recommendations will be personalized based on your preferences.",
      });

      onSave?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save dietary profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (field: keyof DietaryProfileFormData, value: string, checked: boolean) => {
    const currentValues = form.getValues(field) as string[] || [];
    if (checked) {
      form.setValue(field, [...currentValues, value] as any);
    } else {
      form.setValue(field, currentValues.filter(v => v !== value) as any);
    }
  };

  if (formLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Personalized Dietary Profile
          </CardTitle>
          <CardDescription>
            Loading your existing profile data...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading profile information</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Personalized Dietary Profile
        </CardTitle>
        <CardDescription>
          Update your personalized dietary profile to receive AI-powered restaurant and menu recommendations
          tailored to your health goals and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="goals" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Health Goals
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4" />
                  Food Preferences
                </TabsTrigger>
                <TabsTrigger value="nutrition" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Nutrition Targets
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter your age"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter height in cm"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter weight in kg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {bmiData && (
                  <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold">BMI Analysis: {bmiData.bmi}</span>
                        <span className="text-sm text-muted-foreground">({bmiData.category.replace('_', ' ')})</span>
                      </div>
                      <div className="space-y-1">
                        {bmiData.recommendations.map((rec, index) => (
                          <p key={index} className="text-sm text-blue-700 dark:text-blue-300">• {rec}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <FormField
                  control={form.control}
                  name="activityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select activity level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sedentary">Sedentary (office job, no exercise)</SelectItem>
                          <SelectItem value="lightly_active">Lightly Active (light exercise 1-3 days/week)</SelectItem>
                          <SelectItem value="moderately_active">Moderately Active (moderate exercise 3-5 days/week)</SelectItem>
                          <SelectItem value="very_active">Very Active (hard exercise 6-7 days/week)</SelectItem>
                          <SelectItem value="extremely_active">Extremely Active (physical job + exercise)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="goals" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="healthGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Health Goal</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select health goal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weight_loss">Weight Loss</SelectItem>
                            <SelectItem value="weight_gain">Weight Gain</SelectItem>
                            <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                            <SelectItem value="maintenance">Maintain Current Weight</SelectItem>
                            <SelectItem value="general_health">General Health & Wellness</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Weight (kg)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter target weight" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budgetRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dining Budget Range</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select budget range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Budget-Friendly (€5-15 per meal)</SelectItem>
                            <SelectItem value="medium">Moderate (€15-30 per meal)</SelectItem>
                            <SelectItem value="high">Premium (€30+ per meal)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diningFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dining Out Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select dining frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rarely">Rarely (special occasions)</SelectItem>
                            <SelectItem value="occasionally">Occasionally (1-2 times/month)</SelectItem>
                            <SelectItem value="regularly">Regularly (1-2 times/week)</SelectItem>
                            <SelectItem value="frequently">Frequently (3+ times/week)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                <div>
                  <Label className="text-base font-semibold">Dietary Preferences</Label>
                  <p className="text-sm text-muted-foreground mb-3">Select all that apply to your dietary lifestyle</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(dietaryOptions).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dietary-${key}`}
                          checked={watchDietaryPreferences?.includes(key) || false}
                          onCheckedChange={(checked) => handleCheckboxChange("dietaryPreferences", key, checked as boolean)}
                        />
                        <Label htmlFor={`dietary-${key}`} className="text-sm">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold">Food Allergies</Label>
                  <p className="text-sm text-muted-foreground mb-3">Select any allergies to avoid in recommendations</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(allergyOptions).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`allergy-${key}`}
                          checked={watchAllergies?.includes(key) || false}
                          onCheckedChange={(checked) => handleCheckboxChange("allergies", key, checked as boolean)}
                        />
                        <Label htmlFor={`allergy-${key}`} className="text-sm">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold">Preferred Cuisines</Label>
                  <p className="text-sm text-muted-foreground mb-3">Select your favorite types of cuisine</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(cuisineOptions).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cuisine-${key}`}
                          checked={watchPreferredCuisines?.includes(key) || false}
                          onCheckedChange={(checked) => handleCheckboxChange("preferredCuisines", key, checked as boolean)}
                        />
                        <Label htmlFor={`cuisine-${key}`} className="text-sm">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="nutrition" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="calorieTarget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Calorie Target</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 2000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proteinTarget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Protein Target (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 150"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="carbTarget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Carb Target (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 200"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fatTarget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Fat Target (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 70"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Tip:</strong> If you're unsure about your nutritional targets, leave these fields empty. 
                    Our AI will suggest appropriate targets based on your basic information and health goals.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading} className="min-w-32">
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
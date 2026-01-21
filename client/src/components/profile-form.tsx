import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, User, Target, Heart, AlertTriangle } from "lucide-react";

const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  age: z.number().min(13).max(120).optional(),
  weight: z.number().min(30).max(300).optional(),
  height: z.number().min(100).max(250).optional(),
  activityLevel: z.string().optional(),
  healthGoal: z.string().optional(),
  dietaryPreferences: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  dislikes: z.array(z.string()).default([]),
  healthConditions: z.array(z.string()).default([]),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  onSave: (data: ProfileFormData) => void;
  onCancel: () => void;
  initialData?: Partial<ProfileFormData>;
  isLoading?: boolean;
}

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary (little/no exercise)" },
  { value: "lightly_active", label: "Lightly Active (light exercise 1-3 days/week)" },
  { value: "moderately_active", label: "Moderately Active (moderate exercise 3-5 days/week)" },
  { value: "very_active", label: "Very Active (hard exercise 6-7 days/week)" },
  { value: "extremely_active", label: "Extremely Active (very hard exercise, physical job)" },
];

const HEALTH_GOALS = [
  { value: "weight_loss", label: "Weight Loss" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "maintenance", label: "Weight Maintenance" },
  { value: "general_health", label: "General Health" },
];

const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Keto", "Paleo", "Mediterranean", "Low Carb", 
  "Low Fat", "High Protein", "Gluten Free", "Dairy Free", "Organic"
];

const COMMON_ALLERGIES = [
  "Nuts", "Peanuts", "Dairy", "Eggs", "Fish", "Shellfish", 
  "Soy", "Gluten", "Sesame", "Mustard"
];

const HEALTH_CONDITIONS = [
  "Diabetes", "Hypertension", "Heart Disease", "High Cholesterol", 
  "Celiac Disease", "IBS", "Food Sensitivities", "Kidney Disease"
];

export default function ProfileForm({ onSave, onCancel, initialData, isLoading }: ProfileFormProps) {
  const [customDietaryPref, setCustomDietaryPref] = useState("");
  const [customAllergy, setCustomAllergy] = useState("");
  const [customDislike, setCustomDislike] = useState("");
  const [customCondition, setCustomCondition] = useState("");

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      dietaryPreferences: [],
      allergies: [],
      dislikes: [],
      healthConditions: [],
      ...initialData,
    },
  });

  const watchedValues = form.watch();

  const addCustomItem = (field: keyof ProfileFormData, value: string, setValue: (value: string) => void) => {
    if (value.trim()) {
      const currentValues = form.getValues(field) as string[];
      if (!currentValues.includes(value.trim())) {
        form.setValue(field, [...currentValues, value.trim()] as any);
      }
      setValue("");
    }
  };

  const removeItem = (field: keyof ProfileFormData, item: string) => {
    const currentValues = form.getValues(field) as string[];
    form.setValue(field, currentValues.filter(v => v !== item) as any);
  };

  const toggleItem = (field: keyof ProfileFormData, item: string) => {
    const currentValues = form.getValues(field) as string[];
    if (currentValues.includes(item)) {
      removeItem(field, item);
    } else {
      form.setValue(field, [...currentValues, item] as any);
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    onSave(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 555 000 0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="13" 
                          max="120" 
                          placeholder="25"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Health Information */}
              <Card className="border-accent/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Health Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1"
                              min="30" 
                              max="300" 
                              placeholder="70"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
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
                              min="100" 
                              max="250" 
                              placeholder="175"
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
                              {ACTIVITY_LEVELS.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="healthGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Health Goal
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your primary health goal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {HEALTH_GOALS.map((goal) => (
                              <SelectItem key={goal.value} value={goal.value}>
                                {goal.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Dietary Preferences */}
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-700">Dietary Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map((option) => (
                      <Badge
                        key={option}
                        variant={watchedValues.dietaryPreferences?.includes(option) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleItem("dietaryPreferences", option)}
                      >
                        {option}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom dietary preference"
                      value={customDietaryPref}
                      onChange={(e) => setCustomDietaryPref(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomItem("dietaryPreferences", customDietaryPref, setCustomDietaryPref);
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => addCustomItem("dietaryPreferences", customDietaryPref, setCustomDietaryPref)}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {watchedValues.dietaryPreferences && watchedValues.dietaryPreferences.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {watchedValues.dietaryPreferences.map((pref) => (
                        <Badge key={pref} variant="secondary" className="flex items-center gap-1">
                          {pref}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeItem("dietaryPreferences", pref)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Allergies & Restrictions */}
              <Card className="border-red-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Allergies & Food Restrictions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ALLERGIES.map((allergy) => (
                      <Badge
                        key={allergy}
                        variant={watchedValues.allergies?.includes(allergy) ? "destructive" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleItem("allergies", allergy)}
                      >
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom allergy or restriction"
                      value={customAllergy}
                      onChange={(e) => setCustomAllergy(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomItem("allergies", customAllergy, setCustomAllergy);
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => addCustomItem("allergies", customAllergy, setCustomAllergy)}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {watchedValues.allergies && watchedValues.allergies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {watchedValues.allergies.map((allergy) => (
                        <Badge key={allergy} variant="destructive" className="flex items-center gap-1">
                          {allergy}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeItem("allergies", allergy)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Health Conditions */}
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-700">Health Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {HEALTH_CONDITIONS.map((condition) => (
                      <Badge
                        key={condition}
                        variant={watchedValues.healthConditions?.includes(condition) ? "default" : "outline"}
                        className="cursor-pointer bg-blue-100 text-blue-800 hover:bg-blue-200"
                        onClick={() => toggleItem("healthConditions", condition)}
                      >
                        {condition}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add health condition"
                      value={customCondition}
                      onChange={(e) => setCustomCondition(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomItem("healthConditions", customCondition, setCustomCondition);
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => addCustomItem("healthConditions", customCondition, setCustomCondition)}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {watchedValues.healthConditions && watchedValues.healthConditions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {watchedValues.healthConditions.map((condition) => (
                        <Badge key={condition} className="flex items-center gap-1 bg-blue-100 text-blue-800">
                          {condition}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeItem("healthConditions", condition)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex space-x-3">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Profile"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
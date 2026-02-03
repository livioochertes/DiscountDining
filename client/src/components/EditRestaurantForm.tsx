import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, Truck, MapPin, DollarSign, Loader2 } from "lucide-react";

// Operating hours schema
const operatingHoursSchema = z.object({
  monday: z.object({
    open: z.string().optional(),
    close: z.string().optional(),
    closed: z.boolean().default(false),
  }),
  tuesday: z.object({
    open: z.string().optional(),
    close: z.string().optional(),
    closed: z.boolean().default(false),
  }),
  wednesday: z.object({
    open: z.string().optional(),
    close: z.string().optional(),
    closed: z.boolean().default(false),
  }),
  thursday: z.object({
    open: z.string().optional(),
    close: z.string().optional(),
    closed: z.boolean().default(false),
  }),
  friday: z.object({
    open: z.string().optional(),
    close: z.string().optional(),
    closed: z.boolean().default(false),
  }),
  saturday: z.object({
    open: z.string().optional(),
    close: z.string().optional(),
    closed: z.boolean().default(false),
  }),
  sunday: z.object({
    open: z.string().optional(),
    close: z.string().optional(),
    closed: z.boolean().default(false),
  }),
});

// Restaurant edit schema
const editRestaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  cuisine: z.string().min(1, "Cuisine type is required"),
  mainProduct: z.string().optional(),
  dietCategory: z.string().optional(),
  conceptType: z.string().optional(),
  experienceType: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().optional(),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  description: z.string().min(1, "Description is required"),
  priceRange: z.string().min(1, "Price range is required"),
  imageUrl: z.string().optional(),
  operatingHours: operatingHoursSchema,
  // Service options
  offersDelivery: z.boolean().default(false),
  offersTakeout: z.boolean().default(true),
  dineInAvailable: z.boolean().default(true),
  // Delivery settings (conditional on delivery availability)
  deliveryRadius: z.string().optional(),
  deliveryFee: z.string().optional(),
  minimumDeliveryOrder: z.string().optional(),
});

type EditRestaurantFormData = z.infer<typeof editRestaurantSchema>;

interface EditRestaurantFormProps {
  restaurant: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditRestaurantForm({ restaurant, onSuccess, onCancel }: EditRestaurantFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Get marketplace for country code
  const { data: marketplaces = [] } = useQuery<any[]>({
    queryKey: ['/api/marketplaces'],
  });

  // Determine country code from restaurant's marketplace
  const countryCode = (() => {
    if (restaurant.marketplaceId && marketplaces.length > 0) {
      const marketplace = marketplaces.find((m: any) => m.id === restaurant.marketplaceId);
      return marketplace?.countryCode || 'RO';
    }
    return 'RO'; // Default to Romania
  })();

  // Fetch cities based on country code
  const { data: availableCities = [], isLoading: citiesLoading } = useQuery<any[]>({
    queryKey: ['/api/cities', 'edit-form', countryCode],
    queryFn: async () => {
      const response = await fetch(`/api/cities?country=${countryCode}&limit=500`);
      if (!response.ok) throw new Error('Failed to fetch cities');
      return response.json();
    },
    enabled: !!countryCode,
  });

  // Parse existing operating hours
  const parseOperatingHours = (hoursString: string | null) => {
    if (!hoursString) {
      return {
        monday: { open: "09:00", close: "22:00", closed: false },
        tuesday: { open: "09:00", close: "22:00", closed: false },
        wednesday: { open: "09:00", close: "22:00", closed: false },
        thursday: { open: "09:00", close: "22:00", closed: false },
        friday: { open: "09:00", close: "22:00", closed: false },
        saturday: { open: "09:00", close: "22:00", closed: false },
        sunday: { open: "09:00", close: "22:00", closed: false },
      };
    }

    try {
      return JSON.parse(hoursString);
    } catch {
      return {
        monday: { open: "09:00", close: "22:00", closed: false },
        tuesday: { open: "09:00", close: "22:00", closed: false },
        wednesday: { open: "09:00", close: "22:00", closed: false },
        thursday: { open: "09:00", close: "22:00", closed: false },
        friday: { open: "09:00", close: "22:00", closed: false },
        saturday: { open: "09:00", close: "22:00", closed: false },
        sunday: { open: "09:00", close: "22:00", closed: false },
      };
    }
  };

  const form = useForm<EditRestaurantFormData>({
    resolver: zodResolver(editRestaurantSchema),
    defaultValues: {
      name: restaurant.name || "",
      cuisine: restaurant.cuisine || "",
      mainProduct: restaurant.mainProduct || "",
      dietCategory: restaurant.dietCategory || "",
      conceptType: restaurant.conceptType || "",
      experienceType: restaurant.experienceType || "",
      location: restaurant.location || "",
      address: restaurant.address || "",
      phone: restaurant.phone || "",
      email: restaurant.email || "",
      description: restaurant.description || "",
      priceRange: restaurant.priceRange || "",
      imageUrl: restaurant.imageUrl || "",
      operatingHours: parseOperatingHours(restaurant.operatingHours),
      // Service options
      offersDelivery: restaurant.offersDelivery || false,
      offersTakeout: restaurant.offersTakeout !== false, // Default to true
      dineInAvailable: restaurant.dineInAvailable !== false, // Default to true
      // Delivery settings
      deliveryRadius: restaurant.deliveryRadius ? restaurant.deliveryRadius.toString() : "",
      deliveryFee: restaurant.deliveryFee ? restaurant.deliveryFee.toString() : "",
      minimumDeliveryOrder: restaurant.minimumDeliveryOrder ? restaurant.minimumDeliveryOrder.toString() : "",
    },
  });

  const { watch, setValue, getValues } = form;
  const operatingHours = watch("operatingHours");

  const onSubmit = async (data: EditRestaurantFormData) => {
    setIsSubmitting(true);
    try {
      const formData = {
        ...data,
        operatingHours: JSON.stringify(data.operatingHours),
        // Convert string delivery values to proper numbers/decimals
        deliveryRadius: data.deliveryRadius ? parseFloat(data.deliveryRadius) : null,
        deliveryFee: data.deliveryFee ? parseFloat(data.deliveryFee) : null,
        minimumDeliveryOrder: data.minimumDeliveryOrder ? parseFloat(data.minimumDeliveryOrder) : null,
      };

      await apiRequest("PUT", `/api/restaurant-portal/restaurants/${restaurant.id}`, formData);

      toast({
        title: "Success",
        description: "Restaurant updated successfully!",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update restaurant",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cuisineOptions = [
    "Italian", "Romanian", "French", "Greek", "Spanish", "German", "Polish", "Portuguese", "Turkish",
    "Chinese", "Japanese", "Thai", "Vietnamese", "Indian", "Korean",
    "Mexican", "American", "Brazilian", "Peruvian", "Argentinian",
    "Lebanese", "Moroccan", "Ethiopian", "Israeli",
    "Mediterranean", "International", "Other"
  ];

  const mainProductOptions = [
    "Meat", "Fish & Seafood", "Pasta", "Pizza", "Sushi", "Burgers", "Salads", "Soups", "Desserts", "Beverages", "Mixed"
  ];

  const dietCategoryOptions = [
    "Regular", "Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher", "Organic", "Low-Carb"
  ];

  const conceptTypeOptions = [
    "Fine Dining", "Casual Dining", "Fast Casual", "Fast Food", "Bistro", "Brasserie", "Trattoria", "Taverna", "Family Restaurant"
  ];

  const experienceTypeOptions = [
    "Romantic", "Business", "Family Friendly", "Party & Events", "Relaxed"
  ];

  const priceRanges = ["$", "$$", "$$$", "$$$$"];

  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  const handleDayToggle = (day: string, checked: boolean) => {
    setValue(`operatingHours.${day}.closed` as any, checked);
    if (checked) {
      setValue(`operatingHours.${day}.open` as any, "");
      setValue(`operatingHours.${day}.close` as any, "");
    }
  };

  const handleTimeChange = (day: string, timeType: "open" | "close", value: string) => {
    setValue(`operatingHours.${day}.${timeType}` as any, value);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter restaurant name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cuisine">Cuisine Type *</Label>
              <Select
                value={form.watch("cuisine")}
                onValueChange={(value) => form.setValue("cuisine", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cuisine type" />
                </SelectTrigger>
                <SelectContent>
                  {cuisineOptions.map((cuisine) => (
                    <SelectItem key={cuisine} value={cuisine}>
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.cuisine && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.cuisine.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mainProduct">Main Product</Label>
              <Select
                value={form.watch("mainProduct") || ""}
                onValueChange={(value) => form.setValue("mainProduct", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select main product" />
                </SelectTrigger>
                <SelectContent>
                  {mainProductOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dietCategory">Diet</Label>
              <Select
                value={form.watch("dietCategory") || ""}
                onValueChange={(value) => form.setValue("dietCategory", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select diet category" />
                </SelectTrigger>
                <SelectContent>
                  {dietCategoryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="conceptType">Concept</Label>
              <Select
                value={form.watch("conceptType") || ""}
                onValueChange={(value) => form.setValue("conceptType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select concept type" />
                </SelectTrigger>
                <SelectContent>
                  {conceptTypeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="experienceType">Experience</Label>
              <Select
                value={form.watch("experienceType") || ""}
                onValueChange={(value) => form.setValue("experienceType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience type" />
                </SelectTrigger>
                <SelectContent>
                  {experienceTypeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location/City *</Label>
              <Select
                value={form.watch("location") || ""}
                onValueChange={(value) => form.setValue("location", value, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={citiesLoading ? "Loading cities..." : "Select city"} />
                </SelectTrigger>
                <SelectContent>
                  {citiesLoading ? (
                    <div className="px-3 py-2 text-gray-500 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  ) : availableCities.length === 0 ? (
                    <div className="px-3 py-2 text-gray-500">No cities available</div>
                  ) : (
                    availableCities.map((city: any) => (
                      <SelectItem key={city.geonameId || city.name} value={city.name}>
                        {city.name}{city.adminName1 ? ` (${city.adminName1})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.location && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.location.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="priceRange">Price Range *</Label>
              <Select
                value={form.watch("priceRange")}
                onValueChange={(value) => form.setValue("priceRange", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.priceRange && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.priceRange.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="address">Full Address *</Label>
            <Input
              id="address"
              {...form.register("address")}
              placeholder="Complete street address"
            />
            {form.formState.errors.address && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Describe your restaurant, specialties, atmosphere..."
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...form.register("phone")}
                placeholder="Restaurant phone number"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="Restaurant email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="imageUrl">Restaurant Image URL</Label>
            <Input
              id="imageUrl"
              {...form.register("imageUrl")}
              placeholder="URL to restaurant image"
            />
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Operating Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {days.map((day) => (
            <div key={day.key} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="w-24">
                <Label className="font-medium">{day.label}</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={operatingHours[day.key]?.closed || false}
                  onCheckedChange={(checked) => handleDayToggle(day.key, checked as boolean)}
                />
                <Label className="text-sm">Closed</Label>
              </div>

              {!operatingHours[day.key]?.closed && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={operatingHours[day.key]?.open || ""}
                    onChange={(e) => handleTimeChange(day.key, "open", e.target.value)}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <Input
                    type="time"
                    value={operatingHours[day.key]?.close || ""}
                    onChange={(e) => handleTimeChange(day.key, "close", e.target.value)}
                    className="w-32"
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Service Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Service Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Service Type Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dineInAvailable"
                checked={form.watch("dineInAvailable")}
                onCheckedChange={(checked) => form.setValue("dineInAvailable", checked as boolean)}
              />
              <Label htmlFor="dineInAvailable" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Dine-In Available
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="offersTakeout"
                checked={form.watch("offersTakeout")}
                onCheckedChange={(checked) => form.setValue("offersTakeout", checked as boolean)}
              />
              <Label htmlFor="offersTakeout" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Takeout Available
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="offersDelivery"
                checked={form.watch("offersDelivery")}
                onCheckedChange={(checked) => form.setValue("offersDelivery", checked as boolean)}
              />
              <Label htmlFor="offersDelivery" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Delivery Available
              </Label>
            </div>
          </div>

          {/* Delivery Settings - Only show if delivery is enabled */}
          {form.watch("offersDelivery") && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Delivery Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
                    <Input
                      id="deliveryRadius"
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      {...form.register("deliveryRadius")}
                      placeholder="e.g., 5.0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="deliveryFee">Delivery Fee (€)</Label>
                    <Input
                      id="deliveryFee"
                      type="number"
                      step="0.01"
                      min="0"
                      {...form.register("deliveryFee")}
                      placeholder="e.g., 2.50"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="minimumDeliveryOrder">Minimum Order (€)</Label>
                    <Input
                      id="minimumDeliveryOrder"
                      type="number"
                      step="0.01"
                      min="0"
                      {...form.register("minimumDeliveryOrder")}
                      placeholder="e.g., 15.00"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update Restaurant"}
        </Button>
      </div>
    </form>
  );
}
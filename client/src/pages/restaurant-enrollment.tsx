import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, CheckCircle, Upload, MapPin, Phone, Mail, Globe } from "lucide-react";
import eatOffLogo from "@assets/EatOff_Logo_1750512988041.png";

const restaurantEnrollmentSchema = z.object({
  restaurantName: z.string().min(2, "Restaurant name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  address: z.string().min(10, "Please enter a complete address"),
  city: z.string().min(2, "Please enter city name"),
  postalCode: z.string().min(3, "Please enter postal code"),
  cuisine: z.string().min(1, "Please select a cuisine type"),
  description: z.string().min(20, "Please provide a description of at least 20 characters"),
  website: z.string().url().optional().or(z.literal("")),
  businessLicense: z.string().min(5, "Business license number is required"),
  vatNumber: z.string().optional(),
  estimatedMonthlyOrders: z.string().min(1, "Please select estimated monthly orders"),
  hasDelivery: z.boolean(),
  hasPickup: z.boolean(),
  operatingHours: z.string().min(5, "Please provide operating hours"),
  specialDietaryOptions: z.array(z.string()).optional(),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
  dataProcessingConsent: z.boolean().refine(val => val === true, "You must consent to data processing")
});

type RestaurantEnrollmentForm = z.infer<typeof restaurantEnrollmentSchema>;

const cuisineTypes = [
  "Italian", "Japanese", "Chinese", "French", "Mexican", "Indian", "Thai", 
  "Mediterranean", "American", "Korean", "Vietnamese", "Greek", "Turkish", 
  "Lebanese", "Spanish", "German", "British", "Ethiopian", "Moroccan", "Brazilian"
];

const monthlyOrderRanges = [
  "1-50", "51-100", "101-250", "251-500", "501-1000", "1000+"
];

const dietaryOptions = [
  "Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher", "Organic", "Low-Carb", "Keto"
];

export default function RestaurantEnrollment() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<RestaurantEnrollmentForm>({
    resolver: zodResolver(restaurantEnrollmentSchema),
    defaultValues: {
      restaurantName: "",
      ownerName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      cuisine: "",
      description: "",
      website: "",
      businessLicense: "",
      vatNumber: "",
      estimatedMonthlyOrders: "",
      hasDelivery: false,
      hasPickup: true,
      operatingHours: "",
      specialDietaryOptions: [],
      termsAccepted: false,
      dataProcessingConsent: false
    }
  });

  const onSubmit = async (data: RestaurantEnrollmentForm) => {
    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/restaurant-enrollment', data);
      setIsSubmitted(true);
      toast({
        title: "Application Submitted Successfully!",
        description: "Your restaurant enrollment application has been submitted for review. We'll contact you within 2-3 business days.",
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <img src={eatOffLogo} alt="EatOff" className="h-12 mx-auto mb-4" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Application Submitted Successfully!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Thank you for your interest in joining the EatOff platform. Your restaurant enrollment 
              application has been received and is now under review.
            </p>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">What's Next?</h3>
              <ul className="text-left text-orange-700 dark:text-orange-300 space-y-1">
                <li>• Our team will review your application within 2-3 business days</li>
                <li>• We'll verify your business information and credentials</li>
                <li>• You'll receive an email with the approval status</li>
                <li>• Once approved, you'll get access to the restaurant portal</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Application Reference: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <img src={eatOffLogo} alt="EatOff" className="h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Join the EatOff Platform
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Expand your restaurant's reach with our voucher and ordering platform
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              Restaurant Enrollment Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="restaurantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Your restaurant name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ownerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner/Manager Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            Email Address *
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@restaurant.com" {...field} />
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
                          <FormLabel className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            Phone Number *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Location Information
                  </h3>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Full Address *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main Street, Suite 100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="City name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Restaurant Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Restaurant Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cuisine"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuisine Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select cuisine type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cuisineTypes.map((cuisine) => (
                                <SelectItem key={cuisine} value={cuisine}>
                                  {cuisine}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="estimatedMonthlyOrders"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Monthly Orders *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {monthlyOrderRanges.map((range) => (
                                <SelectItem key={range} value={range}>
                                  {range} orders
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your restaurant, specialties, atmosphere, and what makes it unique..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          Website (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.yourrestaurant.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="operatingHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operating Hours *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Mon-Fri: 11AM-10PM, Sat-Sun: 12PM-11PM" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Business Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="businessLicense"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business License Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Business license #" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VAT Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="VAT registration number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Service Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Service Options
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hasPickup"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Pickup Available</FormLabel>
                            <p className="text-sm text-gray-500">Customers can pick up orders</p>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hasDelivery"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Delivery Available</FormLabel>
                            <p className="text-sm text-gray-500">You offer delivery service</p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Terms and Consent
                  </h3>
                  <FormField
                    control={form.control}
                    name="termsAccepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I accept the Terms and Conditions *
                          </FormLabel>
                          <p className="text-sm text-gray-500">
                            I agree to EatOff's terms of service and commission structure (5.5% per transaction)
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dataProcessingConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Data Processing Consent *
                          </FormLabel>
                          <p className="text-sm text-gray-500">
                            I consent to processing of my business data for platform operations and marketing
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting Application..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
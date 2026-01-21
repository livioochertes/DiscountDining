import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, Calendar } from "lucide-react";
import PackagePreview from "@/components/package-preview";
import { insertVoucherPackageSchema } from "@shared/schema";

const packageFormSchema = insertVoucherPackageSchema.omit({ restaurantId: true }).extend({
  validityType: z.enum(["months", "custom_dates"]).default("months"),
  validityStartDate: z.string().optional(),
  validityEndDate: z.string().optional(),
});

type PackageFormData = z.infer<typeof packageFormSchema>;

interface PackageFormProps {
  onSave: (data: PackageFormData) => void;
  onCancel: () => void;
  initialData?: Partial<PackageFormData>;
  isLoading?: boolean;
}

export default function PackageForm({ onSave, onCancel, initialData, isLoading }: PackageFormProps) {
  const form = useForm<PackageFormData>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      mealCount: initialData?.mealCount || 5,
      pricePerMeal: initialData?.pricePerMeal ? String(initialData.pricePerMeal) : "25.00",
      discountPercentage: initialData?.discountPercentage ? String(initialData.discountPercentage) : "10.00",
      validityMonths: initialData?.validityMonths || 12,
      validityType: (initialData as any)?.validityType || "months",
      validityStartDate: (initialData as any)?.validityStartDate ? new Date((initialData as any).validityStartDate).toISOString().split('T')[0] : "",
      validityEndDate: (initialData as any)?.validityEndDate ? new Date((initialData as any).validityEndDate).toISOString().split('T')[0] : "",
      isActive: initialData?.isActive ?? false,
    },
  });

  const watchedValues = form.watch();
  
  const calculatePreview = () => {
    const mealCount = watchedValues.mealCount || 0;
    const pricePerMeal = parseFloat(watchedValues.pricePerMeal || "0");
    const discount = parseFloat(watchedValues.discountPercentage || "0");
    
    const regularPrice = mealCount * pricePerMeal;
    const customerPrice = regularPrice * (1 - discount / 100);
    const savings = regularPrice - customerPrice;
    
    return {
      regularPrice: regularPrice.toFixed(2),
      customerPrice: customerPrice.toFixed(2),
      savings: savings.toFixed(2)
    };
  };

  const preview = calculatePreview();

  const onSubmit = (data: PackageFormData) => {
    onSave(data);
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-secondary">
        {initialData ? 'Edit Package' : 'Create New Package'}
      </h4>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Family Pack" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="mealCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Meals</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      placeholder="e.g., 15"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pricePerMeal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Meal (€)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      step="0.01" 
                      placeholder="e.g., 32.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="discountPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Percentage (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      max="70" 
                      step="0.01" 
                      placeholder="e.g., 15.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Validity Period Section */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="validityType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Validity Period
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="months" id="months" />
                        <Label htmlFor="months">Validity in months</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom_dates" id="custom_dates" />
                        <Label htmlFor="custom_dates">Custom date range</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedValues.validityType === "months" && (
              <FormField
                control={form.control}
                name="validityMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validity Period (Months)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="36" 
                        placeholder="e.g., 12"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 12)}
                      />
                    </FormControl>
                    <p className="text-sm text-gray-600">Vouchers will be valid for this many months from purchase date</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchedValues.validityType === "custom_dates" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validityStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid From</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="validityEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Package Description</FormLabel>
                <FormControl>
                  <Textarea 
                    rows={3} 
                    placeholder="Describe your package benefits..."
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Live Package Preview */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-3">Live Preview</h5>
            <PackagePreview 
              name={watchedValues.name || "Package Name"}
              mealCount={watchedValues.mealCount || 0}
              pricePerMeal={watchedValues.pricePerMeal || "0"}
              discountPercentage={watchedValues.discountPercentage || "0"}
              validityMonths={watchedValues.validityMonths || 12}
              description={watchedValues.description || undefined}
              showCalculations={true}
            />
          </div>

          {/* Package Creation Tips */}
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>Tips for creating attractive packages:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Offer 3-4 packages with different meal counts (e.g., 5, 12, 25 meals)</li>
                <li>• Higher meal counts can have better discounts (e.g., 10%, 15%, 25%)</li>
                <li>• Consider your average meal price and customer dining frequency</li>
                <li>• Longer validity periods encourage customer loyalty</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <div className="flex space-x-3">
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Package'}
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
    </div>
  );
}

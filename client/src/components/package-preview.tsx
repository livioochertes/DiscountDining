import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Percent, Euro } from "lucide-react";

interface PackagePreviewProps {
  name: string;
  mealCount: number;
  pricePerMeal: string;
  discountPercentage: string;
  validityMonths: number;
  description?: string;
  showCalculations?: boolean;
}

export default function PackagePreview({ 
  name, 
  mealCount, 
  pricePerMeal, 
  discountPercentage, 
  validityMonths,
  description,
  showCalculations = true 
}: PackagePreviewProps) {
  const regularPrice = parseFloat(pricePerMeal || "0") * mealCount;
  const discount = parseFloat(discountPercentage || "0");
  const customerPrice = regularPrice * (1 - discount / 100);
  const savings = regularPrice - customerPrice;

  return (
    <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{name || "Package Name"}</CardTitle>
          <Badge className="bg-accent/10 text-accent">
            {discountPercentage || 0}% OFF
          </Badge>
        </div>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span>{mealCount} meals</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>{validityMonths} months</span>
          </div>
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-gray-500" />
            <span>€{pricePerMeal || 0}/meal</span>
          </div>
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-gray-500" />
            <span>{discountPercentage || 0}% discount</span>
          </div>
        </div>

        {showCalculations && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Regular price:</span>
              <span className="line-through text-gray-500">€{regularPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Customer pays:</span>
              <span className="font-semibold text-accent">€{customerPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-600">Customer saves:</span>
              <span className="text-accent">€{savings.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
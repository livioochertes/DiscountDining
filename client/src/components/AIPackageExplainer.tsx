import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { VoucherPackage } from "@shared/schema";

interface AIPackageExplainerProps {
  package: VoucherPackage;
  originalPrice: number;
  discountedPrice: number;
  savings: number;
}

export function AIPackageExplainer({ 
  package: pkg, 
  originalPrice, 
  discountedPrice, 
  savings 
}: AIPackageExplainerProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const explainMutation = useMutation({
    mutationFn: async (packageData: any) => {
      const response = await apiRequest('POST', '/api/ai/explain-package', { packageData });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setExplanation(data.explanation || "This package offers great value with flexible dining options!");
      setIsExpanded(true);
    },
    onError: () => {
      setExplanation(`This package includes ${pkg.mealCount} meals at a ${pkg.discountPercentage}% discount, saving you €${savings.toFixed(2)}! Valid for ${pkg.validityMonths} months.`);
      setIsExpanded(true);
    }
  });

  const handleExplain = () => {
    const packageData = {
      mealCount: pkg.mealCount,
      originalPrice: originalPrice,
      discountedPrice: discountedPrice,
      discountPercentage: parseFloat(pkg.discountPercentage),
      validityMonths: pkg.validityMonths
    };
    
    explainMutation.mutate(packageData);
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleExplain}
        disabled={explainMutation.isPending}
        className="mt-2 text-xs border-primary/20 hover:border-primary hover:bg-primary/5"
      >
        {explainMutation.isPending ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Getting AI insights...
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3 mr-1 text-primary" />
            AI Explain Value
          </>
        )}
      </Button>
    );
  }

  return (
    <Card className="mt-3 bg-gradient-to-br from-primary/5 to-orange-50 border-primary/20">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Insight
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          {explanation}
        </p>
        <Button
          variant="ghost"
          size="sm"  
          onClick={() => setIsExpanded(false)}
          className="mt-2 h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Hide explanation
        </Button>
      </CardContent>
    </Card>
  );
}
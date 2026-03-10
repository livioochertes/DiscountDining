import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, X, Loader2, Crown, Zap, Building2, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CRMPricingPageProps {
  restaurantId: number;
  currentPlan?: string;
}

const PLANS = [
  {
    slug: "free",
    name: "Free",
    icon: Sparkles,
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Get started with basic customer visibility",
    features: [
      { name: "Customer list view", included: true },
      { name: "Up to 50 customers", included: true },
      { name: "Auto-generated segments", included: true },
      { name: "Customer profiles", included: false },
      { name: "Feedback collection", included: false },
      { name: "Custom segments", included: false },
      { name: "Notes & special dates", included: false },
      { name: "Marketing campaigns", included: false },
      { name: "Automations", included: false },
      { name: "Analytics & reporting", included: false },
    ],
    color: "bg-gray-100 border-gray-200",
    buttonVariant: "outline" as const,
  },
  {
    slug: "starter",
    name: "Starter",
    icon: Zap,
    monthlyPrice: 29,
    yearlyPrice: 290,
    description: "Know your customers better",
    features: [
      { name: "Customer list view", included: true },
      { name: "Up to 200 customers", included: true },
      { name: "Auto-generated segments", included: true },
      { name: "Customer profiles", included: true },
      { name: "Feedback collection", included: true },
      { name: "5 custom segments", included: true },
      { name: "Notes & special dates", included: true },
      { name: "Marketing campaigns", included: false },
      { name: "Automations", included: false },
      { name: "Analytics & reporting", included: false },
    ],
    color: "bg-blue-50 border-blue-200",
    buttonVariant: "default" as const,
    popular: false,
  },
  {
    slug: "professional",
    name: "Professional",
    icon: Crown,
    monthlyPrice: 59,
    yearlyPrice: 590,
    description: "Full CRM power for growing restaurants",
    features: [
      { name: "Customer list view", included: true },
      { name: "Up to 1,000 customers", included: true },
      { name: "Auto-generated segments", included: true },
      { name: "Customer profiles", included: true },
      { name: "Feedback collection", included: true },
      { name: "Unlimited custom segments", included: true },
      { name: "Notes & special dates", included: true },
      { name: "10 campaigns/month", included: true },
      { name: "Automations", included: true },
      { name: "Analytics & reporting", included: true },
    ],
    color: "bg-orange-50 border-orange-200",
    buttonVariant: "default" as const,
    popular: true,
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    icon: Building2,
    monthlyPrice: 99,
    yearlyPrice: 990,
    description: "Unlimited everything for chains & groups",
    features: [
      { name: "Customer list view", included: true },
      { name: "Unlimited customers", included: true },
      { name: "Auto-generated segments", included: true },
      { name: "Customer profiles", included: true },
      { name: "Feedback collection", included: true },
      { name: "Unlimited custom segments", included: true },
      { name: "Notes & special dates", included: true },
      { name: "Unlimited campaigns", included: true },
      { name: "Automations", included: true },
      { name: "Analytics & reporting", included: true },
    ],
    color: "bg-purple-50 border-purple-200",
    buttonVariant: "default" as const,
  },
];

export default function CRMPricingPage({ restaurantId, currentPlan }: CRMPricingPageProps) {
  const [isYearly, setIsYearly] = useState(false);
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: async ({ planSlug, billingPeriod }: { planSlug: string; billingPeriod: string }) => {
      const response = await apiRequest("POST", "/api/crm/subscribe", {
        restaurantId,
        planSlug,
        billingPeriod,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Plan activated successfully!" });
        window.location.reload();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to start subscription",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (planSlug: string) => {
    if (planSlug === currentPlan) return;
    subscribeMutation.mutate({
      planSlug,
      billingPeriod: isYearly ? "yearly" : "monthly",
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-900">CRM for Restaurants</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Know your customers, build loyalty, and grow your business with our HORECA CRM system.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className={`text-sm font-medium ${!isYearly ? "text-gray-900" : "text-gray-500"}`}>Monthly</span>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <span className={`text-sm font-medium ${isYearly ? "text-gray-900" : "text-gray-500"}`}>
            Yearly
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">Save 2 months</Badge>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
          const isCurrentPlan = currentPlan === plan.slug;
          const Icon = plan.icon;

          return (
            <Card
              key={plan.slug}
              className={`relative ${plan.color} ${plan.popular ? "ring-2 ring-orange-400 shadow-lg" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-orange-500 text-white px-3">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-orange-500" />
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <p className="text-sm text-gray-600">{plan.description}</p>
                <div className="pt-2">
                  <span className="text-3xl font-bold">€{price}</span>
                  {price > 0 && (
                    <span className="text-gray-500 text-sm">/{isYearly ? "year" : "month"}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300 shrink-0" />
                      )}
                      <span className={feature.included ? "text-gray-700" : "text-gray-400"}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.buttonVariant}
                  disabled={isCurrentPlan || subscribeMutation.isPending}
                  onClick={() => handleSubscribe(plan.slug)}
                >
                  {subscribeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isCurrentPlan ? "Current Plan" : price === 0 ? "Get Started" : "Subscribe"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

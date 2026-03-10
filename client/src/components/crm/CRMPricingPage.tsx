import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, X, Loader2, Crown, Zap, Building2, Sparkles, ChevronDown, ChevronUp, ArrowUpCircle } from "lucide-react";
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

const PLAN_ORDER = ["free", "starter", "professional", "enterprise"];

export default function CRMPricingPage({ restaurantId, currentPlan }: CRMPricingPageProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
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

  const currentPlanData = PLANS.find(p => p.slug === currentPlan);
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan || "free");
  const hasPaidPlan = currentPlan && currentPlan !== "free";
  const isTopPlan = currentPlan === "enterprise";

  if (hasPaidPlan && !showPlans) {
    const Icon = currentPlanData?.icon || Sparkles;
    return (
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg px-4 py-3 border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <Icon className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">
                {currentPlanData?.name || "Free"} Plan
              </span>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Active</Badge>
            </div>
            <p className="text-xs text-gray-500">{currentPlanData?.description}</p>
          </div>
        </div>
        {!isTopPlan && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPlans(true)}
            className="gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            Change Plan
          </Button>
        )}
      </div>
    );
  }

  if (!hasPaidPlan && !showPlans) {
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

        <PlanGrid
          plans={PLANS}
          currentPlan={currentPlan}
          isYearly={isYearly}
          subscribeMutation={subscribeMutation}
          onSubscribe={handleSubscribe}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800">Change Your Plan</h3>
          {currentPlanData && (
            <Badge variant="outline" className="text-xs">
              Current: {currentPlanData.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${!isYearly ? "text-gray-900" : "text-gray-400"}`}>Monthly</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={`text-xs font-medium ${isYearly ? "text-gray-900" : "text-gray-400"}`}>
              Yearly
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPlans(false)}
            className="text-gray-500"
          >
            <ChevronUp className="w-4 h-4 mr-1" />
            Close
          </Button>
        </div>
      </div>

      <PlanGrid
        plans={PLANS}
        currentPlan={currentPlan}
        isYearly={isYearly}
        subscribeMutation={subscribeMutation}
        onSubscribe={handleSubscribe}
      />
    </div>
  );
}

function PlanGrid({ plans, currentPlan, isYearly, subscribeMutation, onSubscribe }: {
  plans: typeof PLANS;
  currentPlan?: string;
  isYearly: boolean;
  subscribeMutation: any;
  onSubscribe: (slug: string) => void;
}) {
  const currentIndex = PLAN_ORDER.indexOf(currentPlan || "free");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan) => {
        const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
        const isCurrentPlan = currentPlan === plan.slug;
        const planIndex = PLAN_ORDER.indexOf(plan.slug);
        const isDowngrade = planIndex < currentIndex;
        const Icon = plan.icon;

        return (
          <Card
            key={plan.slug}
            className={`relative ${plan.color} ${plan.popular ? "ring-2 ring-orange-400 shadow-lg" : ""} ${isCurrentPlan ? "ring-2 ring-green-400" : ""}`}
          >
            {plan.popular && !isCurrentPlan && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-orange-500 text-white px-3">Most Popular</Badge>
              </div>
            )}
            {isCurrentPlan && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-green-500 text-white px-3">Current Plan</Badge>
              </div>
            )}
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-orange-500" />
                <CardTitle className="text-lg">{plan.name}</CardTitle>
              </div>
              <p className="text-sm text-gray-600">{plan.description}</p>
              <div className="pt-2">
                <span className="text-3xl font-bold">{price === 0 ? "Free" : `€${price}`}</span>
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
                variant={isCurrentPlan ? "outline" : isDowngrade ? "secondary" : plan.buttonVariant}
                disabled={isCurrentPlan || subscribeMutation.isPending}
                onClick={() => onSubscribe(plan.slug)}
              >
                {subscribeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isCurrentPlan
                  ? "Current Plan"
                  : isDowngrade
                    ? "Downgrade"
                    : price === 0
                      ? "Get Started"
                      : "Upgrade"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

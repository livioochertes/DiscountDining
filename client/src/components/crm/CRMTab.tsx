import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, Users, Layers, MessageSquare, Send, Zap, Settings, AlertCircle, BarChart3, Store } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import CRMDashboard from "./CRMDashboard";
import CRMPricingPage from "./CRMPricingPage";
import CustomerList from "./CustomerList";
import FeedbackManager from "./FeedbackManager";
import SegmentManager from "./SegmentManager";
import CRMAnalytics from "./CRMAnalytics";
import AutomationManager from "./AutomationManager";
import CampaignManager from "./CampaignManager";

interface CRMTabProps {
  restaurants: any[];
}

const PAID_PLANS = ["starter", "professional", "enterprise"];

export default function CRMTab({ restaurants }: CRMTabProps) {
  const [crmSubNav, setCrmSubNav] = useState("dashboard");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(
    restaurants.length > 0 ? restaurants[0]?.id : null
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const restaurantId = selectedRestaurantId;
  const selectedRestaurantName = restaurants.find((r: any) => r.id === restaurantId)?.name || "";

  const { data: subscription, isLoading: loadingSub } = useQuery({
    queryKey: ["/api/crm/subscription", restaurantId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/crm/subscription/${restaurantId}`);
      return response.json();
    },
    enabled: !!restaurantId,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/crm/subscription/cancel", {
        restaurantId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Subscription will cancel at period end" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/subscription", restaurantId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  if (!restaurantId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-700">No Restaurant Found</h3>
        <p className="text-gray-500 mt-1">Add a restaurant first to access CRM features.</p>
      </div>
    );
  }

  if (loadingSub) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan || "free";
  const hasPaidPlan = PAID_PLANS.includes(currentPlan);

  return (
    <div className="space-y-6">
      {restaurants.length > 1 && (
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
          <Store className="w-5 h-5 text-orange-500 shrink-0" />
          <span className="text-sm font-medium text-gray-700">Restaurant:</span>
          <Select
            value={String(restaurantId)}
            onValueChange={(v) => {
              setSelectedRestaurantId(parseInt(v));
              setCrmSubNav("dashboard");
            }}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select restaurant" />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map((r: any) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name} {r.location ? `(${r.location})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <CRMPricingPage restaurantId={restaurantId} currentPlan={currentPlan} />

      {hasPaidPlan && (
        <>
          <div className="border-t pt-6">
            <Tabs value={crmSubNav} onValueChange={setCrmSubNav}>
              <TabsList className="grid w-full grid-cols-8 h-auto">
                <TabsTrigger value="dashboard" className="flex items-center gap-1 text-xs">
                  <LayoutDashboard className="w-3 h-3" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="customers" className="flex items-center gap-1 text-xs">
                  <Users className="w-3 h-3" />
                  Customers
                </TabsTrigger>
                <TabsTrigger value="segments" className="flex items-center gap-1 text-xs">
                  <Layers className="w-3 h-3" />
                  Segments
                </TabsTrigger>
                <TabsTrigger value="feedback" className="flex items-center gap-1 text-xs">
                  <MessageSquare className="w-3 h-3" />
                  Feedback
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs">
                  <BarChart3 className="w-3 h-3" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="campaigns" className="flex items-center gap-1 text-xs">
                  <Send className="w-3 h-3" />
                  Campaigns
                </TabsTrigger>
                <TabsTrigger value="automations" className="flex items-center gap-1 text-xs">
                  <Zap className="w-3 h-3" />
                  Automations
                </TabsTrigger>
                <TabsTrigger value="crm-settings" className="flex items-center gap-1 text-xs">
                  <Settings className="w-3 h-3" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                <CRMDashboard restaurantId={restaurantId} subscription={subscription} />
              </TabsContent>

              <TabsContent value="customers">
                <CustomerList restaurantId={restaurantId} />
              </TabsContent>

              <TabsContent value="segments">
                <SegmentManager restaurantId={restaurantId} subscription={subscription} />
              </TabsContent>

              <TabsContent value="feedback">
                <FeedbackManager restaurantId={restaurantId} />
              </TabsContent>

              <TabsContent value="analytics">
                <CRMAnalytics restaurantId={restaurantId} />
              </TabsContent>

              <TabsContent value="campaigns">
                <CampaignManager restaurantId={restaurantId} subscription={subscription} />
              </TabsContent>

              <TabsContent value="automations">
                <AutomationManager restaurantId={restaurantId} />
              </TabsContent>

              <TabsContent value="crm-settings">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">CRM Settings</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Current Plan</p>
                        <p className="text-sm text-gray-500">{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</p>
                      </div>
                      {subscription?.cancelAtPeriodEnd ? (
                        <span className="text-sm text-red-600">Cancels at period end</span>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => cancelMutation.mutate()}
                          disabled={cancelMutation.isPending}
                        >
                          Cancel Subscription
                        </Button>
                      )}
                    </div>
                    {subscription?.currentPeriodEnd && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Current period ends</span>
                        <span>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      {!hasPaidPlan && (
        <div className="border-t pt-6">
          <CRMDashboard restaurantId={restaurantId} subscription={subscription} />
        </div>
      )}
    </div>
  );
}

function PlaceholderSection({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-lg">
      <h3 className="text-lg font-medium text-gray-700">{title}</h3>
      <p className="text-gray-500 mt-2 max-w-md">{description}</p>
      <p className="text-sm text-orange-600 mt-4">Coming in the next update</p>
    </div>
  );
}

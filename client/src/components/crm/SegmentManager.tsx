import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Layers,
  Plus,
  Wand2,
  Trash2,
  Users,
  UserPlus,
  UserMinus,
  Loader2,
  Star,
  TrendingUp,
  UserX,
  Sparkles,
  AlertCircle,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SegmentManagerProps {
  restaurantId: number;
  subscription: any;
}

const SEGMENT_TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  new: { icon: Sparkles, color: "bg-green-100 text-green-700 border-green-200", label: "New" },
  loyal: { icon: TrendingUp, color: "bg-blue-100 text-blue-700 border-blue-200", label: "Loyal" },
  inactive: { icon: UserX, color: "bg-red-100 text-red-700 border-red-200", label: "Inactive" },
  vip: { icon: Star, color: "bg-purple-100 text-purple-700 border-purple-200", label: "VIP" },
  corporate: { icon: Users, color: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "Corporate" },
  custom: { icon: Layers, color: "bg-gray-100 text-gray-700 border-gray-200", label: "Custom" },
};

function getCriteriaDescription(criteria: any, segmentType: string): string {
  if (!criteria) return "";
  if (criteria.firstOrderWithin) return `First order within ${criteria.firstOrderWithin} days`;
  if (criteria.minOrders90Days) return `${criteria.minOrders90Days}+ orders in 90 days`;
  if (criteria.noOrderDays) return `No order in ${criteria.noOrderDays}+ days`;
  if (criteria.topSpendersPercent) return `Top ${criteria.topSpendersPercent}% by spending`;
  const parts: string[] = [];
  if (criteria.minSpending) parts.push(`Min spend: €${criteria.minSpending}`);
  if (criteria.maxSpending) parts.push(`Max spend: €${criteria.maxSpending}`);
  if (criteria.minOrders) parts.push(`Min orders: ${criteria.minOrders}`);
  if (criteria.maxOrders) parts.push(`Max orders: ${criteria.maxOrders}`);
  if (criteria.lastVisitDays) parts.push(`Last visit: ${criteria.lastVisitDays} days`);
  if (criteria.loyaltyTier) parts.push(`Tier: ${criteria.loyaltyTier}`);
  return parts.join(" · ") || "Custom criteria";
}

export default function SegmentManager({ restaurantId, subscription }: SegmentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSegment, setSelectedSegment] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState("");
  const [newSegmentType, setNewSegmentType] = useState("custom");
  const [criteriaMinSpending, setCriteriaMinSpending] = useState("");
  const [criteriaMaxSpending, setCriteriaMaxSpending] = useState("");
  const [criteriaMinOrders, setCriteriaMinOrders] = useState("");
  const [criteriaMaxOrders, setCriteriaMaxOrders] = useState("");
  const [criteriaLastVisitDays, setCriteriaLastVisitDays] = useState("");
  const [criteriaLoyaltyTier, setCriteriaLoyaltyTier] = useState("");
  const [addMemberEmail, setAddMemberEmail] = useState("");

  const plan = subscription?.plan || "free";
  const limits = subscription?.limits || { maxCustomers: 50, maxCampaigns: 0, maxSegments: 0 };
  const canCreateCustom = plan !== "free";

  const { data: segments = [], isLoading } = useQuery({
    queryKey: ["/api/crm/segments", restaurantId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/crm/segments/${restaurantId}`);
      return response.json();
    },
  });

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["/api/crm/segments", restaurantId, selectedSegment?.id, "members"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/crm/segments/${restaurantId}/${selectedSegment.id}/members`);
      return response.json();
    },
    enabled: !!selectedSegment?.id,
  });

  const autoGenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/crm/segments/${restaurantId}/auto-generate`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Segments generated", description: `${data.segments?.length || 0} segments created` });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/segments", restaurantId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to generate segments", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; segmentType: string; criteria: any }) => {
      const response = await apiRequest("POST", `/api/crm/segments/${restaurantId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Segment created" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/segments", restaurantId] });
      resetCreateForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create segment", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (segmentId: number) => {
      const response = await apiRequest("DELETE", `/api/crm/segments/${restaurantId}/${segmentId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Segment deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/segments", restaurantId] });
      setSelectedSegment(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete segment", variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ segmentId, customerId }: { segmentId: number; customerId: number }) => {
      const response = await apiRequest("DELETE", `/api/crm/segments/${restaurantId}/${segmentId}/members/${customerId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Member removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/segments", restaurantId, selectedSegment?.id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/segments", restaurantId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove member", variant: "destructive" });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ segmentId, customerId }: { segmentId: number; customerId: number }) => {
      const response = await apiRequest("POST", `/api/crm/segments/${restaurantId}/${segmentId}/members`, { customerId });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Member added" });
      setAddMemberEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/crm/segments", restaurantId, selectedSegment?.id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/segments", restaurantId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add member", variant: "destructive" });
    },
  });

  function resetCreateForm() {
    setCreateOpen(false);
    setNewSegmentName("");
    setNewSegmentType("custom");
    setCriteriaMinSpending("");
    setCriteriaMaxSpending("");
    setCriteriaMinOrders("");
    setCriteriaMaxOrders("");
    setCriteriaLastVisitDays("");
    setCriteriaLoyaltyTier("");
  }

  function handleCreateSegment() {
    if (!newSegmentName.trim()) {
      toast({ title: "Error", description: "Segment name is required", variant: "destructive" });
      return;
    }
    const criteria: any = {};
    if (criteriaMinSpending) criteria.minSpending = parseFloat(criteriaMinSpending);
    if (criteriaMaxSpending) criteria.maxSpending = parseFloat(criteriaMaxSpending);
    if (criteriaMinOrders) criteria.minOrders = parseInt(criteriaMinOrders);
    if (criteriaMaxOrders) criteria.maxOrders = parseInt(criteriaMaxOrders);
    if (criteriaLastVisitDays) criteria.lastVisitDays = parseInt(criteriaLastVisitDays);
    if (criteriaLoyaltyTier) criteria.loyaltyTier = criteriaLoyaltyTier;
    createMutation.mutate({ name: newSegmentName, segmentType: newSegmentType, criteria });
  }

  const autoSegments = segments.filter((s: any) => s.autoGenerated);
  const customSegments = segments.filter((s: any) => !s.autoGenerated);
  const customSegmentCount = customSegments.length;
  const maxSegments = limits.maxSegments;
  const atLimit = maxSegments !== 999999 && customSegmentCount >= maxSegments;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Segment Manager</h3>
          <p className="text-sm text-gray-600">
            Organize customers into segments for targeted campaigns and insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => autoGenerateMutation.mutate()}
            disabled={autoGenerateMutation.isPending}
          >
            {autoGenerateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            Auto-Generate Segments
          </Button>

          {canCreateCustom ? (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button disabled={atLimit}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Segment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Custom Segment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Segment Name</Label>
                    <Input
                      placeholder="e.g. Weekend Regulars"
                      value={newSegmentName}
                      onChange={(e) => setNewSegmentName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newSegmentType} onValueChange={setNewSegmentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="loyal">Loyal</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Criteria (optional)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Min Spending (€)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={criteriaMinSpending}
                          onChange={(e) => setCriteriaMinSpending(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max Spending (€)</Label>
                        <Input
                          type="number"
                          placeholder="∞"
                          value={criteriaMaxSpending}
                          onChange={(e) => setCriteriaMaxSpending(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Min Orders</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={criteriaMinOrders}
                          onChange={(e) => setCriteriaMinOrders(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max Orders</Label>
                        <Input
                          type="number"
                          placeholder="∞"
                          value={criteriaMaxOrders}
                          onChange={(e) => setCriteriaMaxOrders(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Last Visit (days ago)</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 30"
                          value={criteriaLastVisitDays}
                          onChange={(e) => setCriteriaLastVisitDays(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Loyalty Tier</Label>
                        <Select value={criteriaLoyaltyTier} onValueChange={setCriteriaLoyaltyTier}>
                          <SelectTrigger>
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            <SelectItem value="bronze">Bronze</SelectItem>
                            <SelectItem value="silver">Silver</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="platinum">Platinum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleCreateSegment} disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button disabled className="gap-2">
              <Lock className="w-4 h-4" />
              Upgrade to Create Segments
            </Button>
          )}
        </div>
      </div>

      {canCreateCustom && maxSegments !== 999999 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <AlertCircle className="w-4 h-4" />
          Custom segments: {customSegmentCount} / {maxSegments}
          {atLimit && <span className="text-orange-600 font-medium ml-2">Limit reached — upgrade for more</span>}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : segments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="w-12 h-12 text-gray-300 mb-4" />
            <h4 className="text-lg font-medium text-gray-700">No Segments Yet</h4>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Click "Auto-Generate Segments" to create default segments based on customer behavior,
              or create custom segments manually.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {autoSegments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Auto-Generated</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {autoSegments.map((seg: any) => (
                  <SegmentCard
                    key={seg.id}
                    segment={seg}
                    onSelect={() => setSelectedSegment(seg)}
                    onDelete={() => deleteMutation.mutate(seg.id)}
                    deleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {customSegments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Custom Segments</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customSegments.map((seg: any) => (
                  <SegmentCard
                    key={seg.id}
                    segment={seg}
                    onSelect={() => setSelectedSegment(seg)}
                    onDelete={() => deleteMutation.mutate(seg.id)}
                    deleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Sheet open={!!selectedSegment} onOpenChange={(open) => !open && setSelectedSegment(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedSegment && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {(() => {
                    const cfg = SEGMENT_TYPE_CONFIG[selectedSegment.segmentType] || SEGMENT_TYPE_CONFIG.custom;
                    const Icon = cfg.icon;
                    return <Icon className="w-5 h-5" />;
                  })()}
                  {selectedSegment.name}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={SEGMENT_TYPE_CONFIG[selectedSegment.segmentType]?.color || SEGMENT_TYPE_CONFIG.custom.color}>
                    {SEGMENT_TYPE_CONFIG[selectedSegment.segmentType]?.label || "Custom"}
                  </Badge>
                  {selectedSegment.autoGenerated && (
                    <Badge variant="outline" className="text-xs">Auto-generated</Badge>
                  )}
                  <Badge variant="secondary">{selectedSegment.memberCount || 0} members</Badge>
                </div>

                {selectedSegment.criteria && (
                  <p className="text-sm text-gray-600">
                    {getCriteriaDescription(selectedSegment.criteria, selectedSegment.segmentType)}
                  </p>
                )}

                {canCreateCustom && !selectedSegment.autoGenerated && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-2">Add Member by Customer ID</h4>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Customer ID"
                        value={addMemberEmail}
                        onChange={(e) => setAddMemberEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const cid = parseInt(addMemberEmail);
                          if (!cid) {
                            toast({ title: "Error", description: "Enter a valid customer ID", variant: "destructive" });
                            return;
                          }
                          addMemberMutation.mutate({ segmentId: selectedSegment.id, customerId: cid });
                        }}
                        disabled={addMemberMutation.isPending}
                      >
                        {addMemberMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Members ({members.length})
                  </h4>

                  {loadingMembers ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : members.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">No members in this segment.</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {members.map((member: any) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {member.name || member.email || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                          {canCreateCustom && !selectedSegment.autoGenerated && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMemberMutation.mutate({ segmentId: selectedSegment.id, customerId: member.id })}
                              disabled={removeMemberMutation.isPending}
                            >
                              <UserMinus className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SegmentCard({
  segment,
  onSelect,
  onDelete,
  deleting,
}: {
  segment: any;
  onSelect: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const cfg = SEGMENT_TYPE_CONFIG[segment.segmentType] || SEGMENT_TYPE_CONFIG.custom;
  const Icon = cfg.icon;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow group"
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${cfg.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{segment.name}</CardTitle>
              <Badge variant="outline" className="text-xs mt-1">
                {cfg.label}
              </Badge>
            </div>
          </div>
          {!segment.autoGenerated && (
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-3.5 h-3.5" />
          <span className="font-medium">{segment.memberCount || 0}</span>
          <span>members</span>
        </div>
        {segment.criteria && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
            {getCriteriaDescription(segment.criteria, segment.segmentType)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

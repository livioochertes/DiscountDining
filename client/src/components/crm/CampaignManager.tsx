import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Send,
  Plus,
  Trash2,
  Mail,
  MessageSquare,
  Bell,
  Loader2,
  Users,
  Calendar,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CampaignManagerProps {
  restaurantId: number;
  subscription: any;
}

const CHANNEL_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  email: { icon: Mail, label: "Email", color: "bg-blue-100 text-blue-700 border-blue-200" },
  sms: { icon: MessageSquare, label: "SMS", color: "bg-green-100 text-green-700 border-green-200" },
  push: { icon: Bell, label: "Push", color: "bg-purple-100 text-purple-700 border-purple-200" },
};

const STATUS_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  draft: { icon: Clock, label: "Draft", color: "bg-gray-100 text-gray-700 border-gray-200" },
  scheduled: { icon: Calendar, label: "Scheduled", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  sending: { icon: Loader2, label: "Sending", color: "bg-blue-100 text-blue-700 border-blue-200" },
  sent: { icon: CheckCircle2, label: "Sent", color: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { icon: XCircle, label: "Cancelled", color: "bg-red-100 text-red-700 border-red-200" },
};

const TEMPLATE_VARS = [
  { var: "{customer_name}", desc: "Full name" },
  { var: "{first_name}", desc: "First name" },
  { var: "{restaurant_name}", desc: "Restaurant name" },
];

export default function CampaignManager({ restaurantId, subscription }: CampaignManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<any>(null);

  const [name, setName] = useState("");
  const [channelType, setChannelType] = useState("email");
  const [segmentId, setSegmentId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const plan = subscription?.plan || "free";
  const limits = subscription?.limits || { maxCampaigns: 0 };

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["/api/crm/campaigns", restaurantId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/crm/campaigns/${restaurantId}`);
      return response.json();
    },
  });

  const { data: segments = [] } = useQuery({
    queryKey: ["/api/crm/segments", restaurantId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/crm/segments/${restaurantId}`);
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/crm/campaigns/${restaurantId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Campaign created" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/campaigns", restaurantId] });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create campaign", variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      const response = await apiRequest("POST", `/api/crm/campaigns/${restaurantId}/${campaignId}/send`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Campaign sent", description: `Sent to ${data.sentCount} of ${data.totalRecipients} recipients` });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/campaigns", restaurantId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to send campaign", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      const response = await apiRequest("DELETE", `/api/crm/campaigns/${restaurantId}/${campaignId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Campaign deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/campaigns", restaurantId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete campaign", variant: "destructive" });
    },
  });

  function resetForm() {
    setCreateOpen(false);
    setName("");
    setChannelType("email");
    setSegmentId("");
    setSubject("");
    setMessageBody("");
    setScheduledAt("");
  }

  function handleCreate() {
    if (!name.trim()) {
      toast({ title: "Error", description: "Campaign name is required", variant: "destructive" });
      return;
    }
    if (!messageBody.trim()) {
      toast({ title: "Error", description: "Message body is required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      name,
      channelType,
      segmentId: segmentId ? parseInt(segmentId) : null,
      subject: channelType === "email" ? subject : null,
      messageBody,
      scheduledAt: scheduledAt || null,
    });
  }

  function renderPreview(body: string) {
    return body
      .replace(/\{customer_name\}/g, "John Doe")
      .replace(/\{first_name\}/g, "John")
      .replace(/\{restaurant_name\}/g, "Your Restaurant");
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const campaignsThisMonth = campaigns.filter((c: any) => new Date(c.createdAt) >= monthStart).length;
  const maxCampaigns = limits.maxCampaigns;
  const atLimit = maxCampaigns !== 999999 && campaignsThisMonth >= maxCampaigns;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Campaign Manager</h3>
          <p className="text-sm text-gray-600">
            Create and send targeted marketing campaigns to your customer segments.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={atLimit}>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                  placeholder="e.g. Weekend Special Promotion"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select value={channelType} onValueChange={setChannelType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Segment</Label>
                  <Select value={segmentId} onValueChange={setSegmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      {segments.map((seg: any) => (
                        <SelectItem key={seg.id} value={String(seg.id)}>
                          {seg.name} ({seg.memberCount || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {channelType === "email" && (
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input
                    placeholder="e.g. Your exclusive offer awaits!"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Message Body</Label>
                <Textarea
                  placeholder="Write your message here..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  rows={6}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500">Template variables:</span>
                  {TEMPLATE_VARS.map((tv) => (
                    <button
                      key={tv.var}
                      type="button"
                      className="text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-0.5 font-mono transition-colors"
                      onClick={() => setMessageBody((prev) => prev + tv.var)}
                    >
                      {tv.var}
                    </button>
                  ))}
                </div>
              </div>

              {messageBody && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Preview
                  </Label>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap border">
                    {channelType === "email" && subject && (
                      <p className="font-semibold mb-2 pb-2 border-b">{renderPreview(subject)}</p>
                    )}
                    {renderPreview(messageBody)}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Schedule (optional)</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Leave empty to save as draft and send manually.
                </p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {scheduledAt ? "Schedule" : "Save as Draft"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {maxCampaigns !== 999999 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <AlertCircle className="w-4 h-4" />
          Campaigns this month: {campaignsThisMonth} / {maxCampaigns}
          {atLimit && <span className="text-orange-600 font-medium ml-2">Limit reached — upgrade for more</span>}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Send className="w-12 h-12 text-gray-300 mb-4" />
            <h4 className="text-lg font-medium text-gray-700">No Campaigns Yet</h4>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Create your first campaign to engage customers via email, SMS, or push notifications.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign: any) => {
            const channelCfg = CHANNEL_CONFIG[campaign.channelType] || CHANNEL_CONFIG.email;
            const statusCfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
            const ChannelIcon = channelCfg.icon;
            const StatusIcon = statusCfg.icon;
            const targetSegment = segments.find((s: any) => s.id === campaign.segmentId);

            return (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">{campaign.name}</h4>
                        <Badge className={channelCfg.color} variant="outline">
                          <ChannelIcon className="w-3 h-3 mr-1" />
                          {channelCfg.label}
                        </Badge>
                        <Badge className={statusCfg.color} variant="outline">
                          <StatusIcon className={`w-3 h-3 mr-1 ${campaign.status === "sending" ? "animate-spin" : ""}`} />
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {targetSegment ? (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {targetSegment.name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            All customers
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          {campaign.recipientCount} recipients
                        </span>
                        {campaign.sentAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Sent {new Date(campaign.sentAt).toLocaleDateString()}
                          </span>
                        )}
                        {campaign.scheduledAt && campaign.status === "scheduled" && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Scheduled {new Date(campaign.scheduledAt).toLocaleString()}
                          </span>
                        )}
                        {!campaign.sentAt && !campaign.scheduledAt && (
                          <span>
                            Created {new Date(campaign.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPreviewCampaign(campaign);
                          setPreviewOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {(campaign.status === "draft" || campaign.status === "scheduled") && (
                        <Button
                          size="sm"
                          onClick={() => sendMutation.mutate(campaign.id)}
                          disabled={sendMutation.isPending}
                        >
                          {sendMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-1" />
                          )}
                          Send
                        </Button>
                      )}
                      {campaign.status !== "sending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(campaign.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Campaign Preview</DialogTitle>
          </DialogHeader>
          {previewCampaign && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={CHANNEL_CONFIG[previewCampaign.channelType]?.color || ""} variant="outline">
                  {CHANNEL_CONFIG[previewCampaign.channelType]?.label || previewCampaign.channelType}
                </Badge>
                <Badge className={STATUS_CONFIG[previewCampaign.status]?.color || ""} variant="outline">
                  {STATUS_CONFIG[previewCampaign.status]?.label || previewCampaign.status}
                </Badge>
              </div>
              {previewCampaign.subject && (
                <div>
                  <Label className="text-xs text-gray-500">Subject</Label>
                  <p className="font-medium">{previewCampaign.subject}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-500">Message</Label>
                <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap border mt-1">
                  {renderPreview(previewCampaign.messageBody)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Recipients:</span>{" "}
                  <span className="font-medium">{previewCampaign.recipientCount}</span>
                </div>
                {previewCampaign.sentAt && (
                  <div>
                    <span className="text-gray-500">Sent:</span>{" "}
                    <span className="font-medium">{new Date(previewCampaign.sentAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

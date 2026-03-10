import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Gift, Clock, UserPlus, Heart, CalendarCheck, Mail, MessageSquare, Bell, Zap } from "lucide-react";

interface AutomationManagerProps {
  restaurantId: number;
}

interface Automation {
  id?: number;
  restaurantId: number;
  triggerType: string;
  channelType: string;
  messageTemplate: string;
  delayHours: number;
  isActive: boolean;
  inactivityDays: number;
}

const AUTOMATION_PRESETS = [
  {
    triggerType: "welcome",
    title: "Welcome Message",
    description: "Send a welcome message after a customer's first order",
    icon: UserPlus,
    color: "text-green-600",
    bgColor: "bg-green-50",
    defaultDelay: 1,
    defaultMessage: "Hi {customer_name}! Welcome to {restaurant_name}! 🎉 We're so glad you chose us. We hope you enjoyed your first experience with us!",
    showInactivity: false,
  },
  {
    triggerType: "post_order",
    title: "Post-Visit Thank You",
    description: "Thank customers after their order is completed",
    icon: Heart,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    defaultDelay: 24,
    defaultMessage: "Thank you for visiting {restaurant_name}, {customer_name}! We hope you had a wonderful experience. See you again soon! 😊",
    showInactivity: false,
  },
  {
    triggerType: "birthday",
    title: "Birthday Greeting",
    description: "Send birthday wishes with an optional voucher",
    icon: Gift,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    defaultDelay: 0,
    defaultMessage: "Happy Birthday, {customer_name}! 🎂🎉 {restaurant_name} wishes you a wonderful day! Come celebrate with us and enjoy a special treat!",
    showInactivity: false,
  },
  {
    triggerType: "inactive_reengagement",
    title: "Inactive Re-engagement",
    description: "Re-engage customers who haven't ordered in a while",
    icon: Clock,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    defaultDelay: 0,
    defaultMessage: "Hey {customer_name}, we miss you at {restaurant_name}! 😢 It's been a while since your last visit. Come back and discover our latest dishes!",
    showInactivity: true,
  },
  {
    triggerType: "reservation_followup",
    title: "Reservation Follow-up",
    description: "Follow up after a completed reservation",
    icon: CalendarCheck,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    defaultDelay: 2,
    defaultMessage: "Thank you for dining with us at {restaurant_name}, {customer_name}! We hope your reservation experience was excellent. We'd love to see you again! ⭐",
    showInactivity: false,
  },
];

const CHANNEL_OPTIONS = [
  { value: "push", label: "Push Notification", icon: Bell },
  { value: "email", label: "Email", icon: Mail },
  { value: "sms", label: "SMS", icon: MessageSquare },
];

export default function AutomationManager({ restaurantId }: AutomationManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingType, setEditingType] = useState<string | null>(null);

  const { data: automations = [], isLoading } = useQuery<Automation[]>({
    queryKey: ["/api/crm/automations", restaurantId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/crm/automations/${restaurantId}`);
      return res.json();
    },
    enabled: !!restaurantId,
  });

  const saveMutation = useMutation({
    mutationFn: async (automation: Partial<Automation> & { triggerType: string }) => {
      const existing = automations.find(a => a.triggerType === automation.triggerType);
      if (existing?.id) {
        const res = await apiRequest("PATCH", `/api/crm/automations/${restaurantId}/${existing.id}`, automation);
        return res.json();
      } else {
        const res = await apiRequest("POST", `/api/crm/automations/${restaurantId}`, automation);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/automations", restaurantId] });
      toast({ title: "Automation saved" });
      setEditingType(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save automation", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ triggerType, isActive, preset }: { triggerType: string; isActive: boolean; preset: typeof AUTOMATION_PRESETS[0] }) => {
      const existing = automations.find(a => a.triggerType === triggerType);
      if (existing?.id) {
        const res = await apiRequest("PATCH", `/api/crm/automations/${restaurantId}/${existing.id}`, { isActive });
        return res.json();
      } else {
        const res = await apiRequest("POST", `/api/crm/automations/${restaurantId}`, {
          triggerType,
          channelType: "push",
          messageTemplate: preset.defaultMessage,
          delayHours: preset.defaultDelay,
          isActive,
          inactivityDays: 60,
        });
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/automations", restaurantId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to toggle automation", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-40" />)}
      </div>
    );
  }

  function getAutomation(triggerType: string) {
    return automations.find(a => a.triggerType === triggerType);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="w-6 h-6 text-orange-500" />
        <div>
          <h3 className="text-lg font-semibold">Automations</h3>
          <p className="text-sm text-gray-500">Set up automated messages triggered by customer actions</p>
        </div>
      </div>

      <div className="grid gap-4">
        {AUTOMATION_PRESETS.map(preset => {
          const automation = getAutomation(preset.triggerType);
          const isEditing = editingType === preset.triggerType;
          const Icon = preset.icon;

          return (
            <AutomationCard
              key={preset.triggerType}
              preset={preset}
              automation={automation}
              isEditing={isEditing}
              onToggle={(isActive) => toggleMutation.mutate({ triggerType: preset.triggerType, isActive, preset })}
              onEdit={() => setEditingType(isEditing ? null : preset.triggerType)}
              onSave={(data) => saveMutation.mutate({ ...data, triggerType: preset.triggerType })}
              isSaving={saveMutation.isPending}
              isToggling={toggleMutation.isPending}
            />
          );
        })}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-1">How automations work</h4>
        <p className="text-sm text-gray-500">
          Active automations are checked every hour. When trigger conditions are met,
          messages are sent via your chosen channel. Each customer receives a message only
          once per trigger event to avoid spam.
        </p>
      </div>
    </div>
  );
}

interface AutomationCardProps {
  preset: typeof AUTOMATION_PRESETS[0];
  automation: Automation | undefined;
  isEditing: boolean;
  onToggle: (isActive: boolean) => void;
  onEdit: () => void;
  onSave: (data: Partial<Automation>) => void;
  isSaving: boolean;
  isToggling: boolean;
}

function AutomationCard({ preset, automation, isEditing, onToggle, onEdit, onSave, isSaving, isToggling }: AutomationCardProps) {
  const Icon = preset.icon;
  const isActive = automation?.isActive ?? false;
  const channelType = automation?.channelType || "push";
  const messageTemplate = automation?.messageTemplate || preset.defaultMessage;
  const delayHours = automation?.delayHours ?? preset.defaultDelay;
  const inactivityDays = automation?.inactivityDays ?? 60;

  const [localChannel, setLocalChannel] = useState(channelType);
  const [localMessage, setLocalMessage] = useState(messageTemplate);
  const [localDelay, setLocalDelay] = useState(delayHours);
  const [localInactivity, setLocalInactivity] = useState(inactivityDays);

  const channelInfo = CHANNEL_OPTIONS.find(c => c.value === (automation?.channelType || "push"));
  const ChannelIcon = channelInfo?.icon || Bell;

  return (
    <Card className={`transition-all ${isActive ? "border-green-200 shadow-sm" : "border-gray-200"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${preset.bgColor}`}>
              <Icon className={`w-5 h-5 ${preset.color}`} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {preset.title}
                {isActive && <Badge variant="outline" className="text-green-600 border-green-200 text-xs">Active</Badge>}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">{preset.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {automation && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <ChannelIcon className="w-3.5 h-3.5" />
                <span>{channelInfo?.label}</span>
              </div>
            )}
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => onToggle(checked)}
              disabled={isToggling}
            />
          </div>
        </div>
      </CardHeader>

      {!isEditing && automation && (
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-xs text-gray-500">
              {preset.defaultDelay > 0 && (
                <span>Delay: {automation.delayHours}h</span>
              )}
              {preset.showInactivity && (
                <span>Inactivity threshold: {automation.inactivityDays} days</span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onEdit} className="text-xs">
              Configure
            </Button>
          </div>
        </CardContent>
      )}

      {!isEditing && !automation && (
        <CardContent className="pt-0">
          <Button variant="ghost" size="sm" onClick={onEdit} className="text-xs">
            Configure
          </Button>
        </CardContent>
      )}

      {isEditing && (
        <CardContent className="space-y-4 border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Channel</Label>
              <Select value={localChannel} onValueChange={setLocalChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {preset.defaultDelay > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Delay (hours)</Label>
                <Input
                  type="number"
                  min={0}
                  max={168}
                  value={localDelay}
                  onChange={(e) => setLocalDelay(parseInt(e.target.value) || 0)}
                />
              </div>
            )}

            {preset.showInactivity && (
              <div className="space-y-2">
                <Label className="text-sm">Inactivity Threshold (days)</Label>
                <Input
                  type="number"
                  min={7}
                  max={365}
                  value={localInactivity}
                  onChange={(e) => setLocalInactivity(parseInt(e.target.value) || 60)}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Message Template</Label>
            <Textarea
              value={localMessage}
              onChange={(e) => setLocalMessage(e.target.value)}
              rows={3}
              className="text-sm"
            />
            <p className="text-xs text-gray-400">
              Variables: {"{customer_name}"}, {"{first_name}"}, {"{restaurant_name}"}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSaving || !localMessage.trim()}
              onClick={() => onSave({
                channelType: localChannel,
                messageTemplate: localMessage,
                delayHours: localDelay,
                inactivityDays: localInactivity,
                isActive: automation?.isActive ?? false,
              })}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

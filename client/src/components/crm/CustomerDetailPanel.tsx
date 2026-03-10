import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  User, ShoppingBag, Calendar, Star, StickyNote, Gift,
  Clock, Heart, AlertTriangle, Utensils, Plus, Trash2, X,
  TrendingUp, Hash, Mail, Phone
} from "lucide-react";

interface CustomerDetailPanelProps {
  restaurantId: number;
  customerId: number;
  onClose: () => void;
}

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-800",
  silver: "bg-gray-200 text-gray-700",
  gold: "bg-yellow-100 text-yellow-800",
  platinum: "bg-purple-100 text-purple-800",
  black: "bg-black text-white",
};

export default function CustomerDetailPanel({ restaurantId, customerId, onClose }: CustomerDetailPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("activity");
  const [newNote, setNewNote] = useState("");
  const [newDateType, setNewDateType] = useState("birthday");
  const [newEventDate, setNewEventDate] = useState("");
  const [newDateLabel, setNewDateLabel] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/crm/customers", restaurantId, customerId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/crm/customers/${restaurantId}/${customerId}`);
      return response.json();
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (noteText: string) => {
      const response = await apiRequest("POST", `/api/crm/notes/${restaurantId}`, { customerId, noteText });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Note added" });
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["/api/crm/customers", restaurantId, customerId] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to add note", variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      await apiRequest("DELETE", `/api/crm/notes/${restaurantId}/${noteId}`);
    },
    onSuccess: () => {
      toast({ title: "Note deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/customers", restaurantId, customerId] });
    },
  });

  const addDateMutation = useMutation({
    mutationFn: async (payload: { dateType: string; eventDate: string; label?: string }) => {
      const response = await apiRequest("POST", `/api/crm/special-dates/${restaurantId}`, {
        customerId,
        ...payload,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Special date added" });
      setNewEventDate("");
      setNewDateLabel("");
      queryClient.invalidateQueries({ queryKey: ["/api/crm/customers", restaurantId, customerId] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to add date", variant: "destructive" });
    },
  });

  const deleteDateMutation = useMutation({
    mutationFn: async (dateId: number) => {
      await apiRequest("DELETE", `/api/crm/special-dates/${restaurantId}/${dateId}`);
    },
    onSuccess: () => {
      toast({ title: "Date removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/customers", restaurantId, customerId] });
    },
  });

  const customer = data?.customer;
  const stats = data?.stats;
  const orders = data?.orders || [];
  const reservations = data?.reservations || [];
  const feedback = data?.feedback || [];
  const notes = data?.notes || [];
  const specialDates = data?.specialDates || [];
  const favoriteProducts = data?.favoriteProducts || [];
  const segments = data?.segments || [];

  function getDisplayName(): string {
    return customer?.name || customer?.email || "Customer";
  }

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Customer Profile</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !customer ? (
          <p className="text-gray-500 mt-8 text-center">Customer not found or insufficient permissions.</p>
        ) : (
          <div className="space-y-5 mt-4">
            <div className="flex items-start gap-4">
              {customer.profilePicture ? (
                <img src={customer.profilePicture} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xl font-bold">
                  {(customer.name?.[0] || customer.email?.[0] || "?").toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate">{getDisplayName()}</h3>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {customer.membershipTier && (
                    <Badge className={TIER_COLORS[customer.membershipTier] || "bg-gray-100 text-gray-700"}>
                      {customer.membershipTier}
                    </Badge>
                  )}
                  {segments.map((seg: any) => (
                    <Badge key={seg.segmentId} variant="outline" className="text-xs">
                      {seg.name}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                  {customer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {customer.email}
                    </span>
                  )}
                  {customer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {customer.phone}
                    </span>
                  )}
                  {customer.customerCode && (
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" /> {customer.customerCode}
                    </span>
                  )}
                </div>
                {customer.createdAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    Member since {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total Spent" value={`€${(stats?.totalSpent || 0).toFixed(2)}`} icon={TrendingUp} />
              <StatCard label="Orders" value={String(stats?.orderCount || 0)} icon={ShoppingBag} />
              <StatCard label="Avg Order" value={`€${(stats?.avgOrderValue || 0).toFixed(2)}`} icon={ShoppingBag} />
              <StatCard label="Visit Freq" value={`${(stats?.visitFrequency || 0).toFixed(1)}/mo`} icon={Clock} />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 h-auto">
                <TabsTrigger value="activity" className="text-xs px-1">
                  <Clock className="w-3 h-3 mr-1 hidden sm:inline" />Activity
                </TabsTrigger>
                <TabsTrigger value="preferences" className="text-xs px-1">
                  <Heart className="w-3 h-3 mr-1 hidden sm:inline" />Prefs
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs px-1">
                  <StickyNote className="w-3 h-3 mr-1 hidden sm:inline" />Notes
                </TabsTrigger>
                <TabsTrigger value="events" className="text-xs px-1">
                  <Gift className="w-3 h-3 mr-1 hidden sm:inline" />Events
                </TabsTrigger>
                <TabsTrigger value="feedback" className="text-xs px-1">
                  <Star className="w-3 h-3 mr-1 hidden sm:inline" />Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="mt-3 space-y-2 max-h-[400px] overflow-y-auto">
                {orders.length === 0 && reservations.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">No activity yet</p>
                ) : (
                  <>
                    {buildTimeline(orders, reservations).map((item, idx) => (
                      <div key={idx} className="flex gap-3 p-2 rounded-lg bg-gray-50 text-sm">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.type === "order" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                          {item.type === "order" ? <ShoppingBag className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.subtitle}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{item.date}</span>
                      </div>
                    ))}
                  </>
                )}
              </TabsContent>

              <TabsContent value="preferences" className="mt-3 space-y-4">
                {customer.dietaryPreferences && customer.dietaryPreferences.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                      <Utensils className="w-3 h-3" /> Dietary Preferences
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {customer.dietaryPreferences.map((p: string) => (
                        <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {customer.allergies && customer.allergies.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-500" /> Allergens
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {customer.allergies.map((a: string) => (
                        <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {favoriteProducts.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-pink-500" /> Favorite Products
                    </p>
                    <div className="space-y-1">
                      {favoriteProducts.map((fp: any) => (
                        <div key={fp.name} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-1.5">
                          <span>{fp.name}</span>
                          <span className="text-xs text-gray-500">{fp.count}×</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(!customer.dietaryPreferences || customer.dietaryPreferences.length === 0) &&
                 (!customer.allergies || customer.allergies.length === 0) &&
                 favoriteProducts.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-6">No preference data available</p>
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a note about this customer..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <Button
                    size="sm"
                    className="shrink-0"
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                    onClick={() => addNoteMutation.mutate(newNote.trim())}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {notes.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No notes yet</p>
                  ) : (
                    notes.map((note: any) => (
                      <div key={note.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg group">
                        <StickyNote className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{note.noteText}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 text-red-500"
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="events" className="mt-3 space-y-3">
                <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex gap-2">
                    <Select value={newDateType} onValueChange={setNewDateType}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="birthday">Birthday</SelectItem>
                        <SelectItem value="anniversary">Anniversary</SelectItem>
                        <SelectItem value="name_day">Name Day</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  {newDateType === "custom" && (
                    <Input
                      placeholder="Label (e.g., Wedding anniversary)"
                      value={newDateLabel}
                      onChange={(e) => setNewDateLabel(e.target.value)}
                    />
                  )}
                  <Button
                    size="sm"
                    disabled={!newEventDate || addDateMutation.isPending}
                    onClick={() =>
                      addDateMutation.mutate({
                        dateType: newDateType,
                        eventDate: newEventDate,
                        label: newDateLabel || undefined,
                      })
                    }
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Date
                  </Button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {specialDates.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No special dates</p>
                  ) : (
                    specialDates.map((d: any) => (
                      <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
                        <Gift className={`w-4 h-4 shrink-0 ${d.dateType === "birthday" ? "text-pink-500" : d.dateType === "anniversary" ? "text-red-500" : "text-blue-500"}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium capitalize">
                            {d.label || d.dateType.replace("_", " ")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {d.eventDate ? new Date(d.eventDate).toLocaleDateString() : ""}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 text-red-500"
                          onClick={() => deleteDateMutation.mutate(d.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="feedback" className="mt-3 space-y-2 max-h-[400px] overflow-y-auto">
                {feedback.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">No feedback from this customer</p>
                ) : (
                  feedback.map((fb: any) => (
                    <div key={fb.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${s <= (fb.overallRating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">
                          {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      {(fb.foodRating || fb.serviceRating || fb.ambienceRating) && (
                        <div className="flex gap-3 text-xs text-gray-500">
                          {fb.foodRating && <span>Food: {fb.foodRating}/5</span>}
                          {fb.serviceRating && <span>Service: {fb.serviceRating}/5</span>}
                          {fb.ambienceRating && <span>Ambience: {fb.ambienceRating}/5</span>}
                        </div>
                      )}
                      {fb.comment && <p className="text-sm text-gray-700">{fb.comment}</p>}
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">{label}</span>
        </div>
        <p className="text-sm font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function buildTimeline(orders: any[], reservations: any[]) {
  const items: { type: string; title: string; subtitle: string; date: string; sortDate: Date }[] = [];

  for (const o of orders) {
    items.push({
      type: "order",
      title: `Order #${o.orderNumber || o.id}`,
      subtitle: `€${parseFloat(o.totalAmount || "0").toFixed(2)} · ${o.status || "completed"}`,
      date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "",
      sortDate: o.createdAt ? new Date(o.createdAt) : new Date(0),
    });
  }

  for (const r of reservations) {
    items.push({
      type: "reservation",
      title: `Reservation`,
      subtitle: `${r.partySize || "?"} guests · ${r.status || "confirmed"}`,
      date: r.reservationDate ? new Date(r.reservationDate).toLocaleDateString() : "",
      sortDate: r.reservationDate ? new Date(r.reservationDate) : new Date(0),
    });
  }

  items.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
  return items;
}

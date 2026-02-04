import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Star, MapPin, ArrowLeft, Calendar, Clock, Users, Phone, Mail, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RestaurantReservationsPage() {
  const params = useParams();
  const restaurantId = params.restaurantId ? parseInt(params.restaurantId) : null;
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState("");
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [specialRequests, setSpecialRequests] = useState("");

  const { data: restaurantData, isLoading } = useQuery({
    queryKey: ['/api/restaurants', restaurantId, 'full'],
    queryFn: async () => {
      if (!restaurantId) return null;
      const response = await fetch(`/api/restaurants/${restaurantId}/full`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch restaurant data');
      return response.json();
    },
    enabled: !!restaurantId,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const restaurant = restaurantData?.restaurant;

  const createReservationMutation = useMutation({
    mutationFn: async (reservationData: any) => {
      return await apiRequest("POST", "/api/reservations", reservationData);
    },
    onSuccess: () => {
      toast({
        title: "Rezervare trimisă",
        description: "Rezervarea ta a fost trimisă. Restaurantul o va confirma în curând.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut crea rezervarea. Te rugăm să încerci din nou.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setDate("");
    setTime("");
    setPartySize("");
    setCustomerName(user?.name || "");
    setCustomerPhone(user?.phone || "");
    setCustomerEmail(user?.email || "");
    setSpecialRequests("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setLocation('/auth');
      return;
    }

    if (!date || !time || !partySize || !customerName || !customerPhone) {
      toast({
        title: "Câmpuri lipsă",
        description: "Te rugăm să completezi toate câmpurile obligatorii.",
        variant: "destructive",
      });
      return;
    }

    const reservationDateTime = new Date(`${date}T${time}`);

    createReservationMutation.mutate({
      restaurantId: restaurantId,
      userId: user.id,
      reservationDate: reservationDateTime.toISOString(),
      partySize: parseInt(partySize),
      customerName,
      customerPhone,
      customerEmail,
      specialRequests: specialRequests || undefined,
    });
  };

  const timeSlots = [
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded w-32"></div>
              <div className="h-8 bg-gray-300 rounded w-64"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Restaurant not found</h1>
          <Button onClick={() => setLocation('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/')}
            className="mb-4 bg-white hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToRestaurants}
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
          </div>
          <p className="text-lg text-gray-600 mb-2">Fă o rezervare</p>
          <div className="flex items-center space-x-4 text-gray-600">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
              <span className="font-medium">{restaurant.rating}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{restaurant.location}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Data *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Ora *
                </Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează ora" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="partySize" className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  Număr persoane *
                </Label>
                <Select value={partySize} onValueChange={setPartySize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Câte persoane?" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'persoană' : 'persoane'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Datele de contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    Nume *
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Numele tău"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    Telefon *
                  </Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+40 7XX XXX XXX"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="customerEmail" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    Email
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="email@exemplu.com"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequests">Cerințe speciale (opțional)</Label>
              <Textarea
                id="specialRequests"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Alergii, preferințe de loc, ocazii speciale..."
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700"
              disabled={createReservationMutation.isPending}
            >
              {createReservationMutation.isPending ? (
                "Se trimite..."
              ) : (
                <>
                  <Calendar className="w-5 h-5 mr-2" />
                  Trimite rezervarea
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

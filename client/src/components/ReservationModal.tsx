import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Clock, Users, MapPin } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ReservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: {
    id: number;
    name: string;
    address: string;
  };
  voucherPackage?: {
    id: number;
    name: string;
    mealCount: number;
  };
}

export default function ReservationModal({ open, onOpenChange, restaurant, voucherPackage }: ReservationModalProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Pre-fill form with logged-in user data when modal opens
  useEffect(() => {
    if (open && user) {
      setCustomerName(user.name || "");
      setCustomerEmail(user.email || "");
      setCustomerPhone(user.phone || "");
    }
  }, [open, user]);

  const createReservationMutation = useMutation({
    mutationFn: async (reservationData: any) => {
      console.log("Creating reservation with data:", reservationData);
      return await apiRequest("POST", "/api/reservations", reservationData);
    },
    onSuccess: (data) => {
      console.log("Reservation created successfully:", data);
      toast({
        title: "Reservation Submitted",
        description: "Your reservation has been submitted. The restaurant will confirm it soon.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Reservation creation failed:", error);
      toast({
        title: "Reservation Failed",
        description: error.message || "Failed to create reservation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setDate(undefined);
    setTime("");
    setPartySize("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setSpecialRequests("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time || !partySize || !customerName || !customerPhone || !customerEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Create a new date object from the selected date
    const reservationDateTime = new Date(date!);
    const [hours, minutes] = time.split(':');
    reservationDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const reservationData = {
      restaurantId: restaurant.id,
      customerId: user?.id || null, // Use authenticated user ID 
      customerName,
      customerPhone,
      customerEmail,
      reservationDate: reservationDateTime.toISOString(),
      partySize: parseInt(partySize),
      specialRequests: specialRequests || null,
      voucherPackageId: voucherPackage?.id || null,
      isVoucherReservation: !!voucherPackage,
      status: 'pending',
    };

    createReservationMutation.mutate(reservationData);
  };

  // Generate time slots
  const timeSlots = [];
  for (let hour = 10; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeString);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="reservation-modal max-w-lg mx-auto max-h-[90vh] overflow-y-auto sm:max-w-md z-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Make a Reservation
          </DialogTitle>
          <DialogDescription>
            Book a table at {restaurant.name}
            {voucherPackage && (
              <span className="block mt-1 text-orange-600 font-medium">
                Using voucher: {voucherPackage.name} ({voucherPackage.mealCount} meals)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pb-4">
          {/* Restaurant Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{restaurant.address}</span>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <div className="relative">
              <Input
                type="date"
                value={date ? format(date, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const selectedDate = e.target.value ? new Date(e.target.value) : undefined;
                  setDate(selectedDate);
                }}
                min={format(new Date(), "yyyy-MM-dd")}
                className="w-full pl-10"
                required
              />
              <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="time">Time *</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent style={{ zIndex: 9999 }}>
                {timeSlots.map((timeSlot) => (
                  <SelectItem key={timeSlot} value={timeSlot}>
                    {timeSlot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Party Size */}
          <div className="space-y-2">
            <Label htmlFor="partySize">Party Size *</Label>
            <Select value={partySize} onValueChange={setPartySize}>
              <SelectTrigger>
                <Users className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Number of guests" />
              </SelectTrigger>
              <SelectContent style={{ zIndex: 9999 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} {size === 1 ? 'guest' : 'guests'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Name *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone *</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Your phone number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Your email address"
                required
              />
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Textarea
              id="specialRequests"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Any special dietary requirements, seating preferences, or occasions..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-6 mt-6 border-t sticky bottom-0 bg-white">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createReservationMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {createReservationMutation.isPending ? "Submitting..." : "Make Reservation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
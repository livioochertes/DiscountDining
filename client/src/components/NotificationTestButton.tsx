import { Button } from "@/components/ui/button";
import { Bell, ShoppingCart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NotificationTestButtonProps {
  onCreateTestReservation?: () => void;
  onCreateTestOrder?: () => void;
}

export default function NotificationTestButton({ onCreateTestReservation, onCreateTestOrder }: NotificationTestButtonProps) {
  const { toast } = useToast();

  const createTestReservation = async () => {
    try {
      // Create a test reservation
      const testReservation = {
        customerName: "Test Customer",
        customerEmail: "test@example.com",
        customerPhone: "+1-555-0123",
        restaurantId: 47, // Use existing restaurant ID from the database
        reservationDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        partySize: 2,
        specialRequests: "Testing notification system"
      };

      await apiRequest("POST", "/api/reservations", testReservation);
      
      toast({
        title: "Test Reservation Created",
        description: "A test reservation has been created to demonstrate notifications.",
      });

      if (onCreateTestReservation) {
        onCreateTestReservation();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not create test reservation: " + error.message,
        variant: "destructive",
      });
    }
  };

  const createTestOrder = async () => {
    try {
      // Create a test order with correct structure
      const testOrder = {
        restaurantId: 47,
        customerName: "Test Customer Order",
        customerPhone: "+1-555-0456", 
        customerEmail: "testorder@example.com",
        orderType: "pickup",
        specialInstructions: "Testing order notification system",
        items: [
          {
            menuItemId: 136, // Use a known menu item ID from the logs
            quantity: 2,
            specialRequests: "Test order from notification system"
          }
        ]
      };

      await apiRequest("POST", "/api/orders/create", testOrder);
      
      toast({
        title: "Test Order Created",
        description: "A test order has been created to demonstrate notifications.",
      });

      if (onCreateTestOrder) {
        onCreateTestOrder();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not create test order: " + error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={createTestReservation}
        className="text-xs"
      >
        <Bell className="w-3 h-3 mr-1" />
        Test Reservation
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={createTestOrder}
        className="text-xs"
      >
        <ShoppingCart className="w-3 h-3 mr-1" />
        Test Order
      </Button>
    </div>
  );
}
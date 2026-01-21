import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Dialog, 
  ScrollableDialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Copy, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface QrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
}

export default function QrPaymentModal({ isOpen, onClose, customerId }: QrPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [qrData, setQrData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [restaurantOpen, setRestaurantOpen] = useState(false);
  const { toast } = useToast();

  const { data: restaurants = [] } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/restaurants");
      return response.json();
    }
  });

  const selectedRestaurant = restaurants.find((r: any) => r.id.toString() === restaurantId);

  const generateQrMutation = useMutation({
    mutationFn: async ({ restaurantId, amount, paymentMethod }: { 
      restaurantId: string, 
      amount: string, 
      paymentMethod: string 
    }) => {
      const response = await apiRequest("POST", `/api/customers/${customerId}/generate-payment-qr`, {
        restaurantId: parseInt(restaurantId),
        amount: parseFloat(amount),
        paymentMethod
      });
      return response.json();
    },
    onSuccess: (data) => {
      setQrData(data);
      toast({
        title: "QR Code Generated",
        description: "Your payment QR code is ready!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Generating QR Code",
        description: error.message || "Failed to generate QR code",
        variant: "destructive"
      });
    }
  });

  const handleGenerateQr = () => {
    if (!amount || !restaurantId) {
      toast({
        title: "Missing Information",
        description: "Please select a restaurant and enter an amount.",
        variant: "destructive"
      });
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive"
      });
      return;
    }

    generateQrMutation.mutate({ restaurantId, amount, paymentMethod });
  };

  const copyQrData = () => {
    if (qrData?.qrCode) {
      navigator.clipboard.writeText(qrData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "QR code data copied to clipboard."
      });
    }
  };

  const handleClose = () => {
    setQrData(null);
    setAmount("");
    setRestaurantId("");
    setPaymentMethod("wallet");
    setCopied(false);
    setRestaurantOpen(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} modal={true}>
      <ScrollableDialogContent className="max-w-md max-h-[85vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            Generate Payment QR Code
          </DialogTitle>
        </DialogHeader>

        {!qrData ? (
          <div className="space-y-4">
            {/* Combobox pattern: Popover + Command */}
            <div>
              <Label htmlFor="restaurant">Restaurant</Label>
              <Popover open={restaurantOpen} onOpenChange={setRestaurantOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={restaurantOpen}
                    className="w-full justify-between font-normal mt-1"
                  >
                    {selectedRestaurant ? selectedRestaurant.name : "Select restaurant..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search restaurant..." />
                    <CommandList>
                      <CommandEmpty>No restaurant found.</CommandEmpty>
                      <CommandGroup>
                        {restaurants.map((restaurant: any) => (
                          <CommandItem
                            key={restaurant.id}
                            value={restaurant.name}
                            onSelect={() => {
                              setRestaurantId(restaurant.id.toString());
                              setRestaurantOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                restaurantId === restaurant.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {restaurant.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="amount">Amount (€)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">Wallet Balance</SelectItem>
                  <SelectItem value="voucher">Restaurant Voucher</SelectItem>
                  <SelectItem value="points">Loyalty Points</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGenerateQr}
              disabled={generateQrMutation.isPending}
              className="w-full"
            >
              {generateQrMutation.isPending ? "Generating..." : "Generate QR Code"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg border mb-4">
                {qrData.qrCodeImage ? (
                  <img 
                    src={qrData.qrCodeImage} 
                    alt="Payment QR Code"
                    className="mx-auto w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 mx-auto flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                    <p className="text-gray-500">QR Code not available</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <p><strong>Restaurant:</strong> {qrData.paymentDetails.restaurantName}</p>
                <p><strong>Amount:</strong> €{qrData.paymentDetails.amount}</p>
                <p><strong>Payment Method:</strong> {qrData.paymentDetails.paymentMethod}</p>
                <p><strong>Expires:</strong> {new Date(qrData.paymentDetails.expiresAt).toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={copyQrData} variant="outline" className="flex-1">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy QR Data
                  </>
                )}
              </Button>
              <Button onClick={handleClose} variant="outline" className="flex-1">
                Close
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Show this QR code to the restaurant to complete your payment
            </div>
          </div>
        )}
      </ScrollableDialogContent>
    </Dialog>
  );
}

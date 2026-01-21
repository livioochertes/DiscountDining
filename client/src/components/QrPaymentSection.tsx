import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Copy, Check, X } from "lucide-react";

interface QrPaymentSectionProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
}

export default function QrPaymentSection({ isOpen, onClose, customerId }: QrPaymentSectionProps) {
  const [amount, setAmount] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [qrData, setQrData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: restaurants = [] } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/restaurants");
      return response.json();
    },
    enabled: isOpen
  });

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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-orange-50 to-white dark:from-gray-800 dark:to-gray-900">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center text-lg">
          <QrCode className="h-5 w-5 mr-2 text-primary" />
          Generate Payment QR Code
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {!qrData ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="restaurant">Restaurant</Label>
                <select
                  id="restaurant"
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white dark:bg-gray-900 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                >
                  <option value="" className="bg-white dark:bg-gray-900">Select restaurant...</option>
                  {restaurants.map((restaurant: any) => (
                    <option key={restaurant.id} value={restaurant.id.toString()} className="bg-white dark:bg-gray-900">
                      {restaurant.name}
                    </option>
                  ))}
                </select>
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
                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white dark:bg-gray-900 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                >
                  <option value="wallet" className="bg-white dark:bg-gray-900">Wallet Balance</option>
                  <option value="voucher" className="bg-white dark:bg-gray-900">Restaurant Voucher</option>
                  <option value="points" className="bg-white dark:bg-gray-900">Loyalty Points</option>
                </select>
              </div>

              <Button 
                onClick={handleGenerateQr}
                disabled={generateQrMutation.isPending}
                className="w-full"
              >
                {generateQrMutation.isPending ? "Generating..." : "Generate QR Code"}
              </Button>
            </div>

            <div className="hidden md:flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
              <div className="text-center text-gray-500">
                <QrCode className="h-16 w-16 mx-auto mb-2 opacity-30" />
                <p className="text-sm">QR Code will appear here</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <p><strong>Restaurant:</strong> {qrData.paymentDetails.restaurantName}</p>
                <p><strong>Amount:</strong> €{qrData.paymentDetails.amount}</p>
                <p><strong>Payment Method:</strong> {qrData.paymentDetails.paymentMethod}</p>
                <p><strong>Expires:</strong> {new Date(qrData.paymentDetails.expiresAt).toLocaleTimeString()}</p>
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
                <Button onClick={() => setQrData(null)} variant="outline" className="flex-1">
                  New QR
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                Show this QR code to the restaurant to complete your payment
              </div>
            </div>

            <div className="flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg p-4 border">
              {qrData.qrCodeImage ? (
                <img 
                  src={qrData.qrCodeImage} 
                  alt="Payment QR Code"
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                  <p className="text-gray-500">QR Code not available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

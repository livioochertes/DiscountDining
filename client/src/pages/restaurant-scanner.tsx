import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Camera, CheckCircle, XCircle, CreditCard, User, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ScannedPayment {
  customerId: number;
  customerName: string;
  restaurantId: number;
  restaurantName: string;
  amount: number;
  paymentMethod: string;
  timestamp: number;
  nonce: string;
}

interface PaymentResult {
  success: boolean;
  transaction?: {
    id: string;
    customerId: number;
    restaurantId: number;
    amount: string;
    paymentMethod: string;
    status: string;
    createdAt: Date;
    commissionAmount: string;
    commissionRate: number;
    netRestaurantAmount: string;
  };
  paymentBreakdown?: {
    voucherValue: number;
    pointsUsed: number;
    cashUsed: number;
    generalVoucherDiscount: number;
  };
  commission?: {
    rate: number;
    amount: string;
    description: string;
  };
  message: string;
}

export default function RestaurantScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedPayment | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [restaurantId] = useState(1); // This would come from restaurant auth
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please allow camera permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const parseQRCode = (qrCodeData: string): ScannedPayment | null => {
    try {
      if (!qrCodeData || typeof qrCodeData !== 'string') {
        throw new Error('Invalid QR code data');
      }
      
      if (!qrCodeData.startsWith('EATOFF_PAYMENT:')) {
        throw new Error('Invalid QR code format - must start with EATOFF_PAYMENT:');
      }
      
      const base64Data = qrCodeData.replace('EATOFF_PAYMENT:', '');
      
      if (!base64Data) {
        throw new Error('Empty QR code data');
      }
      
      // Use atob for browser base64 decoding instead of Buffer
      const jsonData = atob(base64Data);
      const paymentData = JSON.parse(jsonData);
      
      // Validate required fields
      if (!paymentData.customerId || !paymentData.restaurantId || !paymentData.amount) {
        throw new Error('Missing required payment data');
      }
      
      return paymentData;
    } catch (error) {
      console.error('QR parsing error:', error);
      return null;
    }
  };

  const handleManualInput = () => {
    const parsed = parseQRCode(qrInput);
    if (parsed) {
      setScannedData(parsed);
      setQrInput('');
    } else {
      toast({
        title: "Invalid QR Code",
        description: "Please enter a valid EatOff payment QR code.",
        variant: "destructive",
      });
    }
  };

  const processPayment = async () => {
    if (!scannedData) return;
    
    setIsProcessing(true);
    try {
      const response = await apiRequest("POST", `/api/restaurants/${restaurantId}/process-qr-payment`, {
        qrCodeData: `EATOFF_PAYMENT:${Buffer.from(JSON.stringify(scannedData)).toString('base64')}`
      });
      
      const result = await response.json();
      setPaymentResult(result);
      
      if (result.success) {
        toast({
          title: "Payment Successful",
          description: `€${scannedData.amount} received from ${scannedData.customerName}`,
        });
      } else {
        toast({
          title: "Payment Failed", 
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setPaymentResult(null);
    setQrInput('');
    stopScanning();
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const isQRExpired = (timestamp: number) => {
    return Date.now() - timestamp > 5 * 60 * 1000; // 5 minutes
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Restaurant Payment Scanner</h1>
          <p className="text-muted-foreground mt-2">
            Scan customer QR codes to process payments
          </p>
        </div>

        {!scannedData && !paymentResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                Scan Payment QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Scanner */}
              <div className="space-y-4">
                {!isScanning ? (
                  <Button onClick={startScanning} className="w-full" size="lg">
                    <Camera className="h-5 w-5 mr-2" />
                    Start Camera Scanner
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-w-md mx-auto rounded-lg border"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <Button onClick={stopScanning} variant="outline" className="w-full">
                      Stop Scanner
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Manual Input */}
              <div className="space-y-4">
                <h3 className="font-semibold">Or Enter QR Code Manually</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Paste QR code data here..."
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                  <Button onClick={handleManualInput} disabled={!qrInput.trim()}>
                    Process
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scanned Payment Details */}
        {scannedData && !paymentResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Customer</h4>
                  <p className="text-lg">{scannedData.customerName}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Amount</h4>
                  <p className="text-2xl font-bold text-green-600">€{scannedData.amount}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Payment Method</h4>
                  <Badge variant="outline">
                    <CreditCard className="h-4 w-4 mr-1" />
                    {scannedData.paymentMethod}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Generated</h4>
                  <p className="text-sm flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTimestamp(scannedData.timestamp)}
                  </p>
                </div>
              </div>

              {isQRExpired(scannedData.timestamp) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center text-red-700">
                    <XCircle className="h-5 w-5 mr-2" />
                    <span className="font-semibold">QR Code Expired</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">
                    This QR code is older than 5 minutes and cannot be processed.
                  </p>
                </div>
              )}

              <div className="flex space-x-4">
                <Button 
                  onClick={processPayment} 
                  disabled={isProcessing || isQRExpired(scannedData.timestamp)}
                  className="flex-1"
                  size="lg"
                >
                  {isProcessing ? "Processing..." : "Process Payment"}
                </Button>
                <Button onClick={resetScanner} variant="outline" size="lg">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Result */}
        {paymentResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {paymentResult.success ? (
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2 text-red-600" />
                )}
                Payment {paymentResult.success ? 'Successful' : 'Failed'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                paymentResult.success 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <p className="font-semibold">{paymentResult.message}</p>
              </div>

              {paymentResult.success && paymentResult.paymentBreakdown && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Payment Breakdown</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {paymentResult.paymentBreakdown.voucherValue > 0 && (
                      <div className="flex justify-between">
                        <span>Voucher Value:</span>
                        <span>€{paymentResult.paymentBreakdown.voucherValue.toFixed(2)}</span>
                      </div>
                    )}
                    {paymentResult.paymentBreakdown.pointsUsed > 0 && (
                      <div className="flex justify-between">
                        <span>Points Used:</span>
                        <span>{paymentResult.paymentBreakdown.pointsUsed} pts</span>
                      </div>
                    )}
                    {paymentResult.paymentBreakdown.cashUsed > 0 && (
                      <div className="flex justify-between">
                        <span>Cash Payment:</span>
                        <span>€{paymentResult.paymentBreakdown.cashUsed.toFixed(2)}</span>
                      </div>
                    )}
                    {paymentResult.paymentBreakdown.generalVoucherDiscount > 0 && (
                      <div className="flex justify-between">
                        <span>Voucher Discount:</span>
                        <span>€{paymentResult.paymentBreakdown.generalVoucherDiscount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {paymentResult.success && paymentResult.commission && paymentResult.transaction && (
                <div className="space-y-2 bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-800">EatOff Commission Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-orange-700">Total Transaction:</span>
                      <span className="font-medium">€{paymentResult.transaction.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-700">Platform Commission ({paymentResult.commission.rate}%):</span>
                      <span className="font-medium text-orange-800">-€{paymentResult.commission.amount}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="font-semibold text-green-700">Net Restaurant Amount:</span>
                      <span className="font-bold text-green-800 text-lg">€{paymentResult.transaction.netRestaurantAmount}</span>
                    </div>
                  </div>
                  <p className="text-xs text-orange-600 mt-2">
                    Commission will be automatically deducted from your weekly payout
                  </p>
                </div>
              )}

              <Button onClick={resetScanner} className="w-full" size="lg">
                Process Next Payment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
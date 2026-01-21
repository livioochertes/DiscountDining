import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, QrCode, CalendarCheck, Calendar, Percent } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import ReservationModal from "./ReservationModal";
import { imageCache } from "@/lib/imageCache";
import { instantImageLoader } from "@/lib/instantImageLoader";

interface VoucherModalProps {
  voucher: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VoucherModal({ voucher, isOpen, onClose }: VoucherModalProps) {
  const { t } = useLanguage();
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // Check if image is already cached - safely handle null voucher
  const imageUrl = voucher?.restaurant?.imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop&fm=webp&q=80";
  
  const checkImageCache = async () => {
    if (!voucher) return;
    
    // Ultra-fast cache checking with multiple systems
    if (imageCache.isCached(imageUrl) || instantImageLoader.isInstantlyAvailable(imageUrl)) {
      setIsImageLoaded(true);
      return;
    }
    
    // Ultra-aggressive preload attempt
    try {
      await Promise.race([
        imageCache.preloadImage(imageUrl),
        instantImageLoader.ultraPreload(imageUrl)
      ]);
      setIsImageLoaded(true);
    } catch (error) {
      // Fallback to regular loading
      setIsImageLoaded(true);
    }
  };
  // Simple effect to handle image caching when modal opens
  useEffect(() => {
    if (isOpen && voucher) {
      // Check if image is already cached
      checkImageCache();
    } else {
      // Reset when modal closes
      setIsImageLoaded(false);
    }
  }, [isOpen, voucher]);

  // Fetch QR code when modal opens
  useEffect(() => {
    if (isOpen && voucher?.id) {
      setIsLoadingQr(true);
      setQrCodeImage(''); // Reset previous QR code
      fetch(`/api/vouchers/${voucher.id}/qr-code`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          if (data.qrCodeImage) {
            setQrCodeImage(data.qrCodeImage);
          } else {
            console.error('No QR code image in response:', data);
          }
        })
        .catch(error => {
          console.error('Failed to fetch QR code:', error);
          setQrCodeImage('ERROR');
        })
        .finally(() => {
          setIsLoadingQr(false);
        });
    }
  }, [isOpen, voucher?.id]);

  // Return null early if no voucher data
  if (!voucher || !isOpen) return null;

  const progressPercentage = (voucher.usedMeals / voucher.totalMeals) * 100;
  const isActive = voucher.status === "active";
  const isExpired = voucher.status === "expired";
  const isFullyUsed = voucher.status === "fully_used";

  const getStatusColor = () => {
    if (isActive) return "default";
    return "secondary";
  };

  const getStatusText = () => {
    if (isActive) return "Active";
    if (isExpired) return "Expired";
    if (isFullyUsed) return "Fully Used";
    return voucher.status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden" 
        onPointerDownOutside={(e) => e.preventDefault()} 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative h-64 bg-white">
          <img 
            src={imageUrl} 
            alt={`${voucher.restaurant?.name} voucher view`}
            className="w-full h-64 object-cover"
            loading="eager"
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setIsImageLoaded(true)}
            style={{ 
              opacity: (isImageLoaded || imageCache.isCached(imageUrl) || instantImageLoader.isInstantlyAvailable(imageUrl)) ? '1' : '0',
              transition: (imageCache.isCached(imageUrl) || instantImageLoader.isInstantlyAvailable(imageUrl)) ? 'opacity 0.01s ease-in' : 'opacity 0.15s ease-in-out',
              display: 'block'
            }}
          />
          {!isImageLoaded && !imageCache.isCached(imageUrl) && !instantImageLoader.isInstantlyAvailable(imageUrl) && (
            <div className="absolute inset-0 bg-white flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <h1 className="text-3xl font-bold mb-2">{voucher.restaurant?.name}</h1>
            <p className="text-lg opacity-90">{voucher.package?.name}</p>
          </div>
        </div>
        
        <div className="p-8">
          <Button
            variant="outline"
            className="mb-6 bg-white hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vouchers
          </Button>

          <DialogHeader className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                  Voucher Details
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Purchased on {formatDate(voucher.purchaseDate)}
                </DialogDescription>
              </div>
              <Badge variant={getStatusColor() === "default" ? "default" : "secondary"}>
                {getStatusText()}
              </Badge>
            </div>
          </DialogHeader>

          {/* QR Code Section */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">QR Code for Restaurant</h3>
                <div className="w-48 h-48 bg-gray-100 mx-auto rounded-lg flex items-center justify-center mb-4">
                  {isLoadingQr ? (
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Loading QR Code...</p>
                    </div>
                  ) : qrCodeImage === 'ERROR' ? (
                    <div className="text-center">
                      <div className="w-32 h-32 bg-red-100 mx-auto mb-2 rounded flex items-center justify-center">
                        <span className="text-red-500 text-sm">Error</span>
                      </div>
                      <p className="text-xs text-red-500">Failed to load QR code</p>
                    </div>
                  ) : qrCodeImage ? (
                    <div className="text-center">
                      <img 
                        src={qrCodeImage} 
                        alt="Voucher QR Code" 
                        className="w-40 h-40 object-contain"
                      />
                      <p className="text-xs text-green-600 mt-2">QR Code Ready</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gray-300 mx-auto mb-2 rounded"></div>
                      <p className="text-xs text-gray-500">QR Code Unavailable</p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Show this QR code to the restaurant staff when dining
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Voucher Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Usage Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Meals used:</span>
                      <span className="font-medium">{voucher.usedMeals} of {voucher.totalMeals}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Expires:</span>
                      </div>
                      <div className={`font-medium ${isExpired ? 'text-gray-500' : ''}`}>
                        {formatDate(voucher.expiryDate)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <Percent className="h-3 w-3 mr-1" />
                        <span>Discount:</span>
                      </div>
                      <div className={`font-medium ${isActive ? 'text-accent' : 'text-gray-500'}`}>
                        {voucher.package?.discountPercentage}% off each meal
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Purchase Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Restaurant:</span>
                    <span className="font-medium">{voucher.restaurant?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Package:</span>
                    <span className="font-medium">{voucher.package?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Paid:</span>
                    <span className="font-medium">€{voucher.purchasePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount Received:</span>
                    <span className="font-medium text-green-600">€{voucher.discountReceived}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">QR Code ID:</span>
                    <span className="font-mono text-xs">{voucher.qrCode}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button 
              onClick={() => {/* QR already shown above */}}
              className="bg-primary hover:bg-primary/90"
              disabled={!isActive || isLoadingQr}
            >
              <QrCode className="h-4 w-4 mr-2" />
              {isLoadingQr ? "Loading QR..." : "QR Code Above"}
            </Button>
            <Button 
              onClick={() => setIsReservationModalOpen(true)}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white"
              disabled={!isActive}
            >
              <CalendarCheck className="h-4 w-4 mr-2" />
              Make Reservation
            </Button>
          </div>

          {/* Terms and Conditions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Terms & Conditions</h3>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Present this QR code before ordering</p>
                <p>• One meal per visit</p>
                <p>• Cannot be combined with other offers</p>
                <p>• Valid for dine-in only</p>
                <p>• Subject to restaurant availability</p>
                <p>• Non-refundable and non-transferable</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      {/* Reservation Modal */}
      {voucher.restaurant && (
        <ReservationModal
          open={isReservationModalOpen}
          onOpenChange={setIsReservationModalOpen}
          restaurant={{
            id: voucher.restaurant.id,
            name: voucher.restaurant.name,
            address: voucher.restaurant.address,
          }}
          voucherPackage={voucher.package ? {
            id: voucher.package.id,
            name: voucher.package.name,
            mealCount: voucher.package.mealCount,
          } : undefined}
        />
      )}
    </Dialog>
  );
}
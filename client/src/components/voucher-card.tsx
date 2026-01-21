import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QrCode, Calendar, Percent, CalendarCheck } from "lucide-react";
import { useState } from "react";
import ReservationModal from "./ReservationModal";
import VoucherModal from "./voucher-modal";

interface VoucherCardProps {
  voucher: {
    id: number;
    totalMeals: number;
    usedMeals: number;
    purchasePrice: string;
    discountReceived: string;
    purchaseDate: string;
    expiryDate: string;
    status: string;
    qrCode: string;
    restaurant?: {
      id: number;
      name: string;
      address: string;
    };
    package?: {
      id: number;
      name: string;
      discountPercentage: string;
      mealCount: number;
    };
  };
  onViewDetails: (voucher: any) => void;
}

export default function VoucherCard({ voucher, onViewDetails }: VoucherCardProps) {
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const progressPercentage = (voucher.usedMeals / voucher.totalMeals) * 100;
  const isActive = voucher.status === "active";
  const isExpired = voucher.status === "expired";
  const isFullyUsed = voucher.status === "fully_used";

  const getStatusColor = () => {
    if (isActive) return "accent";
    if (isExpired) return "secondary";
    if (isFullyUsed) return "secondary";
    return "secondary";
  };

  const getStatusText = () => {
    if (isActive) return "Active";
    if (isExpired) return "Expired";
    if (isFullyUsed) return "Fully Used";
    return voucher.status;
  };

  const getBorderColor = () => {
    if (isActive) return "border-l-accent";
    return "border-l-gray-300";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className={`border-l-4 ${getBorderColor()} ${!isActive ? 'opacity-75' : ''}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {voucher.restaurant?.name} - {voucher.package?.name}
            </h3>
            <p className="text-sm text-gray-600">
              Purchased on {formatDate(voucher.purchaseDate)}
            </p>
          </div>
          <Badge 
            variant={getStatusColor() === "accent" ? "default" : "secondary"}
            className={getStatusColor() === "accent" ? "bg-accent/10 text-accent hover:bg-accent/20" : ""}
          >
            {getStatusText()}
          </Badge>
        </div>
        
        <div className="mb-4">
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
        
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => setIsVoucherModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
              disabled={!isActive}
            >
              <QrCode className="h-4 w-4 mr-2" />
              View Details
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
        </div>
      </CardContent>
      
      {/* Voucher Detail Modal */}
      <VoucherModal
        voucher={voucher}
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
      />

      {/* Reservation Modal */}
      <ReservationModal
        open={isReservationModalOpen}
        onOpenChange={setIsReservationModalOpen}
        restaurant={voucher.restaurant ? {
          id: voucher.restaurant.id,
          name: voucher.restaurant.name,
          address: voucher.restaurant.address,
        } : undefined}
        voucherPackage={voucher.package ? {
          id: voucher.package.id,
          name: voucher.package.name,
          mealCount: voucher.package.mealCount,
        } : undefined}
      />
    </Card>
  );
}

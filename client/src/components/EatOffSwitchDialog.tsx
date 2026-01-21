import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import eatOffLogo from "@assets/EatOff_Logo_1750512988041.png";
import { ShoppingCart, AlertTriangle } from "lucide-react";

interface EatOffSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRestaurant: string;
  newRestaurant: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EatOffSwitchDialog({
  open,
  onOpenChange,
  currentRestaurant,
  newRestaurant,
  onConfirm,
  onCancel,
}: EatOffSwitchDialogProps) {
  const { t } = useLanguage();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={eatOffLogo} 
              alt="EatOff" 
              className="h-12 w-auto"
            />
          </div>
          <AlertDialogTitle className="text-xl font-bold text-primary flex items-center justify-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            {t.switchRestaurantTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3 pt-2">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ShoppingCart className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-800">{t.currentCart}</span>
              </div>
              <div className="text-orange-700 font-medium">{currentRestaurant}</div>
            </div>
            
            <div className="text-gray-600">
              <div className="font-medium">{t.tryingToAddFrom}:</div>
              <div className="text-primary font-bold text-lg">{newRestaurant}</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-red-700 font-medium">
                ⚠️ {t.cartClearWarning}
              </div>
            </div>
            
            <div className="text-gray-700">
              {t.confirmClearCart.replace('{restaurant}', newRestaurant)}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-3">
          <AlertDialogCancel 
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            {t.cancel}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
          >
            {t.clearCartAndSwitch}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
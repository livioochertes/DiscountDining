import { useState, useEffect } from "react";
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
import { useCart } from "@/contexts/CartContext";

export function GlobalRestaurantSwitchDialog() {
  const { t } = useLanguage();
  const { restaurantName } = useCart();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingData, setPendingData] = useState<{
    currentRestaurant: string;
    newRestaurant: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  // Global event listener for restaurant switch requests
  useEffect(() => {
    const handleRestaurantSwitch = (event: CustomEvent) => {
      const { currentRestaurant, newRestaurant, onConfirm, onCancel } = event.detail;
      setPendingData({ currentRestaurant, newRestaurant, onConfirm, onCancel });
      setShowDialog(true);
    };

    window.addEventListener('requestRestaurantSwitch', handleRestaurantSwitch as EventListener);
    
    return () => {
      window.removeEventListener('requestRestaurantSwitch', handleRestaurantSwitch as EventListener);
    };
  }, []);

  const handleConfirm = () => {
    if (pendingData) {
      pendingData.onConfirm();
      setShowDialog(false);
      setPendingData(null);
    }
  };

  const handleCancel = () => {
    if (pendingData) {
      pendingData.onCancel();
      setShowDialog(false);
      setPendingData(null);
    }
  };

  if (!pendingData) return null;

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.switchRestaurantTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.switchRestaurantMessage
              .replace('{current}', pendingData.currentRestaurant)
              .replace('{new}', pendingData.newRestaurant)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {t.cancel}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-red-500 hover:bg-red-600">
            {t.clearCartAndSwitch}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
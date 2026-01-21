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

interface RestaurantSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRestaurantName?: string;
  newRestaurantName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RestaurantSwitchDialog({
  open,
  onOpenChange,
  currentRestaurantName,
  newRestaurantName,
  onConfirm,
  onCancel,
}: RestaurantSwitchDialogProps) {
  const { t } = useLanguage();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.switchRestaurantTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.switchRestaurantMessage
              .replace('{current}', currentRestaurantName || '')
              .replace('{new}', newRestaurantName || '')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {t.cancel}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-500 hover:bg-red-600">
            {t.clearCartAndSwitch}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
import { MobileLayout } from '@/components/mobile/MobileLayout';
import MenuCheckout from '@/pages/menu-checkout';

export default function MobileCheckout() {
  return (
    <MobileLayout hideNavigation>
      <div className="pb-[env(safe-area-inset-bottom)]">
        <MenuCheckout mobile />
      </div>
    </MobileLayout>
  );
}

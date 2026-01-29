import { useLocation } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MobileHelpTerms() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => setLocation('/m/profile')} className="p-2 -ml-2">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold">{t.termsOfService || 'Terms of Service'}</h1>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                By accessing and using EatOff's services, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Service Description</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                EatOff provides a platform for purchasing restaurant vouchers at discounted prices. 
                Our services include meal package vouchers, loyalty points, and various payment options 
                including Pay Later functionality.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. User Accounts</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                To use certain features, you must create an account. You are responsible for maintaining 
                the confidentiality of your login credentials and for all activities under your account.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Voucher Terms</h2>
              <ul className="text-sm text-gray-600 leading-relaxed list-disc pl-4 space-y-2">
                <li>Vouchers are valid only at participating restaurants</li>
                <li>Vouchers have expiration dates that must be respected</li>
                <li>Vouchers are non-transferable unless otherwise stated</li>
                <li>Unused meals expire with the voucher package</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Pay Later Terms</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pay Later vouchers allow deferred payment. By using this feature, you authorize EatOff 
                to charge your registered payment method on the scheduled date. Failed payments may 
                result in account restrictions.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Refund Policy</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Refunds may be requested within 14 days of purchase for unused vouchers. 
                Partially used vouchers are not eligible for refunds. Contact support for refund requests.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Liability</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                EatOff is not responsible for restaurant service quality. We act as an intermediary 
                and are not liable for issues arising from restaurant services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Contact</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                For questions regarding these terms, please contact our support team through the app 
                or at legal@eatoff.app
              </p>
            </section>

            <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
              Last updated: January 2025
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

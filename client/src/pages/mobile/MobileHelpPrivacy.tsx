import { useLocation } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MobileHelpPrivacy() {
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
            <h1 className="text-lg font-semibold">{t.privacyPolicy || 'Privacy Policy'}</h1>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">We collect information you provide directly:</p>
              <ul className="text-sm text-gray-600 leading-relaxed list-disc pl-4 space-y-1">
                <li>Account information (name, email, phone number)</li>
                <li>Payment information (processed securely via Stripe)</li>
                <li>Transaction history and voucher usage</li>
                <li>Dietary preferences and allergies (if provided)</li>
                <li>Location data (for finding nearby restaurants)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <ul className="text-sm text-gray-600 leading-relaxed list-disc pl-4 space-y-1">
                <li>To process your voucher purchases and payments</li>
                <li>To provide personalized restaurant recommendations</li>
                <li>To send transaction confirmations and updates</li>
                <li>To improve our services and user experience</li>
                <li>To communicate about promotions (with your consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Data Sharing</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                We share limited information with partner restaurants to facilitate voucher redemption. 
                Payment data is processed by Stripe and we do not store your full card details. 
                We never sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Data Security</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                We implement industry-standard security measures including encryption, secure 
                authentication, and regular security audits. Two-factor authentication is available 
                for additional account protection.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Your Rights</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">Under GDPR, you have the right to:</p>
              <ul className="text-sm text-gray-600 leading-relaxed list-disc pl-4 space-y-1">
                <li>Access your personal data</li>
                <li>Request data correction or deletion</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of marketing communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Data Export & Deletion</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                You can request a copy of your data or account deletion through the Privacy & Security 
                section in your profile settings. Data export requests are processed within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Cookies & Analytics</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                We use cookies and analytics to improve our service. You can manage cookie 
                preferences in your browser settings. Analytics data is anonymized.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Contact & Complaints</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                For privacy-related inquiries or complaints, contact our Data Protection Officer at 
                privacy@eatoff.app. You also have the right to lodge a complaint with your local 
                data protection authority.
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

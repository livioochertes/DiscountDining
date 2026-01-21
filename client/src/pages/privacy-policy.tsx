import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect, useLayoutEffect, startTransition } from "react";
import { PerfMonitor } from "../utils/perfMonitor";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const start = PerfMonitor.startComponentRender('Privacy Policy');
    return () => {
      PerfMonitor.endComponentRender('Privacy Policy', start);
    };
  }, []);

  // Ensure scroll position stays at top
  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handleBack = () => {
    startTransition(() => {
      setLocation('/');
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="text-primary hover:text-primary/80 p-0 h-auto font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to EatOff
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">PRIVACY POLICY</h1>
          <p className="text-sm text-gray-600 mb-8">Latest update: 30.07.2025</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <p className="text-gray-700 leading-relaxed">
              This Policy informs you about how we collect, use, transfer and protect your personal data. We process it in accordance with the provisions of Regulation (EU) 2016/679 of the European Parliament and of the Council of April 27, 2016 on the protection of individuals with regard to the processing of personal data and on the free movement of such data, and repealing Directive 95/46/EC (",General Data Protection Regulation", hereinafter „GDPR") and relevant national legislation on the protection of personal data.
            </p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. WHO ARE WE?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Namarte CCL (hereinafter referred to as the "Company" or "We") is a company capable of providing an app for fidelize the clients from the HORECA industry. We have pooled all our knowledge and energy to create a high-level app for for the food industry.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our vision: a complete solution for restaurants is possible!
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                We believe that food should be prepared using the best ingredients, be affordable, diverse, and served or delivered under the best conditions. Waste can be controlled and reduced through good supply chain management.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">Our contact details are:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Headquarters address: Bucharest, Sector 2, Calea Moșilor no. 158, Romania.</li>
                <li>Email addresses: dpo@eatoff.app</li>
                <li>Phone numbers: +40745009000</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. HOW DO WE PROCESS YOUR PERSONAL DATA?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Namarte CCL SRL, in its capacity as a Controller, processes personal data of candidates applying for available positions, employees, customers who are legal entities, contractual partners, collaborators, as well as data of other natural persons who interact with the Company and are engaged in contractual relationships with it.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">Personal data are:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>processed lawfully, fairly, and in a transparent manner in relation to the data subject;</li>
                <li>collected for specified, explicit, and legitimate purposes and are not subsequently processed in a manner incompatible with those purposes;</li>
                <li>adequate, relevant, and limited to what is necessary in relation to the purposes for which they are processed;</li>
                <li>accurate and kept up to date;</li>
                <li>stored in a form that permits the identification of data subjects for no longer than is necessary for the purposes for which the data are processed;</li>
                <li>processed in a manner that ensures appropriate security of personal data, including protection against unauthorized or unlawful processing and against accidental loss, destruction, or damage, by using appropriate technical or organizational measures.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. WHAT TYPES OF PERSONAL DATA ARE PROCESSED AND FOR WHAT PURPOSE?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                When completing and submitting the contact form ("Any Questions? Send Us a Message") on the main page of the Company's website www.eatoff.app, we process the following types of personal data: first and last name, email address, phone number, as well as any other data provided at the data subject's initiative regarding the services marketed by the Company, in the "Your message" field.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                You must check the box stating "I have read and agree to the Privacy Policy" – and then click the "Send message" button.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                For visitors of the website, we may collect data through cookies or similar technologies, such as: IP address, internet browser, location, web pages accessed on our website, time spent on the website, internet network, and device used. For more details on this, please consult our Cookies Policy.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not use your personal data to send you marketing communications, such as newsletters, unless you have given your explicit consent for such communications by ticking a corresponding consent box. In this respect, we only process your email address, and we ensure that you have a simple option to unsubscribe at any time, i.e., to withdraw your consent regarding these types of communications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. WHAT ARE THE LEGAL GROUNDS FOR PROCESSING PERSONAL DATA?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">Your personal data are processed in order to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>conclude and perform various contracts;</li>
                <li>fulfill the legal obligations incumbent upon us;</li>
                <li>do so based on the prior consent requested and/or provided (in the context of staff recruitment, for sending marketing communications, etc.);</li>
                <li>pursue the Company's legitimate interests (e.g., taking measures to protect and secure our employees, exercising certain rights and legitimate interests of the Company in contentious or non-contentious proceedings, etc.).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. FOR HOW LONG DO WE PROCESS YOUR PERSONAL DATA?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Personal data are stored and processed for the period necessary to achieve the processing purposes mentioned in this Policy or for the period required by law (e.g., for archiving, accounting purposes, etc.).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. WHO DO WE DISCLOSE YOUR PERSONAL DATA TO?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We will not disclose or transfer to any third party any personal data collected from or about you, except for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Public authorities and institutions – when there is a legal obligation to do so or for a legitimate interest (defending the Company's rights in contentious or non-contentious proceedings, etc.)</li>
                <li>The Company's contractual partners or collaborators who provide services such as: web hosting NAMECHAP, website development ( Namarte CCL), website maintenance Namarte CCL), online marketing (Namarte CCL), marketing communications (MailChimp), etc.</li>
                <li>Any third party – if you have given your explicit and specific consent for that particular situation and for the respective data.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                The personal data processed by the Company are not transferred by the Company (directly or through its contractual partners/collaborators) outside Romania or the European Economic Area (EEA).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. WHAT PROTECTION MEASURES AND GUARANTEES DO WE TAKE?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Company implements appropriate technical and organizational measures to ensure a high level of security and protection of personal data. We use security methods and technologies, along with internal policies and procedures, including control and audit measures, to protect the personal data we collect, in accordance with the relevant legal provisions in force concerning data protection.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. WHAT ARE YOUR RIGHTS AS A DATA SUBJECT?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Any data subject may exercise the following rights, as provided by the General Data Protection Regulation:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>The right of access;</li>
                <li>The right to rectification;</li>
                <li>The right to erasure;</li>
                <li>The right to restrict processing;</li>
                <li>The right to data portability;</li>
                <li>The right to object to processing;</li>
                <li>The right not to be subject to a decision based solely on automated processing, including profiling;</li>
                <li>The right to lodge a complaint with the National Supervisory Authority for Personal Data Processing (www.dataprotection.ro) and to refer the matter to the courts.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Individuals may exercise these rights by sending a written request either to the headquarters of Namarte CCL SRL (Bucharest, Sector 2, Calea Moșilor no. 158, Romania) or electronically to the Data Protection Officer's email address: dpo@eatoff.app, or by phone at: 0745009000. The Data Protection Officer (DPO) services are outsourced and provided by GDPRComplet.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                We will respond to your request within the legal timeframe of 30 days (with the possibility of extension if the request is complex, but we will inform you accordingly).
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
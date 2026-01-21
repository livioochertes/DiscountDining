import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useLayoutEffect, startTransition } from "react";
import { PerfMonitor } from "../utils/perfMonitor";

export default function TermsOfService() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const start = PerfMonitor.startComponentRender('Terms of Service');
    return () => {
      PerfMonitor.endComponentRender('Terms of Service', start);
    };
  }, []);

  // Ensure scroll position stays at top
  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <button 
              onClick={() => startTransition(() => setLocation('/'))}
              className="text-primary hover:text-primary/80 font-medium inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to EatOff
            </button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">TERMS AND CONDITIONS</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: June 25, 2025</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. INTRODUCTION AND ACCEPTANCE OF TERMS</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The website www.eatoff.app is owned and operated by NAMARTE CCL (hereinafter referred to as "EatOff" or the "Company"), a joint stock company based in Bucharest, District 2, Calea Moșilor no. 158, Romania, with tax registration number RO16582983.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                NAMARTE CCL is a company in the food technology sector, providing customers from the HoReCa industry—especially restaurants—a solution for customer loyalty and more (software app) designed to optimize their clients.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Website and mobile apps is our official platform through which we present information about EatOff services and solutions. Also, via this Website, interested parties can contact us to request additional details about our offer or to initiate a collaboration.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Accessing and using the Website implies full and unconditional acceptance of these Terms and Conditions. If you do not agree with any of the terms stipulated below, please discontinue using the Website. The Terms and Conditions apply to all visitors and users of the Website, regardless of the purpose of their visit (information, collaboration, etc.).
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                By continuing to browse the Website, you confirm that you have read, understood, and agree to abide by this document, along with EatOff's Privacy Policy and Cookie Policy (if available), which form an integral part of the terms of use of the Website.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. PURPOSE AND FUNCTIONALITY OF THE WEBSITE</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The website www.eatoff.app is a Web-app platform through which EatOff sells the Vouchers and restaurants, with the goal of improving the client loyalty and food experience.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Marketplace platform – a centralized system connecting consumers with restaurants facilitating online orders and buy in advance some discounts in some conditions.</li>
                <li>Restaurant loyalty systems by Prepaid Vouchers</li>
                <li>Integrated payments – card payment solutions (debit/credit) both online and via mobile</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Web-site aims to provide up-to-date information about these services and technologies, about EatOff's mission and vision, as well as case studies or partner testimonials (in the "Success Stories" section). The Website also includes a support agent through which visitors can ask questions, request additional information, or request some additional requests.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Website's target audience consists of hospitality industry professionals (operators of restaurants, cafés, hotels, suppliers in the food chain) interested in digitizing their businesses, as well as consumers. Restaurants and as well as end consumers will be the beneficiary of the technology provided by EatOff.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Access to the Website is provided free of charge to users and is not conditional on creating a user account. Currently, the Website is informational in nature and does not require registration or authentication for browsing. There are sections reserved solely for registered users; all public information is accessible to any visitor. To start to use all the facility of the app may require account creation or authentication—for example, partner access to the Marketplace platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. INTELLECTUAL PROPERTY</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The content and design of the Website (including, but not limited to, text, images, graphics, logos, icons, software, databases, and any other materials) are the exclusive property of NAMARTE CCL or its partners and are protected by applicable copyright legislation and other intellectual property rights. The trade names, trademarks (including the NAMARTE CCL and EatOff brand), and logos displayed on the Website are also legally protected.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                NAMARTE CCL holds all intellectual property rights (including copyrights, trademarks, patents, etc.) to the technology, software platform, and content provided through this Website, except for elements belonging to third parties that are used either with the owners' permission or in accordance with their applicable licenses.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Users may access and use the Website content solely for their personal, non-commercial information. Saving or printing Website pages is permitted only for your personal, non-commercial use. In all other cases, without our prior written consent, you are not entitled to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>copy, reproduce, distribute, publicly communicate, publish, or transmit any part of the Website content;</li>
                <li>modify, alter, adapt, or create derivative works based on the Website content;</li>
                <li>exploit or use the Website content for commercial or public purposes, in any form.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Any unauthorized use of the Website content constitutes a breach of these conditions and may violate applicable law (including copyright law and related regulations). We reserve the right to take any legal measures against such violations.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                NAMARTE CCL also reserves the right to modify at any time the content and structure of the Website, as well as to suspend or permanently or temporarily discontinue the operation of any section of the Website, without prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. USE OF THE WEBSITE APP</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Website may be used by any visitor (natural or legal person) free of charge to obtain information about EatOff/Partners products and offers. "User" means any person who accesses or uses the Website in any way. The User undertakes to use the Website only for lawful purposes and in accordance with these Terms and Conditions.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                In particular, you agree not to use the Website to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>engage in activities that violate the law, good morals, or any applicable regulations;</li>
                <li>attempt unauthorized access to the Website's computer systems or compromise its security (e.g., through hacking, phishing, or introducing malicious code);</li>
                <li>transmit materials containing viruses, malware, or any other potentially harmful computer code that could affect the functionality of the Website or other users' systems;</li>
                <li>send any illegal, abusive, defamatory, obscene, or otherwise unlawful content that infringes on the rights of others (including the right to privacy and personal data protection);</li>
                <li>copy or reuse the Website content for commercial purposes without the express permission of NAMARTE CCL (e.g., reproducing text or images from the Website on other platforms for commercial purposes).</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Violation of any of the above obligations may result in the restriction of your access to the Website, suspension of your right to use it in the future, and/or notification of the competent authorities, if applicable. NAMARTE CCL reserves the right to take any measures it deems necessary to prevent or stop any non-compliant use of the Website.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Contact and conclusion of service contracts with the Partners (Restaurants).</strong> The Website provides for the Partners and Users with a contact form (as well as our contact details, e.g., the email address help@eatoff.app and phone number +40 745 009 000) through which you can request additional information, personalized offers, or negotiate and possibly conclude a service contract with NAMARTE CCL. Please note that sending a request via the Website does not, in itself, constitute the conclusion of a contract. Any contract for the provision of NAMARTE CCL services will be formalized subsequently through a written agreement signed by both parties, under the conditions agreed upon during negotiations.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Please provide real, accurate, and complete information when filling out the contact form or communicating your details, and notify us in a timely manner if they change. NAMARTE CCL will use this information solely for the purpose for which it was provided (for example, to contact you regarding the requested services) in accordance with its Privacy Policy.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                In the future, NAMARTE CCL may also publish blog articles, news, studies, or other informational materials on the Website related to its field of activity. Such informational content is provided for general reference, and visitors' use of it is governed by these same Terms and Conditions (including the provisions on intellectual property and liability limitations below).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. LIMITATION OF LIABILITY</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                NAMARTE CCL makes considerable efforts to ensure the accuracy and timeliness of the information on the Website. However, the Website content is provided for general informational purposes, and the Company does not guarantee that the information provided is completely free of errors or omissions, or that this information will at all times meet all your requirements.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                In particular, NAMARTE CCL does not accept liability and does not provide guarantees for the following:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>uninterrupted access to the Website, free of errors or malfunctions;</li>
                <li>the use of the Website not negatively affecting your computer system (for example, by completely eliminating viruses, malware, or other harmful elements in the content or on the servers hosting the Website);</li>
                <li>the information presented on the Website being complete, accurate, and up-to-date at all times.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Any information about NAMARTE CCL products and services (including descriptions, specifications, case studies, pricing plans, or possible promotional campaigns) is provided on the Website for informational purposes only. No information on the Website should be construed as a firm guarantee of the performance of our solutions or as a firm offer to contract by Namarte CCL.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Nothing in the Website content binds the Company's liability in the absence of a subsequent written contractual agreement entered into with you. If you decide to use our services, the specific terms of cooperation will be established in a separate contract if you are a Restaurant, in accordance with the section above on concluding service contracts.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                To the fullest extent permitted by law, neither NAMARTE CCL nor its representatives shall be liable for any losses or damages (whether direct, indirect, incidental, special, or otherwise) resulting from or related to the use of the Website, malfunction of the Website, or its delay or unavailability.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Likewise, NAMARTE CCL assumes no responsibility for any damage caused by reliance on the information provided on the Website.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Website may contain links to third-party web pages (e.g., partners or social networks). NAMARTE CCL does not control the content of these external sites and assumes no responsibility for the information, products, or services offered on them. Access to any third-party website is at your own risk, and the use of those sites is subject to their respective terms and conditions and privacy policies.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                By using the Website, you expressly agree that you do so at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. RIGHT TO MODIFY THE TERMS</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                NAMARTE CCL reserves the right to modify these Terms and Conditions at any time to reflect changes in legislation or in the offered functionalities, or changes in the Company's practices. Any modification will take effect at the time the new version of the Terms and Conditions is published on the Website (with the "Last updated" date at the beginning of the document being updated, if applicable).
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                We recommend that you check this page periodically to stay updated on any changes. Continuing to use the Website after the changes are published constitutes your acceptance of the new Terms and Conditions. If you do not agree with the changes made, please discontinue using the Website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. GOVERNING LAW AND JURISDICTION</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms and Conditions, as well as the use of the Website, are governed by the laws in force in Romania. Any dispute arising from or in connection with the use of this Website will be resolved, as far as possible, amicably. If an amicable resolution is not possible, the dispute will be referred to the competent courts in Romania, specifically to the courts in the municipality of Bucharest, Romania, where NAMARTE CCL is headquartered.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you are a consumer (a natural person acting for personal purposes, outside of your professional or commercial activity), you may benefit from the rights conferred to you by the applicable consumer protection legislation. The above provisions do not affect any legal rights you have as a consumer.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. PERSONAL DATA PROCESSING</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your personal data privacy is important to us. Any personal data collected through this Website (for example, information provided in the contact form or data collected through cookies) will be processed in accordance with the applicable personal data protection legislation, including Regulation (EU) 2016/679 (GDPR), and in accordance with our Privacy Policy and Cookie Policy.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                By using the contact form or other Website functionalities that involve providing personal data, you consent to NAMARTE CCL processing that data in accordance with the policies mentioned above.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function PrivacyPolicyFast() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation('/');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
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
          <p className="text-sm text-gray-600 mb-8">Latest update: 25.06.2025</p>

          <div className="text-gray-700 leading-relaxed space-y-6">
            <p>
              This Policy informs you about how we collect, use, transfer and protect your personal data 
              in accordance with GDPR and relevant national legislation.
            </p>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Controller</h2>
              <p>
                Namarte CCL - Bucharest, Sector 2, Calea Moșilor no. 158, Romania<br/>
                Email: dpo@eatoff.app | Phone: +40745009000
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
              <p>You have rights to access, rectify, erase, restrict, and port your data under GDPR.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
              <p>Questions about privacy? Email: dpo@eatoff.app</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function TermsOfServiceFast() {
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
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">TERMS AND CONDITIONS</h1>
          <p className="text-sm text-gray-600 mb-8">Latest update: 25.06.2025</p>

          <div className="text-gray-700 leading-relaxed space-y-6">
            <p>
              By using EatOff services, you agree to these terms. If you disagree, please do not use our service.
            </p>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Description</h2>
              <p>EatOff is a restaurant voucher platform with AI recommendations and loyalty rewards.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Voucher Terms</h2>
              <p>Vouchers are valid for specified duration, non-transferable and non-refundable.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
              <p>Legal questions? Email: legal@eatoff.app</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
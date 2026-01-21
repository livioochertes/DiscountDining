import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function CookiePolicyFast() {
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
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">COOKIE POLICY</h1>
          <p className="text-sm text-gray-600 mb-8">Latest update: 30.07.2025</p>

          <div className="text-gray-700 leading-relaxed space-y-6">
            <p>
              This Cookie Policy explains how NAMARTE CCL ("EatOff") uses cookies on our website www.eatoff.app.
              By using our Services, you consent to cookies in accordance with this policy.
            </p>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Essential Information</h2>
              <p>We use cookies to enhance your experience and provide secure services.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p>Questions? Email: privacy@eatoff.app</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
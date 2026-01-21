import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface LegalPageWrapperProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}



export default function LegalPageWrapper({ title, lastUpdated, children }: LegalPageWrapperProps) {
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
          {/* Back Button - Always visible */}
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
          
          {/* Header - Always visible */}
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
          <p className="text-sm text-gray-600 mb-8">Latest update: {lastUpdated}</p>

          {/* Content */}
          <div className="text-gray-700 leading-relaxed space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
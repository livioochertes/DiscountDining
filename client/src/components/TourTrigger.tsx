import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TourTriggerProps {
  onStartTour: () => void;
  className?: string;
}

export default function TourTrigger({ onStartTour, className = "" }: TourTriggerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useLanguage();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onStartTour}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
              inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg 
              text-sm font-medium hover:bg-primary/90 transition-all duration-300 
              shadow-md hover:shadow-lg
              ${isHovered ? 'scale-105' : 'scale-100'}
              ${className}
            `}
            size="sm"
          >
            <Sparkles className="h-4 w-4" />
            {t.startTour}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-gray-900 text-white border-gray-700">
          <p className="text-sm">
            {t.startTour}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
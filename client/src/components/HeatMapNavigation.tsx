import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function HeatMapNavigation() {
  const [, setLocation] = useLocation();

  return (
    <Button
      variant="outline"
      onClick={() => setLocation("/heat-map")}
      className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 hover:from-orange-100 hover:to-red-100 transition-all"
    >
      <TrendingUp className="h-4 w-4 text-orange-600" />
      <span className="text-orange-700 font-medium">Heat Map</span>
    </Button>
  );
}
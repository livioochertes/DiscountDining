import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Loader2, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CustomerQRCodeCardProps {
  customerId: number;
}

export default function CustomerQRCodeCard({ customerId }: CustomerQRCodeCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLoyalty, setShowLoyalty] = useState(false);

  const { data: qrData, isLoading: qrLoading } = useQuery({
    queryKey: ["/api/loyalty/customers", customerId, "qr-code"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/loyalty/customers/${customerId}/qr-code`);
      if (!response.ok) {
        const error = await response.json();
        if (error.error === "Customer does not have a code yet") {
          return null;
        }
        throw new Error(error.error);
      }
      return response.json();
    },
    enabled: !!customerId
  });

  const { data: loyaltyData = [], isLoading: loyaltyLoading } = useQuery({
    queryKey: ["/api/loyalty/customers", customerId, "loyalty"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/loyalty/customers/${customerId}/loyalty`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!customerId && showLoyalty
  });

  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/loyalty/customers/${customerId}/generate-code`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/customers", customerId, "qr-code"] });
      toast({
        title: "Cod generat",
        description: "Codul tău unic a fost generat cu succes!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDownloadQR = () => {
    if (!qrData?.qrCode) return;
    
    const link = document.createElement("a");
    link.href = qrData.qrCode;
    link.download = `eatoff-qr-${qrData.customerCode}.svg`;
    link.click();
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCode className="h-5 w-5 mr-2 text-primary" />
          Codul Meu de Fidelitate
        </CardTitle>
      </CardHeader>
      <CardContent>
        {qrLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : qrData ? (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg border-2 border-primary/20 mb-3">
                <img 
                  src={qrData.qrCode} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Codul tău unic:</p>
                <p className="font-mono text-lg font-bold text-primary">{qrData.customerCode}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={handleDownloadQR}
              >
                <Download className="h-4 w-4 mr-2" />
                Descarcă QR
              </Button>
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Cum funcționează?</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Prezintă acest cod la restaurantele partenere pentru a te înscrie în programul lor de fidelitate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Restaurantul scanează codul tău pentru a iniția plăți</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>Primești reduceri automate bazate pe nivelul tău de fidelitate</span>
                </li>
              </ul>
              
              <Button 
                variant="ghost" 
                className="mt-4"
                onClick={() => setShowLoyalty(!showLoyalty)}
              >
                <Users className="h-4 w-4 mr-2" />
                {showLoyalty ? "Ascunde" : "Vezi"} restaurantele mele
              </Button>
              
              {showLoyalty && (
                <div className="mt-4 border rounded-lg p-3">
                  {loyaltyLoading ? (
                    <div className="text-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : loyaltyData.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center">
                      Nu ești înscris la niciun restaurant încă
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {loyaltyData.map((loyalty: any) => (
                        <div key={loyalty.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{loyalty.restaurant?.name}</p>
                            <p className="text-xs text-gray-500">
                              {loyalty.totalVisits || 0} vizite • €{parseFloat(loyalty.totalSpend || "0").toFixed(2)} cheltuiți
                            </p>
                          </div>
                          {loyalty.category && (
                            <span 
                              className="text-xs px-2 py-1 rounded-full text-white"
                              style={{ backgroundColor: loyalty.category.color || "#808080" }}
                            >
                              {loyalty.category.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-4">
              Generează codul tău unic pentru a te putea înscrie la programele de fidelitate ale restaurantelor
            </p>
            <Button 
              onClick={() => generateCodeMutation.mutate()}
              disabled={generateCodeMutation.isPending}
            >
              {generateCodeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se generează...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generează Codul Meu
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

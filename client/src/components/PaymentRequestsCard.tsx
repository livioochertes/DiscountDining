import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Check, X, Clock, Loader2, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PaymentRequestsCardProps {
  customerId: number;
}

export default function PaymentRequestsCard({ customerId }: PaymentRequestsCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: paymentRequests = [], isLoading } = useQuery({
    queryKey: ["/api/loyalty/customers", customerId, "payment-requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/loyalty/customers/${customerId}/payment-requests`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!customerId,
    refetchInterval: 30000
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: number; action: "confirm" | "reject" }) => {
      const response = await apiRequest("PUT", `/api/loyalty/payment-requests/${requestId}/${action}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      return response.json();
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/customers", customerId, "payment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      toast({ 
        title: action === "confirm" ? "Plată confirmată" : "Plată respinsă",
        description: action === "confirm" ? "Restaurantul va finaliza plata." : "Cererea a fost respinsă."
      });
    },
    onError: (error: any) => {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    }
  });

  const pendingRequests = paymentRequests.filter((pr: any) => pr.status === "pending");
  const completedRequests = paymentRequests.filter((pr: any) => pr.status !== "pending");

  const formatTimeLeft = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return "Expirat";
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Cereri de Plată
          {pendingRequests.length > 0 && (
            <Badge variant="destructive">{pendingRequests.length} în așteptare</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingRequests.length === 0 && completedRequests.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Nicio cerere de plată</p>
        ) : (
          <div className="space-y-4">
            {pendingRequests.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-orange-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Așteaptă confirmarea ta
                </h4>
                {pendingRequests.map((pr: any) => (
                  <div 
                    key={pr.id} 
                    className="p-4 border-2 border-orange-200 rounded-lg bg-orange-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{pr.restaurant?.name}</p>
                        <p className="text-sm text-gray-600">{pr.description || "Plată în restaurant"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">€{parseFloat(pr.finalAmount).toFixed(2)}</p>
                        {pr.discountApplied && parseFloat(pr.discountApplied) > 0 && (
                          <p className="text-xs text-green-600">
                            -{parseFloat(pr.discountApplied).toFixed(2)}€ reducere fidelitate
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expiră în: {formatTimeLeft(pr.expiresAt)}
                      </span>
                      <span>Sumă inițială: €{parseFloat(pr.amount).toFixed(2)}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => confirmPaymentMutation.mutate({ requestId: pr.id, action: "reject" })}
                        disabled={confirmPaymentMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Respinge
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => confirmPaymentMutation.mutate({ requestId: pr.id, action: "confirm" })}
                        disabled={confirmPaymentMutation.isPending}
                      >
                        {confirmPaymentMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        Confirmă plata
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {completedRequests.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-500">Istoric</h4>
                {completedRequests.slice(0, 5).map((pr: any) => (
                  <div key={pr.id} className="p-3 border rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{pr.restaurant?.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(pr.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">€{parseFloat(pr.finalAmount).toFixed(2)}</p>
                      <Badge variant={
                        pr.status === "completed" ? "default" :
                        pr.status === "rejected" ? "destructive" : "secondary"
                      } className="text-xs">
                        {pr.status === "completed" ? "Plătit" :
                         pr.status === "rejected" ? "Respins" :
                         pr.status === "expired" ? "Expirat" :
                         pr.status === "confirmed" ? "Confirmat" : pr.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

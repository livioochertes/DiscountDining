import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Plus, Edit, Trash2, QrCode, CreditCard, Loader2, ScanLine } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LoyaltyManagementProps {
  restaurants: any[];
}

export default function LoyaltyManagement({ restaurants }: LoyaltyManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(
    restaurants.length > 0 ? restaurants[0].id : null
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    discountPercentage: "",
    minVisits: "0",
    minSpend: "0",
    color: "#3b82f6",
    isDefault: false
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/loyalty/restaurants", selectedRestaurantId, "loyalty-categories"],
    queryFn: async () => {
      if (!selectedRestaurantId) return [];
      const response = await apiRequest("GET", `/api/loyalty/restaurants/${selectedRestaurantId}/loyalty-categories`);
      return response.json();
    },
    enabled: !!selectedRestaurantId
  });

  const { data: loyalCustomers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/loyalty/restaurants", selectedRestaurantId, "loyal-customers"],
    queryFn: async () => {
      if (!selectedRestaurantId) return [];
      const response = await apiRequest("GET", `/api/loyalty/restaurants/${selectedRestaurantId}/loyal-customers`);
      return response.json();
    },
    enabled: !!selectedRestaurantId
  });

  const { data: paymentRequests = [] } = useQuery({
    queryKey: ["/api/loyalty/restaurants", selectedRestaurantId, "payment-requests"],
    queryFn: async () => {
      if (!selectedRestaurantId) return [];
      const response = await apiRequest("GET", `/api/loyalty/restaurants/${selectedRestaurantId}/payment-requests`);
      return response.json();
    },
    enabled: !!selectedRestaurantId
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/loyalty/restaurants/${selectedRestaurantId}/loyalty-categories`, data);
      if (!response.ok) throw new Error("Failed to create category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/restaurants", selectedRestaurantId, "loyalty-categories"] });
      setIsCategoryModalOpen(false);
      resetCategoryForm();
      toast({ title: "Categorie creată", description: "Categoria a fost adăugată cu succes." });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/loyalty/loyalty-categories/${id}`, data);
      if (!response.ok) throw new Error("Failed to update category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/restaurants", selectedRestaurantId, "loyalty-categories"] });
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      resetCategoryForm();
      toast({ title: "Categorie actualizată", description: "Modificările au fost salvate." });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/loyalty/loyalty-categories/${id}`);
      if (!response.ok) throw new Error("Failed to delete category");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/restaurants", selectedRestaurantId, "loyalty-categories"] });
      toast({ title: "Categorie ștearsă" });
    }
  });

  const enrollCustomerMutation = useMutation({
    mutationFn: async (customerCode: string) => {
      const response = await apiRequest("POST", `/api/loyalty/enroll-customer`, {
        customerCode,
        restaurantId: selectedRestaurantId
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/restaurants", selectedRestaurantId, "loyal-customers"] });
      setScannedCode("");
      toast({ 
        title: "Client înscris", 
        description: `${data.customer?.name || 'Clientul'} a fost adăugat în programul de fidelitate.` 
      });
    },
    onError: (error: any) => {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    }
  });

  const createPaymentRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/loyalty/payment-requests`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/restaurants", selectedRestaurantId, "payment-requests"] });
      setIsPaymentModalOpen(false);
      setScannedCode("");
      setPaymentAmount("");
      setPaymentDescription("");
      toast({ 
        title: "Cerere de plată trimisă", 
        description: `Cererea a fost trimisă clientului ${data.customer?.name}. Așteaptă confirmarea.` 
      });
    },
    onError: (error: any) => {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    }
  });

  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
      description: "",
      discountPercentage: "",
      minVisits: "0",
      minSpend: "0",
      color: "#3b82f6",
      isDefault: false
    });
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      discountPercentage: category.discountPercentage,
      minVisits: category.minVisits?.toString() || "0",
      minSpend: category.minSpend?.toString() || "0",
      color: category.color || "#3b82f6",
      isDefault: category.isDefault || false
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = () => {
    const data = {
      ...categoryForm,
      restaurantId: selectedRestaurantId
    };
    
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleCreatePaymentRequest = () => {
    if (!scannedCode || !paymentAmount) {
      toast({ title: "Eroare", description: "Completează codul clientului și suma", variant: "destructive" });
      return;
    }
    
    createPaymentRequestMutation.mutate({
      restaurantId: selectedRestaurantId,
      customerCode: scannedCode,
      amount: paymentAmount,
      description: paymentDescription
    });
  };

  if (restaurants.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Nu ai restaurante adăugate încă.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Gestionare Fidelizare</h2>
          <p className="text-sm text-gray-500">Administrează categoriile și clienții fideli</p>
        </div>
        
        <select
          value={selectedRestaurantId || ""}
          onChange={(e) => setSelectedRestaurantId(parseInt(e.target.value))}
          className="border rounded-md px-3 py-2"
        >
          {restaurants.map((r: any) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Categorii de Fidelitate</CardTitle>
            <Button size="sm" onClick={() => { resetCategoryForm(); setEditingCategory(null); setIsCategoryModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Adaugă
            </Button>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nicio categorie definită</p>
            ) : (
              <div className="space-y-2">
                {categories.map((cat: any) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: cat.color || "#808080" }}
                      />
                      <div>
                        <p className="font-medium">{cat.name}</p>
                        <p className="text-xs text-gray-500">
                          {cat.discountPercentage}% reducere • Min {cat.minVisits || 0} vizite
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditCategory(cat)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteCategoryMutation.mutate(cat.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Acțiuni Rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <ScanLine className="h-4 w-4" />
                Înscrie client nou
              </h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Introdu codul clientului (CLI-XXXXXX)"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value.toUpperCase())}
                />
                <Button 
                  onClick={() => scannedCode && enrollCustomerMutation.mutate(scannedCode)}
                  disabled={enrollCustomerMutation.isPending || !scannedCode}
                >
                  {enrollCustomerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Înscrie"}
                </Button>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setIsPaymentModalOpen(true)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Inițiază o plată
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clienți Fideli ({loyalCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {customersLoading ? (
            <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : loyalCustomers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Niciun client înscris încă</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Client</th>
                    <th className="text-left py-2 px-3">Cod</th>
                    <th className="text-left py-2 px-3">Categorie</th>
                    <th className="text-left py-2 px-3">Vizite</th>
                    <th className="text-left py-2 px-3">Total cheltuieli</th>
                    <th className="text-left py-2 px-3">Ultima vizită</th>
                  </tr>
                </thead>
                <tbody>
                  {loyalCustomers.map((lc: any) => (
                    <tr key={lc.id} className="border-b">
                      <td className="py-2 px-3">
                        <div>
                          <p className="font-medium">{lc.customer?.name || "N/A"}</p>
                          <p className="text-xs text-gray-500">{lc.customer?.email}</p>
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono text-xs">{lc.customerCode}</td>
                      <td className="py-2 px-3">
                        {lc.category ? (
                          <Badge style={{ backgroundColor: lc.category.color }}>{lc.category.name}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3">{lc.totalVisits || 0}</td>
                      <td className="py-2 px-3">€{parseFloat(lc.totalSpend || "0").toFixed(2)}</td>
                      <td className="py-2 px-3">
                        {lc.lastVisitAt ? new Date(lc.lastVisitAt).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cereri de Plată Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentRequests.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Nicio cerere de plată</p>
          ) : (
            <div className="space-y-2">
              {paymentRequests.slice(0, 10).map((pr: any) => (
                <div key={pr.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{pr.customer?.name}</p>
                    <p className="text-xs text-gray-500">{pr.description || "Plată generală"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">€{parseFloat(pr.finalAmount).toFixed(2)}</p>
                    <Badge variant={
                      pr.status === "completed" ? "default" :
                      pr.status === "pending" ? "secondary" :
                      pr.status === "confirmed" ? "outline" : "destructive"
                    }>
                      {pr.status === "completed" ? "Finalizat" :
                       pr.status === "pending" ? "În așteptare" :
                       pr.status === "confirmed" ? "Confirmat" :
                       pr.status === "rejected" ? "Respins" : "Expirat"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editează Categoria" : "Categorie Nouă"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nume categorie</Label>
              <Input 
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                placeholder="ex: Gold, VIP, Premium"
              />
            </div>
            <div>
              <Label>Descriere</Label>
              <Input 
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                placeholder="Descriere opțională"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Reducere (%)</Label>
                <Input 
                  type="number"
                  value={categoryForm.discountPercentage}
                  onChange={(e) => setCategoryForm({...categoryForm, discountPercentage: e.target.value})}
                  placeholder="10"
                />
              </div>
              <div>
                <Label>Culoare</Label>
                <Input 
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vizite minime</Label>
                <Input 
                  type="number"
                  value={categoryForm.minVisits}
                  onChange={(e) => setCategoryForm({...categoryForm, minVisits: e.target.value})}
                />
              </div>
              <div>
                <Label>Cheltuieli minime (€)</Label>
                <Input 
                  type="number"
                  value={categoryForm.minSpend}
                  onChange={(e) => setCategoryForm({...categoryForm, minSpend: e.target.value})}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                checked={categoryForm.isDefault}
                onChange={(e) => setCategoryForm({...categoryForm, isDefault: e.target.checked})}
              />
              <Label>Categorie implicită pentru clienți noi</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Anulează</Button>
              <Button 
                onClick={handleSaveCategory}
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              >
                {(createCategoryMutation.isPending || updateCategoryMutation.isPending) ? 
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inițiază Plată</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Codul clientului</Label>
              <Input 
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value.toUpperCase())}
                placeholder="CLI-XXXXXX"
              />
            </div>
            <div>
              <Label>Suma (€)</Label>
              <Input 
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="50.00"
              />
            </div>
            <div>
              <Label>Descriere (opțional)</Label>
              <Input 
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
                placeholder="ex: Masă în data de..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Anulează</Button>
              <Button 
                onClick={handleCreatePaymentRequest}
                disabled={createPaymentRequestMutation.isPending}
              >
                {createPaymentRequestMutation.isPending ? 
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Trimite cererea
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

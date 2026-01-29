import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, TrendingUp, Users, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RestaurantCashbackManagementProps {
  restaurants: any[];
}

export default function RestaurantCashbackManagement({ restaurants }: RestaurantCashbackManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(
    restaurants.length > 0 ? restaurants[0].id : null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cashbackPercentage: "3"
  });

  const { data: cashbackGroups = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/restaurant', selectedRestaurantId, 'cashback-groups'],
    queryFn: async () => {
      if (!selectedRestaurantId) return [];
      const response = await apiRequest("GET", `/api/restaurant/${selectedRestaurantId}/cashback-groups`);
      return response.json();
    },
    enabled: !!selectedRestaurantId
  });

  const { data: enrolledCustomers = [] } = useQuery<any[]>({
    queryKey: ['/api/restaurant', selectedRestaurantId, 'cashback-enrollments'],
    queryFn: async () => {
      if (!selectedRestaurantId) return [];
      const response = await apiRequest("GET", `/api/restaurant/${selectedRestaurantId}/cashback-enrollments`);
      return response.json();
    },
    enabled: !!selectedRestaurantId
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/restaurant/${selectedRestaurantId}/cashback-groups`, data);
      if (!response.ok) throw new Error("Failed to create group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant', selectedRestaurantId, 'cashback-groups'] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({ title: "Grup creat", description: "Grupul de cashback a fost creat cu succes." });
    },
    onError: (error: any) => {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    }
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/restaurant/${selectedRestaurantId}/cashback-groups/${id}`, data);
      if (!response.ok) throw new Error("Failed to update group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant', selectedRestaurantId, 'cashback-groups'] });
      setIsCreateModalOpen(false);
      setEditingGroup(null);
      resetForm();
      toast({ title: "Grup actualizat", description: "Modificările au fost salvate." });
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/restaurant/${selectedRestaurantId}/cashback-groups/${id}`);
      if (!response.ok) throw new Error("Failed to delete group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant', selectedRestaurantId, 'cashback-groups'] });
      toast({ title: "Grup șters", description: "Grupul a fost șters cu succes." });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      cashbackPercentage: "3"
    });
  };

  const handleOpenModal = (group?: any) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description || "",
        cashbackPercentage: parseFloat(group.cashbackPercentage).toString()
      });
    } else {
      setEditingGroup(null);
      resetForm();
    }
    setIsCreateModalOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      description: formData.description || null,
      cashbackPercentage: formData.cashbackPercentage
    };

    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, data });
    } else {
      createGroupMutation.mutate(data);
    }
  };

  const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Grupuri Cashback</h2>
          <p className="text-gray-600">Gestionează grupurile de cashback pentru clienții restaurantului</p>
        </div>
        
        {restaurants.length > 1 && (
          <Select
            value={selectedRestaurantId?.toString()}
            onValueChange={(value) => setSelectedRestaurantId(parseInt(value))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selectează restaurant" />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map(restaurant => (
                <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                  {restaurant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupuri Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cashbackGroups.filter((g: any) => g.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clienți Înrolați</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledCustomers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restaurant Selectat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{selectedRestaurant?.name || '-'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cashback Groups List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Grupuri de Cashback</CardTitle>
            <Button onClick={() => handleOpenModal()} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Grup Nou
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : cashbackGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Niciun grup de cashback creat</p>
              <p className="text-sm">Creează un grup pentru a oferi cashback clienților</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nume</TableHead>
                  <TableHead>Descriere</TableHead>
                  <TableHead>Cashback %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashbackGroups.map((group: any) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.description || '-'}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700">
                        {parseFloat(group.cashbackPercentage).toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={group.isActive ? "default" : "secondary"}>
                        {group.isActive ? 'Activ' : 'Inactiv'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(group)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm('Ești sigur că vrei să ștergi acest grup?')) {
                              deleteGroupMutation.mutate(group.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Editează Grup Cashback' : 'Grup Cashback Nou'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nume Grup</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Clienți Premium"
              />
            </div>
            <div>
              <Label>Descriere</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="ex: Clienți fideli cu comenzi frecvente"
              />
            </div>
            <div>
              <Label>Procentaj Cashback</Label>
              <Select
                value={formData.cashbackPercentage}
                onValueChange={(value) => setFormData({ ...formData, cashbackPercentage: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1%</SelectItem>
                  <SelectItem value="2">2%</SelectItem>
                  <SelectItem value="3">3%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="7">7%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="15">15%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Anulează
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || createGroupMutation.isPending || updateGroupMutation.isPending}
              >
                {(createGroupMutation.isPending || updateGroupMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingGroup ? 'Salvează' : 'Creează'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

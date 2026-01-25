import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  Store, 
  CreditCard, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  BarChart3,
  DollarSign,
  Shield,
  Lock,
  Plus,
  Building2,
  Edit,
  X
} from "lucide-react";
import { SectionNavigation } from "@/components/SectionNavigation";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import PackageForm from "@/components/package-form";
import { ObjectUploader } from "@/components/ObjectUploader";

// Admin login schema
const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().min(6, "2FA code must be 6 digits").max(6, "2FA code must be 6 digits").optional(),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

// EatOff voucher schema
const eatoffVoucherSchema = z.object({
  name: z.string().min(1, "Voucher name is required"),
  description: z.string().min(1, "Description is required"),
  discount: z.number().min(1, "Discount must be at least 1%").max(100, "Discount cannot exceed 100%"),
  validMonths: z.number().min(1, "Validity must be at least 1 month").max(36, "Validity cannot exceed 36 months"),
  isActive: z.boolean(),
  totalValue: z.number().min(0, "Total value must be positive"),
  imageUrl: z.string().optional(),
  mealCount: z.number().optional(),
  pricePerMeal: z.number().optional(),
  // Pay Later fields
  voucherType: z.enum(["immediate", "pay_later"]).default("immediate"),
  bonusPercentage: z.number().min(0, "Price increase must be at least 0%").max(50, "Price increase cannot exceed 50%").default(0),
  paymentTermDays: z.number().min(7, "Payment term must be at least 7 days").max(90, "Payment term cannot exceed 90 days").default(30),
  requiresPreauth: z.boolean().default(true)
});

type EatoffVoucherFormData = z.infer<typeof eatoffVoucherSchema>;

// Restaurant enrollment schema  
const restaurantEnrollmentSchema = z.object({
  // Restaurant details
  name: z.string().min(1, "Restaurant name is required"),
  cuisine: z.string().min(1, "Cuisine type is required"),
  location: z.string().min(1, "Location is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  description: z.string().min(1, "Description is required"),
  priceRange: z.string().min(1, "Price range is required"),
  imageUrl: z.string().optional(),
  // Company details
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().min(1, "Company address is required"),
  taxId: z.string().min(1, "Tax ID is required"),
  registrationNumber: z.string().min(1, "Company registration number is required"),
  // Banking information
  bankName: z.string().min(1, "Bank name is required"),
  iban: z.string().min(15, "IBAN must be at least 15 characters").max(34, "IBAN cannot exceed 34 characters"),
  accountHolder: z.string().min(1, "Account holder name is required"),
  // Restaurant owner credentials
  ownerEmail: z.string().email("Invalid owner email address"),
  ownerPassword: z.string().min(6, "Password must be at least 6 characters"),
  contactPerson: z.string().min(1, "Contact person name is required"),
});

type RestaurantEnrollmentFormData = z.infer<typeof restaurantEnrollmentSchema>;

// Partner management schema
const partnerSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  vatCode: z.string().min(1, "VAT code is required"),
  companyAddress: z.string().min(1, "Company address is required"),
  companyPhone: z.string().min(1, "Company phone is required"),
  companyEmail: z.string().email("Invalid company email address"),
  companyWebsite: z.string().optional(),
  contactPersonName: z.string().min(1, "Contact person name is required"),
  contactPersonTitle: z.string().min(1, "Contact person title is required"),
  contactPersonPhone: z.string().min(1, "Contact person phone is required"),
  contactPersonEmail: z.string().email("Invalid contact person email address"),
  businessRegistrationNumber: z.string().optional(),
  bankName: z.string().optional(),
  iban: z.string().optional(),
  accountHolder: z.string().optional(),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

interface DashboardMetrics {
  totalUsers: number;
  totalRestaurants: number;
  totalRevenue: number;
  totalCommission: number;
  activeUsers: number;
  activeRestaurants: number;
}

interface Restaurant {
  id: number;
  name: string;
  email: string;
  isApproved: boolean;
  isActive: boolean;
  restaurantCode?: string;
  approvedAt?: string;
  createdAt: string;
}

interface PlatformSetting {
  id: number;
  settingKey: string;
  settingValue: string;
  settingType: string;
  description: string;
  updatedAt: string;
}

interface Partner {
  id: number;
  email: string;
  companyName: string;
  vatCode: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail?: string;
  companyWebsite?: string;
  contactPersonName: string;
  contactPersonTitle: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  businessRegistrationNumber?: string;
  bankName?: string;
  iban?: string;
  accountHolder?: string;
  isVerified: boolean;
  isActive: boolean;
  restaurantCount: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
}

interface MenuItem {
  id: number;
  restaurantId: number;
  name: string;
  description?: string;
  category: string;
  price: string;
  imageUrl?: string;
  ingredients: string[];
  allergens: string[];
  dietaryTags: string[];
  spiceLevel: number;
  calories?: number;
  preparationTime?: number;
  isPopular: boolean;
  isAvailable: boolean;
  createdAt: string;
}

interface VoucherPackage {
  id: number;
  restaurantId: number;
  name: string;
  description?: string;
  mealCount: number;
  pricePerMeal: string;
  discountPercentage: string;
  validityMonths: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface RestaurantDetails {
  restaurant: Restaurant;
  menuItems: MenuItem[];
  voucherPackages: VoucherPackage[];
}

// EatOff Voucher Management Component
function EatOffVoucherManagement() {
  const [isEatoffVoucherDialogOpen, setIsEatoffVoucherDialogOpen] = useState(false);
  const [selectedEatoffVoucher, setSelectedEatoffVoucher] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const eatoffVoucherForm = useForm<EatoffVoucherFormData>({
    resolver: zodResolver(eatoffVoucherSchema),
    defaultValues: {
      name: "",
      description: "",
      discount: 10,
      validMonths: 12,
      isActive: false,
      totalValue: 0,
      imageUrl: "",
      mealCount: undefined,
      pricePerMeal: undefined
    },
  });

  // Fetch EatOff vouchers
  const { data: eatoffVouchers, isLoading: vouchersLoading } = useQuery({
    queryKey: ['/api/admin/eatoff-vouchers'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/eatoff-vouchers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch EatOff vouchers');
      return response.json();
    }
  });

  const handleEatoffVoucherSubmit = async (data: EatoffVoucherFormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const url = selectedEatoffVoucher 
        ? `/api/admin/eatoff-vouchers/${selectedEatoffVoucher.id}`
        : '/api/admin/eatoff-vouchers';
      
      const response = await fetch(url, {
        method: selectedEatoffVoucher ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save EatOff voucher');
      }

      toast({
        title: selectedEatoffVoucher ? "Voucher Updated" : "Voucher Created",
        description: `EatOff voucher has been ${selectedEatoffVoucher ? 'updated' : 'created'} successfully.`,
      });

      eatoffVoucherForm.reset();
      setIsEatoffVoucherDialogOpen(false);
      setSelectedEatoffVoucher(null);
      
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/eatoff-vouchers'] });
      // Also invalidate restaurant packages to refresh EatOff vouchers in restaurants
      await queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
      // Invalidate home page voucher lists
      await queryClient.invalidateQueries({ queryKey: ['/api/eatoff-vouchers'] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save EatOff voucher",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEatoffVoucher = async (voucher: any) => {
    if (!confirm(`Are you sure you want to delete "${voucher.name}"?`)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/eatoff-vouchers/${voucher.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete EatOff voucher');

      toast({
        title: "Voucher Deleted",
        description: "EatOff voucher has been deleted successfully.",
      });

      await queryClient.invalidateQueries({ queryKey: ['/api/admin/eatoff-vouchers'] });
      // Also invalidate restaurant packages to refresh EatOff vouchers in restaurants
      await queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
      // Invalidate home page voucher lists
      await queryClient.invalidateQueries({ queryKey: ['/api/eatoff-vouchers'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete EatOff voucher",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (voucher: any) => {
    setSelectedEatoffVoucher(voucher);
    eatoffVoucherForm.reset({
      name: voucher.name,
      description: voucher.description,
      discount: parseFloat(voucher.discountPercentage) || 0,
      validMonths: voucher.validityMonths || 12,
      isActive: voucher.isActive,
      totalValue: parseFloat(voucher.totalValue) || 0,
      imageUrl: voucher.imageUrl || "",
      mealCount: voucher.mealCount || undefined,
      pricePerMeal: voucher.pricePerMeal || undefined,
      // Pay Later fields
      voucherType: voucher.voucherType || "immediate",
      bonusPercentage: parseFloat(voucher.bonusPercentage) || 0,
      paymentTermDays: voucher.paymentTermDays || 30,
      requiresPreauth: voucher.requiresPreauth !== false
    });
    setIsEatoffVoucherDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>EatOff Voucher Management</span>
            <Button 
              onClick={() => {
                setSelectedEatoffVoucher(null);
                eatoffVoucherForm.reset();
                setIsEatoffVoucherDialogOpen(true);
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create EatOff Voucher
            </Button>
          </CardTitle>
          <CardDescription>
            Manage global EatOff-branded vouchers that appear in all restaurant marketplaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vouchersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading EatOff vouchers...</p>
            </div>
          ) : eatoffVouchers && eatoffVouchers.length > 0 ? (
            <div className="space-y-4">
              {eatoffVouchers.map((voucher: any) => (
                <div key={voucher.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium">{voucher.name}</h4>
                      <Badge variant={voucher.isActive ? "default" : "secondary"}>
                        {voucher.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        EatOff Brand
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{voucher.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>Discount: {voucher.discountPercentage}%</span>
                      <span>Valid: {voucher.validityMonths} months</span>
                      <span>Value: €{voucher.totalValue}</span>
                      {voucher.mealCount && <span>Meals: {voucher.mealCount}</span>}
                      {voucher.pricePerMeal && <span>Price/Meal: €{voucher.pricePerMeal}</span>}
                    </div>
                    {/* Pay Later Badge */}
                    {voucher.voucherType === 'pay_later' && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          Buy Now, Pay Later
                        </Badge>
                        {voucher.bonusPercentage > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            +{voucher.bonusPercentage}% Bonus
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Pay in {voucher.paymentTermDays} days
                        </span>
                      </div>
                    )}
                    {voucher.imageUrl && (
                      <div className="mt-3">
                        <img 
                          src={voucher.imageUrl} 
                          alt={voucher.name}
                          className="w-20 h-12 object-cover rounded border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(voucher)}
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteEatoffVoucher(voucher)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No EatOff vouchers created yet</div>
              <Button 
                onClick={() => setIsEatoffVoucherDialogOpen(true)}
                className="mt-4 bg-orange-600 hover:bg-orange-700"
              >
                Create Your First EatOff Voucher
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EatOff Voucher Dialog */}
      <Dialog open={isEatoffVoucherDialogOpen} onOpenChange={setIsEatoffVoucherDialogOpen}>
        <DialogContent className="max-w-md mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEatoffVoucher ? 'Edit EatOff Voucher' : 'Create EatOff Voucher'}
            </DialogTitle>
            <DialogDescription>
              {selectedEatoffVoucher 
                ? 'Update this global EatOff voucher that appears in all restaurants'
                : 'Create a new global EatOff voucher that will appear in all restaurant marketplaces'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...eatoffVoucherForm}>
            <form onSubmit={eatoffVoucherForm.handleSubmit(handleEatoffVoucherSubmit)} className="space-y-3">
              <FormField
                control={eatoffVoucherForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., EatOff Premium Dining" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={eatoffVoucherForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this voucher offers..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={eatoffVoucherForm.control}
                  name="totalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Value (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="25.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={eatoffVoucherForm.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="100" 
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={eatoffVoucherForm.control}
                name="validMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Months</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="36" 
                        placeholder="12"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={eatoffVoucherForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher Image (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880} // 5MB
                          onGetUploadParameters={async () => {
                            const token = localStorage.getItem('adminToken');
                            const response = await fetch('/api/admin/objects/upload', {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              }
                            });
                            if (!response.ok) {
                              throw new Error('Failed to get upload URL');
                            }
                            const data = await response.json();
                            return {
                              method: 'PUT' as const,
                              url: data.uploadURL,
                            };
                          }}
                          onComplete={async (result) => {
                            if (result.successful.length > 0) {
                              const uploadedFile = result.successful[0];
                              const uploadURL = uploadedFile.uploadURL;
                              
                              // Set ACL policy for the uploaded image
                              const token = localStorage.getItem('adminToken');
                              const response = await fetch('/api/admin/voucher-images', {
                                method: 'PUT',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ imageURL: uploadURL })
                              });
                              
                              if (response.ok) {
                                const data = await response.json();
                                field.onChange(data.objectPath);
                                toast({
                                  title: "Image uploaded",
                                  description: "Voucher image uploaded successfully"
                                });
                              } else {
                                throw new Error('Failed to set image ACL');
                              }
                            }
                          }}
                        />
                        {field.value && (
                          <div className="mt-2">
                            <img 
                              src={field.value} 
                              alt="Voucher preview"
                              className="w-32 h-20 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={eatoffVoucherForm.control}
                  name="mealCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Count (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="e.g., 5"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={eatoffVoucherForm.control}
                  name="pricePerMeal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Meal (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="e.g., 15.99"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Voucher Type Selection */}
              <FormField
                control={eatoffVoucherForm.control}
                name="voucherType"  
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select voucher type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate Payment (Standard)</SelectItem>
                        <SelectItem value="pay_later">Buy Now, Pay Later</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pay Later specific fields */}
              {eatoffVoucherForm.watch("voucherType") === "pay_later" && (
                <>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Buy Now, Pay Later Settings</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Customers get the voucher value plus bonus percentage immediately, but payment is charged after the term period.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={eatoffVoucherForm.control}
                      name="bonusPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price Increase %</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              min="0" 
                              max="50"
                              placeholder="e.g., 10"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            Price increase percentage for pay later vouchers
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={eatoffVoucherForm.control}
                      name="paymentTermDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Term (Days)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select term" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="7">7 days</SelectItem>
                              <SelectItem value="14">14 days</SelectItem>
                              <SelectItem value="30">30 days</SelectItem>
                              <SelectItem value="45">45 days</SelectItem>
                              <SelectItem value="60">60 days</SelectItem>
                              <SelectItem value="90">90 days</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="text-xs text-muted-foreground">
                            When to charge the customer's card
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={eatoffVoucherForm.control}
                    name="requiresPreauth"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            Require Card Pre-authorization
                          </FormLabel>
                          <div className="text-xs text-muted-foreground">
                            Verify card validity before issuing voucher
                          </div>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border border-gray-300"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={eatoffVoucherForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Active Status
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Only active vouchers appear in restaurant marketplaces
                      </div>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border border-gray-300"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEatoffVoucherDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                  {loading ? "Saving..." : selectedEatoffVoucher ? "Update Voucher" : "Create Voucher"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa'>('credentials');
  const [error, setError] = useState<string | null>(null);
  const [isEnrollRestaurantModalOpen, setIsEnrollRestaurantModalOpen] = useState(false);
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);
  const [isEditPartnerModalOpen, setIsEditPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [isRestaurantManagementModalOpen, setIsRestaurantManagementModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [managementTab, setManagementTab] = useState<'menu' | 'vouchers'>('menu');
  const [isAddMenuItemModalOpen, setIsAddMenuItemModalOpen] = useState(false);
  const [isEditMenuItemModalOpen, setIsEditMenuItemModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [isAddVoucherPackageModalOpen, setIsAddVoucherPackageModalOpen] = useState(false);
  const [isEditVoucherPackageModalOpen, setIsEditVoucherPackageModalOpen] = useState(false);
  const [editingVoucherPackage, setEditingVoucherPackage] = useState<VoucherPackage | null>(null);
  const [isEatoffVoucherDialogOpen, setIsEatoffVoucherDialogOpen] = useState(false);
  const [selectedEatoffVoucher, setSelectedEatoffVoucher] = useState<any>(null);
  
  // Lock scroll when modal is open
  useEffect(() => {
    if (isEnrollRestaurantModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isEnrollRestaurantModalOpen]);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAllApproved, setShowAllApproved] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // EatOff voucher form
  const eatoffVoucherForm = useForm<EatoffVoucherFormData>({
    resolver: zodResolver(eatoffVoucherSchema),
    defaultValues: {
      name: "",
      description: "",
      discount: 10,
      validMonths: 12,
      isActive: false,
      totalValue: 0,
      imageUrl: "",
      mealCount: undefined,
      pricePerMeal: undefined,
      voucherType: "immediate",
      bonusPercentage: 0,
      paymentTermDays: 30,
      requiresPreauth: true
    },
  });

  // Admin logout handler
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setShowLoginModal(true);
    setLoginStep('credentials');
    loginForm.reset();
    setError(null);
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  // Check if admin is already authenticated on component mount - optimized
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Quick auth check without API call for better performance
      setIsAuthenticated(true);
      setShowLoginModal(false);
    }
  }, []);

  // Form setup
  const loginForm = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      twoFactorCode: "",
    },
  });

  // Restaurant enrollment form setup
  const enrollmentForm = useForm<RestaurantEnrollmentFormData>({
    resolver: zodResolver(restaurantEnrollmentSchema),
    defaultValues: {
      name: "",
      cuisine: "",
      location: "",
      address: "",
      phone: "",
      email: "",
      description: "",
      priceRange: "",
      imageUrl: "",
      companyName: "",
      companyAddress: "",
      taxId: "",
      registrationNumber: "",
      bankName: "",
      iban: "",
      accountHolder: "",
      ownerEmail: "",
      ownerPassword: "",
      contactPerson: "",
    },
  });

  // Form for partner management
  const partnerForm = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      companyName: "",
      vatCode: "",
      companyAddress: "",
      companyPhone: "",
      companyEmail: "",
      companyWebsite: "",
      contactPersonName: "",
      contactPersonTitle: "",
      contactPersonPhone: "",
      contactPersonEmail: "",
      businessRegistrationNumber: "",
      bankName: "",
      iban: "",
      accountHolder: "",
    },
  });

  // Admin login handler - simplified single step
  const handleAdminLogin = async (data: AdminLoginFormData) => {
    setError(null);
    
    try {
      // Single step login with all credentials
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          twoFactorCode: data.twoFactorCode || '123456', // Default 2FA for demo
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.message === '2FA code required') {
          setError('Please enter your 2FA code (any 6 digits for demo)');
          setLoginStep('2fa');
          return;
        }
        setError(error.message || 'Login failed');
        return;
      }

      const result = await response.json();
      
      // Store admin token
      localStorage.setItem('adminToken', result.token);
      
      // Complete authentication
      setIsAuthenticated(true);
      setShowLoginModal(false);
      
      toast({
        title: "Access Granted",
        description: "Welcome to the admin dashboard.",
      });
    } catch (error) {
      setError('Login failed. Please try again.');
      console.error('Admin login error:', error);
    }
  };

  // Restaurant enrollment handler
  const handleRestaurantEnrollment = async (data: RestaurantEnrollmentFormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/restaurants/enroll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to enroll restaurant');
      }

      toast({
        title: "Restaurant Enrolled",
        description: "Restaurant has been successfully enrolled and owner credentials created.",
      });

      // Reset form and close modal
      enrollmentForm.reset();
      setIsEnrollRestaurantModalOpen(false);
      
      // Refresh restaurants list
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/restaurants'] });
    } catch (error) {
      toast({
        title: "Enrollment Failed",
        description: error instanceof Error ? error.message : "Failed to enroll restaurant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Only show queries if authenticated
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/admin/dashboard'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard metrics');
      return response.json();
    }
  });

  const { data: restaurants } = useQuery<Restaurant[]>({
    queryKey: ['/api/admin/restaurants'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/restaurants', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch restaurants');
      return response.json();
    }
  });

  const { data: settings } = useQuery<PlatformSetting[]>({
    queryKey: ['/api/admin/settings'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    }
  });

  // Fetch partners data
  const { data: partners, isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ['/api/admin/partners'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/partners', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch partners');
      return response.json();
    }
  });

  const pendingRestaurants = restaurants?.filter(r => !r.isApproved) || [];
  const approvedRestaurants = restaurants?.filter(r => r.isApproved && r.isActive)
    .sort((a, b) => {
      // Sort by approval timestamp first (most recent first), fallback to ID
      if (a.approvedAt && b.approvedAt) {
        return new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime();
      }
      return b.id - a.id;
    }) || [];
  const suspendedRestaurants = restaurants?.filter(r => !r.isActive) || [];

  const approveRestaurant = async (restaurantId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/restaurants/${restaurantId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to approve restaurant');
      }

      toast({
        title: "Success",
        description: "Restaurant approved successfully",
      });

      // Refresh the data without page reload
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/restaurants'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
    } catch (error) {
      console.error('Failed to approve restaurant:', error);
      toast({
        title: "Error",
        description: "Failed to approve restaurant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const suspendRestaurant = async (restaurantId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/restaurants/${restaurantId}/suspend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to suspend restaurant');
      }

      toast({
        title: "Success",
        description: "Restaurant suspended successfully",
      });

      // Refresh the data without page reload
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/restaurants'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
    } catch (error) {
      console.error('Failed to suspend restaurant:', error);
      toast({
        title: "Error",
        description: "Failed to suspend restaurant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Partner management handlers
  const handlePartnerSubmit = async (data: PartnerFormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create partner');
      }

      toast({
        title: "Partner Created",
        description: "Partner company has been successfully added to the platform.",
      });

      setIsAddPartnerModalOpen(false);
      partnerForm.reset();
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/partners'] });
    } catch (error: any) {
      console.error('Partner creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create partner",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePartnerStatus = async (partnerId: number, isActive: boolean) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/partners/${partnerId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (!response.ok) {
        throw new Error('Failed to update partner status');
      }

      toast({
        title: "Success",
        description: `Partner ${isActive ? 'suspended' : 'activated'} successfully`,
      });

      await queryClient.invalidateQueries({ queryKey: ['/api/admin/partners'] });
    } catch (error) {
      console.error('Failed to update partner status:', error);
      toast({
        title: "Error",
        description: "Failed to update partner status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Open edit partner modal and populate form with partner data
  const openEditPartnerModal = (partner: any) => {
    setEditingPartner(partner);
    partnerForm.reset({
      companyName: partner.companyName || "",
      vatCode: partner.vatCode || "",
      companyAddress: partner.companyAddress || "",
      companyPhone: partner.companyPhone || "",
      companyEmail: partner.companyEmail || "",
      companyWebsite: partner.companyWebsite || "",
      contactPersonName: partner.contactPersonName || "",
      contactPersonTitle: partner.contactPersonTitle || "",
      contactPersonPhone: partner.contactPersonPhone || "",
      contactPersonEmail: partner.contactPersonEmail || "",
      businessRegistrationNumber: partner.businessRegistrationNumber || "",
      bankName: partner.bankName || "",
      iban: partner.iban || "",
      accountHolder: partner.accountHolder || "",
    });
    setIsEditPartnerModalOpen(true);
  };



  // Open restaurant management modal
  const openRestaurantManagementModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsRestaurantManagementModalOpen(true);
  };

  // Restaurant details query
  const { data: restaurantDetails, isLoading: restaurantDetailsLoading } = useQuery<RestaurantDetails>({
    queryKey: ['/api/admin/restaurants', selectedRestaurant?.id, 'details'],
    enabled: isAuthenticated && selectedRestaurant !== null,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/restaurants/${selectedRestaurant!.id}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch restaurant details');
      return response.json();
    }
  });

  // Update partner information
  const handleUpdatePartner = async (data: PartnerFormData) => {
    if (!editingPartner) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/partners/${editingPartner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update partner');
      }

      toast({
        title: "Success",
        description: "Partner information updated successfully",
      });

      setIsEditPartnerModalOpen(false);
      setEditingPartner(null);
      partnerForm.reset();
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/partners'] });
    } catch (error) {
      console.error('Failed to update partner:', error);
      toast({
        title: "Error",
        description: "Failed to update partner information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Voucher Package Management Functions
  const handleCreateVoucherPackage = async (data: any) => {
    if (!selectedRestaurant) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/restaurants/${selectedRestaurant.id}/vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create voucher package');
      }

      console.log('Voucher package created successfully, invalidating cache...');
      
      toast({
        title: "Success",
        description: "Voucher package created successfully",
      });

      setIsAddVoucherPackageModalOpen(false);
      
      // Invalidate the restaurant details cache to refresh voucher packages
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/restaurants', selectedRestaurant.id, 'details'] });
      // Invalidate home page voucher lists
      await queryClient.invalidateQueries({ queryKey: ['/api/voucher-packages'] });
      console.log('Cache invalidated for restaurant:', selectedRestaurant.id);
    } catch (error) {
      console.error('Failed to create voucher package:', error);
      toast({
        title: "Error",
        description: "Failed to create voucher package",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVoucherPackage = async (data: any) => {
    if (!editingVoucherPackage) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/voucher-packages/${editingVoucherPackage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update voucher package');
      }

      toast({
        title: "Success",
        description: "Voucher package updated successfully",
      });

      setIsEditVoucherPackageModalOpen(false);
      setEditingVoucherPackage(null);
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/restaurants', selectedRestaurant?.id, 'details'] });
      // Invalidate home page voucher lists
      await queryClient.invalidateQueries({ queryKey: ['/api/voucher-packages'] });
    } catch (error) {
      console.error('Failed to update voucher package:', error);
      toast({
        title: "Error",
        description: "Failed to update voucher package",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoucherPackage = async (voucherPackageId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/voucher-packages/${voucherPackageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete voucher package');
      }

      toast({
        title: "Success",
        description: "Voucher package deleted successfully",
      });

      await queryClient.invalidateQueries({ queryKey: ['/api/admin/restaurants', selectedRestaurant?.id, 'details'] });
      // Invalidate home page voucher lists
      await queryClient.invalidateQueries({ queryKey: ['/api/voucher-packages'] });
    } catch (error) {
      console.error('Failed to delete voucher package:', error);
      toast({
        title: "Error",
        description: "Failed to delete voucher package",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateVoucherPackage = async (pkg: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/voucher-packages/${pkg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          ...pkg,
          isActive: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to activate voucher package');
      }

      toast({
        title: "Package Activated",
        description: "Voucher package is now available for purchase by customers",
      });

      await queryClient.invalidateQueries({ queryKey: ['/api/admin/restaurants', selectedRestaurant?.id, 'details'] });
    } catch (error) {
      console.error('Failed to activate voucher package:', error);
      toast({
        title: "Error",
        description: "Failed to activate voucher package",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (metricsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SectionNavigation currentSection="admin" />
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show ONLY login modal - no header, no footer, no navigation
  if (!isAuthenticated) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100vw',
          height: '100vh',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0',
          padding: '20px',
          boxSizing: 'border-box'
        }}
      >
        {/* Pure Login Modal - Absolutely centered */}
        <div 
          style={{
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            padding: '32px',
            width: '100%',
            maxWidth: '400px'
          }}
        >
          <div className="flex items-center gap-2 justify-center mb-6">
            <Shield className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold">Admin Login</h2>
          </div>

          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleAdminLogin)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Administrator Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="admin@eatoff.app" 
                        {...field} 
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="admin123" 
                        {...field} 
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="twoFactorCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>2FA Code (Demo: any 6 digits)</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="123456" 
                        maxLength={6}
                        {...field} 
                        autoComplete="one-time-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                Sign In to Admin Panel
              </Button>

              <div className="text-center text-sm text-gray-600">
                <div>Demo Credentials:</div>
                <div>Email: admin@eatoff.app</div>
                <div>Password: admin123</div>
                <div>2FA: Any 6 digits (e.g., 123456)</div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-wrapper">
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="admin-navigation-container">
            <SectionNavigation 
              currentSection="admin" 
              onTabChange={setSelectedTab}
              activeTab={selectedTab}
            />
            {/* Admin Logout Button */}
            <div className="absolute top-4 right-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                <Lock className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto p-6 space-y-6 admin-content-container">
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Users className="h-4 w-4 text-blue-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total registered customers on the platform</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {metrics?.activeUsers || 0} active this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Store className="h-4 w-4 text-green-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total restaurant partners registered on EatOff</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalRestaurants || 0}</div>
              <p className="text-xs text-muted-foreground">
                {metrics?.activeRestaurants || 0} active partners
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DollarSign className="h-4 w-4 text-yellow-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total transaction volume processed through EatOff</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{metrics?.totalRevenue || 0}</div>
              <p className="text-xs text-muted-foreground">
                Platform transaction volume
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TrendingUp className="h-4 w-4 text-primary cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>EatOff's commission revenue from restaurant transactions</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{metrics?.totalCommission || 0}</div>
              <p className="text-xs text-muted-foreground">
                Platform commission revenue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Management Content */}
        <div className="space-y-6">

          {selectedTab === "overview" && (
            <div className="space-y-6">
            {/* Pending Approvals */}
            {pendingRestaurants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="h-5 w-5 text-yellow-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Restaurants awaiting admin approval to join EatOff</p>
                      </TooltipContent>
                    </Tooltip>
                    <span>Pending Restaurant Approvals</span>
                    <Badge variant="secondary">{pendingRestaurants.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingRestaurants.slice(0, 5).map((restaurant) => (
                      <div key={restaurant.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{restaurant.name}</p>
                          <p className="text-sm text-muted-foreground">{restaurant.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Applied: {new Date(restaurant.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => approveRestaurant(restaurant.id)}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {loading ? "Approving..." : "Approve"}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Approve restaurant to join EatOff platform</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => suspendRestaurant(restaurant.id)}
                                disabled={loading}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                {loading ? "Rejecting..." : "Reject"}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reject restaurant application</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Approved Restaurants */}
            {approvedRestaurants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Approved Restaurants</span>
                      <Badge variant="default" className="bg-green-600">{approvedRestaurants.length}</Badge>
                    </div>
                    {approvedRestaurants.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllApproved(!showAllApproved)}
                        className="text-green-600 hover:text-green-700"
                      >
                        {showAllApproved ? "Show Less" : `Show All (${approvedRestaurants.length})`}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`space-y-3 ${showAllApproved && approvedRestaurants.length > 5 ? 'max-h-96 overflow-y-auto' : ''}`}>
                    {(showAllApproved ? approvedRestaurants : approvedRestaurants.slice(0, 5)).map((restaurant) => (
                      <div key={restaurant.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{restaurant.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{restaurant.email}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              Code: {restaurant.restaurantCode || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Approved: {restaurant.approvedAt ? new Date(restaurant.approvedAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0">
                          <Badge variant="default" className="bg-green-600">Active</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => suspendRestaurant(restaurant.id)}
                            disabled={loading}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {loading ? "Suspending..." : "Suspend"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {showAllApproved && approvedRestaurants.length > 5 && (
                    <div className="mt-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllApproved(false)}
                        className="text-green-600 hover:text-green-700"
                      >
                        Show Less
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BarChart3 className="h-5 w-5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Real-time platform growth and activity metrics</p>
                    </TooltipContent>
                  </Tooltip>
                  <span>Platform Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">User Growth</h4>
                      <p className="text-2xl font-bold text-blue-600">{metrics?.activeUsers || 0}</p>
                      <p className="text-sm text-blue-600">Active users this month</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-medium text-green-900 dark:text-green-100">Partner Growth</h4>
                      <p className="text-2xl font-bold text-green-600">{metrics?.activeRestaurants || 0}</p>
                      <p className="text-sm text-green-600">Active restaurant partners</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {selectedTab === "eatoff-vouchers" && (
            <EatOffVoucherManagement />
          )}

          {selectedTab === "restaurants" && (
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Restaurant Management</CardTitle>
                    <CardDescription>
                      Manage restaurant approvals, suspensions, and partnership status
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      console.log('Enroll button clicked, opening modal');
                      setIsEnrollRestaurantModalOpen(true);
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Enroll New Restaurant
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    Showing {restaurants?.length || 0} restaurants
                  </div>
                  {restaurants?.map((restaurant) => (
                    <div key={restaurant.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{restaurant.name}</h4>
                        <p className="text-sm text-muted-foreground">{restaurant.email}</p>
                        <div className="flex space-x-2 mt-2">
                          <Badge variant={restaurant.isApproved ? "default" : "secondary"}>
                            {restaurant.isApproved ? "Approved" : "Pending"}
                          </Badge>
                          <Badge variant={restaurant.isActive ? "default" : "destructive"}>
                            {restaurant.isActive ? "Active" : "Suspended"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {!restaurant.isApproved && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => approveRestaurant(restaurant.id)}
                              >
                                Approve
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Approve this restaurant to join EatOff</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRestaurantManagementModal(restaurant)}
                              disabled={loading}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Manage restaurant menu and voucher packages</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant={restaurant.isActive ? "destructive" : "default"}
                              onClick={() => restaurant.isActive ? suspendRestaurant(restaurant.id) : approveRestaurant(restaurant.id)}
                            >
                              {restaurant.isActive ? "Suspend" : "Reactivate"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{restaurant.isActive ? "Suspend restaurant from platform" : "Reactivate suspended restaurant"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {selectedTab === "partners" && (
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5" />
                      <span>Partners Admin</span>
                    </CardTitle>
                    <CardDescription>
                      Manage restaurant company partners with VAT codes and business information
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setIsAddPartnerModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Partner
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {partnersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading partners...</p>
                  </div>
                ) : partners && partners.length > 0 ? (
                  <div className="space-y-4">
                    {partners.map((partner) => (
                      <div key={partner.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h4 className="font-semibold text-lg">{partner.companyName}</h4>
                              <p className="text-sm text-muted-foreground">VAT: {partner.vatCode}</p>
                              <div className="mt-1 space-y-1">
                                {partner.contactPersonPhone && (
                                  <p className="text-xs text-muted-foreground">📞 {partner.contactPersonPhone}</p>
                                )}
                                {partner.contactPersonEmail && (
                                  <p className="text-xs text-muted-foreground">✉️ {partner.contactPersonEmail}</p>
                                )}
                                {partner.companyEmail && partner.companyEmail !== partner.contactPersonEmail && (
                                  <p className="text-xs text-muted-foreground">🏢 {partner.companyEmail}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm">
                            <span className="text-muted-foreground">
                              <strong>Contact:</strong> {partner.contactPersonName} ({partner.contactPersonTitle})
                            </span>
                            <span className="text-muted-foreground">
                              <strong>Restaurants:</strong> {partner.restaurantCount || 0}
                            </span>
                            <span className="text-muted-foreground">
                              <strong>Revenue:</strong> €{partner.totalRevenue?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <div className="mt-2 flex space-x-2">
                            <Badge variant={partner.isVerified ? "default" : "secondary"}>
                              {partner.isVerified ? "Verified" : "Unverified"}
                            </Badge>
                            <Badge variant={partner.isActive ? "default" : "destructive"}>
                              {partner.isActive ? "Active" : "Suspended"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditPartnerModal(partner)}
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={partner.isActive ? "destructive" : "default"}
                            onClick={() => togglePartnerStatus(partner.id, partner.isActive)}
                            disabled={loading}
                          >
                            {partner.isActive ? "Suspend" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-medium">No Partners Yet</h3>
                    <p>Add partner companies to manage restaurant operations with VAT codes.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          )}

          {selectedTab === "users" && (
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage customer accounts, memberships, and user activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                    <p className="text-lg font-medium">User Management System</p>
                    <p className="text-sm">Comprehensive user analytics and management tools</p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">Total Users</h4>
                        <p className="text-2xl font-bold text-blue-600">{metrics?.totalUsers || 0}</p>
                        <p className="text-sm text-blue-600">Registered customers</p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium text-green-900 dark:text-green-100">Active Users</h4>
                        <p className="text-2xl font-bold text-green-600">{metrics?.activeUsers || 0}</p>
                        <p className="text-sm text-green-600">Monthly active users</p>
                      </div>
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <h4 className="font-medium text-orange-900 dark:text-orange-100">User Growth</h4>
                        <p className="text-2xl font-bold text-orange-600">+12%</p>
                        <p className="text-sm text-orange-600">This month vs last</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {selectedTab === "finances" && (
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CreditCard className="h-5 w-5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Financial data, revenue, and commission tracking</p>
                    </TooltipContent>
                  </Tooltip>
                  <span>Financial Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium">Monthly Revenue</h4>
                    <p className="text-2xl font-bold">€{metrics?.totalRevenue || 0}</p>
                    <p className="text-sm text-muted-foreground">Total platform revenue</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium">Commission Earned</h4>
                    <p className="text-2xl font-bold">€{metrics?.totalCommission || 0}</p>
                    <p className="text-sm text-muted-foreground">Platform commission (5%)</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium">Pending Settlements</h4>
                    <p className="text-2xl font-bold">€0</p>
                    <p className="text-sm text-muted-foreground">Due to restaurants</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {selectedTab === "settings" && (
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Settings className="h-5 w-5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Configure platform-wide settings and parameters</p>
                    </TooltipContent>
                  </Tooltip>
                  <span>Platform Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure platform-wide settings and parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {settings?.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{setting.settingKey}</h4>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{setting.settingValue}</p>
                        <p className="text-xs text-muted-foreground">
                          Type: {setting.settingType}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No platform settings configured yet.</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button className="mt-4">Add Setting</Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Create new platform configuration setting</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </div>
          )}
        </div>
        </div>
      </div>
    </TooltipProvider>

    {/* Restaurant Enrollment Modal - Viewport Centered */}
    {isEnrollRestaurantModalOpen && (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}
        onClick={() => setIsEnrollRestaurantModalOpen(false)}
      >
        <div 
          ref={(el) => {
            if (el) {
              el.focus();
              el.scrollIntoView({ behavior: 'instant', block: 'center' });
            }
          }}
          tabIndex={-1}
          style={{
            position: 'relative',
            width: 'min(90vw, 768px)',
            maxHeight: '85vh',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflowY: 'auto',
            padding: '24px',
            outline: 'none',
            margin: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Enroll New Restaurant</h2>
            <button 
              onClick={() => setIsEnrollRestaurantModalOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mb-6">Create a new restaurant profile and owner account for platform access</p>
          
          <Form {...enrollmentForm}>
            <form onSubmit={enrollmentForm.handleSubmit(handleRestaurantEnrollment)} className="space-y-6">
              {/* Restaurant Information Section */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Restaurant Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={enrollmentForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Amazing Restaurant" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="cuisine"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cuisine Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select cuisine type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Italian">Italian</SelectItem>
                            <SelectItem value="Asian">Asian</SelectItem>
                            <SelectItem value="Mexican">Mexican</SelectItem>
                            <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                            <SelectItem value="American">American</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                            <SelectItem value="Indian">Indian</SelectItem>
                            <SelectItem value="Chinese">Chinese</SelectItem>
                            <SelectItem value="Japanese">Japanese</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="restaurant@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <FormField
                    control={enrollmentForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <textarea 
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Brief description of your restaurant..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={enrollmentForm.control}
                    name="priceRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Range</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select price range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="$">$ - Budget Friendly</SelectItem>
                            <SelectItem value="$$">$$ - Moderate</SelectItem>
                            <SelectItem value="$$$">$$$ - Upscale</SelectItem>
                            <SelectItem value="$$$$">$$$$ - Fine Dining</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Company Information Section */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={enrollmentForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Restaurant Company Ltd." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID / VAT Number</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678901" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Registration Number</FormLabel>
                        <FormControl>
                          <Input placeholder="CRN123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <FormField
                    control={enrollmentForm.control}
                    name="companyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Registered Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Business Street, City, State/Province, Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Banking Information Section */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Banking Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={enrollmentForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="National Bank" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="accountHolder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Restaurant Company Ltd." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <FormField
                    control={enrollmentForm.control}
                    name="iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN (International Bank Account Number)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="GB82 WEST 1234 5698 7654 32" 
                            {...field}
                            style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
                            onChange={(e) => {
                              // Format IBAN with spaces for better readability
                              const value = e.target.value.replace(/\s/g, '').toUpperCase();
                              const formatted = value.replace(/(.{4})/g, '$1 ').trim();
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Owner Account Section */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Owner Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={enrollmentForm.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="ownerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="owner@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="ownerPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Strong password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsEnrollRestaurantModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                >
                  {loading ? 'Enrolling...' : 'Enroll Restaurant'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    )}

    {/* Add Partner Modal */}
    {isAddPartnerModalOpen && (
      <div 
        className="fixed inset-0 z-50 overflow-y-auto"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsAddPartnerModalOpen(false);
          }
        }}
      >
        <div 
          className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          style={{
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Form {...partnerForm}>
            <form onSubmit={partnerForm.handleSubmit(handlePartnerSubmit)} className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Partner</h2>
                  <p className="text-gray-600 dark:text-gray-300">Create a new partner company with VAT code identification</p>
                </div>
              </div>

              {/* Company Information Section */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={partnerForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Restaurant Holdings Ltd." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="vatCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAT Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="GB123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="companyEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="info@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="companyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Phone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+44 20 1234 5678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="companyWebsite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="businessRegistrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Registration Number</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <FormField
                    control={partnerForm.control}
                    name="companyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Address *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="123 Business Street, City, Postal Code, Country" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Person Section */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Contact Person</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={partnerForm.control}
                    name="contactPersonName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="contactPersonTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="CEO / Managing Director" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="contactPersonPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+44 20 1234 5678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="contactPersonEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Banking Information Section */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Banking Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={partnerForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="National Bank" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="accountHolder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Restaurant Company Ltd." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <FormField
                    control={partnerForm.control}
                    name="iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN (International Bank Account Number)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="GB82 WEST 1234 5698 7654 32" 
                            {...field}
                            style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
                            onChange={(e) => {
                              // Format IBAN with spaces for better readability
                              const value = e.target.value.replace(/\s/g, '').toUpperCase();
                              const formatted = value.replace(/(.{4})/g, '$1 ').trim();
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsAddPartnerModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Creating...' : 'Create Partner'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    )}

    {/* Edit Partner Modal - Viewport Centered */}
    {isEditPartnerModalOpen && (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsEditPartnerModalOpen(false);
            setEditingPartner(null);
          }
        }}
      >
        <div 
          ref={(el) => {
            if (el) {
              el.focus();
              el.scrollIntoView({ behavior: 'instant', block: 'center' });
            }
          }}
          tabIndex={-1}
          className="dark:bg-gray-800 dark:border-gray-700"
          style={{
            position: 'relative',
            width: 'min(90vw, 768px)',
            maxHeight: '85vh',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflowY: 'auto',
            padding: '24px',
            outline: 'none',
            margin: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Form {...partnerForm}>
            <form onSubmit={partnerForm.handleSubmit(handleUpdatePartner)} className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Partner Information</h2>
                  <p className="text-gray-600 dark:text-gray-300">Update partner company details and contact information</p>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setIsEditPartnerModalOpen(false);
                    setEditingPartner(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>

              {/* Company Information Section */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={partnerForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Company Ltd" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="vatCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAT Code</FormLabel>
                        <FormControl>
                          <Input placeholder="VAT123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="companyEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="info@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="companyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Phone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+44 20 1234 5678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="companyWebsite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="businessRegistrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Registration Number</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <FormField
                    control={partnerForm.control}
                    name="companyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Address *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="123 Business Street, City, Country"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Person Information */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Contact Person Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={partnerForm.control}
                    name="contactPersonName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="contactPersonTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="CEO" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="contactPersonPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person Phone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+44 20 9876 5432" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="contactPersonEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Banking Information */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Banking Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={partnerForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC Bank" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN</FormLabel>
                        <FormControl>
                          <Input placeholder="GB29 NWBK 6016 1331 9268 19" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partnerForm.control}
                    name="accountHolder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Company Ltd" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsEditPartnerModalOpen(false);
                    setEditingPartner(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Updating...' : 'Update Partner'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    )}

    {/* Restaurant Management Modal - Viewport Centered */}
    {isRestaurantManagementModalOpen && selectedRestaurant && (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsRestaurantManagementModalOpen(false);
            setSelectedRestaurant(null);
          }
        }}
      >
        <div 
          ref={(el) => {
            if (el) {
              el.focus();
              el.scrollIntoView({ behavior: 'instant', block: 'center' });
            }
          }}
          tabIndex={-1}
          className="dark:bg-gray-800 dark:border-gray-700"
          style={{
            position: 'relative',
            width: 'min(90vw, 1152px)', // max-w-6xl equivalent
            maxHeight: '85vh',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflowY: 'auto',
            padding: '24px',
            outline: 'none',
            margin: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Store className="h-6 w-6" />
                Restaurant Management
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {selectedRestaurant.name} - Menu Items & Voucher Packages
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsRestaurantManagementModalOpen(false);
                setSelectedRestaurant(null);
              }}
            >
              Close
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setManagementTab('menu')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  managementTab === 'menu'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Menu Items ({restaurantDetails?.menuItems?.length || 0})
              </button>
              <button
                onClick={() => setManagementTab('vouchers')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  managementTab === 'vouchers'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Voucher Packages ({restaurantDetails?.voucherPackages?.length || 0})
              </button>
            </div>
          </div>

          {restaurantDetailsLoading ? (
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 bg-gray-300 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Menu Items Tab */}
              {managementTab === 'menu' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Menu Items
                    </h3>
                    <Button
                      onClick={() => setIsAddMenuItemModalOpen(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Menu Item
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {restaurantDetails?.menuItems?.map((item) => (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {item.name}
                            </h4>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingMenuItem(item);
                                setIsEditMenuItemModalOpen(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex justify-between items-center mb-2">
                            <Badge variant="secondary">{item.category}</Badge>
                            <span className="font-bold text-green-600">${item.price}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.dietaryTags?.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {item.dietaryTags?.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.dietaryTags.length - 3}
                              </Badge>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.isAvailable 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {item.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                            {item.isPopular && (
                              <Badge variant="default" className="bg-orange-500">
                                Popular
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {(!restaurantDetails?.menuItems || restaurantDetails.menuItems.length === 0) && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <Store className="h-12 w-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No menu items yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Start building the restaurant menu by adding the first item.
                      </p>
                      <Button
                        onClick={() => setIsAddMenuItemModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Menu Item
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Voucher Packages Tab */}
              {managementTab === 'vouchers' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Voucher Packages
                    </h3>
                    {restaurantDetails?.voucherPackages && restaurantDetails.voucherPackages.length > 0 && (
                      <Button
                        onClick={() => setIsAddVoucherPackageModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Voucher Package
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {restaurantDetails?.voucherPackages?.map((pkg) => (
                      <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {pkg.name}
                            </h4>
                            <div className="flex space-x-1">
                              {!pkg.isActive && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleActivateVoucherPackage(pkg)}
                                  disabled={loading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingVoucherPackage(pkg);
                                  setIsEditVoucherPackageModalOpen(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this voucher package?')) {
                                    handleDeleteVoucherPackage(pkg.id);
                                  }
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {pkg.description}
                          </p>
                          <div className="space-y-2 mb-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Meals:</span>
                              <span className="font-medium">{pkg.mealCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Price per meal:</span>
                              <span className="font-medium">${pkg.pricePerMeal}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                              <span className="font-medium text-green-600">{pkg.discountPercentage}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Validity:</span>
                              <span className="font-medium">{pkg.validityMonths} months</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              pkg.isActive 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {pkg.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-sm font-bold text-blue-600">
                              Total: ${(parseFloat(pkg.pricePerMeal) * pkg.mealCount).toFixed(2)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {(!restaurantDetails?.voucherPackages || restaurantDetails.voucherPackages.length === 0) && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <CreditCard className="h-12 w-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No voucher packages yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Create voucher packages to offer discounted meal deals to customers.
                      </p>
                      <Button
                        onClick={() => {
                          console.log('Add First Voucher Package clicked', { selectedRestaurant });
                          console.log('Before setting modal state:', { isAddVoucherPackageModalOpen });
                          setIsAddVoucherPackageModalOpen(true);
                          console.log('After setting modal state to true');
                          // Force re-render check
                          setTimeout(() => {
                            console.log('Modal state after timeout:', { isAddVoucherPackageModalOpen: true });
                          }, 100);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Voucher Package
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )}



    {/* Edit Voucher Package Modal - Viewport Centered */}
    {isEditVoucherPackageModalOpen && (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsEditVoucherPackageModalOpen(false);
            setEditingVoucherPackage(null);
          }
        }}
      >
        <div 
          ref={(el) => {
            if (el) {
              el.focus();
              el.scrollIntoView({ behavior: 'instant', block: 'center' });
            }
          }}
          tabIndex={-1}
          className="dark:bg-gray-800 dark:border-gray-700"
          style={{
            position: 'relative',
            width: 'min(90vw, 800px)',
            maxHeight: '85vh',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflowY: 'auto',
            padding: '0',
            outline: 'none',
            margin: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Voucher Package - {selectedRestaurant?.name}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditVoucherPackageModalOpen(false);
                setEditingVoucherPackage(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-6">
            <PackageForm
              onSave={handleUpdateVoucherPackage}
              onCancel={() => {
                setIsEditVoucherPackageModalOpen(false);
                setEditingVoucherPackage(null);
              }}
              isLoading={loading}
              initialData={editingVoucherPackage || undefined}
            />
          </div>
        </div>
      </div>
    )}

    {/* Add Voucher Package Modal - Viewport Centered */}
    {isAddVoucherPackageModalOpen && (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsAddVoucherPackageModalOpen(false);
          }
        }}
      >
        <div 
          ref={(el) => {
            if (el) {
              el.focus();
              el.scrollIntoView({ behavior: 'instant', block: 'center' });
            }
          }}
          tabIndex={-1}
          className="dark:bg-gray-800 dark:border-gray-700"
          style={{
            position: 'relative',
            width: 'min(90vw, 800px)',
            maxHeight: '85vh',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflowY: 'auto',
            padding: '0',
            outline: 'none',
            margin: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Add Voucher Package - {selectedRestaurant?.name}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddVoucherPackageModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-6">
            <PackageForm
              onSave={handleCreateVoucherPackage}
              onCancel={() => setIsAddVoucherPackageModalOpen(false)}
              isLoading={loading}
            />
          </div>
        </div>
      </div>
    )}

    </div>
  );
}
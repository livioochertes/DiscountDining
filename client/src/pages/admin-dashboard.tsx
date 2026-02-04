import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";

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
  X,
  ChefHat,
  Star,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  Wallet,
  Coins,
  Gift
} from "lucide-react";
import { SectionNavigation } from "@/components/SectionNavigation";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import PackageForm from "@/components/package-form";
import { ObjectUploader } from "@/components/ObjectUploader";
import LanguageSelector from "@/components/LanguageSelector";

// EU Standard restaurant category options
const CUISINE_OPTIONS = [
  "Italian", "French", "Spanish", "Greek", "German", "Romanian", "Nordic", 
  "Asian", "Japanese", "Chinese", "Indian", "Mexican", "American", 
  "Lebanese", "Turkish", "Syrian", "Israeli", "Persian / Iranian", 
  "Arabian Gulf", "Egyptian", "Moroccan", "Tunisian", "Algerian", 
  "Palestinian", "Jordanian"
];

const MAIN_PRODUCT_OPTIONS = [
  "Pizzeria", "Burger", "Steakhouse", "Seafood", "Kebab", "Bakery", 
  "Desserts", "Kebab House", "Doner", "Pide", "Baklava & Sweets"
];

const DIET_CATEGORY_OPTIONS = [
  "Vegetarian", "Vegan", "Plant-Based", "Gluten-Free", "Healthy", 
  "Organic", "Halal", "Kosher"
];

const CONCEPT_TYPE_OPTIONS = [
  "Classic", "Fine Dining", "Casual Dining", "Fast Casual", 
  "Fast Food", "Street Food", "Buffet", "Food Court", "Ghost Kitchen"
];

const EXPERIENCE_TYPE_OPTIONS = [
  "Wine Bar", "Cocktail Bar", "Cafe", "Live Music", "Themed"
];

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
  mainProduct: z.string().optional(),
  dietCategory: z.string().optional(),
  conceptType: z.string().optional(),
  experienceType: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  description: z.string().min(1, "Description is required"),
  priceRange: z.string().min(1, "Price range is required"),
  imageUrl: z.string().optional(),
  marketplaceId: z.number().min(1, "Marketplace is required"),
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
  pendingRestaurants: number;
  approvedRestaurants: number;
  transactionStats: {
    total: number;
    totalAmount: number;
    weeklyCount: number;
    weeklyAmount: number;
    dailyCount: number;
    dailyAmount: number;
  };
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

interface MobileFilter {
  id: number;
  name: string;
  icon: string;
  filterType: string;
  filterValues: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const FILTER_TYPE_OPTIONS = [
  { value: "cuisine", label: "Cuisine" },
  { value: "mainProduct", label: "Main Product" },
  { value: "dietCategory", label: "Diet Category" },
  { value: "conceptType", label: "Concept Type" },
  { value: "experienceType", label: "Experience Type" },
  { value: "deals", label: "Deals" },
];

// Tier colors
const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  black: '#1C1C1C',
};

// Wallet adjustment schema
const walletAdjustmentSchema = z.object({
  adjustmentType: z.enum(['credit', 'debit', 'bonus', 'correction']),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

type WalletAdjustmentFormData = z.infer<typeof walletAdjustmentSchema>;

// Loyalty tier edit schema
const loyaltyTierEditSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  cashbackPercentage: z.number().min(0, 'Cashback must be 0 or greater').max(100, 'Cashback cannot exceed 100%'),
  minTransactionVolume: z.number().min(0, 'Min threshold must be 0 or greater'),
  maxTransactionVolume: z.number().nullable(),
});

type LoyaltyTierEditFormData = z.infer<typeof loyaltyTierEditSchema>;

interface FinancialUser {
  customer: {
    id: number;
    email: string;
    name: string;
    membershipTier: string;
    loyaltyPoints: number;
    balance: string;
    createdAt: string;
  };
  wallet: {
    cashBalance: string;
    loyaltyPoints: number;
  } | null;
}

interface LoyaltyTier {
  id: number;
  marketplaceId: number | null;
  name: string;
  displayName: string;
  cashbackPercentage: string;
  minTransactionVolume: string;
  maxTransactionVolume: string | null;
  color: string;
  icon: string;
  tierLevel: number;
  benefits: string[];
  isActive: boolean;
}

interface UserTransaction {
  id: number;
  transactionType: string;
  amount: string;
  description: string;
  balanceBefore: string;
  balanceAfter: string;
  createdAt: string;
  restaurant?: { id: number; name: string } | null;
}

// Users Financial Tab Component
function UsersFinancialTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedUserForAdjustment, setSelectedUserForAdjustment] = useState<FinancialUser | null>(null);
  const [editTierDialogOpen, setEditTierDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<LoyaltyTier | null>(null);
  const [selectedMarketplaceId, setSelectedMarketplaceId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  interface Marketplace {
    id: number;
    name: string;
    country: string;
    currencyCode: string;
    currencySymbol: string;
    isActive: boolean;
  }

  const { data: marketplacesList = [] } = useQuery<Marketplace[]>({
    queryKey: ['/api/admin/marketplaces'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/marketplaces', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch marketplaces');
      return response.json();
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const walletAdjustmentForm = useForm<WalletAdjustmentFormData>({
    resolver: zodResolver(walletAdjustmentSchema),
    defaultValues: {
      adjustmentType: 'credit',
      amount: 0,
      reason: '',
    },
  });

  const tierEditForm = useForm<LoyaltyTierEditFormData>({
    resolver: zodResolver(loyaltyTierEditSchema),
    defaultValues: {
      displayName: '',
      cashbackPercentage: 0,
      minTransactionVolume: 0,
      maxTransactionVolume: null,
    },
  });

  const { data: usersData, isLoading: usersLoading } = useQuery<{
    users: FinancialUser[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>({
    queryKey: ['/api/admin/users/financial', currentPage, debouncedSearch],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page: currentPage.toString() });
      if (debouncedSearch) params.append('search', debouncedSearch);
      const response = await fetch(`/api/admin/users/financial?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  interface LoyaltyTierWithMarketplace extends LoyaltyTier {
    marketplace?: { id: number; name: string; currencyCode: string; currencySymbol: string } | null;
  }

  const { data: loyaltyTiers = [], isLoading: tiersLoading } = useQuery<LoyaltyTierWithMarketplace[]>({
    queryKey: ['/api/admin/loyalty-tiers', selectedMarketplaceId],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const params = selectedMarketplaceId ? `?marketplaceId=${selectedMarketplaceId}` : '';
      const response = await fetch(`/api/admin/loyalty-tiers${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch loyalty tiers');
      return response.json();
    },
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery<{
    customer: any;
    transactions: UserTransaction[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>({
    queryKey: ['/api/admin/users', expandedUserId, 'transactions'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${expandedUserId}/transactions?page=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!expandedUserId,
  });

  const walletAdjustmentMutation = useMutation({
    mutationFn: async (data: WalletAdjustmentFormData & { customerId: number }) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${data.customerId}/wallet-adjustment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create adjustment');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Wallet adjustment created successfully' });
      setAdjustmentDialogOpen(false);
      walletAdjustmentForm.reset();
      setSelectedUserForAdjustment(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/financial'] });
      if (expandedUserId) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users', expandedUserId, 'transactions'] });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const tierUpdateMutation = useMutation({
    mutationFn: async (data: LoyaltyTierEditFormData & { tierId: number }) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/loyalty-tiers/${data.tierId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update tier');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Loyalty tier updated successfully' });
      setEditTierDialogOpen(false);
      tierEditForm.reset();
      setSelectedTier(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty-tiers'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const tierSeedMutation = useMutation({
    mutationFn: async (marketplaceId: number) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/loyalty-tiers/seed', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ marketplaceId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to seed tiers');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Default loyalty tiers created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty-tiers'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const tierDeleteMutation = useMutation({
    mutationFn: async (tierId: number) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/loyalty-tiers/${tierId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete tier');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Loyalty tier deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty-tiers'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleDeleteTier = (tier: LoyaltyTier) => {
    if (!confirm(`Are you sure you want to delete the "${tier.displayName}" tier?`)) return;
    tierDeleteMutation.mutate(tier.id);
  };

  const handleSeedTiers = (marketplaceId: number, marketplaceName: string) => {
    if (!confirm(`This will create the 5 default loyalty tiers (Bronze, Silver, Gold, Platinum, Black) for ${marketplaceName}. Continue?`)) return;
    tierSeedMutation.mutate(marketplaceId);
  };

  const handleExportCSV = () => {
    if (!usersData?.users?.length) return;
    
    const headers = ['Name', 'Email', 'Membership Tier', 'Wallet Balance', 'Loyalty Points', 'Cashback Balance'];
    const rows = usersData.users.map(u => [
      u.customer.name,
      u.customer.email,
      u.customer.membershipTier || 'bronze',
      u.wallet?.cashBalance || u.customer.balance || '0.00',
      u.wallet?.loyaltyPoints || u.customer.loyaltyPoints || 0,
      u.wallet?.cashBalance || '0.00',
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_financial_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openAdjustmentDialog = (user: FinancialUser) => {
    setSelectedUserForAdjustment(user);
    walletAdjustmentForm.reset({ adjustmentType: 'credit', amount: 0, reason: '' });
    setAdjustmentDialogOpen(true);
  };

  const openTierEditDialog = (tier: LoyaltyTier) => {
    setSelectedTier(tier);
    tierEditForm.reset({
      displayName: tier.displayName,
      cashbackPercentage: parseFloat(tier.cashbackPercentage),
      minTransactionVolume: parseFloat(tier.minTransactionVolume),
      maxTransactionVolume: tier.maxTransactionVolume ? parseFloat(tier.maxTransactionVolume) : null,
    });
    setEditTierDialogOpen(true);
  };

  const handleWalletAdjustmentSubmit = (data: WalletAdjustmentFormData) => {
    if (!selectedUserForAdjustment) return;
    walletAdjustmentMutation.mutate({ ...data, customerId: selectedUserForAdjustment.customer.id });
  };

  const handleTierEditSubmit = (data: LoyaltyTierEditFormData) => {
    if (!selectedTier) return;
    tierUpdateMutation.mutate({ ...data, tierId: selectedTier.id });
  };

  const getTierColor = (tier: string) => TIER_COLORS[tier.toLowerCase()] || '#808080';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Loyalty Tiers Configuration
            </span>
          </CardTitle>
          <CardDescription>Manage cashback percentages and tier thresholds per marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Marketplace:</span>
              <Select 
                value={selectedMarketplaceId?.toString() || 'all'} 
                onValueChange={(v) => setSelectedMarketplaceId(v === 'all' ? null : parseInt(v))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Marketplaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Marketplaces</SelectItem>
                  {marketplacesList.map(mp => (
                    <SelectItem key={mp.id} value={mp.id.toString()}>
                      {mp.name} ({mp.currencySymbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {tiersLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            </div>
          ) : (
            <div className="space-y-6">
              {marketplacesList.map(marketplace => {
                const marketplaceTiers = loyaltyTiers.filter(t => t.marketplaceId === marketplace.id);
                if (selectedMarketplaceId && selectedMarketplaceId !== marketplace.id) return null;
                
                return (
                  <div key={marketplace.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        {marketplace.name} 
                        <Badge variant="outline">{marketplace.currencyCode}</Badge>
                      </h3>
                      {marketplaceTiers.length === 0 && (
                        <Button 
                          size="sm" 
                          onClick={() => handleSeedTiers(marketplace.id, marketplace.name)} 
                          disabled={tierSeedMutation.isPending}
                        >
                          {tierSeedMutation.isPending ? 'Creating...' : `Seed Tiers for ${marketplace.name}`}
                        </Button>
                      )}
                    </div>
                    
                    {marketplaceTiers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {marketplaceTiers.map((tier) => (
                          <div
                            key={tier.id}
                            className="p-4 rounded-lg border-2"
                            style={{ borderColor: tier.color || getTierColor(tier.name || 'bronze') }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge
                                style={{
                                  backgroundColor: tier.color || getTierColor(tier.name || 'bronze'),
                                  color: (tier.name || 'bronze').toLowerCase() === 'black' || (tier.name || 'bronze').toLowerCase() === 'bronze' ? 'white' : 'black',
                                }}
                              >
                                {tier.icon} {tier.displayName}
                              </Badge>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => openTierEditDialog(tier)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-red-600 hover:text-red-700" 
                                  onClick={() => handleDeleteTier(tier)}
                                  disabled={tierDeleteMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p><span className="text-muted-foreground">Cashback:</span> {tier.cashbackPercentage}%</p>
                              <p><span className="text-muted-foreground">Min:</span> {marketplace.currencySymbol}{parseFloat(tier.minTransactionVolume).toFixed(0)}</p>
                              <p><span className="text-muted-foreground">Max:</span> {tier.maxTransactionVolume ? `${marketplace.currencySymbol}${parseFloat(tier.maxTransactionVolume).toFixed(0)}` : 'Unlimited'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No tiers configured for this marketplace. Click the button above to create default tiers.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              User Financial Management
            </span>
            <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={!usersData?.users?.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardTitle>
          <CardDescription>Manage user wallets, points, and financial data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {usersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading users...</p>
            </div>
          ) : usersData?.users && usersData.users.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Wallet Balance</TableHead>
                      <TableHead className="text-right">Loyalty Points</TableHead>
                      <TableHead className="text-right">Cashback Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData.users.map((user) => (
                      <>
                        <TableRow
                          key={user.customer.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedUserId(expandedUserId === user.customer.id ? null : user.customer.id)}
                        >
                          <TableCell className="font-medium">{user.customer.name}</TableCell>
                          <TableCell>{user.customer.email}</TableCell>
                          <TableCell>
                            <Badge
                              style={{
                                backgroundColor: getTierColor(user.customer.membershipTier || 'bronze'),
                                color: (user.customer.membershipTier || 'bronze').toLowerCase() === 'black' ? 'white' : 
                                       (user.customer.membershipTier || 'bronze').toLowerCase() === 'bronze' ? 'white' : 'black',
                              }}
                            >
                              {(user.customer.membershipTier || 'Bronze').charAt(0).toUpperCase() + (user.customer.membershipTier || 'bronze').slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">€{parseFloat(user.wallet?.cashBalance || user.customer.balance || '0').toFixed(2)}</TableCell>
                          <TableCell className="text-right">{user.wallet?.loyaltyPoints || user.customer.loyaltyPoints || 0}</TableCell>
                          <TableCell className="text-right">€{parseFloat(user.wallet?.cashBalance || '0').toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAdjustmentDialog(user);
                                }}
                              >
                                <Gift className="h-3 w-3 mr-1" />
                                Adjust
                              </Button>
                              {expandedUserId === user.customer.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedUserId === user.customer.id && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-muted/30">
                              <div className="p-4">
                                <h4 className="font-medium mb-3">Transaction History</h4>
                                {transactionsLoading ? (
                                  <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                                  </div>
                                ) : transactionsData?.transactions && transactionsData.transactions.length > 0 ? (
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {transactionsData.transactions.slice(0, 10).map((tx) => (
                                      <div key={tx.id} className="flex justify-between items-center p-2 bg-background rounded border text-sm">
                                        <div>
                                          <span className="font-medium">{tx.transactionType}</span>
                                          <span className="text-muted-foreground ml-2">{tx.description}</span>
                                          {tx.restaurant?.name && (
                                            <span className="text-muted-foreground ml-2">@ {tx.restaurant.name}</span>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <span className={tx.transactionType.includes('debit') ? 'text-red-600' : 'text-green-600'}>
                                            {tx.transactionType.includes('debit') ? '-' : '+'}€{parseFloat(tx.amount).toFixed(2)}
                                          </span>
                                          <span className="text-xs text-muted-foreground ml-2">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground text-sm">No transactions found</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {usersData.pagination && usersData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {usersData.pagination.page} of {usersData.pagination.totalPages} ({usersData.pagination.total} users)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= usersData.pagination.totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <p>No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Wallet Adjustment</DialogTitle>
            <DialogDescription>
              Adjust wallet balance for {selectedUserForAdjustment?.customer.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...walletAdjustmentForm}>
            <form onSubmit={walletAdjustmentForm.handleSubmit(handleWalletAdjustmentSubmit)} className="space-y-4">
              <FormField
                control={walletAdjustmentForm.control}
                name="adjustmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="credit">Credit (Add funds)</SelectItem>
                        <SelectItem value="debit">Debit (Remove funds)</SelectItem>
                        <SelectItem value="bonus">Bonus (Promotional credit)</SelectItem>
                        <SelectItem value="correction">Correction (Fix balance)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={walletAdjustmentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={walletAdjustmentForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason (min 10 characters)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the reason for this adjustment..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAdjustmentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={walletAdjustmentMutation.isPending}>
                  {walletAdjustmentMutation.isPending ? 'Processing...' : 'Submit Adjustment'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={editTierDialogOpen} onOpenChange={setEditTierDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Loyalty Tier</DialogTitle>
            <DialogDescription>
              Update settings for {selectedTier?.displayName}
            </DialogDescription>
          </DialogHeader>
          <Form {...tierEditForm}>
            <form onSubmit={tierEditForm.handleSubmit(handleTierEditSubmit)} className="space-y-4">
              <FormField
                control={tierEditForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Tier name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={tierEditForm.control}
                name="cashbackPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cashback Percentage (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={tierEditForm.control}
                name="minTransactionVolume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Threshold (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={tierEditForm.control}
                name="maxTransactionVolume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Threshold (€) - Leave empty for unlimited</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="Unlimited"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditTierDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={tierUpdateMutation.isPending}>
                  {tierUpdateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mobile Filters Management Component
function MobileFiltersManagement() {
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [editingFilter, setEditingFilter] = useState<MobileFilter | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filterName, setFilterName] = useState("");
  const [filterIcon, setFilterIcon] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterValues, setFilterValues] = useState("");
  const [filterIsActive, setFilterIsActive] = useState(true);
  const [filterSortOrder, setFilterSortOrder] = useState(0);

  const { data: mobileFilters = [], isLoading: filtersLoading } = useQuery<MobileFilter[]>({
    queryKey: ['/api/admin/mobile-filters'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/mobile-filters', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch mobile filters');
      return response.json();
    }
  });

  // Fetch available filter values from database
  const { data: availableFilterValues } = useQuery<{
    cuisine: string[];
    mainProduct: string[];
    dietCategory: string[];
    conceptType: string[];
    experienceType: string[];
  }>({
    queryKey: ['/api/admin/filter-values'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/filter-values', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch filter values');
      return response.json();
    }
  });

  // Get available options based on selected filter type
  const getAvailableOptions = (): string[] => {
    if (!availableFilterValues || !filterType) return [];
    switch (filterType) {
      case 'cuisine': return availableFilterValues.cuisine || [];
      case 'mainProduct': return availableFilterValues.mainProduct || [];
      case 'dietCategory': return availableFilterValues.dietCategory || [];
      case 'conceptType': return availableFilterValues.conceptType || [];
      case 'experienceType': return availableFilterValues.experienceType || [];
      default: return [];
    }
  };

  // Toggle a value in the filter values list
  const toggleFilterValue = (value: string) => {
    const currentValues = filterValues.split(",").map(v => v.trim()).filter(v => v);
    if (currentValues.includes(value)) {
      setFilterValues(currentValues.filter(v => v !== value).join(", "));
    } else {
      setFilterValues([...currentValues, value].join(", "));
    }
  };

  // Check if a value is selected
  const isValueSelected = (value: string): boolean => {
    const currentValues = filterValues.split(",").map(v => v.trim()).filter(v => v);
    return currentValues.includes(value);
  };

  const resetForm = () => {
    setFilterName("");
    setFilterIcon("");
    setFilterType("");
    setFilterValues("");
    setFilterIsActive(true);
    setFilterSortOrder(0);
    setIsAddingFilter(false);
    setEditingFilter(null);
  };

  const openEditForm = (filter: MobileFilter) => {
    setEditingFilter(filter);
    setFilterName(filter.name);
    setFilterIcon(filter.icon);
    setFilterType(filter.filterType);
    setFilterValues(filter.filterValues.join(", "));
    setFilterIsActive(filter.isActive);
    setFilterSortOrder(filter.sortOrder);
    setIsAddingFilter(false);
  };

  const handleSubmit = async () => {
    if (!filterName.trim() || !filterType) {
      toast({
        title: "Error",
        description: "Name and filter type are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const valuesArray = filterValues.split(",").map(v => v.trim()).filter(v => v);
      
      const body = {
        name: filterName,
        icon: filterIcon,
        filterType,
        filterValues: valuesArray,
        isActive: filterIsActive,
        sortOrder: filterSortOrder,
      };

      const url = editingFilter 
        ? `/api/admin/mobile-filters/${editingFilter.id}`
        : '/api/admin/mobile-filters';
      
      const response = await fetch(url, {
        method: editingFilter ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save filter');
      }

      toast({
        title: editingFilter ? "Filter Updated" : "Filter Created",
        description: `Mobile filter has been ${editingFilter ? 'updated' : 'created'} successfully.`,
      });

      resetForm();
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/mobile-filters'] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save filter",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (filter: MobileFilter) => {
    if (!confirm(`Are you sure you want to delete "${filter.name}"?`)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/mobile-filters/${filter.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete filter');

      toast({
        title: "Filter Deleted",
        description: "Mobile filter has been deleted successfully.",
      });

      await queryClient.invalidateQueries({ queryKey: ['/api/admin/mobile-filters'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete filter",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (filter: MobileFilter) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/mobile-filters/${filter.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !filter.isActive })
      });

      if (!response.ok) throw new Error('Failed to update filter');

      await queryClient.invalidateQueries({ queryKey: ['/api/admin/mobile-filters'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update filter status",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mobile Filters</span>
          {!isAddingFilter && !editingFilter && (
            <Button 
              onClick={() => setIsAddingFilter(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Filter
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Manage filter chips displayed in the mobile app for restaurant filtering
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(isAddingFilter || editingFilter) && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
            <h4 className="font-medium">{editingFilter ? "Edit Filter" : "Add New Filter"}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="Filter name (e.g., Pizza)"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Icon (Emoji)</label>
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Click an emoji or type here"
                    value={filterIcon}
                    onChange={(e) => setFilterIcon(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {["🍕", "🍔", "🥗", "☕", "🍜", "🏷️", "🍣", "🌮", "🍰", "🍺"].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFilterIcon(emoji)}
                        className={`w-8 h-8 text-lg rounded border hover:bg-gray-100 transition-colors ${filterIcon === emoji ? 'border-primary bg-primary/10' : 'border-gray-200'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter Type</label>
                <Select value={filterType} onValueChange={(val) => { setFilterType(val); setFilterValues(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select filter type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort Order</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filterSortOrder}
                  onChange={(e) => setFilterSortOrder(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Filter Values</label>
                {filterType === 'deals' ? (
                  <p className="text-sm text-muted-foreground py-2">
                    This filter shows restaurants with active vouchers/deals. No additional values needed.
                  </p>
                ) : getAvailableOptions().length > 0 ? (
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {getAvailableOptions().map((option) => (
                        <label
                          key={option}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                            isValueSelected(option)
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white hover:bg-gray-50 border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isValueSelected(option)}
                            onChange={() => toggleFilterValue(option)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Italian, French, Asian"
                      value={filterValues}
                      onChange={(e) => setFilterValues(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {filterType ? 'No values found in database. Enter values manually (comma-separated).' : 'Select a filter type first, then choose values.'}
                    </p>
                  </div>
                )}
                {filterValues && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {filterValues}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={filterIsActive}
                  onCheckedChange={setFilterIsActive}
                />
                <label className="text-sm font-medium">Active</label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : editingFilter ? "Update Filter" : "Create Filter"}
              </Button>
            </div>
          </div>
        )}

        {filtersLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading mobile filters...</p>
          </div>
        ) : mobileFilters.length > 0 ? (
          <div className="space-y-3">
            {mobileFilters.map((filter) => (
              <div key={filter.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{filter.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{filter.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {FILTER_TYPE_OPTIONS.find(o => o.value === filter.filterType)?.label || filter.filterType}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {filter.filterValues.slice(0, 5).map((val, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {val}
                        </Badge>
                      ))}
                      {filter.filterValues.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{filter.filterValues.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={filter.isActive}
                      onCheckedChange={() => handleToggleActive(filter)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {filter.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(filter)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(filter)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No mobile filters configured yet.</p>
            <Button 
              className="mt-4" 
              onClick={() => setIsAddingFilter(true)}
            >
              Add Your First Filter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
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
  const { data: eatoffVouchers, isLoading: vouchersLoading, refetch: refetchEatoffVouchers } = useQuery({
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

  // Fetch marketplaces for restaurant enrollment
  const { data: marketplacesList = [] } = useQuery<Marketplace[]>({
    queryKey: ['/api/marketplaces'],
    queryFn: async () => {
      const response = await fetch('/api/marketplaces');
      if (!response.ok) throw new Error('Failed to fetch marketplaces');
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
                  <div className="flex items-center gap-2 mr-4">
                    <div className="flex flex-col items-center">
                      <label className="text-xs text-gray-500 mb-1">Priority</label>
                      <select
                        value={voucher.priority ?? 3}
                        onChange={async (e) => {
                          const priority = parseInt(e.target.value);
                          try {
                            const token = localStorage.getItem('adminToken');
                            await fetch(`/api/admin/eatoff-vouchers/${voucher.id}/priority`, {
                              method: 'PATCH',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ priority })
                            });
                            refetchEatoffVouchers();
                            await queryClient.invalidateQueries({ queryKey: ['/api/eatoff-vouchers'] });
                            await queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
                            toast({ title: "Priority updated" });
                          } catch (error) {
                            toast({ title: "Error updating priority", variant: "destructive" });
                          }
                        }}
                        className="w-16 p-1 text-sm border rounded"
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                      </select>
                    </div>
                    <div className="flex flex-col items-center">
                      <label className="text-xs text-gray-500 mb-1">Position</label>
                      <input
                        type="number"
                        value={voucher.position ?? 0}
                        min="0"
                        onChange={async (e) => {
                          const position = parseInt(e.target.value) || 0;
                          try {
                            const token = localStorage.getItem('adminToken');
                            await fetch(`/api/admin/eatoff-vouchers/${voucher.id}/priority`, {
                              method: 'PATCH',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ position })
                            });
                            refetchEatoffVouchers();
                            await queryClient.invalidateQueries({ queryKey: ['/api/eatoff-vouchers'] });
                            await queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
                            toast({ title: "Position updated" });
                          } catch (error) {
                            toast({ title: "Error updating position", variant: "destructive" });
                          }
                        }}
                        className="w-16 p-1 text-sm border rounded"
                      />
                    </div>
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

// Wallet & Credit Management Tab
interface CreditType {
  id: number;
  name: string;
  amount: string;
  description: string | null;
  interestRate: string;
  paymentTermDays: number;
  displayOrder: number;
  isActive: boolean;
  isCustomAmount: boolean;
  minCustomAmount: string | null;
  maxCustomAmount: string | null;
}

interface CreditRequest {
  id: number;
  customerId: number;
  status: string;
  creditLimit: string;
  requestedAmount: string | null;
  fullName: string | null;
  cnp: string | null;
  phone: string | null;
  createdAt: string;
  customer?: { firstName: string; lastName: string; email: string };
}

interface Marketplace {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  currencyCode: string;
  currencySymbol: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Settlement {
  id: number;
  restaurantId: number;
  periodStart: string;
  periodEnd: string;
  grossAmount: string;
  commissionAmount: string;
  commissionRate: string;
  netAmount: string;
  transactionCount: number;
  status: string;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  createdAt: string;
  restaurant?: { id: number; name: string; restaurantCode?: string; stripeConnectAccountId?: string | null };
}

interface SettlementMetrics {
  pendingCount: number;
  pendingSum: number;
  thisWeekSum: number;
  totalPaidOut: number;
  avgCommissionRate: number;
}

interface SettlementTransaction {
  id: number;
  amount: string;
  transactionType: string;
  description: string;
  createdAt: string;
}

function FinancesTabContent({ metrics }: { metrics?: DashboardMetrics }) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSettlementId, setExpandedSettlementId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settlementMetrics, isLoading: metricsLoading } = useQuery<SettlementMetrics>({
    queryKey: ['/api/admin/settlements/metrics'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/settlements/metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch settlement metrics');
      return response.json();
    },
  });

  const { data: settlementsData, isLoading: settlementsLoading } = useQuery<{
    settlements: Settlement[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>({
    queryKey: ['/api/admin/settlements', currentPage, statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page: currentPage.toString() });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await fetch(`/api/admin/settlements?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch settlements');
      return response.json();
    },
  });

  const { data: settlementTransactions, isLoading: transactionsLoading } = useQuery<{
    settlement: Settlement;
    transactions: SettlementTransaction[];
  }>({
    queryKey: ['/api/admin/settlements', expandedSettlementId, 'transactions'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/settlements/${expandedSettlementId}/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!expandedSettlementId,
  });

  const generateSettlementsMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/settlements/generate-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate settlements');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Success', description: `Generated ${data.count} settlements` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settlements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settlements/metrics'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (settlementId: number) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/settlements/${settlementId}/mark-paid`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'manual' }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark as paid');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Settlement marked as paid' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settlements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settlements/metrics'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const stripePayoutMutation = useMutation({
    mutationFn: async (settlementId: number) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/settlements/${settlementId}/payout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process Stripe payout');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Success', description: `Payout processed! Transfer ID: ${data.transferId}` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settlements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settlements/metrics'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Payout Failed', description: error.message, variant: 'destructive' });
    },
  });

  const sendEmailsMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('adminToken');
      const settlementIds = settlementsData?.settlements
        .filter(s => s.status === 'pending')
        .map(s => s.id) || [];
      const response = await fetch('/api/admin/settlements/send-emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlementIds }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send emails');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Success', description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleExportForBank = () => {
    if (!settlementsData?.settlements?.length) return;
    
    const pendingSettlements = settlementsData.settlements.filter(s => s.status === 'pending' || s.status === 'processing');
    if (pendingSettlements.length === 0) {
      toast({ title: 'No Pending Settlements', description: 'No settlements to export for bank transfer', variant: 'destructive' });
      return;
    }
    
    const headers = ['Restaurant Name', 'Restaurant Code', 'IBAN', 'Amount', 'Reference', 'Period'];
    const rows = pendingSettlements.map(s => [
      s.restaurant?.name || 'Unknown',
      s.restaurant?.restaurantCode || '',
      'IBAN_PLACEHOLDER',
      parseFloat(s.netAmount).toFixed(2),
      `SETTLE-${s.id}-${new Date(s.periodEnd).toISOString().split('T')[0]}`,
      `${new Date(s.periodStart).toLocaleDateString()} - ${new Date(s.periodEnd).toLocaleDateString()}`,
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank_settlements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `Exported ${pendingSettlements.length} settlements for bank transfer` });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; bg: string }> = {
      pending: { color: 'text-yellow-800', bg: 'bg-yellow-100' },
      processing: { color: 'text-blue-800', bg: 'bg-blue-100' },
      paid: { color: 'text-green-800', bg: 'bg-green-100' },
      failed: { color: 'text-red-800', bg: 'bg-red-100' },
    };
    const variant = variants[status] || variants.pending;
    return (
      <Badge className={`${variant.bg} ${variant.color} border-0`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: string | number) => {
    return `€${parseFloat(amount.toString()).toFixed(2)}`;
  };

  const formatDateRange = (start: string, end: string) => {
    return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Financial Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium">Monthly Revenue</h4>
              <p className="text-2xl font-bold">{formatCurrency(metrics?.totalRevenue || 0)}</p>
              <p className="text-sm text-muted-foreground">Total platform revenue</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium">Commission Earned</h4>
              <p className="text-2xl font-bold">{formatCurrency(metrics?.totalCommission || 0)}</p>
              <p className="text-sm text-muted-foreground">Platform commission (5%)</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium">Pending Settlements</h4>
              <p className="text-2xl font-bold">{formatCurrency(settlementMetrics?.pendingSum || 0)}</p>
              <p className="text-sm text-muted-foreground">Due to restaurants</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Restaurant Settlements
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportForBank}
                disabled={!settlementsData?.settlements?.length}
              >
                <Download className="h-4 w-4 mr-2" />
                Export for Bank
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendEmailsMutation.mutate()}
                disabled={sendEmailsMutation.isPending}
              >
                {sendEmailsMutation.isPending ? 'Sending...' : 'Email Settlement PDFs'}
              </Button>
              <Button
                size="sm"
                onClick={() => generateSettlementsMutation.mutate()}
                disabled={generateSettlementsMutation.isPending}
              >
                {generateSettlementsMutation.isPending ? 'Generating...' : 'Generate Weekly Settlements'}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>Manage restaurant payouts and settlement reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Pending Settlements</h4>
              <p className="text-2xl font-bold">{settlementMetrics?.pendingCount || 0}</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">{formatCurrency(settlementMetrics?.pendingSum || 0)} total</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-200">This Week's Settlements</h4>
              <p className="text-2xl font-bold">{formatCurrency(settlementMetrics?.thisWeekSum || 0)}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Generated this week</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-800 dark:text-green-200">Total Paid Out</h4>
              <p className="text-2xl font-bold">{formatCurrency(settlementMetrics?.totalPaidOut || 0)}</p>
              <p className="text-sm text-green-600 dark:text-green-400">All time payouts</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-medium text-purple-800 dark:text-purple-200">Avg Commission Rate</h4>
              <p className="text-2xl font-bold">{(settlementMetrics?.avgCommissionRate || 0).toFixed(2)}%</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">Platform commission</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by status:</span>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {settlementsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading settlements...</p>
            </div>
          ) : settlementsData?.settlements && settlementsData.settlements.length > 0 ? (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Gross Amount</TableHead>
                      <TableHead className="text-right">Commission (%)</TableHead>
                      <TableHead className="text-right">Commission Amount</TableHead>
                      <TableHead className="text-right">Net Payout</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlementsData.settlements.map((settlement) => (
                      <>
                        <TableRow key={settlement.id}>
                          <TableCell className="font-medium">
                            {settlement.restaurant?.name || 'Unknown'}
                            {settlement.restaurant?.restaurantCode && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({settlement.restaurant.restaurantCode})
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDateRange(settlement.periodStart, settlement.periodEnd)}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(settlement.grossAmount)}</TableCell>
                          <TableCell className="text-right">{parseFloat(settlement.commissionRate).toFixed(2)}%</TableCell>
                          <TableCell className="text-right">{formatCurrency(settlement.commissionAmount)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(settlement.netAmount)}</TableCell>
                          <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {(settlement.status === 'pending' || settlement.status === 'processing') && (
                                <>
                                  {settlement.restaurant?.stripeConnectAccountId ? (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => stripePayoutMutation.mutate(settlement.id)}
                                      disabled={stripePayoutMutation.isPending}
                                      className="bg-purple-600 hover:bg-purple-700"
                                    >
                                      <CreditCard className="h-3 w-3 mr-1" />
                                      {stripePayoutMutation.isPending ? 'Processing...' : 'Stripe Payout'}
                                    </Button>
                                  ) : (
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Setup Required
                                    </Badge>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => markPaidMutation.mutate(settlement.id)}
                                    disabled={markPaidMutation.isPending}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Mark Paid
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setExpandedSettlementId(
                                  expandedSettlementId === settlement.id ? null : settlement.id
                                )}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                {expandedSettlementId === settlement.id ? 'Hide' : 'View'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedSettlementId === settlement.id && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-muted/30">
                              <div className="p-4">
                                <h4 className="font-medium mb-3">
                                  Settlement Transactions ({settlement.transactionCount} transactions)
                                </h4>
                                {transactionsLoading ? (
                                  <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                                  </div>
                                ) : settlementTransactions?.transactions && settlementTransactions.transactions.length > 0 ? (
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {settlementTransactions.transactions.map((tx) => (
                                      <div key={tx.id} className="flex justify-between items-center p-2 bg-background rounded border text-sm">
                                        <div>
                                          <span className="font-medium">{tx.transactionType}</span>
                                          <span className="text-muted-foreground ml-2">{tx.description}</span>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-green-600">+{formatCurrency(tx.amount)}</span>
                                          <span className="text-xs text-muted-foreground ml-2">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground text-sm">No transactions found for this period</p>
                                )}
                                {settlement.paidAt && (
                                  <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                                    <p>Paid on: {new Date(settlement.paidAt).toLocaleDateString()}</p>
                                    {settlement.paymentMethod && <p>Method: {settlement.paymentMethod}</p>}
                                    {settlement.paymentReference && <p>Reference: {settlement.paymentReference}</p>}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {settlementsData.pagination && settlementsData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {settlementsData.pagination.page} of {settlementsData.pagination.totalPages} ({settlementsData.pagination.total} settlements)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= settlementsData.pagination.totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-medium">No Settlements Yet</h3>
              <p>Click "Generate Weekly Settlements" to create settlement reports for active restaurants.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MarketplacesTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    countryCode: '',
    currencyCode: '',
    currencySymbol: '',
    isActive: true,
    isDefault: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: marketplaces = [], refetch } = useQuery<Marketplace[]>({
    queryKey: ['/api/admin/marketplaces'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/marketplaces', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch marketplaces');
      return response.json();
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      country: '',
      countryCode: '',
      currencyCode: '',
      currencySymbol: '',
      isActive: true,
      isDefault: false
    });
    setShowCreate(false);
    setEditingId(null);
  };

  const handleEdit = (marketplace: Marketplace) => {
    setFormData({
      name: marketplace.name,
      country: marketplace.country,
      countryCode: marketplace.countryCode,
      currencyCode: marketplace.currencyCode,
      currencySymbol: marketplace.currencySymbol,
      isActive: marketplace.isActive,
      isDefault: marketplace.isDefault
    });
    setEditingId(marketplace.id);
    setShowCreate(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingId 
        ? `/api/admin/marketplaces/${editingId}` 
        : '/api/admin/marketplaces';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save marketplace');
      }

      toast({
        title: editingId ? 'Marketplace updated' : 'Marketplace created',
        description: `${formData.name} has been ${editingId ? 'updated' : 'created'} successfully.`
      });

      resetForm();
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/marketplaces/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || 'Failed to delete marketplace');
      }

      toast({
        title: 'Marketplace deleted',
        description: `${name} has been deleted successfully.`
      });
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Marketplaces
            </CardTitle>
            <CardDescription>
              Manage operating regions with their currencies. Each restaurant belongs to one marketplace.
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Marketplace
          </Button>
        </CardHeader>
        <CardContent>
          {showCreate && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
              <h3 className="font-semibold">{editingId ? 'Edit Marketplace' : 'Create New Marketplace'}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Romania, Spain - Barcelona"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g., Romania, Spain"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country Code (ISO)</label>
                  <Input
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })}
                    placeholder="e.g., RO, ES, DE"
                    maxLength={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Currency Code (ISO)</label>
                  <Input
                    value={formData.currencyCode}
                    onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value.toUpperCase() })}
                    placeholder="e.g., RON, EUR, USD"
                    maxLength={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Currency Symbol</label>
                  <Input
                    value={formData.currencySymbol}
                    onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                    placeholder="e.g., Lei, €, $"
                    required
                  />
                </div>
                <div className="flex items-center gap-6 pt-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Default</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Country</th>
                  <th className="text-left p-2">Code</th>
                  <th className="text-left p-2">Currency</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {marketplaces.map((mp) => (
                  <tr key={mp.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-2 font-medium">{mp.name}</td>
                    <td className="p-2">{mp.country}</td>
                    <td className="p-2">{mp.countryCode}</td>
                    <td className="p-2">
                      <span className="font-mono">{mp.currencyCode}</span>
                      <span className="text-gray-500 ml-1">({mp.currencySymbol})</span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        {mp.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {mp.isDefault && (
                          <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(mp)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(mp.id, mp.name)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {marketplaces.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      No marketplaces configured yet. Add your first marketplace to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WalletCreditTab() {
  const [showCreateCreditType, setShowCreateCreditType] = useState(false);
  const [newCreditType, setNewCreditType] = useState({
    name: '',
    amount: '',
    description: '',
    interestRate: '0',
    paymentTermDays: 30,
    displayOrder: 0,
    isCustomAmount: false,
    minCustomAmount: '100',
    maxCustomAmount: '10000'
  });
  const [isCreatingCreditType, setIsCreatingCreditType] = useState(false);
  const [creditSubTab, setCreditSubTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const { toast } = useToast();

  // Fetch credit types
  const { data: creditTypes = [], refetch: refetchCreditTypes } = useQuery<CreditType[]>({
    queryKey: ['/api/admin/credit-types'],
  });

  // Fetch credit requests
  const { data: creditRequests = [], refetch: refetchCreditRequests } = useQuery<CreditRequest[]>({
    queryKey: ['/api/admin/credit-requests'],
  });

  const handleCreateCreditType = async () => {
    if (!newCreditType.name || (!newCreditType.isCustomAmount && !newCreditType.amount)) return;
    setIsCreatingCreditType(true);
    try {
      const response = await fetch('/api/admin/credit-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newCreditType.name,
          amount: newCreditType.isCustomAmount ? '0' : newCreditType.amount,
          description: newCreditType.description,
          interestRate: newCreditType.interestRate,
          paymentTermDays: newCreditType.paymentTermDays,
          displayOrder: newCreditType.displayOrder,
          isCustomAmount: newCreditType.isCustomAmount,
          minCustomAmount: newCreditType.isCustomAmount ? newCreditType.minCustomAmount : null,
          maxCustomAmount: newCreditType.isCustomAmount ? newCreditType.maxCustomAmount : null
        }),
      });
      if (response.ok) {
        setNewCreditType({
          name: '', amount: '', description: '', interestRate: '0',
          paymentTermDays: 30, displayOrder: 0, isCustomAmount: false,
          minCustomAmount: '100', maxCustomAmount: '10000'
        });
        setShowCreateCreditType(false);
        refetchCreditTypes();
        toast({ title: "Credit type created successfully" });
      }
    } catch (error) {
      console.error('Failed to create credit type:', error);
      toast({ title: "Failed to create credit type", variant: "destructive" });
    } finally {
      setIsCreatingCreditType(false);
    }
  };

  const handleToggleCreditType = async (id: number, isActive: boolean) => {
    try {
      await fetch(`/api/admin/credit-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !isActive }),
      });
      refetchCreditTypes();
    } catch (error) {
      console.error('Failed to toggle credit type:', error);
    }
  };

  const handleApproveCreditRequest = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/credit-requests/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        refetchCreditRequests();
        toast({ title: "Credit request approved" });
      }
    } catch (error) {
      console.error('Failed to approve credit:', error);
    }
  };

  const handleRejectCreditRequest = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/credit-requests/${id}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        refetchCreditRequests();
        toast({ title: "Credit request rejected" });
      }
    } catch (error) {
      console.error('Failed to reject credit:', error);
    }
  };

  const filteredRequests = creditRequests.filter(r => r.status === creditSubTab);

  return (
    <div className="space-y-6">
      {/* Credit Types Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Credit Types (Predefined Amounts)</CardTitle>
            <Button onClick={() => setShowCreateCreditType(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Credit Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCreateCreditType && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={newCreditType.name}
                    onChange={(e) => setNewCreditType({ ...newCreditType, name: e.target.value })}
                    placeholder="e.g., Credit Plus"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount (RON)</label>
                  <Input
                    type="number"
                    value={newCreditType.amount}
                    onChange={(e) => setNewCreditType({ ...newCreditType, amount: e.target.value })}
                    placeholder="e.g., 1000"
                    disabled={newCreditType.isCustomAmount}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Interest Rate %</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newCreditType.interestRate}
                    onChange={(e) => setNewCreditType({ ...newCreditType, interestRate: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Term (Days)</label>
                  <Input
                    type="number"
                    value={newCreditType.paymentTermDays}
                    onChange={(e) => setNewCreditType({ ...newCreditType, paymentTermDays: parseInt(e.target.value) || 30 })}
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Display Order</label>
                  <Input
                    type="number"
                    value={newCreditType.displayOrder}
                    onChange={(e) => setNewCreditType({ ...newCreditType, displayOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={newCreditType.description}
                    onChange={(e) => setNewCreditType({ ...newCreditType, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={newCreditType.isCustomAmount}
                    onChange={(e) => setNewCreditType({ ...newCreditType, isCustomAmount: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <label className="text-sm">Custom Amount Option</label>
                </div>
              </div>
              {newCreditType.isCustomAmount && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Min Amount (RON)</label>
                    <Input
                      type="number"
                      value={newCreditType.minCustomAmount}
                      onChange={(e) => setNewCreditType({ ...newCreditType, minCustomAmount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Amount (RON)</label>
                    <Input
                      type="number"
                      value={newCreditType.maxCustomAmount}
                      onChange={(e) => setNewCreditType({ ...newCreditType, maxCustomAmount: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleCreateCreditType} disabled={isCreatingCreditType} className="bg-green-600 hover:bg-green-700">
                  {isCreatingCreditType ? 'Creating...' : 'Create Credit Type'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateCreditType(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {creditTypes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No credit types defined yet. Add one to get started.</p>
          ) : (
            <div className="space-y-2">
              {creditTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="font-medium">{type.name}</span>
                      {type.description && <span className="text-gray-500 text-sm ml-2">- {type.description}</span>}
                    </div>
                    <Badge variant={type.isCustomAmount ? "secondary" : "default"}>
                      {type.isCustomAmount ? `${type.minCustomAmount}-${type.maxCustomAmount} RON` : `${type.amount} RON`}
                    </Badge>
                    <span className="text-sm text-gray-500">{type.interestRate}% interest</span>
                    <span className="text-sm text-gray-500">{type.paymentTermDays} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={type.isActive ? "default" : "secondary"}>
                      {type.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleCreditType(type.id, type.isActive)}
                    >
                      {type.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Requests Section */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Requests</CardTitle>
          <div className="flex gap-2 mt-2">
            <Button
              variant={creditSubTab === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCreditSubTab('pending')}
            >
              Pending ({creditRequests.filter(r => r.status === 'pending').length})
            </Button>
            <Button
              variant={creditSubTab === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCreditSubTab('approved')}
            >
              Approved ({creditRequests.filter(r => r.status === 'approved').length})
            </Button>
            <Button
              variant={creditSubTab === 'rejected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCreditSubTab('rejected')}
            >
              Rejected ({creditRequests.filter(r => r.status === 'rejected').length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No {creditSubTab} credit requests.</p>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{request.fullName || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">
                      CNP: {request.cnp || 'N/A'} | Phone: {request.phone || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Requested: {request.requestedAmount || request.creditLimit} RON
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {creditSubTab === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveCreditRequest(request.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectCreditRequest(request.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                  {creditSubTab !== 'pending' && (
                    <Badge variant={creditSubTab === 'approved' ? 'default' : 'destructive'}>
                      {creditSubTab === 'approved' ? 'Approved' : 'Rejected'}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Commissions Tab
interface CommissionsTabProps {
  setSelectedTab: (tab: string) => void;
}

interface RestaurantCommissionData {
  id: number;
  name: string;
  cuisine: string;
  commissionRate: number;
  isCashbackParticipant: boolean;
  pendingSettlement: number;
  totalSettled: number;
}

interface CommissionsResponse {
  restaurants: RestaurantCommissionData[];
  totals: {
    totalPendingSettlement: number;
    totalSettled: number;
    totalCommissionEarned: number;
    monthlyCommission: number;
    totalTransactions: number;
    activeRestaurants: number;
    cashbackParticipants: number;
  };
}

function CommissionsTab({ setSelectedTab }: CommissionsTabProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCommissionRate, setEditCommissionRate] = useState<string>("");
  const [editCashbackParticipant, setEditCashbackParticipant] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getToken = () => localStorage.getItem('adminToken') || '';

  const { data: commissionsData, isLoading } = useQuery<CommissionsResponse>({
    queryKey: ['/api/admin/restaurants/commissions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/restaurants/commissions', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Failed to fetch commission data');
      return res.json();
    }
  });

  const updateCommissionMutation = useMutation({
    mutationFn: async ({ id, commissionRate, isCashbackParticipant }: { id: number; commissionRate: number; isCashbackParticipant: boolean }) => {
      const res = await fetch(`/api/admin/restaurants/${id}/commission`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ commissionRate, isCashbackParticipant })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update commission');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Commission Updated",
        description: "Restaurant commission settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/restaurants/commissions'] });
      setEditingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const restaurants = commissionsData?.restaurants || [];
  const totals = commissionsData?.totals || {
    totalPendingSettlement: 0,
    totalSettled: 0,
    totalCommissionEarned: 0,
    monthlyCommission: 0,
    totalTransactions: 0,
    activeRestaurants: 0,
    cashbackParticipants: 0
  };

  const handleEdit = (restaurant: RestaurantCommissionData) => {
    setEditingId(restaurant.id);
    setEditCommissionRate(restaurant.commissionRate.toString());
    setEditCashbackParticipant(restaurant.isCashbackParticipant);
  };

  const handleSave = () => {
    if (editingId === null) return;
    const rate = parseFloat(editCommissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({
        title: "Invalid Rate",
        description: "Commission rate must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }
    updateCommissionMutation.mutate({
      id: editingId,
      commissionRate: rate,
      isCashbackParticipant: editCashbackParticipant
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditCommissionRate("");
    setEditCashbackParticipant(false);
  };

  const handleRestaurantClick = (restaurantName: string) => {
    setSelectedTab("restaurants");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission Earned</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totals.totalCommissionEarned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All-time platform earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totals.monthlyCommission.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Settlement</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">€{totals.totalPendingSettlement.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting payout</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Settled</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totals.totalSettled.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Paid out to restaurants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cashback Participants</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.cashbackParticipants}</div>
            <p className="text-xs text-muted-foreground">of {totals.activeRestaurants} active</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission by Restaurant</CardTitle>
          <CardDescription>Manage commission rates and cashback participation for each restaurant</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading commission data...</p>
            </div>
          ) : restaurants.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No restaurants yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant Name</TableHead>
                  <TableHead>Cuisine</TableHead>
                  <TableHead>Commission Rate (%)</TableHead>
                  <TableHead>Cashback Participant</TableHead>
                  <TableHead className="text-right">Pending Settlement</TableHead>
                  <TableHead className="text-right">Total Settled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurants.map((restaurant) => (
                  <TableRow key={restaurant.id}>
                    <TableCell>
                      <button
                        onClick={() => handleRestaurantClick(restaurant.name)}
                        className="font-medium text-primary hover:underline cursor-pointer text-left"
                      >
                        {restaurant.name}
                      </button>
                    </TableCell>
                    <TableCell>{restaurant.cuisine}</TableCell>
                    <TableCell>
                      {editingId === restaurant.id ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={editCommissionRate}
                          onChange={(e) => setEditCommissionRate(e.target.value)}
                          className="w-20"
                        />
                      ) : (
                        <span>{restaurant.commissionRate}%</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === restaurant.id ? (
                        <Switch
                          checked={editCashbackParticipant}
                          onCheckedChange={setEditCashbackParticipant}
                        />
                      ) : (
                        <Badge variant={restaurant.isCashbackParticipant ? "default" : "secondary"}>
                          {restaurant.isCashbackParticipant ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      €{restaurant.pendingSettlement.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      €{restaurant.totalSettled.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {editingId === restaurant.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={updateCommissionMutation.isPending}
                          >
                            {updateCommissionMutation.isPending ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={updateCommissionMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(restaurant)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Chef Management Tab
function ChefManagementTab() {
  const [search, setSearch] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingChef, setEditingChef] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const getToken = () => localStorage.getItem('adminToken') || '';

  const { data: chefs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/chefs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/chefs", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error("Failed to fetch chefs");
      return res.json();
    },
  });

  const { data: restaurants = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/restaurants"],
    queryFn: async () => {
      const res = await fetch("/api/admin/restaurants", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error("Failed to fetch restaurants");
      return res.json();
    },
  });

  const filteredChefs = useMemo(() => {
    return chefs.filter(item => {
      const chef = item.chef || item;
      const restaurant = item.restaurant;
      
      if (search) {
        const searchLower = search.toLowerCase();
        if (!chef.chefName?.toLowerCase().includes(searchLower) &&
            !chef.title?.toLowerCase().includes(searchLower) &&
            !restaurant?.name?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (selectedRestaurantId && selectedRestaurantId !== "all" && String(chef.restaurantId) !== selectedRestaurantId) {
        return false;
      }

      if (featuredFilter === "featured" && !chef.isFeatured) return false;
      if (featuredFilter === "not_featured" && chef.isFeatured) return false;

      return true;
    });
  }, [chefs, search, selectedRestaurantId, featuredFilter]);

  const handleToggleFeatured = async (chefId: number, currentFeatured: boolean) => {
    try {
      const res = await fetch(`/api/admin/chefs/${chefId}/featured`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ isFeatured: !currentFeatured })
      });
      if (!res.ok) throw new Error("Failed to update chef");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chefs"] });
      toast({ title: "Success", description: `Chef ${!currentFeatured ? "featured" : "unfeatured"} successfully` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update chef", variant: "destructive" });
    }
  };

  const handleDeleteChef = async (chefId: number) => {
    if (!confirm("Are you sure you want to delete this chef?")) return;
    try {
      const res = await fetch(`/api/admin/chefs/${chefId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error("Failed to delete chef");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chefs"] });
      toast({ title: "Success", description: "Chef deleted successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete chef", variant: "destructive" });
    }
  };

  const handleSaveChef = async (data: any) => {
    try {
      const isEdit = !!editingChef;
      const url = isEdit ? `/api/admin/chefs/${editingChef.id}` : "/api/admin/chefs";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error("Failed to save chef");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chefs"] });
      toast({ title: "Success", description: `Chef ${isEdit ? "updated" : "created"} successfully` });
      setIsCreateModalOpen(false);
      setEditingChef(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to save chef", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5" />
                <span>Chef Management</span>
              </CardTitle>
              <CardDescription>Manage restaurant chefs and featured profiles</CardDescription>
            </div>
            <Button onClick={() => { setEditingChef(null); setIsCreateModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Chef
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Input 
              placeholder="Search chefs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Restaurants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Restaurants</SelectItem>
                {restaurants.map((r: any) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chefs</SelectItem>
                <SelectItem value="featured">Featured Only</SelectItem>
                <SelectItem value="not_featured">Not Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading chefs...</div>
          ) : filteredChefs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No chefs found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChefs.map((item) => {
                const chef = item.chef || item;
                const restaurant = item.restaurant;
                return (
                  <Card key={chef.id} className="overflow-hidden">
                    <div className="relative h-32 bg-gradient-to-r from-teal-500 to-emerald-500">
                      {chef.coverImage && (
                        <img src={chef.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      {chef.isFeatured && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500">
                          <Star className="h-3 w-3 mr-1" /> Featured
                        </Badge>
                      )}
                    </div>
                    <div className="p-4 -mt-8 relative">
                      <div className="w-16 h-16 rounded-full border-4 border-white bg-gray-200 overflow-hidden mb-2">
                        {chef.profileImage ? (
                          <img src={chef.profileImage} alt={chef.chefName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ChefHat className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold">{chef.chefName}</h3>
                      {chef.title && <p className="text-sm text-muted-foreground">{chef.title}</p>}
                      {restaurant && (
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <Store className="h-3 w-3 mr-1" />
                          {restaurant.name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{chef.followersCount || 0} followers</span>
                        {chef.experienceLevel && <span>• {chef.experienceLevel}</span>}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleToggleFeatured(chef.id, chef.isFeatured)}
                        >
                          <Star className={`h-4 w-4 ${chef.isFeatured ? "fill-yellow-500 text-yellow-500" : ""}`} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => { setEditingChef(chef); setIsCreateModalOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`/chef/${chef.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteChef(chef.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {isCreateModalOpen && (
        <ChefFormModal
          chef={editingChef}
          restaurants={restaurants}
          onClose={() => { setIsCreateModalOpen(false); setEditingChef(null); }}
          onSave={handleSaveChef}
        />
      )}
    </div>
  );
}

function ChefFormModal({ 
  chef, 
  restaurants, 
  onClose, 
  onSave 
}: { 
  chef: any; 
  restaurants: any[]; 
  onClose: () => void; 
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    restaurantId: chef?.restaurantId || "",
    chefName: chef?.chefName || "",
    title: chef?.title || "",
    bio: chef?.bio || "",
    profileImage: chef?.profileImage || "",
    coverImage: chef?.coverImage || "",
    specialties: chef?.specialties?.join(", ") || "",
    cuisineExpertise: chef?.cuisineExpertise?.join(", ") || "",
    experienceLevel: chef?.experienceLevel || "professional",
    yearsOfExperience: chef?.yearsOfExperience || 0,
    instagram: chef?.instagram || "",
    youtube: chef?.youtube || "",
    website: chef?.website || "",
    isPublic: chef?.isPublic !== false,
    isFeatured: chef?.isFeatured || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.restaurantId || !formData.chefName.trim()) {
      return;
    }
    
    const restaurantIdNum = parseInt(formData.restaurantId as any);
    if (isNaN(restaurantIdNum)) {
      return;
    }
    
    onSave({
      ...formData,
      restaurantId: restaurantIdNum,
      specialties: formData.specialties.split(",").map(s => s.trim()).filter(Boolean),
      cuisineExpertise: formData.cuisineExpertise.split(",").map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{chef ? "Edit Chef" : "Add New Chef"}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Restaurant *</label>
            <Select 
              value={String(formData.restaurantId)} 
              onValueChange={(v) => setFormData({...formData, restaurantId: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Restaurant" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((r: any) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Chef Name *</label>
              <Input 
                value={formData.chefName}
                onChange={(e) => setFormData({...formData, chefName: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Head Chef"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <Textarea 
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Profile Image URL</label>
              <Input 
                value={formData.profileImage}
                onChange={(e) => setFormData({...formData, profileImage: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cover Image URL</label>
              <Input 
                value={formData.coverImage}
                onChange={(e) => setFormData({...formData, coverImage: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Specialties (comma-separated)</label>
              <Input 
                value={formData.specialties}
                onChange={(e) => setFormData({...formData, specialties: e.target.value})}
                placeholder="Italian, French, Pastry"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cuisine Expertise (comma-separated)</label>
              <Input 
                value={formData.cuisineExpertise}
                onChange={(e) => setFormData({...formData, cuisineExpertise: e.target.value})}
                placeholder="Mediterranean, Asian"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Experience Level</label>
              <Select 
                value={formData.experienceLevel} 
                onValueChange={(v) => setFormData({...formData, experienceLevel: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Years of Experience</label>
              <Input 
                type="number"
                value={formData.yearsOfExperience}
                onChange={(e) => setFormData({...formData, yearsOfExperience: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Instagram</label>
              <Input 
                value={formData.instagram}
                onChange={(e) => setFormData({...formData, instagram: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">YouTube</label>
              <Input 
                value={formData.youtube}
                onChange={(e) => setFormData({...formData, youtube: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <Input 
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={formData.isPublic}
                onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm">Public Profile</span>
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={formData.isFeatured}
                onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm">Featured Chef</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{chef ? "Update Chef" : "Create Chef"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Marketing Tab
function MarketingTab() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Push Notifications</CardTitle>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No active campaigns</p>
            <p className="text-sm">Create a push notification campaign to reach your users</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">Welcome Email</h4>
              <p className="text-sm text-gray-500">Sent to new users</p>
              <Badge className="mt-2">Active</Badge>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">Voucher Reminder</h4>
              <p className="text-sm text-gray-500">7 days before expiry</p>
              <Badge className="mt-2">Active</Badge>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">Weekly Deals</h4>
              <p className="text-sm text-gray-500">Every Sunday</p>
              <Badge variant="secondary" className="mt-2">Paused</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Promotional Banners</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">Configure home page promotional banners here</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Helpdesk Tab
function HelpdeskTab() {
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all');

  const { data: supportStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-support-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/support/stats', {
        credentials: 'include'
      });
      if (!response.ok) return { openTickets: 0, inProgressTickets: 0, resolvedToday: 0, deflectionRate: 0 };
      return response.json();
    },
  });

  const { data: supportTickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['admin-support-tickets', ticketStatusFilter, ticketPriorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (ticketStatusFilter !== 'all') params.append('status', ticketStatusFilter);
      if (ticketPriorityFilter !== 'all') params.append('priority', ticketPriorityFilter);
      const response = await fetch(`/api/admin/support/tickets?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: knowledgeArticles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['admin-knowledge-base'],
    queryFn: async () => {
      const response = await fetch('/api/admin/knowledge-base', {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supportStats?.openTickets || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supportStats?.inProgressTickets || 0}</div>
            <p className="text-xs text-muted-foreground">Being handled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supportStats?.resolvedToday || 0}</div>
            <p className="text-xs text-muted-foreground">Completed issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Deflection Rate</CardTitle>
            <Lock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supportStats?.deflectionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Resolved by AI assistant</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Support Tickets</CardTitle>
            <div className="flex gap-2">
              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <select
                value={ticketPriorityFilter}
                onChange={(e) => setTicketPriorityFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {ticketsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : supportTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No tickets found</p>
              <p className="text-sm">Customer tickets will appear here when created</p>
            </div>
          ) : (
            <div className="space-y-2">
              {supportTickets.map((ticket: any) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-mono text-sm">TKT-{ticket.id.toString().padStart(4, '0')}</span>
                    <span className="ml-2 font-medium">{ticket.subject}</span>
                    <div className="text-sm text-gray-500">{ticket.customer?.name || 'Unknown'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ticket.priority === 'urgent' ? 'destructive' : ticket.priority === 'high' ? 'default' : 'secondary'}>
                      {ticket.priority || 'medium'}
                    </Badge>
                    <Badge variant="outline" className={
                      ticket.status === 'open' ? 'border-orange-500 text-orange-500' :
                      ticket.status === 'in_progress' ? 'border-blue-500 text-blue-500' :
                      'bg-green-100 text-green-700'
                    }>
                      {(ticket.status || 'open').replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-gray-400">{formatTimeAgo(ticket.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Knowledge Base</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Article
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {articlesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : knowledgeArticles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No articles in knowledge base</p>
            </div>
          ) : (
            <div className="space-y-3">
              {knowledgeArticles.map((article: any) => {
                const helpfulRate = article.viewCount > 0 
                  ? Math.round((article.helpfulCount || 0) / article.viewCount * 100) 
                  : 0;
                return (
                  <div key={article.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <h4 className="font-medium">{article.title}</h4>
                      <p className="text-sm text-gray-500">
                        {article.category} • {article.viewCount || 0} views • {helpfulRate}% helpful
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa'>('credentials');
  const [error, setError] = useState<string | null>(null);
  const [isEnrollRestaurantModalOpen, setIsEnrollRestaurantModalOpen] = useState(false);
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);
  const [isEditPartnerModalOpen, setIsEditPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [expandedRestaurantId, setExpandedRestaurantId] = useState<number | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [managementTab, setManagementTab] = useState<'details' | 'menu' | 'vouchers'>('details');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedLocation, setEditedLocation] = useState('');
  const [editedAddress, setEditedAddress] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedMarketplaceId, setEditedMarketplaceId] = useState<number | null>(null);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [highlightedCityIndex, setHighlightedCityIndex] = useState(-1);
  const [cityDropdownPosition, setCityDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const cityInputRef = useRef<HTMLInputElement>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [editedOwnerCompanyName, setEditedOwnerCompanyName] = useState('');
  const [editedOwnerTaxId, setEditedOwnerTaxId] = useState('');
  const [editedOwnerBusinessRegistration, setEditedOwnerBusinessRegistration] = useState('');
  const [editedOwnerEmail, setEditedOwnerEmail] = useState('');
  const [editedOwnerPhone, setEditedOwnerPhone] = useState('');
  const [editedOwnerContactPerson, setEditedOwnerContactPerson] = useState('');
  const [editedCuisine, setEditedCuisine] = useState('');
  const [editedMainProduct, setEditedMainProduct] = useState('');
  const [editedDietCategory, setEditedDietCategory] = useState('');
  const [editedConceptType, setEditedConceptType] = useState('');
  const [editedExperienceType, setEditedExperienceType] = useState('');
  
  // Restaurant filtering and grouping
  const [restaurantFilter, setRestaurantFilter] = useState({
    marketplace: 'all',
    city: 'all',
    status: 'all',
    company: 'all'
  });
  const [restaurantGroupBy, setRestaurantGroupBy] = useState<'none' | 'marketplace' | 'city'>('none');
  
  // Partner filtering and grouping
  const [partnerFilter, setPartnerFilter] = useState({
    status: 'all',
    verified: 'all'
  });
  const [partnerGroupBy, setPartnerGroupBy] = useState<'none' | 'status' | 'verified'>('none');
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
  const [loadingRestaurantId, setLoadingRestaurantId] = useState<number | null>(null);
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

  // Fetch marketplaces for enrollment form (must be before usage)
  const { data: marketplacesList = [] } = useQuery<any[]>({
    queryKey: ['/api/marketplaces'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await fetch('/api/marketplaces');
      if (!response.ok) throw new Error('Failed to fetch marketplaces');
      return response.json();
    }
  });

  // Watch marketplace selection to load cities
  const selectedEnrollmentMarketplaceId = enrollmentForm.watch('marketplaceId');
  const selectedEnrollmentMarketplace = marketplacesList?.find(mp => mp.id === selectedEnrollmentMarketplaceId);

  // Cities for enrollment form based on selected marketplace
  const { data: enrollmentCities = [] } = useQuery<any[]>({
    queryKey: ['/api/cities', 'enrollment', selectedEnrollmentMarketplace?.countryCode],
    enabled: !!selectedEnrollmentMarketplace?.countryCode,
    queryFn: async () => {
      const country = selectedEnrollmentMarketplace?.countryCode || 'RO';
      const response = await fetch(`/api/cities?country=${country}&limit=300`);
      if (!response.ok) throw new Error('Failed to fetch cities');
      return response.json();
    }
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
    setLoadingRestaurantId(restaurantId);
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

      // Refresh the data without page reload - invalidate both admin and public endpoints
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/restaurants'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
    } catch (error) {
      console.error('Failed to approve restaurant:', error);
      toast({
        title: "Error",
        description: "Failed to approve restaurant",
        variant: "destructive",
      });
    } finally {
      setLoadingRestaurantId(null);
    }
  };

  const suspendRestaurant = async (restaurantId: number) => {
    setLoadingRestaurantId(restaurantId);
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

      // Refresh the data without page reload - invalidate both admin and public endpoints
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/restaurants'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
    } catch (error) {
      console.error('Failed to suspend restaurant:', error);
      toast({
        title: "Error",
        description: "Failed to suspend restaurant",
        variant: "destructive",
      });
    } finally {
      setLoadingRestaurantId(null);
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



  // Toggle restaurant inline expansion
  const toggleRestaurantExpansion = (restaurant: Restaurant) => {
    if (expandedRestaurantId === restaurant.id) {
      // Collapse if already expanded
      setExpandedRestaurantId(null);
      setSelectedRestaurant(null);
      setIsEditingDetails(false);
    } else {
      // Expand this restaurant
      setExpandedRestaurantId(restaurant.id);
      setSelectedRestaurant(restaurant);
      setManagementTab('details');
      setIsEditingDetails(false);
    }
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

  // Get country code from edited marketplace or existing marketplace or default to RO
  const getCountryCodeForCities = () => {
    if (editedMarketplaceId) {
      const selectedMp = marketplacesList?.find(mp => mp.id === editedMarketplaceId);
      return selectedMp?.countryCode || 'RO';
    }
    return restaurantDetails?.marketplace?.countryCode || 'RO';
  };

  // Compute country code for cities - derive it outside the query for proper caching
  const citiesCountryCode = useMemo(() => {
    if (editedMarketplaceId) {
      const selectedMp = marketplacesList?.find(mp => mp.id === editedMarketplaceId);
      return selectedMp?.countryCode || 'RO';
    }
    return restaurantDetails?.marketplace?.countryCode || 'RO';
  }, [editedMarketplaceId, marketplacesList, restaurantDetails?.marketplace?.countryCode]);

  // Cities query based on marketplace country code - load all cities once, filter client-side
  const { data: availableCities = [], isLoading: citiesLoading, refetch: refetchCities } = useQuery<any[]>({
    queryKey: ['/api/cities', 'restaurant-edit', citiesCountryCode],
    enabled: isEditingDetails,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    queryFn: async () => {
      const url = `/api/cities?country=${citiesCountryCode}&limit=500`;
      console.log('[Cities Query] Fetching cities for country:', citiesCountryCode);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch cities');
      const data = await response.json();
      console.log('[Cities Query] Received', data.length, 'cities');
      return data;
    }
  });

  // Force refetch cities when editing mode is enabled or marketplace changes
  // Using a ref to track previous values to avoid unnecessary refetches
  const prevEditingRef = useRef(isEditingDetails);
  const prevCountryRef = useRef(citiesCountryCode);
  
  useEffect(() => {
    const wasEditing = prevEditingRef.current;
    const prevCountry = prevCountryRef.current;
    
    // Only refetch if entering edit mode OR if country changed while editing
    if (isEditingDetails && (!wasEditing || prevCountry !== citiesCountryCode)) {
      console.log('[Cities Effect] Triggering refetch, country:', citiesCountryCode);
      refetchCities();
    }
    
    prevEditingRef.current = isEditingDetails;
    prevCountryRef.current = citiesCountryCode;
  }, [isEditingDetails, citiesCountryCode, refetchCities]);

  // Scroll to expanded restaurant when opened
  useEffect(() => {
    if (expandedRestaurantId) {
      requestAnimationFrame(() => {
        const element = document.getElementById(`restaurant-expanded-${expandedRestaurantId}`);
        element?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
    }
  }, [expandedRestaurantId]);

  // Start editing restaurant details
  const startEditingDetails = () => {
    setEditedLocation(selectedRestaurant?.location || '');
    setEditedAddress(selectedRestaurant?.address || '');
    setEditedPhone(selectedRestaurant?.phone || '');
    setEditedMarketplaceId(selectedRestaurant?.marketplaceId || null);
    setCitySearchQuery(selectedRestaurant?.location || '');
    setShowCityDropdown(false);
    setEditedOwnerCompanyName(restaurantDetails?.owner?.companyName || '');
    setEditedOwnerTaxId(restaurantDetails?.owner?.taxId || '');
    setEditedOwnerBusinessRegistration(restaurantDetails?.owner?.businessRegistrationNumber || '');
    setEditedOwnerEmail(restaurantDetails?.owner?.email || '');
    setEditedOwnerPhone(restaurantDetails?.owner?.companyPhone || '');
    setEditedOwnerContactPerson(restaurantDetails?.owner?.contactPersonName || '');
    setEditedCuisine(selectedRestaurant?.cuisine || '');
    setEditedMainProduct((selectedRestaurant as any)?.mainProduct || '');
    setEditedDietCategory((selectedRestaurant as any)?.dietCategory || '');
    setEditedConceptType((selectedRestaurant as any)?.conceptType || '');
    setEditedExperienceType((selectedRestaurant as any)?.experienceType || '');
    setIsEditingDetails(true);
  };

  // Save restaurant details
  const saveRestaurantDetails = async () => {
    if (!selectedRestaurant) return;
    
    setSavingDetails(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/restaurants/${selectedRestaurant.id}/update-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          location: editedLocation,
          address: editedAddress,
          phone: editedPhone,
          marketplaceId: editedMarketplaceId,
          ownerCompanyName: editedOwnerCompanyName,
          ownerTaxId: editedOwnerTaxId,
          ownerBusinessRegistration: editedOwnerBusinessRegistration,
          ownerEmail: editedOwnerEmail,
          ownerPhone: editedOwnerPhone,
          ownerContactPerson: editedOwnerContactPerson,
          cuisine: editedCuisine,
          mainProduct: editedMainProduct,
          dietCategory: editedDietCategory,
          conceptType: editedConceptType,
          experienceType: editedExperienceType
        })
      });

      if (!response.ok) throw new Error('Failed to update restaurant');
      
      // Update the selected restaurant locally BEFORE exiting edit mode
      setSelectedRestaurant(prev => prev ? {
        ...prev,
        location: editedLocation,
        address: editedAddress,
        phone: editedPhone,
        marketplaceId: editedMarketplaceId,
        cuisine: editedCuisine,
        mainProduct: editedMainProduct,
        dietCategory: editedDietCategory,
        conceptType: editedConceptType,
        experienceType: editedExperienceType
      } as any : null);
      
      // Update restaurantDetails cache optimistically
      const selectedMarketplace = marketplacesList?.find((m: any) => m.id === editedMarketplaceId);
      queryClient.setQueryData(
        ['/api/admin/restaurants', selectedRestaurant.id, 'details'],
        (oldData: any) => oldData ? {
          ...oldData,
          marketplace: selectedMarketplace ? {
            id: selectedMarketplace.id,
            name: selectedMarketplace.name,
            country: selectedMarketplace.country,
            countryCode: selectedMarketplace.countryCode,
            currencyCode: selectedMarketplace.currencyCode,
            currencySymbol: selectedMarketplace.currencySymbol
          } : oldData.marketplace,
          owner: oldData.owner ? {
            ...oldData.owner,
            companyName: editedOwnerCompanyName,
            taxId: editedOwnerTaxId,
            businessRegistrationNumber: editedOwnerBusinessRegistration,
            email: editedOwnerEmail,
            companyPhone: editedOwnerPhone,
            contactPersonName: editedOwnerContactPerson
          } : oldData.owner
        } : oldData
      );
      
      setIsEditingDetails(false);

      toast({
        title: "Salvat",
        description: "Detaliile restaurantului au fost actualizate",
      });

      // Invalidate in background to refresh from server
      queryClient.invalidateQueries({ queryKey: ['/api/admin/restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/restaurants', selectedRestaurant.id, 'details'] });
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu s-au putut salva modificările",
        variant: "destructive"
      });
    } finally {
      setSavingDetails(false);
    }
  };

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
            {/* Admin Logout Button + Language Selector */}
            <div className="absolute top-4 right-6 flex items-center gap-3">
              <LanguageSelector />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                <Lock className="h-4 w-4" />
                {t.admin?.logout || 'Logout'}
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
                {metrics?.activeRestaurants || 0} active, {metrics?.pendingRestaurants || 0} pending
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
              <div className="text-2xl font-bold">€{(metrics?.totalRevenue || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
              <div className="text-2xl font-bold">€{(metrics?.totalCommission || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">
                Platform commission revenue (5%)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Management Content */}
        <div className="space-y-6">

          {selectedTab === "overview" && (
            <div className="space-y-6">
            {/* Pending Approvals */}
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
                {pendingRestaurants.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No pending restaurant approvals</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pendingRestaurants.map((restaurant) => (
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
                                disabled={loadingRestaurantId === restaurant.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {loadingRestaurantId === restaurant.id ? "Approving..." : "Approve"}
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
                                disabled={loadingRestaurantId === restaurant.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                {loadingRestaurantId === restaurant.id ? "Rejecting..." : "Reject"}
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
                )}
              </CardContent>
            </Card>

            {/* Transaction Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BarChart3 className="h-5 w-5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Transaction volume and platform activity</p>
                    </TooltipContent>
                  </Tooltip>
                  <span>Transaction Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Today</h4>
                    <p className="text-2xl font-bold text-blue-600">€{(metrics?.transactionStats?.dailyAmount || 0).toFixed(2)}</p>
                    <p className="text-sm text-blue-600">{metrics?.transactionStats?.dailyCount || 0} transactions</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium text-green-900 dark:text-green-100">This Week</h4>
                    <p className="text-2xl font-bold text-green-600">€{(metrics?.transactionStats?.weeklyAmount || 0).toFixed(2)}</p>
                    <p className="text-sm text-green-600">{metrics?.transactionStats?.weeklyCount || 0} transactions</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">All Time</h4>
                    <p className="text-2xl font-bold text-purple-600">€{(metrics?.transactionStats?.totalAmount || 0).toFixed(2)}</p>
                    <p className="text-sm text-purple-600">{metrics?.transactionStats?.total || 0} transactions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Platform Growth</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">New Users This Month</h4>
                    <p className="text-2xl font-bold text-blue-600">{metrics?.activeUsers || 0}</p>
                    <p className="text-sm text-blue-600">of {metrics?.totalUsers || 0} total users</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium text-green-900 dark:text-green-100">Active Restaurants</h4>
                    <p className="text-2xl font-bold text-green-600">{metrics?.activeRestaurants || 0}</p>
                    <p className="text-sm text-green-600">of {metrics?.totalRestaurants || 0} total restaurants</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transaction Volume Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Transaction Volume</span>
                  </CardTitle>
                  <CardDescription>Daily, weekly and total transaction comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { name: 'Today', amount: metrics?.transactionStats?.dailyAmount || 0, count: metrics?.transactionStats?.dailyCount || 0 },
                      { name: 'This Week', amount: metrics?.transactionStats?.weeklyAmount || 0, count: metrics?.transactionStats?.weeklyCount || 0 },
                      { name: 'All Time', amount: metrics?.transactionStats?.totalAmount || 0, count: metrics?.transactionStats?.total || 0 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value: number) => [`€${value.toFixed(2)}`, 'Amount']} />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Restaurant Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Store className="h-5 w-5 text-green-600" />
                    <span>Restaurant Status</span>
                  </CardTitle>
                  <CardDescription>Distribution of restaurant statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: metrics?.activeRestaurants || 0 },
                          { name: 'Pending', value: metrics?.pendingRestaurants || 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#eab308" />
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">Active ({metrics?.activeRestaurants || 0})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm">Pending ({metrics?.pendingRestaurants || 0})</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>User Overview</span>
                  </CardTitle>
                  <CardDescription>Total vs active users this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { name: 'Total Users', value: metrics?.totalUsers || 0 },
                      { name: 'Active This Month', value: metrics?.activeUsers || 0 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue vs Commission Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                    <span>Revenue Breakdown</span>
                  </CardTitle>
                  <CardDescription>Total revenue and EatOff commission</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { name: 'Total Revenue', value: metrics?.totalRevenue || 0 },
                      { name: 'Commission (5%)', value: metrics?.totalCommission || 0 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value: number) => [`€${value.toFixed(2)}`, 'Amount']} />
                      <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
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
                      Manage approved restaurant partners and enroll new restaurants
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
                  {/* Filters and Grouping */}
                  <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Marketplace</label>
                      <select
                        value={restaurantFilter.marketplace}
                        onChange={(e) => setRestaurantFilter(f => ({ ...f, marketplace: e.target.value }))}
                        className="w-full text-sm border rounded-md px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="all">All Marketplaces</option>
                        {marketplacesList?.map(mp => (
                          <option key={mp.id} value={mp.id}>{mp.name} ({mp.country})</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">City</label>
                      <select
                        value={restaurantFilter.city}
                        onChange={(e) => setRestaurantFilter(f => ({ ...f, city: e.target.value }))}
                        className="w-full text-sm border rounded-md px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="all">All Cities</option>
                        {Array.from(new Set(restaurants?.map(r => r.location).filter(Boolean))).sort().map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                      <select
                        value={restaurantFilter.status}
                        onChange={(e) => setRestaurantFilter(f => ({ ...f, status: e.target.value }))}
                        className="w-full text-sm border rounded-md px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Group By</label>
                      <select
                        value={restaurantGroupBy}
                        onChange={(e) => setRestaurantGroupBy(e.target.value as 'none' | 'marketplace' | 'city')}
                        className="w-full text-sm border rounded-md px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="none">No Grouping</option>
                        <option value="marketplace">By Marketplace</option>
                        <option value="city">By City</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRestaurantFilter({ marketplace: 'all', city: 'all', status: 'all', company: 'all' });
                          setRestaurantGroupBy('none');
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>

                  {/* Filtered Results Count */}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {(() => {
                      let filtered = approvedRestaurants || [];
                      if (restaurantFilter.city !== 'all') {
                        filtered = filtered.filter(r => r.location === restaurantFilter.city);
                      }
                      if (restaurantFilter.status !== 'all') {
                        if (restaurantFilter.status === 'active') filtered = filtered.filter(r => r.isActive);
                        else if (restaurantFilter.status === 'suspended') filtered = filtered.filter(r => !r.isActive);
                      }
                      if (restaurantFilter.marketplace !== 'all') {
                        filtered = filtered.filter(r => (r as any).marketplaceId?.toString() === restaurantFilter.marketplace);
                      }
                      return filtered.length;
                    })()} of {approvedRestaurants?.length || 0} approved restaurants
                  </div>

                  {/* Grouped or Flat Restaurant List */}
                  {restaurantGroupBy !== 'none' ? (
                    // Grouped View
                    <div className="space-y-6">
                      {(() => {
                        let filtered = approvedRestaurants || [];
                        if (restaurantFilter.city !== 'all') filtered = filtered.filter(r => r.location === restaurantFilter.city);
                        if (restaurantFilter.status !== 'all') {
                          if (restaurantFilter.status === 'active') filtered = filtered.filter(r => r.isActive);
                          else if (restaurantFilter.status === 'suspended') filtered = filtered.filter(r => !r.isActive);
                        }
                        if (restaurantFilter.marketplace !== 'all') {
                          filtered = filtered.filter(r => (r as any).marketplaceId?.toString() === restaurantFilter.marketplace);
                        }

                        const groups: Record<string, typeof filtered> = {};
                        filtered.forEach(r => {
                          const key = restaurantGroupBy === 'city' ? (r.location || 'Unknown') : ((r as any).marketplaceId?.toString() || 'none');
                          if (!groups[key]) groups[key] = [];
                          groups[key].push(r);
                        });

                        const getMarketplaceName = (id: string) => {
                          if (id === 'none') return 'No Marketplace';
                          const mp = marketplacesList?.find(m => m.id.toString() === id);
                          return mp ? `${mp.name} (${mp.country})` : `Marketplace ${id}`;
                        };

                        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([groupKey, groupRestaurants]) => (
                          <div key={groupKey} className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 font-medium flex items-center justify-between">
                              <span>{restaurantGroupBy === 'city' ? groupKey : getMarketplaceName(groupKey)}</span>
                              <Badge variant="secondary">{groupRestaurants.length} restaurants</Badge>
                            </div>
                            <div className="divide-y">
                              {groupRestaurants.map((restaurant) => (
                                <div key={restaurant.id}>
                                  <div className="flex items-center justify-between p-4">
                                    <div className="flex-1">
                                      <h4 className="font-medium">{restaurant.name}</h4>
                                      <p className="text-sm text-muted-foreground">{restaurant.email} • {restaurant.location}</p>
                                      <div className="flex space-x-2 mt-2">
                                        <Badge variant="default" className="bg-green-600">Approved</Badge>
                                        <Badge variant={restaurant.isActive ? "default" : "destructive"}>
                                          {restaurant.isActive ? "Active" : "Suspended"}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex space-x-2">
                                      <Button 
                                        size="sm" 
                                        variant={expandedRestaurantId === restaurant.id ? "default" : "outline"}
                                        onClick={() => toggleRestaurantExpansion(restaurant)}
                                      >
                                        {expandedRestaurantId === restaurant.id ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                                        {expandedRestaurantId === restaurant.id ? 'Închide' : 'Manage'}
                                      </Button>
                                    </div>
                                  </div>
                                  {/* Inline expandable content for grouped view */}
                                  {expandedRestaurantId === restaurant.id && selectedRestaurant && (
                                    <div className="border-t bg-gray-50 dark:bg-gray-900 p-4 text-sm text-gray-600 dark:text-gray-300">
                                      Pentru editare detaliată, accesați Flat View.
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    // Flat View (original)
                    <div className="space-y-4">
                      {(() => {
                    let filtered = approvedRestaurants || [];
                    if (restaurantFilter.city !== 'all') filtered = filtered.filter(r => r.location === restaurantFilter.city);
                    if (restaurantFilter.status !== 'all') {
                      if (restaurantFilter.status === 'active') filtered = filtered.filter(r => r.isActive);
                      else if (restaurantFilter.status === 'suspended') filtered = filtered.filter(r => !r.isActive);
                    }
                    if (restaurantFilter.marketplace !== 'all') {
                      filtered = filtered.filter(r => (r as any).marketplaceId?.toString() === restaurantFilter.marketplace);
                    }
                    return filtered;
                  })().map((restaurant) => (
                    <div key={restaurant.id} className="border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex-1">
                          <h4 className="font-medium">{restaurant.name}</h4>
                          <p className="text-sm text-muted-foreground">{restaurant.email}</p>
                          <div className="flex space-x-2 mt-2">
                            <Badge variant="default" className="bg-green-600">Approved</Badge>
                            <Badge variant={restaurant.isActive ? "default" : "destructive"}>
                              {restaurant.isActive ? "Active" : "Suspended"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mr-4">
                          <div className="flex flex-col items-center">
                            <label className="text-xs text-gray-500 mb-1">Priority</label>
                            <select
                              value={(restaurant as any).priority ?? 3}
                              onChange={async (e) => {
                                const priority = parseInt(e.target.value);
                                try {
                                  const token = localStorage.getItem('adminToken');
                                  await fetch(`/api/admin/restaurants/${restaurant.id}/priority`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ priority })
                                  });
                                  await queryClient.invalidateQueries({ queryKey: ['/api/admin/restaurants'] });
                                  await queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
                                  toast({ title: "Priority updated" });
                                } catch (error) {
                                  toast({ title: "Error updating priority", variant: "destructive" });
                                }
                              }}
                              className="w-16 p-1 text-sm border rounded"
                            >
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                          </div>
                          <div className="flex flex-col items-center">
                            <label className="text-xs text-gray-500 mb-1">Position</label>
                            <input
                              type="number"
                              value={(restaurant as any).position ?? 0}
                              min="0"
                              onChange={async (e) => {
                                const position = parseInt(e.target.value) || 0;
                                try {
                                  const token = localStorage.getItem('adminToken');
                                  await fetch(`/api/admin/restaurants/${restaurant.id}/priority`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ position })
                                  });
                                  await queryClient.invalidateQueries({ queryKey: ['/api/admin/restaurants'] });
                                  await queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
                                  toast({ title: "Position updated" });
                                } catch (error) {
                                  toast({ title: "Error updating position", variant: "destructive" });
                                }
                              }}
                              className="w-16 p-1 text-sm border rounded"
                            />
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
                                variant={expandedRestaurantId === restaurant.id ? "default" : "outline"}
                                onClick={() => toggleRestaurantExpansion(restaurant)}
                                disabled={loadingRestaurantId === restaurant.id}
                              >
                                {expandedRestaurantId === restaurant.id ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                                {expandedRestaurantId === restaurant.id ? 'Închide' : 'Manage'}
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
                                disabled={loadingRestaurantId === restaurant.id}
                              >
                                {loadingRestaurantId === restaurant.id 
                                  ? (restaurant.isActive ? "Suspending..." : "Reactivating...") 
                                  : (restaurant.isActive ? "Suspend" : "Reactivate")}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{restaurant.isActive ? "Suspend restaurant from platform" : "Reactivate suspended restaurant"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      
                      {/* Inline Expandable Section */}
                      {expandedRestaurantId === restaurant.id && selectedRestaurant && (
                        <div id={`restaurant-expanded-${restaurant.id}`} className="border-t bg-gray-50 dark:bg-gray-900 p-6">
                          {/* Tab Navigation */}
                          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                            <div className="flex space-x-8">
                              <button
                                type="button"
                                onClick={() => setManagementTab('details')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                  managementTab === 'details'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                              >
                                Detalii
                              </button>
                              <button
                                type="button"
                                onClick={() => setManagementTab('menu')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                  managementTab === 'menu'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                              >
                                Meniu ({restaurantDetails?.menuItems?.length || 0})
                              </button>
                              <button
                                type="button"
                                onClick={() => setManagementTab('vouchers')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                  managementTab === 'vouchers'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                              >
                                Vouchere ({restaurantDetails?.voucherPackages?.length || 0})
                              </button>
                            </div>
                          </div>

                          {restaurantDetailsLoading ? (
                            <div className="space-y-4">
                              <div className="animate-pulse">
                                <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-24 bg-gray-300 rounded-lg"></div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Details Tab - Inline Editable */}
                              {managementTab === 'details' && (
                                <div className="space-y-6">
                                  <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <Store className="h-5 w-5" />
                                        {t.admin?.restaurantInfo || 'Informații Restaurant'}
                                      </CardTitle>
                                      {!isEditingDetails ? (
                                        <Button size="sm" variant="outline" onClick={startEditingDetails}>
                                          <Edit className="h-4 w-4 mr-1" /> {t.admin?.edit || 'Editează'}
                                        </Button>
                                      ) : (
                                        <div className="flex gap-2">
                                          <Button size="sm" variant="outline" onClick={() => setIsEditingDetails(false)}>
                                            {t.admin?.cancel || 'Anulează'}
                                          </Button>
                                          <Button size="sm" onClick={saveRestaurantDetails} disabled={savingDetails}>
                                            {savingDetails ? (t.admin?.saving || 'Se salvează...') : (t.admin?.save || 'Salvează')}
                                          </Button>
                                        </div>
                                      )}
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.admin?.name || 'Nume'}</label>
                                        <p className="text-gray-900 dark:text-white">{selectedRestaurant?.name}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.admin?.restaurantCode || 'Cod Restaurant'}</label>
                                        <p className="text-gray-900 dark:text-white font-mono">{selectedRestaurant?.restaurantCode || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.admin?.cuisine || 'Bucătărie'}</label>
                                        {isEditingDetails ? (
                                          <select
                                            value={editedCuisine}
                                            onChange={(e) => setEditedCuisine(e.target.value)}
                                            className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                          >
                                            <option value="">Selectează...</option>
                                            {CUISINE_OPTIONS.map(opt => (
                                              <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                          </select>
                                        ) : (
                                          <p className="text-gray-900 dark:text-white">{selectedRestaurant?.cuisine}</p>
                                        )}
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Main Product</label>
                                        {isEditingDetails ? (
                                          <select
                                            value={editedMainProduct}
                                            onChange={(e) => setEditedMainProduct(e.target.value)}
                                            className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                          >
                                            <option value="">Selectează...</option>
                                            {MAIN_PRODUCT_OPTIONS.map(opt => (
                                              <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                          </select>
                                        ) : (
                                          <p className="text-gray-900 dark:text-white">{(selectedRestaurant as any)?.mainProduct || '-'}</p>
                                        )}
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Diet</label>
                                        {isEditingDetails ? (
                                          <select
                                            value={editedDietCategory}
                                            onChange={(e) => setEditedDietCategory(e.target.value)}
                                            className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                          >
                                            <option value="">Selectează...</option>
                                            {DIET_CATEGORY_OPTIONS.map(opt => (
                                              <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                          </select>
                                        ) : (
                                          <p className="text-gray-900 dark:text-white">{(selectedRestaurant as any)?.dietCategory || '-'}</p>
                                        )}
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Concept</label>
                                        {isEditingDetails ? (
                                          <select
                                            value={editedConceptType}
                                            onChange={(e) => setEditedConceptType(e.target.value)}
                                            className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                          >
                                            <option value="">Selectează...</option>
                                            {CONCEPT_TYPE_OPTIONS.map(opt => (
                                              <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                          </select>
                                        ) : (
                                          <p className="text-gray-900 dark:text-white">{(selectedRestaurant as any)?.conceptType || '-'}</p>
                                        )}
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Experience</label>
                                        {isEditingDetails ? (
                                          <select
                                            value={editedExperienceType}
                                            onChange={(e) => setEditedExperienceType(e.target.value)}
                                            className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                          >
                                            <option value="">Selectează...</option>
                                            {EXPERIENCE_TYPE_OPTIONS.map(opt => (
                                              <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                          </select>
                                        ) : (
                                          <p className="text-gray-900 dark:text-white">{(selectedRestaurant as any)?.experienceType || '-'}</p>
                                        )}
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.admin?.priceRange || 'Interval Prețuri'}</label>
                                        <p className="text-gray-900 dark:text-white">{selectedRestaurant?.priceRange}</p>
                                      </div>
                                      <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.admin?.description || 'Descriere'}</label>
                                        <p className="text-gray-900 dark:text-white">{selectedRestaurant?.description}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.admin?.address || 'Adresă'}</label>
                                        {isEditingDetails ? (
                                          <Input 
                                            value={editedAddress}
                                            onChange={(e) => setEditedAddress(e.target.value)}
                                            placeholder={t.admin?.address || 'Adresa restaurantului'}
                                          />
                                        ) : (
                                          <p className="text-gray-900 dark:text-white">{selectedRestaurant?.address}</p>
                                        )}
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.admin?.city || 'Oraș'}</label>
                                        {isEditingDetails ? (
                                          <div className="relative">
                                            {(() => {
                                              const searchTerm = citySearchQuery.toLowerCase();
                                              const filteredCities = availableCities
                                                .filter((city: any) => city.name.toLowerCase().includes(searchTerm))
                                                .sort((a: any, b: any) => a.name.localeCompare(b.name));
                                              
                                              const updateDropdownPosition = () => {
                                                if (cityInputRef.current) {
                                                  const rect = cityInputRef.current.getBoundingClientRect();
                                                  setCityDropdownPosition({
                                                    top: rect.bottom + window.scrollY + 4,
                                                    left: rect.left + window.scrollX,
                                                    width: rect.width
                                                  });
                                                }
                                              };
                                              
                                              const handleKeyDown = (e: React.KeyboardEvent) => {
                                                if (!showCityDropdown || filteredCities.length === 0) return;
                                                
                                                if (e.key === 'ArrowDown') {
                                                  e.preventDefault();
                                                  setHighlightedCityIndex(prev => 
                                                    prev < filteredCities.length - 1 ? prev + 1 : 0
                                                  );
                                                } else if (e.key === 'ArrowUp') {
                                                  e.preventDefault();
                                                  setHighlightedCityIndex(prev => 
                                                    prev > 0 ? prev - 1 : filteredCities.length - 1
                                                  );
                                                } else if (e.key === 'Enter' && highlightedCityIndex >= 0) {
                                                  e.preventDefault();
                                                  const selectedCity = filteredCities[highlightedCityIndex];
                                                  if (selectedCity) {
                                                    setEditedLocation(selectedCity.name);
                                                    setCitySearchQuery(selectedCity.name);
                                                    setShowCityDropdown(false);
                                                    setHighlightedCityIndex(-1);
                                                  }
                                                } else if (e.key === 'Escape') {
                                                  setShowCityDropdown(false);
                                                  setHighlightedCityIndex(-1);
                                                }
                                              };
                                              
                                              return (
                                                <>
                                                  <Input
                                                    ref={cityInputRef}
                                                    value={citySearchQuery}
                                                    onChange={(e) => {
                                                      setCitySearchQuery(e.target.value);
                                                      setEditedLocation(e.target.value);
                                                      setShowCityDropdown(true);
                                                      setHighlightedCityIndex(-1);
                                                      updateDropdownPosition();
                                                    }}
                                                    onFocus={() => {
                                                      setShowCityDropdown(true);
                                                      setHighlightedCityIndex(-1);
                                                      updateDropdownPosition();
                                                    }}
                                                    onBlur={() => {
                                                      setTimeout(() => {
                                                        setShowCityDropdown(false);
                                                        setHighlightedCityIndex(-1);
                                                      }, 200);
                                                    }}
                                                    onKeyDown={handleKeyDown}
                                                    placeholder={citiesLoading ? (t.admin?.loading || 'Se încarcă...') : (t.admin?.searchCity || 'Caută oraș...')}
                                                    disabled={citiesLoading}
                                                  />
                                                  {showCityDropdown && !citiesLoading && availableCities.length > 0 && createPortal(
                                                    <div 
                                                      className="border-2 border-gray-300 rounded-md max-h-60 overflow-auto bg-white"
                                                      style={{ 
                                                        position: 'fixed',
                                                        top: cityDropdownPosition.top,
                                                        left: cityDropdownPosition.left,
                                                        width: cityDropdownPosition.width,
                                                        zIndex: 999999,
                                                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                                                      }}
                                                    >
                                                      {filteredCities.length === 0 ? (
                                                        <div className="px-3 py-2 text-gray-500 bg-white">{t.admin?.noCitiesFound || 'Nu s-au găsit orașe'}</div>
                                                      ) : (
                                                        filteredCities.map((city: any, index: number) => (
                                                          <button
                                                            key={city.geonameId}
                                                            type="button"
                                                            className={`w-full text-left px-3 py-2 text-gray-900 ${
                                                              index === highlightedCityIndex 
                                                                ? 'bg-blue-100' 
                                                                : 'bg-white hover:bg-gray-100'
                                                            }`}
                                                            onMouseDown={(e) => {
                                                              e.preventDefault();
                                                              setEditedLocation(city.name);
                                                              setCitySearchQuery(city.name);
                                                              setShowCityDropdown(false);
                                                              setHighlightedCityIndex(-1);
                                                            }}
                                                            onMouseEnter={() => setHighlightedCityIndex(index)}
                                                          >
                                                            {city.name}
                                                          </button>
                                                        ))
                                                      )}
                                                    </div>,
                                                    document.body
                                                  )}
                                                </>
                                              );
                                            })()}
                                          </div>
                                        ) : (
                                          <p className="text-gray-900 dark:text-white">{selectedRestaurant?.location}</p>
                                        )}
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Telefon</label>
                                        {isEditingDetails ? (
                                          <Input 
                                            value={editedPhone}
                                            onChange={(e) => setEditedPhone(e.target.value)}
                                            placeholder="Telefon"
                                          />
                                        ) : (
                                          <p className="text-gray-900 dark:text-white">{selectedRestaurant?.phone || 'N/A'}</p>
                                        )}
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                                        <p className="text-gray-900 dark:text-white">{selectedRestaurant?.email || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Website</label>
                                        <p className="text-gray-900 dark:text-white">{selectedRestaurant?.website || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                                        <div className="flex gap-2 mt-1">
                                          <Badge className={selectedRestaurant?.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                            {selectedRestaurant?.isApproved ? 'Aprobat' : 'În așteptare'}
                                          </Badge>
                                          <Badge className={selectedRestaurant?.isActive ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                                            {selectedRestaurant?.isActive ? 'Activ' : 'Suspendat'}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Marketplace</label>
                                        {isEditingDetails ? (
                                          <select
                                            value={editedMarketplaceId?.toString() || ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setEditedMarketplaceId(val ? parseInt(val) : null);
                                              setEditedLocation('');
                                              setCitySearchQuery('');
                                            }}
                                            className="w-full h-10 px-3 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                                          >
                                            <option value="">Selectează Marketplace</option>
                                            {marketplacesList?.map((mp: any) => (
                                              <option key={mp.id} value={mp.id.toString()}>
                                                {mp.name} ({mp.country} - {mp.currencySymbol})
                                              </option>
                                            ))}
                                          </select>
                                        ) : (
                                          <p className="text-gray-900 dark:text-white">
                                            {restaurantDetails?.marketplace ? 
                                              `${restaurantDetails.marketplace.name} (${restaurantDetails.marketplace.country})` : 
                                              <span className="text-orange-500">Nu este setat</span>
                                            }
                                          </p>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Owner/Company Info */}
                                  {restaurantDetails?.owner && (
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                          <Building2 className="h-5 w-5" />
                                          {t.admin?.companyInfo || 'Informații Companie'}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.admin?.companyName || 'Nume Companie'}</label>
                                          {isEditingDetails ? (
                                            <Input 
                                              value={editedOwnerCompanyName}
                                              onChange={(e) => setEditedOwnerCompanyName(e.target.value)}
                                              placeholder={t.admin?.companyName || 'Nume companie'}
                                            />
                                          ) : (
                                            <p className="text-gray-900 dark:text-white font-semibold">{restaurantDetails.owner.companyName}</p>
                                          )}
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.admin?.taxId || 'CUI'}</label>
                                          {isEditingDetails ? (
                                            <Input 
                                              value={editedOwnerTaxId}
                                              onChange={(e) => setEditedOwnerTaxId(e.target.value)}
                                              placeholder={t.admin?.taxId || 'CUI'}
                                            />
                                          ) : (
                                            <p className="text-gray-900 dark:text-white font-mono">{restaurantDetails.owner.taxId || 'N/A'}</p>
                                          )}
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.admin?.registrationNumber || 'Nr. Înregistrare'}</label>
                                          {isEditingDetails ? (
                                            <Input 
                                              value={editedOwnerBusinessRegistration}
                                              onChange={(e) => setEditedOwnerBusinessRegistration(e.target.value)}
                                              placeholder={t.admin?.registrationNumber || 'Nr. înregistrare'}
                                            />
                                          ) : (
                                            <p className="text-gray-900 dark:text-white font-mono">{restaurantDetails.owner.businessRegistrationNumber || 'N/A'}</p>
                                          )}
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.admin?.companyEmail || 'Email Companie'}</label>
                                          {isEditingDetails ? (
                                            <Input 
                                              type="email"
                                              value={editedOwnerEmail}
                                              onChange={(e) => setEditedOwnerEmail(e.target.value)}
                                              placeholder={t.admin?.companyEmail || 'Email companie'}
                                            />
                                          ) : (
                                            <p className="text-gray-900 dark:text-white">{restaurantDetails.owner.email}</p>
                                          )}
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.admin?.companyPhone || 'Telefon Companie'}</label>
                                          {isEditingDetails ? (
                                            <Input 
                                              value={editedOwnerPhone}
                                              onChange={(e) => setEditedOwnerPhone(e.target.value)}
                                              placeholder={t.admin?.companyPhone || 'Telefon companie'}
                                            />
                                          ) : (
                                            <p className="text-gray-900 dark:text-white">{restaurantDetails.owner.companyPhone}</p>
                                          )}
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.admin?.contactPerson || 'Persoană Contact'}</label>
                                          {isEditingDetails ? (
                                            <Input 
                                              value={editedOwnerContactPerson}
                                              onChange={(e) => setEditedOwnerContactPerson(e.target.value)}
                                              placeholder={t.admin?.contactPerson || 'Persoană contact'}
                                            />
                                          ) : (
                                            <p className="text-gray-900 dark:text-white">{restaurantDetails.owner.contactPersonName}</p>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}
                                </div>
                              )}

                              {/* Menu Tab */}
                              {managementTab === 'menu' && (
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">{t.admin?.menuItems || 'Articole Meniu'}</h3>
                                    <Button onClick={() => setIsAddMenuItemModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                                      <Plus className="h-4 w-4 mr-2" />
                                      {t.admin?.addItem || 'Adaugă Articol'}
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {restaurantDetails?.menuItems?.map((item) => (
                                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                          <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</h4>
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
                                          <p className="text-sm text-gray-500">{item.category}</p>
                                          <p className="text-sm font-medium mt-1">{item.price} {restaurantDetails?.marketplace?.currencySymbol || 'RON'}</p>
                                        </CardContent>
                                      </Card>
                                    ))}
                                    {(!restaurantDetails?.menuItems || restaurantDetails.menuItems.length === 0) && (
                                      <div className="col-span-full text-center py-8 text-gray-500">
                                        {t.admin?.noMenuItems || 'Nu există articole în meniu. Adaugă primul articol!'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Vouchers Tab */}
                              {managementTab === 'vouchers' && (
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">{t.admin?.voucherPackages || 'Pachete Voucher'}</h3>
                                    <Button onClick={() => setIsAddVoucherPackageModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                                      <Plus className="h-4 w-4 mr-2" />
                                      {t.admin?.addPackage || 'Adaugă Pachet'}
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {restaurantDetails?.voucherPackages?.map((pkg) => (
                                      <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                          <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{pkg.name}</h4>
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
                                          </div>
                                          <p className="text-sm text-gray-500">{pkg.description}</p>
                                          <div className="flex justify-between mt-2">
                                            <span className="text-sm">Valoare: {pkg.value} {restaurantDetails?.marketplace?.currencySymbol || 'RON'}</span>
                                            <span className="text-sm font-medium text-green-600">Preț: {pkg.price} {restaurantDetails?.marketplace?.currencySymbol || 'RON'}</span>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                    {(!restaurantDetails?.voucherPackages || restaurantDetails.voucherPackages.length === 0) && (
                                      <div className="col-span-full text-center py-8 text-gray-500">
                                        Nu există pachete voucher. Adaugă primul pachet!
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                    </div>
                  )}
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
                
                {/* Partner Filters */}
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={partnerFilter.status}
                      onChange={(e) => setPartnerFilter(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Verified:</span>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={partnerFilter.verified}
                      onChange={(e) => setPartnerFilter(prev => ({ ...prev, verified: e.target.value }))}
                    >
                      <option value="all">All</option>
                      <option value="verified">Verified</option>
                      <option value="unverified">Unverified</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Group by:</span>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={partnerGroupBy}
                      onChange={(e) => setPartnerGroupBy(e.target.value as 'none' | 'status' | 'verified')}
                    >
                      <option value="none">No grouping</option>
                      <option value="status">Status</option>
                      <option value="verified">Verification</option>
                    </select>
                  </div>
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
                    {(() => {
                      // Apply filters
                      let filtered = [...partners];
                      if (partnerFilter.status !== 'all') {
                        filtered = filtered.filter(p => 
                          partnerFilter.status === 'active' ? p.isActive : !p.isActive
                        );
                      }
                      if (partnerFilter.verified !== 'all') {
                        filtered = filtered.filter(p => 
                          partnerFilter.verified === 'verified' ? p.isVerified : !p.isVerified
                        );
                      }
                      
                      // Partner card renderer
                      const renderPartnerCard = (partner: Partner) => (
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
                              disabled={partnerLoading}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant={partner.isActive ? "destructive" : "default"}
                              onClick={() => togglePartnerStatus(partner.id, partner.isActive)}
                              disabled={partnerLoading}
                            >
                              {partner.isActive ? "Suspend" : "Activate"}
                            </Button>
                          </div>
                        </div>
                      );
                      
                      // Apply grouping
                      if (partnerGroupBy === 'none') {
                        return filtered.length > 0 ? filtered.map(renderPartnerCard) : (
                          <div className="text-center py-4 text-muted-foreground">No partners match the filters</div>
                        );
                      } else {
                        // Group by status or verified
                        const groups: Record<string, Partner[]> = {};
                        filtered.forEach(p => {
                          const key = partnerGroupBy === 'status' 
                            ? (p.isActive ? 'Active' : 'Suspended')
                            : (p.isVerified ? 'Verified' : 'Unverified');
                          if (!groups[key]) groups[key] = [];
                          groups[key].push(p);
                        });
                        
                        return Object.entries(groups).map(([groupName, groupPartners]) => (
                          <div key={groupName} className="mb-6">
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${
                                groupName === 'Active' || groupName === 'Verified' ? 'bg-green-500' : 'bg-red-500'
                              }`}></span>
                              {groupName} ({groupPartners.length})
                            </h3>
                            <div className="space-y-3">
                              {groupPartners.map(renderPartnerCard)}
                            </div>
                          </div>
                        ));
                      }
                    })()}
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
            <UsersFinancialTab />
          )}

          {selectedTab === "marketplaces" && (
            <MarketplacesTab />
          )}

          {selectedTab === "wallet" && (
            <WalletCreditTab />
          )}

          {selectedTab === "commissions" && (
            <CommissionsTab setSelectedTab={setSelectedTab} />
          )}

          {selectedTab === "marketing" && (
            <MarketingTab />
          )}

          {selectedTab === "helpdesk" && (
            <HelpdeskTab />
          )}

          {selectedTab === "finances" && (
            <FinancesTabContent metrics={metrics} />
          )}

          {selectedTab === "chefs" && (
            <ChefManagementTab />
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
            
            <MobileFiltersManagement />
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
                        <FormLabel>Cuisine</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CUISINE_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="mainProduct"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Product</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MAIN_PRODUCT_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="dietCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diet</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DIET_CATEGORY_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="conceptType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Concept</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONCEPT_TYPE_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="experienceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EXPERIENCE_TYPE_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={enrollmentForm.control}
                    name="marketplaceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marketplace</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select marketplace" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {marketplacesList.map((mp) => (
                              <SelectItem key={mp.id} value={mp.id.toString()}>
                                {mp.name} ({mp.currencyCode})
                              </SelectItem>
                            ))}
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
                        <FormLabel>Oraș / Location</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!selectedEnrollmentMarketplace}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={selectedEnrollmentMarketplace ? "Selectează orașul" : "Selectează întâi marketplace-ul"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            {enrollmentCities.map((city: any) => (
                              <SelectItem key={city.geonameId} value={city.name}>
                                {city.name} {city.population > 50000 ? `(${(city.population / 1000).toFixed(0)}k)` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                  disabled={savingDetails}
                >
                  {savingDetails ? 'Enrolling...' : 'Enroll Restaurant'}
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
                  disabled={partnerLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {partnerLoading ? 'Creating...' : 'Create Partner'}
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
                  disabled={partnerLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {partnerLoading ? 'Updating...' : 'Update Partner'}
                </Button>
              </div>
            </form>
          </Form>
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
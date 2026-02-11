import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, SimpleDialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PlusCircle, Store, Package, Menu, BarChart3, Settings, LogOut, Building2, Calendar, CheckCircle, XCircle, Clock, Eye, Phone, Mail, MessageSquare, CalendarDays, ChevronLeft, ChevronRight, Trash2, Edit, AlertTriangle, Users, CreditCard, TrendingUp, Plus, Loader2, Upload, ImageIcon, ChefHat, Sparkles, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChefForm from "@/components/ChefForm";
import { useLocation } from "wouter";
import BankingInformationForm from "@/components/BankingInformationForm";
import { EditRestaurantForm } from "@/components/EditRestaurantForm";
import LoyaltyManagement from "@/components/LoyaltyManagement";
import RestaurantCashbackManagement from "@/components/RestaurantCashbackManagement";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRestaurantAuth } from "@/hooks/useRestaurantAuth";
import RestaurantNotificationSystem from "@/components/RestaurantNotificationSystem";
import NotificationTestButton from "@/components/NotificationTestButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";

export default function RestaurantPortal() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const { owner } = useRestaurantAuth();
  const { t } = useLanguage();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddRestaurantOpen, setIsAddRestaurantOpen] = useState(false);
  const [isEditRestaurantOpen, setIsEditRestaurantOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [reservationView, setReservationView] = useState<'list' | 'calendar'>('list');
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isAddRestaurantModalOpen, setIsAddRestaurantModalOpen] = useState(false);
  const [isManageRestaurantModalOpen, setIsManageRestaurantModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isEditingAccountInfo, setIsEditingAccountInfo] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isManagingUsers, setIsManagingUsers] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [isChefFormOpen, setIsChefFormOpen] = useState(false);
  const [editingChef, setEditingChef] = useState<any>(null);
  const [menuRestaurantId, setMenuRestaurantId] = useState<number | null>(null);
  const [menuCategory, setMenuCategory] = useState<string>("all");
  const [isMenuItemFormOpen, setIsMenuItemFormOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<any>(null);
  const [menuFormData, setMenuFormData] = useState({
    name: '', description: '', category: 'mains', price: '', imageUrl: '',
    ingredients: '', allergens: '', dietaryTags: '', spiceLevel: 0,
    calories: '', preparationTime: '', isAvailable: true, isPopular: false
  });
  const [isSubmittingMenuItem, setIsSubmittingMenuItem] = useState(false);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [aiSuggestedForName, setAiSuggestedForName] = useState<string | null>(null);
  const [isUploadingMenuImage, setIsUploadingMenuImage] = useState(false);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    companyName: '',
    email: '',
    contactPersonName: '',
    companyPhone: '',
    companyAddress: ''
  });
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [newUserFormData, setNewUserFormData] = useState({
    email: '',
    contactPersonName: '',
    role: 'user', // admin, manager, user
    password: ''
  });
  
  // Voucher package editing state
  const [isEditPackageModalOpen, setIsEditPackageModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [packageFormData, setPackageFormData] = useState({
    name: '',
    description: '',
    mealCount: '',
    pricePerMeal: '',
    discountPercentage: '',
    validityType: 'months' as 'months' | 'custom_dates',
    validityMonths: '',
    validityStartDate: '',
    validityEndDate: '',
    isActive: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Effect to populate form data when editing mode is activated
  useEffect(() => {
    if (isEditingAccountInfo && owner) {
      setAccountFormData({
        companyName: owner.companyName || '',
        email: owner.email || '',
        contactPersonName: owner.contactPersonName || '',
        companyPhone: owner.companyPhone || '',
        companyAddress: owner.companyAddress || ''
      });
    }
  }, [isEditingAccountInfo, owner]);

  // Effect to populate package form data when editing
  useEffect(() => {
    if (isEditPackageModalOpen && selectedPackage) {
      setPackageFormData({
        name: selectedPackage.name || '',
        description: selectedPackage.description || '',
        mealCount: selectedPackage.mealCount?.toString() || '',
        pricePerMeal: selectedPackage.pricePerMeal?.toString() || '',
        discountPercentage: selectedPackage.discountPercentage?.toString() || '',
        validityType: selectedPackage.validityType || 'months',
        validityMonths: selectedPackage.validityMonths?.toString() || '',
        validityStartDate: selectedPackage.validityStartDate || '',
        validityEndDate: selectedPackage.validityEndDate || '',
        isActive: selectedPackage.isActive ?? true
      });
    }
  }, [isEditPackageModalOpen, selectedPackage]);

  // Mutation for updating account information
  const updateAccountMutation = useMutation({
    mutationFn: async (data: typeof accountFormData) => {
      const response = await apiRequest("PUT", "/api/restaurant-portal/owner/account", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account information updated successfully",
      });
      setIsEditingAccountInfo(false);
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update account information",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordFormData) => {
      const response = await apiRequest("PUT", "/api/restaurant-portal/owner/password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      setIsChangingPassword(false);
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    },
  });

  const { data: companyUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/restaurant-portal/owner/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/restaurant-portal/owner/users");
      return response.json();
    },
    enabled: isManagingUsers // Only fetch when user management is active
  });

  const addUserMutation = useMutation({
    mutationFn: async (data: typeof newUserFormData) => {
      const response = await apiRequest("POST", "/api/restaurant-portal/owner/users", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User added successfully",
      });
      setNewUserFormData({
        email: '',
        contactPersonName: '',
        role: 'user',
        password: ''
      });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/owner/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/restaurant-portal/owner/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setIsDeleteUserModalOpen(false);
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/owner/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating voucher packages
  const updatePackageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/admin/voucher-packages/${selectedPackage.id}`, {
        ...data,
        mealCount: parseInt(data.mealCount),
        pricePerMeal: parseFloat(data.pricePerMeal),
        discountPercentage: parseFloat(data.discountPercentage),
        validityMonths: data.validityType === 'months' ? parseInt(data.validityMonths) : null,
        validityStartDate: data.validityType === 'custom_dates' ? data.validityStartDate : null,
        validityEndDate: data.validityType === 'custom_dates' ? data.validityEndDate : null
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Voucher package updated successfully",
      });
      setIsEditPackageModalOpen(false);
      setSelectedPackage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/packages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/voucher-packages"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update voucher package",
        variant: "destructive",
      });
    },
  });

  // Mutation for activating voucher packages
  const activatePackageMutation = useMutation({
    mutationFn: async (pkg: any) => {
      const response = await apiRequest("PUT", `/api/restaurant-portal/packages/${pkg.id}`, {
        ...pkg,
        isActive: true
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Package Activated",
        description: "Voucher package is now available for purchase by customers",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/packages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/voucher-packages"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate voucher package",
        variant: "destructive",
      });
    },
  });

  const handleEditAccountInfo = () => {
    setIsEditingAccountInfo(true);
  };

  const handleSaveAccountInfo = () => {
    updateAccountMutation.mutate(accountFormData);
  };

  const handleCancelEdit = () => {
    setIsEditingAccountInfo(false);
    setAccountFormData({
      companyName: '',
      email: '',
      contactPersonName: '',
      companyPhone: '',
      companyAddress: ''
    });
  };

  const handleFormChange = (field: string, value: string) => {
    setAccountFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordFormChange = (field: string, value: string) => {
    setPasswordFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNewUserFormChange = (field: string, value: string) => {
    setNewUserFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePassword = () => {
    setIsChangingPassword(true);
  };

  const handleSavePassword = () => {
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate(passwordFormData);
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleManageUsers = () => {
    setIsManagingUsers(true);
  };

  const handleAddUser = () => {
    addUserMutation.mutate(newUserFormData);
  };

  const handleCancelUserManagement = () => {
    setIsManagingUsers(false);
    setNewUserFormData({
      email: '',
      contactPersonName: '',
      role: 'user',
      password: ''
    });
  };

  // Voucher package handlers
  const handleEditPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    
    // Populate form data from selected package
    setPackageFormData({
      name: pkg.name || '',
      description: pkg.description || '',
      mealCount: pkg.mealCount?.toString() || '',
      pricePerMeal: pkg.pricePerMeal?.toString() || '',
      discountPercentage: pkg.discountPercentage?.toString() || '',
      validityType: pkg.validityType || 'months',
      validityMonths: pkg.validityMonths?.toString() || '',
      validityStartDate: pkg.validityStartDate || '',
      validityEndDate: pkg.validityEndDate || '',
      isActive: pkg.isActive !== undefined ? pkg.isActive : true
    });
    
    setIsEditPackageModalOpen(true);
  };

  const handleActivatePackage = (pkg: any) => {
    activatePackageMutation.mutate(pkg);
  };

  const handlePackageFormChange = (field: string, value: string | boolean) => {
    setPackageFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePackage = () => {
    if (!selectedPackage) return;
    
    // Validation for active packages
    if (selectedPackage.isActive) {
      // For active packages, only allow extending validity and changing active status
      if (packageFormData.validityType === 'months') {
        const newMonths = parseInt(packageFormData.validityMonths);
        const currentMonths = parseInt(selectedPackage.validityMonths || '0');
        
        if (newMonths < currentMonths) {
          toast({
            title: "Invalid Change",
            description: "Cannot reduce validity period for active packages. You can only extend it.",
            variant: "destructive"
          });
          return;
        }
      } else if (packageFormData.validityType === 'custom_dates') {
        const newEndDate = new Date(packageFormData.validityEndDate);
        const currentEndDate = new Date(selectedPackage.validityEndDate || '');
        
        if (newEndDate < currentEndDate) {
          toast({
            title: "Invalid Change",
            description: "Cannot reduce validity end date for active packages. You can only extend it.",
            variant: "destructive"
          });
          return;
        }
      }
      
      // For active packages, only allow validity and active status changes
      const updatedData = {
        id: selectedPackage.id,
        isActive: packageFormData.isActive,
        validityType: packageFormData.validityType,
        validityMonths: packageFormData.validityType === 'months' ? parseInt(packageFormData.validityMonths) : null,
        validityStartDate: packageFormData.validityType === 'custom_dates' ? packageFormData.validityStartDate : null,
        validityEndDate: packageFormData.validityType === 'custom_dates' ? packageFormData.validityEndDate : null
      };
      
      updatePackageMutation.mutate(updatedData);
    } else {
      // For inactive packages, allow all changes
      const updatedData = {
        id: selectedPackage.id,
        ...packageFormData,
        mealCount: parseInt(packageFormData.mealCount),
        pricePerMeal: parseFloat(packageFormData.pricePerMeal),
        discountPercentage: parseInt(packageFormData.discountPercentage),
        validityMonths: packageFormData.validityType === 'months' ? parseInt(packageFormData.validityMonths) : null,
        validityStartDate: packageFormData.validityType === 'custom_dates' ? packageFormData.validityStartDate : null,
        validityEndDate: packageFormData.validityType === 'custom_dates' ? packageFormData.validityEndDate : null
      };
      
      updatePackageMutation.mutate(updatedData);
    }
  };

  const handleCancelPackageEdit = () => {
    setIsEditPackageModalOpen(false);
    setSelectedPackage(null);
    setPackageFormData({
      name: '',
      description: '',
      mealCount: '',
      pricePerMeal: '',
      discountPercentage: '',
      validityType: 'months',
      validityMonths: '',
      validityStartDate: '',
      validityEndDate: '',
      isActive: true
    });
  };

  // Navigation handlers for notifications
  const handleNavigateToReservation = (reservationId: number) => {
    setActiveTab("reservations");
    setReservationView("list");
    // Optionally scroll to the specific reservation
    setTimeout(() => {
      const element = document.getElementById(`reservation-${reservationId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-orange-400', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-orange-400', 'ring-offset-2');
        }, 3000);
      }
    }, 100);
  };

  const handleNavigateToOrder = (orderId: number) => {
    setActiveTab("orders");
    // Optionally scroll to the specific order
    setTimeout(() => {
      const element = document.getElementById(`order-${orderId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-orange-400', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-orange-400', 'ring-offset-2');
        }, 3000);
      }
    }, 100);
  };



  // Fetch owner's restaurants
  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ["/api/restaurant-portal/restaurants"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/restaurant-portal/restaurants");
      return response.json();
    }
  });

  // Fetch cities for Add Restaurant form (default to Romania)
  const { data: availableCities = [], isLoading: citiesLoading } = useQuery<any[]>({
    queryKey: ['/api/cities', 'add-restaurant', 'RO'],
    queryFn: async () => {
      const response = await fetch('/api/cities?country=RO&limit=500');
      if (!response.ok) throw new Error('Failed to fetch cities');
      return response.json();
    }
  });

  // Fetch reservations for the restaurant
  const { data: reservations = [], isLoading: isLoadingReservations } = useQuery<any[]>({
    queryKey: ["/api/restaurant-portal/reservations"],
    enabled: activeTab === "reservations"
  });

  // Fetch orders for the restaurant
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<any[]>({
    queryKey: ["/api/restaurant-portal/orders"],
    enabled: activeTab === "orders"
  });

  // Fetch voucher packages for restaurant owner's restaurants
  const { data: voucherPackages = [], isLoading: isLoadingPackages } = useQuery<any[]>({
    queryKey: ["/api/restaurant-portal/packages"],
    queryFn: () => api.getRestaurantPortalPackages(),
    enabled: activeTab === "packages"
  });

  const { data: chefs = [], isLoading: isLoadingChefs } = useQuery<any[]>({
    queryKey: ["/api/restaurant-portal/chefs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/restaurant-portal/chefs");
      return response.json();
    },
    enabled: activeTab === "chef"
  });

  const { data: allMenuItems = [], isLoading: isLoadingMenu } = useQuery<any[]>({
    queryKey: ["/api/restaurant-portal/menu-items"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/restaurant-portal/menu-items");
      return response.json();
    },
    enabled: activeTab === "menu"
  });

  useEffect(() => {
    if (activeTab === "menu" && restaurants.length === 1 && !menuRestaurantId) {
      setMenuRestaurantId(restaurants[0].id);
    }
  }, [activeTab, restaurants, menuRestaurantId]);

  const filteredMenuItems = allMenuItems.filter((item: any) => {
    if (menuRestaurantId && item.restaurantId !== menuRestaurantId) return false;
    if (menuCategory !== "all" && item.category !== menuCategory) return false;
    return true;
  });

  const handleDeleteMenuItem = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await apiRequest("DELETE", `/api/restaurant-portal/menu-items/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/menu-items"] });
      toast({ title: "Menu item deleted" });
    } catch (error) {
      toast({ title: "Failed to delete menu item", variant: "destructive" });
    }
  };

  const handleToggleAvailability = async (id: number) => {
    try {
      await apiRequest("PATCH", `/api/restaurant-portal/menu-items/${id}/availability`);
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/menu-items"] });
    } catch (error) {
      toast({ title: "Failed to toggle availability", variant: "destructive" });
    }
  };

  const handleOpenMenuItemForm = (item?: any) => {
    if (item) {
      setEditingMenuItem(item);
      setMenuFormData({
        name: item.name || '',
        description: item.description || '',
        category: item.category || 'mains',
        price: item.price?.toString() || '',
        imageUrl: item.imageUrl || '',
        ingredients: (item.ingredients || []).join(', '),
        allergens: (item.allergens || []).join(', '),
        dietaryTags: (item.dietaryTags || []).join(', '),
        spiceLevel: item.spiceLevel || 0,
        calories: item.calories?.toString() || '',
        preparationTime: item.preparationTime?.toString() || '',
        isAvailable: item.isAvailable ?? true,
        isPopular: item.isPopular ?? false
      });
    } else {
      setEditingMenuItem(null);
      setMenuFormData({
        name: '', description: '', category: 'mains', price: '', imageUrl: '',
        ingredients: '', allergens: '', dietaryTags: '', spiceLevel: 0,
        calories: '', preparationTime: '', isAvailable: true, isPopular: false
      });
    }
    setAiSuggestedForName(null);
    setIsMenuItemFormOpen(true);
  };

  const handleMenuImageUpload = async (file: File) => {
    setIsUploadingMenuImage(true);
    try {
      const res = await apiRequest("POST", "/api/uploads/restaurant-image", {
        fileName: file.name,
        contentType: file.type
      });
      const { uploadUrl, objectPath } = await res.json();
      
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });
      
      setMenuFormData(prev => ({ ...prev, imageUrl: objectPath }));
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploadingMenuImage(false);
    }
  };

  const handleGenerateAiImage = async () => {
    if (!menuFormData.name.trim()) {
      toast({ title: "Please enter a dish name first", variant: "destructive" });
      return;
    }
    setIsGeneratingAiImage(true);
    try {
      const response = await apiRequest("POST", "/api/restaurant-portal/menu-items/ai-generate-image", {
        name: menuFormData.name,
        category: menuFormData.category
      });
      const { objectPath } = await response.json();
      setMenuFormData(prev => ({ ...prev, imageUrl: objectPath }));
      toast({ title: "AI image generated and saved!" });
    } catch (error) {
      toast({ title: "Failed to generate AI image", variant: "destructive" });
    } finally {
      setIsGeneratingAiImage(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!menuFormData.name.trim()) {
      toast({ title: "Please enter a dish name first", variant: "destructive" });
      return;
    }
    setIsAiSuggesting(true);
    try {
      const response = await apiRequest("POST", "/api/restaurant-portal/menu-items/ai-suggest", {
        name: menuFormData.name,
        category: menuFormData.category
      });
      const suggestion = await response.json();
      setMenuFormData(prev => ({
        ...prev,
        description: suggestion.description || prev.description,
        ingredients: Array.isArray(suggestion.ingredients) ? suggestion.ingredients.join(', ') : prev.ingredients,
        allergens: Array.isArray(suggestion.allergens) ? suggestion.allergens.join(', ') : prev.allergens,
        dietaryTags: Array.isArray(suggestion.dietaryTags) ? suggestion.dietaryTags.join(', ') : prev.dietaryTags,
        calories: suggestion.calories ? String(suggestion.calories) : prev.calories,
        preparationTime: suggestion.preparationTime ? String(suggestion.preparationTime) : prev.preparationTime,
        spiceLevel: typeof suggestion.spiceLevel === 'number' ? suggestion.spiceLevel : prev.spiceLevel,
      }));
      setAiSuggestedForName(menuFormData.name.trim());
      toast({ title: "AI suggestions applied! You can edit any field." });
    } catch (error) {
      toast({ title: "Failed to get AI suggestions", variant: "destructive" });
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const handleSubmitMenuItem = async () => {
    if (!menuFormData.name || !menuFormData.price) {
      toast({ title: "Name and price are required", variant: "destructive" });
      return;
    }
    setIsSubmittingMenuItem(true);
    try {
      const payload: any = {
        name: menuFormData.name,
        description: menuFormData.description || null,
        category: menuFormData.category,
        price: menuFormData.price,
        imageUrl: menuFormData.imageUrl || null,
        ingredients: menuFormData.ingredients ? menuFormData.ingredients.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        allergens: menuFormData.allergens ? menuFormData.allergens.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        dietaryTags: menuFormData.dietaryTags ? menuFormData.dietaryTags.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        spiceLevel: menuFormData.spiceLevel,
        calories: menuFormData.calories ? parseInt(menuFormData.calories) : null,
        preparationTime: menuFormData.preparationTime ? parseInt(menuFormData.preparationTime) : null,
        isAvailable: menuFormData.isAvailable,
        isPopular: menuFormData.isPopular
      };

      if (editingMenuItem) {
        await apiRequest("PUT", `/api/restaurant-portal/menu-items/${editingMenuItem.id}`, payload);
        toast({ title: "Menu item updated successfully" });
      } else {
        await apiRequest("POST", `/api/restaurant-portal/restaurants/${menuRestaurantId}/menu`, payload);
        toast({ title: "Menu item created successfully" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/menu-items"] });
      setIsMenuItemFormOpen(false);
      setEditingMenuItem(null);
    } catch (error) {
      toast({ title: editingMenuItem ? "Failed to update menu item" : "Failed to create menu item", variant: "destructive" });
    } finally {
      setIsSubmittingMenuItem(false);
    }
  };

  // Mutations for reservation management
  const confirmReservationMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      return await apiRequest("PATCH", `/api/restaurant-portal/reservations/${id}/confirm`, { restaurantNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/reservations"] });
      toast({
        title: "Reservation Confirmed",
        description: "Customer has been notified of the confirmation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm reservation",
        variant: "destructive",
      });
    },
  });

  const rejectReservationMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      return await apiRequest("PATCH", `/api/restaurant-portal/reservations/${id}/reject`, { restaurantNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/reservations"] });
      toast({
        title: "Reservation Declined",
        description: "Customer has been notified of the cancellation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline reservation",
        variant: "destructive",
      });
    },
  });

  // Mutations for order management
  const confirmOrderMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      return await apiRequest("PATCH", `/api/restaurant-portal/orders/${id}/confirm`, { restaurantNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/orders"] });
      toast({
        title: "Order Confirmed",
        description: "Customer has been notified of the confirmation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm order",
        variant: "destructive",
      });
    },
  });

  const rejectOrderMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      return await apiRequest("PATCH", `/api/restaurant-portal/orders/${id}/reject`, { restaurantNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/orders"] });
      toast({
        title: "Order Declined",
        description: "Customer has been notified of the cancellation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline order",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    setLocation('/restaurant-login');
  };

  const handleViewDetails = (reservation: any) => {
    setSelectedReservation(reservation);
    setIsDetailsModalOpen(true);
  };

  const handleContactCustomer = (reservation: any) => {
    setSelectedReservation(reservation);
    setContactMessage("");
    setIsContactModalOpen(true);
  };

  const sendMessageToCustomer = () => {
    if (!contactMessage.trim() || !selectedReservation) return;
    
    // For now, just show success message - in production this would send email/SMS
    toast({
      title: "Message Sent",
      description: `Your message has been sent to ${selectedReservation.customerName}`,
    });
    
    setIsContactModalOpen(false);
    setContactMessage("");
  };

  // Add restaurant mutation
  const addRestaurantMutation = useMutation({
    mutationFn: async (restaurantData: any) => {
      const response = await apiRequest("POST", "/api/restaurants", restaurantData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Restaurant Added",
        description: "Your restaurant has been submitted for approval",
      });
      setIsAddRestaurantModalOpen(false);
      // Clear the form by resetting all fields
      const form = document.querySelector('form[data-restaurant-form]') as HTMLFormElement;
      if (form) form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/restaurants"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add restaurant",
        variant: "destructive",
      });
    },
  });



  // Delete restaurant mutation
  const deleteRestaurantMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/restaurant-portal/restaurants/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Restaurant Deleted",
        description: "Your restaurant has been deleted successfully",
      });
      setIsDeleteConfirmOpen(false);
      setIsManageRestaurantModalOpen(false);
      setSelectedRestaurant(null);
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/restaurants"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete restaurant",
        variant: "destructive",
      });
    },
  });

  // Order management handlers
  const handleViewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsOrderDetailsModalOpen(true);
  };

  const handleConfirmOrder = (orderId: number) => {
    confirmOrderMutation.mutate({ id: orderId, notes: "Confirmed from order management" });
  };

  const handleRejectOrder = (orderId: number) => {
    rejectOrderMutation.mutate({ id: orderId, notes: "Declined from order management" });
  };

  const handleContactOrderCustomer = (order: any) => {
    setSelectedOrder(order);
    setContactMessage("");
    setIsContactModalOpen(true);
  };

  const sendMessageToOrderCustomer = () => {
    if (!contactMessage.trim() || !selectedOrder) return;
    
    // For now, just show success message - in production this would send email/SMS
    toast({
      title: "Message Sent",
      description: `Your message has been sent to ${selectedOrder.customerName}`,
    });
    
    setIsContactModalOpen(false);
    setContactMessage("");
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getReservationsForDate = (date: Date) => {
    return reservations.filter((reservation: any) => {
      const reservationDate = new Date(reservation.reservationDate);
      return reservationDate.toDateString() === date.toDateString();
    });
  };

  const formatCalendarDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleDayClick = (date: Date) => {
    console.log('Day clicked:', date.toDateString());
    console.log('Current selectedDay:', selectedDay?.toDateString());
    setSelectedDay(selectedDay?.toDateString() === date.toDateString() ? null : date);
  };

  const formatDayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const handleConfirmReservation = (reservationId: number) => {
    confirmReservationMutation.mutate({ id: reservationId, notes: "Confirmed from calendar view" });
  };

  const handleRejectReservation = (reservationId: number) => {
    rejectReservationMutation.mutate({ id: reservationId, notes: "Declined from calendar view" });
  };

  // Week view helper functions
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekDays = (date: Date) => {
    const start = getWeekStart(date);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatWeekRange = (date: Date) => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    const sameMonth = start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();
    
    if (sameMonth && sameYear) {
      return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
    } else if (sameYear) {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      const days = direction === 'prev' ? -7 : 7;
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t.restaurantPortal}</h1>
              <p className="text-sm text-gray-600">{t.welcomeBack}, {owner?.companyName || t.restaurantOwner}</p>
            </div>
            <div className="flex items-center space-x-4">
              {owner && !owner.isVerified && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  {t.pendingVerification}
                </Badge>
              )}
              <NotificationTestButton 
                onCreateTestReservation={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/reservations"] });
                }}
                onCreateTestOrder={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/orders"] });
                }}
              />
              <RestaurantNotificationSystem 
                onNavigateToReservation={handleNavigateToReservation}
                onNavigateToOrder={handleNavigateToOrder}
              />
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                {t.logout}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-10 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-1 text-xs px-2">
              <BarChart3 className="w-3 h-3" />
              {t.overview}
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="flex items-center gap-1 text-xs px-2">
              <Store className="w-3 h-3" />
              {t.restaurants}
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-1 text-xs px-2">
              <Calendar className="w-3 h-3" />
              {t.reservations}
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1 text-xs px-2">
              <Package className="w-3 h-3" />
              {t.orders}
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-1 text-xs px-2">
              <Package className="w-3 h-3" />
              {t.packages}
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="flex items-center gap-1 text-xs px-2">
              <Users className="w-3 h-3" />
              Fidelizare
            </TabsTrigger>
            <TabsTrigger value="cashback" className="flex items-center gap-1 text-xs px-2">
              <CreditCard className="w-3 h-3" />
              Cashback
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-1 text-xs px-2">
              <Menu className="w-3 h-3" />
              {t.menu}
            </TabsTrigger>
            <TabsTrigger value="chef" className="flex items-center gap-1 text-xs px-2">
              <ChefHat className="w-3 h-3" />
              Chef
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 text-xs px-2">
              <Settings className="w-3 h-3" />
              {t.settings}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{restaurants.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {restaurants.filter((r: any) => r.isApproved).length} approved
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{voucherPackages.filter((pkg: any) => pkg.isActive).length}</div>
                  <p className="text-xs text-muted-foreground">Across all restaurants</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {owner?.isVerified ? "Verified" : "Pending"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {owner?.isVerified ? "All features available" : "Verification required"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => setActiveTab("restaurants")}>
                    <Store className="w-4 h-4 mr-2" />
                    Manage Restaurants
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("packages")}>
                    <Package className="w-4 h-4 mr-2" />
                    Create Package
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Restaurants</h2>
              <Button onClick={() => setIsAddRestaurantModalOpen(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Restaurant
              </Button>
            </div>

            {restaurantsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-2 text-gray-600">Loading restaurants...</p>
              </div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No restaurants added yet. Click "Add Restaurant" to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                        <p className="text-sm text-gray-600">{restaurant.cuisine} • {restaurant.location}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant={restaurant.isApproved ? "default" : "secondary"}>
                          {restaurant.isApproved ? "Approved" : "Pending"}
                        </Badge>
                        <Badge variant={restaurant.isActive ? "default" : "destructive"}>
                          {restaurant.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{restaurant.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{restaurant.address}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedRestaurant(restaurant);
                          setIsManageRestaurantModalOpen(true);
                        }}
                      >
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Reservation Management</h2>
              <div className="flex gap-4 items-center">
                <div className="flex gap-2">
                  <Badge variant="outline">
                    <Clock className="w-4 h-4 mr-1" />
                    {reservations.filter((r: any) => r.status === 'pending').length || 0} Pending
                  </Badge>
                  <Badge variant="default">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {reservations.filter((r: any) => r.status === 'confirmed').length || 0} Confirmed
                  </Badge>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={reservationView === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setReservationView('list')}
                    className="text-xs"
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    List View
                  </Button>
                  <Button
                    variant={reservationView === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setReservationView('calendar')}
                    className="text-xs"
                  >
                    <CalendarDays className="w-4 h-4 mr-1" />
                    Calendar
                  </Button>
                </div>
              </div>
            </div>

            {reservationView === 'list' && (
              <>
                {/* Pending Reservations */}
                <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Pending Reservations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingReservations ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                      <p className="text-muted-foreground">Loading reservations...</p>
                    </div>
                  ) : reservations.filter((r: any) => r.status === 'pending').length > 0 ? (
                    reservations.filter((r: any) => r.status === 'pending').map((reservation: any) => (
                      <div key={reservation.id} id={`reservation-${reservation.id}`} className="border rounded-lg p-4 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{reservation.customerName}</h4>
                            <p className="text-sm text-muted-foreground">{reservation.customerEmail}</p>
                          </div>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <span className="font-medium">Date:</span> {new Date(reservation.reservationDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span> {new Date(reservation.reservationDate).toLocaleTimeString()}
                          </div>
                          <div>
                            <span className="font-medium">Party Size:</span> {reservation.partySize} people
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span> {reservation.customerPhone || 'Not provided'}
                          </div>
                        </div>
                        {reservation.specialRequests && (
                          <div className="mb-4">
                            <p className="text-sm"><span className="font-medium">Special Requests:</span> {reservation.specialRequests}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => confirmReservationMutation.mutate({ id: reservation.id })}
                            disabled={confirmReservationMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {confirmReservationMutation.isPending ? 'Confirming...' : 'Confirm'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => rejectReservationMutation.mutate({ id: reservation.id })}
                            disabled={rejectReservationMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {rejectReservationMutation.isPending ? 'Declining...' : 'Decline'}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">No pending reservations</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Confirmed Reservations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Confirmed Reservations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reservations.filter((r: any) => r.status === 'confirmed').length > 0 ? (
                    reservations.filter((r: any) => r.status === 'confirmed').map((reservation: any) => (
                      <div key={reservation.id} id={`reservation-${reservation.id}`} className="border rounded-lg p-4 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{reservation.customerName}</h4>
                            <p className="text-sm text-muted-foreground">{reservation.customerEmail}</p>
                          </div>
                          <Badge variant="default">Confirmed</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <span className="font-medium">Date:</span> {new Date(reservation.reservationDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span> {new Date(reservation.reservationDate).toLocaleTimeString()}
                          </div>
                          <div>
                            <span className="font-medium">Party Size:</span> {reservation.partySize} people
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span> {reservation.customerPhone || 'Not provided'}
                          </div>
                        </div>
                        {reservation.specialRequests && (
                          <div className="mb-4">
                            <p className="text-sm"><span className="font-medium">Special Requests:</span> {reservation.specialRequests}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleViewDetails(reservation)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleContactCustomer(reservation)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Contact Customer
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">No confirmed reservations</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
              </>
            )}

            {reservationView === 'calendar' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5" />
                      Reservation Calendar
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <Button
                          variant={calendarView === 'month' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setCalendarView('month')}
                          className="text-xs"
                        >
                          Month
                        </Button>
                        <Button
                          variant={calendarView === 'week' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setCalendarView('week')}
                          className="text-xs"
                        >
                          Week
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => calendarView === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[150px] text-center">
                          {calendarView === 'month' ? formatCalendarDate(currentDate) : formatWeekRange(currentDate)}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => calendarView === 'month' ? navigateMonth('next') : navigateWeek('next')}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2 text-xs font-medium text-gray-500 text-center">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {calendarView === 'month' && (
                      <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: getFirstDayOfMonth(currentDate) }, (_, i) => (
                      <div key={`empty-${i}`} className="h-20"></div>
                    ))}
                    {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
                      const day = i + 1;
                      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                      const dayReservations = getReservationsForDate(date);
                      const isToday = date.toDateString() === new Date().toDateString();
                      const isPast = date < new Date() && !isToday;
                      
                      return (
                        <div
                          key={day}
                          className={`h-20 border rounded-lg p-1 relative cursor-pointer transition-colors ${
                            isToday ? 'bg-blue-50 border-blue-200' : 
                            isPast ? 'bg-gray-50' : 'bg-white'
                          } ${
                            selectedDay?.toDateString() === date.toDateString() 
                              ? 'ring-2 ring-blue-500 bg-blue-100' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleDayClick(date)}
                        >
                          <div className={`text-xs font-medium ${
                            isToday ? 'text-blue-600' : 
                            isPast ? 'text-gray-400' : 'text-gray-900'
                          }`}>
                            {day}
                          </div>
                          {dayReservations.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {dayReservations.slice(0, 2).map((reservation: any, idx: number) => (
                                <div
                                  key={reservation.id}
                                  className={`text-xs p-1 rounded cursor-pointer truncate ${
                                    reservation.status === 'confirmed' 
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(reservation);
                                  }}
                                  title={`${reservation.customerName} - ${new Date(reservation.reservationDate).toLocaleTimeString()}`}
                                >
                                  {reservation.customerName.split(' ')[0]}
                                </div>
                              ))}
                              {dayReservations.length > 2 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{dayReservations.length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  )}
                  
                  {calendarView === 'week' && (
                    <div className="grid grid-cols-7 gap-1">
                      {getWeekDays(currentDate).map((day) => {
                        const dayReservations = getReservationsForDate(day);
                        const isToday = day.toDateString() === new Date().toDateString();
                        const isSelected = selectedDay?.toDateString() === day.toDateString();
                        
                        return (
                          <div
                            key={day.toISOString()}
                            className={`
                              h-32 border rounded-lg cursor-pointer transition-all hover:shadow-md
                              ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
                              ${isSelected ? 'ring-2 ring-blue-500' : ''}
                              hover:bg-gray-50
                            `}
                            onClick={() => handleDayClick(day)}
                          >
                            <div className="p-2 h-full flex flex-col">
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {day.getDate()}
                              </div>
                              {dayReservations.length > 0 && (
                                <div className="flex-1 space-y-1 overflow-hidden">
                                  {dayReservations.slice(0, 3).map((reservation: any) => (
                                    <div
                                      key={reservation.id}
                                      className={`
                                        text-xs px-2 py-1 rounded text-white truncate
                                        ${reservation.status === 'confirmed'
                                          ? 'bg-green-500'
                                          : reservation.status === 'pending'
                                          ? 'bg-amber-500'
                                          : 'bg-gray-500'
                                        }
                                      `}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {reservation.customerName}
                                    </div>
                                  ))}
                                  {dayReservations.length > 3 && (
                                    <div className="text-xs text-gray-500 text-center">
                                      +{dayReservations.length - 3} more
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="mt-4 flex gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                      <span>Confirmed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></div>
                      <span>Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                      <span>Today</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-100 border-2 border-blue-500 rounded"></div>
                      <span>Selected Day</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expanded Day View for Calendar */}
            {selectedDay && reservationView === 'calendar' && (
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {formatDayDate(selectedDay)}
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedDay(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const dayReservations = getReservationsForDate(selectedDay);
                  
                  if (dayReservations.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-muted-foreground">No reservations for this day</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {dayReservations.map((reservation: any) => (
                        <div
                          key={reservation.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-4">
                            <Badge
                              variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}
                              className={
                                reservation.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-amber-100 text-amber-800'
                              }
                            >
                              {reservation.status}
                            </Badge>
                            <div>
                              <p className="font-medium">{reservation.customerName}</p>
                              <p className="text-sm text-gray-600">{reservation.customerEmail}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {new Date(reservation.reservationDate).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-sm text-gray-600">
                              {reservation.partySize} {reservation.partySize === 1 ? 'person' : 'people'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(reservation)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                            {reservation.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirmReservation(reservation.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectReservation(reservation.id)}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleContactCustomer(reservation)}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Order Management</h2>
              <div className="flex gap-2">
                <NotificationTestButton 
                  onCreateTestReservation={() => queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/reservations"] })}
                  onCreateTestOrder={() => queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/orders"] })}
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <p className="text-sm text-gray-600">Manage incoming orders from customers</p>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600">Orders from customers will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <div
                        key={order.id}
                        id={`order-${order.id}`}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">Order #{order.orderNumber}</h3>
                            <p className="text-gray-600">Customer: {order.customerName}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()} at{" "}
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                order.status === "pending"
                                  ? "default"
                                  : order.status === "confirmed"
                                  ? "secondary"
                                  : order.status === "completed"
                                  ? "outline"
                                  : "destructive"
                              }
                            >
                              {order.status}
                            </Badge>
                            <p className="text-lg font-bold mt-1">€{order.totalAmount}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium mb-2">Contact Information</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{order.customerPhone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span>{order.customerEmail}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Order Details</h4>
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium">Type:</span> {order.orderType}</p>
                              {order.specialInstructions && (
                                <p><span className="font-medium">Instructions:</span> {order.specialInstructions}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewOrderDetails(order)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          {order.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleConfirmOrder(order.id)}
                                disabled={confirmOrderMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {confirmOrderMutation.isPending ? "Confirming..." : "Confirm Order"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectOrder(order.id)}
                                disabled={rejectOrderMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                {rejectOrderMutation.isPending ? "Rejecting..." : "Reject"}
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleContactOrderCustomer(order)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Contact Customer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Voucher Packages</h2>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Package
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Available Templates</CardTitle>
                <p className="text-sm text-gray-600">Choose from our pre-designed voucher package templates</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Starter Package</h4>
                      <p className="text-sm text-gray-600 mb-3">Perfect for new restaurants</p>
                      <div className="space-y-2 text-xs">
                        <div>Meals: 5, 10, 15</div>
                        <div>Discounts: 10%, 15%, 20%</div>
                        <div>Validity: 6, 12 months</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Voucher Packages</CardTitle>
                <p className="text-sm text-gray-600">Packages created in the admin dashboard for your restaurants</p>
              </CardHeader>
              <CardContent>
                {isLoadingPackages ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading packages...</span>
                  </div>
                ) : voucherPackages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {voucherPackages.map((pkg: any) => (
                      <Card key={pkg.id} className="border hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900 truncate">{pkg.name}</h4>
                            <Badge variant={pkg.isActive ? "default" : "secondary"}>
                              {pkg.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{pkg.description}</p>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Restaurant:</span>
                              <span className="font-medium">{pkg.restaurantName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Meals:</span>
                              <span className="font-medium">{pkg.mealCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Price per meal:</span>
                              <span className="font-medium">€{parseFloat(pkg.pricePerMeal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Discount:</span>
                              <span className="font-medium text-green-600">{parseFloat(pkg.discountPercentage).toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Validity:</span>
                              <span className="font-medium">
                                {pkg.validityType === 'custom_dates' 
                                  ? `${new Date(pkg.validityStartDate).toLocaleDateString()} - ${new Date(pkg.validityEndDate).toLocaleDateString()}`
                                  : `${pkg.validityMonths} months`
                                }
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Total value:</span>
                              <span className="font-medium">€{(pkg.mealCount * parseFloat(pkg.pricePerMeal)).toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">
                                Created: {new Date(pkg.createdAt).toLocaleDateString()}
                              </span>
                              <div className="flex gap-2">
                                {!pkg.isActive && (
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => handleActivatePackage(pkg)}
                                    disabled={activatePackageMutation.isPending}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {activatePackageMutation.isPending && activatePackageMutation.variables?.id === pkg.id ? 'Activating...' : 'Activate'}
                                  </Button>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditPackage(pkg)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  {pkg.isActive ? 'Extend Validity' : 'Edit'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No voucher packages yet</h3>
                    <p className="text-gray-600 mb-4">
                      Voucher packages are created in the admin dashboard and will appear here automatically.
                    </p>
                    <p className="text-sm text-gray-500">
                      Contact your administrator to create voucher packages for your restaurants.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty" className="space-y-6">
            <LoyaltyManagement restaurants={restaurants} />
          </TabsContent>

          {/* Chef Tab */}
          <TabsContent value="chef" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Chef Management
                </CardTitle>
                <Button onClick={() => { setEditingChef(null); setIsChefFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Chef
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingChefs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : chefs.length === 0 ? (
                  <div className="text-center py-12">
                    <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Chefs Yet</h3>
                    <p className="text-muted-foreground mb-4">Add your first chef to showcase your culinary talent</p>
                    <Button onClick={() => { setEditingChef(null); setIsChefFormOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Chef
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chefs.map((item: any) => {
                      const chef = item.chef || item;
                      const restaurantName = item.restaurant?.name || "Unknown";
                      return (
                        <Card key={chef.id} className="overflow-hidden">
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              {chef.profileImage ? (
                                <img src={chef.profileImage} alt={chef.chefName} className="w-12 h-12 rounded-full object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                  <ChefHat className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{chef.chefName}</h3>
                                {chef.title && <p className="text-sm text-muted-foreground">{chef.title}</p>}
                                <p className="text-xs text-muted-foreground mt-1">{restaurantName}</p>
                              </div>
                            </div>
                            {chef.bio && (
                              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{chef.bio}</p>
                            )}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {chef.experienceLevel && (
                                <Badge variant="secondary" className="text-xs">{chef.experienceLevel}</Badge>
                              )}
                              {chef.yearsOfExperience > 0 && (
                                <Badge variant="outline" className="text-xs">{chef.yearsOfExperience} yrs</Badge>
                              )}
                              {chef.isPublic && (
                                <Badge variant="outline" className="text-xs">Public</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setEditingChef(chef); setIsChefFormOpen(true); }}
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
                                onClick={async () => {
                                  if (!confirm("Are you sure you want to delete this chef?")) return;
                                  try {
                                    await apiRequest("DELETE", `/api/restaurant-portal/chefs/${chef.id}`);
                                    queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/chefs"] });
                                    toast({ title: "Chef deleted successfully" });
                                  } catch (error: any) {
                                    toast({ title: "Error", description: error.message || "Failed to delete chef", variant: "destructive" });
                                  }
                                }}
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

            {isChefFormOpen && (
              <ChefForm
                chef={editingChef}
                restaurants={restaurants.length > 1 ? restaurants : undefined}
                fixedRestaurantId={restaurants.length === 1 ? restaurants[0]?.id : undefined}
                showFeatured={false}
                onClose={() => { setIsChefFormOpen(false); setEditingChef(null); }}
                onSave={async (data: any) => {
                  try {
                    if (editingChef) {
                      await apiRequest("PUT", `/api/restaurant-portal/chefs/${editingChef.id}`, data);
                      toast({ title: "Chef updated successfully" });
                    } else {
                      await apiRequest("POST", "/api/restaurant-portal/chefs", data);
                      toast({ title: "Chef created successfully" });
                    }
                    queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/chefs"] });
                    setIsChefFormOpen(false);
                    setEditingChef(null);
                  } catch (error: any) {
                    toast({ title: "Error", description: error.message || "Failed to save chef", variant: "destructive" });
                  }
                }}
              />
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isEditingAccountInfo ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Company Name</label>
                        <p className="text-sm text-gray-600">{owner?.companyName || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-sm text-gray-600">{owner?.email || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Username (Contact Person)</label>
                        <p className="text-sm text-gray-600">{owner?.contactPersonName || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <p className="text-sm text-gray-600">{owner?.companyPhone || 'Not set'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Address</label>
                      <p className="text-sm text-gray-600">{owner?.companyAddress || 'Not set'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleEditAccountInfo}>
                        Edit Information
                      </Button>
                      <Button variant="outline" onClick={handleChangePassword}>
                        Change Password
                      </Button>
                      <Button variant="outline" onClick={handleManageUsers}>
                        Manage Users
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={accountFormData.companyName}
                          onChange={(e) => handleFormChange('companyName', e.target.value)}
                          placeholder="Enter company name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={accountFormData.email}
                          onChange={(e) => handleFormChange('email', e.target.value)}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactPersonName">Username (Contact Person)</Label>
                        <Input
                          id="contactPersonName"
                          value={accountFormData.contactPersonName}
                          onChange={(e) => handleFormChange('contactPersonName', e.target.value)}
                          placeholder="Enter username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="companyPhone">Phone</Label>
                        <Input
                          id="companyPhone"
                          value={accountFormData.companyPhone}
                          onChange={(e) => handleFormChange('companyPhone', e.target.value)}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="companyAddress">Address</Label>
                      <Textarea
                        id="companyAddress"
                        value={accountFormData.companyAddress}
                        onChange={(e) => handleFormChange('companyAddress', e.target.value)}
                        placeholder="Enter company address"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveAccountInfo}
                        disabled={updateAccountMutation.isPending}
                      >
                        {updateAccountMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleCancelEdit}
                        disabled={updateAccountMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
                
                {/* Password Change Form */}
                {isChangingPassword && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-medium mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordFormData.currentPassword}
                          onChange={(e) => handlePasswordFormChange('currentPassword', e.target.value)}
                          placeholder="Enter current password"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordFormData.newPassword}
                          onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)}
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordFormData.confirmPassword}
                          onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
                          placeholder="Confirm new password"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleSavePassword}
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? "Saving..." : "Update Password"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelPasswordChange}
                          disabled={changePasswordMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* User Management Form */}
                {isManagingUsers && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Team Management</h3>
                      <Button 
                        variant="outline" 
                        onClick={handleCancelUserManagement}
                      >
                        Close
                      </Button>
                    </div>
                    
                    {/* Existing Users List */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium mb-3">Current Team Members</h4>
                      {isLoadingUsers ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <span className="ml-2">Loading users...</span>
                        </div>
                      ) : companyUsers.length > 0 ? (
                        <div className="space-y-2">
                          {companyUsers.map((user: any) => (
                            <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {user.contactPersonName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <p className="font-medium">{user.contactPersonName || 'No name'}</p>
                                  <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={user.isActive ? "default" : "secondary"}>
                                  {user.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Badge variant="outline">
                                  {user.role || 'User'}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setIsDeleteUserModalOpen(true);
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 py-4">No team members found.</p>
                      )}
                    </div>

                    {/* Add New User Form */}
                    <div className="border-t pt-4">
                      <h4 className="text-md font-medium mb-3">Add New Team Member</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="userEmail">Email</Label>
                            <Input
                              id="userEmail"
                              type="email"
                              value={newUserFormData.email}
                              onChange={(e) => handleNewUserFormChange('email', e.target.value)}
                              placeholder="Enter user email"
                            />
                          </div>
                          <div>
                            <Label htmlFor="userName">Name</Label>
                            <Input
                              id="userName"
                              value={newUserFormData.contactPersonName}
                              onChange={(e) => handleNewUserFormChange('contactPersonName', e.target.value)}
                              placeholder="Enter user name"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="userRole">Role</Label>
                            <select 
                              id="userRole"
                              value={newUserFormData.role}
                              onChange={(e) => handleNewUserFormChange('role', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                              <option value="user">User</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="userPassword">Password</Label>
                            <Input
                              id="userPassword"
                              type="password"
                              value={newUserFormData.password}
                              onChange={(e) => handleNewUserFormChange('password', e.target.value)}
                              placeholder="Enter user password"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleAddUser}
                            disabled={addUserMutation.isPending}
                          >
                            {addUserMutation.isPending ? "Adding..." : "Add User"}
                          </Button>
                          <Button 
                            variant="ghost" 
                            onClick={() => {
                              setNewUserFormData({
                                email: '',
                                contactPersonName: '',
                                role: 'user',
                                password: ''
                              });
                            }}
                          >
                            Reset Form
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Banking Information</CardTitle>
                <p className="text-sm text-gray-600">Setup your banking details for payment transfers</p>
              </CardHeader>
              <CardContent>
                <BankingInformationForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Portal Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive updates about your restaurants and packages</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">API Access</h4>
                    <p className="text-sm text-gray-600">Manage API keys for integration</p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cashback Groups Tab */}
          <TabsContent value="cashback" className="space-y-6">
            <RestaurantCashbackManagement restaurants={restaurants} />
          </TabsContent>

          {/* Menu Management Tab */}
          <TabsContent value="menu" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
                <p className="text-gray-600">Manage your restaurant menus and menu items</p>
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  if (!menuRestaurantId) {
                    toast({ title: "Please select a restaurant first", variant: "destructive" });
                    return;
                  }
                  handleOpenMenuItemForm();
                }}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Menu Item
              </Button>
            </div>

            {restaurants.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Restaurant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {restaurants.map((restaurant: any) => (
                      <Card 
                        key={restaurant.id} 
                        className={`cursor-pointer hover:shadow-md transition-shadow border-2 ${menuRestaurantId === restaurant.id ? 'border-primary' : 'border-transparent'}`}
                        onClick={() => setMenuRestaurantId(restaurant.id)}
                      >
                        <CardContent className="p-4">
                          <h3 className="font-semibold">{restaurant.name}</h3>
                          <p className="text-sm text-gray-600">{restaurant.cuisine} • {restaurant.location}</p>
                          <div className="mt-2">
                            <Badge variant={restaurant.isActive ? "default" : "secondary"}>
                              {restaurant.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {menuRestaurantId ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Menu Items for {restaurants.find((r: any) => r.id === menuRestaurantId)?.name || 'Restaurant'}
                  </CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    {["all", "appetizers", "mains", "desserts", "beverages", "sides", "soups", "salads", "specials"].map(cat => (
                      <Button 
                        key={cat}
                        variant={menuCategory === cat ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setMenuCategory(cat)}
                      >
                        {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingMenu ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                  ) : filteredMenuItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg font-medium">No menu items found</p>
                      <p className="text-sm mt-1">Add your first menu item to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredMenuItems.map((item: any) => (
                        <div key={item.id} className="border rounded-lg p-4 flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-gray-600 line-clamp-1">{item.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="secondary">{item.category}</Badge>
                                {(item.dietaryTags || []).map((tag: string) => (
                                  <Badge key={tag} variant="outline">{tag}</Badge>
                                ))}
                                <span className="text-sm font-medium text-gray-700">€{parseFloat(item.price).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              className="cursor-pointer"
                              variant={item.isAvailable ? "default" : "destructive"}
                              onClick={() => handleToggleAvailability(item.id)}
                            >
                              {item.isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={() => handleOpenMenuItemForm(item)}>
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteMenuItem(item.id)}>
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <p className="text-lg font-medium">Select a restaurant</p>
                    <p className="text-sm mt-1">Choose a restaurant above to manage its menu</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {isMenuItemFormOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>Name *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        title={!menuFormData.name.trim() ? 'Introduceți mai întâi denumirea produsului' : aiSuggestedForName === menuFormData.name.trim() ? 'Autocomplete deja aplicat. Modificați denumirea pentru a reutiliza.' : ''}
                        onClick={handleAiSuggest}
                        disabled={isAiSuggesting || !menuFormData.name.trim() || aiSuggestedForName === menuFormData.name.trim()}
                        className="text-xs h-7 px-2 gap-1 border-purple-300 text-purple-700 hover:text-purple-700 hover:bg-purple-50 disabled:text-purple-400 disabled:opacity-60"
                      >
                        {isAiSuggesting ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        {isAiSuggesting ? 'AI analyzing...' : 'AI Autocomplete'}
                      </Button>
                    </div>
                    <Input value={menuFormData.name} onChange={e => setMenuFormData(p => ({ ...p, name: e.target.value }))} placeholder="Enter dish name, then click AI Autocomplete" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={menuFormData.description} onChange={e => setMenuFormData(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Select value={menuFormData.category} onValueChange={v => setMenuFormData(p => ({ ...p, category: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appetizers">Appetizers</SelectItem>
                          <SelectItem value="mains">Mains</SelectItem>
                          <SelectItem value="desserts">Desserts</SelectItem>
                          <SelectItem value="beverages">Beverages</SelectItem>
                          <SelectItem value="sides">Sides</SelectItem>
                          <SelectItem value="soups">Soups</SelectItem>
                          <SelectItem value="salads">Salads</SelectItem>
                          <SelectItem value="specials">Specials</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Price (€) *</Label>
                      <Input type="number" step="0.01" min="0" value={menuFormData.price} onChange={e => setMenuFormData(p => ({ ...p, price: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Product Image</Label>
                    {menuFormData.imageUrl ? (
                      <div className="flex items-center gap-3 mt-1">
                        <img src={menuFormData.imageUrl} alt="Product" className="w-20 h-20 object-cover rounded-lg border" />
                        <Button type="button" variant="outline" size="sm" onClick={() => setMenuFormData(p => ({ ...p, imageUrl: '' }))}>
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 mt-1">
                        <div
                          className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                          onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-teal-500', 'bg-teal-50'); }}
                          onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-teal-500', 'bg-teal-50'); }}
                          onDrop={e => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-teal-500', 'bg-teal-50');
                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith('image/')) handleMenuImageUpload(file);
                          }}
                          onClick={() => document.getElementById('menu-image-input')?.click()}
                        >
                          {isUploadingMenuImage ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                              <p className="text-sm text-gray-500">Uploading...</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-6 h-6 text-gray-400" />
                              <p className="text-sm text-gray-500">Drag & drop or click to browse</p>
                              <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                            </div>
                          )}
                        </div>
                        <input
                          id="menu-image-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleMenuImageUpload(file);
                            e.target.value = '';
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateAiImage}
                          disabled={isGeneratingAiImage || !menuFormData.name.trim()}
                          className="w-full text-xs h-8 gap-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          {isGeneratingAiImage ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          {isGeneratingAiImage ? 'Generating image...' : 'AI Generate Image'}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Ingredients (comma-separated)</Label>
                    <Input value={menuFormData.ingredients} onChange={e => setMenuFormData(p => ({ ...p, ingredients: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Allergens (comma-separated)</Label>
                    <Input value={menuFormData.allergens} onChange={e => setMenuFormData(p => ({ ...p, allergens: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Dietary Tags (comma-separated)</Label>
                    <Input value={menuFormData.dietaryTags} onChange={e => setMenuFormData(p => ({ ...p, dietaryTags: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Spice Level (0-5)</Label>
                      <Input type="number" min="0" max="5" value={menuFormData.spiceLevel} onChange={e => setMenuFormData(p => ({ ...p, spiceLevel: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <Label>Calories</Label>
                      <Input type="number" min="0" value={menuFormData.calories} onChange={e => setMenuFormData(p => ({ ...p, calories: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Prep Time (min)</Label>
                      <Input type="number" min="0" value={menuFormData.preparationTime} onChange={e => setMenuFormData(p => ({ ...p, preparationTime: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={menuFormData.isAvailable} onChange={e => setMenuFormData(p => ({ ...p, isAvailable: e.target.checked }))} className="rounded" />
                      <span className="text-sm">Available</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={menuFormData.isPopular} onChange={e => setMenuFormData(p => ({ ...p, isPopular: e.target.checked }))} className="rounded" />
                      <span className="text-sm">Popular</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setIsMenuItemFormOpen(false); setEditingMenuItem(null); }}>Cancel</Button>
                    <Button onClick={handleSubmitMenuItem} disabled={isSubmittingMenuItem}>
                      {isSubmittingMenuItem && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingMenuItem ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}


        </Tabs>
      </div>

      {/* View Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Reservation Details
            </DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <p className="text-sm">{selectedReservation.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedReservation.customerEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm">{selectedReservation.customerPhone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Party Size</Label>
                  <p className="text-sm">{selectedReservation.partySize} people</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">{new Date(selectedReservation.reservationDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Time</Label>
                  <p className="text-sm">{new Date(selectedReservation.reservationDate).toLocaleTimeString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={selectedReservation.status === 'confirmed' ? 'default' : 'outline'}>
                    {selectedReservation.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Voucher Reservation</Label>
                  <p className="text-sm">{selectedReservation.isVoucherReservation ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              {selectedReservation.specialRequests && (
                <div>
                  <Label className="text-sm font-medium">Special Requests</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{selectedReservation.specialRequests}</p>
                </div>
              )}
              
              {selectedReservation.restaurantNotes && (
                <div>
                  <Label className="text-sm font-medium">Restaurant Notes</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{selectedReservation.restaurantNotes}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <Label className="text-xs font-medium">Created</Label>
                  <p>{new Date(selectedReservation.createdAt).toLocaleString()}</p>
                </div>
                {selectedReservation.confirmedAt && (
                  <div>
                    <Label className="text-xs font-medium">Confirmed</Label>
                    <p>{new Date(selectedReservation.confirmedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Customer Modal */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Contact Customer
            </DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{selectedReservation.customerName}</h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {selectedReservation.customerEmail}
                  </div>
                  {selectedReservation.customerPhone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {selectedReservation.customerPhone}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Reservation: {new Date(selectedReservation.reservationDate).toLocaleDateString()} at {new Date(selectedReservation.reservationDate).toLocaleTimeString()}
                </p>
              </div>
              
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message to the customer..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsContactModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={sendMessageToCustomer}
                  disabled={!contactMessage.trim()}
                >
                  Send Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Restaurant Modal */}
      <Dialog open={isAddRestaurantModalOpen} onOpenChange={setIsAddRestaurantModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Restaurant</DialogTitle>
            <p className="text-sm text-gray-600">Complete restaurant and business information</p>
          </DialogHeader>
          <form data-restaurant-form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const restaurantData = {
              name: formData.get('name'),
              cuisine: formData.get('cuisine'),
              mainProduct: formData.get('mainProduct') || null,
              dietCategory: formData.get('dietCategory') || null,
              conceptType: formData.get('conceptType') || null,
              experienceType: formData.get('experienceType') || null,
              location: formData.get('location'),
              address: formData.get('address'),
              phone: formData.get('phone'),
              email: formData.get('email'),
              description: formData.get('description'),
              priceRange: formData.get('priceRange'),
              imageUrl: formData.get('imageUrl') || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop',
              businessLicense: formData.get('businessLicense'),
              vatNumber: formData.get('vatNumber'),
              operatingHours: JSON.stringify({
                monday: {
                  open: formData.get('mondayOpen') === 'on',
                  start: formData.get('mondayStart'),
                  end: formData.get('mondayEnd')
                },
                tuesday: {
                  open: formData.get('tuesdayOpen') === 'on',
                  start: formData.get('tuesdayStart'),
                  end: formData.get('tuesdayEnd')
                },
                wednesday: {
                  open: formData.get('wednesdayOpen') === 'on',
                  start: formData.get('wednesdayStart'),
                  end: formData.get('wednesdayEnd')
                },
                thursday: {
                  open: formData.get('thursdayOpen') === 'on',
                  start: formData.get('thursdayStart'),
                  end: formData.get('thursdayEnd')
                },
                friday: {
                  open: formData.get('fridayOpen') === 'on',
                  start: formData.get('fridayStart'),
                  end: formData.get('fridayEnd')
                },
                saturday: {
                  open: formData.get('saturdayOpen') === 'on',
                  start: formData.get('saturdayStart'),
                  end: formData.get('saturdayEnd')
                },
                sunday: {
                  open: formData.get('sundayOpen') === 'on',
                  start: formData.get('sundayStart'),
                  end: formData.get('sundayEnd')
                }
              }),
              hasDelivery: formData.get('hasDelivery') === 'on',
              hasPickup: formData.get('hasPickup') === 'on',
              estimatedMonthlyOrders: formData.get('estimatedMonthlyOrders'),
              website: formData.get('website'),
              // Legal Compliance
              acceptTerms: formData.get('acceptTerms') === 'on',
              acceptGDPR: formData.get('acceptGDPR') === 'on',
              acceptMarketing: formData.get('acceptMarketing') === 'on',
              confirmAuthority: formData.get('confirmAuthority') === 'on'
            };

            addRestaurantMutation.mutate(restaurantData);
          }} className="space-y-6">
            
            {/* Basic Restaurant Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Restaurant Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Restaurant Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="cuisine">Cuisine Type *</Label>
                  <select id="cuisine" name="cuisine" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Select cuisine...</option>
                    {["Italian", "Romanian", "French", "Greek", "Spanish", "German", "Polish", "Portuguese", "Turkish", "Chinese", "Japanese", "Thai", "Vietnamese", "Indian", "Korean", "Mexican", "American", "Brazilian", "Peruvian", "Argentinian", "Lebanese", "Moroccan", "Ethiopian", "Israeli", "Mediterranean", "International", "Other"].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mainProduct">Main Product</Label>
                  <select id="mainProduct" name="mainProduct" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Select main product...</option>
                    {["Meat", "Fish & Seafood", "Pasta", "Pizza", "Sushi", "Burgers", "Salads", "Soups", "Desserts", "Beverages", "Mixed"].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="dietCategory">Diet</Label>
                  <select id="dietCategory" name="dietCategory" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Select diet category...</option>
                    {["Regular", "Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher", "Organic", "Low-Carb"].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="conceptType">Concept</Label>
                  <select id="conceptType" name="conceptType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Select concept...</option>
                    {["Fine Dining", "Casual Dining", "Fast Casual", "Fast Food", "Bistro", "Brasserie", "Trattoria", "Taverna", "Family Restaurant"].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="experienceType">Experience</Label>
                  <select id="experienceType" name="experienceType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Select experience...</option>
                    {["Romantic", "Business", "Family Friendly", "Party & Events", "Relaxed"].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">City *</Label>
                  <select id="location" name="location" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">{citiesLoading ? "Loading cities..." : "Select city..."}</option>
                    {availableCities.map((city: any) => (
                      <option key={city.geonameId || city.name} value={city.name}>
                        {city.name}{city.adminName1 ? ` (${city.adminName1})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="priceRange">Price Range *</Label>
                  <select id="priceRange" name="priceRange" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Select price range...</option>
                    <option value="€">€ - Budget</option>
                    <option value="€€">€€ - Moderate</option>
                    <option value="€€€">€€€ - Upscale</option>
                    <option value="€€€€">€€€€ - Fine Dining</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Full Address *</Label>
                <Input id="address" name="address" required placeholder="Street address, postal code, city" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" name="phone" required type="tel" />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" required type="email" />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Brief description of your restaurant" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input id="website" name="website" type="url" placeholder="https://your-restaurant.com" />
                </div>
                <div>
                  <Label htmlFor="restaurantImage">Restaurant Image</Label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      id="restaurantImage"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        setIsUploadingImage(true);
                        try {
                          // Get signed upload URL
                          const response = await fetch('/api/uploads/restaurant-image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ fileName: file.name, contentType: file.type })
                          });
                          const { uploadUrl, objectPath } = await response.json();
                          
                          // Upload file directly to storage
                          await fetch(uploadUrl, {
                            method: 'PUT',
                            body: file,
                            headers: { 'Content-Type': file.type }
                          });
                          
                          setUploadedImageUrl(objectPath);
                          toast({ title: "Image uploaded successfully" });
                        } catch (error) {
                          toast({ title: "Failed to upload image", variant: "destructive" });
                        } finally {
                          setIsUploadingImage(false);
                        }
                      }}
                    />
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => document.getElementById('restaurantImage')?.click()}
                    >
                      {isUploadingImage ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Uploading...</span>
                        </div>
                      ) : uploadedImageUrl ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span>Image uploaded</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <Upload className="h-5 w-5" />
                          <span>Click to upload image</span>
                        </div>
                      )}
                    </div>
                    <input type="hidden" name="imageUrl" value={uploadedImageUrl} />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Business Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessLicense">Business License Number *</Label>
                  <Input id="businessLicense" name="businessLicense" required placeholder="Enter business license number" />
                </div>
                <div>
                  <Label htmlFor="vatNumber">VAT Number (optional)</Label>
                  <Input id="vatNumber" name="vatNumber" placeholder="Enter VAT number if applicable" />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">Operating Hours *</Label>
                <div className="grid grid-cols-1 gap-3 bg-gray-50 p-4 rounded-lg">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="flex items-center gap-4 p-3 bg-white rounded-md border">
                      <div className="w-20 text-sm font-medium text-gray-700">{day}</div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id={`${day.toLowerCase()}Open`}
                          name={`${day.toLowerCase()}Open`}
                          defaultChecked
                          className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label htmlFor={`${day.toLowerCase()}Open`} className="text-sm text-gray-600">Open</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="time" 
                          name={`${day.toLowerCase()}Start`}
                          defaultValue="09:00"
                          className="w-28 h-8 text-sm"
                        />
                        <span className="text-sm text-gray-500">to</span>
                        <Input 
                          type="time" 
                          name={`${day.toLowerCase()}End`}
                          defaultValue="22:00"
                          className="w-28 h-8 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Uncheck "Open" for days when the restaurant is closed</p>
              </div>

              <div>
                <Label htmlFor="estimatedMonthlyOrders">Estimated Monthly Orders *</Label>
                <select id="estimatedMonthlyOrders" name="estimatedMonthlyOrders" required className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Select range...</option>
                  <option value="1-50">1-50 orders</option>
                  <option value="51-100">51-100 orders</option>
                  <option value="101-250">101-250 orders</option>
                  <option value="251-500">251-500 orders</option>
                  <option value="501-1000">501-1000 orders</option>
                  <option value="1000+">1000+ orders</option>
                </select>
              </div>
            </div>

            {/* Service Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Service Options</h3>
              
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="hasDelivery" name="hasDelivery" className="w-4 h-4" />
                  <Label htmlFor="hasDelivery">Offers Delivery</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="hasPickup" name="hasPickup" className="w-4 h-4" defaultChecked />
                  <Label htmlFor="hasPickup">Offers Pickup</Label>
                </div>
              </div>
            </div>

            {/* Legal Compliance Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Legal Compliance & Agreements</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input 
                    type="checkbox" 
                    id="acceptTerms" 
                    name="acceptTerms" 
                    required 
                    className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-gray-700 leading-5">
                    <strong>Terms & Conditions Agreement:</strong> I have read and agree to the <a href="/terms-of-service" target="_blank" className="text-primary hover:underline font-medium">Terms and Conditions</a> of the EatOff platform. I understand the commission structure (5.5%), payment terms, and platform policies.
                  </label>
                </div>
                
                <div className="flex items-start space-x-3">
                  <input 
                    type="checkbox" 
                    id="acceptGDPR" 
                    name="acceptGDPR" 
                    required 
                    className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="acceptGDPR" className="text-sm text-gray-700 leading-5">
                    <strong>GDPR & Privacy Consent:</strong> I consent to the processing of my personal and business data in accordance with the <a href="/privacy-policy" target="_blank" className="text-primary hover:underline font-medium">Privacy Policy</a> and GDPR regulations. I understand how my data will be used for platform operations, customer service, and payment processing.
                  </label>
                </div>
                
                <div className="flex items-start space-x-3">
                  <input 
                    type="checkbox" 
                    id="acceptMarketing" 
                    name="acceptMarketing" 
                    className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="acceptMarketing" className="text-sm text-gray-700 leading-5">
                    <strong>Marketing Communications:</strong> <em>(Optional)</em> I consent to receive marketing communications, promotional offers, business insights, and platform updates from EatOff. I can unsubscribe at any time through my account settings.
                  </label>
                </div>
                
                <div className="flex items-start space-x-3">
                  <input 
                    type="checkbox" 
                    id="confirmAuthority" 
                    name="confirmAuthority" 
                    required 
                    className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="confirmAuthority" className="text-sm text-gray-700 leading-5">
                    <strong>Business Authority:</strong> I confirm that I have the legal authority to represent this business and bind it to agreements with the EatOff platform. All information provided is accurate and truthful.
                  </label>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-500 text-lg">ℹ️</div>
                  <div>
                    <h4 className="font-medium text-blue-800">Review Process</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      All restaurant applications undergo review and approval by the EatOff team. We verify business information and may request additional documentation before activating your restaurant on the platform. This process typically takes 1-3 business days.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsAddRestaurantModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addRestaurantMutation.isPending}>
                {addRestaurantMutation.isPending ? "Adding Restaurant..." : "Add Restaurant"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Restaurant Modal */}
      <Dialog open={isManageRestaurantModalOpen} onOpenChange={setIsManageRestaurantModalOpen}>
        <SimpleDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Manage Restaurant: {selectedRestaurant?.name}
            </DialogTitle>
            <DialogDescription>
              Update restaurant details, operating hours, and delivery options
            </DialogDescription>
          </DialogHeader>
          {selectedRestaurant && (
            <EditRestaurantForm
              restaurant={selectedRestaurant}
              onSuccess={() => {
                toast({
                  title: "Restaurant Updated",
                  description: "Your restaurant has been updated successfully",
                });
                setIsManageRestaurantModalOpen(false);
                setSelectedRestaurant(null);
                queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/restaurants"] });
              }}
              onCancel={() => {
                setIsManageRestaurantModalOpen(false);
                setSelectedRestaurant(null);
              }}
            />
          )}
        </SimpleDialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Restaurant
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-amber-500 text-lg">⚠️</div>
                <div>
                  <h4 className="font-medium text-amber-800">Warning: This action cannot be undone</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Deleting this restaurant will permanently remove all associated data including:
                  </p>
                  <ul className="text-sm text-amber-700 mt-2 list-disc list-inside">
                    <li>Restaurant information and settings</li>
                    <li>All voucher packages</li>
                    <li>Menu items and pricing</li>
                    <li>Reservation history</li>
                    <li>Order history</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600">
              Are you absolutely sure you want to delete <strong>{selectedRestaurant?.name}</strong>?
            </p>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => deleteRestaurantMutation.mutate(selectedRestaurant?.id)}
                disabled={deleteRestaurantMutation.isPending}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleteRestaurantMutation.isPending ? "Deleting..." : "Yes, Delete Restaurant"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Edit Restaurant Modal */}
      {isEditRestaurantOpen && selectedRestaurant && (
        <Dialog open={isEditRestaurantOpen} onOpenChange={setIsEditRestaurantOpen}>
          <SimpleDialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Restaurant</DialogTitle>
              <DialogDescription>
                Update your restaurant details and operating hours
              </DialogDescription>
            </DialogHeader>
            <EditRestaurantForm 
              restaurant={selectedRestaurant}
              onSuccess={() => {
                setIsEditRestaurantOpen(false);
                setSelectedRestaurant(null);
                queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/restaurants"] });
                toast({
                  title: "Success",
                  description: "Restaurant updated successfully!",
                });
              }}
              onCancel={() => {
                setIsEditRestaurantOpen(false);
                setSelectedRestaurant(null);
              }}
            />
          </SimpleDialogContent>
        </Dialog>
      )}

      {/* Delete User Confirmation Modal */}
      <Dialog open={isDeleteUserModalOpen} onOpenChange={setIsDeleteUserModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {userToDelete && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {userToDelete.contactPersonName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium">{userToDelete.contactPersonName || 'No name'}</p>
                  <p className="text-sm text-gray-500">{userToDelete.email}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteUserModalOpen(false);
                setUserToDelete(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteUserMutation.mutate(userToDelete.id)}
              disabled={deleteUserMutation.isPending}
              className="flex-1"
            >
              {deleteUserMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </div>
              ) : (
                'Delete User'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Voucher Package Modal - Viewport Centered */}
      {isEditPackageModalOpen && (
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
              handleCancelPackageEdit();
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Voucher Package
              </h2>
              <button
                onClick={handleCancelPackageEdit}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {/* Status Information */}
              {selectedPackage?.isActive && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="text-amber-500">⚠️</div>
                    <div>
                      <h4 className="font-medium text-amber-800">Active Package - Limited Editing</h4>
                      <p className="text-sm text-amber-700">
                        This package is active and available for purchase. You can only extend the validity period to provide more value to customers. To make other changes, first deactivate the package.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="packageName">Package Name</Label>
                    <Input
                      id="packageName"
                      value={packageFormData.name}
                      onChange={(e) => handlePackageFormChange('name', e.target.value)}
                      placeholder="Enter package name"
                      disabled={selectedPackage?.isActive}
                    />
                    {selectedPackage?.isActive && (
                      <p className="text-xs text-gray-500 mt-1">Cannot edit while package is active</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="mealCount">Number of Meals</Label>
                    <Input
                      id="mealCount"
                      type="number"
                      min="1"
                      value={packageFormData.mealCount}
                      onChange={(e) => handlePackageFormChange('mealCount', e.target.value)}
                      placeholder="e.g., 10"
                      disabled={selectedPackage?.isActive}
                    />
                    {selectedPackage?.isActive && (
                      <p className="text-xs text-gray-500 mt-1">Cannot edit while package is active</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={packageFormData.description}
                    onChange={(e) => handlePackageFormChange('description', e.target.value)}
                    placeholder="Describe the voucher package"
                    rows={3}
                    disabled={selectedPackage?.isActive}
                  />
                  {selectedPackage?.isActive && (
                    <p className="text-xs text-gray-500 mt-1">Cannot edit while package is active</p>
                  )}
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pricePerMeal">Price per Meal (€)</Label>
                    <Input
                      id="pricePerMeal"
                      type="number"
                      step="0.01"
                      min="0"
                      value={packageFormData.pricePerMeal}
                      onChange={(e) => handlePackageFormChange('pricePerMeal', e.target.value)}
                      placeholder="e.g., 15.50"
                      disabled={selectedPackage?.isActive}
                    />
                    {selectedPackage?.isActive && (
                      <p className="text-xs text-gray-500 mt-1">Cannot edit while package is active</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="discountPercentage">Discount (%)</Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={packageFormData.discountPercentage}
                      onChange={(e) => handlePackageFormChange('discountPercentage', e.target.value)}
                      placeholder="e.g., 15"
                      disabled={selectedPackage?.isActive}
                    />
                    {selectedPackage?.isActive && (
                      <p className="text-xs text-gray-500 mt-1">Cannot edit while package is active</p>
                    )}
                  </div>
                </div>

                {/* Validity */}
                <div className="space-y-3">
                  <Label>Validity Period</Label>
                  {selectedPackage?.isActive && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                      <p className="text-sm text-green-700">
                        <strong>Extend validity only:</strong> For active packages, you can only increase the validity period to provide more value to customers.
                      </p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="months"
                        name="validityType"
                        checked={packageFormData.validityType === 'months'}
                        onChange={() => handlePackageFormChange('validityType', 'months')}
                        className="h-4 w-4 text-primary"
                        disabled={selectedPackage?.isActive}
                      />
                      <Label htmlFor="months">Duration in months</Label>
                    </div>
                    {packageFormData.validityType === 'months' && (
                      <div>
                        <Input
                          type="number"
                          min={selectedPackage?.isActive ? parseInt(selectedPackage.validityMonths || '1') : "1"}
                          max="24"
                          value={packageFormData.validityMonths}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value);
                            const currentValue = parseInt(selectedPackage?.validityMonths || '0');
                            
                            if (selectedPackage?.isActive && newValue < currentValue) {
                              // Prevent reducing validity for active packages
                              return;
                            }
                            handlePackageFormChange('validityMonths', e.target.value);
                          }}
                          placeholder="e.g., 6"
                          className="w-32"
                        />
                        {selectedPackage?.isActive && (
                          <p className="text-xs text-green-600 mt-1">
                            Current: {selectedPackage.validityMonths} months (can only increase)
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="custom_dates"
                        name="validityType"
                        checked={packageFormData.validityType === 'custom_dates'}
                        onChange={() => handlePackageFormChange('validityType', 'custom_dates')}
                        className="h-4 w-4 text-primary"
                        disabled={selectedPackage?.isActive}
                      />
                      <Label htmlFor="custom_dates">Custom date range</Label>
                    </div>
                    {packageFormData.validityType === 'custom_dates' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="validityStartDate">Start Date</Label>
                          <Input
                            id="validityStartDate"
                            type="date"
                            value={packageFormData.validityStartDate}
                            onChange={(e) => handlePackageFormChange('validityStartDate', e.target.value)}
                            disabled={selectedPackage?.isActive}
                          />
                          {selectedPackage?.isActive && (
                            <p className="text-xs text-gray-500 mt-1">Cannot edit while package is active</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="validityEndDate">End Date</Label>
                          <Input
                            id="validityEndDate"
                            type="date"
                            value={packageFormData.validityEndDate}
                            onChange={(e) => {
                              const newDate = new Date(e.target.value);
                              const currentEndDate = new Date(selectedPackage?.validityEndDate || '');
                              
                              if (selectedPackage?.isActive && newDate < currentEndDate) {
                                // Prevent reducing end date for active packages
                                return;
                              }
                              handlePackageFormChange('validityEndDate', e.target.value);
                            }}
                            min={selectedPackage?.isActive ? selectedPackage.validityEndDate : undefined}
                          />
                          {selectedPackage?.isActive && (
                            <p className="text-xs text-green-600 mt-1">
                              Current end: {new Date(selectedPackage.validityEndDate).toLocaleDateString()} (can only extend)
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={packageFormData.isActive}
                      onChange={(e) => handlePackageFormChange('isActive', e.target.checked)}
                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Package is active</label>
                  </div>
                  {selectedPackage?.isActive && !packageFormData.isActive && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        <strong>Warning:</strong> Deactivating this package will stop new sales but won't affect existing purchased vouchers.
                      </p>
                    </div>
                  )}
                  {!selectedPackage?.isActive && packageFormData.isActive && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Note:</strong> Activating this package will make it available for purchase by customers.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCancelPackageEdit}
                    disabled={updatePackageMutation.isPending}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePackage}
                    disabled={updatePackageMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updatePackageMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </div>
                    ) : selectedPackage?.isActive ? (
                      'Save Validity Extension'
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
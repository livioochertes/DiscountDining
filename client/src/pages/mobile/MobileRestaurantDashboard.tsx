import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Store, QrCode, Users, LogOut, ChevronRight, Plus,
  TrendingUp, BadgePercent, Scan, X, Check, UserPlus, Camera,
  CreditCard, UtensilsCrossed, Calendar, ClipboardList, Wallet,
  Send, Printer, ToggleLeft, ToggleRight, Edit2, Loader2,
  Clock, CheckCircle, XCircle, AlertCircle, Phone, Mail, MapPin,
  RefreshCw, DollarSign, Lock, ArrowLeft, Download, FileText,
  Star, Shield, Receipt, Delete
} from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

const API_BASE_URL = import.meta.env.VITE_API_URL || (Capacitor.isNativePlatform() ? 'https://eatoff.app' : '');

type DashboardTab = 'home' | 'payments' | 'menu' | 'reservations' | 'orders';

interface RestaurantSession {
  token: string;
  owner: any;
  restaurant: any;
}

export default function MobileRestaurantDashboard() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<RestaurantSession | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');

  const [showScanner, setShowScanner] = useState(false);
  const [manualCustomerId, setManualCustomerId] = useState('');
  const [scannedCustomer, setScannedCustomer] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [paymentCode, setPaymentCode] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [paymentActionResult, setPaymentActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [customerCode, setCustomerCode] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestResult, setRequestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [editingMenuItem, setEditingMenuItem] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');

  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('all');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [reservationFilter, setReservationFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  type PosStep = 'input' | 'scanning' | 'client-preview' | 'processing' | 'waiting-approval' | 'success' | 'history' | 'settlement';
  const [posStep, setPosStep] = useState<PosStep>('input');
  const [posAmount, setPosAmount] = useState('0');
  const [posCustomerPreview, setPosCustomerPreview] = useState<any>(null);
  const [posConfirmResult, setPosConfirmResult] = useState<any>(null);
  const [posError, setPosError] = useState<string | null>(null);
  const [posRequestId, setPosRequestId] = useState<number | null>(null);
  const [posWaitingElapsed, setPosWaitingElapsed] = useState(0);
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyFilter, setHistoryFilter] = useState<'today' | 'week' | 'month'>('today');
  const [posManualCode, setPosManualCode] = useState('');

  const parseQRValue = (scannedValue: string): { customerCode?: string; customerId?: string; error?: string } | null => {
    if (!scannedValue) return null;
    if (/^EATOFF_SESSION:/i.test(scannedValue)) {
      return { error: 'Acesta este un cod de restaurant, nu de client. Scanează codul QR al clientului.' };
    }
    const payMatch = scannedValue.match(/^PAY:(\d+):/i);
    if (payMatch) {
      return { customerId: payMatch[1] };
    }
    const eatoffPrefixMatch = scannedValue.match(/^EATOFF:(.+)$/i);
    if (eatoffPrefixMatch) {
      return { customerCode: eatoffPrefixMatch[1] };
    }
    const urlMatch = scannedValue.match(/eatoff:\/\/customer\/(\d+)/);
    if (urlMatch) {
      return { customerId: urlMatch[1] };
    }
    if (/^EO[A-Z0-9]{6,10}$/i.test(scannedValue)) {
      return { customerCode: scannedValue };
    }
    if (/^\d+$/.test(scannedValue)) {
      return { customerId: scannedValue };
    }
    return { error: 'Cod QR nerecunoscut. Asigură-te că scanezi codul QR al clientului.' };
  };

  const startQRScanner = async (onScan?: (value: string) => void) => {
    if (!Capacitor.isNativePlatform()) {
      setScanError('Scanarea QR este disponibilă doar în aplicația mobilă. Folosește introducerea manuală.');
      return;
    }
    try {
      const { camera } = await BarcodeScanner.checkPermissions();
      if (camera !== 'granted') {
        const permission = await BarcodeScanner.requestPermissions();
        if (permission.camera !== 'granted') {
          setScanError('Permisiunea pentru cameră este necesară pentru scanare');
          return;
        }
      }
      setIsScanning(true);
      setScanError(null);
      const { barcodes } = await BarcodeScanner.scan();
      setIsScanning(false);
      if (barcodes.length > 0) {
        const scannedValue = barcodes[0].rawValue;
        if (onScan && scannedValue) {
          onScan(scannedValue);
        } else {
          const parsed = parseQRValue(scannedValue || '');
          if (parsed) {
            setManualCustomerId(parsed.customerCode || parsed.customerId || '');
            setShowScanner(true);
            scanEnrollMutation.mutate(parsed);
          } else {
            setShowScanner(true);
            setScanError('Cod QR invalid. Scanează codul din profilul clientului.');
          }
        }
      } else {
        if (onScan) {
          setPosStep('input');
        } else {
          setShowScanner(false);
        }
      }
    } catch (error: any) {
      setIsScanning(false);
      const isCancelled = error?.message?.toLowerCase()?.includes('cancel') || error?.code === 'USER_CANCELED';
      if (onScan) {
        setPosStep('input');
      } else if (isCancelled) {
        setShowScanner(false);
      } else {
        setShowScanner(true);
        setScanError(error.message || 'Eroare la scanare');
      }
    }
  };


  useEffect(() => {
    const storedSession = localStorage.getItem('restaurantSession');
    if (storedSession) {
      setSession(JSON.parse(storedSession));
    } else {
      setLocation('/m/restaurant/signin');
    }
  }, []);

  const restaurantId = session?.restaurant?.id;

  const { data: cashbackGroups = [] } = useQuery<any[]>({
    queryKey: ['/api/restaurant', restaurantId, 'cashback-groups'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/restaurant/${restaurantId}/cashback-groups`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch cashback groups');
      return response.json();
    },
    enabled: !!restaurantId,
  });

  const { data: loyaltyGroups = [] } = useQuery<any[]>({
    queryKey: ['/api/restaurant', restaurantId, 'loyalty-groups'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/restaurant/${restaurantId}/loyalty-groups`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch loyalty groups');
      return response.json();
    },
    enabled: !!restaurantId,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ['/api/wallet/restaurant', restaurantId, 'transactions'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/wallet/restaurant/${restaurantId}/transactions`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!restaurantId && activeTab === 'payments',
  });

  const { data: menuItems = [], isLoading: menuLoading } = useQuery<any[]>({
    queryKey: ['/api/restaurant-portal/menu-items', restaurantId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/restaurant-portal/menu-items?restaurantId=${restaurantId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch menu items');
      return response.json();
    },
    enabled: !!restaurantId && activeTab === 'menu',
  });

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<any[]>({
    queryKey: ['/api/restaurant-portal/reservations', restaurantId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/restaurant-portal/reservations?restaurantId=${restaurantId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch reservations');
      return response.json();
    },
    enabled: !!restaurantId && (activeTab === 'reservations' || activeTab === 'home'),
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ['/api/restaurant-portal/orders', restaurantId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/restaurant-portal/orders?restaurantId=${restaurantId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: !!restaurantId && (activeTab === 'orders' || activeTab === 'home'),
  });

  const { data: enrolledCustomers = [], isLoading: enrolledCustomersLoading } = useQuery<any[]>({
    queryKey: ['/api/restaurant', restaurantId, 'enrolled-customers', { limit: 3 }],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/restaurant/${restaurantId}/enrolled-customers?limit=3`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch enrolled customers');
      return response.json();
    },
    enabled: !!restaurantId && activeTab === 'home',
  });

  const [noGroupsError, setNoGroupsError] = useState(false);

  const scanEnrollMutation = useMutation({
    mutationFn: async (params: { customerCode?: string; customerId?: string }) => {
      const storedSession = localStorage.getItem('restaurantSession');
      const currentSession = storedSession ? JSON.parse(storedSession) : session;
      const currentRestaurantId = currentSession?.restaurant?.id;
      if (!currentRestaurantId) {
        throw new Error('Sesiunea restaurantului nu este disponibilă. Te rog să te autentifici din nou.');
      }
      const response = await fetch(`${API_BASE_URL}/api/restaurant/${currentRestaurantId}/scan-enroll`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          restaurantId: currentRestaurantId,
          enrolledByUserId: currentSession?.owner?.id,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.noGroups) {
          setNoGroupsError(true);
        }
        throw new Error(data.message || 'Enrollment failed');
      }
      return data;
    },
    onSuccess: (data) => {
      setScannedCustomer(data);
      setNoGroupsError(false);
    },
    onError: () => {},
  });

  const fetchPaymentMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/wallet/payment/${transactionId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Tranzacția nu a fost găsită');
      return response.json();
    },
    onSuccess: (data) => {
      setPaymentDetails(data);
      setPaymentActionResult(null);
    },
    onError: () => {
      setPaymentDetails(null);
      setPaymentActionResult({ type: 'error', message: 'Tranzacția nu a fost găsită sau codul este invalid.' });
    },
  });

  const acceptPaymentMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/wallet/payment/${transactionId}/accept`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId }),
      });
      if (!response.ok) throw new Error('Eroare la acceptarea plății');
      return response.json();
    },
    onSuccess: () => {
      setPaymentActionResult({ type: 'success', message: 'Plata a fost acceptată cu succes!' });
      setPaymentDetails(null);
      setPaymentCode('');
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/restaurant', restaurantId, 'transactions'] });
    },
    onError: (error: Error) => {
      setPaymentActionResult({ type: 'error', message: error.message });
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/wallet/payment/${transactionId}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Eroare la respingerea plății');
      return response.json();
    },
    onSuccess: () => {
      setPaymentActionResult({ type: 'success', message: 'Plata a fost respinsă.' });
      setPaymentDetails(null);
      setPaymentCode('');
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/restaurant', restaurantId, 'transactions'] });
    },
    onError: (error: Error) => {
      setPaymentActionResult({ type: 'error', message: error.message });
    },
  });

  const sendPaymentRequestMutation = useMutation({
    mutationFn: async (data: { customerCode: string; amount: number; restaurantId: number }) => {
      const response = await fetch(`${API_BASE_URL}/api/wallet/restaurant-payment-request`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Eroare la trimiterea solicitării');
      }
      return response.json();
    },
    onSuccess: () => {
      setRequestResult({ type: 'success', message: 'Solicitarea de plată a fost trimisă cu succes!' });
      setCustomerCode('');
      setRequestAmount('');
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/restaurant', restaurantId, 'transactions'] });
    },
    onError: (error: Error) => {
      setRequestResult({ type: 'error', message: error.message });
    },
  });

  const toggleMenuItemMutation = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: number; isAvailable: boolean }) => {
      const response = await fetch(`${API_BASE_URL}/api/restaurant-portal/menu-items/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable }),
      });
      if (!response.ok) throw new Error('Failed to update');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant-portal/menu-items', restaurantId] });
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: async ({ id, price }: { id: number; price: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/restaurant-portal/menu-items/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price }),
      });
      if (!response.ok) throw new Error('Failed to update price');
      return response.json();
    },
    onSuccess: () => {
      setEditingMenuItem(null);
      setEditPrice('');
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant-portal/menu-items', restaurantId] });
    },
  });

  const addMenuItemMutation = useMutation({
    mutationFn: async (data: { name: string; price: string; category?: string; description?: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/restaurant-portal/restaurants/${restaurantId}/menu`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Eroare la adăugare');
      }
      return response.json();
    },
    onSuccess: () => {
      setShowAddMenuItem(false);
      setNewItemName('');
      setNewItemPrice('');
      setNewItemCategory('');
      setNewItemDescription('');
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant-portal/menu-items', restaurantId] });
    },
  });

  const confirmReservationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_BASE_URL}/api/restaurant-portal/reservations/${id}/confirm`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to confirm');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant-portal/reservations', restaurantId] });
    },
  });

  const cancelReservationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_BASE_URL}/api/restaurant-portal/reservations/${id}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to cancel');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant-portal/reservations', restaurantId] });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/restaurant-portal/orders/${id}/status`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant-portal/orders', restaurantId] });
    },
  });


  const handleCollectPaymentForOrder = (order: any) => {
    setActiveTab('payments');
    setCustomerCode('');
    setRequestAmount(parseFloat(order.totalAmount || order.total || '0').toFixed(2));
  };

  const handleLogout = () => {
    localStorage.removeItem('restaurantSession');
    setLocation('/m/restaurant/signin');
  };

  const handleLookupCustomer = () => {
    if (manualCustomerId) {
      setNoGroupsError(false);
      const parsed = parseQRValue(manualCustomerId);
      if (parsed) {
        scanEnrollMutation.mutate(parsed);
      } else {
        scanEnrollMutation.mutate({ customerCode: manualCustomerId });
      }
    }
  };

  const handleLookupPayment = () => {
    if (!paymentCode.trim()) return;
    const match = paymentCode.match(/EATOFF_PAY:(\S+)/);
    const txId = match ? match[1] : paymentCode.trim();
    fetchPaymentMutation.mutate(txId);
  };

  const handleSendPaymentRequest = () => {
    if (!customerCode.trim() || !requestAmount.trim() || !restaurantId) return;
    const amount = parseFloat(requestAmount);
    if (isNaN(amount) || amount <= 0) {
      setRequestResult({ type: 'error', message: 'Suma trebuie să fie un număr pozitiv.' });
      return;
    }
    sendPaymentRequestMutation.mutate({ customerCode: customerCode.trim(), amount, restaurantId });
  };

  const posPreviewMutation = useMutation({
    mutationFn: async (data: { customerCode: string; amount: number }) => {
      const response = await fetch(`${API_BASE_URL}/api/wallet/pos-payment-preview`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, customerCode: data.customerCode, amount: data.amount }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Eroare la identificarea clientului');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPosCustomerPreview(data);
      setPosStep('client-preview');
      setPosError(null);
    },
    onError: (err: Error) => {
      setPosError(err.message);
      setPosStep('input');
    },
  });

  const posConfirmMutation = useMutation({
    mutationFn: async (data: { customerId: number; amount: number }) => {
      const response = await fetch(`${API_BASE_URL}/api/wallet/pos-payment-confirm`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, ...data }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Eroare la trimiterea cererii');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPosRequestId(data.requestId);
      setPosStep('waiting-approval');
      setPosWaitingElapsed(0);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    },
    onError: (err: Error) => {
      setPosError(err.message);
      setPosStep('client-preview');
    },
  });

  const posAmountNum = parseFloat(posAmount) || 0;

  const handlePosKeyPress = (key: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
    setPosAmount(prev => {
      if (key === 'C') return '0';
      if (key === '⌫') return prev.length <= 1 ? '0' : prev.slice(0, -1);
      if (key === '.') return prev.includes('.') ? prev : prev + '.';
      if (prev === '0' && key !== '.') return key;
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
      return prev + key;
    });
  };

  const handlePosQuickAdd = (val: number) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
    setPosAmount(prev => {
      const current = parseFloat(prev) || 0;
      return (current + val).toFixed(2);
    });
  };

  const handlePosCollect = () => {
    if (posAmountNum <= 0) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
    setPosStep('scanning');
    startQRScanner((scannedValue) => {
      const parsed = parseQRValue(scannedValue);
      if (!parsed || parsed.error) {
        setPosError(parsed?.error || 'Cod QR invalid');
        setPosStep('input');
        return;
      }
      const code = parsed.customerCode || parsed.customerId || scannedValue;
      posPreviewMutation.mutate({ customerCode: code, amount: posAmountNum });
    });
  };

  const handlePosConfirm = () => {
    if (!posCustomerPreview) return;
    setPosStep('processing');
    posConfirmMutation.mutate({
      customerId: posCustomerPreview.customerId,
      amount: posAmountNum,
    });
  };

  const handlePosReset = () => {
    setPosStep('input');
    setPosAmount('0');
    setPosCustomerPreview(null);
    setPosConfirmResult(null);
    setPosError(null);
    setPosManualCode('');
    setPosRequestId(null);
    setPosWaitingElapsed(0);
  };

  const handlePosCancelRequest = async () => {
    if (!posRequestId) return;
    try {
      await fetch(`${API_BASE_URL}/api/wallet/pos-payment-request/${posRequestId}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {}
    handlePosReset();
  };

  useEffect(() => {
    if (posStep === 'success') {
      const timer = setTimeout(handlePosReset, 5000);
      return () => clearTimeout(timer);
    }
  }, [posStep]);

  useEffect(() => {
    if (posStep !== 'waiting-approval' || !posRequestId) return;
    const interval = setInterval(async () => {
      try {
        setPosWaitingElapsed(prev => prev + 3);
        const response = await fetch(`${API_BASE_URL}/api/wallet/pos-payment-request/${posRequestId}/status`, { credentials: 'include' });
        if (!response.ok) return;
        const data = await response.json();
        if (data.status === 'completed') {
          setPosConfirmResult(data);
          setPosStep('success');
          queryClient.invalidateQueries({ queryKey: ['/api/wallet/restaurant', restaurantId, 'transactions'] });
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]);
          clearInterval(interval);
        } else if (data.status === 'declined') {
          setPosError('Clientul a refuzat plata');
          setPosStep('input');
          clearInterval(interval);
        } else if (data.status === 'expired' || data.status === 'cancelled') {
          setPosError('Cererea de plată a expirat');
          setPosStep('input');
          clearInterval(interval);
        }
      } catch (e) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [posStep, posRequestId]);

  const { data: settlementReport, isLoading: settlementLoading } = useQuery<any>({
    queryKey: ['/api/wallet/pos-settlement-report', restaurantId, settlementDate],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/wallet/pos-settlement-report/${restaurantId}?date=${settlementDate}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          return { date: settlementDate, totalSales: 0, transactionCount: 0, totalTips: 0, totalCommission: 0, totalNet: 0, averageTransaction: 0, paymentMethodBreakdown: {}, hourlyDistribution: {}, transactions: [] };
        }
        return response.json();
      } catch (e) {
        return { date: settlementDate, totalSales: 0, transactionCount: 0, totalTips: 0, totalCommission: 0, totalNet: 0, averageTransaction: 0, paymentMethodBreakdown: {}, hourlyDistribution: {}, transactions: [] };
      }
    },
    enabled: !!restaurantId && posStep === 'settlement',
  });

  const handlePrintOrder = (order: any) => {
    const printContent = `
      <html><head><title>Comandă #${order.orderNumber || order.id}</title>
      <style>body{font-family:sans-serif;padding:20px}h1{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:10px}td,th{border:1px solid #ccc;padding:8px;text-align:left}</style></head>
      <body><h1>Comandă #${order.orderNumber || order.id}</h1>
      <p>Status: ${order.status}</p>
      <p>Total: ${order.total || order.totalAmount} RON</p>
      ${order.items ? `<table><tr><th>Produs</th><th>Cant.</th><th>Preț</th></tr>${order.items.map((i: any) => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.price} RON</td></tr>`).join('')}</table>` : ''}
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(printContent); w.document.close(); w.print(); }
  };

  if (!session) {
    return (
      <MobileLayout hideNavigation>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }


  const todayTransactions = transactions.filter((tx: any) => {
    const d = new Date(tx.createdAt || tx.processedAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const todayRevenue = todayTransactions.reduce((sum: number, tx: any) => sum + parseFloat(tx.amount || tx.restaurantReceives || '0'), 0);
  const pendingPayments = transactions.filter((tx: any) => tx.transactionStatus === 'pending' || tx.status === 'pending').length;
  const activeReservations = reservations.filter((r: any) => r.status === 'confirmed' || r.status === 'pending').length;

  const tabs = [
    { id: 'home' as const, label: 'Acasă', icon: Store },
    { id: 'payments' as const, label: 'Plăți', icon: Wallet },
    { id: 'menu' as const, label: 'Meniu', icon: UtensilsCrossed },
    { id: 'reservations' as const, label: 'Rezervări', icon: Calendar },
    { id: 'orders' as const, label: 'Comenzi', icon: ClipboardList },
  ];

  return (
    <MobileLayout hideNavigation>
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">{session.restaurant?.name || 'Restaurant'}</h1>
              <p className="text-xs text-gray-500">{session.owner?.contactPersonName}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {activeTab === 'home' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-500">Tranzacții azi</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{todayTransactions.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-500">Venituri azi</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{todayRevenue.toFixed(2)} RON</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-xs text-gray-500">Plăți în așteptare</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{pendingPayments}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-xs text-gray-500">Rezervări active</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{activeReservations}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('payments')}
                  className="flex-1 bg-primary text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  <DollarSign className="w-5 h-5" />
                  Plăți
                </button>
                <button
                  onClick={() => {
                    if (Capacitor.isNativePlatform()) {
                      startQRScanner();
                    } else {
                      setShowScanner(true);
                    }
                  }}
                  className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  Înrolează Client
                </button>
              </div>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-amber-600" />
                    Comenzi noi
                  </h2>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-primary text-sm font-medium flex items-center gap-1"
                  >
                    Vezi toate <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : (() => {
                  const recentOrders = orders
                    .filter((o: any) => o.status === 'pending' || o.status === 'preparing')
                    .slice(0, 3);
                  return recentOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
                      <p className="text-gray-500 text-sm">Nicio comandă nouă</p>
                    </div>
                  ) : (
                    recentOrders.map((order: any) => {
                      const status = order.status || 'pending';
                      const statusColor = status === 'preparing' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';
                      const statusLabel = status === 'preparing' ? 'Se pregătește' : 'Nouă';
                      return (
                        <button
                          key={order.id}
                          onClick={() => setActiveTab('orders')}
                          className="w-full bg-white rounded-2xl p-3 border border-gray-100 flex items-center justify-between text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 text-sm">#{order.orderNumber || order.id}</p>
                              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", statusColor)}>{statusLabel}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{order.customerName || `Client #${order.customerId}`}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-bold text-gray-900 text-sm">{parseFloat(order.total || order.totalAmount || '0').toFixed(2)} RON</p>
                              <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                          </div>
                        </button>
                      );
                    })
                  );
                })()}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    Rezervări noi
                  </h2>
                  <button
                    onClick={() => setActiveTab('reservations')}
                    className="text-primary text-sm font-medium flex items-center gap-1"
                  >
                    Vezi toate <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {reservationsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : (() => {
                  const pendingReservations = reservations
                    .filter((r: any) => r.status === 'pending')
                    .slice(0, 3);
                  return pendingReservations.length === 0 ? (
                    <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
                      <p className="text-gray-500 text-sm">Nicio rezervare nouă</p>
                    </div>
                  ) : (
                    pendingReservations.map((res: any) => (
                      <button
                        key={res.id}
                        onClick={() => setActiveTab('reservations')}
                        className="w-full bg-white rounded-2xl p-3 border border-gray-100 flex items-center justify-between text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{res.customerName || res.guestName || `Client #${res.customerId}`}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {res.reservationDate ? new Date(res.reservationDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }) : ''}{' '}
                            {res.reservationTime || ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Users className="w-3.5 h-3.5" />
                              <span className="text-sm font-medium">{res.partySize || res.guestCount || res.numberOfGuests || '?'}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">În așteptare</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      </button>
                    ))
                  );
                })()}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-green-600" />
                    Clienți noi înrolați
                  </h2>
                  <button
                    onClick={() => {
                      if (Capacitor.isNativePlatform()) {
                        startQRScanner();
                      } else {
                        setShowScanner(true);
                      }
                    }}
                    className="text-primary text-sm font-medium flex items-center gap-1"
                  >
                    Înrolează <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {enrolledCustomersLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : enrolledCustomers.length === 0 ? (
                  <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
                    <p className="text-gray-500 text-sm">Niciun client înrolat</p>
                  </div>
                ) : (
                  enrolledCustomers.slice(0, 3).map((customer: any, idx: number) => {
                    const enrolledDate = customer.enrolledAt ? new Date(customer.enrolledAt) : null;
                    const isRecent = enrolledDate && (Date.now() - enrolledDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
                    const groupLabel = customer.groupType === 'cashback'
                      ? `${customer.groupName || 'Cashback'} (${parseFloat(customer.cashbackPercentage || '0').toFixed(0)}%)`
                      : customer.groupType === 'loyalty'
                      ? `${customer.groupName || 'Fidelizare'} (${parseFloat(customer.discountPercentage || '0').toFixed(0)}% discount)`
                      : customer.groupName || 'Fidelizare';
                    return (
                      <div
                        key={`${customer.groupType}-${customer.customerId}-${idx}`}
                        className="bg-white rounded-2xl p-3 border border-gray-100 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{customer.customerName}</p>
                            <p className="text-xs text-gray-500 truncate">{groupLabel}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                            isRecent ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          )}>
                            {isRecent ? 'Nou înrolat' : 'Deja înrolat'}
                          </span>
                          {enrolledDate && (
                            <p className="text-[10px] text-gray-400 mt-0.5">{enrolledDate.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </section>
            </>
          )}

          {activeTab === 'payments' && (
            <>
              {posStep === 'waiting-approval' && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-indigo-600 px-6">
                  <div className="animate-[scale-in_0.4s_ease-out] text-center">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                      <Clock className="w-14 h-14 text-white" />
                    </div>
                    <p className="text-white text-2xl font-bold mb-2">Așteptăm aprobarea clientului</p>
                    {posCustomerPreview && (
                      <p className="text-white/80 text-lg mb-2">{posCustomerPreview.customerName}</p>
                    )}
                    <p className="text-white/90 text-3xl font-bold mb-4">
                      {posAmountNum.toFixed(2)} RON
                    </p>
                    <p className="text-white/60 text-sm mb-2">
                      Clientul poate adăuga tips înainte de aprobare
                    </p>
                    <p className="text-white/50 text-xs mb-6">
                      Timp scurs: {posWaitingElapsed}s / 120s
                    </p>
                    <div className="w-48 h-2 bg-white/20 rounded-full mx-auto mb-6 overflow-hidden">
                      <div
                        className="h-full bg-white/60 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (posWaitingElapsed / 120) * 100)}%` }}
                      />
                    </div>
                    <button
                      onClick={handlePosCancelRequest}
                      className="bg-white/20 text-white px-8 py-3 rounded-2xl font-semibold text-base border border-white/30"
                    >
                      Anulează cererea
                    </button>
                  </div>
                </div>
              )}

              {posStep === 'success' && posConfirmResult && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-emerald-500 to-green-600 px-6">
                  <div className="animate-[scale-in_0.4s_ease-out] text-center">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-14 h-14 text-white" />
                    </div>
                    <p className="text-white text-3xl font-bold mb-2">Plată aprobată</p>
                    <p className="text-white/90 text-4xl font-bold mb-4">
                      {posConfirmResult.amountPaid?.toFixed(2)} RON
                    </p>
                    {posConfirmResult.tipAmount > 0 && (
                      <p className="text-white/80 text-sm mb-1">Tip: +{posConfirmResult.tipAmount?.toFixed(2)} RON</p>
                    )}
                    {posConfirmResult.cashbackEarned > 0 && (
                      <p className="text-white/80 text-sm mb-4">
                        Cashback acordat: {posConfirmResult.cashbackEarned?.toFixed(2)} RON
                      </p>
                    )}
                    <p className="text-white/50 text-xs mb-6">ID: #{posConfirmResult.requestId || posConfirmResult.transactionId}</p>
                    <button
                      onClick={handlePosReset}
                      className="bg-white text-green-700 px-8 py-3 rounded-2xl font-semibold text-lg"
                    >
                      Tranzacție nouă
                    </button>
                    <div className="mt-4 w-32 h-1 bg-white/30 rounded-full mx-auto overflow-hidden">
                      <div className="h-full bg-white rounded-full animate-[shrink_5s_linear]" />
                    </div>
                  </div>
                </div>
              )}

              {posStep === 'client-preview' && posCustomerPreview && (
                <div className="space-y-4 -mx-4 -mt-2 px-4 pt-2">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setPosStep('input')} className="flex items-center gap-1 text-gray-600">
                      <ArrowLeft className="w-5 h-5" /> Înapoi
                    </button>
                    <span className="text-sm text-gray-500 font-medium">Detalii Client</span>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="p-4 flex items-center gap-3 border-b border-gray-50">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                        style={{ backgroundColor: posCustomerPreview.loyaltyColor }}>
                        {posCustomerPreview.customerName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg">{posCustomerPreview.customerName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: posCustomerPreview.loyaltyColor }}>
                            {posCustomerPreview.loyaltyTier}
                          </span>
                          <span className="text-xs text-gray-500">
                            Membru din {posCustomerPreview.memberSince ? new Date(posCustomerPreview.memberSince).getFullYear() : '?'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-semibold">{posCustomerPreview.amount?.toFixed(2)} RON</span>
                      </div>
                      {posCustomerPreview.discountPercent > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Discount (-{posCustomerPreview.discountPercent}%)</span>
                          <span className="text-green-600 font-semibold">-{posCustomerPreview.discountAmount?.toFixed(2)} RON</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>Tip</span>
                        <span className="font-medium">Clientul adaugă de pe telefon</span>
                      </div>
                      <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-2">
                        <span>De plată</span>
                        <span>{posCustomerPreview.amountAfterDiscount?.toFixed(2)} RON</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-emerald-600">Cashback (+{posCustomerPreview.cashbackPercent}%)</span>
                        <span className="text-emerald-600 font-semibold">+{posCustomerPreview.cashbackAmount?.toFixed(2)} RON</span>
                      </div>
                    </div>

                    <div className="px-4 pb-3">
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Sold portofel</span>
                          <span className="font-medium">{posCustomerPreview.walletBalance?.toFixed(2)} RON</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Cashback disponibil</span>
                          <span className="font-medium">{posCustomerPreview.cashbackBalance?.toFixed(2)} RON</span>
                        </div>
                        {!posCustomerPreview.hasSufficientFunds && (
                          <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Fonduri insuficiente - clientul trebuie să facă top-up
                          </div>
                        )}
                      </div>
                    </div>

                    {posCustomerPreview.nextTierName && (
                      <div className="px-4 pb-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>{posCustomerPreview.loyaltyProgress}% către {posCustomerPreview.nextTierName}</span>
                          <span>-{posCustomerPreview.spendingToNextTier?.toFixed(0)} RON</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width: `${posCustomerPreview.loyaltyProgress}%`,
                              backgroundColor: posCustomerPreview.loyaltyColor,
                            }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {posError && (
                    <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> {posError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handlePosConfirm}
                      disabled={posConfirmMutation.isPending}
                      className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:bg-green-700 disabled:opacity-50"
                    >
                      {posConfirmMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Trimite cererea</>}
                    </button>
                    <button
                      onClick={() => { setPosStep('input'); setPosCustomerPreview(null); }}
                      className="px-6 py-4 rounded-2xl font-semibold text-red-600 border-2 border-red-200 bg-red-50 active:bg-red-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {posStep === 'scanning' && (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                    <Camera className="w-10 h-10 text-primary" />
                  </div>
                  <p className="text-gray-700 font-semibold text-lg">Scanează codul clientului</p>
                  <p className="text-gray-400 text-sm">Se deschide camera...</p>
                  {!Capacitor.isNativePlatform() && (
                    <div className="w-full space-y-3 mt-4">
                      <p className="text-amber-600 text-sm text-center">Scanare QR disponibilă doar pe mobil. Introdu codul manual:</p>
                      <input
                        type="text"
                        value={posManualCode}
                        onChange={(e) => setPosManualCode(e.target.value)}
                        placeholder="Cod client (ex: EO123ABC sau CLI-ABC123)"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && posManualCode.trim()) {
                            posPreviewMutation.mutate({ customerCode: posManualCode.trim(), amount: posAmountNum });
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (posManualCode.trim()) posPreviewMutation.mutate({ customerCode: posManualCode.trim(), amount: posAmountNum });
                        }}
                        disabled={!posManualCode.trim() || posPreviewMutation.isPending}
                        className="w-full bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {posPreviewMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Caută Client'}
                      </button>
                    </div>
                  )}
                  <button onClick={() => setPosStep('input')} className="text-gray-400 text-sm mt-2">Anulează</button>
                </div>
              )}

              {posStep === 'history' && (
                <div className="space-y-4 -mx-4 -mt-2 px-4 pt-2">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setPosStep('input')} className="flex items-center gap-1 text-gray-600">
                      <ArrowLeft className="w-5 h-5" /> POS
                    </button>
                    <span className="font-semibold text-gray-900">Istoric Tranzacții</span>
                    <div className="w-10" />
                  </div>

                  <div className="flex gap-2">
                    {(['today', 'week', 'month'] as const).map(f => (
                      <button key={f} onClick={() => setHistoryFilter(f)}
                        className={cn("flex-1 py-2 rounded-xl text-sm font-medium", historyFilter === f ? "bg-primary text-white" : "bg-gray-100 text-gray-600")}>
                        {f === 'today' ? 'Azi' : f === 'week' ? 'Săptămâna' : 'Luna'}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const now = new Date();
                    const filtered = transactions.filter((tx: any) => {
                      const d = new Date(tx.createdAt || tx.processedAt);
                      if (historyFilter === 'today') return d.toDateString() === now.toDateString();
                      if (historyFilter === 'week') return (now.getTime() - d.getTime()) < 7 * 86400000;
                      return (now.getTime() - d.getTime()) < 30 * 86400000;
                    });
                    const totalFiltered = filtered.reduce((s: number, t: any) => s + parseFloat(t.amount || '0'), 0);
                    const totalTips = filtered.reduce((s: number, t: any) => s + parseFloat(t.tipAmount || '0'), 0);
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-xl p-3 border border-gray-100">
                            <p className="text-xs text-gray-500">Total încasat</p>
                            <p className="font-bold text-lg text-gray-900">{totalFiltered.toFixed(2)} RON</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-gray-100">
                            <p className="text-xs text-gray-500">Nr. tranzacții</p>
                            <p className="font-bold text-lg text-gray-900">{filtered.length}</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-gray-100">
                            <p className="text-xs text-gray-500">Total tips</p>
                            <p className="font-bold text-lg text-gray-900">{totalTips.toFixed(2)} RON</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-gray-100">
                            <p className="text-xs text-gray-500">Media/tranzacție</p>
                            <p className="font-bold text-lg text-gray-900">{filtered.length > 0 ? (totalFiltered / filtered.length).toFixed(2) : '0.00'} RON</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {filtered.length === 0 ? (
                            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                              <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-500">Nicio tranzacție în această perioadă</p>
                            </div>
                          ) : filtered.map((tx: any) => {
                            const st = tx.transactionStatus || 'pending';
                            return (
                              <div key={tx.id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate">{tx.customerName || `Client #${tx.customerId}`}</p>
                                  <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", st === 'completed' ? 'bg-green-500' : st === 'rejected' ? 'bg-red-500' : 'bg-amber-500')} />
                                  <span className="font-bold text-gray-900 text-sm">{parseFloat(tx.amount || '0').toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {posStep === 'settlement' && (
                <div className="space-y-4 -mx-4 -mt-2 px-4 pt-2">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setPosStep('input')} className="flex items-center gap-1 text-gray-600">
                      <ArrowLeft className="w-5 h-5" /> POS
                    </button>
                    <span className="font-semibold text-gray-900">Raport Închidere</span>
                    <div className="w-10" />
                  </div>

                  <input
                    type="date"
                    value={settlementDate}
                    onChange={(e) => setSettlementDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  {settlementLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : !settlementReport || settlementReport.transactionCount === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <ClipboardList className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="font-semibold text-gray-700 mb-1">Nu există tranzacții</p>
                      <p className="text-sm text-gray-500">Nu au fost înregistrate tranzacții pentru {new Date(settlementReport.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                        <h4 className="font-semibold text-gray-900">Sumar - {new Date(settlementReport.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-green-50 rounded-xl p-3">
                            <p className="text-xs text-green-600">Total vânzări</p>
                            <p className="font-bold text-xl text-green-800">{settlementReport.totalSales?.toFixed(2)} RON</p>
                          </div>
                          <div className="bg-blue-50 rounded-xl p-3">
                            <p className="text-xs text-blue-600">Nr. tranzacții</p>
                            <p className="font-bold text-xl text-blue-800">{settlementReport.transactionCount}</p>
                          </div>
                          <div className="bg-purple-50 rounded-xl p-3">
                            <p className="text-xs text-purple-600">Total tips</p>
                            <p className="font-bold text-xl text-purple-800">{settlementReport.totalTips?.toFixed(2)} RON</p>
                          </div>
                          <div className="bg-amber-50 rounded-xl p-3">
                            <p className="text-xs text-amber-600">Media/tranzacție</p>
                            <p className="font-bold text-xl text-amber-800">{settlementReport.averageTransaction?.toFixed(2)} RON</p>
                          </div>
                        </div>
                        <div className="border-t border-gray-100 pt-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Comision platformă</span>
                            <span className="text-red-600 font-medium">-{settlementReport.totalCommission?.toFixed(2)} RON</span>
                          </div>
                          <div className="flex justify-between text-base font-bold">
                            <span>Total net restaurant</span>
                            <span className="text-green-700">{settlementReport.totalNet?.toFixed(2)} RON</span>
                          </div>
                        </div>
                      </div>

                      {Object.keys(settlementReport.paymentMethodBreakdown || {}).length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
                          <h4 className="font-semibold text-gray-900 text-sm">Breakdown metodă de plată</h4>
                          {Object.entries(settlementReport.paymentMethodBreakdown).map(([method, data]: [string, any]) => (
                            <div key={method} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                              <span className="text-gray-600 capitalize">{method.replace('_', ' ')}</span>
                              <span className="font-medium">{data.count} tx · {data.total?.toFixed(2)} RON</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => {
                          window.open(`${API_BASE_URL}/api/wallet/pos-settlement-report/${restaurantId}/csv?date=${settlementDate}`, '_blank');
                        }}
                        className="w-full bg-gray-900 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" /> Descarcă CSV
                      </button>
                    </div>
                  )}
                </div>
              )}

              {posStep === 'input' && (
                <div className="space-y-3 -mx-4 -mt-2 px-2">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">EatOff Smart POS</span>
                    <div className="flex gap-2">
                      <button onClick={() => setPosStep('history')} className="p-2 rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200">
                        <Receipt className="w-4.5 h-4.5" />
                      </button>
                      <button onClick={() => setPosStep('settlement')} className="p-2 rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200">
                        <FileText className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                    <p className="text-5xl font-bold text-gray-900 tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {posAmountNum > 0 ? posAmountNum.toFixed(2) : '0.00'}
                    </p>
                    <p className="text-lg text-gray-400 font-medium mt-1">RON</p>
                    <p className="text-xs text-gray-400 mt-1">Clientul adaugă tips de pe telefon · Cashback automat</p>
                  </div>

                  <div className="flex gap-2 px-1">
                    <button onClick={() => handlePosQuickAdd(5)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm active:bg-gray-200">+5</button>
                    <button onClick={() => handlePosQuickAdd(10)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm active:bg-gray-200">+10</button>
                    <button onClick={() => handlePosQuickAdd(20)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm active:bg-gray-200">+20</button>
                    <button onClick={() => handlePosKeyPress('C')}
                      className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 font-medium text-sm active:bg-red-100">
                      Reset
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 px-1">
                    {['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(key => (
                      <button
                        key={key}
                        onClick={() => handlePosKeyPress(key)}
                        className={cn(
                          "py-4 rounded-2xl text-xl font-semibold active:scale-95 transition-transform",
                          key === '⌫' ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-900"
                        )}
                      >
                        {key === '⌫' ? <Delete className="w-5 h-5 mx-auto" /> : key}
                      </button>
                    ))}
                  </div>

                  <div className="px-1 space-y-2">
                    <button
                      onClick={handlePosCollect}
                      disabled={posAmountNum <= 0 || posPreviewMutation.isPending}
                      className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:bg-green-700 disabled:opacity-50 disabled:active:bg-green-600"
                    >
                      {posPreviewMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-5 h-5" /> Încasează {posAmountNum > 0 ? `${posAmountNum.toFixed(2)} RON` : ''}
                        </>
                      )}
                    </button>

                    <button
                      onClick={handlePosReset}
                      className="w-full py-2.5 rounded-xl text-red-500 font-medium text-sm"
                    >
                      Anulează
                    </button>
                  </div>

                  {posError && (
                    <div className="mx-1 bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                      <XCircle className="w-4 h-4 flex-shrink-0" /> {posError}
                    </div>
                  )}

                  <div className="px-1 flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
                    <Lock className="w-3 h-3" />
                    <span>Dispozitiv conectat securizat</span>
                    <span>·</span>
                    <span>Ultima sincronizare: {new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {transactions.length > 0 && (
                    <div className="px-1 space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-medium">Ultimele tranzacții</p>
                        <button onClick={() => setPosStep('history')} className="text-xs text-primary font-medium">
                          Vezi toate
                        </button>
                      </div>
                      {transactions.slice(0, 5).map((tx: any) => {
                        const st = tx.transactionStatus || 'pending';
                        return (
                          <div key={tx.id} className="flex items-center justify-between py-1.5">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", st === 'completed' ? 'bg-green-500' : st === 'rejected' ? 'bg-red-500' : 'bg-amber-500')} />
                              <span className="text-xs text-gray-600 truncate">{tx.customerName || `#${tx.customerId}`}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-xs font-semibold text-gray-900">{parseFloat(tx.amount || '0').toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'menu' && (() => {
            const categories = Array.from(new Set(menuItems.map((i: any) => i.category).filter(Boolean)));
            const filteredItems = menuItems.filter((item: any) => {
              const matchesCategory = menuCategoryFilter === 'all' || item.category === menuCategoryFilter;
              const matchesSearch = !menuSearchQuery || item.name?.toLowerCase().includes(menuSearchQuery.toLowerCase());
              return matchesCategory && matchesSearch;
            });
            return (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 text-lg">Meniu</h2>
                  <button
                    onClick={() => setShowAddMenuItem(!showAddMenuItem)}
                    className="bg-primary text-white px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Adaugă
                  </button>
                </div>

                {showAddMenuItem && (
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
                    <h3 className="font-semibold text-gray-900 text-sm">Produs Nou</h3>
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Nume produs *"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="Preț (RON) *"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        placeholder="Categorie"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <input
                      type="text"
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      placeholder="Descriere (opțional)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!newItemName.trim() || !newItemPrice.trim()) return;
                          addMenuItemMutation.mutate({
                            name: newItemName.trim(),
                            price: newItemPrice,
                            category: newItemCategory.trim() || undefined,
                            description: newItemDescription.trim() || undefined,
                          });
                        }}
                        disabled={!newItemName.trim() || !newItemPrice.trim() || addMenuItemMutation.isPending}
                        className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {addMenuItemMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Salvează</>}
                      </button>
                      <button
                        onClick={() => setShowAddMenuItem(false)}
                        className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium"
                      >
                        Anulează
                      </button>
                    </div>
                    {addMenuItemMutation.isError && (
                      <p className="text-red-500 text-sm">{(addMenuItemMutation.error as Error)?.message}</p>
                    )}
                  </div>
                )}

                <input
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  placeholder="Caută în meniu..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[16px] bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />

                {categories.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    <button
                      onClick={() => setMenuCategoryFilter('all')}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors",
                        menuCategoryFilter === 'all' ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200"
                      )}
                    >
                      Toate ({menuItems.length})
                    </button>
                    {categories.map((cat: string) => (
                      <button
                        key={cat}
                        onClick={() => setMenuCategoryFilter(cat)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors",
                          menuCategoryFilter === cat ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200"
                        )}
                      >
                        {cat} ({menuItems.filter((i: any) => i.category === cat).length})
                      </button>
                    ))}
                  </div>
                )}

                {menuLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                    <UtensilsCrossed className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">{menuItems.length === 0 ? 'Niciun produs în meniu' : 'Niciun rezultat'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredItems.map((item: any) => (
                      <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">{item.name}</p>
                              {item.category && (
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{item.category}</span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-500 truncate">{item.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              toggleMenuItemMutation.mutate({ id: item.id, isAvailable: !item.isAvailable });
                            }}
                            className="ml-3"
                          >
                            {item.isAvailable !== false ? (
                              <ToggleRight className="w-8 h-8 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-gray-400" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          {editingMenuItem === item.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Preț"
                              />
                              <button
                                onClick={() => updatePriceMutation.mutate({ id: item.id, price: editPrice })}
                                disabled={updatePriceMutation.isPending}
                                className="bg-green-600 text-white p-2 rounded-xl"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setEditingMenuItem(null); setEditPrice(''); }}
                                className="bg-gray-200 text-gray-600 p-2 rounded-xl"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{parseFloat(item.price || '0').toFixed(2)} RON</span>
                              <button
                                onClick={() => { setEditingMenuItem(item.id); setEditPrice(item.price || ''); }}
                                className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          <span className={cn(
                            "text-xs font-medium px-2 py-1 rounded-full",
                            item.isAvailable !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {item.isAvailable !== false ? 'Disponibil' : 'Indisponibil'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}

          {activeTab === 'reservations' && (() => {
            const filteredReservations = reservations.filter((r: any) => {
              if (reservationFilter === 'all') return true;
              return r.status === reservationFilter;
            });
            const pendingCount = reservations.filter((r: any) => r.status === 'pending').length;
            const confirmedCount = reservations.filter((r: any) => r.status === 'confirmed').length;
            return (
              <>
                <h2 className="font-semibold text-gray-900 text-lg">Rezervări</h2>

                <div className="flex gap-2">
                  {([
                    { key: 'all' as const, label: 'Toate', count: reservations.length },
                    { key: 'pending' as const, label: 'În așteptare', count: pendingCount },
                    { key: 'confirmed' as const, label: 'Confirmate', count: confirmedCount },
                  ]).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setReservationFilter(f.key)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                        reservationFilter === f.key ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200"
                      )}
                    >
                      {f.label} ({f.count})
                    </button>
                  ))}
                </div>

                {reservationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : filteredReservations.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Nicio rezervare</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredReservations.map((res: any) => {
                      const status = res.status || 'pending';
                      const statusColor = status === 'confirmed' ? 'bg-green-100 text-green-700' : status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
                      const statusLabel = status === 'confirmed' ? 'Confirmat' : status === 'cancelled' ? 'Anulat' : 'În așteptare';
                      return (
                        <div key={res.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium text-gray-900">{res.customerName || res.guestName || `Client #${res.customerId}`}</p>
                              <p className="text-sm text-gray-500">
                                {res.reservationDate ? new Date(res.reservationDate).toLocaleDateString('ro-RO') : ''}{' '}
                                {res.reservationTime || ''}
                              </p>
                            </div>
                            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColor)}>{statusLabel}</span>
                          </div>

                          <div className="space-y-1.5 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span>{res.partySize || res.guestCount || res.numberOfGuests || '?'} persoane</span>
                            </div>
                            {(res.phone || res.customerPhone) && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{res.phone || res.customerPhone}</span>
                              </div>
                            )}
                            {(res.email || res.customerEmail) && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span>{res.email || res.customerEmail}</span>
                              </div>
                            )}
                            {res.specialRequests && (
                              <div className="bg-amber-50 rounded-lg p-2 mt-1">
                                <p className="text-xs text-amber-700">{res.specialRequests}</p>
                              </div>
                            )}
                            {res.notes && (
                              <div className="bg-amber-50 rounded-lg p-2 mt-1">
                                <p className="text-xs text-amber-700">{res.notes}</p>
                              </div>
                            )}
                          </div>

                          {status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => confirmReservationMutation.mutate(res.id)}
                                disabled={confirmReservationMutation.isPending}
                                className="flex-1 bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1"
                              >
                                <Check className="w-4 h-4" />
                                Confirmă
                              </button>
                              <button
                                onClick={() => cancelReservationMutation.mutate(res.id)}
                                disabled={cancelReservationMutation.isPending}
                                className="flex-1 bg-red-600 text-white px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1"
                              >
                                <X className="w-4 h-4" />
                                Anulează
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}

          {activeTab === 'orders' && (
            <>
              <h2 className="font-semibold text-gray-900 text-lg">Comenzi</h2>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                  <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Nicio comandă</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order: any) => {
                    const status = order.status || 'pending';
                    const statusColor = status === 'ready' ? 'bg-green-100 text-green-700' : status === 'preparing' ? 'bg-blue-100 text-blue-700' : status === 'completed' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700';
                    const statusLabel = status === 'ready' ? 'Gata' : status === 'preparing' ? 'Se pregătește' : status === 'completed' ? 'Finalizat' : 'Nouă';
                    const isExpanded = expandedOrderId === order.id;
                    return (
                      <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <button
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          className="w-full p-4 flex items-start justify-between text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">#{order.orderNumber || order.id}</p>
                              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColor)}>{statusLabel}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleString('ro-RO')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{parseFloat(order.total || order.totalAmount || '0').toFixed(2)} RON</span>
                            <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-transform", isExpanded && "rotate-90")} />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
                            {(order.customerName || order.customerEmail || order.customerPhone || order.deliveryAddress) && (
                              <div className="bg-blue-50 rounded-xl p-3 mt-3 space-y-1.5">
                                <p className="text-xs font-semibold text-blue-700 uppercase">Detalii Client</p>
                                {order.customerName && (
                                  <p className="text-sm text-gray-700 flex items-center gap-2"><Users className="w-3.5 h-3.5 text-blue-500" />{order.customerName}</p>
                                )}
                                {order.customerPhone && (
                                  <p className="text-sm text-gray-700 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-blue-500" />{order.customerPhone}</p>
                                )}
                                {order.customerEmail && (
                                  <p className="text-sm text-gray-700 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-blue-500" />{order.customerEmail}</p>
                                )}
                                {order.deliveryAddress && (
                                  <p className="text-sm text-gray-700 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-blue-500" />{order.deliveryAddress}</p>
                                )}
                              </div>
                            )}

                            {order.items && order.items.length > 0 && (
                              <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                                {order.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-700">{item.quantity}x {item.name}</span>
                                    <span className="text-gray-500">{item.price} RON</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {order.notes && (
                              <div className="bg-amber-50 rounded-xl p-3">
                                <p className="text-xs font-semibold text-amber-700 mb-1">Note</p>
                                <p className="text-sm text-gray-700">{order.notes}</p>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {status === 'pending' && (
                                <button
                                  onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: 'preparing' })}
                                  disabled={updateOrderStatusMutation.isPending}
                                  className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" /> Se pregătește
                                </button>
                              )}
                              {status === 'preparing' && (
                                <button
                                  onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: 'ready' })}
                                  disabled={updateOrderStatusMutation.isPending}
                                  className="bg-green-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" /> Gata
                                </button>
                              )}
                              {(status === 'ready' || status === 'preparing') && (
                                <button
                                  onClick={() => handleCollectPaymentForOrder(order)}
                                  className="bg-primary text-white px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1"
                                >
                                  <DollarSign className="w-3.5 h-3.5" /> Încasează
                                </button>
                              )}
                              <button
                                onClick={() => handlePrintOrder(order)}
                                className="bg-gray-100 text-gray-700 p-2 rounded-xl"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {showScanner && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
            <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
              {scannedCustomer ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Rezultat Înrolare</h3>
                    <button
                      onClick={() => {
                        setScannedCustomer(null);
                        setShowScanner(false);
                        setManualCustomerId('');
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-10 h-10 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{scannedCustomer.customer.name}</p>
                      <p className="text-sm text-gray-500">{scannedCustomer.customer.email}</p>
                    </div>
                  </div>

                  {scannedCustomer.cashback && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-emerald-600 font-medium mb-1">Cashback</p>
                          <p className="font-semibold text-gray-900">{scannedCustomer.cashback.groupName}</p>
                          <p className="text-sm text-gray-500">{parseFloat(scannedCustomer.cashback.cashbackPercentage).toFixed(0)}% cashback</p>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          scannedCustomer.cashback.status === 'newly_enrolled' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        )}>
                          {scannedCustomer.cashback.status === 'newly_enrolled' ? 'Nou înrolat' : 'Deja înrolat'}
                        </span>
                      </div>
                    </div>
                  )}

                  {scannedCustomer.loyalty && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-amber-600 font-medium mb-1">Fidelizare</p>
                          <p className="font-semibold text-gray-900">{scannedCustomer.loyalty.tierName}</p>
                          <p className="text-sm text-gray-500">{parseFloat(scannedCustomer.loyalty.discountPercentage).toFixed(0)}% discount</p>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          scannedCustomer.loyalty.status === 'newly_enrolled' ? "bg-green-100 text-green-700" :
                          scannedCustomer.loyalty.status === 'upgraded' ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-600"
                        )}>
                          {scannedCustomer.loyalty.status === 'newly_enrolled' ? 'Nou înrolat' :
                           scannedCustomer.loyalty.status === 'upgraded' ? 'Nivel ridicat' :
                           'Deja înrolat'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total cheltuit</span>
                      <span className="font-medium text-gray-900">{scannedCustomer.totalSpent}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-500">Vizite</span>
                      <span className="font-medium text-gray-900">{scannedCustomer.visitCount}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setScannedCustomer(null);
                      setManualCustomerId('');
                      setScanError(null);
                      if (Capacitor.isNativePlatform()) {
                        setShowScanner(false);
                        startQRScanner();
                      }
                    }}
                    className="w-full bg-primary text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Scanează alt client
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Scanează Client</h3>
                    <button
                      onClick={() => { setShowScanner(false); setNoGroupsError(false); setScanError(null); }}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {Capacitor.isNativePlatform() ? (
                    <div className="w-full bg-gray-900 text-white rounded-2xl aspect-video flex items-center justify-center mb-4">
                      <div className="text-center">
                        {isScanning ? (
                          <>
                            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-white font-medium">Se scanează...</p>
                            <p className="text-white/60 text-xs mt-1">Îndreaptă camera spre codul QR al clientului</p>
                          </>
                        ) : (
                          <button
                            onClick={() => startQRScanner()}
                            className="text-center hover:opacity-80 transition-opacity"
                          >
                            <Camera className="w-16 h-16 text-white mx-auto mb-3" />
                            <p className="text-white font-medium">Scanează din nou</p>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-gray-100 text-gray-600 rounded-2xl p-6 flex items-center justify-center mb-4">
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="font-medium">Scanarea QR este disponibilă în aplicația mobilă</p>
                        <p className="text-gray-400 text-xs mt-1">Introdu codul clientului manual mai jos</p>
                      </div>
                    </div>
                  )}

                  {noGroupsError && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <X className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-orange-800 mb-1">Grupuri lipsă</p>
                          <p className="text-sm text-orange-700">Restaurantul nu are grupuri de fidelizare definite. Creează cel puțin un grup din setări pentru a putea înrola clienți.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {scanError && !noGroupsError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                      {scanError}
                    </div>
                  )}

                  {scanEnrollMutation.isError && !noGroupsError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                      {(scanEnrollMutation.error as Error)?.message || 'Clientul nu a fost găsit'}
                    </div>
                  )}

                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={manualCustomerId}
                      onChange={(e) => setManualCustomerId(e.target.value)}
                      placeholder="Cod client (ex: EOTDZK2M92)"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={handleLookupCustomer}
                      disabled={!manualCustomerId || scanEnrollMutation.isPending}
                      className="bg-primary text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50"
                    >
                      {scanEnrollMutation.isPending ? (
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        'Caută'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 flex justify-around items-center z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all min-w-0 flex-1",
                  isActive ? "text-primary" : "text-gray-400"
                )}
              >
                <Icon className={cn("w-5 h-5 mb-0.5", isActive && "text-primary")} />
                <span className={cn("text-[10px] font-medium truncate", isActive ? "text-primary" : "text-gray-400")}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </MobileLayout>
  );
}

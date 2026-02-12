import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Store, QrCode, Users, LogOut, ChevronRight, Plus,
  TrendingUp, BadgePercent, Scan, X, Check, UserPlus, Camera,
  CreditCard, UtensilsCrossed, Calendar, ClipboardList, Wallet,
  Send, Printer, ToggleLeft, ToggleRight, Edit2, Loader2,
  Clock, CheckCircle, XCircle, AlertCircle, Phone, Mail, MapPin,
  RefreshCw, DollarSign
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
  const [selectedGroupType, setSelectedGroupType] = useState<'cashback' | 'loyalty'>('cashback');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [scannedCustomer, setScannedCustomer] = useState<any>(null);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
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

  const [qrSessionAmount, setQrSessionAmount] = useState('');
  const [qrSessionTable, setQrSessionTable] = useState('');
  const [qrSessionDescription, setQrSessionDescription] = useState('');
  const [activeQrSession, setActiveQrSession] = useState<{
    sessionId: number;
    sessionToken: string;
    qrPayload: string;
    amount: string;
    expiresAt: string;
  } | null>(null);
  const [qrSessionStatus, setQrSessionStatus] = useState<string>('active');
  const [qrSessionTransaction, setQrSessionTransaction] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const startQRScanner = async (onScan?: (value: string) => void) => {
    if (!Capacitor.isNativePlatform()) {
      setScanError('Scanarea QR este disponibilă doar în aplicația mobilă');
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
          const customerIdMatch = scannedValue?.match(/eatoff:\/\/customer\/(\d+)/);
          if (customerIdMatch) {
            setManualCustomerId(customerIdMatch[1]);
            lookupCustomerMutation.mutate(customerIdMatch[1]);
          } else if (scannedValue && /^\d+$/.test(scannedValue)) {
            setManualCustomerId(scannedValue);
            lookupCustomerMutation.mutate(scannedValue);
          } else {
            setScanError('Cod QR invalid. Scanează codul din profilul clientului.');
          }
        }
      }
    } catch (error: any) {
      setIsScanning(false);
      setScanError(error.message || 'Eroare la scanare');
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
    enabled: !!restaurantId && activeTab === 'reservations',
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
    enabled: !!restaurantId && activeTab === 'orders',
  });

  const lookupCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/restaurant/${restaurantId}/customer/${customerId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Customer not found');
      return response.json();
    },
    onSuccess: (data) => {
      setScannedCustomer(data);
    },
  });

  const enrollCashbackMutation = useMutation({
    mutationFn: async ({ customerId, groupId }: { customerId: number; groupId: number }) => {
      const response = await fetch(`${API_BASE_URL}/api/restaurant/${restaurantId}/enroll-customer/cashback`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          groupId,
          enrolledByUserId: session?.owner?.id,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Enrollment failed');
      }
      return response.json();
    },
    onSuccess: () => {
      setEnrollmentSuccess(true);
      setTimeout(() => {
        setEnrollmentSuccess(false);
        setScannedCustomer(null);
        setSelectedGroupId(null);
        setShowScanner(false);
        setManualCustomerId('');
      }, 2000);
    },
  });

  const enrollLoyaltyMutation = useMutation({
    mutationFn: async ({ customerId, groupId }: { customerId: number; groupId: number }) => {
      const response = await fetch(`${API_BASE_URL}/api/restaurant/${restaurantId}/enroll-customer/loyalty`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          groupId,
          enrolledByUserId: session?.owner?.id,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Enrollment failed');
      }
      return response.json();
    },
    onSuccess: () => {
      setEnrollmentSuccess(true);
      setTimeout(() => {
        setEnrollmentSuccess(false);
        setScannedCustomer(null);
        setSelectedGroupId(null);
        setShowScanner(false);
        setManualCustomerId('');
      }, 2000);
    },
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

  const createQrSessionMutation = useMutation({
    mutationFn: async (data: { amount: number; tableId?: string; description?: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/wallet/restaurant-payment-session`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          amount: data.amount,
          tableId: data.tableId,
          description: data.description,
          expiresIn: 300,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Eroare la crearea sesiunii');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setActiveQrSession(data);
      setQrSessionStatus('active');
      setQrSessionTransaction(null);
      setQrSessionAmount('');
      setQrSessionTable('');
      setQrSessionDescription('');
    },
  });

  useEffect(() => {
    if (!activeQrSession || qrSessionStatus === 'completed' || qrSessionStatus === 'expired') return;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/wallet/payment-session/${activeQrSession.sessionToken}/status`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setQrSessionStatus(data.status);
          if (data.transaction) setQrSessionTransaction(data.transaction);
          if (data.status === 'completed' || data.status === 'expired' || data.status === 'cancelled') {
            clearInterval(interval);
            if (data.status === 'completed') {
              queryClient.invalidateQueries({ queryKey: ['/api/wallet/restaurant', restaurantId, 'transactions'] });
            }
          }
        }
      } catch (e) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [activeQrSession, qrSessionStatus]);

  const handleCreateQrSession = () => {
    const amount = parseFloat(qrSessionAmount);
    if (isNaN(amount) || amount <= 0) return;
    createQrSessionMutation.mutate({
      amount,
      tableId: qrSessionTable || undefined,
      description: qrSessionDescription || undefined,
    });
  };

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
      lookupCustomerMutation.mutate(manualCustomerId);
    }
  };

  const handleEnroll = () => {
    if (!scannedCustomer?.customer?.id || !selectedGroupId) return;
    if (selectedGroupType === 'cashback') {
      enrollCashbackMutation.mutate({ customerId: scannedCustomer.customer.id, groupId: selectedGroupId });
    } else {
      enrollLoyaltyMutation.mutate({ customerId: scannedCustomer.customer.id, groupId: selectedGroupId });
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

  const groups = selectedGroupType === 'cashback' ? cashbackGroups : loyaltyGroups;

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
                  <Scan className="w-5 h-5" />
                  Scanează Plată
                </button>
                <button
                  onClick={() => setShowScanner(true)}
                  className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  Înrolează Client
                </button>
              </div>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Grupuri Cashback</h2>
                  <button className="text-primary text-sm font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    Adaugă
                  </button>
                </div>
                {cashbackGroups.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                    <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Niciun grup cashback creat</p>
                  </div>
                ) : (
                  cashbackGroups.map((group: any) => (
                    <div key={group.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{group.name}</p>
                        <p className="text-sm text-gray-500">{group.description}</p>
                      </div>
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                        {parseFloat(group.cashbackPercentage).toFixed(0)}%
                      </div>
                    </div>
                  ))
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Grupuri Fidelizare</h2>
                  <button className="text-primary text-sm font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    Adaugă
                  </button>
                </div>
                {loyaltyGroups.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                    <BadgePercent className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Niciun grup fidelizare creat</p>
                  </div>
                ) : (
                  loyaltyGroups.map((group: any) => (
                    <div key={group.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{group.name}</p>
                        <p className="text-sm text-gray-500">Tier {group.tierLevel}</p>
                      </div>
                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                        {parseFloat(group.discountPercentage).toFixed(0)}% discount
                      </div>
                    </div>
                  ))
                )}
              </section>
            </>
          )}

          {activeTab === 'payments' && (
            <>
              <section className="bg-white rounded-2xl p-4 border border-gray-100 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  Generează QR pentru Încasare
                </h3>

                {activeQrSession && qrSessionStatus !== 'expired' && qrSessionStatus !== 'cancelled' ? (
                  <div className="space-y-4">
                    {qrSessionStatus === 'completed' ? (
                      <div className="text-center py-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="font-bold text-green-700 text-lg mb-1">Plată Confirmată!</p>
                        {qrSessionTransaction && (
                          <p className="text-gray-600">{qrSessionTransaction.customerName} - {parseFloat(qrSessionTransaction.amount).toFixed(2)} RON</p>
                        )}
                        <button
                          onClick={() => { setActiveQrSession(null); setQrSessionStatus('active'); }}
                          className="mt-4 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold"
                        >
                          Încasare Nouă
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center">
                          <QRCodeSVG
                            value={activeQrSession.qrPayload}
                            size={200}
                            level="H"
                            includeMargin
                          />
                          <p className="mt-3 font-bold text-xl text-gray-900">{parseFloat(activeQrSession.amount).toFixed(2)} RON</p>
                          <p className="text-sm text-gray-500 mt-1">Clientul scanează acest cod pentru a plăti</p>
                          <div className="flex items-center gap-2 mt-2">
                            {qrSessionStatus === 'active' && (
                              <span className="flex items-center gap-1 text-amber-600 text-sm">
                                <Clock className="w-4 h-4 animate-pulse" />
                                Se așteaptă scanarea...
                              </span>
                            )}
                            {qrSessionStatus === 'claimed' && (
                              <span className="flex items-center gap-1 text-blue-600 text-sm">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Client confirmă plata...
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await fetch(`${API_BASE_URL}/api/wallet/payment-session/${activeQrSession.sessionToken}/cancel`, {
                                method: 'POST', credentials: 'include',
                              });
                            } catch (e) {}
                            setActiveQrSession(null);
                            setQrSessionStatus('active');
                          }}
                          className="w-full py-2.5 rounded-xl font-medium text-red-600 bg-red-50 border border-red-200"
                        >
                          Anulează
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <input
                      type="number"
                      value={qrSessionAmount}
                      onChange={(e) => setQrSessionAmount(e.target.value)}
                      placeholder="Sumă de încasat (RON)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={qrSessionTable}
                        onChange={(e) => setQrSessionTable(e.target.value)}
                        placeholder="Nr. masă (opțional)"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        value={qrSessionDescription}
                        onChange={(e) => setQrSessionDescription(e.target.value)}
                        placeholder="Descriere (opțional)"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <button
                      onClick={handleCreateQrSession}
                      disabled={!qrSessionAmount || parseFloat(qrSessionAmount) <= 0 || createQrSessionMutation.isPending}
                      className="w-full bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {createQrSessionMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <QrCode className="w-5 h-5" />
                          Generează QR de Plată
                        </>
                      )}
                    </button>
                    {createQrSessionMutation.isError && (
                      <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl text-sm">
                        {(createQrSessionMutation.error as Error)?.message}
                      </div>
                    )}
                  </>
                )}
              </section>

              <section className="bg-white rounded-2xl p-4 border border-gray-100 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Scan className="w-5 h-5 text-primary" />
                  Scanează & Acceptă Plata
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paymentCode}
                    onChange={(e) => setPaymentCode(e.target.value)}
                    placeholder="Cod plată (ex: EATOFF_PAY:123)"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={() => startQRScanner((val) => {
                      setPaymentCode(val);
                      const match = val.match(/EATOFF_PAY:(\S+)/);
                      const txId = match ? match[1] : val.trim();
                      fetchPaymentMutation.mutate(txId);
                    })}
                    className="bg-gray-900 text-white p-3 rounded-xl"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={handleLookupPayment}
                  disabled={!paymentCode.trim() || fetchPaymentMutation.isPending}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {fetchPaymentMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <QrCode className="w-5 h-5" />
                      Caută Tranzacția
                    </>
                  )}
                </button>

                {paymentActionResult && (
                  <div className={cn(
                    "px-4 py-3 rounded-xl text-sm flex items-center gap-2",
                    paymentActionResult.type === 'success' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                  )}>
                    {paymentActionResult.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {paymentActionResult.message}
                  </div>
                )}

                {paymentDetails && (
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{paymentDetails.customerName || 'Client'}</p>
                        <p className="text-xs text-gray-500">{paymentDetails.timestamp ? new Date(paymentDetails.timestamp).toLocaleString('ro-RO') : ''}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Sumă totală</span>
                        <span className="font-bold text-gray-900">{paymentDetails.amount} RON</span>
                      </div>
                      {paymentDetails.paymentMethod && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 text-sm">Metodă</span>
                          <span className="text-gray-700 text-sm">{paymentDetails.paymentMethod}</span>
                        </div>
                      )}
                      {paymentDetails.voucherValue && parseFloat(paymentDetails.voucherValue) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 text-sm">Voucher</span>
                          <span className="text-green-600 text-sm">-{paymentDetails.voucherValue} RON</span>
                        </div>
                      )}
                      {paymentDetails.cashUsed && parseFloat(paymentDetails.cashUsed) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 text-sm">Cash</span>
                          <span className="text-gray-700 text-sm">{paymentDetails.cashUsed} RON</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          const match = paymentCode.match(/EATOFF_PAY:(\S+)/);
                          const txId = match ? match[1] : paymentCode.trim();
                          acceptPaymentMutation.mutate(txId);
                        }}
                        disabled={acceptPaymentMutation.isPending}
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50"
                      >
                        {acceptPaymentMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Acceptă Plata</>}
                      </button>
                      <button
                        onClick={() => {
                          const match = paymentCode.match(/EATOFF_PAY:(\S+)/);
                          const txId = match ? match[1] : paymentCode.trim();
                          rejectPaymentMutation.mutate(txId);
                        }}
                        disabled={rejectPaymentMutation.isPending}
                        className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-50"
                      >
                        {rejectPaymentMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><X className="w-5 h-5" /> Respinge</>}
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-white rounded-2xl p-4 border border-gray-100 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Solicită Plată de la Client
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value)}
                    placeholder="Cod client (ex: CLI-ABC123)"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={() => startQRScanner((val) => setCustomerCode(val))}
                    className="bg-gray-900 text-white p-3 rounded-xl"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <input
                  type="number"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  placeholder="Sumă (RON)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleSendPaymentRequest}
                  disabled={!customerCode.trim() || !requestAmount.trim() || sendPaymentRequestMutation.isPending}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sendPaymentRequestMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Trimite Solicitare de Plată
                    </>
                  )}
                </button>

                {requestResult && (
                  <div className={cn(
                    "px-4 py-3 rounded-xl text-sm flex items-center gap-2",
                    requestResult.type === 'success' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                  )}>
                    {requestResult.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {requestResult.message}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Istoric Tranzacții
                </h3>
                {transactionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                    <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Nicio tranzacție încă</p>
                  </div>
                ) : (
                  transactions.slice(0, 20).map((tx: any) => {
                    const status = tx.transactionStatus || tx.status || 'pending';
                    const statusColor = status === 'completed' ? 'bg-green-100 text-green-700' : status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
                    const statusLabel = status === 'completed' ? 'Finalizat' : status === 'rejected' ? 'Respins' : 'În așteptare';
                    return (
                      <div key={tx.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{tx.customerName || `Client #${tx.customerId}`}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.createdAt || tx.processedAt).toLocaleString('ro-RO')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColor)}>{statusLabel}</span>
                          <span className="font-bold text-gray-900 whitespace-nowrap">{parseFloat(tx.amount || tx.restaurantReceives || '0').toFixed(2)} RON</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </section>
            </>
          )}

          {activeTab === 'menu' && (
            <>
              <h2 className="font-semibold text-gray-900 text-lg">Managementul Meniului</h2>
              {menuLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : menuItems.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                  <UtensilsCrossed className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Niciun produs în meniu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {menuItems.map((item: any) => (
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
          )}

          {activeTab === 'reservations' && (
            <>
              <h2 className="font-semibold text-gray-900 text-lg">Rezervări</h2>
              {reservationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : reservations.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                  <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Nicio rezervare</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reservations.map((res: any) => {
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Users className="w-4 h-4" />
                            <span>{res.partySize || res.guestCount || res.numberOfGuests || '?'} persoane</span>
                          </div>
                          {status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => confirmReservationMutation.mutate(res.id)}
                                disabled={confirmReservationMutation.isPending}
                                className="bg-green-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1"
                              >
                                <Check className="w-4 h-4" />
                                Confirmă
                              </button>
                              <button
                                onClick={() => cancelReservationMutation.mutate(res.id)}
                                disabled={cancelReservationMutation.isPending}
                                className="bg-red-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1"
                              >
                                <X className="w-4 h-4" />
                                Anulează
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

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
              {enrollmentSuccess ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Înrolare reușită!</h3>
                  <p className="text-gray-500">Clientul a fost adăugat în grup</p>
                </div>
              ) : scannedCustomer ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Înrolează Client</h3>
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

                  <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{scannedCustomer.customer.name}</p>
                      <p className="text-sm text-gray-500">{scannedCustomer.customer.email}</p>
                    </div>
                  </div>

                  <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                    <button
                      onClick={() => {
                        setSelectedGroupType('cashback');
                        setSelectedGroupId(null);
                      }}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg font-medium transition-all",
                        selectedGroupType === 'cashback' ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                      )}
                    >
                      Cashback
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGroupType('loyalty');
                        setSelectedGroupId(null);
                      }}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg font-medium transition-all",
                        selectedGroupType === 'loyalty' ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                      )}
                    >
                      Fidelizare
                    </button>
                  </div>

                  <div className="space-y-2 mb-6">
                    {groups.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">Niciun grup disponibil</p>
                    ) : (
                      groups.map((group: any) => (
                        <button
                          key={group.id}
                          onClick={() => setSelectedGroupId(group.id)}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between",
                            selectedGroupId === group.id
                              ? "border-primary bg-primary/5"
                              : "border-gray-100 bg-white"
                          )}
                        >
                          <div>
                            <p className="font-medium text-gray-900">{group.name}</p>
                            <p className="text-sm text-gray-500">
                              {selectedGroupType === 'cashback'
                                ? `${parseFloat(group.cashbackPercentage).toFixed(0)}% cashback`
                                : `${parseFloat(group.discountPercentage).toFixed(0)}% discount`
                              }
                            </p>
                          </div>
                          {selectedGroupId === group.id && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    onClick={handleEnroll}
                    disabled={!selectedGroupId || enrollCashbackMutation.isPending || enrollLoyaltyMutation.isPending}
                    className="w-full bg-primary text-white py-4 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {(enrollCashbackMutation.isPending || enrollLoyaltyMutation.isPending) ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Înrolează în Grup
                      </>
                    )}
                  </button>

                  {(enrollCashbackMutation.isError || enrollLoyaltyMutation.isError) && (
                    <p className="text-red-500 text-sm text-center mt-3">
                      {(enrollCashbackMutation.error as Error)?.message || (enrollLoyaltyMutation.error as Error)?.message}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Caută Client</h3>
                    <button
                      onClick={() => setShowScanner(false)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => startQRScanner()}
                    disabled={isScanning}
                    className="w-full bg-gray-900 text-white rounded-2xl aspect-video flex items-center justify-center mb-4 hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    <div className="text-center">
                      {isScanning ? (
                        <>
                          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                          <p className="text-white font-medium">Se scanează...</p>
                        </>
                      ) : (
                        <>
                          <Camera className="w-16 h-16 text-white mx-auto mb-3" />
                          <p className="text-white font-medium">Apasă pentru a scana codul QR</p>
                          <p className="text-white/60 text-xs mt-1">sau introdu ID-ul manual mai jos</p>
                        </>
                      )}
                    </div>
                  </button>

                  {scanError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                      {scanError}
                    </div>
                  )}

                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={manualCustomerId}
                      onChange={(e) => setManualCustomerId(e.target.value)}
                      placeholder="ID Client (ex: 123)"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={handleLookupCustomer}
                      disabled={!manualCustomerId || lookupCustomerMutation.isPending}
                      className="bg-primary text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50"
                    >
                      {lookupCustomerMutation.isPending ? (
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        'Caută'
                      )}
                    </button>
                  </div>

                  {lookupCustomerMutation.isError && (
                    <p className="text-red-500 text-sm text-center">
                      Clientul nu a fost găsit
                    </p>
                  )}
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

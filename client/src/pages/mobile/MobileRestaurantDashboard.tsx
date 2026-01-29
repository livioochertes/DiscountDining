import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Store, QrCode, Users, LogOut, ChevronRight, Plus, 
  TrendingUp, BadgePercent, Scan, X, Check, UserPlus, Camera
} from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

const API_BASE_URL = Capacitor.isNativePlatform() 
  ? 'https://0c90c681-c530-48b5-a772-aad7086fccf3-00-225nal1mjdpuu.kirk.replit.dev'
  : '';

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
  const [showScanner, setShowScanner] = useState(false);
  const [manualCustomerId, setManualCustomerId] = useState('');
  const [selectedGroupType, setSelectedGroupType] = useState<'cashback' | 'loyalty'>('cashback');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [scannedCustomer, setScannedCustomer] = useState<any>(null);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Request camera permission and start QR scanning
  const startQRScanner = async () => {
    if (!Capacitor.isNativePlatform()) {
      setScanError('Scanarea QR este disponibilă doar în aplicația mobilă');
      return;
    }

    try {
      // Check if permission is already granted
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

      // Start scanning
      const { barcodes } = await BarcodeScanner.scan();
      
      setIsScanning(false);

      if (barcodes.length > 0) {
        const scannedValue = barcodes[0].rawValue;
        // Parse customer ID from QR code (format: eatoff://customer/{id})
        const customerIdMatch = scannedValue?.match(/eatoff:\/\/customer\/(\d+)/);
        if (customerIdMatch) {
          setManualCustomerId(customerIdMatch[1]);
          lookupCustomerMutation.mutate(customerIdMatch[1]);
        } else if (scannedValue && /^\d+$/.test(scannedValue)) {
          // If it's just a number, use it directly as customer ID
          setManualCustomerId(scannedValue);
          lookupCustomerMutation.mutate(scannedValue);
        } else {
          setScanError('Cod QR invalid. Scanează codul din profilul clientului.');
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

  // Fetch cashback groups
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

  // Fetch loyalty groups
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

  // Lookup customer mutation
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

  // Enroll customer in cashback group
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

  // Enroll customer in loyalty group
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
      enrollCashbackMutation.mutate({
        customerId: scannedCustomer.customer.id,
        groupId: selectedGroupId,
      });
    } else {
      enrollLoyaltyMutation.mutate({
        customerId: scannedCustomer.customer.id,
        groupId: selectedGroupId,
      });
    }
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

  return (
    <MobileLayout hideNavigation>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
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
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-500">Grupuri Cashback</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{cashbackGroups.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <BadgePercent className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-gray-500">Grupuri Fidelizare</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{loyaltyGroups.length}</p>
            </div>
          </div>

          {/* Main Action - Scan QR */}
          <button
            onClick={() => setShowScanner(true)}
            className="w-full bg-primary text-white py-5 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-primary/90 transition-colors"
          >
            <QrCode className="w-6 h-6" />
            Scanează Client pentru Înrolare
          </button>

          {/* Cashback Groups */}
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

          {/* Loyalty Groups */}
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
        </div>

        {/* Scanner Modal */}
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

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{scannedCustomer.customer.name}</p>
                      <p className="text-sm text-gray-500">{scannedCustomer.customer.email}</p>
                    </div>
                  </div>

                  {/* Group Type Selection */}
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

                  {/* Group Selection */}
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

                  {/* QR Scanner */}
                  <button
                    onClick={startQRScanner}
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

                  {/* Manual ID Input */}
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
      </div>
    </MobileLayout>
  );
}

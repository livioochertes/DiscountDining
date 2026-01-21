import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import VoucherCard from "@/components/voucher-card";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";



export default function MyVouchers() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  // Show access required message if not authenticated
  if (!isAuthenticated || !user) {
    const handleDemoLogin = async () => {
      try {
        const response = await fetch('/api/auth/demo-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        
        if (response.ok) {
          window.location.reload();
        } else {
          console.error('Demo login failed');
        }
      } catch (error) {
        console.error('Demo login error:', error);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.accessRequired}</h2>
            <p className="text-gray-600 mb-6">
              {t.signInToViewVouchers || 'Please sign in to view your vouchers and manage your account.'}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => setLocation('/login')}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {t.signIn}
              </Button>
              <Button 
                onClick={handleDemoLogin}
                variant="outline"
                className="w-full"
              >
{t.tryDemoAccount || 'Try Demo Account (has vouchers)'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['/api/customers', user.id, 'vouchers'],
    queryFn: () => api.getCustomerVouchers(user.id),
    enabled: !!user?.id
  });



  const activeVouchers = vouchers.filter((v: any) => v.status === 'active');
  const inactiveVouchers = vouchers.filter((v: any) => v.status !== 'active');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-2">{t.myVouchers}</h2>
        <p className="text-gray-600">{t.manageVouchersDescription || 'Manage your purchased voucher packages and track usage'}</p>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">{t.loading}</p>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-12">
          <Card>
            <CardContent className="p-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t.noVouchersYet || 'No vouchers yet'}</h3>
              <p className="text-gray-500 mb-6">{t.startSavingMessage || 'Start saving by purchasing voucher packages from your favorite restaurants.'}</p>
              <Button 
                onClick={() => setLocation("/")}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t.browseRestaurants || 'Browse Restaurants'}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Active Vouchers */}
          {activeVouchers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t.activeVouchers}</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeVouchers.map((voucher: any) => (
                  <VoucherCard
                    key={voucher.id}
                    voucher={voucher}
                    onViewDetails={() => {}}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Vouchers */}
          {inactiveVouchers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t.pastVouchers || 'Past Vouchers'}</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {inactiveVouchers.map((voucher: any) => (
                  <VoucherCard
                    key={voucher.id}
                    voucher={voucher}
                    onViewDetails={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="text-center">
            <Button 
              onClick={() => setLocation("/")}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
{t.browseMoreRestaurants || 'Browse More Restaurants'}
            </Button>
          </div>
        </>
      )}


    </main>
  );
}

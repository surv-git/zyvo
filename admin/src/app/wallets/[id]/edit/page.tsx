"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Wallet, 
  User, 
  DollarSign, 
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { WalletWithUser, WalletUpdateData, WalletStatus, WalletCurrency } from '@/types/wallet';
import { 
  getWalletById, 
  updateWallet,
  getUserDisplayName,
  formatWalletDate
} from '@/services/wallet-service';
import { getWalletBalance } from '@/types/wallet';
import { PageHeader } from '@/components/ui/page-header';

const WALLET_STATUSES: WalletStatus[] = ['ACTIVE', 'BLOCKED', 'INACTIVE'];
const WALLET_CURRENCIES: WalletCurrency[] = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'];

export default function WalletEditPage() {
  const router = useRouter();
  const [walletId, setWalletId] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wallet, setWallet] = useState<WalletWithUser | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<WalletUpdateData>({
    balance: 0,
    currency: 'INR',
    status: 'ACTIVE',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Extract wallet ID from URL
  useEffect(() => {
    const pathSegments = window.location.pathname.split('/');
    const id = pathSegments[pathSegments.length - 2]; // Remove 'edit' from end
    if (id && id !== 'wallets') {
      setWalletId(id);
    }
  }, []);

  // Load wallet data
  useEffect(() => {
    const loadWallet = async () => {
      if (!walletId) return;
      
      try {
        const walletData = await getWalletById(walletId);
        setWallet(walletData);
        
        // Populate form with existing data
        setFormData({
          balance: getWalletBalance(walletData),
          currency: walletData.currency,
          status: walletData.status,
        });
      } catch (error) {
        console.error('Failed to load wallet:', error);
        toast.error('Failed to load wallet data');
        router.push('/wallets');
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, [walletId, router]);

  const handleBack = () => {
    router.push(`/wallets/${walletId}`);
  };

  const handleCancel = () => {
    router.push(`/wallets/${walletId}`);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.balance || formData.balance < 0) {
      newErrors.balance = 'Balance must be a positive number';
    }
    
    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }
    
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !wallet) {
      return;
    }

    setSaving(true);
    
    try {
      await updateWallet(wallet._id, formData);
      toast.success('Wallet updated successfully');
      router.push(`/wallets/${wallet._id}`);
    } catch (error) {
      console.error('Failed to update wallet:', error);
      toast.error('Failed to update wallet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof WalletUpdateData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading wallet...</span>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Wallet Not Found</h2>
          <p className="text-muted-foreground mb-4">The wallet you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/wallets')}>
            Back to Wallets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={Wallet}
        title={`Edit Wallet - ${getUserDisplayName(wallet.user)}`}
        description="Update wallet settings and information"
        showBackButton={true}
        onBack={handleBack}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Wallet Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="balance">Balance</Label>
                    <Input
                      id="balance"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.balance || ''}
                      onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
                      className={errors.balance ? 'border-red-500' : ''}
                      disabled={saving}
                    />
                    {errors.balance && (
                      <p className="text-sm text-red-600">{errors.balance}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency || ''}
                      onValueChange={(value: WalletCurrency) => handleInputChange('currency', value)}
                      disabled={saving}
                    >
                      <SelectTrigger className={errors.currency ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {WALLET_CURRENCIES.map(currency => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.currency && (
                      <p className="text-sm text-red-600">{errors.currency}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || ''}
                    onValueChange={(value: WalletStatus) => handleInputChange('status', value)}
                    disabled={saving}
                  >
                    <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {WALLET_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-red-600">{errors.status}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Information (Read-only) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">User Name</Label>
                    <p className="text-lg font-semibold">{getUserDisplayName(wallet.user)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email Address</Label>
                    <p className="text-lg">{wallet.user.email}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">User ID</Label>
                    <p className="text-base font-mono">{wallet.user._id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Wallet Created</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-base">{formatWalletDate(wallet.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={wallet.status === 'ACTIVE' ? "default" : wallet.status === 'BLOCKED' ? "destructive" : "secondary"}>
                    {wallet.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Balance</span>
                  <span className="text-sm font-mono">{getWalletBalance(wallet).toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Currency</span>
                  <Badge variant="outline">{wallet.currency}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Balance must be a positive number</p>
                <p>• Currency cannot be changed after transactions</p>
                <p>• Blocked wallets cannot process transactions</p>
                <p>• Inactive wallets are hidden from users</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save, 
  Wallet, 
  User, 
  DollarSign,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { WalletCreateData, WalletStatus, WalletCurrency } from '@/types/wallet';
import { createWallet } from '@/services/wallet-service';
import { PageHeader } from '@/components/ui/page-header';

const WALLET_STATUSES: WalletStatus[] = ['ACTIVE', 'BLOCKED', 'INACTIVE'];
const WALLET_CURRENCIES: WalletCurrency[] = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'];

export default function WalletNewPage() {
  const router = useRouter();
  
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<WalletCreateData>({
    user_id: '',
    balance: 0,
    currency: 'INR',
    status: 'ACTIVE',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleBack = () => {
    router.push('/wallets');
  };

  const handleCancel = () => {
    router.push('/wallets');
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.user_id.trim()) {
      newErrors.user_id = 'User ID is required';
    } else if (!/^[0-9a-fA-F]{24}$/.test(formData.user_id)) {
      newErrors.user_id = 'User ID must be a valid 24-character MongoDB ObjectId';
    }
    
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
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      const newWallet = await createWallet(formData);
      toast.success('Wallet created successfully');
      router.push(`/wallets/${newWallet._id}`);
    } catch (error) {
      console.error('Failed to create wallet:', error);
      toast.error('Failed to create wallet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof WalletCreateData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="page-container space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={Wallet}
        title="Create New Wallet"
        description="Create a new wallet for a user"
        showBackButton={true}
        onBack={handleBack}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user_id">
                    User ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="user_id"
                    type="text"
                    placeholder="Enter 24-character MongoDB ObjectId (e.g., 64a1b2c3d4e5f6789abcdef1)"
                    value={formData.user_id}
                    onChange={(e) => handleInputChange('user_id', e.target.value)}
                    className={errors.user_id ? 'border-red-500' : ''}
                    disabled={saving}
                  />
                  {errors.user_id && (
                    <p className="text-sm text-red-600">{errors.user_id}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Enter the MongoDB ObjectId of the user who will own this wallet
                  </p>
                </div>
              </CardContent>
            </Card>

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
                    <Label htmlFor="balance">
                      Initial Balance <span className="text-red-500">*</span>
                    </Label>
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
                    <Label htmlFor="currency">
                      Currency <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.currency}
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
                  <Label htmlFor="status">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.status}
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
                  <p className="text-sm text-muted-foreground">
                    Choose the initial status for this wallet
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Wallet
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

            {/* Currency Information */}
            <Card>
              <CardHeader>
                <CardTitle>Supported Currencies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid gap-1">
                  <div className="flex justify-between">
                    <span>INR</span>
                    <span className="text-muted-foreground">Indian Rupee</span>
                  </div>
                  <div className="flex justify-between">
                    <span>USD</span>
                    <span className="text-muted-foreground">US Dollar</span>
                  </div>
                  <div className="flex justify-between">
                    <span>EUR</span>
                    <span className="text-muted-foreground">Euro</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GBP</span>
                    <span className="text-muted-foreground">British Pound</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AUD</span>
                    <span className="text-muted-foreground">Australian Dollar</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CAD</span>
                    <span className="text-muted-foreground">Canadian Dollar</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• User ID must be a valid MongoDB ObjectId</p>
                <p>• Initial balance must be a positive number</p>
                <p>• Currency cannot be changed after creation</p>
                <p>• ACTIVE wallets can process transactions immediately</p>
                <p>• BLOCKED wallets cannot process any transactions</p>
                <p>• INACTIVE wallets are hidden from users</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

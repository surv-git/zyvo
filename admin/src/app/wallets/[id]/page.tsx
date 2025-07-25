"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  Wallet, 
  User, 
  DollarSign, 
  Calendar,
  Loader2,
  AlertCircle,
  Copy,
  Ban,
  Trash2,
  CheckCircle,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { WalletWithUser } from '@/types/wallet';
import { 
  getWalletById, 
  activateWallet, 
  deactivateWallet, 
  blockWallet, 
  deleteWallet,
  formatWalletBalance,
  getUserDisplayName,
  formatWalletDate
} from '@/services/wallet-service';
import { PageHeader } from '@/components/ui/page-header';

export default function WalletViewPage() {
  const router = useRouter();
  const [walletId, setWalletId] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletWithUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Extract wallet ID from URL
  useEffect(() => {
    const pathSegments = window.location.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
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

  const handleEdit = () => {
    router.push(`/wallets/${walletId}/edit`);
  };

  const handleBack = () => {
    router.push('/wallets');
  };

  const handleCopyId = async () => {
    if (wallet) {
      try {
        await navigator.clipboard.writeText(wallet._id);
        toast.success('Wallet ID copied to clipboard');
      } catch {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleToggleStatus = async (newStatus: 'ACTIVE' | 'BLOCKED' | 'INACTIVE') => {
    if (!wallet) return;

    const action = newStatus.toLowerCase();
    setActionLoading(action);

    try {
      let updatedWallet: WalletWithUser;
      
      switch (newStatus) {
        case 'ACTIVE':
          updatedWallet = await activateWallet(wallet._id);
          toast.success('Wallet activated successfully');
          break;
        case 'BLOCKED':
          updatedWallet = await blockWallet(wallet._id);
          toast.success('Wallet blocked successfully');
          break;
        case 'INACTIVE':
          updatedWallet = await deactivateWallet(wallet._id);
          toast.success('Wallet deactivated successfully');
          break;
        default:
          throw new Error('Invalid status');
      }

      setWallet(updatedWallet);
    } catch (error) {
      console.error(`Failed to ${action} wallet:`, error);
      toast.error(`Failed to ${action} wallet. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!wallet) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the wallet for ${getUserDisplayName(wallet.user)}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading('delete');

    try {
      await deleteWallet(wallet._id);
      toast.success('Wallet deleted successfully');
      router.push('/wallets');
    } catch (error) {
      console.error('Failed to delete wallet:', error);
      toast.error('Failed to delete wallet. Please try again.');
      setActionLoading(null);
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
          <Button onClick={handleBack}>
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
        title={`Wallet - ${getUserDisplayName(wallet.user)}`}
        description="Wallet details and transaction information"
        showBackButton={true}
        onBack={handleBack}
        actions={[
          {
            label: "Edit",
            onClick: handleEdit,
            icon: Edit,
            variant: "outline"
          },
          {
            label: wallet.status === 'ACTIVE' ? 'Block' : 'Activate',
            onClick: () => handleToggleStatus(wallet.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'),
            icon: wallet.status === 'ACTIVE' ? Ban : CheckCircle,
            variant: "outline",
            disabled: actionLoading === 'activate' || actionLoading === 'blocked'
          },
          {
            label: "Delete",
            onClick: handleDelete,
            icon: Trash2,
            variant: "destructive",
            disabled: actionLoading === 'delete'
          }
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
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
                  <label className="text-sm font-medium text-muted-foreground">User Name</label>
                  <p className="text-lg font-semibold">{getUserDisplayName(wallet.user)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <p className="text-lg">{wallet.user.email}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-base font-mono">{wallet.user._id.slice(0, 12)}...</p>
                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(wallet.user._id)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Wallet Status</label>
                  <div className="flex items-center mt-1">
                    <Badge variant={wallet.status === 'ACTIVE' ? 'default' : wallet.status === 'BLOCKED' ? 'destructive' : 'secondary'}>
                      {wallet.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Wallet Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Balance</label>
                  <p className="text-2xl font-bold text-primary">{formatWalletBalance(wallet)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Currency</label>
                  <div className="flex items-center mt-1">
                    <Badge variant="outline">{wallet.currency}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Transaction</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">{formatWalletDate(wallet.last_transaction_at)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Wallet Created</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">{formatWalletDate(wallet.createdAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2" />
                <p>Transaction history feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <Badge variant={wallet.status === 'ACTIVE' ? "default" : wallet.status === 'BLOCKED' ? "destructive" : "secondary"}>
                  {wallet.status}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                {wallet.status === 'ACTIVE' 
                  ? "This wallet is active and can be used for transactions."
                  : wallet.status === 'BLOCKED'
                  ? "This wallet is blocked and cannot be used for transactions."
                  : "This wallet is inactive and cannot be used for transactions."
                }
              </div>
            </CardContent>
          </Card>

          {/* Wallet Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Wallet ID</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{wallet._id.slice(-8)}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{new Date(wallet.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">{wallet.updatedAt ? new Date(wallet.updatedAt).toLocaleDateString() : 'Never'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Wallet
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleToggleStatus(wallet.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE')}
                disabled={actionLoading === 'activate' || actionLoading === 'blocked'}
              >
                {actionLoading === 'activate' || actionLoading === 'blocked' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : wallet.status === 'ACTIVE' ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Block Wallet
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activate Wallet
                  </>
                )}
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
              >
                {actionLoading === 'delete' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Wallet
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Use Edit to modify wallet settings</p>
              <p>• Block to prevent transactions</p>
              <p>• Activate to enable transactions</p>
              <p>• Delete permanently removes the wallet</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

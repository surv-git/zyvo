"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { defaultSiteConfig } from '@/config/site';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  IndianRupee
} from 'lucide-react';

import { WalletWithUser, WalletTableFilters, WalletStatus, WalletCurrency } from '@/types/wallet';
import { 
  getWallets, 
  deleteWallet, 
  formatWalletBalance,
  getUserDisplayName,
  getWalletServiceErrorMessage 
} from '@/services/wallet-service';
import { toast } from 'sonner';
import { useScrollPreservation } from '@/hooks/use-scroll-preservation';
import { TableFooter } from '@/components/ui/table-footer';

const WALLET_STATUSES: WalletStatus[] = ['ACTIVE', 'BLOCKED', 'INACTIVE'];
const WALLET_CURRENCIES: WalletCurrency[] = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'];

// Simple confirmation dialog component
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isDestructive?: boolean;
}

function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText = "Confirm",
  isDestructive = false 
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg">
        <div className="flex flex-col space-y-2 text-center sm:text-left">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={onClose} className="mt-2 sm:mt-0">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={isDestructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface WalletManagementTableProps {
  className?: string;
}

export function WalletManagementTable({ className }: WalletManagementTableProps) {
  const router = useRouter();
  const { preserveScroll } = useScrollPreservation();

  // State management
  const [wallets, setWallets] = useState<WalletWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWallets, setTotalWallets] = useState(0);
  const [filters, setFilters] = useState<WalletTableFilters>({
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    limit: defaultSiteConfig.admin.itemsPerPage,
  });

  // Show toast
  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'error') {
      toast.error(message);
    } else {
      toast.success(message);
    }
  };

  // Fetch wallets data
  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getWallets({
        ...filters,
        page: currentPage,
        limit: filters.limit,
      });
      
      setWallets(response.data.wallets);
      setTotalPages(response.data.pagination.total_pages);
      setTotalWallets(response.data.pagination.total_count);
    } catch (err: unknown) {
      const errorMessage = getWalletServiceErrorMessage(err);
      setError(errorMessage);
      
      // Check if it's an authentication error
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
        showToast('Please log in to access wallet management.', 'error');
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        showToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, router]);

  // Initial data fetch
  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof WalletTableFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }));
    setCurrentPage(1);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: WalletStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'BLOCKED':
        return 'destructive';
      case 'INACTIVE':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Navigation handlers
  const handleViewWallet = (id: string) => {
    preserveScroll(() => {
      router.push(`/wallets/${id}`);
    });
  };

  const handleEditWallet = (id: string) => {
    preserveScroll(() => {
      router.push(`/wallets/${id}/edit`);
    });
  };

  // Delete wallet handler
  const handleDeleteWallet = (wallet: WalletWithUser) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Wallet',
      description: `Are you sure you want to delete the wallet for ${getUserDisplayName(wallet.user)}? This action cannot be undone.`,
      onConfirm: () => confirmDeleteWallet(wallet._id),
      isDestructive: true,
    });
  };

  const confirmDeleteWallet = async (walletId: string) => {
    try {
      setActionLoading(walletId);
      await deleteWallet(walletId);
      showToast('Wallet deleted successfully', 'success');
      await fetchWallets();
    } catch (err: unknown) {
      const errorMessage = getWalletServiceErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Wallet Management</CardTitle>
          <CardDescription>
            Manage user wallets, balances, and transaction histories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by user email or name..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {WALLET_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.currency || 'all'}
              onValueChange={(value) => handleFilterChange('currency', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                {WALLET_CURRENCIES.map(currency => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.sort_by || 'created_at'}
              onValueChange={(value) => handleFilterChange('sort_by', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created</SelectItem>
                <SelectItem value="updated_at">Updated</SelectItem>
                <SelectItem value="balance">Balance</SelectItem>
                <SelectItem value="last_transaction_at">Last Transaction</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.sort_order || 'desc'}
              onValueChange={(value) => handleFilterChange('sort_order', value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchWallets}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchWallets} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && wallets.length === 0 && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading wallets...</p>
            </div>
          )}

          {/* Table */}
          {!error && !loading && (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Transaction</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No wallets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    wallets.map((wallet) => (
                      <TableRow key={wallet._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">{getUserDisplayName(wallet.user)}</div>
                              <div className="text-sm text-muted-foreground">{wallet.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formatWalletBalance(wallet)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{wallet.currency}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(wallet.status)}>
                            {wallet.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(wallet.last_transaction_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(wallet.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewWallet(wallet._id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditWallet(wallet._id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Wallet
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteWallet(wallet)}
                                disabled={actionLoading === wallet._id}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {actionLoading === wallet._id ? 'Deleting...' : 'Delete Wallet'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Table Footer with Pagination */}
          {!error && !loading && wallets.length > 0 && (
            <TableFooter
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={filters.limit || defaultSiteConfig.admin.itemsPerPage}
              totalItems={totalWallets}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newLimit) => setFilters(prev => ({ ...prev, limit: newLimit }))}
              itemsPerPageOptions={defaultSiteConfig.admin.itemsPerPageOptions}
            />
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog {...confirmDialog} onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />
    </>
  );
}

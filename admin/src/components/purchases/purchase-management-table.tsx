"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
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
  Copy,
  FileText,
  Calendar,
  User,
  Package,
  DollarSign,
  ShoppingCart,
  Truck,
  XCircle,
  Clock,
  CheckCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

import { Purchase, PurchaseTableFilters } from '@/types/purchase';
import { 
  getPurchases, 
  deletePurchase, 
  PurchaseServiceError 
} from '@/services/purchase-service';
import { toast } from 'sonner';
import { useScrollPreservation } from '@/hooks/use-scroll-preservation';
import { TableFooter } from '@/components/ui/table-footer';
import { defaultSiteConfig } from '@/config/site';

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Planned': Clock,
  'Pending': ShoppingCart,
  'Partially Received': Truck,
  'Completed': CheckCircle,
  'Cancelled': XCircle,
};

const statusColors: Record<string, string> = {
  'Planned': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  'Pending': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  'Partially Received': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
};

const statusIconColors: Record<string, string> = {
  'Planned': 'text-blue-600 dark:text-blue-400',
  'Pending': 'text-amber-600 dark:text-amber-400',
  'Partially Received': 'text-purple-600 dark:text-purple-400',
  'Completed': 'text-emerald-600 dark:text-emerald-400',
  'Cancelled': 'text-rose-600 dark:text-rose-400',
};

const statusLabels: Record<string, string> = {
  'Planned': 'Planned',
  'Pending': 'Pending',
  'Partially Received': 'Partially Received',
  'Completed': 'Completed',
  'Cancelled': 'Cancelled',
};

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

interface PurchaseManagementTableProps {
  className?: string;
}

export default function PurchaseManagementTable({ className }: PurchaseManagementTableProps) {
  const router = useRouter();
  const { preserveScroll } = useScrollPreservation();

  // State management
  const [purchases, setPurchases] = useState<Purchase[]>([]);
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
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(defaultSiteConfig.admin.itemsPerPage);
  const [filters, setFilters] = useState<PurchaseTableFilters>({
    search: '',
    sort: 'createdAt',
    order: 'desc',
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

  // Get purchase service error message
  const getPurchaseServiceErrorMessage = (err: unknown): string => {
    if (err instanceof PurchaseServiceError) {
      return err.message;
    }
    if (err && typeof err === 'object' && 'status' in err) {
      const errorWithStatus = err as { status: number; message?: string };
      if (errorWithStatus.status === 401) {
        return 'Authentication required. Please log in to access purchase management.';
      }
      if (errorWithStatus.status === 403) {
        return 'You do not have permission to perform this action.';
      }
      if (errorWithStatus.status === 404) {
        return 'The requested purchase was not found.';
      }
      if (errorWithStatus.status >= 500) {
        return 'Server error occurred. Please try again later.';
      }
      return errorWithStatus.message || 'An unexpected error occurred. Please try again.';
    }
    if (err && typeof err === 'object' && 'message' in err) {
      return (err as { message: string }).message;
    }
    return 'An unexpected error occurred. Please try again.';
  };

  // Fetch purchases data
  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getPurchases({
        ...filters,
        page: currentPage,
        limit: itemsPerPage,
      });
      
      setPurchases(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalPurchases(response.pagination.totalItems);
    } catch (err: unknown) {
      const errorMessage = getPurchaseServiceErrorMessage(err);
      setError(errorMessage);
      
      // Check if it's an authentication error
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
        showToast('Please log in to access purchase management.', 'error');
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
  }, [filters, currentPage, itemsPerPage, router]);

  // Initial data fetch
  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof PurchaseTableFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }));
    setCurrentPage(1);
  };

  // Handle sort changes
  const handleSortChange = (field: 'purchase_order_number' | 'status' | 'quantity' | 'landing_price' | 'createdAt') => {
    setFilters(prev => ({
      ...prev,
      sort: field,
      order: prev.sort === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
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

  // Truncate ID for display
  const truncateId = (id: string) => {
    return `${id.slice(0, 8)}...${id.slice(-4)}`;
  };

  // Navigation handlers
  const handleViewPurchase = (id: string) => {
    router.push(`/purchases/${id}`);
  };

  const handleEditPurchase = (id: string) => {
    router.push(`/purchases/${id}/edit`);
  };

  // Purchase action handlers
  const handleDeletePurchase = async (id: string, orderNumber: string) => {
    try {
      setActionLoading(id);
      await deletePurchase(id);
      showToast(`Purchase "${orderNumber}" has been deleted successfully.`, 'success');
      fetchPurchases(); // Refresh the list
    } catch (err: unknown) {
      const errorMessage = getPurchaseServiceErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Confirmation dialogs
  const confirmDelete = (purchase: Purchase) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Purchase',
      description: `Are you sure you want to permanently delete purchase "${purchase.purchase_order_number}"? This action cannot be undone.`,
      onConfirm: () => handleDeletePurchase(purchase.id || purchase._id, purchase.purchase_order_number),
      isDestructive: true,
    });
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    preserveScroll(() => {
      setCurrentPage(page);
    });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Get sort icon
  const getSortIcon = (field: 'purchase_order_number' | 'status' | 'quantity' | 'landing_price' | 'createdAt') => {
    if (filters.sort !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return filters.order === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Purchase Management</CardTitle>
          <CardDescription>
            Manage purchase orders and track supplier deliveries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search purchases, suppliers, or order numbers..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.status === undefined ? 'all' : filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Planned">Planned</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partially Received">Partially Received</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.sort || 'createdAt'}
              onValueChange={(value) => handleFilterChange('sort', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="purchase_order_number">Order #</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="quantity">Quantity</SelectItem>
                <SelectItem value="landing_price">Price</SelectItem>
                <SelectItem value="createdAt">Created</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.order || 'desc'}
              onValueChange={(value) => handleFilterChange('order', value)}
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
              onClick={fetchPurchases}
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
              <div className="flex gap-2 justify-center">
                {error.includes('Authentication required') || error.includes('log in') ? (
                  <Button onClick={() => router.push('/login')} className="mt-2">
                    Go to Login
                  </Button>
                ) : (
                  <Button onClick={fetchPurchases} className="mt-2">
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground mt-2">Loading purchases...</p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <>
              <div className="table-container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortChange('purchase_order_number')}
                          className="h-auto p-0 font-semibold"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Order #
                          {getSortIcon('purchase_order_number')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Supplier
                        </div>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortChange('status')}
                          className="h-auto p-0 font-semibold"
                        >
                          Status
                          {getSortIcon('status')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Product
                        </div>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortChange('quantity')}
                          className="h-auto p-0 font-semibold"
                        >
                          Quantity
                          {getSortIcon('quantity')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortChange('landing_price')}
                          className="h-auto p-0 font-semibold"
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Landing Price
                          {getSortIcon('landing_price')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortChange('createdAt')}
                          className="h-auto p-0 font-semibold"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Created
                          {getSortIcon('createdAt')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases && purchases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No purchases found
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchases?.map((purchase) => {
                        const StatusIcon = statusIcons[purchase.status];
                        
                        return (
                          <TableRow key={purchase.id || purchase._id}>                          
                            <TableCell className="font-medium">
                              <div>
                                <div className="font-medium">{purchase.purchase_order_number}</div>
                                <div className='font-mono text-xs mt-1 flex items-center text-muted-foreground'>
                                  {truncateId(purchase.id || purchase._id)}
                                  <Copy 
                                    className="ml-2 h-3 w-3 cursor-pointer hover:text-primary" 
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(purchase.id || purchase._id);
                                        toast.success('Purchase ID copied to clipboard');
                                      } catch {
                                        toast.error('Failed to copy to clipboard');
                                      }
                                    }} 
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{purchase.supplier_id.name}</div>
                              <div className="text-sm text-muted-foreground">                                
                                <div className='font-mono text-xs mt-1 flex items-center text-muted-foreground'>
                                  {truncateId(purchase.supplier_id._id || purchase.supplier_id._id)}
                                  <Copy 
                                    className="ml-2 h-3 w-3 cursor-pointer hover:text-primary" 
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(purchase.id || purchase._id);
                                        toast.success('Purchase ID copied to clipboard');
                                      } catch {
                                        toast.error('Failed to copy to clipboard');
                                      }
                                    }} 
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`${statusColors[purchase.status]} flex items-center gap-1 w-fit`}
                              >
                                <StatusIcon className={`h-3 w-3 ${statusIconColors[purchase.status]}`} />
                                {statusLabels[purchase.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{purchase.product_variant_id.product_id.name}</div>
                              <div className="text-xs text-muted-foreground">
                                SKU: {purchase.product_variant_id.sku_code}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{purchase.quantity}</div>
                              <div className="text-xs text-muted-foreground">
                                Unit: ${purchase.unit_price_at_purchase}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                ${purchase.landing_price.toFixed(2)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(purchase.createdAt)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(purchase.createdAt), { addSuffix: true })}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0"
                                    disabled={actionLoading === (purchase.id || purchase._id)}
                                  >
                                    {actionLoading === (purchase.id || purchase._id) ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreHorizontal className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewPurchase(purchase.id || purchase._id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditPurchase(purchase.id || purchase._id)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => confirmDelete(purchase)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Table Footer */}
              {totalPurchases > 0 && (
                <TableFooter
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalPurchases}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  showItemsPerPageSelector={true}
                  entityName="purchases"
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        isDestructive={confirmDialog.isDestructive}
      />
    </>
  );
}

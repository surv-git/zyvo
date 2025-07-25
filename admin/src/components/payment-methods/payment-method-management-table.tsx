"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { TableFooter } from '@/components/ui/table-footer';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  CreditCard,
  Wallet,
  Smartphone,
  Building,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  Star,
  Loader2,
  Calendar,
  User,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  PaymentMethod, 
  PaymentMethodTableFilters, 
  PaymentMethodListResponse, 
  PaymentMethodPagination,
  PaymentMethodType,
  getPaymentMethodTypeLabel,
  getPaymentMethodTypeColor,
  formatPaymentMethodDetails
} from '@/types/payment-method';
import { 
  getPaymentMethods, 
  deletePaymentMethod, 
  activatePaymentMethod, 
  deactivatePaymentMethod 
} from '@/services/payment-method-service';
import { defaultSiteConfig } from '@/config/site';

export function PaymentMethodManagementTable() {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaymentMethodPagination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = React.useState<PaymentMethodTableFilters>({
    page: 1,
    limit: defaultSiteConfig.admin.itemsPerPage,
    search: '',
    method_type: undefined,
    is_active: undefined,
    is_default: undefined,
    user_id: undefined,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Computed values from pagination
  const totalCount = pagination?.total_count || 0;
  const currentPage = pagination?.current_page || 1;
  const totalPages = pagination?.total_pages || 1;

  // Fetch payment methods data
  const fetchPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      const response: PaymentMethodListResponse = await getPaymentMethods(filters);
      setPaymentMethods(response.data.payment_methods);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError('Failed to fetch payment methods');
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [filters, fetchPaymentMethods]);

  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value || undefined,
      page: 1
    }));
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof PaymentMethodTableFilters, value: PaymentMethodTableFilters[keyof PaymentMethodTableFilters]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  // Handle sorting
  const handleSort = (field: string) => {
    const validSortFields = ['created_at', 'updated_at', 'alias', 'method_type', 'is_active', 'is_default'] as const;
    const sortField = validSortFields.includes(field as typeof validSortFields[number]) ? field as PaymentMethodTableFilters['sort_by'] : 'created_at';
    
    setFilters(prev => ({
      ...prev,
      sort_by: sortField,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handle items per page change
  const handleItemsPerPageChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  // Handle view payment method
  const handleView = (id: string) => {
    router.push(`/payment-methods/${id}`);
  };

  // Handle edit payment method
  const handleEdit = (id: string) => {
    router.push(`/payment-methods/${id}/edit`);
  };

  // Handle delete payment method
  const handleDelete = async (paymentMethod: PaymentMethod) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${paymentMethod.alias}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading(paymentMethod._id);

    try {
      await deletePaymentMethod(paymentMethod._id);
      toast.success('Payment method deleted successfully');
      fetchPaymentMethods();
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      toast.error('Failed to delete payment method');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (paymentMethod: PaymentMethod) => {
    setActionLoading(paymentMethod._id);

    try {
      if (paymentMethod.is_active) {
        await deactivatePaymentMethod(paymentMethod._id);
        toast.success('Payment method deactivated successfully');
      } else {
        await activatePaymentMethod(paymentMethod._id);
        toast.success('Payment method activated successfully');
      }
      fetchPaymentMethods();
    } catch (error) {
      console.error('Failed to toggle payment method status:', error);
      toast.error('Failed to update payment method status');
    } finally {
      setActionLoading(null);
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (type: PaymentMethodType) => {
    switch (type) {
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return CreditCard;
      case 'UPI':
        return Smartphone;
      case 'WALLET':
        return Wallet;
      case 'NETBANKING':
        return Building;
      default:
        return CreditCard;
    }
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (filters.sort_by !== field) return ArrowUpDown;
    return filters.sort_order === 'asc' ? ArrowUp : ArrowDown;
  };

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(filters.search || filters.method_type || filters.is_active !== undefined || 
             filters.is_default !== undefined || filters.user_id || filters.start_date || filters.end_date);
  }, [filters]);

  return (
    <>
      {/* Error Display */}
      {error && (
        <Card className="border-destructive mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <XCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payment Method Management</CardTitle>
          <CardDescription>
            Manage payment methods, status, and default settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search payment methods..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.method_type || 'all'}
              onValueChange={(value) => handleFilterChange('method_type', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Method Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="WALLET">Wallet</SelectItem>
                <SelectItem value="NETBANKING">Net Banking</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.is_active === undefined ? 'all' : filters.is_active.toString()}
              onValueChange={(value) => handleFilterChange('is_active', value === 'all' ? undefined : value === 'true')}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.is_default === undefined ? 'all' : filters.is_default.toString()}
              onValueChange={(value) => handleFilterChange('is_default', value === 'all' ? undefined : value === 'true')}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Default</SelectItem>
                <SelectItem value="false">Not Default</SelectItem>
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
                <SelectItem value="alias">Name</SelectItem>
                <SelectItem value="method_type">Type</SelectItem>
                <SelectItem value="created_at">Created</SelectItem>
                <SelectItem value="updated_at">Updated</SelectItem>
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
              onClick={fetchPaymentMethods}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground mt-2">Loading payment methods...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchPaymentMethods} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <>
              <div className="table-container">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Button variant="ghost" size="sm" className="h-8 p-0">
                      <span className="sr-only">Icon</span>
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 p-0 hover:bg-transparent"
                      onClick={() => handleSort('alias')}
                    >
                      Payment Method
                      {React.createElement(getSortIcon('alias'), { className: "ml-2 h-4 w-4" })}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 p-0 hover:bg-transparent"
                      onClick={() => handleSort('method_type')}
                    >
                      Type
                      {React.createElement(getSortIcon('method_type'), { className: "ml-2 h-4 w-4" })}
                    </Button>
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 p-0 hover:bg-transparent"
                      onClick={() => handleSort('is_active')}
                    >
                      Status
                      {React.createElement(getSortIcon('is_active'), { className: "ml-2 h-4 w-4" })}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 p-0 hover:bg-transparent"
                      onClick={() => handleSort('created_at')}
                    >
                      Created
                      {React.createElement(getSortIcon('created_at'), { className: "ml-2 h-4 w-4" })}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading payment methods...</p>
                    </TableCell>
                  </TableRow>
                ) : paymentMethods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">No payment methods found</p>
                      <p className="text-muted-foreground mb-4">
                        {hasActiveFilters ? 'Try adjusting your filters' : 'Get started by adding your first payment method'}
                      </p>
                      {!hasActiveFilters && (
                        <Button onClick={() => router.push('/payment-methods/new')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Payment Method
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentMethods.map((paymentMethod) => {
                    const IconComponent = getPaymentMethodIcon(paymentMethod.method_type);
                    const isLoading = actionLoading === paymentMethod._id;

                    return (
                      <TableRow 
                        key={paymentMethod._id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleView(paymentMethod._id)}
                      >
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{paymentMethod.alias}</p>
                            {paymentMethod.is_default && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getPaymentMethodTypeColor(paymentMethod.method_type)}>
                            {getPaymentMethodTypeLabel(paymentMethod.method_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{paymentMethod.user_id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground">
                            {formatPaymentMethodDetails(paymentMethod)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant={paymentMethod.is_active ? "default" : "secondary"}>
                              {paymentMethod.is_active ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(paymentMethod.createdAt).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={isLoading}>
                                {isLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(paymentMethod._id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(paymentMethod._id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(paymentMethod)}
                                disabled={isLoading}
                              >
                                {paymentMethod.is_active ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(paymentMethod)}
                                disabled={isLoading}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
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
            </>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground mt-2">Loading payment methods...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchPaymentMethods} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {/* Table Footer with Pagination */}
          {!loading && paymentMethods.length > 0 && (
            <TableFooter
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={filters.limit || defaultSiteConfig.admin.itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              showItemsPerPageSelector={true}
              entityName="payment methods"
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableFooter } from '@/components/ui/table-footer';
import { 
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  ShoppingCart,
  User,
  DollarSign,
  Calendar,
  AlertCircle,
  Loader2,
  SortAsc,
  SortDesc,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getCarts,
  deleteCart,
  clearCart,
  getCartServiceErrorMessage 
} from '@/services/cart-service';
import { Cart, CartTableFilters } from '@/types/cart';
import { defaultSiteConfig } from '@/config/site';

interface CartManagementTableProps {
  className?: string;
  initialPage?: number;
  initialLimit?: number;
}

export default function CartManagementTable({ 
  className,
  initialPage = 1, 
  initialLimit = defaultSiteConfig.admin.itemsPerPage 
}: CartManagementTableProps) {
  // State
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<CartTableFilters>({
    page: initialPage,
    limit: initialLimit,
    sort_by: 'updated_at',
    sort_order: 'desc',
    user_id: undefined,
    has_items: undefined,
    has_coupon: undefined,
    min_total: undefined,
    max_total: undefined,
    date_from: undefined,
    date_to: undefined,
  });
  
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 0,
    total_items: 0,
    has_next_page: false,
    has_prev_page: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  
  // Load carts data
  const loadCarts = useCallback(async (showLoading = true) => {
    try {
      console.log('🛒 Loading carts data...');
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      console.log('📡 Making API call to getCarts with filters:', filters);
      const response = await getCarts(filters);
      console.log('✅ API response received:', response);
      
      if (response.success) {
        setCarts(response.data);
        setPagination({
          current_page: response.pagination.current_page,
          total_pages: response.pagination.total_pages,
          total_items: response.pagination.total_items,
          has_next_page: response.pagination.has_next_page,
          has_prev_page: response.pagination.has_prev_page,
        });
        console.log('✅ Carts loaded successfully:', response.data.length, 'items');
      } else {
        throw new Error('Failed to fetch carts');
      }
    } catch (error) {
      console.error('❌ Error loading carts:', error);
      const errorMessage = getCartServiceErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCarts();
  }, [loadCarts]);

  const handleFilterChange = (key: keyof CartTableFilters, value: string | number | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (typeof value === 'string' ? parseInt(value) : value as number),
    }));
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    handleFilterChange('user_id', value || undefined);
  };

  const handleRefresh = () => {
    loadCarts(false);
  };

  const handleView = (cart: Cart) => {
    router.push(`/carts/${cart._id}`);
  };

  const handleEdit = (cart: Cart) => {
    router.push(`/carts/${cart._id}/edit`);
  };

  const handleDelete = async (cart: Cart) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this cart? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading(`delete-${cart._id}`);

    try {
      await deleteCart(cart._id);
      toast.success('Cart deleted successfully');
      loadCarts(false);
    } catch (error) {
      console.error('Failed to delete cart:', error);
      const errorMessage = getCartServiceErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearCart = async (cart: Cart) => {
    const confirmed = window.confirm(
      `Are you sure you want to clear all items from this cart?`
    );

    if (!confirmed) return;

    setActionLoading(`clear-${cart._id}`);

    try {
      await clearCart(cart._id);
      toast.success('Cart cleared successfully');
      loadCarts(false);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      const errorMessage = getCartServiceErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSort = (column: 'created_at' | 'updated_at' | 'cart_total_amount' | 'user_id') => {
    const newOrder = filters.sort_by === column && filters.sort_order === 'asc' ? 'desc' : 'asc';
    handleFilterChange('sort_by', column);
    handleFilterChange('sort_order', newOrder);
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: initialLimit,
      sort_by: 'updated_at',
      sort_order: 'desc',
      user_id: undefined,
      has_items: undefined,
      has_coupon: undefined,
      min_total: undefined,
      max_total: undefined,
      date_from: undefined,
      date_to: undefined,
    });
    setSearchTerm('');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading carts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart Management
              </CardTitle>
              <CardDescription>
                Manage shopping carts, view details, and track customer activity
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by user ID..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
                <div>
                  <label className="text-sm font-medium mb-1 block">Has Items</label>
                  <Select
                    value={filters.has_items || ''}
                    onValueChange={(value) => handleFilterChange('has_items', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All carts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">With Items</SelectItem>
                      <SelectItem value="false">Empty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Has Coupon</label>
                  <Select
                    value={filters.has_coupon || ''}
                    onValueChange={(value) => handleFilterChange('has_coupon', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All carts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">With Coupon</SelectItem>
                      <SelectItem value="false">No Coupon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Min Total</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={filters.min_total || ''}
                    onChange={(e) => handleFilterChange('min_total', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Max Total</label>
                  <Input
                    type="number"
                    placeholder="999.99"
                    value={filters.max_total || ''}
                    onChange={(e) => handleFilterChange('max_total', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Date From</label>
                  <Input
                    type="date"
                    value={filters.date_from?.split('T')[0] || ''}
                    onChange={(e) => handleFilterChange('date_from', e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Date To</label>
                  <Input
                    type="date"
                    value={filters.date_to?.split('T')[0] || ''}
                    onChange={(e) => handleFilterChange('date_to', e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined)}
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-1 flex items-end">
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {carts.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No carts found</h3>
              <p className="text-muted-foreground">No shopping carts match your current filters.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-semibold"
                          onClick={() => handleSort('user_id')}
                        >
                          User
                          {filters.sort_by === 'user_id' && (
                            filters.sort_order === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-semibold"
                          onClick={() => handleSort('cart_total_amount')}
                        >
                          Total Amount
                          {filters.sort_by === 'cart_total_amount' && (
                            filters.sort_order === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Coupon</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-semibold"
                          onClick={() => handleSort('updated_at')}
                        >
                          Last Updated
                          {filters.sort_by === 'updated_at' && (
                            filters.sort_order === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carts.map((cart) => (
                      <TableRow key={cart._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{cart.user_id.name}</div>
                              <div className="text-sm text-muted-foreground">{cart.user_id.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant={cart.has_items ? 'default' : 'secondary'}>
                              {cart.item_count} {cart.item_count === 1 ? 'item' : 'items'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(cart.cart_total_amount)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {cart.applied_coupon_code ? (
                            <div className="flex flex-col">
                              <Badge variant="outline" className="mb-1">
                                {cart.applied_coupon_code}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                -{new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD',
                                }).format(cart.coupon_discount_amount)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No coupon</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(cart.last_updated_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleView(cart)}
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(cart)}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Cart
                              </DropdownMenuItem>
                              {cart.has_items && (
                                <DropdownMenuItem
                                  onClick={() => handleClearCart(cart)}
                                  className="cursor-pointer"
                                  disabled={actionLoading === `clear-${cart._id}`}
                                >
                                  {actionLoading === `clear-${cart._id}` ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Clear Items
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDelete(cart)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                                disabled={actionLoading === `delete-${cart._id}`}
                              >
                                {actionLoading === `delete-${cart._id}` ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Delete Cart
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <TableFooter
                currentPage={pagination.current_page}
                totalPages={pagination.total_pages}
                totalItems={pagination.total_items}
                itemsPerPage={filters.limit || initialLimit}
                onPageChange={(page) => handleFilterChange('page', page)}
                onItemsPerPageChange={(size: number) => handleFilterChange('limit', size)}
                entityName="carts"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

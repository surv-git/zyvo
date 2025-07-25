"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TableFooter } from '@/components/ui/table-footer';
import { 
  Loader2, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Heart, 
  User, 
  Package,
  RefreshCw,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  Power,
  PowerOff
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getFavorites, 
  deleteFavorite, 
  activateFavorite, 
  deactivateFavorite,
  getStatusBadgeVariant,
  getStatusLabel,
  formatPrice,
  formatDate,
  truncateText,
  FavoriteServiceError
} from '@/services/favorite-service';
import { Favorite, FavoriteTableFilters } from '@/types/favorite';
import { defaultSiteConfig } from '@/config/site';

interface FavoriteManagementTableProps {
  className?: string;
  initialPage?: number;
  initialLimit?: number;
}

export default function FavoriteManagementTable({ 
  className,
  initialPage = 1, 
  initialLimit = defaultSiteConfig.admin.itemsPerPage 
}: FavoriteManagementTableProps) {
  // State
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<FavoriteTableFilters>({
    page: initialPage,
    limit: initialLimit,
    sort_by: 'added_at',
    sort_order: 'desc',
    search: '',
    include_inactive: false,
  });
  
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 0,
    total_items: 0,
    has_next_page: false,
    has_prev_page: false,
  });

      // Load favorites data
  const loadFavorites = useCallback(async (showLoading = true) => {
    try {
      console.log('🔄 Loading favorites data...');
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      console.log('📡 Making API call to getFavorites with filters:', filters);
      const response = await getFavorites(filters);
      console.log('✅ API response received:', response);
      
      if (response.success) {
        setFavorites(response.data);
        setPagination({
          current_page: response.pagination.current_page,
          total_pages: response.pagination.total_pages,
          total_items: response.pagination.total_items,
          has_next_page: response.pagination.has_next_page,
          has_prev_page: response.pagination.has_prev_page,
        });
        console.log('✅ Favorites loaded successfully:', response.data.length, 'items');
      } else {
        throw new Error('Failed to fetch favorites');
      }
    } catch (error) {
      console.error('❌ Error loading favorites:', error);
      if (error instanceof FavoriteServiceError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to load favorites. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleFilterChange = (key: keyof FavoriteTableFilters, value: string | number | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (typeof value === 'string' ? parseInt(value) : value as number),
    }));
  };

  const handleSearch = (value: string) => {
    handleFilterChange('search', value || undefined);
  };

  const handleRefresh = () => {
    loadFavorites(false);
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: defaultSiteConfig.admin.itemsPerPage,
      sort_by: 'added_at',
      sort_order: 'desc',
      search: undefined,
      include_inactive: false,
    });
  };

  const handleSort = (column: string) => {
    const sortBy = column as FavoriteTableFilters['sort_by'];
    setFilters(prev => ({
      ...prev,
      sort_by: sortBy,
      sort_order: prev.sort_by === sortBy && prev.sort_order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const getSortIcon = (column: string) => {
    if (filters.sort_by !== column) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return filters.sort_order === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-foreground" />
      : <ArrowDown className="h-4 w-4 text-foreground" />;
  };

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(column)}
        className="h-auto p-0 font-medium hover:bg-transparent"
      >
        <div className="flex items-center gap-2">
          {children}
          {getSortIcon(column)}
        </div>
      </Button>
    </TableHead>
  );

  // Delete favorite
  const handleDelete = async (id: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete the favorite for "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(id);
      await deleteFavorite(id);
      
      toast.success('Favorite deleted successfully.');
      
      await loadFavorites(false);
    } catch (error) {
      console.error('Error deleting favorite:', error);
      if (error instanceof FavoriteServiceError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete favorite. Please try again.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle favorite status
  const handleToggleStatus = async (id: string, isActive: boolean, productName: string) => {
    const action = isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} the favorite for "${productName}"?`)) {
      return;
    }

    try {
      setActionLoading(id);
      
      if (isActive) {
        await deactivateFavorite(id);
        toast.success('Favorite deactivated successfully.');
      } else {
        await activateFavorite(id);
        toast.success('Favorite activated successfully.');
      }
      
      await loadFavorites(false);
    } catch (error) {
      console.error(`Error ${action}ing favorite:`, error);
      if (error instanceof FavoriteServiceError) {
        toast.error(error.message);
      } else {
        toast.error(`Failed to ${action} favorite. Please try again.`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Favorites Management</CardTitle>
        <CardDescription>
          Manage user favorites, product preferences, and wishlist items
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search favorites..."
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={filters.include_inactive ? 'all' : 'active'}
              onValueChange={(value) => handleFilterChange('include_inactive', value === 'all')}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="all">All Status</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <SortableHeader column="user_id">User</SortableHeader>
                  <TableHead>Price</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <SortableHeader column="added_at">Added</SortableHeader>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {favorites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Heart className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No favorites found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  favorites.map((favorite) => (
                    <TableRow key={favorite._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {favorite.product_variant_id.images.length > 0 && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={favorite.product_variant_id.images[0]}
                                alt={favorite.product_variant_id.product_id.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  const sibling = target.nextElementSibling as HTMLElement;
                                  target.style.display = 'none';
                                  if (sibling) sibling.style.display = 'flex';
                                }}
                              />
                              <div className="hidden w-full h-full items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="font-medium">
                              {truncateText(favorite.product_variant_id.product_id.name, 40)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {favorite.product_variant_id.sku_code}
                            </div>
                            {favorite.user_notes && (
                              <div className="text-xs text-muted-foreground italic">
                                &ldquo;{truncateText(favorite.user_notes, 50)}&rdquo;
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">{favorite.user_id.name}</div>
                            <div className="text-xs text-muted-foreground">{favorite.user_id.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {favorite.product_variant_id.discount_details.is_on_sale ? (
                            <div>
                              <div className="text-sm font-medium text-green-600">
                                {formatPrice(favorite.product_variant_id.discount_details.price!)}
                              </div>
                              <div className="text-xs text-muted-foreground line-through">
                                {formatPrice(favorite.product_variant_id.price)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm font-medium">
                              {formatPrice(favorite.product_variant_id.price)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">
                            {favorite.product_variant_id.average_rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({favorite.product_variant_id.reviews_count})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(favorite.is_active)}>
                          {getStatusLabel(favorite.is_active)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(favorite.added_at)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              disabled={actionLoading === favorite._id}
                            >
                              {actionLoading === favorite._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/favorites/${favorite._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/favorites/${favorite._id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(
                                favorite._id, 
                                favorite.is_active, 
                                favorite.product_variant_id.product_id.name
                              )}
                            >
                              {favorite.is_active ? (
                                <>
                                  <PowerOff className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(favorite._id, favorite.product_variant_id.product_id.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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

          {/* Pagination */}
          {pagination.total_items > 0 && (
            <TableFooter
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              totalItems={pagination.total_items}
              itemsPerPage={filters.limit || defaultSiteConfig.admin.itemsPerPage}
              onPageChange={(page) => handleFilterChange('page', page)}
              onItemsPerPageChange={(limit) => handleFilterChange('limit', limit)}
              itemsPerPageOptions={defaultSiteConfig.admin.itemsPerPageOptions}
              showItemsPerPageSelector={true}
              entityName="favorites"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

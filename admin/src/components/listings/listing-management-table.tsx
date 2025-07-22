"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getSiteConfigSync } from '@/config/site';
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
import { TableFooter } from '@/components/ui/table-footer';
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

import { Listing, ListingTableFilters, ListingStatus, Platform } from '@/types/listing';
import { 
  getListingList, 
  deleteListing, 
  syncListing,
  getAvailablePlatforms,
  getListingServiceErrorMessage 
} from '@/services/listing-service';
import { toast } from 'sonner';

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

interface ListingManagementTableProps {
  className?: string;
}

export default function ListingManagementTable({ className }: ListingManagementTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [listings, setListings] = useState<Listing[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformsLoading, setPlatformsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [totalPages, setTotalPages] = useState(1);
  const [totalListings, setTotalListings] = useState(0);

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

  // Filters from URL parameters
  const filters = useMemo((): ListingTableFilters => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || getSiteConfigSync().admin.itemsPerPage.toString()),
    search: searchParams.get('search') || '',
    platform_id: searchParams.get('platform_id') || undefined,
    product_variant_id: searchParams.get('product_variant_id') || undefined,
    listing_status: searchParams.get('listing_status') as ListingStatus || undefined,
    is_active_on_platform: searchParams.get('is_active_on_platform') ? searchParams.get('is_active_on_platform') === 'true' : undefined,
    platform_sku: searchParams.get('platform_sku') || undefined,
    platform_product_id: searchParams.get('platform_product_id') || undefined,
    needs_sync: searchParams.get('needs_sync') ? searchParams.get('needs_sync') === 'true' : undefined,
    has_price: searchParams.get('has_price') ? searchParams.get('has_price') === 'true' : undefined,
    sort_by: (searchParams.get('sort_by') as ListingTableFilters['sort_by']) || 'createdAt',
    sort_order: (searchParams.get('sort_order') as ListingTableFilters['sort_order']) || 'desc',
  }), [searchParams]);

  // Update URL parameters
  const updateFilters = useCallback((newFilters: Partial<ListingTableFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === null) {
        params.delete(key);
      } else {
        params.set(key, value.toString());
      }
    });

    router.push(`/listings?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Show toast
  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'error') {
      toast.error(message);
    } else {
      toast.success(message);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: number) => {
    updateFilters({ limit: value, page: 1 });
  };

  // Fetch listings data
  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getListingList(filters);
      
      setListings(response.listings);
      setTotalPages(response.totalPages);
      setTotalListings(response.total);
      
    } catch (err: unknown) {
      console.error('Failed to fetch listings:', err);
      const errorMessage = getListingServiceErrorMessage(err);
      setError(errorMessage);
      
      // Check if it's an authentication error
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
        showToast('Please log in to access listing management.', 'error');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        showToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, router]);

  // Initial data fetch
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Load available platforms
  useEffect(() => {
    const loadPlatforms = async () => {
      try {
        setPlatformsLoading(true);
        const platformData = await getAvailablePlatforms();
        setPlatforms(platformData);
      } catch (error) {
        console.error('Error loading platforms:', error);
      } finally {
        setPlatformsLoading(false);
      }
    };

    loadPlatforms();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        updateFilters({ search: searchTerm, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, updateFilters]);

  // Initialize search term from URL
  useEffect(() => {
    setSearchTerm(filters.search || '');
  }, [filters.search]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof ListingTableFilters, value: ListingTableFilters[keyof ListingTableFilters]) => {
    const newFilters: Partial<ListingTableFilters> = {
      [key]: value,
      page: key !== 'page' ? 1 : (value as number)
    };
    updateFilters(newFilters);
  }, [updateFilters]);

  // Handle sort changes
  const handleSortChange = (field: string) => {
    const newOrder = filters.sort_by === field && filters.sort_order === 'asc' ? 'desc' : 'asc';
    updateFilters({
      sort_by: field as ListingTableFilters['sort_by'],
      sort_order: newOrder,
      page: 1
    });
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (filters.sort_by !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return filters.sort_order === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: ListingStatus) => {
    switch (status) {
      case 'Live':
        return 'default';
      case 'Draft':
        return 'secondary';
      case 'Pending Review':
        return 'outline';
      case 'Rejected':
        return 'destructive';
      case 'Deactivated':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Truncate ID
  const truncateId = (id: string) => {
    return `${id.slice(0, 8)}...`;
  };

  // Handle listing actions
  const handleViewListing = (listingId: string) => {
    router.push(`/listings/${listingId}`);
  };

  const handleEditListing = (listingId: string) => {
    router.push(`/listings/${listingId}/edit`);
  };

  const handleSyncListing = async (listingId: string, platformSku: string) => {
    try {
      setActionLoading(listingId);
      await syncListing(listingId);
      
      // Refresh the listing data
      await fetchListings();
      
      showToast(`Listing ${platformSku} has been synced successfully.`, 'success');
    } catch (err) {
      const errorMessage = getListingServiceErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteListing = async (listingId: string, platformSku: string) => {
    try {
      setActionLoading(listingId);
      await deleteListing(listingId);
      
      // Remove from local state
      setListings(prev => prev.filter(listing => listing._id !== listingId));
      setTotalListings(prev => prev - 1);
      
      showToast(`Listing ${platformSku} has been deleted.`, 'success');
    } catch (err) {
      const errorMessage = getListingServiceErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Confirmation dialogs
  const confirmDelete = (listing: Listing) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Listing',
      description: `Are you sure you want to delete the listing ${listing.platform_sku}? This action cannot be undone.`,
      onConfirm: () => handleDeleteListing(listing._id, listing.platform_sku),
      isDestructive: true,
    });
  };

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  // Refresh data
  const handleRefresh = useCallback(() => {
    fetchListings();
  }, [fetchListings]);

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Listing Management</CardTitle>
          <CardDescription>
            Manage product listings across platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.listing_status || 'all'}
              onValueChange={(value) => handleFilterChange('listing_status', value === 'all' ? undefined : value as ListingStatus)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending Review">Pending Review</SelectItem>
                <SelectItem value="Live">Live</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Deactivated">Deactivated</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.platform_id || 'all'}
              onValueChange={(value) => handleFilterChange('platform_id', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platformsLoading ? (
                  <SelectItem value="loading" disabled>
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Loading...
                  </SelectItem>
                ) : (
                  platforms.map((platform) => (
                    <SelectItem key={platform._id} value={platform._id}>
                      {platform.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Select
              value={filters.is_active_on_platform === undefined ? 'all' : filters.is_active_on_platform.toString()}
              onValueChange={(value) => handleFilterChange('is_active_on_platform', value === 'all' ? undefined : value === 'true')}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Platform Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.sort_by || 'createdAt'}
              onValueChange={(value) => handleFilterChange('sort_by', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="updatedAt">Updated</SelectItem>
                <SelectItem value="platform_price">Price</SelectItem>
                <SelectItem value="listing_status">Status</SelectItem>
                <SelectItem value="last_synced_at">Last Synced</SelectItem>
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
              onClick={handleRefresh}
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
                  <Button onClick={fetchListings} className="mt-2">
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
              <p className="text-muted-foreground mt-2">Loading listings...</p>
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
                          onClick={() => handleSortChange('platform_sku')}
                          className="h-auto p-0 font-semibold"
                        >
                          Platform SKU
                          {getSortIcon('platform_sku')}
                        </Button>
                      </TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortChange('listing_status')}
                          className="h-auto p-0 font-semibold"
                        >
                          Status
                          {getSortIcon('listing_status')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortChange('platform_price')}
                          className="h-auto p-0 font-semibold"
                        >
                          Price
                          {getSortIcon('platform_price')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortChange('last_synced_at')}
                          className="h-auto p-0 font-semibold"
                        >
                          Last Synced
                          {getSortIcon('last_synced_at')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings && listings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No listings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      listings?.map((listing) => (
                        <TableRow key={listing._id}>                          
                          <TableCell className="font-medium">
                            {listing.platform_sku}
                            <div className='font-mono text-xs mt-2 flex'>
                              {truncateId(listing._id)}<Copy 
                                className="ml-2 h-3 w-3 cursor-pointer hover:text-primary" 
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(listing._id);
                                    toast.success('Listing ID copied to clipboard');
                                  } catch {
                                    toast.error('Failed to copy to clipboard');
                                  }
                                }} 
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Badge variant={listing.platform_id.is_active ? 'default' : 'secondary'}>
                                {listing.platform_id.name}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{listing.product_variant_id.sku_code}</div>
                              <div className="text-sm text-muted-foreground">
                                Base: {formatCurrency(listing.product_variant_id.price)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={getStatusBadgeVariant(listing.listing_status)}>
                                {listing.listing_status}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {listing.is_active_on_platform ? 'Active' : 'Inactive'} on platform
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{formatCurrency(listing.platform_price)}</div>
                              <div className="text-xs text-muted-foreground">
                                Commission: {listing.platform_commission_percentage}%
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(listing.last_synced_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  disabled={actionLoading === listing._id}
                                >
                                  {actionLoading === listing._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewListing(listing._id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditListing(listing._id)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleSyncListing(listing._id, listing.platform_sku)}>
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Sync
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(listing.platform_id.base_url, '_blank')}>
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View on Platform
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => confirmDelete(listing)}
                                  className="text-destructive focus:text-destructive"
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

              {/* Table Footer with Pagination */}
              {totalListings > 0 && (
                <TableFooter
                  currentPage={filters.page}
                  totalPages={totalPages}
                  totalItems={totalListings}
                  itemsPerPage={filters.limit || getSiteConfigSync().admin.itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  showItemsPerPageSelector={true}
                  entityName="listings"
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

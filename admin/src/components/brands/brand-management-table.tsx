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
  Power, 
  PowerOff, 
  Trash2, 
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Copy,
  ExternalLink,
  Mail,
  Globe,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

import { Brand, BrandTableFilters, BrandStatus } from '@/types/brand';
import { 
  getBrandList, 
  activateBrand, 
  deactivateBrand, 
  deleteBrand, 
  getBrandServiceErrorMessage 
} from '@/services/brand-service';
import { toast } from 'sonner';
import { useScrollPreservation } from '@/hooks/use-scroll-preservation';
import { TableFooter } from '@/components/ui/table-footer';
import { getSiteConfigSync } from '@/config/site';

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

interface BrandManagementTableProps {
  className?: string;
}

export function BrandManagementTable({ className }: BrandManagementTableProps) {
  const router = useRouter();
  const { preserveScroll } = useScrollPreservation();

  // State management
  const [brands, setBrands] = useState<Brand[]>([]);
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
  const [totalBrands, setTotalBrands] = useState(0);
  const [filters, setFilters] = useState<BrandTableFilters>({
    search: '',
    sort: 'name',
    order: 'asc',
    page: 1,
    limit: getSiteConfigSync().admin.itemsPerPage,
  });

  // Show toast
  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'error') {
      toast.error(message);
    } else {
      toast.success(message);
    }
  };

  // Fetch brands data
  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getBrandList({
        ...filters,
        page: currentPage,
        limit: filters.limit, // Use limit from filters instead of itemsPerPage
      });
      
      setBrands(response.brands);
      setTotalPages(response.totalPages);
      setTotalBrands(response.total);
    } catch (err: any) {
      const errorMessage = getBrandServiceErrorMessage(err);
      setError(errorMessage);
      
      // Check if it's an authentication error
      if (err?.status === 401) {
        showToast('Please log in to access brand management.', 'error');
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
    fetchBrands();
  }, [fetchBrands]);

  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof BrandTableFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }));
    setCurrentPage(1);
  };

  // Handle sort changes
  const handleSortChange = (field: 'name' | 'createdAt' | 'updatedAt') => {
    setFilters(prev => ({
      ...prev,
      sort: field,
      order: prev.sort === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  // Get brand status
  const getBrandStatus = (brand: Brand): BrandStatus => {
    return brand.is_active ? 'Active' : 'Inactive';
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: BrandStatus) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Inactive':
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

  // Truncate ID for display
  const truncateId = (id: string) => {
    return `${id.slice(0, 8)}...${id.slice(-4)}`;
  };

  // Navigation handlers
  const handleViewBrand = (id: string) => {
    router.push(`/brands/${id}`);
  };

  const handleEditBrand = (id: string) => {
    router.push(`/brands/${id}/edit`);
  };

  // Brand action handlers
  const handleActivateBrand = async (id: string, name: string) => {
    try {
      setActionLoading(id);
      await activateBrand(id);
      showToast(`Brand "${name}" has been activated successfully.`, 'success');
      fetchBrands(); // Refresh the list
    } catch (err: any) {
      const errorMessage = getBrandServiceErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateBrand = async (id: string, name: string) => {
    try {
      setActionLoading(id);
      await deactivateBrand(id);
      showToast(`Brand "${name}" has been deactivated successfully.`, 'success');
      fetchBrands(); // Refresh the list
    } catch (err: any) {
      const errorMessage = getBrandServiceErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBrand = async (id: string, name: string) => {
    try {
      setActionLoading(id);
      await deleteBrand(id);
      showToast(`Brand "${name}" has been deleted successfully.`, 'success');
      fetchBrands(); // Refresh the list
    } catch (err: any) {
      const errorMessage = getBrandServiceErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Confirmation dialogs
  const confirmDeactivate = (brand: Brand) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Deactivate Brand',
      description: `Are you sure you want to deactivate "${brand.name}"? This will hide the brand from public listings.`,
      onConfirm: () => handleDeactivateBrand(brand._id, brand.name),
    });
  };

  const confirmDelete = (brand: Brand) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Brand',
      description: `Are you sure you want to permanently delete "${brand.name}"? This action cannot be undone and will affect all associated products.`,
      onConfirm: () => handleDeleteBrand(brand._id, brand.name),
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
    setFilters(prev => ({ ...prev, limit: newItemsPerPage }));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Get brand status

  // Get sort icon
  const getSortIcon = (field: 'name' | 'createdAt' | 'updatedAt') => {
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
          <CardTitle>Brand Management</CardTitle>
          <CardDescription>
            Manage brand information, status, and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search brands..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.is_active === undefined ? 'all' : filters.is_active.toString()}
              onValueChange={(value) => handleFilterChange('is_active', value)}
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
              value={filters.sort || 'name'}
              onValueChange={(value) => handleFilterChange('sort', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="updatedAt">Updated</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.order || 'asc'}
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
              onClick={fetchBrands}
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
                  <Button onClick={fetchBrands} className="mt-2">
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
              <p className="text-muted-foreground mt-2">Loading brands...</p>
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
                          onClick={() => handleSortChange('name')}
                          className="h-auto p-0 font-semibold"
                        >
                          Brand
                          {getSortIcon('name')}
                        </Button>
                      </TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortChange('createdAt')}
                          className="h-auto p-0 font-semibold"
                        >
                          Created
                          {getSortIcon('createdAt')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands && brands.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No brands found
                        </TableCell>
                      </TableRow>
                    ) : (
                      brands?.map((brand) => (
                        <TableRow key={brand._id}>                          
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              {brand.logo_url && (
                                <img 
                                  src={brand.logo_url} 
                                  alt={brand.name}
                                  className="w-8 h-8 rounded object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <div className="font-medium">{brand.name}</div>
                                <div className='font-mono text-xs mt-1 flex items-center text-muted-foreground'>
                                  {truncateId(brand._id)}
                                  <Copy 
                                    className="ml-2 h-3 w-3 cursor-pointer hover:text-primary" 
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(brand._id);
                                        toast.success('Brand ID copied to clipboard');
                                      } catch (err) {
                                        toast.error('Failed to copy to clipboard');
                                      }
                                    }} 
                                  />
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-sm truncate">{brand.description}</p>
                              {brand.website && (
                                <a 
                                  href={brand.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center mt-1"
                                >
                                  <Globe className="h-3 w-3 mr-1" />
                                  Website
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {brand.contact_email && (
                              <a 
                                href={`mailto:${brand.contact_email}`}
                                className="text-sm text-blue-600 hover:underline flex items-center"
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                {brand.contact_email}
                              </a>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(getBrandStatus(brand))}>
                              {getBrandStatus(brand)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(brand.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  disabled={actionLoading === brand._id}
                                >
                                  {actionLoading === brand._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewBrand(brand._id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditBrand(brand._id)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {brand.is_active ? (
                                  <DropdownMenuItem onClick={() => confirmDeactivate(brand)}>
                                    <PowerOff className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleActivateBrand(brand._id, brand.name)}
                                  >
                                    <Power className="mr-2 h-4 w-4" />
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => confirmDelete(brand)}
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

              {/* Table Footer */}
              {totalBrands > 0 && (
                <TableFooter
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalBrands}
                  itemsPerPage={filters.limit || getSiteConfigSync().admin.itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  showItemsPerPageSelector={true}
                  entityName="brands"
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

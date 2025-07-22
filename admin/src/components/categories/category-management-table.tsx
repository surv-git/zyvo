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
import { TableFooter } from '@/components/ui/table-footer';
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
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderTree,
  Tag
} from 'lucide-react';

import { Category, CategoryTableFilters, CategoryStatus } from '@/types/category';
import { 
  getCategoryList, 
  activateCategory, 
  deactivateCategory, 
  deleteCategory, 
  getCategoryServiceErrorMessage 
} from '@/services/category-service';
import { toast } from 'sonner';
import { useSiteConfig } from '@/config/site';

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

interface CategoryManagementTableProps {
  className?: string;
}

export function CategoryManagementTable({ className }: CategoryManagementTableProps) {
  const router = useRouter();
  const { config } = useSiteConfig();

  // State management
  const [categories, setCategories] = useState<Category[]>([]);
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
  const [totalCategories, setTotalCategories] = useState(0);
  const [filters, setFilters] = useState<CategoryTableFilters>({
    search: '',
    sort_by: 'name',
    sort_order: 'asc',
    page: 1,
    limit: config.admin.itemsPerPage,
  });

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
    setFilters(prev => ({ ...prev, limit: value }));
    setCurrentPage(1);
  };

  // Fetch categories data
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getCategoryList({
        ...filters,
        page: currentPage,
        limit: filters.limit,
      });
      
      setCategories(response.categories);
      setTotalPages(response.totalPages);
      setTotalCategories(response.total);
    } catch (err: any) {
      const errorMessage = getCategoryServiceErrorMessage(err);
      setError(errorMessage);
      
      // Check if it's an authentication error
      if (err?.status === 401) {
        showToast('Please log in to access category management.', 'error');
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
    fetchCategories();
  }, [fetchCategories]);

  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof CategoryTableFilters, value: string | boolean) => {
    if (key === 'parent_id') {
      setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value as string }));
    } else if (key === 'include_inactive') {
      setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value === 'true' }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }));
    }
    setCurrentPage(1);
  };

  // Handle sort changes
  const handleSortChange = (field: 'name' | 'createdAt' | 'updatedAt') => {
    setFilters(prev => ({
      ...prev,
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  // Get category status
  const getCategoryStatus = (category: Category): CategoryStatus => {
    return category.is_active ? 'Active' : 'Inactive';
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: CategoryStatus) => {
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
  const handleViewCategory = (id: string) => {
    router.push(`/categories/${id}`);
  };

  const handleEditCategory = (id: string) => {
    router.push(`/categories/${id}/edit`);
  };

  // Category action handlers
  const handleActivateCategory = async (id: string, name: string) => {
    try {
      setActionLoading(id);
      await activateCategory(id);
      showToast(`Category "${name}" has been activated successfully.`, 'success');
      fetchCategories(); // Refresh the list
    } catch (err: any) {
      const errorMessage = getCategoryServiceErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateCategory = async (id: string, name: string) => {
    try {
      setActionLoading(id);
      await deactivateCategory(id);
      showToast(`Category "${name}" has been deactivated successfully.`, 'success');
      fetchCategories(); // Refresh the list
    } catch (err: any) {
      const errorMessage = getCategoryServiceErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    try {
      setActionLoading(id);
      await deleteCategory(id);
      showToast(`Category "${name}" has been deleted successfully.`, 'success');
      fetchCategories(); // Refresh the list
    } catch (err: any) {
      const errorMessage = getCategoryServiceErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Confirmation dialogs
  const confirmDeactivate = (category: Category) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Deactivate Category',
      description: `Are you sure you want to deactivate "${category.name}"? This will hide the category from public listings.`,
      onConfirm: () => handleDeactivateCategory(category._id, category.name),
    });
  };

  const confirmDelete = (category: Category) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category',
      description: `Are you sure you want to permanently delete "${category.name}"? This action cannot be undone and will affect all associated products.`,
      onConfirm: () => handleDeleteCategory(category._id, category.name),
      isDestructive: true,
    });
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get sort icon
  const getSortIcon = (field: 'name' | 'createdAt' | 'updatedAt') => {
    if (filters.sort_by !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return filters.sort_order === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Category Management</CardTitle>
          <CardDescription>
            Manage product categories, hierarchies, and organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search categories..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.parent_id || 'all'}
              onValueChange={(value) => handleFilterChange('parent_id', value)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Parent Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="null">Root Categories</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.include_inactive === undefined ? 'false' : filters.include_inactive.toString()}
              onValueChange={(value) => handleFilterChange('include_inactive', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Active Only</SelectItem>
                <SelectItem value="true">Include Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.sort_by || 'name'}
              onValueChange={(value) => handleFilterChange('sort_by', value)}
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
              value={filters.sort_order || 'asc'}
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
              onClick={fetchCategories}
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
                  <Button onClick={fetchCategories} className="mt-2">
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
              <p className="text-muted-foreground mt-2">Loading categories...</p>
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
                          Category
                          {getSortIcon('name')}
                        </Button>
                      </TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Hierarchy</TableHead>
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
                    {categories && categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No categories found
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories?.map((category) => (
                        <TableRow key={category._id}>                          
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              {category.image_url && (
                                <img 
                                  src={category.image_url} 
                                  alt={category.name}
                                  className="w-8 h-8 rounded object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <div className="font-medium flex items-center">
                                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                                  {category.name}
                                </div>
                                <div className='font-mono text-xs mt-1 flex items-center text-muted-foreground'>
                                  {truncateId(category._id)}
                                  <Copy 
                                    className="ml-2 h-3 w-3 cursor-pointer hover:text-primary" 
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(category._id);
                                        toast.success('Category ID copied to clipboard');
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
                              <p className="text-sm truncate">{category.description}</p>
                              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                <Tag className="h-3 w-3 mr-1" />
                                {category.slug}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              {category.parent_category ? (
                                <div className="flex items-center">
                                  <FolderTree className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span className="text-muted-foreground">{category.parent_category.name}</span>
                                  <span className="mx-1 text-muted-foreground">→</span>
                                  <span className="font-medium">{category.name}</span>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <FolderTree className="h-4 w-4 mr-2 text-blue-600" />
                                  <span className="font-medium text-blue-600">Root Category</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(getCategoryStatus(category))}>
                              {getCategoryStatus(category)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(category.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  disabled={actionLoading === category._id}
                                >
                                  {actionLoading === category._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewCategory(category._id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditCategory(category._id)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {category.is_active ? (
                                  <DropdownMenuItem onClick={() => confirmDeactivate(category)}>
                                    <PowerOff className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleActivateCategory(category._id, category.name)}
                                  >
                                    <Power className="mr-2 h-4 w-4" />
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => confirmDelete(category)}
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
              {totalCategories > 0 && (
                <TableFooter
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalCategories}
                  itemsPerPage={filters.limit || config.admin.itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  showItemsPerPageSelector={true}
                  entityName="categories"
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

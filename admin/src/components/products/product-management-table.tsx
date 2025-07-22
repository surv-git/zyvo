"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
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
  Trash2, 
  Power,
  PowerOff,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  ImageIcon,
  Copy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

import { Product, ProductTableFilters, ProductStatus } from '@/types/product';
import { 
  getProductList, 
  toggleProductStatus, 
  deleteProduct, 
  getProductServiceErrorMessage 
} from '@/services/product-service';
import { toast } from 'sonner';
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

interface ProductManagementTableProps {
  className?: string;
}

export function ProductManagementTable({ className }: ProductManagementTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Scroll preservation state
  const scrollPositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastScrollPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

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
  const filters = useMemo((): ProductTableFilters => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || getSiteConfigSync().admin.itemsPerPage.toString()),
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category_id') || undefined,
    brand_id: searchParams.get('brand_id') || undefined,
    sort: (searchParams.get('sort') as ProductTableFilters['sort']) || 'createdAt',
    order: (searchParams.get('order') as ProductTableFilters['order']) || 'desc',
    include_inactive: searchParams.get('include_inactive') === 'true',
  }), [searchParams]);

  // Update URL parameters
  const updateFilters = useCallback((newFilters: Partial<ProductTableFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === null) {
        params.delete(key);
      } else {
        params.set(key, value.toString());
      }
    });

    // Use scroll: false to prevent automatic scroll-to-top
    router.push(`/products?${params.toString()}`, { scroll: false });
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

  // Fetch products data
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getProductList(filters);
      
      setProducts(response.products);
      setTotalPages(response.totalPages);
      setTotalProducts(response.total);
      
    } catch (err: unknown) {
      console.error('Failed to fetch products:', err);
      const errorMessage = getProductServiceErrorMessage(err);
      setError(errorMessage);
      
      // Check if it's an authentication error
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
        showToast('Please log in to access product management.', 'error');
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
  }, [filters, router]);

  // Initial data fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
  const handleFilterChange = useCallback((key: keyof ProductTableFilters, value: ProductTableFilters[keyof ProductTableFilters]) => {
    const newFilters: Partial<ProductTableFilters> = {
      [key]: value,
      page: key !== 'page' ? 1 : (value as number) // Reset to page 1 when changing filters
    };
    updateFilters(newFilters);
  }, [updateFilters]);

  // Handle sort changes
  const handleSortChange = (field: string) => {
    const newOrder = filters.sort === field && filters.order === 'asc' ? 'desc' : 'asc';
    updateFilters({
      sort: field as ProductTableFilters['sort'],
      order: newOrder,
      page: 1
    });
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (filters.sort !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return filters.order === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  // Get product status
  const getProductStatus = (product: Product): ProductStatus => {
    return product.is_active ? 'Active' : 'Inactive';
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: ProductStatus) => {
    return status === 'Active' ? 'default' : 'secondary';
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Truncate ID
  const truncateId = (id: string) => {
    return `${id.slice(0, 8)}...`;
  };

  // Handle product actions
  const handleViewProduct = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/products/${productId}/edit`);
  };

  const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
    try {
      setActionLoading(productId);
      await toggleProductStatus(productId, !currentStatus);
      
      // Update local state
      setProducts(prev => prev.map(product => 
        product._id === productId ? { ...product, is_active: !currentStatus } : product
      ));
      
      showToast(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully.`, 'success');
    } catch (err) {
      const errorMessage = getProductServiceErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    try {
      setActionLoading(productId);
      await deleteProduct(productId);
      
      // Remove from local state
      setProducts(prev => prev.filter(product => product._id !== productId));
      setTotalProducts(prev => prev - 1);
      
      showToast(`Product ${productName} has been deleted.`, 'success');
    } catch (err) {
      const errorMessage = getProductServiceErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Confirmation dialogs
  const confirmDelete = (product: Product) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Product',
      description: `Are you sure you want to delete "${product.name}"? This action cannot be undone and will permanently remove the product and all associated data.`,
      onConfirm: () => handleDeleteProduct(product._id, product.name),
      isDestructive: true,
    });
  };

  // Handle pagination with scroll preservation
  const handlePageChange = useCallback((page: number) => {
    // Get current scroll position
    const mainElement = document.querySelector('main');
    let currentScrollY = 0;
    let currentScrollX = 0;
    
    if (mainElement) {
      currentScrollY = mainElement.scrollTop || 0;
      currentScrollX = mainElement.scrollLeft || 0;
    } else {
      currentScrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      currentScrollX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    }
    
    const trackedPosition = lastScrollPositionRef.current;
    const finalY = Math.max(currentScrollY, trackedPosition.y);
    const finalX = Math.max(currentScrollX, trackedPosition.x);
    
    // Save position
    scrollPositionRef.current = { x: finalX, y: finalY };
    
    // Update URL
    updateFilters({ page });
  }, [updateFilters]);

  // Refresh data
  const handleRefresh = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
          <CardDescription>
            Manage product catalog, inventory, and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.sort || 'createdAt'}
              onValueChange={(value) => handleFilterChange('sort', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="updatedAt">Updated</SelectItem>
                <SelectItem value="score">Score</SelectItem>
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
                  <Button onClick={fetchProducts} className="mt-2">
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
              <p className="text-muted-foreground mt-2">Loading products...</p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <>
              <div className="table-container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortChange('name')}
                          className="h-auto p-0 font-semibold"
                        >
                          Name
                          {getSortIcon('name')}
                        </Button>
                      </TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Price</TableHead>
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
                    {products && products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      products?.map((product) => (
                        <TableRow key={product._id}>
                          <TableCell>
                            <div className="w-12 h-12 relative bg-muted rounded-md overflow-hidden">
                              {product.images && product.images.length > 0 ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {product.name}
                            <div className='font-mono text-xs mt-2 flex'>
                              {truncateId(product._id)}<Copy 
                                className="ml-2 h-3 w-3 cursor-pointer hover:text-primary" 
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(product._id);
                                    toast.success('Product ID copied to clipboard');
                                  } catch {
                                    toast.error('Failed to copy to clipboard');
                                  }
                                }} 
                              />
                            </div>
                          </TableCell>
                          <TableCell>{product.category_id?.name || 'N/A'}</TableCell>
                          <TableCell>{product.brand_id?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{formatPrice(product.min_price)}</span>
                              {product.min_discounted_price && (
                                <span className="text-sm text-muted-foreground line-through">
                                  {formatPrice(product.min_discounted_price)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(getProductStatus(product))}>
                              {getProductStatus(product)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(product.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  disabled={actionLoading === product._id}
                                >
                                  {actionLoading === product._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewProduct(product._id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditProduct(product._id)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleToggleStatus(product._id, product.is_active)}
                                >
                                  {product.is_active ? (
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
                                  onClick={() => confirmDelete(product)}
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
              {totalProducts > 0 && (
                <TableFooter
                  currentPage={filters.page}
                  totalPages={totalPages}
                  totalItems={totalProducts}
                  itemsPerPage={filters.limit || getSiteConfigSync().admin.itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  showItemsPerPageSelector={true}
                  entityName="products"
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

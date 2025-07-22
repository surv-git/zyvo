'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TableFooter } from '@/components/ui/table-footer';
import { 
  MoreHorizontal, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Package
} from 'lucide-react';
import Link from 'next/link';
import { 
  getProductVariantList, 
  deleteProductVariant, 
  activateProductVariant, 
  deactivateProductVariant 
} from '@/services/product-variant-service';
import type { 
  ProductVariant, 
  ProductVariantTableFilters 
} from '@/types/product-variant';
import { useSiteConfig } from '@/config/site';

interface ProductVariantManagementTableProps {
  showPagination?: boolean;
  defaultFilters?: Partial<ProductVariantTableFilters>;
}

export function ProductVariantManagementTable({ 
  showPagination = true,
  defaultFilters = {}
}: ProductVariantManagementTableProps) {
  const { config } = useSiteConfig();
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(defaultFilters.limit || (showPagination ? config.admin.itemsPerPage : 10));

  const fetchProductVariants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: ProductVariantTableFilters = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
        sort: defaultFilters.sort || 'createdAt',
        order: defaultFilters.order || 'desc',
        ...defaultFilters
      };

      const response = await getProductVariantList(filters);
      
      setProductVariants(response.data);
      setTotal(response.pagination.totalItems);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching product variants:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch product variants');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, defaultFilters, itemsPerPage]);

  useEffect(() => {
    fetchProductVariants();
  }, [fetchProductVariants]);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product variant?')) {
      return;
    }

    try {
      await deleteProductVariant(id);
      await fetchProductVariants();
    } catch (err) {
      console.error('Error deleting product variant:', err);
      alert('Failed to delete product variant');
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateProductVariant(id);
      } else {
        await activateProductVariant(id);
      }
      await fetchProductVariants();
    } catch (err) {
      console.error('Error updating product variant status:', err);
      alert('Failed to update product variant status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        Inactive
      </Badge>
    );
  };

  const getSaleBadge = (isOnSale: boolean, discountPercentage?: number) => {
    if (!isOnSale) return null;
    
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-800">
        {discountPercentage ? `${discountPercentage}% OFF` : 'On Sale'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Loading product variants...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <XCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <p className="text-red-600">{error}</p>
            <Button 
              variant="outline" 
              onClick={fetchProductVariants} 
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Variant Management</CardTitle>
        <CardDescription>
          Manage product variants, pricing, and inventory options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search product variants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Variant</TableHead>
              <TableHead>Options</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productVariants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No product variants found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              productVariants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {variant.product_id.name || `Product ${variant.product_id.id}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {variant.sku_code}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {variant.option_values && variant.option_values.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {variant.option_values.map((option, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {option.option_type}: {option.option_value}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No options</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {variant.discount_details.is_on_sale && variant.discount_details.price ? (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {formatCurrency(variant.effective_price || variant.price)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(variant.price)}
                          </span>
                          {getSaleBadge(variant.discount_details.is_on_sale, variant.discount_percentage_calculated)}
                        </div>
                      ) : (
                        <div className="font-medium">
                          {formatCurrency(variant.effective_price || variant.price)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(variant.is_active)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        Stock not available
                      </div>
                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800">
                        See product details
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(variant.createdAt)}
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
                        <Link href={`/product-variants/${variant.id}`}>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/product-variants/${variant.id}/edit`}>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(variant.id, variant.is_active)}
                        >
                          {variant.is_active ? (
                            <>
                              <XCircle className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(variant.id)}
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

          {/* Table Footer */}
          {showPagination && (
            <TableFooter
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              entityName="product variants"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

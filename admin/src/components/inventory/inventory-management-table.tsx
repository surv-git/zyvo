'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Search, 
  Edit, 
  AlertTriangle,
  MapPin,
  Calendar,
  Loader2,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Trash2
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableFooter } from '@/components/ui/table-footer';
import { toast } from 'sonner';
import { getAllInventoryRecords, getInventoryServiceErrorMessage } from '@/services/inventory-service';
import { InventoryRecord, InventoryQueryParams, getStockStatus, getStockStatusColor } from '@/types/inventory';
import { getSiteConfigSync } from '@/config/site';

interface InventoryTableFilters {
  search: string;
  stock_status: string;
  is_active: string;
  location: string;
  sort_by: string;
  sort_order: string;
}

export default function InventoryManagementTable() {
  const router = useRouter();
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(getSiteConfigSync().admin.itemsPerPage);
  
  const [filters, setFilters] = useState<InventoryTableFilters>({
    search: '',
    stock_status: '',
    is_active: '',
    location: '',
    sort_by: 'createdAt',
    sort_order: 'desc',
  });

  // Navigation handlers
  const handleViewRecord = (id: string) => {
    router.push(`/inventory/${id}`);
  };

  const handleEditRecord = (id: string) => {
    router.push(`/inventory/${id}/edit`);
  };

  // Load inventory records
  const loadInventoryRecords = async (page: number = currentPage, resetData: boolean = false) => {
    try {
      if (resetData) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const params: InventoryQueryParams = {
        page,
        limit: itemsPerPage,
        sort_by: filters.sort_by as 'createdAt' | 'updatedAt' | 'stock_quantity' | 'min_stock_level' | 'last_restock_date',
        sort_order: filters.sort_order as 'asc' | 'desc',
      };

      // Add filters
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.stock_status) params.stock_status = filters.stock_status as 'out_of_stock' | 'low_stock' | 'in_stock';
      if (filters.is_active) params.is_active = filters.is_active === 'true';
      if (filters.location.trim()) params.location = filters.location.trim();

      const response = await getAllInventoryRecords(params);
      
      setRecords(response.data);
      setCurrentPage(response.pagination.current_page);
      setTotalPages(response.pagination.total_pages);
      setTotalItems(response.pagination.total_items);

    } catch (error) {
      console.error('Failed to load inventory records:', error);
      const errorMessage = getInventoryServiceErrorMessage(error);
      setError(errorMessage);
      toast.error(`Failed to load inventory records: ${errorMessage}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof InventoryTableFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadInventoryRecords(1, true);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    const newOrder = filters.sort_by === field && filters.sort_order === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sort_by: field, sort_order: newOrder }));
    loadInventoryRecords(currentPage);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadInventoryRecords(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    setTimeout(() => loadInventoryRecords(1), 100);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  // Load data on component mount and filter changes
  useEffect(() => {
    loadInventoryRecords(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPerPage]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>
            Manage inventory records and track stock levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground mt-2">Loading inventory records...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Management</CardTitle>
        <CardDescription>
          Manage inventory records and track stock levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search SKU, location, notes..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          <Select 
            value={filters.stock_status || 'all'} 
            onValueChange={(value) => handleFilterChange('stock_status', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select 
            value={filters.is_active || 'all'} 
            onValueChange={(value) => handleFilterChange('is_active', value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadInventoryRecords(currentPage)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => loadInventoryRecords(currentPage)} className="mt-2">
              Try Again
            </Button>
          </div>
        )}

        {/* Table */}
        {!error && (
          <>
            <div className="table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('product_variant_id.sku_code')}
                        className="h-auto p-0 font-semibold"
                      >
                        <Package className="mr-2 h-4 w-4" />
                        Product & SKU
                        {getSortIcon('product_variant_id.sku_code')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('stock_quantity')}
                        className="h-auto p-0 font-semibold"
                      >
                        Stock Quantity
                        {getSortIcon('stock_quantity')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('location')}
                        className="h-auto p-0 font-semibold"
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        Location
                        {getSortIcon('location')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('last_restock_date')}
                        className="h-auto p-0 font-semibold"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Last Restock
                        {getSortIcon('last_restock_date')}
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records && records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold">No inventory records found</h3>
                        <p className="text-muted-foreground mt-2">
                          {filters.search || filters.stock_status || filters.is_active || filters.location
                            ? 'Try adjusting your filters to see more results.'
                            : 'There are no inventory records to display.'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    records?.map((record) => {
                      const stockStatus = getStockStatus(record.stock_quantity, record.min_stock_level);
                      const stockStatusColor = getStockStatusColor(stockStatus);
                      
                      return (
                        <TableRow key={record._id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{record.product_variant_id.sku_code}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Price: {formatCurrency(record.product_variant_id.price)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{record.stock_quantity}</span>
                                <Badge className={`text-xs ${stockStatusColor}`}>
                                  {stockStatus.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Min: {record.min_stock_level}
                              </div>
                              {stockStatus === 'low_stock' && (
                                <div className="flex items-center gap-1 text-amber-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span className="text-xs">Low stock warning</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{record.location}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{formatDate(record.last_restock_date)}</span>
                              </div>
                              {record.last_sold_date && (
                                <div className="text-xs text-muted-foreground">
                                  Last sold: {formatDate(record.last_sold_date)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={record.is_active ? "default" : "secondary"}>
                              {record.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewRecord(record._id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditRecord(record._id)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => {
                                    // TODO: Implement delete functionality
                                    toast.info('Delete functionality coming soon');
                                  }}
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
            {totalItems > 0 && (
              <TableFooter
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                entityName="inventory records"
                showItemsPerPageSelector={true}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

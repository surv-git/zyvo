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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TableFooter as UITableFooter } from '@/components/ui/table-footer';
import {
  MoreHorizontal,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Loader2,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Megaphone,
  Images,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSiteConfig } from '@/config/site';
import {
  getDynamicContent,
  deleteDynamicContent,
  DynamicContent,
  DynamicContentTableFilters,
  DynamicContentType,
} from '@/services/dynamic-content-service';

interface DynamicContentManagementTableProps {
  className?: string;
}

export default function DynamicContentManagementTable({ className }: DynamicContentManagementTableProps) {
  const router = useRouter();
  const { config } = useSiteConfig();
  
  const [content, setContent] = useState<DynamicContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    content: DynamicContent | null;
    loading: boolean;
  }>({ open: false, content: null, loading: false });
  
  const [filters, setFilters] = useState<DynamicContentTableFilters>({
    search: '',
    type: 'all',
    location_key: '',
    is_active: 'all',
    page: 1,
    limit: config.admin.itemsPerPage,
    sort: 'createdAt',
    order: 'desc',
  });
  
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 0,
    total_items: 0,
    has_next_page: false,
    has_prev_page: false,
  });

  // Fetch dynamic content
  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await getDynamicContent(filters);

      if (response.success) {
        setContent(response.data);
        setPagination(response.pagination);
      } else {
        throw new Error('Failed to fetch dynamic content');
      }
    } catch (error) {
      console.error('Failed to fetch dynamic content:', error);
      toast.error('Failed to load dynamic content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key: keyof DynamicContentTableFilters, value: string | number | boolean) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (key === 'page') {
        newFilters[key] = typeof value === 'string' ? parseInt(value) : (typeof value === 'number' ? value : 1);
      } else {
        // Type assertion is safe here as we know the key exists in the interface
        (newFilters as Record<string, unknown>)[key] = value;
        newFilters.page = 1; // Reset to first page when changing other filters
      }
      
      return newFilters;
    });
  };

  const handleSearch = (value: string) => {
    handleFilterChange('search', value);
  };

  const handleRefresh = () => {
    fetchData(false);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      location_key: '',
      is_active: 'all',
      page: 1,
      limit: config.admin.itemsPerPage,
      sort: 'createdAt',
      order: 'desc',
    });
  };

  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sort: column,
      order: prev.sort === column && prev.order === 'asc' ? 'desc' : 'asc',
      page: 1, // Reset to first page when sorting
    }));
  };

  const getSortIcon = (column: string) => {
    if (filters.sort !== column) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return filters.order === 'asc' 
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

  const handleViewDetails = (content: DynamicContent) => {
    router.push(`/dynamic-contents/${content.id}`);
  };

  const handleEditContent = (content: DynamicContent) => {
    router.push(`/dynamic-contents/${content.id}/edit`);
  };

  const handleDeleteClick = (content: DynamicContent) => {
    setDeleteDialog({ open: true, content, loading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.content) return;

    setDeleteDialog(prev => ({ ...prev, loading: true }));
    
    try {
      await deleteDynamicContent(deleteDialog.content.id);
      toast.success('Dynamic content deleted successfully');
      fetchData(false);
      setDeleteDialog({ open: false, content: null, loading: false });
    } catch (error) {
      console.error('Failed to delete dynamic content:', error);
      toast.error('Failed to delete dynamic content');
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const getStatusColor = (isActive: boolean, isCurrentlyActive: boolean) => {
    if (!isCurrentlyActive) return 'secondary';
    return isActive ? 'default' : 'destructive';
  };

  const getTypeIcon = (type: DynamicContentType) => {
    switch (type) {
      case DynamicContentType.Advertisement:
        return <Megaphone className="h-4 w-4" />;
      case DynamicContentType.Carousel:
        return <Images className="h-4 w-4" />;
      case DynamicContentType.Marquee:
        return <FileText className="h-4 w-4" />;
      case DynamicContentType.Offer:
        return <Tag className="h-4 w-4" />;
      case DynamicContentType.Promo:
        return <Tag className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: DynamicContentType) => {
    switch (type) {
      case DynamicContentType.Advertisement:
        return 'bg-blue-100 text-blue-800';
      case DynamicContentType.Carousel:
        return 'bg-purple-100 text-purple-800';
      case DynamicContentType.Marquee:
        return 'bg-green-100 text-green-800';
      case DynamicContentType.Offer:
        return 'bg-orange-100 text-orange-800';
      case DynamicContentType.Promo:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text: string | null, maxLength: number = 50) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
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
        <CardTitle>Dynamic Content Management</CardTitle>
        <CardDescription>
          Manage and monitor dynamic content across your application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search content..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={filters.type}
              onValueChange={(value) => handleFilterChange('type', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={DynamicContentType.Advertisement}>Advertisement</SelectItem>
                <SelectItem value={DynamicContentType.Carousel}>Carousel</SelectItem>
                <SelectItem value={DynamicContentType.Marquee}>Marquee</SelectItem>
                <SelectItem value={DynamicContentType.Offer}>Offer</SelectItem>
                <SelectItem value={DynamicContentType.Promo}>Promo</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Location key..."
              value={filters.location_key}
              onChange={(e) => handleFilterChange('location_key', e.target.value)}
              className="w-40"
            />

            <Select
              value={filters.is_active?.toString()}
              onValueChange={(value) => handleFilterChange('is_active', value === 'all' ? 'all' : value === 'true')}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
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
                  <SortableHeader column="name">Name</SortableHeader>
                  <SortableHeader column="type">Type</SortableHeader>
                  <SortableHeader column="location_key">Location</SortableHeader>
                  <TableHead>Content</TableHead>
                  <SortableHeader column="content_order">Order</SortableHeader>
                  <SortableHeader column="is_active">Status</SortableHeader>
                  <SortableHeader column="createdAt">Created</SortableHeader>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No dynamic content found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  content.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <Badge className={getTypeColor(item.type)}>
                            {item.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {item.location_key}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {truncateText(item.main_text_content)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.content_order}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(item.is_active, item.is_currently_active)}>
                          {item.is_currently_active 
                            ? (item.is_active ? 'Active' : 'Inactive')
                            : 'Scheduled'
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditContent(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Content
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(item)}
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
            <UITableFooter
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              totalItems={pagination.total_items}
              itemsPerPage={filters.limit || config.admin.itemsPerPage}
              onPageChange={(page) => handleFilterChange('page', page)}
              onItemsPerPageChange={(limit) => handleFilterChange('limit', limit)}
              itemsPerPageOptions={config.admin.itemsPerPageOptions}
              showItemsPerPageSelector={true}
              entityName="content items"
            />
          )}

          {/* Delete Confirmation Dialog */}
          {deleteDialog.open && (
            <AlertDialog>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Dynamic Content</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{deleteDialog.content?.name}&quot;? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel 
                    disabled={deleteDialog.loading}
                    onClick={() => setDeleteDialog({ open: false, content: null, loading: false })}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteConfirm}
                    disabled={deleteDialog.loading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteDialog.loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

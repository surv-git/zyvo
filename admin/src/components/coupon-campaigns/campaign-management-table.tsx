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
  Gift,
  Percent,
  DollarSign,
  Truck,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSiteConfig } from '@/config/site';
import {
  getCouponCampaigns,
  deleteCampaign,
  CouponCampaign,
  CampaignTableFilters,
  DiscountType,
  CampaignStatus,
} from '@/services/coupon-campaign-service';

interface CampaignManagementTableProps {
  className?: string;
}

export default function CampaignManagementTable({ className }: CampaignManagementTableProps) {
  const router = useRouter();
  const { config } = useSiteConfig();
  
  const [campaigns, setCampaigns] = useState<CouponCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    campaign: CouponCampaign | null;
    loading: boolean;
  }>({ open: false, campaign: null, loading: false });
  
  const [filters, setFilters] = useState<CampaignTableFilters>({
    search: '',
    status: 'all',
    discount_type: 'all',
    page: 1,
    limit: config.admin.itemsPerPage,
    sort: 'createdAt',
    order: 'desc',
  });
  
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 0,
    total_count: 0,
    has_next_page: false,
    has_prev_page: false,
  });

  // Fetch campaigns and stats
  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const campaignResponse = await getCouponCampaigns(filters);

      if (campaignResponse.success) {
        setCampaigns(campaignResponse.data);
        setPagination(campaignResponse.pagination);
      } else {
        throw new Error('Failed to fetch campaigns');
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key: keyof CampaignTableFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (typeof value === 'string' ? parseInt(value) : value), // Reset to first page when changing filters
    }));
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
      status: 'all',
      discount_type: 'all',
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

  const handleViewDetails = (campaign: CouponCampaign) => {
    router.push(`/coupon-campaigns/${campaign.id}`);
  };

  const handleEditCampaign = (campaign: CouponCampaign) => {
    router.push(`/coupon-campaigns/${campaign.id}/edit`);
  };

  const handleDeleteClick = (campaign: CouponCampaign) => {
    setDeleteDialog({ open: true, campaign, loading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.campaign) return;

    setDeleteDialog(prev => ({ ...prev, loading: true }));
    
    try {
      await deleteCampaign(deleteDialog.campaign.id);
      toast.success('Campaign deleted successfully');
      fetchData(false);
      setDeleteDialog({ open: false, campaign: null, loading: false });
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      toast.error('Failed to delete campaign');
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const getStatusColor = (status: string, isValid: boolean) => {
    if (!isValid) return 'secondary';
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'INACTIVE': return 'secondary';
      case 'SCHEDULED': return 'outline';
      case 'EXPIRED': return 'destructive';
      default: return 'secondary';
    }
  };

  const getDiscountIcon = (type: DiscountType) => {
    switch (type) {
      case DiscountType.Percentage:
        return <Percent className="h-4 w-4" />;
      case DiscountType.Amount:
        return <DollarSign className="h-4 w-4" />;
      case DiscountType.FreeShipping:
        return <Truck className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const formatDiscountValue = (type: DiscountType, value: number) => {
    switch (type) {
      case DiscountType.Percentage:
        return `${value}%`;
      case DiscountType.Amount:
        return `₹${value}`;
      case DiscountType.FreeShipping:
        return 'Free Shipping';
      default:
        return value.toString();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
        <CardTitle>Campaign Management</CardTitle>
        <CardDescription>
          Manage and monitor coupon campaigns and their performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search campaigns..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={CampaignStatus.Active}>Active</SelectItem>
                <SelectItem value={CampaignStatus.Inactive}>Inactive</SelectItem>
                <SelectItem value={CampaignStatus.Scheduled}>Scheduled</SelectItem>
                <SelectItem value={CampaignStatus.Expired}>Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.discount_type}
              onValueChange={(value) => handleFilterChange('discount_type', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={DiscountType.Percentage}>Percentage</SelectItem>
                <SelectItem value={DiscountType.Amount}>Amount</SelectItem>
                <SelectItem value={DiscountType.FreeShipping}>Free Shipping</SelectItem>
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
                  <SortableHeader column="name">Campaign</SortableHeader>
                  <SortableHeader column="discount_type">Discount</SortableHeader>
                  <TableHead>Usage</TableHead>
                  <SortableHeader column="valid_from">Validity</SortableHeader>
                  <SortableHeader column="is_active">Status</SortableHeader>
                  <SortableHeader column="createdAt">Created</SortableHeader>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Gift className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No campaigns found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">{campaign.code_prefix}-*</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDiscountIcon(campaign.discount_type)}
                      <span>{formatDiscountValue(campaign.discount_type, campaign.discount_value)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{campaign.usage_stats.current_usage} / {campaign.usage_stats.max_usage}</div>
                      <div className="text-muted-foreground">
                        {campaign.usage_stats.usage_percentage}% used
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatDate(campaign.valid_from)}</div>
                      <div className="text-muted-foreground">to {formatDate(campaign.valid_until)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(campaign.is_active ? 'ACTIVE' : 'INACTIVE', campaign.validity_period.is_currently_valid)}>
                      {campaign.validity_period.is_currently_valid 
                        ? (campaign.is_active ? 'Active' : 'Inactive')
                        : 'Expired'
                      }
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(campaign.createdAt)}
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
                        <DropdownMenuItem onClick={() => handleViewDetails(campaign)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Campaign
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(campaign)}
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
      {pagination.total_count > 0 && (
        <UITableFooter
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          totalItems={pagination.total_count}
          itemsPerPage={filters.limit}
          onPageChange={(page) => handleFilterChange('page', page)}
          onItemsPerPageChange={(limit) => handleFilterChange('limit', limit)}
          itemsPerPageOptions={config.admin.itemsPerPageOptions}
          showItemsPerPageSelector={true}
          entityName="campaigns"
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog.open && (
        <AlertDialog>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{deleteDialog.campaign?.name}&quot;? This action cannot be undone
                and will affect all associated coupons.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                disabled={deleteDialog.loading}
                onClick={() => setDeleteDialog({ open: false, campaign: null, loading: false })}
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

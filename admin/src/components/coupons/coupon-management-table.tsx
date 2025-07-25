'use client';

import { useState, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TableFooter } from '@/components/ui/table-footer';
import {
  MoreHorizontal,
  Eye,
  Copy,
  Ban,
  Search,
  RotateCcw,
  Edit,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { defaultSiteConfig } from '@/config/site';
import {
  getUserCoupons,
  deactivateCoupon,
  type UserCoupon,
  type CouponTableFilters,
  type CouponStats,
} from '@/services/coupon-service';

interface CouponManagementTableProps {
  className?: string;
  initialStats?: CouponStats;
  status?: 'all' | 'ACTIVE' | 'USED' | 'EXPIRED';
}

export function CouponManagementTable({ className, initialStats, status = 'all' }: CouponManagementTableProps) {
  const router = useRouter();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CouponStats | null>(initialStats || null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<CouponTableFilters>({
    search: '',
    status: status,
    page: 1,
    limit: defaultSiteConfig.admin.itemsPerPage,
    sort: 'createdAt',
    order: 'desc'
  });

  // Dialog states
  const [deactivateDialog, setDeactivateDialog] = useState<{
    open: boolean;
    coupon: UserCoupon | null;
  }>({ open: false, coupon: null });

  // Fetch coupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await getUserCoupons(filters);
      
      if (response.success) {
        setCoupons(response.data);
        // Note: Stats are not included in this response, keep existing stats
        setTotalPages(response.pagination.total_pages);
        setTotalItems(response.pagination.total_count);
      } else {
        toast.error('Failed to fetch coupons');
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [filters]);

  // Handle filter changes
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      status: value as 'all' | 'ACTIVE' | 'USED' | 'EXPIRED', 
      page: 1 
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      page: 1,
      limit: defaultSiteConfig.admin.itemsPerPage,
      sort: 'createdAt',
      order: 'desc'
    });
  };

  // Handle actions
  const handleViewDetails = (coupon: UserCoupon) => {
    router.push(`/coupons/${coupon._id}`);
  };

  const handleCopyCouponCode = async (couponCode: string) => {
    try {
      await navigator.clipboard.writeText(couponCode);
      toast.success('Coupon code copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy coupon code');
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateDialog.coupon) return;

    setActionLoading(deactivateDialog.coupon._id);
    try {
      const response = await deactivateCoupon(deactivateDialog.coupon._id);
      
      if (response.success) {
        toast.success('Coupon deactivated successfully');
        fetchCoupons(); // Refresh the data
      } else {
        toast.error('Failed to deactivate coupon');
      }
    } catch (error) {
      console.error('Error deactivating coupon:', error);
      toast.error('Failed to deactivate coupon');
    } finally {
      setActionLoading(null);
      setDeactivateDialog({ open: false, coupon: null });
    }
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'USED':
        return <Badge variant="secondary">Used</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading && coupons.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coupon Code</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Coupon Management</CardTitle>
        <CardDescription>
          Manage user coupons and track coupon usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search coupons or users..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="USED">Used</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
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
              <TableHead>Coupon Code</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No coupons found
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {coupon.coupon_code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCouponCode(coupon.coupon_code)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{coupon.user_id.fullName}</p>
                      <p className="text-xs text-muted-foreground">{coupon.user_id.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{coupon.coupon_campaign_id.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {coupon.coupon_campaign_id.discount_type}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(coupon.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{coupon.current_usage_count}</span>
                      {coupon.remaining_usage && (
                        <span className="text-muted-foreground"> / {coupon.remaining_usage}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(coupon.expires_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(coupon.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          disabled={actionLoading === coupon._id}
                        >
                          {actionLoading === coupon._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(coupon)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyCouponCode(coupon.coupon_code)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Code
                        </DropdownMenuItem>
                        {coupon.status.toUpperCase() === 'ACTIVE' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeactivateDialog({ open: true, coupon })}
                              className="text-destructive focus:text-destructive"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          </>
                        )}
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
      {totalPages > 1 && (
        <TableFooter
          currentPage={filters.page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={filters.limit}
          onPageChange={handlePageChange}
        />
      )}

      {/* Deactivate Dialog */}
      <Dialog open={deactivateDialog.open} onOpenChange={(open) => setDeactivateDialog({ open, coupon: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate the coupon "{deactivateDialog.coupon?.coupon_code}"? 
              This action cannot be undone and the coupon will no longer be usable.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeactivateDialog({ open: false, coupon: null })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivate}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

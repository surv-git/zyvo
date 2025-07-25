import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { defaultSiteConfig } from '@/config/site';
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
  Trash2, 
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  MapPin,
  Home,
  Building,
  Star,
  Shield,
  CheckCircle
} from 'lucide-react';

import { 
  AddressWithUser, 
  AddressTableFilters, 
  AddressType,
  getAddressTypeColor,
  getAddressTypeLabel,
  getUserDisplayName
} from '@/types/address';
import { 
  getAddresses, 
  deleteAddress, 
  activateAddress,
  deactivateAddress,
  setDefaultAddress,
  verifyAddress,
  getAddressServiceErrorMessage 
} from '@/services/address-service';
import { toast } from 'sonner';
import { useScrollPreservation } from '@/hooks/use-scroll-preservation';
import { TableFooter } from '@/components/ui/table-footer';

interface AddressManagementTableProps {
  initialFilters?: Partial<AddressTableFilters>;
}

export function AddressManagementTable({ initialFilters = {} }: AddressManagementTableProps) {
  const router = useRouter();
  const { preserveScroll } = useScrollPreservation();

  // State
  const [addresses, setAddresses] = useState<AddressWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and pagination
  const [filters, setFilters] = useState<AddressTableFilters>({
    page: 1,
    limit: defaultSiteConfig.admin.itemsPerPage || 20,
    search: '',
    type: undefined,
    is_active: undefined,
    city: '',
    state: '',
    country: 'India',
    sort_by: 'createdAt',
    sort_order: 'desc',
    ...initialFilters,
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: defaultSiteConfig.admin.itemsPerPage || 20,
    has_next_page: false,
    has_prev_page: false,
  });

  // Summary state
  const [summary, setSummary] = useState({
    total_addresses: 0,
    active_addresses: 0,
    inactive_addresses: 0,
    default_addresses: 0,
    verified_addresses: 0,
    average_usage_count: 0,
  });

  // Load addresses
  const loadAddresses = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const response = await getAddresses(filters);
      
      setAddresses(response.data.addresses);
      setPagination(response.data.pagination);
      setSummary(response.data.summary);
    } catch (err) {
      const errorMessage = getAddressServiceErrorMessage(err);
      setError(errorMessage);
      toast.error('Failed to load addresses: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load addresses on mount and filter changes
  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Handle filter changes
  const handleFilterChange = (key: keyof AddressTableFilters, value: string | number | boolean | undefined) => {
    preserveScroll(() => {
      setFilters(prev => ({
        ...prev,
        [key]: value,
        page: key === 'limit' ? prev.page : 1, // Reset page except for limit changes
      }));
    });
  };

  // Handle search
  const handleSearch = (value: string) => {
    handleFilterChange('search', value);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    preserveScroll(() => {
      setFilters(prev => ({ ...prev, page }));
    });
  };

  // Handle view address
  const handleView = (addressId: string) => {
    preserveScroll(() => {
      router.push(`/addresses/${addressId}`);
    });
  };

  // Handle edit address
  const handleEdit = (addressId: string) => {
    preserveScroll(() => {
      router.push(`/addresses/${addressId}/edit`);
    });
  };

  // Handle delete address
  const handleDelete = async (address: AddressWithUser) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the address "${address.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading(`delete-${address._id}`);

    try {
      await deleteAddress(address._id);
      toast.success('Address deleted successfully');
      loadAddresses(false);
    } catch (err) {
      const errorMessage = getAddressServiceErrorMessage(err);
      toast.error('Failed to delete address: ' + errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle toggle active status
  const handleToggleStatus = async (address: AddressWithUser) => {
    const action = address.is_active ? 'deactivate' : 'activate';
    setActionLoading(`${action}-${address._id}`);

    try {
      if (address.is_active) {
        await deactivateAddress(address._id);
        toast.success('Address deactivated successfully');
      } else {
        await activateAddress(address._id);
        toast.success('Address activated successfully');
      }
      loadAddresses(false);
    } catch (err) {
      const errorMessage = getAddressServiceErrorMessage(err);
      toast.error(`Failed to ${action} address: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle set as default
  const handleSetDefault = async (address: AddressWithUser) => {
    if (address.is_default) return;

    setActionLoading(`default-${address._id}`);

    try {
      await setDefaultAddress(address._id);
      toast.success('Address set as default successfully');
      loadAddresses(false);
    } catch (err) {
      const errorMessage = getAddressServiceErrorMessage(err);
      toast.error('Failed to set address as default: ' + errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle verify address
  const handleVerifyAddress = async (address: AddressWithUser) => {
    if (address.is_verified) return;

    setActionLoading(`verify-${address._id}`);

    try {
      await verifyAddress(address._id);
      toast.success('Address verified successfully');
      loadAddresses(false);
    } catch (err) {
      const errorMessage = getAddressServiceErrorMessage(err);
      toast.error('Failed to verify address: ' + errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: defaultSiteConfig.admin.itemsPerPage || 20,
      search: '',
      type: undefined,
      is_active: undefined,
      city: '',
      state: '',
      country: 'India',
      sort_by: 'createdAt',
      sort_order: 'desc',
    });
  };

  // Refresh data
  const handleRefresh = () => {
    loadAddresses();
  };

  if (error && addresses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Addresses</h3>
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">      
      {/* Addresses Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Addresses</CardTitle>
              <CardDescription>
                Showing {addresses.length} of {pagination.total_count} addresses
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search addresses..."
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => handleFilterChange('type', value === 'all' ? undefined : value as AddressType)}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="HOME">Home</SelectItem>
                <SelectItem value="OFFICE">Office</SelectItem>
                <SelectItem value="BILLING">Billing</SelectItem>
                <SelectItem value="SHIPPING">Shipping</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.is_active === undefined ? 'all' : filters.is_active.toString()}
              onValueChange={(value) => handleFilterChange('is_active', value === 'all' ? undefined : value === 'true')}
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="City..."
              value={filters.city || ''}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="w-full sm:w-[120px]"
            />
            
            <Input
              placeholder="State..."
              value={filters.state || ''}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="w-full sm:w-[120px]"
            />
            
            <Input
              placeholder="Country..."
              value={filters.country || ''}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="w-full sm:w-[120px]"
            />

            <Button variant="outline" onClick={clearFilters} className="sm:w-auto">
              Clear
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading addresses...</span>
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Addresses Found</h3>
              <p className="text-muted-foreground">
                {(filters.search && filters.search.trim()) || 
                 filters.type || 
                 filters.is_active !== undefined ||
                 (filters.city && filters.city.trim()) ||
                 (filters.state && filters.state.trim()) ||
                 (filters.country && filters.country.trim() && filters.country !== 'India')
                  ? 'No addresses match your current filters.'
                  : 'No addresses have been added yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address Details</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addresses.map((address) => {
                      // Ensure address and user objects exist
                      if (!address || typeof address !== 'object') {
                        return null;
                      }
                      
                      return (
                        <TableRow key={address._id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium flex items-center gap-2">
                                {address.title || 'Untitled'}
                                {address.is_default && (
                                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                )}
                                {address.is_verified && (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {address.full_name || 'No name'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {address.phone || 'No phone'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium">
                                  {address.user ? getUserDisplayName(address.user) : 'Unknown User'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {address.user?.email || 'No email'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getAddressTypeColor(address.type)}>
                            {getAddressTypeLabel(address.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{address.city}, {address.state}</div>
                            <div className="text-xs text-muted-foreground">{address.country}</div>
                            <div className="text-xs text-muted-foreground">{address.postal_code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={address.is_active ? 'default' : 'secondary'}>
                              {address.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {address.is_default && (
                              <Badge variant="outline" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{address.usage_count} times</div>
                            {address.last_used_at && (
                              <div className="text-xs text-muted-foreground">
                                Last: {new Date(address.last_used_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(address.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(address._id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(address._id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {!address.is_default && (
                                <DropdownMenuItem 
                                  onClick={() => handleSetDefault(address)}
                                  disabled={actionLoading === `default-${address._id}`}
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  Set as Default
                                </DropdownMenuItem>
                              )}
                              
                              {!address.is_verified && (
                                <DropdownMenuItem 
                                  onClick={() => handleVerifyAddress(address)}
                                  disabled={actionLoading === `verify-${address._id}`}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Verify Address
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(address)}
                                disabled={actionLoading === `activate-${address._id}` || actionLoading === `deactivate-${address._id}`}
                              >
                                {address.is_active ? (
                                  <>
                                    <Building className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Home className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem 
                                onClick={() => handleDelete(address)}
                                disabled={actionLoading === `delete-${address._id}`}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Table Footer */}
              <TableFooter
                currentPage={pagination.current_page}
                totalPages={pagination.total_pages}
                totalItems={pagination.total_count}
                itemsPerPage={pagination.per_page}
                onPageChange={handlePageChange}
                onItemsPerPageChange={(size: number) => handleFilterChange('limit', size)}
                entityName="addresses"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

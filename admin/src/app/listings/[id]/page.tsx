"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  Trash2,
  Package,
  DollarSign,
  Globe,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle,
  Copy,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Listing } from '@/types/listing';
import { getListingById, deleteListing, syncListing } from '@/services/listing-service';
import { formatDistanceToNow } from 'date-fns';

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Draft': Edit,
  'Pending Review': Clock,
  'Live': CheckCircle,
  'Rejected': XCircle,
  'Deactivated': Eye,
};

const statusColors: Record<string, string> = {
  'Draft': 'bg-gray-100 text-gray-800 border-gray-200',
  'Pending Review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Live': 'bg-green-100 text-green-800 border-green-200',
  'Rejected': 'bg-red-100 text-red-800 border-red-200',
  'Deactivated': 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function ListingViewPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<Listing | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load listing data
  useEffect(() => {
    const loadListing = async () => {
      try {
        const response = await getListingById(listingId);
        setListing(response);
      } catch (error) {
        console.error('Failed to load listing:', error);
        toast.error('Failed to load listing data');
        router.push('/listings');
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      loadListing();
    }
  }, [listingId, router]);

  const handleEdit = () => {
    router.push(`/listings/${listingId}/edit`);
  };

  const handleBack = () => {
    router.push('/listings');
  };

  const handleCopyId = async () => {
    if (listing) {
      try {
        await navigator.clipboard.writeText(listing._id);
        toast.success('Listing ID copied to clipboard');
      } catch {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleCopyPlatformSku = async () => {
    if (listing) {
      try {
        await navigator.clipboard.writeText(listing.platform_sku);
        toast.success('Platform SKU copied to clipboard');
      } catch {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleSync = async () => {
    if (!listing) return;

    setActionLoading('sync');

    try {
      await syncListing(listing._id);
      toast.success('Listing synced successfully');
      // Reload listing data
      const updatedListing = await getListingById(listingId);
      setListing(updatedListing);
    } catch (error) {
      console.error('Failed to sync listing:', error);
      toast.error('Failed to sync listing. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!listing) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete listing "${listing.platform_sku}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading('delete');

    try {
      await deleteListing(listing._id);
      toast.success('Listing deleted successfully');
      router.push('/listings');
    } catch (error) {
      console.error('Failed to delete listing:', error);
      toast.error('Failed to delete listing. Please try again.');
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const truncateId = (id: string) => {
    return `${id.slice(0, 8)}...${id.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading listing...</span>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Listing Not Found</h2>
          <p className="text-muted-foreground mb-4">The listing you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={handleBack}>
            Back to Listings
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[listing.listing_status];

  return (
    <div className="page-container">
      <PageHeader
        showBackButton={true}
        onBack={handleBack}
        title={listing.platform_sku}
        description="Listing details and platform information"
        icon={Package}
        actions={[
          {
            label: actionLoading === 'sync' ? 'Syncing...' : 'Sync',
            onClick: handleSync,
            icon: RefreshCw,
            variant: 'outline',
            disabled: actionLoading === 'sync'
          },
          {
            label: 'Edit',
            onClick: handleEdit,
            icon: Edit,
            variant: 'outline'
          },
          {
            label: actionLoading === 'delete' ? 'Deleting...' : 'Delete',
            onClick: handleDelete,
            icon: Trash2,
            variant: 'destructive',
            disabled: actionLoading === 'delete'
          }
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Listing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Platform SKU</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-lg font-semibold">{listing.platform_sku}</p>
                    <Button variant="ghost" size="sm" onClick={handleCopyPlatformSku}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center mt-1">
                    <Badge 
                      variant="outline" 
                      className={`${statusColors[listing.listing_status]} flex items-center gap-1`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {listing.listing_status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Platform Product ID</label>
                  <p className="text-base mt-1">{listing.platform_product_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Platform Active</label>
                  <div className="flex items-center mt-1">
                    <Badge variant={listing.is_active_on_platform ? 'default' : 'secondary'}>
                      {listing.is_active_on_platform ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Synced</label>
                  <p className="text-base mt-1">
                    {listing.last_synced_at ? formatDate(listing.last_synced_at) : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Platform Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Platform Name</label>
                  <p className="text-lg font-semibold">{listing.platform_id.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Platform URL</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={listing.platform_id.base_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-primary hover:underline"
                    >
                      {listing.platform_id.base_url}
                    </a>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Platform Status</label>
                  <div className="flex items-center mt-1">
                    <Badge variant={listing.platform_id.is_active ? 'default' : 'secondary'}>
                      {listing.platform_id.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Platform Slug</label>
                  <p className="text-base font-mono">{listing.platform_id.slug}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product ID</label>
                  <p className="text-lg font-semibold">{listing.product_variant_id.product_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU Code</label>
                  <p className="text-base font-mono">{listing.product_variant_id.sku_code}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product Variant ID</label>
                  <p className="text-base font-mono">{truncateId(listing.product_variant_id._id)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Base Price</label>
                  <p className="text-lg font-semibold">{formatCurrency(listing.product_variant_id.price)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing and Fees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Pricing & Fees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Platform Price</label>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(listing.platform_price)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Commission Rate</label>
                  <p className="text-lg">{listing.platform_commission_percentage}%</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fixed Fee</label>
                  <p className="text-lg">{formatCurrency(listing.platform_fixed_fee)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Shipping Fee</label>
                  <p className="text-lg">{formatCurrency(listing.platform_shipping_fee)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Commission</label>
                    <p className="text-lg font-semibold">
                      {formatCurrency((listing.platform_price * listing.platform_commission_percentage / 100) + listing.platform_fixed_fee)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Net Revenue</label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(listing.platform_price - (listing.platform_price * listing.platform_commission_percentage / 100) - listing.platform_fixed_fee - listing.platform_shipping_fee)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Listing Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <Badge 
                  variant="outline" 
                  className={`${statusColors[listing.listing_status]} flex items-center gap-1`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {listing.listing_status}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                {listing.listing_status === 'Draft' && "Listing is being prepared but not yet published."}
                {listing.listing_status === 'Pending Review' && "Listing is awaiting platform approval."}
                {listing.listing_status === 'Live' && "Listing is active and visible on the platform."}
                {listing.listing_status === 'Rejected' && "Listing was rejected by the platform."}
                {listing.listing_status === 'Deactivated' && "Listing has been deactivated."}
              </div>
            </CardContent>
          </Card>

          {/* Listing Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Listing ID</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{truncateId(listing._id)}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{formatDate(listing.createdAt)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">
                  {listing.updatedAt ? formatDate(listing.updatedAt) : 'Never'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Platform Active</span>
                <Badge variant={listing.is_active_on_platform ? "default" : "secondary"}>
                  {listing.is_active_on_platform ? 'Yes' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleSync}
                disabled={actionLoading === 'sync'}
              >
                {actionLoading === 'sync' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync Listing
              </Button>

              <Button variant="outline" className="w-full justify-start" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Listing
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
              >
                {actionLoading === 'delete' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Listing
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Created</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Updated</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(listing.updatedAt), { addSuffix: true })}
                  </span>
                </div>

                {listing.last_synced_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Synced</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(listing.last_synced_at), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Use Sync to update listing on platform</p>
              <p>• Edit to modify listing information</p>
              <p>• Track platform status in real-time</p>
              <p>• Delete removes the listing permanently</p>
              <p>• Monitor commission and fees</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

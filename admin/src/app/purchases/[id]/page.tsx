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
  TruckIcon,
  FileText,
  Building2,
  Mail,
  Loader2,
  AlertCircle,
  Copy,
  Clock,
  CheckCircle,
  XCircle,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Purchase } from '@/types/purchase';
import { getPurchase, deletePurchase } from '@/services/purchase-service';
import { formatDistanceToNow } from 'date-fns';

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Planned': Clock,
  'Pending': ShoppingCart,
  'Partially Received': TruckIcon,
  'Completed': CheckCircle,
  'Cancelled': XCircle,
};

const statusColors: Record<string, string> = {
  'Planned': 'bg-blue-100 text-blue-800 border-blue-200',
  'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Partially Received': 'bg-orange-100 text-orange-800 border-orange-200',
  'Completed': 'bg-green-100 text-green-800 border-green-200',
  'Cancelled': 'bg-red-100 text-red-800 border-red-200',
};

export default function PurchaseViewPage() {
  const router = useRouter();
  const params = useParams();
  const purchaseId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load purchase data
  useEffect(() => {
    const loadPurchase = async () => {
      try {
        const response = await getPurchase(purchaseId);
        setPurchase(response.data);
      } catch (error) {
        console.error('Failed to load purchase:', error);
        toast.error('Failed to load purchase data');
        router.push('/purchases');
      } finally {
        setLoading(false);
      }
    };

    if (purchaseId) {
      loadPurchase();
    }
  }, [purchaseId, router]);

  const handleEdit = () => {
    router.push(`/purchases/${purchaseId}/edit`);
  };

  const handleBack = () => {
    router.push('/purchases');
  };

  const handleCopyId = async () => {
    if (purchase) {
      try {
        await navigator.clipboard.writeText(purchase._id);
        toast.success('Purchase ID copied to clipboard');
      } catch {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleCopyOrderNumber = async () => {
    if (purchase) {
      try {
        await navigator.clipboard.writeText(purchase.purchase_order_number);
        toast.success('Order number copied to clipboard');
      } catch {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleDelete = async () => {
    if (!purchase) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete purchase "${purchase.purchase_order_number}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading('delete');

    try {
      await deletePurchase(purchase._id);
      toast.success('Purchase deleted successfully');
      router.push('/purchases');
    } catch (error) {
      console.error('Failed to delete purchase:', error);
      toast.error('Failed to delete purchase. Please try again.');
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
          <span className="ml-2">Loading purchase...</span>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Purchase Not Found</h2>
          <p className="text-muted-foreground mb-4">The purchase you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={handleBack}>
            Back to Purchases
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[purchase.status];

  return (
    <div className="page-container">
      <PageHeader
        showBackButton={true}
        onBack={handleBack}
        title={purchase.purchase_order_number}
        description="Purchase order details and information"
        icon={Package}
        actions={[
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
                Purchase Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Order Number</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-lg font-semibold">{purchase.purchase_order_number}</p>
                    <Button variant="ghost" size="sm" onClick={handleCopyOrderNumber}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center mt-1">
                    <Badge 
                      variant="outline" 
                      className={`${statusColors[purchase.status]} flex items-center gap-1`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {purchase.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Purchase Date</label>
                  <p className="text-base mt-1">{formatDate(purchase.purchase_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expected Delivery</label>
                  <p className="text-base mt-1">{formatDate(purchase.expected_delivery_date)}</p>
                </div>
              </div>

              {purchase.received_date && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Received Date</label>
                    <p className="text-base mt-1">{formatDate(purchase.received_date)}</p>
                  </div>
                </div>
              )}

              {purchase.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-base mt-1">{purchase.notes}</p>
                </div>
              )}
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
                  <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                  <p className="text-lg font-semibold">{purchase.product_variant_id.product_id.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU Code</label>
                  <p className="text-base font-mono">{purchase.product_variant_id.sku_code}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                  <p className="text-2xl font-bold">{purchase.quantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unit Price</label>
                  <p className="text-lg font-semibold">{formatCurrency(purchase.unit_price_at_purchase)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Value</label>
                  <p className="text-lg font-semibold">
                    {formatCurrency(purchase.quantity * purchase.unit_price_at_purchase)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Supplier Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Supplier Name</label>
                  <p className="text-lg font-semibold">{purchase.supplier_id.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${purchase.supplier_id.email}`}
                      className="text-base text-primary hover:underline"
                    >
                      {purchase.supplier_id.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Supplier ID</label>
                  <p className="text-base font-mono">{truncateId(purchase.supplier_id._id)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rating</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="text-base font-semibold">{purchase.supplier_id.rating}</span>
                    <span className="text-sm text-muted-foreground">/ 5</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product Cost</label>
                  <p className="text-lg font-semibold">
                    {formatCurrency(purchase.quantity * purchase.unit_price_at_purchase)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Packaging Cost</label>
                  <p className="text-lg">{formatCurrency(purchase.packaging_cost)}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Shipping Cost</label>
                  <p className="text-lg">{formatCurrency(purchase.shipping_cost)}</p>
                </div>
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-muted-foreground">Landing Price (Total)</label>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(purchase.landing_price)}
                  </p>
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
              <CardTitle>Purchase Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <Badge 
                  variant="outline" 
                  className={`${statusColors[purchase.status]} flex items-center gap-1`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {purchase.status}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                {purchase.status === 'Planned' && "Purchase is planned but not yet ordered."}
                {purchase.status === 'Pending' && "Purchase order has been placed, awaiting delivery."}
                {purchase.status === 'Partially Received' && "Some items have been received."}
                {purchase.status === 'Completed' && "All items have been received and processed."}
                {purchase.status === 'Cancelled' && "Purchase order has been cancelled."}
              </div>
            </CardContent>
          </Card>

          {/* Purchase Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Purchase ID</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{truncateId(purchase._id)}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{formatDate(purchase.createdAt)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">
                  {purchase.updatedAt ? formatDate(purchase.updatedAt) : 'Never'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inventory Updated</span>
                <Badge variant={purchase.inventory_updated_on_completion ? "default" : "secondary"}>
                  {purchase.inventory_updated_on_completion ? 'Yes' : 'No'}
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
              <Button variant="outline" className="w-full justify-start" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Purchase
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
                Delete Purchase
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
                    {formatDistanceToNow(new Date(purchase.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Purchase Date</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(purchase.purchase_date), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expected Delivery</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(purchase.expected_delivery_date), { addSuffix: true })}
                  </span>
                </div>

                {purchase.received_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Received</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(purchase.received_date), { addSuffix: true })}
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
              <p>• Use Edit to modify purchase information</p>
              <p>• Track delivery status in real-time</p>
              <p>• Delete removes the purchase permanently</p>
              <p>• Landing price includes all costs</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

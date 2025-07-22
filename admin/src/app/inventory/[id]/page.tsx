"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Calendar,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  AlertTriangle,
  Copy,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { toast } from 'sonner';
import { InventoryRecord } from '@/types/inventory';
import { getInventoryRecordById, getInventoryServiceErrorMessage } from '@/services/inventory-service';
import { getStockStatus, getStockStatusColor } from '@/types/inventory';

export default function InventoryViewPage() {
  const router = useRouter();
  const params = useParams();
  const inventoryId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<InventoryRecord | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load inventory record data
  useEffect(() => {
    const loadRecord = async () => {
      try {
        const recordData = await getInventoryRecordById(inventoryId);
        setRecord(recordData);
      } catch (error) {
        console.error('Failed to load inventory record:', error);
        const errorMessage = getInventoryServiceErrorMessage(error);
        toast.error(`Failed to load inventory record: ${errorMessage}`);
        router.push('/inventory');
      } finally {
        setLoading(false);
      }
    };

    if (inventoryId) {
      loadRecord();
    }
  }, [inventoryId, router]);

  const handleEdit = () => {
    router.push(`/inventory/${inventoryId}/edit`);
  };

  const handleBack = () => {
    router.push('/inventory');
  };

  const handleCopyId = async () => {
    if (record) {
      try {
        await navigator.clipboard.writeText(record._id);
        toast.success('Inventory ID copied to clipboard');
      } catch {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!record) return;

    const action = record.is_active ? 'deactivate' : 'activate';
    setActionLoading(action);

    try {
      // TODO: Implement toggle status API call
      toast.info(`${action} functionality coming soon`);
    } catch (error) {
      console.error(`Failed to ${action} inventory record:`, error);
      toast.error(`Failed to ${action} inventory record. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!record) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete this inventory record for "${record.product_variant_id.sku_code}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading('delete');

    try {
      // TODO: Implement delete API call
      toast.info('Delete functionality coming soon');
    } catch (error) {
      console.error('Failed to delete inventory record:', error);
      toast.error('Failed to delete inventory record. Please try again.');
      setActionLoading(null);
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Truncate ID for display
  const truncateId = (id: string) => {
    return `${id.slice(0, 8)}...${id.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading inventory record...</span>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Inventory Record Not Found</h2>
          <p className="text-muted-foreground mb-4">The inventory record you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={handleBack}>
            Back to Inventory
          </Button>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(record.stock_quantity, record.min_stock_level);
  const stockStatusColor = getStockStatusColor(stockStatus);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{record.product_variant_id.sku_code}</h1>
            <p className="text-muted-foreground mt-1">
              Inventory record details and information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={actionLoading === 'activate' || actionLoading === 'deactivate'}
          >
            {actionLoading === 'activate' || actionLoading === 'deactivate' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : record.is_active ? (
              <Archive className="h-4 w-4 mr-2" />
            ) : (
              <ArchiveRestore className="h-4 w-4 mr-2" />
            )}
            {record.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={actionLoading === 'delete'}
          >
            {actionLoading === 'delete' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU Code</label>
                  <p className="text-lg font-semibold">{record.product_variant_id.sku_code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product Price</label>
                  <p className="text-lg font-semibold">{formatCurrency(record.product_variant_id.price)}</p>
                </div>
              </div>

              {record.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-base mt-1">{record.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Stock Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold">{record.stock_quantity}</span>
                    <Badge className={`text-xs ${stockStatusColor}`}>
                      {stockStatus.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Minimum Stock Level</label>
                  <p className="text-xl font-semibold mt-1">{record.min_stock_level}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stock Status</label>
                  <p className="text-xl font-semibold mt-1 capitalize">{stockStatus.replace('_', ' ')}</p>
                </div>
              </div>

              {stockStatus === 'low_stock' && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Low Stock Warning</span>
                  <span className="text-sm">Consider restocking soon</span>
                </div>
              )}

              {stockStatus === 'out_of_stock' && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Out of Stock</span>
                  <span className="text-sm">Immediate restocking required</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location & Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Location & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Storage Location</label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base">{record.location}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Restock Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base">{formatDate(record.last_restock_date)}</span>
                  </div>
                </div>
              </div>

              {record.last_sold_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Sold Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base">{formatDate(record.last_sold_date)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Record Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <Badge variant={record.is_active ? "default" : "secondary"}>
                  {record.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                {record.is_active 
                  ? "This inventory record is active and being tracked."
                  : "This inventory record is inactive and not being tracked."
                }
              </div>
            </CardContent>
          </Card>

          {/* Record Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Record ID</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{truncateId(record._id)}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{formatDate(record.createdAt)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">{formatDate(record.updatedAt)}</span>
              </div>

              {record.createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Age</span>
                  <span className="text-sm">{formatDistanceToNow(new Date(record.createdAt), { addSuffix: true })}</span>
                </div>
              )}
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
                Edit Record
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleToggleStatus}
                disabled={actionLoading === 'activate' || actionLoading === 'deactivate'}
              >
                {actionLoading === 'activate' || actionLoading === 'deactivate' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : record.is_active ? (
                  <Archive className="h-4 w-4 mr-2" />
                ) : (
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                )}
                {record.is_active ? 'Deactivate' : 'Activate'}
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
                Delete Record
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Use Edit to modify inventory details</p>
              <p>• Deactivate to stop tracking this record</p>
              <p>• Delete permanently removes the record</p>
              <p>• Monitor stock levels to prevent shortages</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

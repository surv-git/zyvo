"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Package, 
  MapPin, 
  Loader2,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { InventoryRecord } from '@/types/inventory';
import { getInventoryRecordById, updateInventoryRecord, getInventoryServiceErrorMessage } from '@/services/inventory-service';
import { getStockStatus, getStockStatusColor } from '@/types/inventory';

interface InventoryFormData {
  stock_quantity: number;
  min_stock_level: number;
  location: string;
  notes: string;
  is_active: boolean;
}

interface InventoryFormErrors {
  stock_quantity?: string;
  min_stock_level?: string;
  location?: string;
  notes?: string;
}

export default function InventoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const inventoryId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState<InventoryRecord | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>({
    stock_quantity: 0,
    min_stock_level: 0,
    location: '',
    notes: '',
    is_active: true
  });
  const [errors, setErrors] = useState<InventoryFormErrors>({});

  // Load inventory record data
  useEffect(() => {
    const loadRecord = async () => {
      try {
        const recordData = await getInventoryRecordById(inventoryId);
        setRecord(recordData);
        setFormData({
          stock_quantity: recordData.stock_quantity || 0,
          min_stock_level: recordData.min_stock_level || 0,
          location: recordData.location || '',
          notes: recordData.notes || '',
          is_active: recordData.is_active ?? true
        });
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

  const validateForm = (): boolean => {
    const newErrors: InventoryFormErrors = {};

    if (formData.stock_quantity < 0) {
      newErrors.stock_quantity = 'Stock quantity cannot be negative';
    }

    if (formData.min_stock_level < 0) {
      newErrors.min_stock_level = 'Minimum stock level cannot be negative';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (formData.location.length < 2) {
      newErrors.location = 'Location must be at least 2 characters';
    } else if (formData.location.length > 100) {
      newErrors.location = 'Location must be less than 100 characters';
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof InventoryFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setSaving(true);

    try {
      // Prepare update data
      const updateData = {
        stock_quantity: formData.stock_quantity,
        min_stock_level: formData.min_stock_level,
        location: formData.location.trim(),
        notes: formData.notes.trim() || undefined,
        is_active: formData.is_active
      };

      await updateInventoryRecord(inventoryId, updateData);
      toast.success('Inventory record updated successfully');
      router.push(`/inventory/${inventoryId}`);
    } catch (error) {
      console.error('Failed to update inventory record:', error);
      const errorMessage = getInventoryServiceErrorMessage(error);
      toast.error(`Failed to update inventory record: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/inventory/${inventoryId}`);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
          <Button onClick={() => router.push('/inventory')}>
            Back to Inventory
          </Button>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(formData.stock_quantity, formData.min_stock_level);
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
            <h1 className="text-3xl font-bold tracking-tight">Edit Inventory Record</h1>
            <p className="text-muted-foreground mt-1">
              Update inventory information and stock levels
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information (Read-only) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Product Information
                </CardTitle>
                <CardDescription>
                  Product details (read-only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>SKU Code</Label>
                    <Input value={record.product_variant_id.sku_code} disabled />
                  </div>
                  <div>
                    <Label>Product Price</Label>
                    <Input value={formatCurrency(record.product_variant_id.price)} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Stock Information
                </CardTitle>
                <CardDescription>
                  Update current stock levels and minimum thresholds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">
                      Current Stock Quantity <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) => handleInputChange('stock_quantity', parseInt(e.target.value) || 0)}
                      className={errors.stock_quantity ? 'border-destructive' : ''}
                    />
                    {errors.stock_quantity && (
                      <p className="text-sm text-destructive">{errors.stock_quantity}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_stock_level">
                      Minimum Stock Level <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="min_stock_level"
                      type="number"
                      min="0"
                      value={formData.min_stock_level}
                      onChange={(e) => handleInputChange('min_stock_level', parseInt(e.target.value) || 0)}
                      className={errors.min_stock_level ? 'border-destructive' : ''}
                    />
                    {errors.min_stock_level && (
                      <p className="text-sm text-destructive">{errors.min_stock_level}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Alert when stock falls below this level
                    </p>
                  </div>
                </div>

                {/* Stock Status Preview */}
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Current Status:</span>
                    <Badge className={`text-xs ${stockStatusColor}`}>
                      {stockStatus.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {stockStatus === 'low_stock' && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Low stock warning - consider restocking</span>
                    </div>
                  )}

                  {stockStatus === 'out_of_stock' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Out of stock - immediate restocking required</span>
                    </div>
                  )}

                  {stockStatus === 'in_stock' && (
                    <div className="text-sm text-green-600">
                      Stock levels are healthy
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Record Status</Label>
                  <div className="flex items-center space-x-3 pt-2">
                    <Switch
                      id="status"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.is_active ? 'Active - record is being tracked' : 'Inactive - record is archived'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location & Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Location & Notes
                </CardTitle>
                <CardDescription>
                  Storage location and additional information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">
                    Storage Location <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Warehouse A, Shelf 3B, Room 101"
                    className={errors.location ? 'border-destructive' : ''}
                  />
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes about this inventory record..."
                    rows={4}
                    className={errors.notes ? 'border-destructive' : ''}
                  />
                  {errors.notes && (
                    <p className="text-sm text-destructive">{errors.notes}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {formData.notes.length}/500 characters
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                
                <Button type="button" variant="outline" className="w-full" onClick={handleBack}>
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Record Information */}
            <Card>
              <CardHeader>
                <CardTitle>Record Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">SKU Code</span>
                  <span className="text-sm font-mono">{record.product_variant_id.sku_code}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Restock</span>
                  <span className="text-sm">{formatDate(record.last_restock_date)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Sold</span>
                  <span className="text-sm">{formatDate(record.last_sold_date)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{formatDate(record.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Stock quantity is the current available units</p>
                <p>• Min stock level triggers low stock warnings</p>
                <p>• Location helps track physical storage</p>
                <p>• Use notes for special handling instructions</p>
                <p>• Inactive records are not tracked</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

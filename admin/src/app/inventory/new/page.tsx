"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { getInventoryServiceErrorMessage } from '@/services/inventory-service';
import { getStockStatus, getStockStatusColor } from '@/types/inventory';

interface InventoryFormData {
  product_variant_id: string;
  stock_quantity: number;
  min_stock_level: number;
  location: string;
  notes: string;
  is_active: boolean;
}

interface InventoryFormErrors {
  product_variant_id?: string;
  stock_quantity?: string;
  min_stock_level?: string;
  location?: string;
  notes?: string;
}

export default function AddInventoryPage() {
  const router = useRouter();
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<InventoryFormData>({
    product_variant_id: '',
    stock_quantity: 0,
    min_stock_level: 0,
    location: '',
    notes: '',
    is_active: true
  });
  const [errors, setErrors] = useState<InventoryFormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: InventoryFormErrors = {};

    if (!formData.product_variant_id.trim()) {
      newErrors.product_variant_id = 'Product variant ID is required';
    }

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
      // TODO: Implement create inventory API call
      toast.success('Inventory record created successfully');
      router.push('/inventory');
    } catch (error) {
      console.error('Failed to create inventory record:', error);
      const errorMessage = getInventoryServiceErrorMessage(error);
      toast.error(`Failed to create inventory record: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/inventory');
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Add New Inventory Record</h1>
            <p className="text-muted-foreground mt-1">
              Create a new inventory record with stock information
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Product Information
                </CardTitle>
                <CardDescription>
                  Select the product variant for this inventory record
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product_variant_id">
                    Product Variant ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="product_variant_id"
                    value={formData.product_variant_id}
                    onChange={(e) => handleInputChange('product_variant_id', e.target.value)}
                    placeholder="Enter product variant ID"
                    className={errors.product_variant_id ? 'border-destructive' : ''}
                  />
                  {errors.product_variant_id && (
                    <p className="text-sm text-destructive">{errors.product_variant_id}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Enter the unique ID of the product variant to track
                  </p>
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
                  Set initial stock levels and minimum thresholds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">
                      Initial Stock Quantity <span className="text-destructive">*</span>
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
                    <span className="text-sm font-medium">Stock Status:</span>
                    <Badge className={`text-xs ${stockStatusColor}`}>
                      {stockStatus.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {stockStatus === 'low_stock' && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Low stock warning - consider adding more stock</span>
                    </div>
                  )}

                  {stockStatus === 'out_of_stock' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Out of stock - increase initial stock quantity</span>
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
                      {formData.is_active ? 'Active - record will be tracked' : 'Inactive - record will be archived'}
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
                  <p className="text-sm text-muted-foreground">
                    Specify where this inventory is physically stored
                  </p>
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Record
                    </>
                  )}
                </Button>
                
                <Button type="button" variant="outline" className="w-full" onClick={handleBack}>
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Form Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Required Fields</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Product variant ID</li>
                    <li>• Storage location</li>
                    <li>• Stock quantities (can be 0)</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Best Practices</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Set realistic minimum stock levels</li>
                    <li>• Use clear location descriptions</li>
                    <li>• Add notes for special requirements</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Product variant ID must match existing products</p>
                <p>• Minimum stock level triggers low stock alerts</p>
                <p>• Location helps with physical inventory management</p>
                <p>• Use notes for special handling instructions</p>
                <p>• Set to active when ready to start tracking</p>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Stock quantity is the current available units</p>
                <p>• Min stock level prevents stockouts</p>
                <p>• Location should be specific and clear</p>
                <p>• Inactive records are not tracked</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
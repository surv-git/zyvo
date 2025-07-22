"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Package,
  Building2,
  DollarSign,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Purchase } from '@/types/purchase';
import { getPurchase, updatePurchase } from '@/services/purchase-service';

interface PurchaseFormData {
  purchase_order_number: string;
  purchase_date: string;
  expected_delivery_date: string;
  received_date: string;
  quantity: number;
  unit_price_at_purchase: number;
  packaging_cost: number;
  shipping_cost: number;
  landing_price: number;
  status: 'Planned' | 'Pending' | 'Completed' | 'Cancelled' | 'Partially Received';
  notes: string;
  inventory_updated_on_completion: boolean;
}

export default function PurchaseEditPage() {
  const router = useRouter();
  const params = useParams();
  const purchaseId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [formData, setFormData] = useState<PurchaseFormData>({
    purchase_order_number: '',
    purchase_date: '',
    expected_delivery_date: '',
    received_date: '',
    quantity: 0,
    unit_price_at_purchase: 0,
    packaging_cost: 0,
    shipping_cost: 0,
    landing_price: 0,
    status: 'Planned',
    notes: '',
    inventory_updated_on_completion: false
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PurchaseFormData, string>>>({});

  // Load purchase data
  useEffect(() => {
    const loadPurchase = async () => {
      try {
        const response = await getPurchase(purchaseId);
        const purchaseData = response.data;
        setPurchase(purchaseData);
        
        // Format dates for input fields
        const formatDate = (dateStr: string | null) => {
          if (!dateStr) return '';
          return new Date(dateStr).toISOString().split('T')[0];
        };

        setFormData({
          purchase_order_number: purchaseData.purchase_order_number || '',
          purchase_date: formatDate(purchaseData.purchase_date) || '',
          expected_delivery_date: formatDate(purchaseData.expected_delivery_date) || '',
          received_date: formatDate(purchaseData.received_date) || '',
          quantity: purchaseData.quantity || 0,
          unit_price_at_purchase: purchaseData.unit_price_at_purchase || 0,
          packaging_cost: purchaseData.packaging_cost || 0,
          shipping_cost: purchaseData.shipping_cost || 0,
          landing_price: purchaseData.landing_price || 0,
          status: purchaseData.status || 'Planned',
          notes: purchaseData.notes || '',
          inventory_updated_on_completion: purchaseData.inventory_updated_on_completion ?? false
        });
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

  // Calculate landing price when costs change
  useEffect(() => {
    const productCost = formData.quantity * formData.unit_price_at_purchase;
    const totalCost = productCost + formData.packaging_cost + formData.shipping_cost;
    setFormData(prev => ({ ...prev, landing_price: totalCost }));
  }, [formData.quantity, formData.unit_price_at_purchase, formData.packaging_cost, formData.shipping_cost]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PurchaseFormData, string>> = {};

    if (!formData.purchase_order_number.trim()) {
      newErrors.purchase_order_number = 'Order number is required';
    }

    if (!formData.purchase_date) {
      newErrors.purchase_date = 'Purchase date is required';
    }

    if (!formData.expected_delivery_date) {
      newErrors.expected_delivery_date = 'Expected delivery date is required';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.unit_price_at_purchase <= 0) {
      newErrors.unit_price_at_purchase = 'Unit price must be greater than 0';
    }

    if (formData.packaging_cost < 0) {
      newErrors.packaging_cost = 'Packaging cost cannot be negative';
    }

    if (formData.shipping_cost < 0) {
      newErrors.shipping_cost = 'Shipping cost cannot be negative';
    }

    // Validate date logic
    if (formData.purchase_date && formData.expected_delivery_date) {
      const purchaseDate = new Date(formData.purchase_date);
      const expectedDate = new Date(formData.expected_delivery_date);
      if (expectedDate < purchaseDate) {
        newErrors.expected_delivery_date = 'Expected delivery date cannot be before purchase date';
      }
    }

    if (formData.received_date && formData.purchase_date) {
      const purchaseDate = new Date(formData.purchase_date);
      const receivedDate = new Date(formData.received_date);
      if (receivedDate < purchaseDate) {
        newErrors.received_date = 'Received date cannot be before purchase date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PurchaseFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
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
        purchase_order_number: formData.purchase_order_number.trim(),
        purchase_date: formData.purchase_date,
        expected_delivery_date: formData.expected_delivery_date,
        received_date: formData.received_date || undefined,
        quantity: formData.quantity,
        unit_price_at_purchase: formData.unit_price_at_purchase,
        packaging_cost: formData.packaging_cost,
        shipping_cost: formData.shipping_cost,
        landing_price: formData.landing_price,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
        inventory_updated_on_completion: formData.inventory_updated_on_completion
      };

      await updatePurchase(purchaseId, updateData);
      toast.success('Purchase updated successfully');
      router.push(`/purchases/${purchaseId}`);
    } catch (error) {
      console.error('Failed to update purchase:', error);
      toast.error('Failed to update purchase. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/purchases/${purchaseId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
          <Button onClick={() => router.push('/purchases')}>
            Back to Purchases
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        showBackButton={true}
        onBack={handleBack}
        title="Edit Purchase"
        description="Update purchase information and settings"
        icon={Package}
        actions={[
          {
            label: saving ? 'Updating...' : 'Update Purchase',
            onClick: () => {
              const form = document.querySelector('form') as HTMLFormElement;
              if (form) form.requestSubmit();
            },
            icon: Save,
            disabled: saving
          }
        ]}
      />

      <form onSubmit={handleSubmit}>
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
                <CardDescription>
                  Update the purchase order details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_order_number">
                    Order Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="purchase_order_number"
                    value={formData.purchase_order_number}
                    onChange={(e) => handleInputChange('purchase_order_number', e.target.value)}
                    placeholder="Enter order number"
                    className={errors.purchase_order_number ? 'border-destructive' : ''}
                  />
                  {errors.purchase_order_number && (
                    <p className="text-sm text-destructive">{errors.purchase_order_number}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">
                      Purchase Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                      className={errors.purchase_date ? 'border-destructive' : ''}
                    />
                    {errors.purchase_date && (
                      <p className="text-sm text-destructive">{errors.purchase_date}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expected_delivery_date">
                      Expected Delivery <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="expected_delivery_date"
                      type="date"
                      value={formData.expected_delivery_date}
                      onChange={(e) => handleInputChange('expected_delivery_date', e.target.value)}
                      className={errors.expected_delivery_date ? 'border-destructive' : ''}
                    />
                    {errors.expected_delivery_date && (
                      <p className="text-sm text-destructive">{errors.expected_delivery_date}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="received_date">Received Date</Label>
                    <Input
                      id="received_date"
                      type="date"
                      value={formData.received_date}
                      onChange={(e) => handleInputChange('received_date', e.target.value)}
                      className={errors.received_date ? 'border-destructive' : ''}
                    />
                    {errors.received_date && (
                      <p className="text-sm text-destructive">{errors.received_date}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'Planned' | 'Pending' | 'Completed' | 'Cancelled' | 'Partially Received') => 
                        handleInputChange('status', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planned">Planned</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Partially Received">Partially Received</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Enter any additional notes"
                    rows={3}
                  />
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
                <CardDescription>
                  Product and quantity information (read-only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Product Name</Label>
                    <p className="text-lg font-semibold mt-1">
                      {purchase.product_variant_id.product_id.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">SKU Code</Label>
                    <p className="text-base font-mono mt-1">
                      {purchase.product_variant_id.sku_code}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">
                      Quantity <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                      className={errors.quantity ? 'border-destructive' : ''}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-destructive">{errors.quantity}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_price_at_purchase">
                      Unit Price <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="unit_price_at_purchase"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unit_price_at_purchase}
                      onChange={(e) => handleInputChange('unit_price_at_purchase', parseFloat(e.target.value) || 0)}
                      className={errors.unit_price_at_purchase ? 'border-destructive' : ''}
                    />
                    {errors.unit_price_at_purchase && (
                      <p className="text-sm text-destructive">{errors.unit_price_at_purchase}</p>
                    )}
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
                <CardDescription>
                  Supplier information (read-only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Supplier Name</Label>
                    <p className="text-lg font-semibold mt-1">{purchase.supplier_id.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Contact Email</Label>
                    <p className="text-base mt-1">{purchase.supplier_id.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Cost Breakdown
                </CardTitle>
                <CardDescription>
                  Update cost information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="packaging_cost">Packaging Cost</Label>
                    <Input
                      id="packaging_cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.packaging_cost}
                      onChange={(e) => handleInputChange('packaging_cost', parseFloat(e.target.value) || 0)}
                      className={errors.packaging_cost ? 'border-destructive' : ''}
                    />
                    {errors.packaging_cost && (
                      <p className="text-sm text-destructive">{errors.packaging_cost}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shipping_cost">Shipping Cost</Label>
                    <Input
                      id="shipping_cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.shipping_cost}
                      onChange={(e) => handleInputChange('shipping_cost', parseFloat(e.target.value) || 0)}
                      className={errors.shipping_cost ? 'border-destructive' : ''}
                    />
                    {errors.shipping_cost && (
                      <p className="text-sm text-destructive">{errors.shipping_cost}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Product Cost</Label>
                    <p className="text-lg font-semibold mt-1">
                      {formatCurrency(formData.quantity * formData.unit_price_at_purchase)}
                    </p>
                  </div>
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium text-muted-foreground">Landing Price (Total)</Label>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {formatCurrency(formData.landing_price)}
                    </p>
                  </div>
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
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Purchase
                    </>
                  )}
                </Button>
                
                <Button type="button" variant="outline" className="w-full" onClick={handleBack}>
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Purchase Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Status</span>
                  <Badge variant="outline">
                    {formData.status}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {formData.status === 'Planned' && "Purchase is planned but not yet ordered."}
                  {formData.status === 'Pending' && "Purchase order has been placed, awaiting delivery."}
                  {formData.status === 'Partially Received' && "Some items have been received."}
                  {formData.status === 'Completed' && "All items have been received and processed."}
                  {formData.status === 'Cancelled' && "Purchase order has been cancelled."}
                </div>
              </CardContent>
            </Card>

            {/* Purchase Information */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Purchase ID</span>
                  <span className="text-sm font-mono">{purchase._id.slice(-8)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{new Date(purchase.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm">
                    {purchase.updatedAt ? new Date(purchase.updatedAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Order number and dates are required</p>
                <p>• Quantity and unit price must be positive</p>
                <p>• Landing price is calculated automatically</p>
                <p>• Update status as delivery progresses</p>
                <p>• Add notes for important information</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

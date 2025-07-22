'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Save, ShoppingCart, Info, Plus } from 'lucide-react';
import Link from 'next/link';
import { createPurchase } from '@/services/purchase-service';
import { getSuppliers } from '@/services/supplier-service';
import { getProductVariantList } from '@/services/product-variant-service';
import type { PurchaseCreateRequest } from '@/types/purchase';
import type { Supplier } from '@/types/supplier';
import type { ProductVariant } from '@/types/product-variant';

export default function NewPurchasePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<PurchaseCreateRequest>({
    supplier_id: '',
    product_variant_id: '',
    purchase_order_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    quantity: 1,
    unit_price_at_purchase: 0,
    packaging_cost: 0,
    shipping_cost: 0,
    landing_price: 0,
    status: 'Planned',
    notes: ''
  });

  // Dropdown data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedProductVariant, setSelectedProductVariant] = useState<ProductVariant | null>(null);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Load suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        const response = await getSuppliers({
          page: 1,
          limit: 100,
          status: 'Active',
          sort: 'name',
          order: 'asc'
        });
        setSuppliers(response.data || []);
      } catch (err) {
        console.error('Error loading suppliers:', err);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Load product variants on component mount
  useEffect(() => {
    const fetchProductVariants = async () => {
      try {
        setLoadingVariants(true);
        const response = await getProductVariantList({
          page: 1,
          limit: 100,
          is_active: true,
          sort: 'sku_code',
          order: 'asc'
        });
        setProductVariants(response.data || []);
      } catch (err) {
        console.error('Error loading product variants:', err);
      } finally {
        setLoadingVariants(false);
      }
    };

    fetchProductVariants();
  }, []);

  // Update selected supplier when supplier_id changes
  useEffect(() => {
    if (formData.supplier_id) {
      const supplier = suppliers.find(s => s._id === formData.supplier_id);
      setSelectedSupplier(supplier || null);
    } else {
      setSelectedSupplier(null);
    }
  }, [formData.supplier_id, suppliers]);

  // Update selected product variant when product_variant_id changes
  useEffect(() => {
    if (formData.product_variant_id) {
      const variant = productVariants.find(v => v.id === formData.product_variant_id);
      setSelectedProductVariant(variant || null);
    } else {
      setSelectedProductVariant(null);
    }
  }, [formData.product_variant_id, productVariants]);

  const handleInputChange = (field: keyof PurchaseCreateRequest, value: unknown) => {
    const newFormData = {
      ...formData,
      [field]: value,
    };
    
    // Auto-calculate landing_price when cost fields change
    if (['quantity', 'unit_price_at_purchase', 'packaging_cost', 'shipping_cost'].includes(field)) {
      const subtotal = newFormData.quantity * newFormData.unit_price_at_purchase;
      const packaging = newFormData.packaging_cost || 0;
      const shipping = newFormData.shipping_cost || 0;
      newFormData.landing_price = subtotal + packaging + shipping;
    }
    
    setFormData(newFormData);
  };

  const calculateTotalCost = () => {
    const subtotal = formData.quantity * formData.unit_price_at_purchase;
    const packaging = formData.packaging_cost || 0;
    const shipping = formData.shipping_cost || 0;
    return subtotal + packaging + shipping;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    // Basic validation
    if (!formData.supplier_id) {
      setError('Please select a supplier');
      return;
    }
    if (!formData.product_variant_id) {
      setError('Please select a product variant');
      return;
    }
    if (formData.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (formData.unit_price_at_purchase <= 0) {
      setError('Unit price must be greater than 0');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const newPurchase = await createPurchase(formData);
      router.push(`/purchases/${newPurchase.data._id}`);
    } catch (err) {
      console.error('Error creating purchase:', err);
      setError(err instanceof Error ? err.message : 'Failed to create purchase');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/purchases');
  };

  return (
    <div className="page-container">
      <PageHeader
        showBackButton={true}
        onBack={handleBack}
        title="New Purchase"
        description="Create a new purchase order"
        icon={ShoppingCart}
        actions={[
          {
            label: saving ? 'Creating...' : 'Create Purchase',
            onClick: () => {
              const form = document.getElementById('new-purchase-form') as HTMLFormElement;
              if (form) form.requestSubmit();
            },
            icon: Save,
            disabled: saving
          }
        ]}
      />

      <form id="new-purchase-form" onSubmit={handleSubmit} className="page-form">
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
            {error}
          </div>
        )}

        <div className="page-grid-2">
          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Supplier Information</CardTitle>
                  <CardDescription>
                    Select the supplier for this purchase
                  </CardDescription>
                </div>
                <Link href="/suppliers/new">
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Supplier
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier *</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => handleInputChange('supplier_id', value)}
                    disabled={loadingSuppliers}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingSuppliers ? "Loading suppliers..." : "Select a supplier"} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier._id} value={supplier._id}>
                          {supplier.name} - {supplier.email || 'No email'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSupplier && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                          <Info className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Supplier Details</h4>
                          <div className="text-xs space-y-1">
                            <div><strong>Name:</strong> {selectedSupplier.name}</div>
                            <div><strong>Email:</strong> {selectedSupplier.email || 'N/A'}</div>
                            <div><strong>Website:</strong> {selectedSupplier.website || 'N/A'}</div>
                            <div><strong>Country:</strong> {selectedSupplier.address?.country || 'N/A'}</div>
                            <div><strong>Payment Terms:</strong> {selectedSupplier.payment_terms || 'N/A'}</div>
                            <div className="flex items-center gap-1">
                              <strong>Status:</strong>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                selectedSupplier.status === 'Active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {selectedSupplier.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Information</CardTitle>
                  <CardDescription>
                    Select the product variant to purchase
                  </CardDescription>
                </div>
                <Link href="/product-variants/new">
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Variant
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product_variant_id">Product Variant *</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={formData.product_variant_id}
                    onValueChange={(value) => handleInputChange('product_variant_id', value)}
                    disabled={loadingVariants}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingVariants ? "Loading variants..." : "Select a product variant"} />
                    </SelectTrigger>
                    <SelectContent>
                      {productVariants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.sku_code} - {variant.product_id.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProductVariant && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                          <Info className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Product Variant Details</h4>
                          <div className="text-xs space-y-1">
                            <div><strong>SKU:</strong> {selectedProductVariant.sku_code}</div>
                            <div><strong>Product:</strong> {selectedProductVariant.product_id.name}</div>
                            <div><strong>Price:</strong> ${selectedProductVariant.price.toFixed(2)}</div>
                            <div className="flex items-center gap-1">
                              <strong>Status:</strong>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                selectedProductVariant.is_active
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {selectedProductVariant.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Details */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Details</CardTitle>
            <CardDescription>
              Enter the purchase quantity and cost information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_order_number">Purchase Order Number</Label>
                <Input
                  id="purchase_order_number"
                  type="text"
                  value={formData.purchase_order_number}
                  onChange={(e) => handleInputChange('purchase_order_number', e.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date *</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_price_at_purchase">Unit Price *</Label>
                <Input
                  id="unit_price_at_purchase"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_price_at_purchase}
                  onChange={(e) => handleInputChange('unit_price_at_purchase', parseFloat(e.target.value) || 0)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Partially Received">Partially Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packaging_cost">Packaging Cost</Label>
                <Input
                  id="packaging_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.packaging_cost}
                  onChange={(e) => handleInputChange('packaging_cost', parseFloat(e.target.value) || 0)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping_cost">Shipping Cost</Label>
                <Input
                  id="shipping_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.shipping_cost}
                  onChange={(e) => handleInputChange('shipping_cost', parseFloat(e.target.value) || 0)}
                  className="font-mono"
                />
              </div>
            </div>

            {/* Cost Summary */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Cost Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal ({formData.quantity} × ${formData.unit_price_at_purchase.toFixed(2)}):</span>
                  <span className="font-mono">${(formData.quantity * formData.unit_price_at_purchase).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Packaging Cost:</span>
                  <span className="font-mono">${(formData.packaging_cost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Cost:</span>
                  <span className="font-mono">${(formData.shipping_cost || 0).toFixed(2)}</span>
                </div>
                <div className="border-t pt-1 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Landing Price:</span>
                    <span className="font-mono">${calculateTotalCost().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>
              Delivery details and notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
              <Input
                id="expected_delivery_date"
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => handleInputChange('expected_delivery_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any additional notes about this purchase..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

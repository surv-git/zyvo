'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Save, 
  XCircle,
  Plus,
  X,
  Package,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { 
  getProductVariantById, 
  updateProductVariant 
} from '@/services/product-variant-service';
import type { ProductVariant, ProductVariantUpdateRequest } from '@/types/product-variant';

export default function EditProductVariantPage() {
  const params = useParams();
  const router = useRouter();
  const [productVariant, setProductVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productVariantId = params.id as string;

  // Form state
  const [formData, setFormData] = useState({
    sku_code: '',
    price: 0,
    discount_details: {
      price: undefined as number | undefined,
      percentage: undefined as number | undefined,
      end_date: undefined as string | undefined,
    },
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
      unit: 'cm',
    },
    weight: {
      value: 0,
      unit: 'kg',
    },
    packaging_cost: 0,
    shipping_cost: 0,
    is_active: true,
    sort_order: 0,
    images: [] as string[],
  });

  const [isOnSale, setIsOnSale] = useState(false);

  useEffect(() => {
    const fetchProductVariant = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProductVariantById(productVariantId);
        setProductVariant(data);
        
        // Populate form with existing data
        setFormData({
          sku_code: data.sku_code,
          price: data.price,
          discount_details: {
            price: data.discount_details.price,
            percentage: data.discount_details.percentage,
            end_date: data.discount_details.end_date,
          },
          dimensions: {
            length: data.dimensions.length,
            width: data.dimensions.width,
            height: data.dimensions.height,
            unit: data.dimensions.unit,
          },
          weight: {
            value: data.weight.value,
            unit: data.weight.unit,
          },
          packaging_cost: data.packaging_cost,
          shipping_cost: data.shipping_cost,
          is_active: data.is_active,
          sort_order: data.sort_order,
          images: data.images || [],
        });
        
        setIsOnSale(data.discount_details.is_on_sale);
      } catch (err) {
        console.error('Error fetching product variant:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch product variant');
      } finally {
        setLoading(false);
      }
    };

    if (productVariantId) {
      fetchProductVariant();
    }
  }, [productVariantId]);

  const handleInputChange = (field: string, value: unknown) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleImageAdd = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url],
      }));
    }
  };

  const handleImageRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sku_code) {
      setError('SKU Code is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updateData: ProductVariantUpdateRequest = {
        sku_code: formData.sku_code,
        price: formData.price,
        discount_details: isOnSale ? {
          price: formData.discount_details.price,
          percentage: formData.discount_details.percentage,
          end_date: formData.discount_details.end_date,
        } : undefined,
        dimensions: formData.dimensions,
        weight: formData.weight,
        packaging_cost: formData.packaging_cost,
        shipping_cost: formData.shipping_cost,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
        images: formData.images,
      };

      await updateProductVariant(productVariantId, updateData);
      router.push(`/product-variants/${productVariantId}`);
    } catch (err) {
      console.error('Error updating product variant:', err);
      setError(err instanceof Error ? err.message : 'Failed to update product variant');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/product-variants/${productVariantId}`);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Loading product variant...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !productVariant) {
    return (
      <div className="page-container">
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!productVariant) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Product variant not found</p>
            <Link href="/product-variants">
              <Button variant="outline" className="mt-2">
                Back to Product Variants
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        showBackButton={true}
        onBack={handleBack}
        title={`Edit ${productVariant.product_id.name} - ${productVariant.sku_code}`}
        description="Edit product variant details"
        icon={Package}
        actions={[
          {
            label: saving ? 'Saving...' : 'Save Changes',
            onClick: () => {
              const form = document.getElementById('edit-variant-form') as HTMLFormElement;
              if (form) form.requestSubmit();
            },
            icon: Save,
            disabled: saving
          }
        ]}
      />

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form id="edit-variant-form" onSubmit={handleSubmit} className="page-form">
        {/* Product and Options Information - Side by Side */}
        <div className="page-grid-2">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Information</CardTitle>
                  <CardDescription>
                    Details about the associated product (read-only)
                  </CardDescription>
                </div>
                <Link href={`/products/${productVariant.product_id._id}`}>
                  <Button type="button" variant="outline" size="sm">
                    <Package className="mr-2 h-4 w-4" />
                    View Product
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{productVariant.product_id.name}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                        <Info className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">Product Details</h4>
                        <div className="text-xs space-y-1">
                          <div><strong>ID:</strong> {productVariant.product_id._id}</div>
                          <div><strong>Name:</strong> {productVariant.product_id.name}</div>
                          {productVariant.product_id.description && (
                            <div><strong>Description:</strong> {productVariant.product_id.description}</div>
                          )}
                          <div><strong>Slug:</strong> {productVariant.product_id.slug}</div>
                          {productVariant.product_id.primary_image && (
                            <div><strong>Primary Image:</strong> Yes</div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Options</CardTitle>
                  <CardDescription>
                    Option values for this variant (read-only)
                  </CardDescription>
                </div>
                <Link href="/options">
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Manage Options
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {productVariant.option_values && productVariant.option_values.length > 0 ? (
                <>
                  {/* Column Headers */}
                  <div className="grid grid-cols-2 gap-2">
                    <Label>Option</Label>
                    <Label>Value</Label>
                  </div>
                  
                  <div className="space-y-3">
                    {productVariant.option_values.map((option, index) => (
                      <div key={index} className="grid grid-cols-2 gap-2 items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{option.option_type}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">{option.option_value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No options configured</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Basic Information, Pricing & Discounts, Physical Properties - Balanced Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>
                Core product variant details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sku_code">SKU Code *</Label>
                <Input
                  id="sku_code"
                  value={formData.sku_code}
                  onChange={(e) => handleInputChange('sku_code', e.target.value)}
                  placeholder="Enter SKU code"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Discounts */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Pricing & Discounts</CardTitle>
              <CardDescription>
                Discount settings and additional costs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_on_sale"
                  checked={isOnSale}
                  onCheckedChange={setIsOnSale}
                />
                <Label htmlFor="is_on_sale">On Sale</Label>
              </div>

              {isOnSale && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="discount_percentage">Discount Percentage (%)</Label>
                      <Input
                        id="discount_percentage"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.discount_details.percentage || ''}
                        onChange={(e) => handleInputChange('discount_details.percentage', parseFloat(e.target.value) || undefined)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount_price">Discount Price ($)</Label>
                      <Input
                        id="discount_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.discount_details.price || ''}
                        onChange={(e) => handleInputChange('discount_details.price', parseFloat(e.target.value) || undefined)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sale_end_date">Sale End Date</Label>
                      <Input
                        id="sale_end_date"
                        type="datetime-local"
                        value={formData.discount_details.end_date || ''}
                        onChange={(e) => handleInputChange('discount_details.end_date', e.target.value || undefined)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="packaging_cost">Packaging Cost ($)</Label>
                  <Input
                    id="packaging_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.packaging_cost}
                    onChange={(e) => handleInputChange('packaging_cost', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping_cost">Shipping Cost ($)</Label>
                  <Input
                    id="shipping_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.shipping_cost}
                    onChange={(e) => handleInputChange('shipping_cost', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Physical Properties */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Physical Properties</CardTitle>
              <CardDescription>
                Dimensions and weight information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="length">Length</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.dimensions.length}
                    onChange={(e) => handleInputChange('dimensions.length', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.dimensions.width}
                    onChange={(e) => handleInputChange('dimensions.width', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.dimensions.height}
                    onChange={(e) => handleInputChange('dimensions.height', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dimensions_unit">Unit</Label>
                  <Select
                    value={formData.dimensions.unit}
                    onValueChange={(value) => handleInputChange('dimensions.unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm">Centimeters</SelectItem>
                      <SelectItem value="in">Inches</SelectItem>
                      <SelectItem value="m">Meters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight_value">Weight</Label>
                <div className="flex space-x-2">
                  <Input
                    id="weight_value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weight.value}
                    onChange={(e) => handleInputChange('weight.value', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="flex-1"
                  />
                  <Select
                    value={formData.weight.unit}
                    onValueChange={(value) => handleInputChange('weight.unit', value)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lb">lb</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>
              Product variant images
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Image URLs</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImageAdd}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Image
              </Button>
            </div>

            <div className="space-y-2">
              {formData.images.map((image, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={image}
                    onChange={(e) => {
                      const newImages = [...formData.images];
                      newImages[index] = e.target.value;
                      handleInputChange('images', newImages);
                    }}
                    placeholder="Image URL"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleImageRemove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {formData.images.length === 0 && (
                <p className="text-sm text-muted-foreground">No images added</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="page-form-actions">
          <Link href={`/product-variants/${productVariantId}`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

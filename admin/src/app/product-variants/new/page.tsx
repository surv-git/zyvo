'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/ui/page-header';
import { ProductCombobox } from '@/components/ui/product-combobox';
import { OptionCombobox } from '@/components/ui/option-combobox';
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
import { createProductVariant } from '@/services/product-variant-service';
import { getProductList } from '@/services/product-service';
import { getOptionById } from '@/services/option-service';
import type { ProductVariantCreateRequest } from '@/types/product-variant';
import type { Product } from '@/types/product';
import type { Option } from '@/types/option';

export default function NewProductVariantPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selected product for display purposes only
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
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
    option_values: [] as string[],
  });

  const [isOnSale, setIsOnSale] = useState(false);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(['']); // Start with one empty option
  const [optionValues, setOptionValues] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, Option | null>>({});

  // Load selected product details when product ID changes
  useEffect(() => {
    const loadSelectedProduct = async () => {
      if (formData.product_id) {
        try {
          const response = await getProductList({
            page: 1,
            limit: 50,
            search: '', // Don't search, get all products and filter
            sort: 'name',
            order: 'asc',
            include_inactive: true
          });
          const product = response.products.find(p => p._id === formData.product_id);
          setSelectedProduct(product || null);
          console.log('Product loaded:', product); // Debug log
          console.log('Looking for product ID:', formData.product_id); // Debug log
          console.log('Available products:', response.products.map(p => p._id)); // Debug log
        } catch (err) {
          console.error('Error loading selected product:', err);
          setSelectedProduct(null);
        }
      } else {
        setSelectedProduct(null);
      }
    };

    loadSelectedProduct();
  }, [formData.product_id]);

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

  const handleOptionAdd = () => {
    setSelectedOptionIds(prev => [...prev, '']);
  };

  const handleOptionRemove = (index: number) => {
    const optionId = selectedOptionIds[index];
    setSelectedOptionIds(prev => prev.filter((_, i) => i !== index));
    setOptionValues(prev => {
      const newValues = { ...prev };
      if (optionId) {
        delete newValues[optionId];
      }
      return newValues;
    });
    // Remove from selectedOptions state as well
    if (optionId) {
      setSelectedOptions(prev => {
        const newOptions = { ...prev };
        delete newOptions[optionId];
        return newOptions;
      });
    }
  };

  const handleOptionChange = async (index: number, optionId: string) => {
    const oldOptionId = selectedOptionIds[index];
    setSelectedOptionIds(prev => prev.map((id, i) => 
      i === index ? optionId : id
    ));
    
    // Update option values - remove old key if it exists
    setOptionValues(prev => {
      const newValues = { ...prev };
      if (oldOptionId && oldOptionId !== optionId) {
        delete newValues[oldOptionId];
      }
      if (optionId && !newValues[optionId]) {
        newValues[optionId] = '';
      }
      return newValues;
    });

    // Load option details for display
    if (optionId) {
      try {
        console.log('Looking for option ID:', optionId); // Debug log
        const option = await getOptionById(optionId);
        setSelectedOptions(prev => ({
          ...prev,
          [optionId]: option || null
        }));
        console.log('Option loaded:', option); // Debug log
      } catch (err) {
        console.error('Error loading selected option:', err);
        setSelectedOptions(prev => ({
          ...prev,
          [optionId]: null
        }));
      }
    } else {
      // Remove option details if optionId is empty
      setSelectedOptions(prev => {
        const newOptions = { ...prev };
        if (oldOptionId) {
          delete newOptions[oldOptionId];
        }
        return newOptions;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.sku_code) {
      setError('Product ID and SKU Code are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const createData: ProductVariantCreateRequest = {
        product_id: formData.product_id,
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
        option_values: selectedOptionIds
          .filter(optionId => optionId && optionValues[optionId])
          .map(optionId => `${optionId}:${optionValues[optionId]}`),
      };

      const newVariant = await createProductVariant(createData);
      router.push(`/product-variants/${newVariant.id}`);
    } catch (err) {
      console.error('Error creating product variant:', err);
      setError(err instanceof Error ? err.message : 'Failed to create product variant');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/product-variants');
  };

  return (
    <div className="page-container">
      <PageHeader
        showBackButton={true}
        onBack={handleBack}
        title="New Product Variant"
        description="Create a new product variant"
        icon={Package}
        actions={[
          {
            label: saving ? 'Creating...' : 'Create Variant',
            onClick: () => {
              const form = document.getElementById('new-variant-form') as HTMLFormElement;
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
      <form id="new-variant-form" onSubmit={handleSubmit} className="page-form">
        {/* Product and Options Selection - Side by Side */}
        <div className="page-grid-2">
          {/* Product Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Selection</CardTitle>
                  <CardDescription>
                    Select the product this variant belongs to
                  </CardDescription>
                </div>
                <Link href="/products/new">
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Product
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product_id">Product *</Label>
                <div className="flex items-center gap-2">
                  <ProductCombobox
                    value={formData.product_id}
                    onValueChange={(value) => handleInputChange('product_id', value)}
                  />
                  {formData.product_id && selectedProduct && (
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
                            <div><strong>ID:</strong> {selectedProduct._id}</div>
                            <div><strong>Name:</strong> {selectedProduct.name}</div>
                            {selectedProduct.description && (
                              <div><strong>Description:</strong> {selectedProduct.description}</div>
                            )}
                            <div><strong>Category:</strong> {selectedProduct.category_id.name}</div>
                            <div><strong>Brand:</strong> {selectedProduct.brand_id.name}</div>
                            <div><strong>Min Price:</strong> ${selectedProduct.min_price.toFixed(2)}</div>
                            <div className="flex items-center gap-1">
                              <strong>Status:</strong>
                              <span className={`px-2 py-0.5 rounded text-xs ${selectedProduct.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                                {selectedProduct.is_active ? 'Active' : 'Inactive'}
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

          {/* Options Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Options</CardTitle>
                  <CardDescription>
                    Select options and their values for this variant
                  </CardDescription>
                </div>
                <Link href="/options/new">
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Option
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Column Headers */}
              <div className="grid grid-cols-2 gap-2">
                <Label>Option</Label>
                <Label>Value</Label>
              </div>
              
              <div className="space-y-3">
                {selectedOptionIds.map((optionId, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2 items-center">
                    <div className="flex items-center gap-2">
                      <OptionCombobox
                        value={optionId}
                        onValueChange={(value) => handleOptionChange(index, value)}
                        excludeIds={selectedOptionIds.filter((id, i) => i !== index && id)}
                      />
                      {optionId && selectedOptions[optionId] && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                              <Info className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-medium">Option Details</h4>
                              <div className="text-xs space-y-1">
                                <div><strong>ID:</strong> {optionId}</div>
                                <div><strong>Name:</strong> {selectedOptions[optionId]?.name}</div>
                                <div><strong>Type:</strong> {selectedOptions[optionId]?.option_type}</div>
                                <div><strong>Sort Order:</strong> {selectedOptions[optionId]?.sort_order}</div>
                                <div className="flex items-center gap-1">
                                  <strong>Status:</strong>
                                  <span className={`px-2 py-0.5 rounded text-xs ${selectedOptions[optionId]?.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                                    {selectedOptions[optionId]?.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id={`option_value_${index}`}
                        value={optionValues[optionId] || ''}
                        onChange={(e) => {
                          setOptionValues(prev => ({
                            ...prev,
                            [optionId]: e.target.value
                          }));
                        }}
                        placeholder="Enter value"
                        disabled={!optionId}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOptionRemove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end">                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOptionAdd}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              </div>
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
          <Link href="/product-variants">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Creating...' : 'Create Variant'}
          </Button>
        </div>
      </form>
    </div>
  );
}

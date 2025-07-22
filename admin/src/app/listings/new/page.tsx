'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Package, Globe, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createListing } from '@/services/listing-service';
import { ProductVariantCombobox } from '@/components/ui/product-variant-combobox';
import { PlatformCombobox } from '@/components/ui/platform-combobox';
import type { ListingCreateData, ListingStatus } from '@/types/listing';
import type { ProductVariant } from '@/types/product-variant';
import type { Platform } from '@/types/platform';

interface ListingFormData {
  product_variant_id: string;
  platform_id: string;
  platform_sku: string;
  platform_product_id: string;
  listing_status: ListingStatus;
  platform_price: number;
  platform_commission_percentage: number;
  platform_fixed_fee: number;
  platform_shipping_fee: number;
  is_active_on_platform: boolean;
}

export default function NewListingPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<ListingFormData>({
    product_variant_id: '',
    platform_id: '',
    platform_sku: '',
    platform_product_id: '',
    listing_status: 'Draft',
    platform_price: 0,
    platform_commission_percentage: 0,
    platform_fixed_fee: 0,
    platform_shipping_fee: 0,
    is_active_on_platform: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ListingFormData, string>>>({});
  
  // Selected items for display in sidebar
  const [selectedProductVariant, setSelectedProductVariant] = useState<ProductVariant | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  // Form validation
  const validateForm = () => {
    const newErrors: Partial<Record<keyof ListingFormData, string>> = {};

    if (!formData.product_variant_id) {
      newErrors.product_variant_id = 'Product variant is required';
    }

    if (!formData.platform_id) {
      newErrors.platform_id = 'Platform is required';
    }

    if (!formData.platform_sku.trim()) {
      newErrors.platform_sku = 'Platform SKU is required';
    }

    if (!formData.platform_product_id.trim()) {
      newErrors.platform_product_id = 'Platform Product ID is required';
    }

    if (formData.platform_price < 0) {
      newErrors.platform_price = 'Platform price must be positive';
    }

    if (formData.platform_commission_percentage < 0 || formData.platform_commission_percentage > 100) {
      newErrors.platform_commission_percentage = 'Commission percentage must be between 0 and 100';
    }

    if (formData.platform_fixed_fee < 0) {
      newErrors.platform_fixed_fee = 'Fixed fee must be positive';
    }

    if (formData.platform_shipping_fee < 0) {
      newErrors.platform_shipping_fee = 'Shipping fee must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ListingFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setSaving(true);

    try {
      const createData: ListingCreateData = {
        product_variant_id: formData.product_variant_id,
        platform_id: formData.platform_id,
        platform_sku: formData.platform_sku,
        platform_product_id: formData.platform_product_id,
        listing_status: formData.listing_status,
        platform_price: formData.platform_price,
        platform_commission_percentage: formData.platform_commission_percentage,
        platform_fixed_fee: formData.platform_fixed_fee,
        platform_shipping_fee: formData.platform_shipping_fee,
        is_active_on_platform: formData.is_active_on_platform,
      };

      const newListing = await createListing(createData);
      toast.success('Listing created successfully');
      router.push(`/listings/${newListing._id}`);
    } catch (error) {
      console.error('Failed to create listing:', error);
      toast.error('Failed to create listing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/listings');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate net revenue
  const calculateNetRevenue = () => {
    const commission = formData.platform_price * formData.platform_commission_percentage / 100;
    return formData.platform_price - commission - formData.platform_fixed_fee - formData.platform_shipping_fee;
  };

  return (
    <div className="page-container">
      <PageHeader
        showBackButton={true}
        onBack={handleCancel}
        title="New Listing"
        description="Create a new platform listing"
        icon={Package}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product & Platform Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Product & Platform
                </CardTitle>
                <CardDescription>
                  Select the product variant and platform for this listing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="product_variant_id" className="text-sm font-medium">
                      Product Variant *
                    </Label>
                    <ProductVariantCombobox
                      value={formData.product_variant_id || ''}
                      onValueChange={(value, variant) => {
                        handleInputChange('product_variant_id', value);
                        setSelectedProductVariant(variant || null);
                      }}
                      placeholder="Search for a product variant..."
                      className={errors.product_variant_id ? 'border-red-500' : ''}
                    />
                    {errors.product_variant_id && (
                      <p className="text-sm text-red-500 mt-1">{errors.product_variant_id}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="platform_id" className="text-sm font-medium">
                      Platform *
                    </Label>
                    <PlatformCombobox
                      value={formData.platform_id || ''}
                      onValueChange={(value, platform) => {
                        handleInputChange('platform_id', value);
                        setSelectedPlatform(platform || null);
                      }}
                      placeholder="Search for a platform..."
                      className={errors.platform_id ? 'border-red-500' : ''}
                    />
                    {errors.platform_id && (
                      <p className="text-sm text-red-500 mt-1">{errors.platform_id}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Configure the core listing details and identifiers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="platform_sku" className="text-sm font-medium">
                      Platform SKU *
                    </Label>
                    <Input
                      id="platform_sku"
                      value={formData.platform_sku}
                      onChange={(e) => handleInputChange('platform_sku', e.target.value)}
                      className={errors.platform_sku ? 'border-red-500' : ''}
                      placeholder="Enter platform SKU"
                    />
                    {errors.platform_sku && (
                      <p className="text-sm text-red-500 mt-1">{errors.platform_sku}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="platform_product_id" className="text-sm font-medium">
                      Platform Product ID *
                    </Label>
                    <Input
                      id="platform_product_id"
                      value={formData.platform_product_id}
                      onChange={(e) => handleInputChange('platform_product_id', e.target.value)}
                      className={errors.platform_product_id ? 'border-red-500' : ''}
                      placeholder="Enter platform product ID"
                    />
                    {errors.platform_product_id && (
                      <p className="text-sm text-red-500 mt-1">{errors.platform_product_id}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="listing_status" className="text-sm font-medium">
                      Listing Status *
                    </Label>
                    <Select
                      value={formData.listing_status}
                      onValueChange={(value) => handleInputChange('listing_status', value as ListingStatus)}
                    >
                      <SelectTrigger className={errors.listing_status ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Pending Review">Pending Review</SelectItem>
                        <SelectItem value="Live">Live</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Deactivated">Deactivated</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.listing_status && (
                      <p className="text-sm text-red-500 mt-1">{errors.listing_status}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="is_active_on_platform" className="text-sm font-medium">
                      Platform Active Status
                    </Label>
                    <Select
                      value={formData.is_active_on_platform.toString()}
                      onValueChange={(value) => handleInputChange('is_active_on_platform', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select active status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
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
                <CardDescription>
                  Configure platform pricing and fee structure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="platform_price" className="text-sm font-medium">
                      Platform Price *
                    </Label>
                    <Input
                      id="platform_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.platform_price}
                      onChange={(e) => handleInputChange('platform_price', parseFloat(e.target.value) || 0)}
                      className={errors.platform_price ? 'border-red-500' : ''}
                      placeholder="0.00"
                    />
                    {errors.platform_price && (
                      <p className="text-sm text-red-500 mt-1">{errors.platform_price}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="platform_commission_percentage" className="text-sm font-medium">
                      Commission Percentage *
                    </Label>
                    <Input
                      id="platform_commission_percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.platform_commission_percentage}
                      onChange={(e) => handleInputChange('platform_commission_percentage', parseFloat(e.target.value) || 0)}
                      className={errors.platform_commission_percentage ? 'border-red-500' : ''}
                      placeholder="0.00"
                    />
                    {errors.platform_commission_percentage && (
                      <p className="text-sm text-red-500 mt-1">{errors.platform_commission_percentage}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="platform_fixed_fee" className="text-sm font-medium">
                      Fixed Fee
                    </Label>
                    <Input
                      id="platform_fixed_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.platform_fixed_fee}
                      onChange={(e) => handleInputChange('platform_fixed_fee', parseFloat(e.target.value) || 0)}
                      className={errors.platform_fixed_fee ? 'border-red-500' : ''}
                      placeholder="0.00"
                    />
                    {errors.platform_fixed_fee && (
                      <p className="text-sm text-red-500 mt-1">{errors.platform_fixed_fee}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="platform_shipping_fee" className="text-sm font-medium">
                      Shipping Fee
                    </Label>
                    <Input
                      id="platform_shipping_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.platform_shipping_fee}
                      onChange={(e) => handleInputChange('platform_shipping_fee', parseFloat(e.target.value) || 0)}
                      className={errors.platform_shipping_fee ? 'border-red-500' : ''}
                      placeholder="0.00"
                    />
                    {errors.platform_shipping_fee && (
                      <p className="text-sm text-red-500 mt-1">{errors.platform_shipping_fee}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Product Info */}
            {selectedProductVariant && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Product Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">SKU</Label>
                    <p className="text-base font-semibold">{selectedProductVariant.sku_code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Product Name</Label>
                    <p className="text-sm">{selectedProductVariant.product_id.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Current Price</Label>
                    <p className="text-sm font-semibold">{formatCurrency(selectedProductVariant.price)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge variant={selectedProductVariant.is_active ? 'default' : 'secondary'}>
                      {selectedProductVariant.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Platform Info */}
            {selectedPlatform && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Platform Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Platform</Label>
                    <p className="text-base font-semibold">{selectedPlatform.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge variant={selectedPlatform.is_active ? 'default' : 'secondary'}>
                      {selectedPlatform.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Base URL</Label>
                    <p className="text-sm text-muted-foreground break-all">{selectedPlatform.base_url}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Platform Price</span>
                  <span className="text-sm font-semibold">{formatCurrency(formData.platform_price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Commission ({formData.platform_commission_percentage}%)</span>
                  <span className="text-sm">{formatCurrency(formData.platform_price * formData.platform_commission_percentage / 100)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fixed Fee</span>
                  <span className="text-sm">{formatCurrency(formData.platform_fixed_fee)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Shipping Fee</span>
                  <span className="text-sm">{formatCurrency(formData.platform_shipping_fee)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Net Revenue</span>
                    <span className={`text-sm font-semibold ${calculateNetRevenue() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculateNetRevenue())}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? 'Creating...' : 'Create Listing'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

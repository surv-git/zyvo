'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Package,
  Star,
  Info,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  getProductVariantById, 
  deleteProductVariant, 
  activateProductVariant, 
  deactivateProductVariant 
} from '@/services/product-variant-service';
import type { ProductVariant } from '@/types/product-variant';

export default function ProductVariantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [productVariant, setProductVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const productVariantId = params.id as string;

  useEffect(() => {
    const fetchProductVariant = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProductVariantById(productVariantId);
        setProductVariant(data);
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

  const handleDelete = async () => {
    if (!productVariant || !confirm('Are you sure you want to delete this product variant?')) {
      return;
    }

    try {
      await deleteProductVariant(productVariant.id);
      router.push('/product-variants');
    } catch (err) {
      console.error('Error deleting product variant:', err);
      alert('Failed to delete product variant');
    }
  };

  const handleToggleStatus = async () => {
    if (!productVariant) return;

    try {
      if (productVariant.is_active) {
        await deactivateProductVariant(productVariant.id);
      } else {
        await activateProductVariant(productVariant.id);
      }
      
      // Refresh the data
      const updatedData = await getProductVariantById(productVariantId);
      setProductVariant(updatedData);
    } catch (err) {
      console.error('Error updating product variant status:', err);
      alert('Failed to update product variant status');
    }
  };

  const handleBack = () => {
    router.push('/product-variants');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (error) {
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
        title={`${productVariant.product_id.name} - ${productVariant.sku_code}`}
        description="Product variant details"
        icon={Package}
        actions={[
          {
            label: 'Edit Variant',
            onClick: () => router.push(`/product-variants/${productVariant.id}/edit`),
            icon: Edit
          },
          {
            label: productVariant.is_active ? 'Deactivate' : 'Activate',
            onClick: handleToggleStatus,
            icon: productVariant.is_active ? XCircle : CheckCircle,
            variant: productVariant.is_active ? 'outline' : 'default'
          },
          {
            label: 'Delete',
            onClick: handleDelete,
            icon: Trash2,
            variant: 'destructive'
          }
        ]}
      />

      <div className="page-form">
        {/* Product and Options Information - Side by Side */}
        <div className="page-grid-2">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Information</CardTitle>
                  <CardDescription>
                    Details about the associated product
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
                <label className="text-sm font-medium text-muted-foreground">Product</label>
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
                    Option values for this variant
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
                    <label className="text-sm font-medium text-muted-foreground">Option</label>
                    <label className="text-sm font-medium text-muted-foreground">Value</label>
                  </div>
                  
                  <div className="space-y-3">
                    {productVariant.option_values.map((option, index) => (
                      <div key={index} className="grid grid-cols-2 gap-2 items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{option.option_type}</span>
                        </div>
                        <div>
                          <Badge variant="outline" className="text-sm">
                            {option.option_value}
                          </Badge>
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
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU Code</label>
                  <p className="text-sm font-semibold">{productVariant.sku_code}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Base Price</label>
                  <p className="text-lg font-bold">{formatCurrency(productVariant.price)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sort Order</label>
                  <p className="text-sm">{productVariant.sort_order}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={productVariant.is_active ? "default" : "secondary"} 
                           className={productVariant.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {productVariant.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Discounts */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Pricing & Discounts</CardTitle>
              <CardDescription>
                Effective pricing and discount information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Effective Price</label>
                <p className="text-lg font-bold text-green-600">{formatCurrency(productVariant.effective_price)}</p>
              </div>

              {productVariant.discount_details.is_on_sale && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Discount Details</label>
                      <div className="space-y-1">
                        {productVariant.discount_details.percentage && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            {productVariant.discount_details.percentage}% OFF
                          </Badge>
                        )}
                        {productVariant.discount_details.price && (
                          <p className="text-sm">Save: {formatCurrency(productVariant.savings)}</p>
                        )}
                      </div>
                    </div>

                    {productVariant.discount_details.end_date && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Sale End Date</label>
                        <p className="text-sm">{formatDate(productVariant.discount_details.end_date)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Packaging Cost</label>
                  <p className="text-sm">{formatCurrency(productVariant.packaging_cost)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Shipping Cost</label>
                  <p className="text-sm">{formatCurrency(productVariant.shipping_cost)}</p>
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
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Length</label>
                  <p className="text-sm">{productVariant.dimensions.length} {productVariant.dimensions.unit}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Width</label>
                  <p className="text-sm">{productVariant.dimensions.width} {productVariant.dimensions.unit}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Height</label>
                  <p className="text-sm">{productVariant.dimensions.height} {productVariant.dimensions.unit}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unit</label>
                  <p className="text-sm">{productVariant.dimensions.unit}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Weight</label>
                <p className="text-sm">{productVariant.weight.value} {productVariant.weight.unit}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Images and Stats - Side by Side */}
        <div className="page-grid-2">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Product variant images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {productVariant.images && productVariant.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {productVariant.images.slice(0, 4).map((image, index) => (
                    <div key={index} className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      <Image 
                        src={image} 
                        alt={`Product variant ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden text-muted-foreground text-sm">
                        Image {index + 1}
                      </div>
                    </div>
                  ))}
                  {productVariant.images.length > 4 && (
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">
                        +{productVariant.images.length - 4} more
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No images uploaded</p>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics & Reviews</CardTitle>
              <CardDescription>
                Performance metrics and ratings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Average Rating</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold">{productVariant.average_rating.toFixed(1)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Reviews</label>
                  <p className="text-sm font-bold">{productVariant.reviews_count}</p>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Rating Distribution</label>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const ratingCount = productVariant.rating_distribution[rating.toString() as keyof typeof productVariant.rating_distribution];
                    const percentage = productVariant.reviews_count > 0 
                      ? ((ratingCount as number) / productVariant.reviews_count) * 100 
                      : 0;
                      
                    return (
                      <div key={rating} className="flex items-center gap-2 w-full">
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs font-medium w-2 text-center">{rating}</span>
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-yellow-400 h-full rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-4 text-right flex-shrink-0 tabular-nums">
                          {ratingCount as number}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-xs text-muted-foreground">{formatDate(productVariant.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-xs text-muted-foreground">{formatDate(productVariant.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

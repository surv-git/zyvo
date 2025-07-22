'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Save, 
  Loader2, 
  AlertCircle,
  Package,
  DollarSign,
  Tag
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { Brand } from '@/types/brand';
import { 
  getProductById, 
  updateProduct, 
  getProductServiceErrorMessage 
} from '@/services/product-service';
import { getAllActiveCategories } from '@/services/category-service';
import { getAllActiveBrands } from '@/services/brand-service';

interface ProductFormData {
  name: string;
  slug: string;
  description?: string;
  category_id?: string;
  brand_id?: string;
  min_price: number;
  min_discounted_price?: number;
  is_active: boolean;
  images: string[];
}

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    category_id: '',
    brand_id: '',
    min_price: 0,
    min_discounted_price: 0,
    is_active: true,
    images: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load product
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await getProductById(productId);
        setProduct(data);
        
        // Populate form
        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          category_id: data.category_id?._id || '',
          brand_id: typeof data.brand_id === 'string' ? data.brand_id : data.brand_id?._id || '',
          min_price: data.min_price || 0,
          min_discounted_price: data.min_discounted_price || 0,
          is_active: data.is_active,
          images: data.images || [],
        });
      } catch (err) {
        console.error('Failed to load product:', err);
        const errorMessage = getProductServiceErrorMessage(err);
        setError(errorMessage);
        
        if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
          toast.error('Please log in to access this product.');
          setTimeout(() => router.push('/login'), 2000);
        } else {
          toast.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, router]);

  // Load categories and brands
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [categoriesData, brandsData] = await Promise.all([
          getAllActiveCategories(),
          getAllActiveBrands()
        ]);
        setCategories(categoriesData);
        setBrands(brandsData);
      } catch (error) {
        console.error('Failed to load categories and brands:', error);
        toast.error('Failed to load categories and brands');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Product name must be at least 2 characters';
    } else if (formData.name.length > 200) {
      errors.name = 'Product name must be less than 200 characters';
    }

    if (!formData.slug.trim()) {
      errors.slug = 'Product slug is required';
    }

    if (formData.min_price <= 0) {
      errors.min_price = 'Minimum price must be greater than 0';
    }

    if (formData.min_discounted_price && formData.min_discounted_price >= formData.min_price) {
      errors.min_discounted_price = 'Discounted price must be less than regular price';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // Handle form changes
  const handleInputChange = (field: keyof ProductFormData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug when name changes
    if (field === 'name' && typeof value === 'string' && value) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const updateData: Partial<Product> = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        min_price: formData.min_price,
        is_active: formData.is_active,
        images: formData.images,
        ...(formData.min_discounted_price && { min_discounted_price: formData.min_discounted_price }),
      };

      await updateProduct(productId, updateData);
      
      toast.success('Product updated successfully');
      router.push(`/products/${productId}`);
    } catch (err) {
      console.error('Failed to update product:', err);
      const errorMessage = getProductServiceErrorMessage(err);
      
      if (err && typeof err === 'object' && 'errors' in err) {
        const errorObj = err as { errors?: Array<{ field: string; message: string }> };
        const apiErrors = errorObj.errors;
        if (Array.isArray(apiErrors)) {
          const fieldErrors: Record<string, string> = {};
          apiErrors.forEach((error: { field: string; message: string }) => {
            if (error.field && error.message) {
              fieldErrors[error.field] = error.message;
            }
          });
          setFormErrors(fieldErrors);
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Navigation
  const handleBack = () => {
    router.push(`/products/${productId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading product...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Product</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleBack}>
              Go Back
            </Button>
            {error.includes('Authentication required') || error.includes('log in') ? (
              <Button onClick={() => router.push('/login')}>
                Go to Login
              </Button>
            ) : (
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-4">The product you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/products')}>
            Back to Products
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
        icon={Package}
        title="Edit Product"
        description="Update product information and settings"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Update the product&apos;s basic information and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Product Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter product name"
                      className={formErrors.name ? 'border-destructive' : ''}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-destructive">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">
                      Slug <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="product-slug"
                      className={formErrors.slug ? 'border-destructive' : ''}
                    />
                    {formErrors.slug && (
                      <p className="text-sm text-destructive">{formErrors.slug}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      URL-friendly version of the product name
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter product description"
                    rows={4}
                    className={formErrors.description ? 'border-destructive' : ''}
                  />
                  {formErrors.description && (
                    <p className="text-sm text-destructive">{formErrors.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <div className="flex items-center space-x-3 pt-2">
                    <Switch
                      id="status"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                    />
                    <div className="flex items-center space-x-2">
                      <Badge variant={formData.is_active ? 'default' : 'secondary'}>
                        {formData.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formData.is_active ? 'Product is visible and available' : 'Product is hidden from catalog'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Classification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  Classification
                </CardTitle>
                <CardDescription>
                  Organize your product with categories and brands
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => handleInputChange('category_id', value === "none" ? "" : value)}
                      disabled={loadingData}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingData ? "Loading categories..." : "Select category"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Select
                      value={formData.brand_id}
                      onValueChange={(value) => handleInputChange('brand_id', value === "none" ? "" : value)}
                      disabled={loadingData}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingData ? "Loading brands..." : "Select brand"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No brand</SelectItem>
                        {brands.map((brand) => (
                          <SelectItem key={brand._id} value={brand._id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Pricing
                </CardTitle>
                <CardDescription>
                  Set product pricing and discount information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="min_price">
                      Minimum Price <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="min_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.min_price}
                      onChange={(e) => handleInputChange('min_price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className={formErrors.min_price ? 'border-destructive' : ''}
                    />
                    {formErrors.min_price && (
                      <p className="text-sm text-destructive">{formErrors.min_price}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_discounted_price">Minimum Discounted Price</Label>
                    <Input
                      id="min_discounted_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.min_discounted_price || ''}
                      onChange={(e) => handleInputChange('min_discounted_price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className={formErrors.min_discounted_price ? 'border-destructive' : ''}
                    />
                    {formErrors.min_discounted_price && (
                      <p className="text-sm text-destructive">{formErrors.min_discounted_price}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Leave empty if no discount applies
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
                      Update Product
                    </>
                  )}
                </Button>
                
                <Button type="button" variant="outline" className="w-full" onClick={handleBack}>
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Product ID</span>
                  <span className="text-sm font-mono">{product._id.slice(-8)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <span className="text-sm">{product.category_id?.name || 'None'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Brand</span>
                  <span className="text-sm">{
                    typeof product.brand_id === 'string' 
                      ? product.brand_id 
                      : product.brand_id?.name || 'None'
                  }</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm">{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'Never'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Images</span>
                  <span className="text-sm">{product.images?.length || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Product name and slug are required</p>
                <p>• Slug must be URL-friendly (auto-generated)</p>
                <p>• Minimum price must be greater than $0</p>
                <p>• Discounted price must be less than regular price</p>
                <p>• Inactive products are hidden from catalog</p>
                <p>• Category and brand are optional</p>
                <p>• Description supports up to 2000 characters</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
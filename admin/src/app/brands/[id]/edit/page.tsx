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
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Building2, 
  Mail, 
  Globe, 
  Calendar,
  Loader2,
  AlertCircle,
  Image,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { Brand } from '@/types/brand';
import { getBrandById, updateBrand } from '@/services/brand-service';

interface BrandFormData {
  name: string;
  description: string;
  logo_url: string;
  website: string;
  contact_email: string;
  is_active: boolean;
}

export default function BrandEditPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    description: '',
    logo_url: '',
    website: '',
    contact_email: '',
    is_active: true
  });
  const [errors, setErrors] = useState<Partial<BrandFormData>>({});

  // Load brand data
  useEffect(() => {
    const loadBrand = async () => {
      try {
        const brandData = await getBrandById(brandId);
        setBrand(brandData);
        setFormData({
          name: brandData.name || '',
          description: brandData.description || '',
          logo_url: brandData.logo_url || '',
          website: brandData.website || '',
          contact_email: brandData.contact_email || '',
          is_active: brandData.is_active ?? true
        });
      } catch (error) {
        console.error('Failed to load brand:', error);
        toast.error('Failed to load brand data');
        router.push('/brands');
      } finally {
        setLoading(false);
      }
    };

    if (brandId) {
      loadBrand();
    }
  }, [brandId, router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<BrandFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Brand name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Brand name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Brand name must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid URL (starting with http:// or https://)';
    }

    if (formData.logo_url && !/^https?:\/\/.+/.test(formData.logo_url)) {
      newErrors.logo_url = 'Please enter a valid URL (starting with http:// or https://)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof BrandFormData, value: string | boolean) => {
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
      const updateData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_active: formData.is_active,
        contact_email: formData.contact_email.trim() || undefined,
        website: formData.website.trim() || undefined,
        logo_url: formData.logo_url.trim() || undefined
      };

      await updateBrand(brandId, updateData);
      toast.success('Brand updated successfully');
      router.push(`/brands/${brandId}`);
    } catch (error) {
      console.error('Failed to update brand:', error);
      toast.error('Failed to update brand. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/brands/${brandId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading brand...</span>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Brand Not Found</h2>
          <p className="text-muted-foreground mb-4">The brand you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/brands')}>
            Back to Brands
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Brand</h1>
            <p className="text-muted-foreground mt-1">
              Update brand information and settings
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Update the brand's basic information and details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Brand Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter brand name"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter brand description"
                    rows={4}
                    className={errors.description ? 'border-destructive' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {formData.description.length}/500 characters
                  </p>
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
                        {formData.is_active ? 'Brand is visible to customers' : 'Brand is hidden from customers'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Brand Assets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Image className="h-5 w-5 mr-2" />
                  Brand Assets
                </CardTitle>
                <CardDescription>
                  Upload and manage brand visual assets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => handleInputChange('logo_url', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className={errors.logo_url ? 'border-destructive' : ''}
                  />
                  {errors.logo_url && (
                    <p className="text-sm text-destructive">{errors.logo_url}</p>
                  )}
                </div>

                {formData.logo_url && (
                  <div className="space-y-2">
                    <Label>Logo Preview</Label>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                        <img
                          src={formData.logo_url}
                          alt="Logo preview"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            const sibling = target.nextElementSibling as HTMLElement;
                            target.style.display = 'none';
                            if (sibling) sibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden w-full h-full items-center justify-center">
                          <Image className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={formData.logo_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Full Size
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  Optional contact details for the brand
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="contact@brand.com"
                    className={errors.contact_email ? 'border-destructive' : ''}
                  />
                  {errors.contact_email && (
                    <p className="text-sm text-destructive">{errors.contact_email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.brand.com"
                    className={errors.website ? 'border-destructive' : ''}
                  />
                  {errors.website && (
                    <p className="text-sm text-destructive">{errors.website}</p>
                  )}
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
                      Update Brand
                    </>
                  )}
                </Button>
                
                <Button type="button" variant="outline" className="w-full" onClick={handleBack}>
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Brand Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Brand ID</span>
                  <span className="text-sm font-mono">{brand._id.slice(-8)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Slug</span>
                  <span className="text-sm font-mono">{brand.slug}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{new Date(brand.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm">{brand.updatedAt ? new Date(brand.updatedAt).toLocaleDateString() : 'Never'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Name and description are required fields</p>
                <p>• Logo should be a high-quality image</p>
                <p>• Website URL must include http:// or https://</p>
                <p>• Inactive brands are hidden from customers</p>
                <p>• Contact email is used for brand inquiries</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

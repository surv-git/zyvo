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
  Building2, 
  Mail, 
  Globe, 
  Loader2,
  Image,
  ExternalLink,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { createBrand } from '@/services/brand-service';

interface BrandFormData {
  name: string;
  description: string;
  logo_url: string;
  website: string;
  contact_email: string;
  is_active: boolean;
}

export default function AddBrandPage() {
  const router = useRouter();
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    description: '',
    logo_url: '',
    website: '',
    contact_email: '',
    is_active: true
  });
  const [errors, setErrors] = useState<Partial<BrandFormData>>({});

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
      // Prepare create data
      const createData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_active: formData.is_active,
        contact_email: formData.contact_email.trim() || undefined,
        website: formData.website.trim() || undefined,
        logo_url: formData.logo_url.trim() || undefined
      };

      const newBrand = await createBrand(createData);
      toast.success('Brand created successfully');
      router.push(`/brands/${newBrand._id}`);
    } catch (error) {
      console.error('Failed to create brand:', error);
      toast.error('Failed to create brand. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/brands');
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Add New Brand</h1>
            <p className="text-muted-foreground mt-1">
              Create a new brand with information and settings
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
                  Enter the brand's basic information and details
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
                        {formData.is_active ? 'Brand will be visible to customers' : 'Brand will be hidden from customers'}
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
                  <p className="text-sm text-muted-foreground">
                    Optional: Enter a URL to your brand logo image
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    Optional: Email address for brand inquiries
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    Optional: Brand's official website URL
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
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Brand
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
                    <li>• Brand name (2-100 characters)</li>
                    <li>• Description (10-500 characters)</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Optional Fields</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Logo URL (must be valid URL)</li>
                    <li>• Website (must include http/https)</li>
                    <li>• Contact email (must be valid email)</li>
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
                <p>• Use a clear, descriptive brand name</p>
                <p>• Write a compelling description</p>
                <p>• High-quality logos work best</p>
                <p>• Include contact info for customer inquiries</p>
                <p>• Set to active when ready to publish</p>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Brand name will be used for product listings</p>
                <p>• Description appears on brand pages</p>
                <p>• Logo should be at least 200x200 pixels</p>
                <p>• Inactive brands won't show to customers</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

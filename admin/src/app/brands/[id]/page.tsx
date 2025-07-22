"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  Building2, 
  Mail, 
  Globe, 
  Calendar,
  Loader2,
  AlertCircle,
  Copy,
  Power,
  PowerOff,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Image
} from 'lucide-react';
import { toast } from 'sonner';
import { Brand } from '@/types/brand';
import { getBrandById, activateBrand, deactivateBrand, deleteBrand } from '@/services/brand-service';

export default function BrandViewPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load brand data
  useEffect(() => {
    const loadBrand = async () => {
      try {
        const brandData = await getBrandById(brandId);
        setBrand(brandData);
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

  const handleEdit = () => {
    router.push(`/brands/${brandId}/edit`);
  };

  const handleBack = () => {
    router.push('/brands');
  };

  const handleCopyId = async () => {
    if (brand) {
      try {
        await navigator.clipboard.writeText(brand._id);
        toast.success('Brand ID copied to clipboard');
      } catch (err) {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!brand) return;

    const action = brand.is_active ? 'deactivate' : 'activate';
    setActionLoading(action);

    try {
      if (brand.is_active) {
        await deactivateBrand(brand._id);
        toast.success('Brand deactivated successfully');
      } else {
        await activateBrand(brand._id);
        toast.success('Brand activated successfully');
      }

      // Reload brand data
      const updatedBrand = await getBrandById(brandId);
      setBrand(updatedBrand);
    } catch (error) {
      console.error(`Failed to ${action} brand:`, error);
      toast.error(`Failed to ${action} brand. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!brand) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${brand.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading('delete');

    try {
      await deleteBrand(brand._id);
      toast.success('Brand deleted successfully');
      router.push('/brands');
    } catch (error) {
      console.error('Failed to delete brand:', error);
      toast.error('Failed to delete brand. Please try again.');
      setActionLoading(null);
    }
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
          <Button onClick={handleBack}>
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
            <h1 className="text-3xl font-bold tracking-tight">{brand.name}</h1>
            <p className="text-muted-foreground mt-1">
              Brand details and information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={actionLoading === 'activate' || actionLoading === 'deactivate'}
          >
            {actionLoading === 'activate' || actionLoading === 'deactivate' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : brand.is_active ? (
              <PowerOff className="h-4 w-4 mr-2" />
            ) : (
              <Power className="h-4 w-4 mr-2" />
            )}
            {brand.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={actionLoading === 'delete'}
          >
            {actionLoading === 'delete' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Brand Name</label>
                  <p className="text-lg font-semibold">{brand.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                  <p className="text-lg">{brand.display_name || brand.name}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-base mt-1">{brand.description || 'No description provided'}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Slug</label>
                  <p className="text-base font-mono">{brand.slug}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center mt-1">
                    <Badge variant={brand.is_active ? 'default' : 'secondary'}>
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </Badge>
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
            </CardHeader>
            <CardContent className="space-y-4">
              {brand.logo_url || brand.logo_image ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Logo</label>
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="w-16 h-16 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      {brand.logo_url || brand.logo_image ? (
                        <img
                          src={brand.logo_url || brand.logo_image}
                          alt={`${brand.name} logo`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            const sibling = target.nextElementSibling as HTMLElement;
                            target.style.display = 'none';
                            if (sibling) sibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="hidden w-full h-full items-center justify-center">
                        <Image className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>
                    {brand.logo_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={brand.logo_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Full Size
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="h-8 w-8 mx-auto mb-2" />
                  <p>No logo uploaded</p>
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                  {brand.contact_email ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-base">{brand.contact_email}</p>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`mailto:${brand.contact_email}`}>
                          <Mail className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-base text-muted-foreground mt-1">Not provided</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Website</label>
                  {brand.website ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-base">{brand.website}</p>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={brand.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-base text-muted-foreground mt-1">Not provided</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <Badge variant={brand.is_active ? "default" : "secondary"}>
                  {brand.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                {brand.is_active 
                  ? "This brand is active and visible to customers."
                  : "This brand is inactive and hidden from customers."
                }
              </div>
            </CardContent>
          </Card>

          {/* Brand Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Brand ID</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{brand._id.slice(-8)}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
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

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Brand
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleToggleStatus}
                disabled={actionLoading === 'activate' || actionLoading === 'deactivate'}
              >
                {actionLoading === 'activate' || actionLoading === 'deactivate' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : brand.is_active ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Deactivate Brand
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Activate Brand
                  </>
                )}
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
              >
                {actionLoading === 'delete' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Brand
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Use Edit to modify brand information</p>
              <p>• Deactivate to hide from customers</p>
              <p>• Delete permanently removes the brand</p>
              <p>• Logo should be high quality for best results</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

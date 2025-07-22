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
import { 
  Save, 
  Globe, 
  Calendar,
  Loader2,
  AlertCircle,
  ImageIcon,
  ExternalLink,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { Platform } from '@/types/platform';
import { getPlatformById, updatePlatform } from '@/services/platform-service';
import { PageHeader } from '@/components/ui/page-header';

interface PlatformFormData {
  name: string;
  description: string;
  base_url: string;
  logo_url: string;
  api_credentials_placeholder: string;
  is_active: boolean;
}

export default function PlatformEditPage() {
  const router = useRouter();
  const params = useParams();
  const platformId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [formData, setFormData] = useState<PlatformFormData>({
    name: '',
    description: '',
    base_url: '',
    logo_url: '',
    api_credentials_placeholder: '',
    is_active: true
  });
  const [errors, setErrors] = useState<Partial<PlatformFormData>>({});

  // Load platform data
  useEffect(() => {
    const loadPlatform = async () => {
      try {
        const platformData = await getPlatformById(platformId);
        setPlatform(platformData);
        
        // Set form data
        setFormData({
          name: platformData.name,
          description: platformData.description,
          base_url: platformData.base_url,
          logo_url: platformData.logo_url || '',
          api_credentials_placeholder: platformData.api_credentials_placeholder || '',
          is_active: platformData.is_active
        });
      } catch (error) {
        console.error('Failed to load platform:', error);
        toast.error('Failed to load platform data');
        router.push('/platforms');
      } finally {
        setLoading(false);
      }
    };

    if (platformId) {
      loadPlatform();
    }
  }, [platformId, router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PlatformFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Platform name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.base_url.trim()) {
      newErrors.base_url = 'Base URL is required';
    } else if (!isValidUrl(formData.base_url)) {
      newErrors.base_url = 'Please enter a valid URL';
    }

    if (formData.logo_url && !isValidUrl(formData.logo_url)) {
      newErrors.logo_url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (field: keyof PlatformFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setSaving(true);
    try {
      const updatedPlatform = await updatePlatform(platformId, formData);
      setPlatform(updatedPlatform);
      toast.success('Platform updated successfully');
      router.push(`/platforms/${platformId}`);
    } catch (error) {
      console.error('Failed to update platform:', error);
      toast.error('Failed to update platform');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/platforms/${platformId}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading platform...</span>
        </div>
      </div>
    );
  }

  if (!platform) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h2 className="text-xl font-semibold">Platform Not Found</h2>
            <p className="text-muted-foreground">The platform you&apos;re looking for doesn&apos;t exist.</p>
          </div>
          <Button onClick={() => router.push('/platforms')}>
            Back to Platforms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        icon={Settings}
        title="Edit Platform"
        description="Update platform information and settings"
        showBackButton={true}
        onBack={handleBack}
        actions={[
          {
            label: "Save Changes",
            onClick: handleSubmit,
            icon: Save,
            variant: "default",
            disabled: saving
          }
        ]}
      />

      {/* Form Card */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Platform Information</CardTitle>
          <CardDescription>
            Update the details for {platform.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Platform Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Amazon, eBay, Shopify"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_url">Base URL *</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="base_url"
                    placeholder="https://api.platform.com"
                    value={formData.base_url}
                    onChange={(e) => handleInputChange('base_url', e.target.value)}
                    className={`pl-9 ${errors.base_url ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.base_url && (
                  <p className="text-sm text-destructive">{errors.base_url}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="logo_url"
                    placeholder="https://example.com/logo.png"
                    value={formData.logo_url}
                    onChange={(e) => handleInputChange('logo_url', e.target.value)}
                    className={`pl-9 ${errors.logo_url ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.logo_url && (
                  <p className="text-sm text-destructive">{errors.logo_url}</p>
                )}
                {formData.logo_url && isValidUrl(formData.logo_url) && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    <a 
                      href={formData.logo_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Preview Logo
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this platform and its purpose..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`min-h-[120px] ${errors.description ? 'border-destructive' : ''}`}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_credentials_placeholder">API Configuration</Label>
                <div className="relative">
                  <Settings className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="api_credentials_placeholder"
                    placeholder="API credentials or configuration notes"
                    value={formData.api_credentials_placeholder}
                    onChange={(e) => handleInputChange('api_credentials_placeholder', e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Placeholder for API credentials or configuration details
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <Label htmlFor="is_active" className="text-base font-medium">
                Platform Status
              </Label>
              <p className="text-sm text-muted-foreground">
                Set whether this platform should be active
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={formData.is_active ? "default" : "secondary"}>
                {formData.is_active ? "Active" : "Inactive"}
              </Badge>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-medium mb-3">Platform Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Platform ID</Label>
                <p className="font-mono">{platform._id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <p>{new Date(platform.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Updated</Label>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <p>{new Date(platform.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

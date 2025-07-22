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
  Save, 
  Globe, 
  ImageIcon,
  ExternalLink,
  Plus,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { createPlatform } from '@/services/platform-service';
import { PageHeader } from '@/components/ui/page-header';

interface PlatformFormData {
  name: string;
  description: string;
  base_url: string;
  logo_url: string;
  api_credentials_placeholder: string;
  is_active: boolean;
}

export default function AddPlatformPage() {
  const router = useRouter();
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PlatformFormData>({
    name: '',
    description: '',
    base_url: '',
    logo_url: '',
    api_credentials_placeholder: '',
    is_active: true
  });
  const [errors, setErrors] = useState<Partial<PlatformFormData>>({});

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
      await createPlatform(formData);
      toast.success('Platform created successfully');
      router.push('/platforms');
    } catch (error) {
      console.error('Failed to create platform:', error);
      toast.error('Failed to create platform');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/platforms');
  };

  return (
    <div className="page-container">
      <PageHeader
        icon={Plus}
        title="Add New Platform"
        description="Create a new sales platform for your inventory"
        showBackButton={true}
        onBack={handleBack}
        actions={[
          {
            label: "Create Platform",
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
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Platform Information</span>
          </CardTitle>
          <CardDescription>
            Enter the details for the new platform
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
                Set whether this platform should be active immediately
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

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

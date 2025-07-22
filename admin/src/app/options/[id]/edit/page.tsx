"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Tag, 
  Loader2,
  AlertCircle,
  ArrowUpDown,
  Save,
  Power,
  PowerOff,
  Trash2
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';
import { Option, OptionUpdateRequest } from '@/types/option';
import { getOptionById, updateOption, activateOption, deactivateOption, deleteOption, getOptionServiceErrorMessage } from '@/services/option-service';

interface OptionFormData {
  option_type: string;
  option_value: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

interface OptionFormErrors {
  option_type?: string;
  option_value?: string;
  name?: string;
  sort_order?: string;
}

export default function OptionEditPage() {
  const router = useRouter();
  const params = useParams();
  const optionId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [option, setOption] = useState<Option | null>(null);
  const [formData, setFormData] = useState<OptionFormData>({
    option_type: '',
    option_value: '',
    name: '',
    is_active: true,
    sort_order: 1
  });
  const [errors, setErrors] = useState<OptionFormErrors>({});

  // Load option data
  useEffect(() => {
    const loadOption = async () => {
      try {
        const optionData = await getOptionById(optionId);
        setOption(optionData);
        setFormData({
          option_type: optionData.option_type || '',
          option_value: optionData.option_value || '',
          name: optionData.name || '',
          is_active: optionData.is_active ?? true,
          sort_order: optionData.sort_order || 1
        });
        setError(null);
      } catch (error) {
        console.error('Failed to load option:', error);
        const errorMessage = getOptionServiceErrorMessage(error);
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (optionId) {
      loadOption();
    }
  }, [optionId, router]);

  const validateForm = (): boolean => {
    const newErrors: OptionFormErrors = {};

    if (!formData.option_type.trim()) {
      newErrors.option_type = 'Option type is required';
    } else if (formData.option_type.length > 50) {
      newErrors.option_type = 'Option type must be less than 50 characters';
    }

    if (!formData.option_value.trim()) {
      newErrors.option_value = 'Option value is required';
    } else if (formData.option_value.length > 100) {
      newErrors.option_value = 'Option value must be less than 100 characters';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (typeof formData.sort_order !== 'number' || formData.sort_order < 1) {
      newErrors.sort_order = 'Sort order must be at least 1';
    } else if (formData.sort_order > 9999) {
      newErrors.sort_order = 'Sort order must be less than 10000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof OptionFormData, value: string | boolean | number) => {
    let processedValue = value;
    if (field === 'sort_order' && typeof value === 'string') {
      processedValue = parseInt(value) || 1;
    }
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Clear field-specific errors for fields that have errors
    if (field !== 'is_active' && errors[field as keyof OptionFormErrors]) {
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
      const updateData: OptionUpdateRequest = {
        option_type: formData.option_type.trim(),
        option_value: formData.option_value.trim(),
        name: formData.name.trim(),
        is_active: formData.is_active,
        sort_order: formData.sort_order
      };

      await updateOption(optionId, updateData);
      toast.success('Option updated successfully');
      router.push(`/options/${optionId}`);
    } catch (error) {
      console.error('Failed to update option:', error);
      toast.error('Failed to update option. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/options/${optionId}`);
  };

  const handleToggleStatus = async () => {
    if (!option) return;

    const action = option.is_active ? 'deactivate' : 'activate';
    setActionLoading(action);

    try {
      if (option.is_active) {
        await deactivateOption(option._id);
        toast.success('Option deactivated successfully');
      } else {
        await activateOption(option._id);
        toast.success('Option activated successfully');
      }

      // Update option state and form data
      const updatedOption = { ...option, is_active: !option.is_active };
      setOption(updatedOption);
      setFormData(prev => ({ ...prev, is_active: !option.is_active }));
    } catch (error) {
      console.error('Failed to toggle option status:', error);
      const errorMessage = getOptionServiceErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!option) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${option.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading('delete');

    try {
      await deleteOption(option._id);
      toast.success('Option deleted successfully');
      router.push('/options');
    } catch (error) {
      console.error('Failed to delete option:', error);
      const errorMessage = getOptionServiceErrorMessage(error);
      toast.error(errorMessage);
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading option...</span>
        </div>
      </div>
    );
  }

  if (!option && !loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {error ? 'Failed to Load Option' : 'Option Not Found'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {error || "The option you're looking for doesn't exist."}
          </p>
          <Button onClick={() => router.push('/options')}>
            Back to Options
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
        icon={Settings}
        title="Edit Option"
        description="Update option information and settings"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Update the option&apos;s basic information and details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="option_type">
                      Option Type <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="option_type"
                      value={formData.option_type}
                      onChange={(e) => handleInputChange('option_type', e.target.value)}
                      placeholder="e.g., Color, Size, Material"
                      className={errors.option_type ? 'border-destructive' : ''}
                    />
                    {errors.option_type && (
                      <p className="text-sm text-destructive">{errors.option_type}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Category or type of this option
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="option_value">
                      Option Value <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="option_value"
                      value={formData.option_value}
                      onChange={(e) => handleInputChange('option_value', e.target.value)}
                      placeholder="e.g., Red, Large, Cotton"
                      className={errors.option_value ? 'border-destructive' : ''}
                    />
                    {errors.option_value && (
                      <p className="text-sm text-destructive">{errors.option_value}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Specific value for this option
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    Display Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter display name"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Name displayed to customers
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
                        {formData.is_active ? 'Option is available for products' : 'Option is hidden from products'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Configuration
                </CardTitle>
                <CardDescription>
                  Configure display and sorting options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sort_order">
                    Sort Order <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center space-x-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="sort_order"
                      type="number"
                      min="1"
                      max="9999"
                      value={formData.sort_order}
                      onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 1)}
                      className={errors.sort_order ? 'border-destructive' : ''}
                    />
                  </div>
                  {errors.sort_order && (
                    <p className="text-sm text-destructive">{errors.sort_order}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Lower numbers appear first in option lists (1-9999)
                  </p>
                </div>

                <Separator />

                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Preview</h4>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Full Name:</span> {formData.option_type}: {formData.option_value}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Display:</span> {formData.name}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Status:</span> {formData.is_active ? 'Active' : 'Inactive'}
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
                      Update Option
                    </>
                  )}
                </Button>
                
                <Button type="button" variant="outline" className="w-full" onClick={handleBack}>
                  Cancel
                </Button>

                <Separator />

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleToggleStatus}
                  disabled={actionLoading === 'activate' || actionLoading === 'deactivate'}
                >
                  {actionLoading === 'activate' || actionLoading === 'deactivate' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : option?.is_active ? (
                    <PowerOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Power className="h-4 w-4 mr-2" />
                  )}
                  {option?.is_active ? 'Deactivate' : 'Activate'}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
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
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Use activate/deactivate to control visibility</p>
                <p>• Changes are saved automatically when you update</p>
                <p>• Delete action cannot be undone</p>
              </CardContent>
            </Card>

            {/* Option Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Option Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Option ID</span>
                  <span className="text-sm font-mono">{option?._id.slice(-8)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Slug</span>
                  <span className="text-sm font-mono">{option?.slug}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{option?.createdAt ? new Date(option.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm">{option?.updatedAt ? new Date(option.updatedAt).toLocaleDateString() : 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="text-sm">{option?.__v}</span>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Option type groups related options together</p>
                <p>• Option value is the specific choice</p>
                <p>• Display name is shown to customers</p>
                <p>• Sort order controls display sequence</p>
                <p>• Inactive options are hidden from products</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

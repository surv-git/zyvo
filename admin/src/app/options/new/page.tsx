"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/ui/page-header';
import { 
  Save, 
  Settings, 
  Tag, 
  Plus,
  Loader2,
  ArrowUpDown,
  Lightbulb,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { OptionCreateRequest } from '@/types/option';
import { createOption } from '@/services/option-service';

interface OptionFormData {
  option_type: string;
  option_value: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

export default function AddOptionPage() {
  const router = useRouter();
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<OptionFormData>({
    option_type: '',
    option_value: '',
    name: '',
    is_active: true,
    sort_order: 1
  });
  const [errors, setErrors] = useState<Partial<OptionFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<OptionFormData> = {};

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
      const createData: OptionCreateRequest = {
        option_type: formData.option_type.trim(),
        option_value: formData.option_value.trim(),
        name: formData.name.trim(),
        is_active: formData.is_active,
        sort_order: formData.sort_order
      };

      const newOption = await createOption(createData);
      toast.success('Option created successfully');
      router.push(`/options/${newOption._id}`);
    } catch (error) {
      console.error('Failed to create option:', error);
      toast.error('Failed to create option. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/options');
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        showBackButton={true}
        onBack={handleBack}
        icon={Plus}
        title="Add New Option"
        description="Create a new product option for variants"
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
                  Set up the option's basic information and details
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
                        {formData.is_active ? 'Option will be available for products' : 'Option will be hidden from products'}
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
                      <span className="font-medium">Full Name:</span> {formData.option_type || 'Option Type'}: {formData.option_value || 'Option Value'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Display:</span> {formData.name || 'Display Name'}
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Option
                    </>
                  )}
                </Button>
                
                <Button type="button" variant="outline" className="w-full" onClick={handleBack}>
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Option Type Examples:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Color (Red, Blue, Green)</li>
                    <li>• Size (Small, Medium, Large)</li>
                    <li>• Material (Cotton, Polyester, Silk)</li>
                    <li>• Style (Classic, Modern, Vintage)</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Best Practices:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Use consistent naming conventions</li>
                    <li>• Keep option values concise</li>
                    <li>• Set logical sort orders</li>
                    <li>• Group related options by type</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Option type groups related choices together</p>
                <p>• Option value is the specific choice customers see</p>
                <p>• Display name can be different from option value</p>
                <p>• Sort order controls how options appear in lists</p>
                <p>• Inactive options won't show in product forms</p>
              </CardContent>
            </Card>

            {/* Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Color Option</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p><span className="font-medium">Type:</span> Color</p>
                    <p><span className="font-medium">Value:</span> crimson-red</p>
                    <p><span className="font-medium">Display:</span> Crimson Red</p>
                    <p><span className="font-medium">Sort:</span> 10</p>
                  </div>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Size Option</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p><span className="font-medium">Type:</span> Size</p>
                    <p><span className="font-medium">Value:</span> xl</p>
                    <p><span className="font-medium">Display:</span> Extra Large</p>
                    <p><span className="font-medium">Sort:</span> 40</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

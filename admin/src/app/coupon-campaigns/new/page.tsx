"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { 
  Gift, 
  Calendar,
  Loader2,
  Percent,
  DollarSign,
  Truck,
  Info,
  Plus,
  Save,
  X,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  createCampaign, 
  DiscountType, 
  EligibilityCriteria
} from '@/services/coupon-campaign-service';

interface CampaignFormData {
  name: string;
  description: string;
  code_prefix: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase_amount: number;
  max_coupon_discount: number | null;
  valid_from: string;
  valid_until: string;
  max_global_usage: number;
  max_usage_per_user: number;
  is_unique_per_user: boolean;
  eligibility_criteria: EligibilityCriteria[];
  applicable_category_ids: string[];
  applicable_product_variant_ids: string[];
  is_active: boolean;
}

export default function AddCampaignPage() {
  const router = useRouter();
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    code_prefix: '',
    discount_type: DiscountType.Percentage,
    discount_value: 0,
    min_purchase_amount: 0,
    max_coupon_discount: null,
    valid_from: '',
    valid_until: '',
    max_global_usage: 100,
    max_usage_per_user: 1,
    is_unique_per_user: true,
    eligibility_criteria: [EligibilityCriteria.None],
    applicable_category_ids: [],
    applicable_product_variant_ids: [],
    is_active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Campaign name must be at least 3 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Campaign name must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (!formData.code_prefix.trim()) {
      newErrors.code_prefix = 'Code prefix is required';
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code_prefix)) {
      newErrors.code_prefix = 'Code prefix can only contain uppercase letters, numbers, hyphens, and underscores';
    } else if (formData.code_prefix.length > 20) {
      newErrors.code_prefix = 'Code prefix must be less than 20 characters';
    }

    if (formData.discount_value <= 0) {
      newErrors.discount_value = 'Discount value must be greater than 0';
    } else if (formData.discount_type === DiscountType.Percentage && formData.discount_value > 100) {
      newErrors.discount_value = 'Percentage discount cannot exceed 100%';
    }

    if (formData.min_purchase_amount < 0) {
      newErrors.min_purchase_amount = 'Minimum purchase amount cannot be negative';
    }

    if (formData.max_coupon_discount !== null && formData.max_coupon_discount <= 0) {
      newErrors.max_coupon_discount = 'Maximum discount must be greater than 0';
    }

    if (!formData.valid_from) {
      newErrors.valid_from = 'Start date is required';
    }

    if (!formData.valid_until) {
      newErrors.valid_until = 'End date is required';
    } else if (formData.valid_from && new Date(formData.valid_until) <= new Date(formData.valid_from)) {
      newErrors.valid_until = 'End date must be after start date';
    }

    if (formData.max_global_usage <= 0) {
      newErrors.max_global_usage = 'Maximum global usage must be greater than 0';
    }

    if (formData.max_usage_per_user <= 0) {
      newErrors.max_usage_per_user = 'Maximum usage per user must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CampaignFormData, value: string | number | boolean | string[] | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleEligibilityCriteriaChange = (criteria: EligibilityCriteria, checked: boolean) => {
    const currentCriteria = formData.eligibility_criteria;
    if (checked) {
      // If adding "None", remove all others
      if (criteria === EligibilityCriteria.None) {
        handleInputChange('eligibility_criteria', [EligibilityCriteria.None]);
      } else {
        // Remove "None" if adding other criteria
        const filteredCriteria = currentCriteria.filter(c => c !== EligibilityCriteria.None);
        handleInputChange('eligibility_criteria', [...filteredCriteria, criteria]);
      }
    } else {
      const filtered = currentCriteria.filter(c => c !== criteria);
      // If no criteria left, default to "None"
      handleInputChange('eligibility_criteria', filtered.length === 0 ? [EligibilityCriteria.None] : filtered);
    }
  };

  const generateCodePrefix = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleInputChange('code_prefix', result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      const createData = {
        ...formData,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
      };
      
      const response = await createCampaign(createData);
      toast.success('Campaign created successfully');
      router.push(`/coupon-campaigns/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const getDiscountIcon = (type: DiscountType) => {
    switch (type) {
      case DiscountType.Percentage:
        return <Percent className="h-4 w-4" />;
      case DiscountType.Amount:
        return <DollarSign className="h-4 w-4" />;
      case DiscountType.FreeShipping:
        return <Truck className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const formatDiscountValue = (type: DiscountType, value: number) => {
    switch (type) {
      case DiscountType.Percentage:
        return `${value}% Off`;
      case DiscountType.Amount:
        return `₹${value} Off`;
      case DiscountType.FreeShipping:
        return 'Free Shipping';
      default:
        return value.toString();
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <PageHeader
        showBackButton
        onBack={() => router.push('/coupon-campaigns')}
        icon={Tag}
        title="Add New Campaign"
        description="Create a new coupon campaign"
        actions={[
          {
            label: 'Cancel',
            onClick: () => router.push('/coupon-campaigns'),
            icon: X,
            variant: 'outline'
          },
          {
            label: saving ? 'Creating...' : 'Create Campaign',
            onClick: () => {
              const form = document.querySelector('form') as HTMLFormElement;
              if (form) form.requestSubmit();
            },
            icon: Save,
            variant: 'default',
            disabled: saving
          }
        ]}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Enter the basic campaign details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Campaign Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter campaign name"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="code_prefix">Code Prefix *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="code_prefix"
                        value={formData.code_prefix}
                        onChange={(e) => handleInputChange('code_prefix', e.target.value.toUpperCase())}
                        placeholder="SAVE"
                        className={errors.code_prefix ? 'border-red-500' : ''}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateCodePrefix}
                      >
                        Generate
                      </Button>
                    </div>
                    {errors.code_prefix && (
                      <p className="text-sm text-red-500 mt-1">{errors.code_prefix}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Coupon codes will be generated as {formData.code_prefix || 'PREFIX'}-XXXXXX
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe this campaign..."
                    rows={3}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Active Campaign</Label>
                </div>
              </CardContent>
            </Card>

            {/* Discount Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getDiscountIcon(formData.discount_type)}
                  Discount Configuration
                </CardTitle>
                <CardDescription>
                  Configure the discount type and value
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discount_type">Discount Type</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value) => handleInputChange('discount_type', value as DiscountType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DiscountType.Percentage}>Percentage</SelectItem>
                        <SelectItem value={DiscountType.Amount}>Fixed Amount</SelectItem>
                        <SelectItem value={DiscountType.FreeShipping}>Free Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discount_value">
                      Discount Value * 
                      {formData.discount_type === DiscountType.Percentage && ' (%)'}
                      {formData.discount_type === DiscountType.Amount && ' (₹)'}
                    </Label>
                    <Input
                      id="discount_value"
                      type="number"
                      min="0"
                      max={formData.discount_type === DiscountType.Percentage ? "100" : undefined}
                      value={formData.discount_value}
                      onChange={(e) => handleInputChange('discount_value', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className={errors.discount_value ? 'border-red-500' : ''}
                      disabled={formData.discount_type === DiscountType.FreeShipping}
                    />
                    {errors.discount_value && (
                      <p className="text-sm text-red-500 mt-1">{errors.discount_value}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_purchase_amount">Minimum Purchase Amount (₹)</Label>
                    <Input
                      id="min_purchase_amount"
                      type="number"
                      min="0"
                      value={formData.min_purchase_amount}
                      onChange={(e) => handleInputChange('min_purchase_amount', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className={errors.min_purchase_amount ? 'border-red-500' : ''}
                    />
                    {errors.min_purchase_amount && (
                      <p className="text-sm text-red-500 mt-1">{errors.min_purchase_amount}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="max_coupon_discount">Maximum Discount (₹)</Label>
                    <Input
                      id="max_coupon_discount"
                      type="number"
                      min="0"
                      value={formData.max_coupon_discount || ''}
                      onChange={(e) => handleInputChange('max_coupon_discount', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="No limit"
                      className={errors.max_coupon_discount ? 'border-red-500' : ''}
                    />
                    {errors.max_coupon_discount && (
                      <p className="text-sm text-red-500 mt-1">{errors.max_coupon_discount}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Leave empty for no limit
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Limits */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Limits</CardTitle>
                <CardDescription>
                  Set how many times this campaign can be used
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_global_usage">Maximum Global Usage *</Label>
                    <Input
                      id="max_global_usage"
                      type="number"
                      min="1"
                      value={formData.max_global_usage}
                      onChange={(e) => handleInputChange('max_global_usage', parseInt(e.target.value) || 1)}
                      placeholder="100"
                      className={errors.max_global_usage ? 'border-red-500' : ''}
                    />
                    {errors.max_global_usage && (
                      <p className="text-sm text-red-500 mt-1">{errors.max_global_usage}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Total number of times this campaign can be used across all users
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="max_usage_per_user">Maximum Usage Per User *</Label>
                    <Input
                      id="max_usage_per_user"
                      type="number"
                      min="1"
                      value={formData.max_usage_per_user}
                      onChange={(e) => handleInputChange('max_usage_per_user', parseInt(e.target.value) || 1)}
                      placeholder="1"
                      className={errors.max_usage_per_user ? 'border-red-500' : ''}
                    />
                    {errors.max_usage_per_user && (
                      <p className="text-sm text-red-500 mt-1">{errors.max_usage_per_user}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_unique_per_user"
                    checked={formData.is_unique_per_user}
                    onCheckedChange={(checked) => handleInputChange('is_unique_per_user', checked)}
                  />
                  <Label htmlFor="is_unique_per_user">Unique Per User</Label>
                  <p className="text-sm text-muted-foreground">
                    Each user gets their own unique coupon code
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Eligibility Criteria */}
            <Card>
              <CardHeader>
                <CardTitle>Eligibility Criteria</CardTitle>
                <CardDescription>
                  Select who can use this campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(EligibilityCriteria).map((criteria) => (
                    <div key={criteria} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={criteria}
                        checked={formData.eligibility_criteria.includes(criteria)}
                        onChange={(e) => handleEligibilityCriteriaChange(criteria, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={criteria} className="text-sm">
                        {criteria.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {formData.eligibility_criteria.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No criteria selected - campaign will be available to all users
                  </p>
                )}
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
              <CardContent className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Campaign
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/coupon-campaigns')}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Validity Period */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Validity Period
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="valid_from">Valid From *</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => handleInputChange('valid_from', e.target.value)}
                    className={errors.valid_from ? 'border-red-500' : ''}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.valid_from && (
                    <p className="text-sm text-red-500 mt-1">{errors.valid_from}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="valid_until">Valid Until *</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => handleInputChange('valid_until', e.target.value)}
                    className={errors.valid_until ? 'border-red-500' : ''}
                    min={formData.valid_from || new Date().toISOString().split('T')[0]}
                  />
                  {errors.valid_until && (
                    <p className="text-sm text-red-500 mt-1">{errors.valid_until}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Campaign Preview */}
            {formData.name && formData.discount_type && formData.discount_value > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Campaign Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Campaign Name</div>
                    <p className="mt-1 font-medium">{formData.name}</p>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Discount</div>
                    <div className="flex items-center gap-2 mt-1">
                      {getDiscountIcon(formData.discount_type)}
                      <span className="font-medium">
                        {formatDiscountValue(formData.discount_type, formData.discount_value)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Code Format</div>
                    <p className="mt-1 font-mono text-sm">{formData.code_prefix || 'PREFIX'}-XXXXXX</p>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Usage Limits</div>
                    <p className="mt-1 text-sm">
                      Max {formData.max_global_usage} total uses, {formData.max_usage_per_user} per user
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm">Best Practices</h4>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Use clear, descriptive campaign names</li>
                    <li>• Set appropriate validity periods</li>
                    <li>• Consider usage limits carefully</li>
                    <li>• Test campaigns before activating</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

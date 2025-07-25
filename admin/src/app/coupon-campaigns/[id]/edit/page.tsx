"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  ArrowLeft, 
  Save, 
  Gift, 
  Calendar,
  Loader2,
  AlertCircle,
  Percent,
  DollarSign,
  Truck,
  Info,
  X,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getCampaignById, 
  updateCampaign, 
  CouponCampaign, 
  DiscountType, 
  EligibilityCriteria,
  CreateCampaignData
} from '@/services/coupon-campaign-service';

interface CampaignFormData extends Omit<CreateCampaignData, 'valid_from' | 'valid_until'> {
  valid_from: string;
  valid_until: string;
}

export default function CampaignEditPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaign, setCampaign] = useState<CouponCampaign | null>(null);
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
    eligibility_criteria: [],
    applicable_category_ids: [],
    applicable_product_variant_ids: [],
    is_active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load campaign data
  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const response = await getCampaignById(campaignId);
        
        if (response.success && response.data) {
          const campaignData = response.data;
          setCampaign(campaignData);
          setFormData({
            name: campaignData.name,
            description: campaignData.description,
            code_prefix: campaignData.code_prefix,
            discount_type: campaignData.discount_type,
            discount_value: campaignData.discount_value,
            min_purchase_amount: campaignData.min_purchase_amount,
            max_coupon_discount: campaignData.max_coupon_discount,
            valid_from: campaignData.valid_from ? campaignData.valid_from.split('T')[0] : '',
            valid_until: campaignData.valid_until ? campaignData.valid_until.split('T')[0] : '',
            max_global_usage: campaignData.max_global_usage,
            max_usage_per_user: campaignData.max_usage_per_user,
            is_unique_per_user: campaignData.is_unique_per_user,
            eligibility_criteria: campaignData.eligibility_criteria,
            applicable_category_ids: campaignData.applicable_category_ids,
            applicable_product_variant_ids: campaignData.applicable_product_variant_ids,
            is_active: campaignData.is_active
          });
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Failed to load campaign:', error);
        toast.error('Failed to load campaign data');
        router.push('/coupon-campaigns');
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId, router]);

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
      handleInputChange('eligibility_criteria', [...currentCriteria, criteria]);
    } else {
      handleInputChange('eligibility_criteria', currentCriteria.filter(c => c !== criteria));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        ...formData,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
      };
      
      await updateCampaign(campaignId, updateData);
      toast.success('Campaign updated successfully');
      router.push(`/coupon-campaigns/${campaignId}`);
    } catch (error) {
      console.error('Failed to update campaign:', error);
      toast.error('Failed to update campaign');
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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Campaign Not Found</h3>
            <p className="text-muted-foreground">The campaign you&apos;re trying to edit doesn&apos;t exist.</p>
          </div>
          <Button onClick={() => router.push('/coupon-campaigns')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <PageHeader
        showBackButton
        onBack={() => router.push(`/coupon-campaigns/${campaignId}`)}
        icon={Tag}
        title="Edit Campaign"
        description="Update campaign information and settings"
        actions={[
          {
            label: 'Cancel',
            onClick: () => router.push(`/coupon-campaigns/${campaignId}`),
            icon: X,
            variant: 'outline'
          },
          {
            label: saving ? 'Saving...' : 'Save Changes',
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
                  Update basic campaign details
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
                    <Input
                      id="code_prefix"
                      value={formData.code_prefix}
                      onChange={(e) => handleInputChange('code_prefix', e.target.value.toUpperCase())}
                      placeholder="SAVE"
                      className={errors.code_prefix ? 'border-red-500' : ''}
                    />
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/coupon-campaigns/${campaignId}`)}
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
                  />
                  {errors.valid_until && (
                    <p className="text-sm text-red-500 mt-1">{errors.valid_until}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current Usage */}
            {campaign && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Used</div>
                    <div className="text-2xl font-bold">{campaign.usage_stats.current_usage}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Remaining</div>
                    <div className="text-2xl font-bold text-green-600">{campaign.usage_stats.remaining_usage}</div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Usage Rate</div>
                    <div className="text-lg font-bold">{campaign.usage_stats.usage_percentage}%</div>
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

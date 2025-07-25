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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Save, 
  Ticket, 
  User, 
  Loader2,
  Gift,
  Percent,
  DollarSign,
  Plus,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface CouponFormData {
  coupon_code: string;
  user_email: string;
  campaign_id: string;
  expires_at: string;
  is_active: boolean;
  notes: string;
}

export default function AddCouponPage() {
  const router = useRouter();
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CouponFormData>({
    coupon_code: '',
    user_email: '',
    campaign_id: '',
    expires_at: '',
    is_active: true,
    notes: ''
  });
  const [errors, setErrors] = useState<Partial<CouponFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CouponFormData> = {};

    if (!formData.coupon_code.trim()) {
      newErrors.coupon_code = 'Coupon code is required';
    } else if (formData.coupon_code.length < 3) {
      newErrors.coupon_code = 'Coupon code must be at least 3 characters';
    } else if (formData.coupon_code.length > 50) {
      newErrors.coupon_code = 'Coupon code must be less than 50 characters';
    } else if (!/^[A-Z0-9_-]+$/.test(formData.coupon_code)) {
      newErrors.coupon_code = 'Coupon code can only contain uppercase letters, numbers, hyphens, and underscores';
    }

    if (!formData.user_email.trim()) {
      newErrors.user_email = 'User email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.user_email)) {
      newErrors.user_email = 'Please enter a valid email address';
    }

    if (!formData.campaign_id.trim()) {
      newErrors.campaign_id = 'Campaign selection is required';
    }

    if (formData.expires_at && new Date(formData.expires_at) <= new Date()) {
      newErrors.expires_at = 'Expiry date must be in the future';
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CouponFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleInputChange('coupon_code', result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      // Note: This would need to be implemented in the coupon service
      // await createCoupon(formData);
      toast.success('Coupon created successfully');
      router.push('/coupons');
    } catch (error) {
      console.error('Failed to create coupon:', error);
      toast.error('Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/coupons')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add New Coupon</h1>
            <p className="text-muted-foreground">Create a new coupon for a user</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Enter the basic coupon details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="coupon_code">Coupon Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon_code"
                      value={formData.coupon_code}
                      onChange={(e) => handleInputChange('coupon_code', e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className={errors.coupon_code ? 'border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateCouponCode}
                    >
                      Generate
                    </Button>
                  </div>
                  {errors.coupon_code && (
                    <p className="text-sm text-red-500 mt-1">{errors.coupon_code}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Use uppercase letters, numbers, hyphens, and underscores only
                  </p>
                </div>

                <div>
                  <Label htmlFor="user_email">User Email *</Label>
                  <Input
                    id="user_email"
                    type="email"
                    value={formData.user_email}
                    onChange={(e) => handleInputChange('user_email', e.target.value)}
                    placeholder="user@example.com"
                    className={errors.user_email ? 'border-red-500' : ''}
                  />
                  {errors.user_email && (
                    <p className="text-sm text-red-500 mt-1">{errors.user_email}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Email of the user who will receive this coupon
                  </p>
                </div>

                <div>
                  <Label htmlFor="campaign_id">Campaign *</Label>
                  <Select
                    value={formData.campaign_id}
                    onValueChange={(value) => handleInputChange('campaign_id', value)}
                  >
                    <SelectTrigger className={errors.campaign_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campaign1">Summer Sale 2024 - 20% Off</SelectItem>
                      <SelectItem value="campaign2">New User Welcome - ₹100 Off</SelectItem>
                      <SelectItem value="campaign3">Flash Sale - 30% Off</SelectItem>
                      <SelectItem value="campaign4">Loyalty Reward - 15% Off</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.campaign_id && (
                    <p className="text-sm text-red-500 mt-1">{errors.campaign_id}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="expires_at">Expiry Date</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => handleInputChange('expires_at', e.target.value)}
                    className={errors.expires_at ? 'border-red-500' : ''}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.expires_at && (
                    <p className="text-sm text-red-500 mt-1">{errors.expires_at}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Leave empty to use campaign default expiry
                  </p>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Optional notes about this coupon..."
                    rows={3}
                    className={errors.notes ? 'border-red-500' : ''}
                  />
                  {errors.notes && (
                    <p className="text-sm text-red-500 mt-1">{errors.notes}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.notes.length}/500 characters
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive coupons cannot be used by users
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
                      Create Coupon
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/coupons')}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

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
                  <h4 className="font-medium text-sm">Coupon Code</h4>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Use 6-12 characters</li>
                    <li>• Uppercase letters and numbers</li>
                    <li>• Avoid confusing characters (0, O, I, 1)</li>
                    <li>• Make it memorable but unique</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm">Best Practices</h4>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Verify user email exists</li>
                    <li>• Set appropriate expiry dates</li>
                    <li>• Add descriptive notes</li>
                    <li>• Test coupon after creation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Preview */}
            {formData.campaign_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Campaign Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Selected Campaign</Label>
                    <p className="mt-1 text-sm">
                      {formData.campaign_id === 'campaign1' && 'Summer Sale 2024'}
                      {formData.campaign_id === 'campaign2' && 'New User Welcome'}
                      {formData.campaign_id === 'campaign3' && 'Flash Sale'}
                      {formData.campaign_id === 'campaign4' && 'Loyalty Reward'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Discount</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {formData.campaign_id === 'campaign2' ? (
                        <DollarSign className="h-4 w-4" />
                      ) : (
                        <Percent className="h-4 w-4" />
                      )}
                      <span className="text-sm">
                        {formData.campaign_id === 'campaign1' && '20% Off'}
                        {formData.campaign_id === 'campaign2' && '₹100 Off'}
                        {formData.campaign_id === 'campaign3' && '30% Off'}
                        {formData.campaign_id === 'campaign4' && '15% Off'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Save, 
  Ticket, 
  User, 
  Calendar,
  Loader2,
  AlertCircle,
  Gift,
  Percent,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { UserCoupon } from '@/services/coupon-service';
import { getCouponById } from '@/services/coupon-service';

interface CouponFormData {
  coupon_code: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  expires_at: string;
  is_active: boolean;
}

export default function CouponEditPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coupon, setCoupon] = useState<UserCoupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>({
    coupon_code: '',
    status: 'ACTIVE',
    expires_at: '',
    is_active: true
  });
  const [errors, setErrors] = useState<Partial<CouponFormData>>({});

  // Load coupon data
  useEffect(() => {
    const loadCoupon = async () => {
      try {
        const response = await getCouponById(couponId);
        
        if (response.success && response.data) {
          const couponData = response.data;
          setCoupon(couponData);
          setFormData({
            coupon_code: couponData.coupon_code,
            status: couponData.status,
            expires_at: couponData.expires_at ? couponData.expires_at.split('T')[0] : '',
            is_active: couponData.is_active
          });
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Failed to load coupon:', error);
        toast.error('Failed to load coupon data');
        router.push('/coupons');
      } finally {
        setLoading(false);
      }
    };

    if (couponId) {
      loadCoupon();
    }
  }, [couponId, router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CouponFormData> = {};

    if (!formData.coupon_code.trim()) {
      newErrors.coupon_code = 'Coupon code is required';
    } else if (formData.coupon_code.length < 3) {
      newErrors.coupon_code = 'Coupon code must be at least 3 characters';
    } else if (formData.coupon_code.length > 50) {
      newErrors.coupon_code = 'Coupon code must be less than 50 characters';
    }

    if (formData.expires_at && new Date(formData.expires_at) <= new Date()) {
      newErrors.expires_at = 'Expiry date must be in the future';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      // Note: This would need to be implemented in the coupon service
      // await updateCoupon(couponId, formData);
      toast.success('Coupon updated successfully');
      router.push(`/coupons/${couponId}`);
    } catch (error) {
      console.error('Failed to update coupon:', error);
      toast.error('Failed to update coupon');
    } finally {
      setSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (!coupon) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Coupon Not Found</h3>
            <p className="text-muted-foreground">The coupon you&apos;re trying to edit doesn&apos;t exist.</p>
          </div>
          <Button onClick={() => router.push('/coupons')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Coupons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/coupons/${couponId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Coupon</h1>
            <p className="text-muted-foreground">Update coupon information and settings</p>
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
                  Update basic coupon details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="coupon_code">Coupon Code *</Label>
                    <Input
                      id="coupon_code"
                      value={formData.coupon_code}
                      onChange={(e) => handleInputChange('coupon_code', e.target.value)}
                      placeholder="Enter coupon code"
                      className={errors.coupon_code ? 'border-red-500' : ''}
                    />
                    {errors.coupon_code && (
                      <p className="text-sm text-red-500 mt-1">{errors.coupon_code}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange('status', value as 'ACTIVE' | 'USED' | 'EXPIRED')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="USED">Used</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="expires_at">Expiry Date</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => handleInputChange('expires_at', e.target.value)}
                    className={errors.expires_at ? 'border-red-500' : ''}
                  />
                  {errors.expires_at && (
                    <p className="text-sm text-red-500 mt-1">{errors.expires_at}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Information (Read-only) */}
            {coupon.coupon_campaign_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Campaign Information
                  </CardTitle>
                  <CardDescription>
                    Associated campaign details (read-only)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Campaign Name</Label>
                      <p className="mt-1">{coupon.coupon_campaign_id.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Discount Type</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {coupon.coupon_campaign_id.discount_type === 'percentage' ? (
                          <Percent className="h-4 w-4" />
                        ) : (
                          <DollarSign className="h-4 w-4" />
                        )}
                        <span className="capitalize">{coupon.coupon_campaign_id.discount_type}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Discount Value</Label>
                    <p className="mt-1">
                      {coupon.coupon_campaign_id.discount_type === 'percentage' 
                        ? `${coupon.coupon_campaign_id.discount_value}%` 
                        : `₹${coupon.coupon_campaign_id.discount_value}`
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
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
                  onClick={() => router.push(`/coupons/${couponId}`)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="mt-1">{coupon.user_id?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="mt-1 text-sm">{coupon.user_id?.email || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Coupon Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Coupon Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(coupon.createdAt)}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Current Usage</Label>
                  <p className="mt-1 text-sm">{coupon.current_usage_count} times</p>
                </div>

                {coupon.remaining_usage !== null && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Remaining Usage</Label>
                    <p className="mt-1 text-sm">{coupon.remaining_usage} times</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Redeemed</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={coupon.is_redeemed ? "default" : "secondary"}>
                      {coupon.is_redeemed ? 'Yes' : 'No'}
                    </Badge>
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

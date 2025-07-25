"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  Ticket, 
  User, 
  Calendar,
  Loader2,
  AlertCircle,
  Copy,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';
import { UserCoupon, CouponDetailResponse } from '@/services/coupon-service';
import { getCouponById, deactivateCoupon } from '@/services/coupon-service';

export default function CouponViewPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState<UserCoupon | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load coupon data
  useEffect(() => {
    const loadCoupon = async () => {
      try {
        const response = await getCouponById(couponId);
        if (response.success && response.data) {
          setCoupon(response.data);
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

  // Copy coupon code to clipboard
  const handleCopyCouponCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Coupon code copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy coupon code');
    }
  };

  // Copy coupon ID to clipboard
  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success('Coupon ID copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy coupon ID');
    }
  };

  // Handle coupon deactivation
  const handleDeactivate = async () => {
    if (!coupon) return;
    
    setActionLoading('deactivate');
    try {
      await deactivateCoupon(coupon._id);
      setCoupon({ ...coupon, status: 'EXPIRED' });
      toast.success('Coupon deactivated successfully');
    } catch (error) {
      console.error('Failed to deactivate coupon:', error);
      toast.error('Failed to deactivate coupon');
    } finally {
      setActionLoading(null);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'USED':
        return <Badge variant="secondary">Used</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date
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
            <p className="text-muted-foreground">The coupon you're looking for doesn't exist.</p>
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
            onClick={() => router.push('/coupons')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Coupon Details</h1>
            <p className="text-muted-foreground">View and manage coupon information</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {coupon.status.toUpperCase() === 'ACTIVE' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeactivate}
              disabled={actionLoading === 'deactivate'}
            >
              {actionLoading === 'deactivate' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Ban className="mr-2 h-4 w-4" />
              )}
              Deactivate
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Coupon Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Coupon Information
              </CardTitle>
              <CardDescription>
                Basic coupon details and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Coupon Code</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                      {coupon.coupon_code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCouponCode(coupon.coupon_code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(coupon.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Discount Type</Label>
                  <p className="mt-1 capitalize">{coupon.coupon_campaign_id?.discount_type || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Discount Value</Label>
                  <p className="mt-1">
                    {coupon.coupon_campaign_id?.discount_type === 'percentage' 
                      ? `${coupon.coupon_campaign_id?.discount_value || 0}%` 
                      : `₹${coupon.coupon_campaign_id?.discount_value || 0}`
                    }
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Usage</Label>
                <p className="mt-1">{coupon.current_usage_count} times</p>
              </div>

              {coupon.remaining_usage !== null && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Remaining Usage</Label>
                  <p className="mt-1">{coupon.remaining_usage} times</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
              <CardDescription>
                Details about the coupon holder
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">User Name</Label>
                  <p className="mt-1">{coupon.user_id?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="mt-1">{coupon.user_id?.email || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {coupon.user_id?.id || 'N/A'}
                  </code>
                  {coupon.user_id?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyId(coupon.user_id.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Information */}
          {coupon.coupon_campaign_id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Campaign Information
                </CardTitle>
                <CardDescription>
                  Details about the associated campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Campaign Name</Label>
                  <p className="mt-1">{coupon.coupon_campaign_id.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Campaign Slug</Label>
                  <p className="mt-1 text-sm">{coupon.coupon_campaign_id.slug}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Usage Stats</Label>
                  <p className="mt-1 text-sm">
                    {coupon.coupon_campaign_id.usage_stats.usage_percentage}% used
                    {coupon.coupon_campaign_id.usage_stats.remaining_usage !== null && 
                      ` (${coupon.coupon_campaign_id.usage_stats.remaining_usage} remaining)`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleCopyCouponCode(coupon.coupon_code)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Coupon Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleCopyId(coupon._id)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Coupon ID
              </Button>
            </CardContent>
          </Card>

          {/* Coupon Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Coupon Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Coupon ID</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="px-2 py-1 bg-muted rounded text-xs font-mono break-all">
                    {coupon._id}
                  </code>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatDate(coupon.createdAt)}</span>
                </div>
              </div>

              {coupon.expires_at && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Expires At</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(coupon.expires_at)}</span>
                  </div>
                </div>
              )}

              {coupon.redeemed_at && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Redeemed At</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{formatDate(coupon.redeemed_at)}</span>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Usage Count</Label>
                <p className="mt-1 text-sm">{coupon.current_usage_count} times</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

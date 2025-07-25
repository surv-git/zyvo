'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Play, Pause, Calendar, Users, Target, TrendingUp, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { 
  CouponCampaign, 
  DiscountType,
  getCampaignById, 
  updateCampaign, 
  deleteCampaign 
} from '@/services/coupon-campaign-service';

interface CampaignPageProps {
  params: { id: string };
}

export default function CampaignPage({ params }: CampaignPageProps) {
  const [campaign, setCampaign] = useState<CouponCampaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaign();
  }, [params.id]);

  const loadCampaign = async () => {
    try {
      const response = await getCampaignById(params.id);
      setCampaign(response.data);
    } catch (error) {
      console.error('Failed to load campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!campaign) return;
    
    try {
      const updatedData = {
        ...campaign,
        is_active: !campaign.is_active
      };
      
      await updateCampaign(campaign._id, updatedData);
      setCampaign({ ...campaign, is_active: !campaign.is_active });
    } catch (error) {
      console.error('Failed to update campaign status:', error);
    }
  };

  const handleDelete = async () => {
    if (!campaign) return;
    
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaign(campaign._id);
        window.location.href = '/coupon-campaigns';
      } catch (error) {
        console.error('Failed to delete campaign:', error);
      }
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!campaign) {
    return <div className="p-6">Campaign not found</div>;
  }

  const usagePercentage = campaign.max_global_usage > 0 
    ? (campaign.current_global_usage / campaign.max_global_usage) * 100 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        showBackButton
        icon={Tag}
        title={campaign.name}
        description={campaign.description}
        actions={[
          {
            label: campaign.is_active ? 'Deactivate' : 'Activate',
            onClick: handleStatusToggle,
            icon: campaign.is_active ? Pause : Play,
            variant: 'outline'
          },
          {
            label: 'Edit',
            onClick: () => window.location.href = `/coupon-campaigns/${campaign._id}/edit`,
            icon: Edit,
            variant: 'outline'
          },
          {
            label: 'Delete',
            onClick: handleDelete,
            icon: Trash2,
            variant: 'destructive'
          }
        ]}
      />

      {/* Campaign Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge 
              className={`${campaign.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}
            >
              {campaign.is_active ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaign.current_global_usage}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {campaign.max_global_usage} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Per User Limit</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.max_usage_per_user}</div>
            <p className="text-xs text-muted-foreground">
              uses per customer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p>{new Date(campaign.valid_from).toLocaleDateString()}</p>
              <p className="text-muted-foreground">to</p>
              <p>{new Date(campaign.valid_until).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Campaign Name</h4>
              <p className="text-lg">{campaign.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
              <p>{campaign.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Coupon Code Prefix</h4>
              <p className="font-mono">{campaign.code_prefix}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Discount Type</h4>
              <Badge variant="outline">
                {campaign.discount_type === DiscountType.Percentage ? 'Percentage' : 
                 campaign.discount_type === DiscountType.Amount ? 'Fixed Amount' : 'Free Shipping'}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Discount Value</h4>
              <p className="text-lg font-semibold">
                {campaign.discount_type === DiscountType.Percentage 
                  ? `${campaign.discount_value}%` 
                  : campaign.discount_type === DiscountType.Amount
                  ? `$${campaign.discount_value}`
                  : 'Free Shipping'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eligibility Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Minimum Purchase Amount</h4>
              <p className="text-lg">${campaign.min_purchase_amount?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Maximum Discount</h4>
              <p className="text-lg">${campaign.max_coupon_discount?.toFixed(2) || 'No limit'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Unique Per User</h4>
              <Badge variant={campaign.is_unique_per_user ? 'default' : 'secondary'}>
                {campaign.is_unique_per_user ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Eligibility Criteria</h4>
              <div className="flex flex-wrap gap-1 mt-1">
                {campaign.eligibility_criteria?.map((criteria, index) => (
                  <Badge key={index} variant="secondary">{criteria}</Badge>
                )) || <span className="text-muted-foreground">All users</span>}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Applicable Categories</h4>
              <p className="text-sm text-muted-foreground">
                {campaign.applicable_category_ids?.length > 0 
                  ? `${campaign.applicable_category_ids.length} categories selected`
                  : 'All categories'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Plus, Tag } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import CampaignManagementTable from '@/components/coupon-campaigns/campaign-management-table';

export default function CouponCampaignsPage() {
  return (
    <div className="page-container">
      {/* Header */}
      <PageHeader
        icon={Tag}
        title="Coupon Campaigns"
        description="Manage and create marketing campaigns for coupons"
        actions={[
          {
            label: 'Add Campaign',
            onClick: () => window.location.href = '/coupon-campaigns/new',
            icon: Plus,
            variant: 'default'
          }
        ]}
      />

      {/* Main Content */}
      <CampaignManagementTable />
    </div>
  );
}
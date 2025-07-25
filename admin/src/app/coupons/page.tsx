"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import {
  Ticket,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { getCouponStats, type CouponStats } from '@/services/coupon-service';
import { CouponManagementTable } from '@/components/coupons/coupon-management-table';

export default function CouponsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch coupon statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      const statsData = await getCouponStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching coupon stats:', error);
      toast.error('Failed to fetch coupon statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const headerActions = [
    {
      label: 'Create Coupon',
      onClick: () => router.push('/coupons/create'),
      icon: Plus,
      variant: 'default' as const,
    },
    {
      label: 'Analytics',
      onClick: () => router.push('/coupons/analytics'),
      icon: BarChart3,
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="User Coupons"
        description="Manage and monitor user coupon usage across all campaigns"
        icon={Ticket}
        actions={headerActions}
      />
      
      {/* Table Container */}
      <CouponManagementTable initialStats={stats || undefined} />      
    </div>
  );
}
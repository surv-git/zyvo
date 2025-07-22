"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, PageHeaderAction } from '@/components/ui/page-header';
import { 
  Settings, 
  Plus, 
  BarChart3,
  Tag,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import OptionManagementTable from '@/components/options/option-management-table';
import { getOptionList } from '@/services/option-service';

interface OptionStats {
  total: number;
  active: number;
  inactive: number;
  types: number;
}

export default function OptionsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<OptionStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Load statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get all options to calculate stats
        const [allOptions, activeOptions, inactiveOptions] = await Promise.all([
          getOptionList({ page: 1, limit: 1000, include_inactive: true }),
          getOptionList({ page: 1, limit: 1000, is_active: true }),
          getOptionList({ page: 1, limit: 1000, is_active: false })
        ]);

        // Calculate unique option types
        const uniqueTypes = new Set(allOptions.options.map(option => option.option_type));

        setStats({
          total: allOptions.total,
          active: activeOptions.total,
          inactive: inactiveOptions.total,
          types: uniqueTypes.size
        });
      } catch (error) {
        console.error('Failed to load option statistics:', error);
        toast.error('Failed to load statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  const handleAddOption = () => {
    router.push('/options/new');
  };

  const handleAnalytics = () => {
    // TODO: Navigate to analytics page when implemented
    toast.info('Analytics page coming soon!');
  };

  // Define header actions
  const headerActions: PageHeaderAction[] = [
    {
      label: 'Analytics',
      onClick: handleAnalytics,
      variant: 'outline',
      icon: BarChart3
    },
    {
      label: 'Add Option',
      onClick: handleAddOption,
      icon: Plus
    }
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        icon={Settings}
        title="Options Management"
        description="Manage product options and variants"
        actions={headerActions}
      />
      
      {/* Options Management Table */}
      <OptionManagementTable />
    </div>
  );
}

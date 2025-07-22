'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Package } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import PurchaseManagementTable from '@/components/purchases/purchase-management-table';

export default function PurchasesPage() {
  const router = useRouter();

  const headerActions = [
    {
      label: 'New Purchase',
      onClick: () => router.push('/purchases/new'),
      icon: Plus,
      variant: 'default' as const,
    }
  ];

  return (
    <div className="page-container">      
        <PageHeader
          icon={Package}
          title="Purchase Management"
          description="Manage purchase orders and track supplier deliveries"
          actions={headerActions}
        />
        
        <Suspense fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        }>
          <PurchaseManagementTable />
        </Suspense>      
    </div>
  );
}

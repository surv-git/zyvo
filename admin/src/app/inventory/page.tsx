'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Package } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import InventoryManagementTable from '@/components/inventory/inventory-management-table';

export default function InventoryPage() {
  const router = useRouter();

  const headerActions = [
    {
      label: 'New Inventory Record',
      onClick: () => {
        router.push('/inventory/new');
      },
      icon: Plus,
      variant: 'default' as const,
    }
  ];

  return (
    <div className="page-container">      
      <PageHeader
        icon={Package}
        title="Inventory Management"
        description="Track stock levels, locations, and manage inventory records across all warehouses"
        actions={headerActions}
      />
      
      <Suspense fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      }>
        <InventoryManagementTable />
      </Suspense>      
    </div>
  );
}

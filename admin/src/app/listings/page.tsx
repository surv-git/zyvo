'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, List } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import ListingManagementTable from '@/components/listings/listing-management-table';

export default function ListingsPage() {
  const router = useRouter();

  const headerActions = [
    {
      label: 'New Listing',
      onClick: () => router.push('/listings/new'),
      icon: Plus,
      variant: 'default' as const,
    }
  ];

  return (
    <div className="page-container">      
        <PageHeader
          icon={List}
          title="Listing Management"
          description="Manage product listings across platforms"
          actions={headerActions}
        />
        
        <Suspense fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        }>
          <ListingManagementTable />
        </Suspense>      
    </div>
  );
}

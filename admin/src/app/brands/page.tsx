"use client";

import { BrandManagementTable } from '@/components/brands/brand-management-table';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BrandsPage() {
  const router = useRouter();

  const handleAddBrand = () => {
    router.push('/brands/new');
  };

  return (
    <div className="page-container">
      <PageHeader
        icon={Building2}
        title="Brand Management"
        description="Manage brand information, status, and settings across the platform."
        actions={[
          {
            label: "Add Brand",
            onClick: handleAddBrand,
            icon: Plus,
            variant: "default"
          }
        ]}
      />
      
      <BrandManagementTable />
    </div>
  );
}

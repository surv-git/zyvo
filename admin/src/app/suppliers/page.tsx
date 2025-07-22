"use client";

import { PageHeader } from '@/components/ui/page-header';
import SupplierManagementTable from '@/components/suppliers/supplier-management-table';
import { Plus, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuppliersPage() {
  const router = useRouter();

  const handleCreateSupplier = () => {
    router.push('/suppliers/new');
  };

  return (
    <div className="page-container">
      <PageHeader
        icon={Truck}
        title="Suppliers"
        description="Manage your suppliers and supplier relationships"
        actions={[
          {
            label: 'Add Supplier',
            onClick: handleCreateSupplier,
            icon: Plus,
          }
        ]}
      />
      
      <div className="table-container">
        <SupplierManagementTable />
      </div>
    </div>
  );
}
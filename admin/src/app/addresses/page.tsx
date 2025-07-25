"use client";

import { AddressManagementTable } from '@/components/addresses/address-management-table';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddressesPage() {
  const router = useRouter();

  const handleAddAddress = () => {
    router.push('/addresses/new');
  };

  return (
    <div className="page-container">
      <PageHeader
        icon={MapPin}
        title="Address Management"
        description="Manage user addresses, types, verification status, and location information across the platform."
        actions={[
          {
            label: "Add Address",
            onClick: handleAddAddress,
            icon: Plus,
            variant: "default"
          }
        ]}
      />
      
      <AddressManagementTable />
    </div>
  );
}

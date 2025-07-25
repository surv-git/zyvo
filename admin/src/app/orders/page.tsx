"use client";

import OrderManagementTable from '@/components/orders/order-management-table';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const router = useRouter();

  const handleAddOrder = () => {
    router.push('/orders/new');
  };

  return (
    <div className="page-container">
      <PageHeader
        icon={Package}
        title="Order Management"
        description="Manage customer orders, track fulfillment status, and handle order processing across the platform."
        actions={[
          {
            label: "Add Order",
            onClick: handleAddOrder,
            icon: Plus,
            variant: "default"
          }
        ]}
      />
      
      <OrderManagementTable />
    </div>
  );
}

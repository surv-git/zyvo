"use client";

import CartManagementTable from '@/components/carts/cart-management-table';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CartsPage() {
  const router = useRouter();

  const handleAddCart = () => {
    router.push('/carts/new');
  };

  return (
    <div className="page-container">
      <PageHeader
        icon={ShoppingCart}
        title="Cart Management"
        description="Manage shopping carts, view customer activity, and track cart statistics across the platform."
        actions={[
          {
            label: "Add Cart",
            onClick: handleAddCart,
            icon: Plus,
            variant: "default"
          }
        ]}
      />
      
      <CartManagementTable />
    </div>
  );
}

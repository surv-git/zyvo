"use client";

import { CreditCard, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { PaymentMethodManagementTable } from '@/components/payment-methods/payment-method-management-table';

export default function PaymentMethodsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <PageHeader
          icon={CreditCard}
          title="Payment Methods"
          description="Manage user payment methods, view transactions, and monitor payment activities."
          actions={[
            {
              label: "Add Payment Method",
              onClick: () => router.push('/payment-methods/new'),
              icon: Plus,
            }
          ]}
        />
        <PaymentMethodManagementTable />
      </div>
    </div>
  );
}

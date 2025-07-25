"use client";

import { WalletManagementTable } from '@/components/wallets/wallet-management-table';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WalletsPage() {
  const router = useRouter();

  const handleAddWallet = () => {
    router.push('/wallets/new');
  };

  return (
    <div className="page-container">
      <PageHeader
        icon={Wallet}
        title="Wallet Management"
        description="Manage user wallets, balances, and transaction histories across the platform."
        actions={[
          {
            label: "Add Wallet",
            onClick: handleAddWallet,
            icon: Plus,
            variant: "default"
          }
        ]}
      />
      
      <WalletManagementTable />
    </div>
  );
}

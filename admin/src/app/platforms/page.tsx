"use client";

import { PlatformManagementTable } from '@/components/platforms/platform-management-table';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, ExternalLinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PlatformsPage() {
  const router = useRouter();

  const handleAddPlatform = () => {
    router.push('/platforms/new');
  };

  return (
    <div className="page-container">
      <PageHeader
        icon={ExternalLinkIcon}
        title="Platform Management"
        description="Manage and configure sales platforms for your inventory"
        actions={[
          {
            label: "Add Platform",
            onClick: handleAddPlatform,
            icon: Plus,
            variant: "default"
          }
        ]}
      />
      
      <PlatformManagementTable />
    </div>
  );
}

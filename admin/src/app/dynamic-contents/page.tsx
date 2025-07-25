

"use client";

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Plus } from 'lucide-react';
import DynamicContentManagementTable from '@/components/dynamic-contents/dynamic-content-management-table';

export default function DynamicContentsPage() {
  const router = useRouter();

  const handleAddContent = () => {
    router.push('/dynamic-contents/new');
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Dynamic Contents"
        description="Manage advertisements, carousels, marquees, offers, and promotional content"
        actions={[
          {
            label: 'Add Content',
            onClick: handleAddContent,
            icon: Plus,
            variant: 'default'
          }
        ]}
      />
      
      <DynamicContentManagementTable />
    </div>
  );
}
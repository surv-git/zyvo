"use client";

import { SupportTicketManagementTable } from '@/components/support-tickets/support-ticket-management-table';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SupportTicketsPage() {
  const router = useRouter();

  const handleCreateTicket = () => {
    router.push('/support-tickets/new');
  };

  return (
    <div className="page-container">
      <PageHeader
        icon={MessageSquare}
        title="Support Ticket Management"
        description="Manage customer support tickets, track issues, and provide timely resolutions."
        actions={[
          {
            label: "Create Ticket",
            onClick: handleCreateTicket,
            icon: Plus,
            variant: "default"
          }
        ]}
      />
      
      <SupportTicketManagementTable />
    </div>
  );
}

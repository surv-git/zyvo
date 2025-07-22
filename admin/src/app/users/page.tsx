"use client";
import { UserManagementTable } from '@/components/users/user-management-table';
import { PageHeader } from '@/components/ui/page-header';
import { Users, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserManagePage() {
  const router = useRouter();

  return (
    <div className="page-container">
      <PageHeader
        title="User Management"
        description="Manage user accounts, roles, and permissions across the platform."
        icon={Users}
        actions={[
          {
            label: "Add User",
            onClick: () => router.push("/users/new"),
            icon: UserPlus,
            variant: "default"
          }
        ]}
      />
      
      <UserManagementTable />
    </div>
  );
}
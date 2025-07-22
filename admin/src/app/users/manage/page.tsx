import { UserManagementTable } from '@/components/users/user-management-table';

export default function UserManagePage() {
  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts, roles, and permissions across the platform.
          </p>
        </div>
      </div>
      
      <UserManagementTable />
    </div>
  );
}

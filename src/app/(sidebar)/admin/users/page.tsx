// src/app/(sidebar)/admin/users/page.tsx
import { UsersTable } from '@/components/users/branch-manager/users-table';
import { AddUserDialog } from '@/components/users/branch-manager/add-user-dialog';

export default async function UsersPage() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/users`, {
      cache: "no-store",
    });

    const { users, roles, branch } = await res.json();


  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <AddUserDialog roles={roles} branches={branch}/>
      </div>

      <UsersTable users={users} roles={roles} branches={branch}/>
    </div>
  );
}

// src/app/(sidebar)/admin/users/page.tsx
import { StaffTable } from '@/components/users/staff/staff-table';
import { AddStaffDialog } from '@/components/users/staff/add-staff-dialog';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { Role } from '@/types/role';
import { User } from '@/types/user';

export default async function UsersPage() {
    const res = await fetch("http://localhost:3000/api/users");
    const { users, roles, branch } = await res.json();

    console.log(users);
    

  const session = await auth.api.getSession({
     headers: await headers(),
  });

  const defaultBranchId = session?.user?.branch || "";

  const filteredRoles = (roles as Role[]).filter(
  (role) => role.value.toLowerCase() !== "admin"
  );

  const filteredUsers = (users as User[]).filter(
  (role) => role.role.toLowerCase() !== "admin"
  );


  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <AddStaffDialog roles={roles} defaultBranchId={defaultBranchId} branches={branch}/>
      </div> 

      <StaffTable users={filteredUsers} roles={filteredRoles} branches={branch}/>
    </div>
  );
}

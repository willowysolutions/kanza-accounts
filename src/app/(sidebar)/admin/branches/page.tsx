// src/app/(sidebar)/admin/users/page.tsx
import { AddBranchDialog } from '@/components/branch-management/add-branch-dialog';
export default async function UsersPage() {


  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <AddBranchDialog/>
      </div>

      {/* <UsersTable /> */}
    </div>
  );
}

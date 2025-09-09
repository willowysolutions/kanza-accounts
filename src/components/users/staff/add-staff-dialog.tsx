// src/components/add-user-dialog.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Branch, Role } from '@prisma/client';
import { StaffForm } from '@/components/users/staff/staff-form';

interface AddStaffDialogProps {
  roles: Role[];
  branches: Branch[];
  defaultBranchId:string
}

export function AddStaffDialog({ roles, defaultBranchId,branches  }: AddStaffDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setIsOpen(false);
    // Use router refresh instead of window.location.reload()
    setTimeout(() => {
      router.refresh();
    }, 100);
  };

    const filteredRoles = (roles as Role[]).filter(
    (role) => role.value.toLowerCase() !== "admin"
    );
  

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="w-4 h-4" />
          Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle>Add Staff</DialogTitle>
          <DialogDescription>Add a new staff</DialogDescription>
        </DialogHeader>
        <StaffForm roles={filteredRoles} onSuccess={handleSuccess} defaultBranchId={defaultBranchId} branches={branches}/>
      </DialogContent>
    </Dialog>
  );
}

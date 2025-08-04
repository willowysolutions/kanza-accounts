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
import { BranchForm } from '@/components/branch-management/branch-form';
// import type { Role, Branch } from '@prisma/client';

// interface AddUserDialogProps {
//   roles: Role[];
//   branches: Branch[];
// }

export function AddBranchDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setIsOpen(false);
    // Use router refresh instead of window.location.reload()
    setTimeout(() => {
      router.refresh();
    }, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="w-4 h-4" />
          Add Branch
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle>Add New Branch</DialogTitle>
          <DialogDescription>Add a new branch to the system</DialogDescription>
        </DialogHeader>
        <BranchForm roles={[]} branches={[]} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}

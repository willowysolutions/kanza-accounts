"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FC } from "react";
import { Supplier } from "@prisma/client";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const SupplierDeleteDialog: FC<{
  supplier: Supplier;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ supplier, open, setOpen }) => {

    const router = useRouter()
    const handleDelete = async () => {
      try{
          const response = await fetch(`/api/suppliers/${supplier?.id}`,{
              method:"DELETE"
            });
          
          if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error || 'Failed to delete supplier';
            
            // Show specific error message for constraint violations
            if (errorMessage.includes('related records')) {
              toast.error(`Cannot delete supplier: ${errorMessage}`);
            } else {
              toast.error(`Failed to delete supplier: ${errorMessage}`);
            }
            return;
          }
          
          toast.success(`Supplier "${supplier.name}" deleted successfully.`)
          setOpen(false)
          router.refresh()
      }catch(error){
          toast.error(`Failed to delete supplier: ${error instanceof Error ? error.message : 'Unknown error'}`)
          console.error("Error deleting supplier:", error);
      }
    }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{supplier.name}</span> supplier.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive"
              onClick={handleDelete}>Delete</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

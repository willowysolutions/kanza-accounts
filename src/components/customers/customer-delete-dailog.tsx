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
import { Customer } from "@prisma/client";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const CustomerDeleteDialog: FC<{
  customers: Customer;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ customers, open, setOpen }) => {

    const router = useRouter()
    const handleDelete = async () => {
      try{
          await fetch(`/api/customers/${customers?.id}`,{
              method:"DELETE"
            });
          toast.success(`Customers "${customers.name}" deleted.`)
          setOpen(!open)
          router.refresh()
      }catch(error){
          toast.error("Failed to delete customers.")
          console.log(error,"Error on deleting customers");
          
      }
    }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{customers.name}</span> customer.
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

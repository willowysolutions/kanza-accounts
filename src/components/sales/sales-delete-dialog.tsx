"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Sale } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const SalesDeleteDialog: FC<{
  sales: Sale;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ sales, open, setOpen }) => {
    const router = useRouter()
    const handleDelete = async () => {
      try{
          await fetch(`/api/sales/${sales?.id}`,{
              method:"DELETE"
            });
          toast.success(`Sales "${sales.date}" deleted.`)
          setOpen(!open)
          router.refresh()
      }catch(error){
          toast.error("Failed to delete sales.")
          console.log(error,"Error on deleting sales");
          
      }
    }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{sales?.id}</span> sales.
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

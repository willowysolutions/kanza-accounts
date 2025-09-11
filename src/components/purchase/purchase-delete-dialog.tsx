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
import { Purchase } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const PurchaseDeleteDialog: FC<{
  purchase: Purchase;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ purchase, open, setOpen }) => {

    const router = useRouter()
    const handleDelete = async () => {
      try{
          await fetch(`/api/purchases/${purchase?.id}`,{
              method:"DELETE"
            });
          toast.success(`Purchase "${purchase.productType}" deleted.`)
          setOpen(!open)
          router.refresh()
      }catch(error){
          toast.error("Failed to delete purchase.")
          console.log(error,"Error on deleting purchase");
          
      }
    }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{purchase?.productType}</span> purchase.
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

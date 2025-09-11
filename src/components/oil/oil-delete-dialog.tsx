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
import { Oil } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const OilDeleteDialog: FC<{
  oil: Oil;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ oil, open, setOpen }) => {

    const router = useRouter()
    const handleDelete = async () => {
      try{
          await fetch(`/api/oils/${oil?.id}`,{
              method:"DELETE"
            });
          toast.success(`Oils "${oil.productType}" deleted.`)
          setOpen(!open)
          router.refresh()
      }catch(error){
          toast.error("Failed to delete oil.")
          console.log(error,"Error on deleting oil");
          
      }
    }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{oil?.productType}</span> oil.
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

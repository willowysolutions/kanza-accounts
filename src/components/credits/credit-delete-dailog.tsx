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
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Credit } from "@/types/credits";

export const CreditDeleteDialog: FC<{
  credits: Credit;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ credits, open, setOpen }) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    const router = useRouter()
    const handleDelete = async () => {
      try{
          await fetch(`${baseUrl}/api/credits/${credits?.id}`,{
              method:"DELETE"
            });
          toast.success(`Customers "${credits.customer.name}" deleted.`)
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
            <span className="font-bold">{credits.customer.name}</span> customer.
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

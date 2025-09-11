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
import { Stock } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const StockDeleteDialog: FC<{
  stock: Stock;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ stock, open, setOpen }) => {

    const router = useRouter()
    const handleDelete = async () => {
      try{
          await fetch(`/api/stocks/${stock?.id}`,{
              method:"DELETE"
            });
          toast.success(`Stock "${stock.item}" deleted.`)
          setOpen(!open)
          router.refresh()
      }catch(error){
          toast.error("Failed to delete stock.")
          console.log(error,"Error on deleting stock");
          
      }
    }


  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{stock?.item}</span> stock.
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

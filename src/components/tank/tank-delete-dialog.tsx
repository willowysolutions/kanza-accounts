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
import { Tank } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const DeleteTankDialog: FC<{
  tank: Tank;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ tank, open, setOpen }) => {
    const router = useRouter()
    const handleDelete = async () => {
      try{
          await fetch(`http://localhost:3000/api/tanks/${tank?.id}`,{
              method:"DELETE"
            });
          toast.success(`Tank "${tank.tankName}" deleted.`)
          setOpen(!open)
          router.refresh()
      }catch(error){
          toast.error("Failed to delete tank.")
          console.log(error,"Error on deleting tank");
          
      }
    }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{tank?.tankName}</span>
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

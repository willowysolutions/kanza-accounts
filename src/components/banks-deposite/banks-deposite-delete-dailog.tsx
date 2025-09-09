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
import { BankDeposite } from "@prisma/client";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const BankDepositeDeleteDialog:FC<{
  bankDeposite: BankDeposite,
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({bankDeposite, open, setOpen}) => {

  const router = useRouter()
   const handleDelete = async () => {
      try{
          await fetch(`http://localhost:3000/api/bank-deposite/${bankDeposite?.id}`,{
              method:"DELETE"
            });
          toast.success(`Bank deposite "${bankDeposite.amount}" deleted.`)
          setOpen(!open)
          router.refresh()
      }catch(error){
          toast.error("Failed to delete bank deposite.")
          console.log(error,"Error on deleting bank deposite");
          
      }
    }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{bankDeposite.amount}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
            variant="destructive"
            onClick={handleDelete}>Delete</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

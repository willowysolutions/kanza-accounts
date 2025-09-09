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
import { Expense } from "@prisma/client";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const ExpenseDeleteDialog:FC<{
  expense: Expense,
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({expense, open, setOpen}) => {

  const router = useRouter()
   const handleDelete = async () => {
      try{
          await fetch(`http://localhost:3000/api/expenses/${expense?.id}`,{
              method:"DELETE"
            });
          toast.success(`Expense "${expense.title}" deleted.`)
          setOpen(!open)
          router.refresh()
      }catch(error){
          toast.error("Failed to delete expenses category.")
          console.log(error,"Error on deleting expenses category");
          
      }
    }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{expense.title}</span> expense
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

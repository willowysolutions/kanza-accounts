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
import { ExpenseCategory } from "@prisma/client";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";



export const ExpenseCategoryDeleteDialog:FC<{
  expenseCategory: ExpenseCategory,
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({expenseCategory, open, setOpen}) => {
    const router = useRouter()
    const handleDelete = async () => {
      try{
          await fetch(`/api/expensescategory/${expenseCategory?.id}`,{
              method:"DELETE"
            });
          toast.success(`Expense category "${expenseCategory.name}" deleted.`)
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
            <span className="font-bold">{expenseCategory.name}</span> expense category.
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

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
import { Product } from "@prisma/client";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const ProductDeleteDialog: FC<{
  product: Product;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ product, open, setOpen }) => {

    const router = useRouter()
    const handleDelete = async () => {
      try{
          await fetch(`/api/products/${product?.id}`,{
              method:"DELETE"
            });
          toast.success(`Product "${product.productName}" deleted.`)
          setOpen(!open)
          router.refresh()
      }catch(error){
          toast.error("Failed to delete product.")
          console.log(error,"Error on deleting product");
          
      }
    }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{product.productName}</span>.
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

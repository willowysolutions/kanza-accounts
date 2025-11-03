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
import { BalanceReceipt } from "@/types/balance-receipt";

export const BalanceReceiptDeleteDialog: FC<{
  balanceReceipt: BalanceReceipt;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ balanceReceipt, open, setOpen }) => {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/balance-receipts/${balanceReceipt.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to delete balance receipt");
        return;
      }

      toast.success("Balance receipt deleted successfully");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error deleting balance receipt:", error);
      toast.error("Failed to delete balance receipt");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the balance receipt for{" "}
            <span className="font-bold">
              {balanceReceipt.branch?.name || "Unknown Branch"} on{" "}
              {new Date(balanceReceipt.date).toLocaleDateString()}
            </span>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


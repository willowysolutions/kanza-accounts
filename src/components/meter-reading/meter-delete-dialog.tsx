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
import { MeterReading } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const MeterReadingDeleteDialog: FC<{
  meterReading: MeterReading;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ meterReading, open, setOpen }) => {
    const router = useRouter()
    const handleDelete = async () => {
      try{
          const response = await fetch(`/api/meterreadings/${meterReading?.id}`,{
              method:"DELETE"
            });
          
          if (response.ok) {
            toast.success(`Meter reading "${meterReading.fuelType}" deleted.`)
            setOpen(!open)
            // Dispatch custom event to refresh the table
            window.dispatchEvent(new Event('meter-reading-deleted'))
            router.refresh()
          } else {
            toast.error("Failed to delete meter reading.")
          }
      }catch(error){
          toast.error("Failed to delete meter reading.")
          console.log(error,"Error on deleting meter reading");
          
      }
    }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{meterReading?.nozzleId}</span> nozzle.
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

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface PaymentDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: string;
    paidAmount: number;
    paymentMethod: string;
    paidOn: Date;
    customer?: { name: string };
    supplier?: { name: string };
  } | null;
  onPaymentDeleted: () => void;
}

export function PaymentDeleteModal({
  open,
  onOpenChange,
  payment,
  onPaymentDeleted,
}: PaymentDeleteModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!payment) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete payment");
      }

      toast.success("Payment deleted successfully");
      onPaymentDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete payment");
    } finally {
      setLoading(false);
    }
  };

  if (!payment) return null;

  const partyName = payment.customer?.name || payment.supplier?.name || "Unknown";
  const partyType = payment.customer ? "Customer" : "Supplier";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Delete Payment
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this payment? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Party:</span>
              <span className="text-gray-700">{partyName} ({partyType})</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Amount:</span>
              <span className="text-gray-700">₹{payment.paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Method:</span>
              <span className="text-gray-700 capitalize">{payment.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Date:</span>
              <span className="text-gray-700">
                {payment.paidOn.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {loading ? "Deleting..." : "Delete Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

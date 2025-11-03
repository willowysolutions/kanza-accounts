"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PaymentEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: string;
    paidAmount: number;
    paymentMethod: string;
    paidOn: Date;
    customerId?: string;
    supplierId?: string;
    branchId?: string;
    customer?: { name: string; id: string; branchId?: string };
    supplier?: { name: string; id: string; branchId?: string };
  } | null;
  onPaymentUpdated: () => void;
}

export function PaymentEditModal({
  open,
  onOpenChange,
  payment,
  onPaymentUpdated,
}: PaymentEditModalProps) {
  const [formData, setFormData] = useState({
    paidAmount: 0,
    paymentMethod: "",
    paidOn: new Date(),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payment) {
      setFormData({
        paidAmount: payment.paidAmount,
        paymentMethod: payment.paymentMethod,
        paidOn: new Date(payment.paidOn),
      });
    }
  }, [payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: payment.customerId || payment.customer?.id,
          supplierId: payment.supplierId || payment.supplier?.id,
          paidAmount: formData.paidAmount,
          paymentMethod: formData.paymentMethod,
          paidOn: formData.paidOn.toISOString(),
          branchId: payment.branchId || payment.customer?.branchId || payment.supplier?.branchId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update payment");
      }

      toast.success("Payment updated successfully");
      onPaymentUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update payment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!payment) return;

    if (!confirm("Are you sure you want to delete this payment? This action cannot be undone.")) {
      return;
    }

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
      onPaymentUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete payment");
    } finally {
      setLoading(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>
            Update payment details for {payment.customer?.name || payment.supplier?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paidAmount" className="text-right">
                Amount
              </Label>
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                min="0"
                value={formData.paidAmount}
                onChange={(e) =>
                  setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentMethod" className="text-right">
                Method
              </Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  setFormData({ ...formData, paymentMethod: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="atm">ATM</SelectItem>
                  <SelectItem value="paytm">Paytm</SelectItem>
                  <SelectItem value="fleet">Fleet</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paidOn" className="text-right">
                Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !formData.paidOn && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.paidOn ? format(formData.paidOn, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.paidOn}
                    onSelect={(date) => date && setFormData({ ...formData, paidOn: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

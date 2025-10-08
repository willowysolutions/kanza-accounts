"use client";

import {
  DialogClose,
} from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormDialog,
  FormDialogContent,
  FormDialogDescription,
  FormDialogFooter,
  FormDialogHeader,
  FormDialogTitle,
} from "@/components/ui/form-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { SupplierPaymentFormData } from "@/types/payment";
import { supplierPaymentSchema } from "@/schemas/supplier-payment-schema";
import { BranchSelector } from "@/components/common/branch-selector";


export function PurchasePaymentFormDialog({
  payments,
  open,
  openChange,
  userRole,
  userBranchId,
}: {
  payments?: SupplierPaymentFormData;
  open?: boolean;
  openChange?: (open: boolean) => void;
  userRole?: string;
  userBranchId?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(payments?.branchId || userBranchId || "");
  const router = useRouter();

  const form = useForm<z.infer<typeof supplierPaymentSchema>>({
    resolver: zodResolver(supplierPaymentSchema),
    defaultValues: {
      supplierId: payments?.supplierId || "",
      amount: payments?.amount || undefined,
      paymentMethod: payments?.paymentMethod || "",
      paidOn: payments?.paidOn || new Date(),
    },
  });

  // 🔑 watch entered amount
  const enteredAmount = form.watch("amount") ?? 0;

  // Original due amount
  const originalAmount = payments?.amount ?? 0;

  // Remaining after payment
  const remaining = originalAmount - Number(enteredAmount || 0);

  const handleSubmit = async (
    values: z.infer<typeof supplierPaymentSchema>,
    close: () => void
  ) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/payments/purchase-payment-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          branchId: selectedBranchId,
        }),
      });

      const response = await res.json();

      if (!res.ok) {
        toast.error(response.error || "Failed to create payment");
        return;
      }

      toast.success("Payment created successfully");
      close();
      router.refresh();
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error("Unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      openChange={openChange}
      form={form}
      onSubmit={(values) => handleSubmit(values, () => openChange?.(false))}
    >
      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>New Payment</FormDialogTitle>
          <FormDialogDescription>
            Fill out the payment details.
          </FormDialogDescription>
        </FormDialogHeader>

        {/* Branch Selector */}
        <BranchSelector
          value={selectedBranchId}
          onValueChange={setSelectedBranchId}
          userRole={userRole}
          userBranchId={userBranchId}
          isEditMode={!!payments}
        />

        {/* Supplier */}
        <FormField
          control={form.control}
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier</FormLabel>
              <input type="hidden" {...field} />
              <Input value={payments?.supplierName ?? ""} disabled />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
                {payments && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    <p>
                      Remaining :{" "}
                      <span
                        className={
                          remaining < 0 ? "text-red-600 font-medium" : "font-medium"
                        }
                      >
                        {remaining}
                      </span>
                    </p>
                  </div>
                )}
              </FormItem>
            )}
          />

          {/* Payment Method */}
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date */}
          <FormField
            control={form.control}
            name="paidOn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className="w-full text-left">
                        {field.value
                          ? new Date(field.value).toLocaleDateString()
                          : "Pick date"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={new Date(field.value)}
                      onSelect={field.onChange}
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormDialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            Save
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}

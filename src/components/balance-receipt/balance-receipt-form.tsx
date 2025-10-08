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
  FormDialogTrigger,
} from "@/components/ui/form-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { balanceReceiptSchema } from "@/schemas/balance-receipt";
import { BalanceReceiptFormProps } from "@/types/balance-receipt";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { BranchSelector } from "@/components/common/branch-selector";



export type BalanceReceiptFormValues = z.infer<typeof balanceReceiptSchema>;


export const BalanceReceiptFormDialog = ({
  balanceReceipt,
  open,
  openChange,
  userRole,
  userBranchId,
}: BalanceReceiptFormProps & { userRole?: string; userBranchId?: string }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(balanceReceipt?.branchId || userBranchId || "");
  const router = useRouter();

  const form = useForm<BalanceReceiptFormValues>({
    resolver: zodResolver(balanceReceiptSchema),
    defaultValues: {
      date: balanceReceipt?.date ? new Date(balanceReceipt.date) : new Date(),
      amount: balanceReceipt?.amount ?? undefined,
    },
  });

  const handleSubmit = async (
    values: BalanceReceiptFormValues,
    close: () => void
  ) => {
    setIsSubmitting(true);
    try {
      const url = balanceReceipt
        ? `/api/balance-receipts/${balanceReceipt.id}`
        : `/api/balance-receipts/create`;

      const method = balanceReceipt ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          date: new Date(values.date), // ensure DateTime for Prisma
          branchId: selectedBranchId,
        }),
      });

      const response = await res.json();

      if (!res.ok) {
        toast.error(response.error || "Failed to save balance receipt");
        return;
      }

      toast.success(
        balanceReceipt
          ? "Balance receipt updated successfully"
          : "Balance receipt created successfully"
      );
      close();
      router.refresh();
    } catch (error) {
      console.error("Error saving balance receipt:", error);
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
      <FormDialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-2" />
          New Balance Receipt
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>
            {balanceReceipt ? "Edit Balance Receipt" : "New Balance Receipt"}
          </FormDialogTitle>
          <FormDialogDescription>
            Fill out the balance receipt details. Click save when you’re done.
          </FormDialogDescription>
        </FormDialogHeader>

        {/* Branch Selector */}
        <BranchSelector
          value={selectedBranchId}
          onValueChange={setSelectedBranchId}
          userRole={userRole}
          userBranchId={userBranchId}
          isEditMode={!!balanceReceipt}
        />

        <div className="grid gap-4">
          {/* Date */}
          <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? new Date(field.value).toLocaleDateString()
                        : "Pick a date"}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={field.onChange}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    step="0.01"
                    placeholder="0000.00"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
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
            {isSubmitting ? "Saving..." : balanceReceipt ? "Update" : "Save"}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
};

"use client";

import { DialogClose } from "@/components/ui/dialog";
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
import { expenseSchema } from "@/schemas/expense-schema";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExpenseFormProps } from "@/types/expense";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "@/lib/utils";
import { BranchSelector } from "@/components/common/branch-selector";
import { useNextAllowedDate } from "@/hooks/use-next-allowed-date";

export const ExpenseFormDialog = ({
  expense,
  open,
  openChange,
  userRole,
  userBranchId,
}: ExpenseFormProps & { userRole?: string; userBranchId?: string }) => {
  const [expenseCategoryList, setExpenseCategoryList] = useState<
    { name: string; id: string; limit?: number }[]
  >([]);
  const [bankList, setBankList] = useState<{ bankName: string; id: string }[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedBranchId, setSelectedBranchId] = useState(
    expense?.branchId || userBranchId || ""
  );

  const router = useRouter();

  // Branch date restriction
  const { nextAllowedDate, isDateRestricted } = useNextAllowedDate({
    userRole,
    branchId: selectedBranchId,
    isEditMode: !!expense,
  });

  // --------------------
  // FORM
  // --------------------
  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: expense?.description ?? "",
      amount: expense?.amount ?? undefined,
      date: expense?.date ? new Date(expense.date) : new Date(),
      expenseCategoryId: expense?.expenseCategoryId || "",
      bankId: expense?.bankId || undefined,
      reason: (expense as { reason?: string })?.reason || "",
    },
  });

  const selectedCategoryId = form.watch("expenseCategoryId");
  const enteredAmount = form.watch("amount") ?? 0;
  const selectedCategory = expenseCategoryList.find(
    (c) => c.id === selectedCategoryId
  );

  const exceedsLimit =
    selectedCategory?.name === "TA" &&
    selectedCategory.limit &&
    Number(enteredAmount) > selectedCategory.limit;

  // --------------------
  // FETCH CATEGORY + BANKS
  // --------------------
  useEffect(() => {
    fetch("/api/expensescategory")
      .then((res) => res.json())
      .then((d) => setExpenseCategoryList(d.data || []))
      .catch((err) => console.error("Failed to fetch categories", err));
  }, []);

  useEffect(() => {
    fetch("/api/banks")
      .then((res) => res.json())
      .then((d) => setBankList(d.banks || []))
      .catch((err) => console.error("Failed to fetch banks", err));
  }, []);

  // --------------------
  // AUTO-SELECT DATE (like Sales, using nextAllowedDate)
  // --------------------
  useEffect(() => {
    // Treat undefined `open` (uncontrolled dialog) as open=true so the date still applies
    const isOpen = open ?? true;
    if (isOpen && isDateRestricted && nextAllowedDate && !expense) {
      const current = form.getValues();
      form.reset({ ...current, date: nextAllowedDate });
    }
  }, [open, isDateRestricted, nextAllowedDate, expense, form]);

  // --------------------
  // SUBMIT
  // --------------------
  const handleSubmit = async (
    values: z.infer<typeof expenseSchema>,
    close: () => void
  ) => {
    if (exceedsLimit && (!values.reason || values.reason.trim() === "")) {
      toast.error("Reason is required when expense exceeds TA category limit.");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = expense
        ? `/api/expenses/${expense.id}`
        : `/api/expenses/create`;

      const res = await fetch(url, {
        method: expense ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          branchId: selectedBranchId,
        }),
      });

      const response = await res.json();

      if (!res.ok) {
        toast.error(response.error || "Failed to save expense");
        return;
      }

      toast.success(expense ? "Expense updated" : "Expense created");
      close();
      router.refresh();
    } catch (err) {
      console.error("Expense save error:", err);
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
      onSubmit={(values) =>
        handleSubmit(values, () => openChange?.(false))
      }
    >
      <FormDialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-2" />
          New Expense
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>{expense ? "Edit Expense" : "New Expense"}</FormDialogTitle>
          <FormDialogDescription>Fill out the expense details.</FormDialogDescription>
        </FormDialogHeader>

        <BranchSelector
          value={selectedBranchId}
          onValueChange={setSelectedBranchId}
          userRole={userRole}
          userBranchId={userBranchId}
          isEditMode={!!expense}
        />

        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <FormControl>
                  {isDateRestricted ? (
                    <Button
                      variant="outline"
                      disabled
                      className={cn(
                        "w-full pl-3 text-left font-normal bg-muted cursor-not-allowed",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? new Date(field.value).toLocaleDateString()
                        : "Pick a date"}
                    </Button>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? new Date(field.value).toLocaleDateString()
                            : "Pick a date"}
                        </Button>
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
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Expense Category */}
          <FormField
            control={form.control}
            name="expenseCategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expense Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {expenseCategoryList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Bank selector only when category=Bank */}
          {selectedCategory?.name?.toLowerCase() === "bank" && (
            <FormField
              control={form.control}
              name="bankId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Bank</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="bank" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bankList.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.bankName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Amount */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Amount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Input placeholder="description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Reason for exceeding TA limit */}
        {exceedsLimit && (
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason (Required)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter reason" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormDialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : expense ? (
              "Update"
            ) : (
              "Save"
            )}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
};

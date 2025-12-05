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
import { expenseSchema } from "@/schemas/expense-schema";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExpenseFormProps } from "@/types/expense";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
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
  const [expenseCategoryList, setExpenseCategoryList] = useState<{ name: string; id: string; limit?: number }[]>([])
  const [bankList, setBankList] = useState<{ bankName: string; id: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(expense?.branchId || userBranchId || "");
  const router = useRouter();

  // Get next allowed date for branch managers
  const { nextAllowedDate, isDateRestricted } = useNextAllowedDate({
    userRole,
    branchId: selectedBranchId,
    isEditMode: !!expense,
  });


  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: expense?.description ?? "",
      amount: expense?.amount ?? undefined,
      date: expense?.date ? new Date(expense.date) : (nextAllowedDate || new Date()),
      expenseCategoryId: expense?.expenseCategoryId || "",
      bankId:expense?.bankId || undefined,
      reason: (expense as { reason?: string })?.reason || "",
    },
  });

  // Update date when nextAllowedDate is available for branch managers
  useEffect(() => {
    if (isDateRestricted && nextAllowedDate && !expense) {
      form.setValue("date", nextAllowedDate);
    }
  }, [isDateRestricted, nextAllowedDate, expense, form]);

  // Watch fields
  const selectedCategoryId = form.watch("expenseCategoryId");
  const enteredAmount = form.watch("amount") ?? 0;

  // Find selected category
  const selectedCategory = expenseCategoryList.find(
    (c) => c.id === selectedCategoryId
  );

  // Check if total expenses + new amount exceeds category limit
  const exceedsLimit = selectedCategory?.limit && selectedCategory.name === "TA" && Number(enteredAmount || 0) > selectedCategory.limit;

  const handleSubmit = async (
    values: z.infer<typeof expenseSchema>,
    close: () => void
  ) => {
    // Validate reason when limit is exceeded
    if (exceedsLimit && (!values.reason || values.reason.trim() === "")) {
      toast.error("Reason is required when expense amount exceeds TA category limit");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = expense
        ? `/api/expenses/${expense.id}`
        : `/api/expenses/create`;

      const method = expense ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
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

      toast.success(expense ? "Expense updated successfully" : "Expense created successfully");
      close();
      router.refresh();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
      const fetchCategorys = async () => {
        try {
          const res = await fetch("/api/expensescategory");
          const json = await res.json();
          setExpenseCategoryList(json.data || []);
        } catch (error) {
          console.error("Failed to fetch expense category", error);
        }
      };
  
      fetchCategorys();
    }, []);

  useEffect(() => {
      const fetchBanks = async () => {
        try {
          const res = await fetch("/api/banks");
          const json = await res.json();
          setBankList(json.banks || []);
        } catch (error) {
          console.error("Failed to fetch expense category", error);
        }
      };
  
      fetchBanks();
    }, []);
    
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
          New Expense
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>{expense ? "Edit Expense" : "New Expense"}</FormDialogTitle>
          <FormDialogDescription>
            Fill out the expense details. Click save when you’re done.
          </FormDialogDescription>
        </FormDialogHeader>

        {/* Branch Selector */}
        <BranchSelector
          value={selectedBranchId}
          onValueChange={setSelectedBranchId}
          userRole={userRole}
          userBranchId={userBranchId}
          isEditMode={!!expense}
        />

        {/* Title */}
        {/* Expense Category */}
        <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <FormControl>
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormField
          control={form.control}
          name="expenseCategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expense Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {expenseCategoryList.map((expenseCategory) => (
                    <SelectItem key={expenseCategory?.id} value={expenseCategory?.id}>
                      {expenseCategory?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {(() => {
          const selectedCategoryId = form.watch("expenseCategoryId");
          const selectedCategory = expenseCategoryList.find(c => c.id === selectedCategoryId);

          if (selectedCategory?.name.toLocaleLowerCase() === "bank") {
            return (
              <FormField
                control={form.control}
                name="bankId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Bank</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="bank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bankList.map((bank) => (
                          <SelectItem key={bank?.id} value={bank?.id}>
                            {bank?.bankName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          }
          return null;
        })()}
        </div>

        <div className="grid grid-cols-2 gap-4">
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

        {/* Date */}
        </div>



        <div className="w-full">

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="description" {...field}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>



        {/* Amount */}
        

        {/* Reason field - only show when TA expense amount exceeds limit */}
        {exceedsLimit && (
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason (Required - TA expense exceeds limit)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter reason for exceeding TA category limit"
                    {...field}
                  />
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              expense ? "Update" : "Save"
            )}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
};

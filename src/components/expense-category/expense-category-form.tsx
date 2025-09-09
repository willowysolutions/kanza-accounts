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
import { expenseCategorySchema } from "@/schemas/expense-category-schema";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExpenseCategoryFormProps } from "@/types/expense-category";

export const ExpenseCategoryFormDialog = ({
  expenseCategory,
  open,
  openChange,
}: ExpenseCategoryFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof expenseCategorySchema>>({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: {
      name: expenseCategory?.name || "",
    },
  });

  const handleSubmit = async (
    values: z.infer<typeof expenseCategorySchema>,
    close: () => void
  ) => {
    setIsSubmitting(true);
    try {
      const url = expenseCategory
        ? `/api/expensescategory/${expenseCategory.id}`
        : `/api/expensescategory/create`;

      const method = expenseCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const response = await res.json();

      if (!res.ok) {
        toast.error(response.error || "Failed to save expense category");
        return;
      }

      toast.success(
        expenseCategory
          ? "Expense category updated successfully"
          : "Expense category created successfully"
      );
      close();
      router.refresh();
    } catch (error) {
      console.error("Error saving expense category:", error);
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
          New Expense Category
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>
            {expenseCategory ? "Edit Expense Category" : "New Expense Category"}
          </FormDialogTitle>
          <FormDialogDescription>
            Fill out the expense category details. Click save when you’re done.
          </FormDialogDescription>
        </FormDialogHeader>

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expense Category Name</FormLabel>
              <FormControl>
                <Input placeholder="Expense Category Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormDialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : expenseCategory ? "Update" : "Save"}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
};

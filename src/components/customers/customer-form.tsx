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
import { useState, useEffect } from "react";
import { Customer } from "@prisma/client";
import { useRouter } from "next/navigation";
import { customerSchema } from "@/schemas/customers-schema";
import { BranchSelector } from "@/components/common/branch-selector";

export function CustomerFormDialog({
  customers,
  open,
  openChange,
  userRole,
  userBranchId,
}: {
  customers?: Customer;
  open?: boolean;
  openChange?: (open: boolean) => void;
  userRole?: string;
  userBranchId?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(customers?.branchId || userBranchId || "");
  const router = useRouter();

  // Update selectedBranchId when customers prop changes
  useEffect(() => {
    if (customers?.branchId) {
      setSelectedBranchId(customers.branchId);
    }
  }, [customers?.branchId]);

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customers?.name || "",
      phone: customers?.phone || "",
      email: customers?.email || "",
      address: customers?.address || "",
      openingBalance: customers?.openingBalance || undefined,
      limit: customers?.limit || undefined,
      branchId: customers?.branchId || undefined,
    },
  });

  const handleSubmit = async (
    values: z.infer<typeof customerSchema>,
    close: () => void
  ) => {
    setIsSubmitting(true);
    try {
      const url = customers
        ? `/api/customers/${customers.id}`
        : "/api/customers/create";

      const method = customers ? "PATCH" : "POST";

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
        toast.error(response.error || "Failed to save customers");
        return;
      }

      toast.success(customers ? "Customers updated successfully" : "Customers created successfully");
      close();
      router.refresh();
    } catch (error) {
      console.error("Error saving customers:", error);
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
          <Plus className="size-4" />
          {customers ? "Edit Customers" : "New Customers"}
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>{customers ? "Edit Customers" : "New Customers"}</FormDialogTitle>
          <FormDialogDescription>
            {customers
              ? "Update customers details. Click save when you're done."
              : "Fill out the customers details. Click save when you're done."}
          </FormDialogDescription>
        </FormDialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input placeholder="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="+91 XXXXX XXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <BranchSelector
          value={selectedBranchId}
          onValueChange={setSelectedBranchId}
          userRole={userRole}
          userBranchId={userBranchId}
        />

        <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="openingBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opening Balance</FormLabel>
              <FormControl>
                <Input type="number" 
                placeholder="000.00"
                {...field} 
                value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Limit</FormLabel>
              <FormControl>
                <Input type="number" 
                placeholder="000.00"
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
            {customers ? "Update" : "Save"}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}
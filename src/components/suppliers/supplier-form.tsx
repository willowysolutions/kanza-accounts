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
import { supplierSchema } from "@/schemas/supplier-schema";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import * as React from "react";
import { Supplier } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { BranchSelector } from "@/components/common/branch-selector";

export function SupplierFormDialog({
  suppliers,
  open,
  openChange,
  userRole,
  userBranchId,
}: {
  suppliers?: Supplier;
  open?: boolean;
  openChange?: (open: boolean) => void;
  userRole?: string;
  userBranchId?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(suppliers?.branchId || userBranchId || "");
  const router = useRouter();

  const form = useForm<z.infer<typeof supplierSchema>>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      SupplierId: suppliers?.SupplierId || "",
      name: suppliers?.name || "",
      email: suppliers?.email || "",
      phone: suppliers?.phone || "",
      address: suppliers?.address || "",
      openingBalance: suppliers?.openingBalance || undefined,
      branchId: suppliers?.branchId || "",
    },
  });

  // Sync selectedBranchId with form's branchId field
  React.useEffect(() => {
    if (selectedBranchId) {
      form.setValue("branchId", selectedBranchId);
    }
  }, [selectedBranchId, form]);

  const handleSubmit = async (
    values: z.infer<typeof supplierSchema>,
    close: () => void
  ) => {
    setIsSubmitting(true);
    try {
      const url = suppliers
        ? `/api/suppliers/${suppliers.id}`
        : "/api/suppliers/create";

      const method = suppliers ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const response = await res.json();

      if (!res.ok) {
        toast.error(response.error || "Failed to save supplier");
        return;
      }

      toast.success(suppliers ? "Supplier updated successfully" : "Supplier created successfully");
      close();
      router.refresh();
    } catch (error) {
      console.error("Error saving supplier:", error);
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
          {suppliers ? "Edit Supplier" : "New Supplier"}
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>{suppliers ? "Edit Supplier" : "New Supplier"}</FormDialogTitle>
          <FormDialogDescription>
            {suppliers
              ? "Update supplier details. Click save when you're done."
              : "Fill out the supplier details. Click save when you're done."}
          </FormDialogDescription>
        </FormDialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="SupplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier ID</FormLabel>
                <FormControl>
                  <Input placeholder="S0001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Supplier Name" {...field} />
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <BranchSelector
          value={selectedBranchId}
          onValueChange={setSelectedBranchId}
          userRole={userRole}
          userBranchId={userBranchId}
          isEditMode={!!suppliers}
        />


        <FormField
          control={form.control}
          name="openingBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opening Balance</FormLabel>
              <FormControl>
                <Input type="number" 
                {...field} 
                value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />



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
              suppliers ? "Update" : "Save"
            )}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}
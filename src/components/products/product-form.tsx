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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Product } from "@prisma/client";
import { useRouter } from "next/navigation";
import { productSchema } from "@/schemas/product-schema";

export function ProductFormDialog({
  products,
  open,
  openChange,
}: {
  products?: Product;
  open?: boolean;
  openChange?: (open: boolean) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: products?.productName || "",
      purchasePrice: products?.purchasePrice || undefined,
      sellingPrice: products?.sellingPrice || undefined,
      productUnit: products?.productUnit || "",
    },
  });

  const handleSubmit = async (
    values: z.infer<typeof productSchema>,
    close: () => void
  ) => {
    setIsSubmitting(true);
    try {
      const url = products
        ? `/api/products/${products.id}`
        : "/api/products/create";

      const method = products ? "PATCH" : "POST";

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

      toast.success(products ? "Product updated successfully" : "Product created successfully");
      close();
      router.refresh();
    } catch (error) {
      console.error("Error saving product:", error);
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
          {products ? "Edit Product" : "New Product"}
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>{products ? "Edit Product" : "New Product"}</FormDialogTitle>
          <FormDialogDescription>
            {products
              ? "Update product details. Click save when you're done."
              : "Fill out the product details. Click save when you're done."}
          </FormDialogDescription>
        </FormDialogHeader>

          <FormField
            control={form.control}
            name="productName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Product Name"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const formatted = val
                        .split(" ")
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ");
                      field.onChange(formatted);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchasePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Price</FormLabel>
                <FormControl>
                  <Input 
                  placeholder="104.13" 
                  {...field}
                  value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price</FormLabel>
                <FormControl>
                  <Input 
                  placeholder="104.13" 
                  {...field}
                  value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>

          <FormField
            control={form.control}
            name="productUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Liters">Liters</SelectItem>
                    <SelectItem value="Bottles">Bottles</SelectItem>
                    <SelectItem value="Pieces">Pieces</SelectItem>
                    <SelectItem value="Gallon">Gallon</SelectItem>
                  </SelectContent>
                </Select>
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
            {products ? "Update" : "Save"}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}
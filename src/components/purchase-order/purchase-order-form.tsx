"use client";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormDialog,
  FormDialogContent,
  FormDialogDescription,
  FormDialogFooter,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogTrigger,
} from "@/components/ui/form-dialog";
import { DialogClose } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { purchaseOrderSchema } from "@/schemas/purchase-order";
import { PurchaseOrder } from "@/types/purchase-order";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";


type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

export function PurchaseOrderFormModal({
  purchaseOrder,
  open,
  openChange,
}: {
  purchaseOrder?: PurchaseOrder;
  open?: boolean;
  openChange?: (open: boolean) => void;
}) {
  const [supplierOptions, setSupplierOptions] = useState<{ name: string; id: string, phone:string}[]>([]);
  const [productOption, setProductOptions] = useState<{ 
  productName: string;
  id: string;
  currentPrice:number;
  productUnit:string }[]>([]);

  const router = useRouter();

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: purchaseOrder?.supplierId || "",
      productType: purchaseOrder?.productType || "",
      quantity: purchaseOrder?.quantity || undefined,
      orderDate:purchaseOrder?.orderDate || new Date(),
    },
  });

  const handleSubmit = async (values: PurchaseOrderFormValues, close: () => void) => {
    try {
      const url = purchaseOrder
        ? `/api/purchase-order/${purchaseOrder.id}`
        : `/api/purchase-order/create`;

      const method = purchaseOrder ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to save purchase");
        return;
      }

      toast.success(purchaseOrder ? "Purchase updated successfully" : "Purchase created successfully");
      close();
      router.refresh();
    } catch (error) {
      console.error("Something went wrong:", error);
      toast.error("Something went wrong while saving purchase");
    }
  };

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch("/api/suppliers");
        const json = await res.json();
        setSupplierOptions(json.data || []);
      } catch (error) {
        console.error("Failed to fetch suppliers", error);
      }
    };

    fetchSuppliers();
  }, []);

  useEffect(() => {
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const json = await res.json();
      
      // Deduplicate products by name, keeping the first occurrence
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const uniqueProducts = json.data?.reduce((acc: any[], product: any) => {
        const existingProduct = acc.find(p => p.productName === product.productName);
        if (!existingProduct) {
          acc.push(product);
        }
        return acc;
      }, []) || [];
      
      setProductOptions(uniqueProducts);
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  fetchProducts();
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
          {purchaseOrder ? <Pencil className="size-4 mr-2" /> : <Plus className="size-4 mr-2" />}
          {purchaseOrder ? "Edit Purchase Order" : "New Purchase Order"}
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>{purchaseOrder ? "Edit Purchase Order" : "Create Purchase Order"}</FormDialogTitle>
          <FormDialogDescription>
            {purchaseOrder
              ? "Update an existing purchase order"
              : "Place a new order for fuel or inventory items."}
          </FormDialogDescription>
        </FormDialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="supplierId" render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {supplierOptions.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField
          control={form.control}
          name="productType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fuel Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {productOption.map(product => (
                    <SelectItem key={product.id} value={product.productName}>
                      {product.productName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Liters/Units" 
                  {...field} 
                  value={field.value ?? ""}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <FormField
            control={form.control}
            name="orderDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order Date</FormLabel>
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
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              purchaseOrder ? "Update" : "Save"
            )}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}

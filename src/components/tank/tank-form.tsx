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
import { tankSchema } from "@/schemas/tank-schema";
import { z } from "zod";
import { IconPlus } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tank } from "@/types/tank";

type TankFormValues = z.infer<typeof tankSchema>;

export function TankFormDialog({
  open,
  openChange,
  tank,
}: {
  open?: boolean;
  openChange?: (open: boolean) => void;
  tank?: Tank;
}) {
  const [supplierOptions, setSupplierOptions] = useState<{ name: string; id: string }[]>([]);
  const [productOption, setProductOptions] = useState<{ 
  productName: string;
  id: string;
  currentPrice:number;
  productUnit:string;
  branchId?: string | null;
  productCategory?: "FUEL" | "OTHER";
  }[]>([]);
  const [branchOptions, setBranchOptions] = useState<{ name: string; id: string }[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(tank?.branchId || "");

  const router = useRouter();

  const form = useForm<TankFormValues>({
    resolver: zodResolver(tankSchema),
    defaultValues: {
      tankName: tank?.tankName || "",
      fuelType: tank?.fuelType || "",
      capacity: tank?.capacity || 0,
      minLevel: tank?.minLevel || 0,
      supplierId: tank?.supplierId ?? undefined,
      branchId: tank?.branchId ?? undefined,
    },
  });

  const handleSubmit = async (
    values: TankFormValues,
    close: () => void
  ) => {
    try {
      const url = tank
        ? `/api/tanks/${tank.id}`
        : "/api/tanks/create";

      const method = tank ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to save tank");
        return;
      }

      toast.success(tank ? "Tank updated successfully" : "Tank created successfully");
      close();
      router.refresh();
    } catch (error) {
      console.error("Something went wrong:", error);
      toast.error("Unexpected error occurred");
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
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/branch");
        const json = await res.json();
        setBranchOptions(json.data || []);
      } catch (error) {
        console.error("Failed to fetch branches", error);
      }
    };

    fetchBranches();
  }, []);


  // Fetch fuel products based on selected branch
  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedBranchId) {
        setProductOptions([]);
        return;
      }

      try {
        const res = await fetch("/api/products");
        const json = await res.json();
        
        // Filter products: only FUEL category products for the selected branch
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredProducts = json.data?.filter((product: any) => {
          // Must be FUEL category
          if (product.productCategory !== "FUEL") {
            return false;
          }
          // Must belong to the selected branch
          return product.branchId === selectedBranchId;
        }) || [];
        
        // Deduplicate products by name, keeping the first occurrence
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uniqueProducts = filteredProducts.reduce((acc: any[], product: any) => {
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
  }, [selectedBranchId]);

  // Watch branchId from form and sync with selectedBranchId state
  const formBranchId = form.watch("branchId");
  useEffect(() => {
    if (formBranchId) {
      setSelectedBranchId(formBranchId);
    }
  }, [formBranchId]);


  return (
    <FormDialog
      open={open}
      openChange={openChange}
      form={form}
      onSubmit={(values) => handleSubmit(values, () => openChange?.(false))}
    >
      <FormDialogTrigger asChild>
        <Button>
          <IconPlus className="size-4 mr-2" />
          {tank ? "Edit Tank" : "Add Tank"}
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>
            {tank ? "Edit Tank" : "Add New Tank"}
          </FormDialogTitle>
          <FormDialogDescription>
            {tank
              ? "Update tank details. Click save when you're done."
              : "Enter the details of the fuel tank."}
          </FormDialogDescription>
        </FormDialogHeader>

        {/* Branch - First Field */}
        <FormField
          control={form.control}
          name="branchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedBranchId(value);
                  // Clear fuel type when branch changes
                  form.setValue("fuelType", "");
                }} 
                value={field.value ?? undefined}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {branchOptions.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tank Name & Fuel Type */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="tankName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tank Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Tank 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fuel Type - Filtered by selected branch */}
        <FormField
          control={form.control}
          name="fuelType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fuel Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!selectedBranchId || productOption.length === 0}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      !selectedBranchId 
                        ? "Select branch first" 
                        : productOption.length === 0 
                          ? "No fuel products available" 
                          : "Select fuel type"
                    } />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {productOption.length > 0 ? (
                    productOption.map(product => (
                      <SelectItem key={product.id} value={product.productName}>
                        {product.productName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-products" disabled>
                      No fuel products found for this branch
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {!selectedBranchId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Please select a branch first
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

        {/* Capacity & Min Level */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity (L)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="minLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Level (L)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Supplier */}
        <FormField
          control={form.control}
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier (optional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? undefined}>
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
          )}
        />

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
              tank ? "Update" : "Save"
            )}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}

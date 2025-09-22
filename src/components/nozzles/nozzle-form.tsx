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
import { nozzleSchema } from "@/schemas/nozzle-schema";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Nozzle } from "@prisma/client";
import { useRouter } from "next/navigation";

type NozzleFormValues = z.infer<typeof nozzleSchema>;

export function NozzleFormModal({
  nozzle,
  open,
  openChange,
}: {
  nozzle?: Nozzle;
  open?: boolean;
  openChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [machineOptions, setMachineOptions] = useState<{ machineName: string; id: string }[]>([]);
  const [productOption, setProductOptions] = useState<{ 
    productName: string;
    id: string;
    currentPrice:number;
    productUnit:string }[]>([]);
  const [branchOptions, setBranchOptions] = useState<{ name: string; id: string }[]>([]);


  const form = useForm<NozzleFormValues>({
    resolver: zodResolver(nozzleSchema),
    defaultValues: {
      nozzleNumber: nozzle?.nozzleNumber || "",
      machineId: nozzle?.machineId || "",
      fuelType: nozzle?.fuelType || "",
      openingReading: nozzle?.openingReading || 0,
      branchId: nozzle?.branchId || undefined,
    },
  });

  const handleSubmit = async (
    values: z.infer<typeof nozzleSchema>,
    close: () => void
  ) => {
    try {
      const res = await fetch(
        nozzle
          ? `/api/nozzles/${nozzle.id}` // Update
          : `/api/nozzles/create`, // Create
        {
          method: nozzle ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to save nozzle");
        return;
      }

      toast.success(nozzle ? "Nozzle updated successfully" : "Nozzle added successfully");
      close();
      router.refresh();
    } catch (error) {
      console.error("Something went wrong:", error);
    }
  };

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const res = await fetch("/api/machines");
        const json = await res.json();
        setMachineOptions(json.data || []);
      } catch (error) {
        console.error("Failed to fetch machines", error);
      }
    };

    fetchMachines();
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

  return (
    <FormDialog
      open={open}
      openChange={openChange}
      form={form}
      onSubmit={handleSubmit}
    >
      <FormDialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          {nozzle ? "Edit Nozzle" : "Add Nozzle"}
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>{nozzle ? "Edit Nozzle" : "Add New Nozzle"}</FormDialogTitle>
          <FormDialogDescription>
            {nozzle
              ? "Update the nozzle details."
              : "Configure a new fuel dispensing nozzle."}
          </FormDialogDescription>
        </FormDialogHeader>

        <FormField
          control={form.control}
          name="nozzleNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nozzle Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g. N001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="machineId" render={({ field }) => (
            <FormItem>
              <FormLabel>Machine</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Machine" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {machineOptions.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.machineName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField
          control={form.control}
          name="fuelType"
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
          name="openingReading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opening Balance</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="branchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? undefined}>
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
        </div>
        
        <FormDialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit">Save</Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}

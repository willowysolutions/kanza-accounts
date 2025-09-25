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
} from "@/components/ui/form-dialog";
import { DialogClose } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { MeterReading, Nozzle } from "@prisma/client";
import { useRouter } from "next/navigation";
import { ProductType } from "@/types/product";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";


// ✅ schema
const meterReadingSchema = z.object({
  nozzleId: z.string().min(1, "Nozzle is required"),
  openingReading: z.coerce.number(),
  closingReading: z.coerce.number(),
  totalAmount: z.coerce.number(),
  date: z.coerce.date(),
});

type MeterReadingFormValues = z.infer<typeof meterReadingSchema>;

export function MeterReadingUpdateForm({
  meterReading,
  open,
  openChange,
}: {
  meterReading: MeterReading;
  open: boolean;
  openChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [nozzles, setNozzles] = useState<Nozzle[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);

  const form = useForm<MeterReadingFormValues>({
    resolver: zodResolver(meterReadingSchema),
    defaultValues: {
      nozzleId: meterReading.nozzleId,
      openingReading: meterReading.openingReading || undefined,
      closingReading: meterReading.closingReading || undefined,
      totalAmount: meterReading.totalAmount,
      date: meterReading.date,
    },
  });

  const handleSubmit = async (
    values: MeterReadingFormValues,
    close: () => void
  ) => {
    try {
      const res = await fetch(`/api/meterreadings/${meterReading.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to update meter reading");
        return;
      }

      toast.success("Meter reading updated successfully");
      close();
      router.refresh();
    } catch (error) {
      console.error("Something went wrong:", error);
      toast.error("Unexpected error");
    }
  };

  useEffect(() => {
    const fetchNozzles = async () => {
      try {
        const res = await fetch("/api/nozzles");
        const json = await res.json();
        setNozzles(json.data || []);
      } catch (error) {
        console.error("Failed to fetch nozzles", error);
      }
    };

    fetchNozzles();
  }, []);

    useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const json = await res.json();
        setProducts(json.data || []);
      } catch (error) {
        console.error("Failed to fetch meter products", error);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
        if (name === "closingReading") {
        const nozzle = nozzles.find(n => n.id === values.nozzleId);
        if (!nozzle) return;

        const product = products.find(p => p.productName === nozzle.fuelType);
        if (!product) return;

        const opening = values.openingReading ?? 0;
        const closing = values.closingReading ?? 0;
        const diff = closing - opening;

        if (diff >= 0) {
            const total = diff * product.sellingPrice;
            form.setValue("totalAmount", Math.round(total));
        }
        }
    });

    return () => subscription.unsubscribe();
    }, [form, nozzles, products]);


  return (
    <FormDialog
      open={open}
      openChange={openChange}
      form={form}
      onSubmit={handleSubmit}
    >
      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>Edit Meter Reading</FormDialogTitle>
          <FormDialogDescription>
            Update the meter reading details.
          </FormDialogDescription>
        </FormDialogHeader>

        {/* nozzle select */}
        <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="nozzleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nozzle</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full" disabled>
                    <SelectValue placeholder="Select nozzle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {nozzles.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.nozzleNumber} – {n.fuelType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* opening balance */}
        <FormField
          control={form.control}
          name="openingReading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opening Balance</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? undefined : Number(value));
                    }}

                  disabled
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>

        {/* closing balance */}
        <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="closingReading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Closing Balance</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.value)}

                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* total price */}
        <FormField
          control={form.control}
          name="totalAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>

        {/* Date field */}
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

        <FormDialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit">Update</Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}

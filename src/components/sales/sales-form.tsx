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
import { Plus, Pencil } from "lucide-react";
import { salesSchema } from "@/schemas/sales-schema";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Sales } from "@/types/sales";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useEffect, useState } from "react";

type SalesFormValues = z.infer<typeof salesSchema>;

export function SalesFormModal({
  sales,
  open,
  openChange,
}: {
  sales?: Sales;
  open?: boolean;
  openChange?: (open: boolean) => void;
}) {
  const [meterReading, setMeterReading] = useState<{ 
    totalAmount: number;
    id: string;
    date: Date;
    fuelType:string;
  }[]>([]);

  const [oilSales, setOilSales] = useState<{ 
    totalAmount: number;
    id: string;
    date: Date;
    quantity: number;
    price: number;
    productType:string;
  }[]>([]);


  const router = useRouter();

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesSchema),
    defaultValues: {
      date: sales?.date || new Date(),
      rate: sales?.rate || undefined,
      oilT2Total: sales?.oilT2Total || undefined,
      gasTotal: sales?.gasTotal || undefined,
      xgDieselTotal:sales?.xgDieselTotal || undefined,
      hsdDieselTotal:sales?.hsdDieselTotal || undefined,
      msPetrolTotal:sales?.msPetrolTotal || undefined,
      cashPayment: sales?.cashPayment || undefined,
      atmPayment: sales?.atmPayment || undefined,
      paytmPayment: sales?.paytmPayment || undefined,
      fleetPayment: sales?.fleetPayment || undefined,
    },
  });


  const handleSubmit = async (
    values: SalesFormValues,
    close: () => void
  ) => {
    try {
      const url = sales
        ? `/api/sales/${sales.id}`
        : `/api/sales/create`;
      const method = sales ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Something went wrong");
        return;
      }

      toast.success(
        sales
          ? "Sale updated successfully"
          : "Sale recorded successfully"
      );
      close();
      router.refresh();
    } catch (error) {
      console.error("Something went wrong:", error);
      toast.error("Something went wrong while saving sale");
    }
  };


//Fetch Meter-reading
  useEffect(() => {
  const fetchMeterReading = async () => {
    try {
      const res = await fetch("/api/meterreadings");
      const json = await res.json();
      setMeterReading(json.withDifference || []);
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  fetchMeterReading();
  }, []);

//Fetch Oil sale
  useEffect(() => {
  const fetchOilSales = async () => {
    try {
      const res = await fetch("/api/oils");
      const json = await res.json();
      setOilSales(json.oils || []);
    } catch (error) {
      console.error("Failed to fetch oils", error);
    }
  };

  fetchOilSales();
  }, []);

// Watch form values
const selectedDate = form.watch("date");

const atmPayment = form.watch("atmPayment");
const paytmPayment = form.watch("paytmPayment");
const fleetPayment = form.watch("fleetPayment");
const oilT2 = form.watch("oilT2Total");


useEffect(() => {
  if (selectedDate) {
    const formattedDate = new Date(selectedDate).toLocaleDateString();

    // --- Fuel Sales (meter readings) ---
    const matchingReadings = meterReading.filter(
      (reading) =>
        new Date(reading.date).toLocaleDateString() === formattedDate
    );

    const fuelTotal = matchingReadings.reduce(
      (sum, reading) => sum + Number(reading.totalAmount || 0),
      0
    );

    const xgDieselTotal = Number(
      matchingReadings
        .filter((p) => p.fuelType === "XG-DIESEL")
        .reduce((sum, reading) => sum + (reading.totalAmount || 0), 0)
        .toFixed(2)
    );

    const msPetrolTotal = Number(
      matchingReadings
        .filter((p) => p.fuelType === "MS-PETROL")
        .reduce((sum, reading) => sum + (reading.totalAmount || 0), 0)
        .toFixed(2)
    );

    const hsdTotal = Number(
      matchingReadings
        .filter((p) => p.fuelType === "HSD-DIESEL")
        .reduce((sum, reading) => sum + (reading.totalAmount || 0), 0)
        .toFixed(2)
    );

    // --- Oil & Gas Sales ---
    const matchingOils = oilSales.filter(
      (item) => new Date(item.date).toLocaleDateString() === formattedDate
    );

    const oilTotal = matchingOils
      .filter((item) =>
        item.productType?.toLowerCase().includes("oil")
      )
      .reduce((sum, oil) => sum + Number(oil.price || 0), 0);

    const gasTotal = matchingOils
      .filter((item) =>
        item.productType?.toLowerCase().includes("gas")
      )
      .reduce((sum, gas) => sum + Number(gas.price || 0), 0);

    // --- Grand Total ---
    const total = fuelTotal + oilTotal + gasTotal;

    // --- Payments ---
    const totalPayments =
      (Number(atmPayment) || 0) +
      (Number(paytmPayment) || 0) +
      (Number(fleetPayment) || 0);

    const cashPayment = total - totalPayments;

    // --- Auto-fill form fields ---
    form.setValue("rate", total);
    form.setValue("hsdDieselTotal", hsdTotal);
    form.setValue("xgDieselTotal", xgDieselTotal);
    form.setValue("msPetrolTotal", msPetrolTotal);
    form.setValue("oilT2Total", oilTotal);
    form.setValue("gasTotal", gasTotal); // 👈 new
    form.setValue("cashPayment", cashPayment);
  }
}, [
  selectedDate,
  meterReading,
  oilSales,
  atmPayment,
  oilT2,
  paytmPayment,
  fleetPayment,
  form,
]);

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
          {sales ? (
            <Pencil className="size-4 mr-2" />
          ) : (
            <Plus className="size-4 mr-2" />
          )}
          {sales ? "Edit Sale" : "New Sale"}
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>
            {sales ? "Edit Sale" : "Record New Sale"}
          </FormDialogTitle>
          <FormDialogDescription>
            {sales
              ? "Update the existing sale entry"
              : "Enter details for a new fuel sale transaction."}
          </FormDialogDescription>
        </FormDialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
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

          <FormField
            control={form.control}
            name="atmPayment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ATM Payment</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paytmPayment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paytm Payment</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter amount"
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
            name="fleetPayment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fleet Payment</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cashPayment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cash Payment</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    {...field}
                    value={field.value != null ? Number(field.value).toFixed(2) : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />


          <FormField
            control={form.control}
            name="oilT2Total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>2T-OIL</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
            control={form.control}
            name="gasTotal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GAS</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="xgDieselTotal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>XG-DIESEL</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter amount"
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
            name="hsdDieselTotal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>HSD-DIESEL</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>

        <div className="grid grid-cols-2 gap-4">


          <FormField
            control={form.control}
            name="msPetrolTotal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MS-PETROL</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter amount"
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
            name="rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (Rs)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    {...field}
                    value={field.value != null ? Number(field.value).toFixed(2) : ""}
                    readOnly
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
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {sales ? "Update" : "Save"}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}

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
import { Plus, Pencil } from "lucide-react";
import { SalesFormValues, salesSchema } from "@/schemas/sales-schema";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Sales } from "@/types/sales";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useEffect, useState } from "react";
import { parseProducts } from "@/lib/product-utils";
import { BranchSelector } from "@/components/common/branch-selector";


export function SalesFormModal({
  sales,
  open,
  openChange,
  userRole,
  userBranchId,
}: {
  sales?: Sales;
  open?: boolean;
  openChange?: (open: boolean) => void;
  userRole?: string;
  userBranchId?: string;
}) {
  const [meterReading, setMeterReading] = useState<{ 
    totalAmount: number;
    id: string;
    date: Date;
    fuelType:string;
    fuelRate:number;
    sale:number;
  }[]>([]);

  const [oilSales, setOilSales] = useState<{ 
    totalAmount: number;
    id: string;
    date: Date;
    quantity: number;
    price: number;
    productType:string;
  }[]>([]);

  const [selectedBranchId, setSelectedBranchId] = useState<string>(sales?.branchId || userBranchId || "");


  const router = useRouter();

const form = useForm<SalesFormValues>({
  resolver: zodResolver(salesSchema),
  defaultValues: {
    date: sales?.date ? new Date(sales.date) : new Date(),
    rate: sales?.rate ?? undefined,
    products: parseProducts(sales?.products),
    xgDieselTotal: sales?.xgDieselTotal ?? undefined,
    hsdDieselTotal: sales?.hsdDieselTotal ?? undefined,
    msPetrolTotal: sales?.msPetrolTotal ?? undefined,
    cashPayment: sales?.cashPayment ?? undefined,
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
        body: JSON.stringify({
          ...values,
          branchId: selectedBranchId,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        if (error && error.includes("already exists for this date")) {
          toast.error("A sale already exists for this date.");
        } else {
          toast.error(error || "Something went wrong");
        }
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


//Fetch Meter-reading (recent data only)
  useEffect(() => {
  const fetchMeterReading = async () => {
    try {
      // Fetch only recent meter readings (last 7 days)
      const res = await fetch("/api/meterreadings?limit=40");
      const json = await res.json();
      setMeterReading(json.withDifference || []);
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  fetchMeterReading();
  }, []);

  // Fetch meter readings for specific date when needed
  const fetchMeterReadingForDate = async (date: Date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const res = await fetch(`/api/meterreadings?date=${formattedDate}&limit=100`);
      const json = await res.json();
      
      if (json.withDifference && json.withDifference.length > 0) {
        // Merge with existing meter readings, avoiding duplicates
        setMeterReading(prev => {
          const existing = prev.filter(r => r.id !== json.withDifference[0].id);
          return [...existing, ...json.withDifference];
        });
      }
    } catch (error) {
      console.error("Failed to fetch meter readings for date", error);
    }
  };

//Fetch Oil sale (recent data only)
  useEffect(() => {
  const fetchOilSales = async () => {
    try {
      // Fetch only recent oil sales (last 7 days)
      const res = await fetch("/api/oils?limit=40");
      const json = await res.json();
      setOilSales(json.oils || []);
    } catch (error) {
      console.error("Failed to fetch oils", error);
    }
  };

  fetchOilSales();
  }, []);

  // Fetch oil sales for specific date when needed
  const fetchOilSalesForDate = async (date: Date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const res = await fetch(`/api/oils?date=${formattedDate}&limit=100`);
      const json = await res.json();
      
      if (json.oils && json.oils.length > 0) {
        // Merge with existing oil sales, avoiding duplicates
        setOilSales(prev => {
          const existing = prev.filter(o => o.id !== json.oils[0].id);
          return [...existing, ...json.oils];
        });
      }
    } catch (error) {
      console.error("Failed to fetch oil sales for date", error);
    }
  };

// Watch form values
const selectedDate = form.watch("date");

const atmPayment = form.watch("atmPayment");
const paytmPayment = form.watch("paytmPayment");
const fleetPayment = form.watch("fleetPayment");


useEffect(() => {
  if (selectedDate) {
    const formattedDate = new Date(selectedDate).toLocaleDateString();

    // --- Fuel Sales ---
    const matchingReadings = meterReading.filter(
      (reading) =>
        new Date(reading.date).toLocaleDateString() === formattedDate
    );

    // --- Oil & Gas Sales (Dynamic products) ---
    const matchingOils = oilSales.filter(
      (item) =>
        new Date(item.date).toLocaleDateString() === formattedDate
    );

    // If no matching data found, fetch data for this specific date and return early
    if (matchingReadings.length === 0 || matchingOils.length === 0) {
      if (matchingReadings.length === 0) {
        fetchMeterReadingForDate(new Date(selectedDate));
      }
      if (matchingOils.length === 0) {
        fetchOilSalesForDate(new Date(selectedDate));
      }
      return; // Exit early, calculation will happen when data is fetched
    }

    // Calculate fuel totals dynamically based on available fuel types
    const fuelTotals: Record<string, number> = {};
    matchingReadings.forEach((reading) => {
      const fuelType = reading.fuelType;
      if (fuelType) {
        const amount = Math.round((reading.fuelRate || 0) * (reading.sale || 0));
        fuelTotals[fuelType] = (fuelTotals[fuelType] || 0) + amount;
      }
    });

    const fuelTotal = Object.values(fuelTotals).reduce((sum, amount) => sum + amount, 0);
    
    // For backward compatibility, set legacy fields if they exist
    const xgDieselTotal = fuelTotals["XG-DIESEL"] || 0;
    const msPetrolTotal = fuelTotals["MS-PETROL"] || fuelTotals["POWER PETROL"] || 0;
    const hsdTotal = fuelTotals["HSD-DIESEL"] || 0;

    const productsObj: Record<string, number> = {};
    matchingOils.forEach((o) => {
      const key = o.productType?.toUpperCase() || "UNKNOWN";
      const amount = Number(o.price || 0);
      productsObj[key] = (productsObj[key] || 0) + amount;
    });

    form.setValue("products", productsObj);

    // --- Grand Total ---
    const dynamicProductsTotal = Math.round(Object.values(productsObj).reduce(
      (s, n) => s + (Number(n) || 0),
      0
    ));

    const total = fuelTotal + dynamicProductsTotal;
    const roundedTotal = Math.round(total);

    // --- Payments ---
    const totalPayments =
      (Number(atmPayment) || 0) +
      (Number(paytmPayment) || 0) +
      (Number(fleetPayment) || 0);

    const cashPayment = roundedTotal - totalPayments;

    // --- Auto-fill form fields ---
    form.setValue("rate", roundedTotal);
    form.setValue("hsdDieselTotal", Math.round(hsdTotal));
    form.setValue("xgDieselTotal", Math.round(xgDieselTotal));
    form.setValue("msPetrolTotal", Math.round(msPetrolTotal));
    // Save all fuel totals dynamically
    form.setValue("fuelTotals", fuelTotals);
    form.setValue("cashPayment", cashPayment);
  }
}, [
  selectedDate,
  meterReading,
  oilSales,
  atmPayment,
  paytmPayment,
  fleetPayment,
  form,
]);

// Separate useEffect to handle calculation when data is updated
useEffect(() => {
  if (selectedDate && meterReading.length > 0 && oilSales.length > 0) {
    const formattedDate = new Date(selectedDate).toLocaleDateString();

    // --- Fuel Sales ---
    const matchingReadings = meterReading.filter(
      (reading) =>
        new Date(reading.date).toLocaleDateString() === formattedDate
    );

    // --- Oil & Gas Sales (Dynamic products) ---
    const matchingOils = oilSales.filter(
      (item) =>
        new Date(item.date).toLocaleDateString() === formattedDate
    );

    // Only calculate if we have matching data
    if (matchingReadings.length > 0 || matchingOils.length > 0) {
      // Calculate fuel totals dynamically based on available fuel types
      const fuelTotals: Record<string, number> = {};
      matchingReadings.forEach((reading) => {
        const fuelType = reading.fuelType;
        if (fuelType) {
          const amount = Math.round((reading.fuelRate || 0) * (reading.sale || 0));
          fuelTotals[fuelType] = (fuelTotals[fuelType] || 0) + amount;
        }
      });

      const fuelTotal = Object.values(fuelTotals).reduce((sum, amount) => sum + amount, 0);
      
      // For backward compatibility, set legacy fields if they exist
      const xgDieselTotal = fuelTotals["XG-DIESEL"] || 0;
      const msPetrolTotal = fuelTotals["MS-PETROL"] || fuelTotals["POWER PETROL"] || 0;
      const hsdTotal = fuelTotals["HSD-DIESEL"] || 0;

      const productsObj: Record<string, number> = {};
      matchingOils.forEach((o) => {
        const key = o.productType?.toUpperCase() || "UNKNOWN";
        const amount = Number(o.price || 0);
        productsObj[key] = (productsObj[key] || 0) + amount;
      });

      form.setValue("products", productsObj);

      // --- Grand Total ---
      const dynamicProductsTotal = Math.round(Object.values(productsObj).reduce(
        (s, n) => s + (Number(n) || 0),
        0
      ));

      const total = fuelTotal + dynamicProductsTotal;
      const roundedTotal = Math.round(total);

      // --- Payments ---
      const totalPayments =
        (Number(atmPayment) || 0) +
        (Number(paytmPayment) || 0) +
        (Number(fleetPayment) || 0);

      const cashPayment = roundedTotal - totalPayments;

      // --- Auto-fill form fields ---
      form.setValue("rate", roundedTotal);
      form.setValue("hsdDieselTotal", Math.round(hsdTotal));
      form.setValue("xgDieselTotal", Math.round(xgDieselTotal));
      form.setValue("msPetrolTotal", Math.round(msPetrolTotal));
      // Save all fuel totals dynamically
      form.setValue("fuelTotals", fuelTotals);
      form.setValue("cashPayment", cashPayment);
    }
  }
}, [selectedDate, meterReading, oilSales, atmPayment, paytmPayment, fleetPayment, form]);

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

        {/* Branch Selector */}
        <BranchSelector
          value={selectedBranchId}
          onValueChange={setSelectedBranchId}
          userRole={userRole}
          userBranchId={userBranchId}
          isEditMode={!!sales}
        />

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

          {/* Dynamic Oil/Gas products (readonly amounts) */}
          {Array.from(
            new Set(
              oilSales
                .filter(o => new Date(o.date).toLocaleDateString() === new Date(selectedDate).toLocaleDateString())
                .map(o => (o.productType || '').toUpperCase())
            )
          ).map((product) => (
            <FormField
              key={product}
              control={form.control}
              name={`products.${product}` as `products.${string}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{product}</FormLabel>
                  <FormControl>
                    <Input type="number" readOnly value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        {/* Dynamic Fuel Type Fields - Only show if there's data for that fuel type */}
        {(() => {
          // Get unique fuel types from meter readings for the selected date
          const uniqueFuelTypes = Array.from(
            new Set(
              meterReading
                .filter((r) => {
                  const readingDate = new Date(r.date).toLocaleDateString();
                  const formDate = selectedDate ? new Date(selectedDate).toLocaleDateString() : "";
                  return readingDate === formDate && r.fuelType;
                })
                .map((r) => r.fuelType)
                .filter((ft): ft is string => typeof ft === "string")
            )
          );

          // Map fuel types to form field names and labels
          const fuelTypeFields: Array<{ fieldName: keyof SalesFormValues; label: string; fuelType: string }> = [
            { fieldName: "hsdDieselTotal", label: "HSD-DIESEL", fuelType: "HSD-DIESEL" },
            { fieldName: "xgDieselTotal", label: "XG-DIESEL", fuelType: "XG-DIESEL" },
            { fieldName: "msPetrolTotal", label: "MS-PETROL", fuelType: "MS-PETROL" },
            { fieldName: "msPetrolTotal", label: "POWER PETROL", fuelType: "POWER PETROL" },
          ];

          // Filter to only show fields for fuel types that exist in this branch
          const fieldsToShow = fuelTypeFields.filter((field) => uniqueFuelTypes.includes(field.fuelType));

          // For POWER PETROL, we use msPetrolTotal field, so avoid duplicates
          const displayedFuelTypes = new Set<string>();
          const uniqueFieldsToShow = fieldsToShow.filter((field) => {
            if (displayedFuelTypes.has(field.fieldName as string)) {
              return false;
            }
            displayedFuelTypes.add(field.fieldName as string);
            return true;
          });

          if (uniqueFieldsToShow.length === 0) return null;

          return (
            <div className="grid grid-cols-2 gap-4">
              {uniqueFieldsToShow.map((fieldConfig) => (
                <FormField
                  key={fieldConfig.fuelType}
                  control={form.control}
                  name={fieldConfig.fieldName}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{fieldConfig.label}</FormLabel>
                      <FormControl>
                        <Input
                          disabled
                          type="number"
                          placeholder="Enter amount"
                          {...field}
                          value={field.value != null ? String(field.value) : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (Rs)</FormLabel>
                <FormControl>
                  <Input
                    disabled
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

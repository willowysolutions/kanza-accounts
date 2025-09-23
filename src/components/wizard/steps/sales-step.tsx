"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SalesFormValues, salesSchema } from '@/schemas/sales-schema';
import { useWizard } from '../form-wizard';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
// import { parseProducts } from '@/lib/product-utils'; // Unused import removed

export const SalesStep: React.FC<{ branchId?: string }> = ({ branchId }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _branchId = branchId; // For future branch-specific filtering
  const { markStepCompleted, markCurrentStepCompleted, currentStep, setOnSaveAndNext } = useWizard();
  const [meterReading, setMeterReading] = useState<{ 
    totalAmount: number;
    id: string;
    date: Date;
    fuelType: string;
    fuelRate: number;
    sale: number;
  }[]>([]);

  const [oilSales, setOilSales] = useState<{ 
    totalAmount: number;
    id: string;
    date: Date;
    quantity: number;
    price: number;
    productType: string;
  }[]>([]);

  const [savedRecords, setSavedRecords] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesSchema),
    defaultValues: {
      date: new Date(),
      rate: undefined,
      products: {},
      xgDieselTotal: undefined,
      hsdDieselTotal: undefined,
      msPetrolTotal: undefined,
      cashPayment: undefined,
      atmPayment: undefined,
      paytmPayment: undefined,
      fleetPayment: undefined,
    },
  });

  const handleSubmit = useCallback(async (values: SalesFormValues): Promise<boolean> => {
    try {
      const res = await fetch('/api/sales/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Something went wrong");
        return false;
      }

      toast.success("Sale recorded successfully");
      setSavedRecords(prev => prev + 1);
      router.refresh();
      return true;
    } catch (error) {
      console.error("Something went wrong:", error);
      toast.error("Something went wrong while saving sale");
      return false;
    }
  }, [ router]);

  // Fetch Meter-reading
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

  // Fetch Oil sale
  useEffect(() => {
    const fetchOilSales = async () => {
      try {
        const res = await fetch("/api/oils");
        const json = await res.json();
        setOilSales(json.oils || []);
        setIsInitialized(true);
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

  useEffect(() => {
    if (selectedDate) {
      const formattedDate = new Date(selectedDate).toLocaleDateString();

      // --- Fuel Sales ---
      const matchingReadings = meterReading.filter(
        (reading) =>
          new Date(reading.date).toLocaleDateString() === formattedDate
      );

      const xgDieselTotal = matchingReadings
        .filter((p) => p.fuelType === "XG-DIESEL")
        .reduce((sum, r) => sum + (r.fuelRate || 0) * (r.sale || 0), 0);

      const msPetrolTotal = matchingReadings
        .filter((p) => p.fuelType === "MS-PETROL")
        .reduce((sum, r) => sum + (r.fuelRate || 0) * (r.sale || 0), 0);

      const hsdTotal = matchingReadings
        .filter((p) => p.fuelType === "HSD-DIESEL")
        .reduce((sum, r) => sum + (r.fuelRate || 0) * (r.sale || 0), 0);

      const fuelTotal = xgDieselTotal + msPetrolTotal + hsdTotal;

      // --- Oil & Gas Sales (Dynamic products) ---
      const matchingOils = oilSales.filter(
        (item) =>
          new Date(item.date).toLocaleDateString() === formattedDate
      );

      const productsObj: Record<string, number> = {};
      matchingOils.forEach((o) => {
        const key = o.productType?.toUpperCase() || "UNKNOWN";
        const amount = Number(o.price || 0);
        productsObj[key] = (productsObj[key] || 0) + amount;
      });

      form.setValue("products", productsObj);

      // --- Grand Total ---
      const dynamicProductsTotal = Object.values(productsObj).reduce(
        (s, n) => s + (Number(n) || 0),
        0
      );

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

  // Set up the save handler only when initialized - but don't call it
  useEffect(() => {
    if (isInitialized) {
      setOnSaveAndNext(() => async () => {
        if (savedRecords > 0) {
          markStepCompleted(currentStep);
          return true;
        }
        try {
          const values = form.getValues();
          const result = await handleSubmit(values);
          if (result) {
            markStepCompleted(currentStep);
          }
          return result;
        } catch (error) {
          console.error("Error saving sale:", error);
          return false;
        }
      });
    }
  }, [isInitialized, savedRecords, markStepCompleted, currentStep, form, handleSubmit, setOnSaveAndNext]);

  return (
    <FormProvider {...form}>
      <Card>
        <CardHeader>
          <CardTitle>Step 3: Sales Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="xgDieselTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>XG-DIESEL</FormLabel>
                    <FormControl>
                      <Input
                        disabled
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
                        disabled
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
                        disabled
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
          </form>

          {/* Complete Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              type="button" 
              variant="outline"
              onClick={markCurrentStepCompleted}
            >
              Complete
            </Button>
          </div>
        </CardContent>
      </Card>
    </FormProvider>
  );
};

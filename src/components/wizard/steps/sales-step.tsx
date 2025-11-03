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
import { Button } from '@/components/ui/button';
// import { parseProducts } from '@/lib/product-utils'; // Unused import removed

export const SalesStep: React.FC = () => {
  const { markStepCompleted, markCurrentStepCompleted, currentStep, setOnSaveAndNext, commonDate, selectedBranchId } = useWizard();
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
  const [branchFuelProducts, setBranchFuelProducts] = useState<{ productName: string }[]>([]);

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesSchema),
    defaultValues: {
      date: commonDate,
      rate: undefined,
      products: {},
      xgDieselTotal: undefined,
      hsdDieselTotal: undefined,
      msPetrolTotal: undefined,
      powerPetrolTotal: undefined,
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
        body: JSON.stringify({ ...values, branchId: selectedBranchId }),
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
  }, [router, selectedBranchId]);

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

  // Fetch Oil sales
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

  // Fetch branch fuel products (FUEL category products for the selected branch)
  useEffect(() => {
    const fetchBranchFuelProducts = async () => {
      if (!selectedBranchId) {
        setBranchFuelProducts([]);
        return;
      }

      try {
        const res = await fetch("/api/products");
        const json = await res.json();
        
        // Filter: only FUEL category products for the selected branch
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fuelProducts = json.data?.filter((product: any) => {
          return product.productCategory === "FUEL" && product.branchId === selectedBranchId;
        }) || [];
        
        // Get unique product names
        const uniqueFuelProductNames = Array.from(
          new Set(fuelProducts.map((p: { productName: string }) => p.productName))
        ).map((name) => ({ productName: name as string }));
        
        setBranchFuelProducts(uniqueFuelProductNames);
      } catch (error) {
        console.error("Failed to fetch branch fuel products", error);
        setBranchFuelProducts([]);
      }
    };

    fetchBranchFuelProducts();
  }, [selectedBranchId]);

  // Fetch oil sales for specific date when needed
  const fetchOilSalesForDate = async (date: Date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const res = await fetch(`/api/oils?date=${formattedDate}&limit=100`);
      const json = await res.json();
      
      if (json.oils && json.oils.length > 0) {
        // Merge with existing oil sales, avoiding duplicates by filtering out all existing IDs
        setOilSales(prev => {
          const existingIds = new Set(prev.map(o => o.id));
          const newOils = json.oils.filter((oil: { id: string }) => !existingIds.has(oil.id));
          return [...prev, ...newOils];
        });
      }
    } catch (error) {
      console.error("Failed to fetch oil sales for date", error);
    }
  };

  // Initialize when component mounts
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Watch form values
  const selectedDate = form.watch("date");
  const atmPayment = form.watch("atmPayment");
  const paytmPayment = form.watch("paytmPayment");
  const fleetPayment = form.watch("fleetPayment");

  useEffect(() => {
    if (selectedDate) {
      const formattedDate = new Date(selectedDate).toLocaleDateString();
      console.log('Wizard Sales: Selected date:', selectedDate);
      console.log('Wizard Sales: Formatted date:', formattedDate);
      console.log('Wizard Sales: All oil sales:', oilSales);

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

      const productsObj: Record<string, number> = {};
      console.log('Wizard Sales: Matching oils count:', matchingOils.length);
      console.log('Wizard Sales: Matching oils data:', matchingOils);
      
      matchingOils.forEach((o) => {
        const key = o.productType?.toUpperCase() || "UNKNOWN";
        const amount = Number(o.price || 0);
        console.log(`Wizard Sales: Processing ${key}: ${amount} (existing: ${productsObj[key] || 0})`);
        productsObj[key] = (productsObj[key] || 0) + amount;
        console.log(`Wizard Sales: After adding ${key}: ${productsObj[key]}`);
      });
      
      console.log('Wizard Sales: Final products object:', productsObj);


      // If no matching data found, fetch data for this specific date and return early
      if (matchingReadings.length === 0 || matchingOils.length === 0) {
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
      const msPetrolTotal = fuelTotals["MS-PETROL"] || 0;
      const powerPetrolTotal = fuelTotals["POWER PETROL"] || 0;
      const hsdTotal = fuelTotals["HSD-DIESEL"] || 0;

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
      form.setValue("hsdDieselTotal", hsdTotal);
      form.setValue("xgDieselTotal", xgDieselTotal);
      form.setValue("msPetrolTotal", msPetrolTotal);
      form.setValue("powerPetrolTotal", powerPetrolTotal);
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
                    <FormControl>
                      <Button 
                        variant="outline" 
                        disabled
                        className="w-full text-left bg-muted cursor-not-allowed"
                      >
                        {field.value
                          ? new Date(field.value).toLocaleDateString()
                          : "Pick date"}
                      </Button>
                    </FormControl>
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

            {/* Dynamic Fuel Type Fields - Show fields based on branch's fuel products from Product table */}
            {(() => {
              // Use branch fuel products from Product table (FUEL category products)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const branchFuelProductNames = branchFuelProducts.map((p: any) => p.productName);
              
              // Map fuel product names to form field names and labels
              const fuelProductToFieldMap: Record<string, { fieldName: keyof SalesFormValues; label: string }> = {
                "HSD-DIESEL": { fieldName: "hsdDieselTotal", label: "HSD-DIESEL" },
                "XG-DIESEL": { fieldName: "xgDieselTotal", label: "XG-DIESEL" },
                "MS-PETROL": { fieldName: "msPetrolTotal", label: "MS-PETROL" },
                "POWER PETROL": { fieldName: "powerPetrolTotal", label: "POWER PETROL" },
                "XP 95 PETROL": { fieldName: "powerPetrolTotal", label: "XP 95 PETROL" }, // Map XP 95 PETROL to powerPetrolTotal
              };

              // Create fields for each branch fuel product
              const fieldsToShow = branchFuelProductNames
                .map((productName: string) => {
                  const mapping = fuelProductToFieldMap[productName.toUpperCase()];
                  if (!mapping) {
                    // If product doesn't have a mapping, skip it
                    return null;
                  }
                  return {
                    fieldName: mapping.fieldName,
                    label: productName,
                    productName: productName,
                  };
                })
                .filter((field): field is { fieldName: keyof SalesFormValues; label: string; productName: string } => field !== null)
                // Deduplicate by fieldName (in case multiple products map to same field)
                .filter((field, index, self) => 
                  index === self.findIndex(f => f.fieldName === field.fieldName)
                );

              if (fieldsToShow.length === 0) return null;

              // Split fields into groups of 2 for grid layout
              const fieldGroups: Array<Array<{ fieldName: keyof SalesFormValues; label: string; productName: string }>> = [];
              for (let i = 0; i < fieldsToShow.length; i += 2) {
                fieldGroups.push(fieldsToShow.slice(i, i + 2));
              }

              return (
                <>
                  {fieldGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="grid grid-cols-2 gap-4">
                      {group.map((fieldConfig) => (
                        <FormField
                          key={fieldConfig.productName}
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
                  ))}
                </>
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

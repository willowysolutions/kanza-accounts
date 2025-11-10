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
  // Removed local meterReading state – we use freshly fetched data directly

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
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

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

  // Helper function to safely convert to number, defaulting to 0 if invalid
  const safeNumber = (val: unknown): number => {
    if (val === null || val === undefined || val === "") return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // Helper function to safely convert to number or null for optional fields
  const safeNumberOrNull = (val: unknown): number | null => {
    if (val === null || val === undefined || val === "") return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  const handleSubmit = useCallback(async (values: SalesFormValues): Promise<boolean> => {
    try {
      // Convert ALL values to numbers before sending - ensure no NaN values
      const payload = {
        ...values,
        branchId: selectedBranchId,
        // Convert all payment fields to numbers
        cashPayment: safeNumber(values.cashPayment),
        atmPayment: safeNumberOrNull(values.atmPayment),
        paytmPayment: safeNumberOrNull(values.paytmPayment),
        fleetPayment: safeNumberOrNull(values.fleetPayment),
        rate: safeNumber(values.rate),
        // Convert legacy fuel total fields
        xgDieselTotal: values.xgDieselTotal !== undefined ? safeNumber(values.xgDieselTotal) : undefined,
        hsdDieselTotal: values.hsdDieselTotal !== undefined ? safeNumber(values.hsdDieselTotal) : undefined,
        msPetrolTotal: values.msPetrolTotal !== undefined ? safeNumber(values.msPetrolTotal) : undefined,
        powerPetrolTotal: values.powerPetrolTotal !== undefined ? safeNumber(values.powerPetrolTotal) : undefined,
        // Convert products object - ensure all values are numbers
        products: values.products ? Object.fromEntries(
          Object.entries(values.products).map(([key, val]) => [key, safeNumber(val)])
        ) : {},
        // Convert fuelTotals object - ensure all values are numbers
        fuelTotals: values.fuelTotals ? Object.fromEntries(
          Object.entries(values.fuelTotals).map(([key, val]) => [key, safeNumber(val)])
        ) : undefined,
      };
      
      const res = await fetch('/api/sales/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  // Recent meter readings fetch removed – not needed

  // Fetch Oil sales (recent)
  useEffect(() => {
    const fetchOilSales = async () => {
      try {
        const res = await fetch("/api/oils?limit=40");
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

  // Fetch meter readings for specific date and branch
  const fetchMeterReadingForDate = async (date: Date, branchId?: string) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const url = new URL('/api/meterreadings', window.location.origin);
      url.searchParams.set('date', formattedDate);
      if (branchId) url.searchParams.set('branchId', branchId);
      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.withDifference && json.withDifference.length > 0) {
        return json.withDifference;
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch meter readings for date", error);
      return [];
    }
  };

  // Fetch oil sales for specific date and branch when needed
  const fetchOilSalesForDate = async (date: Date, branchId?: string) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const url = new URL('/api/oils', window.location.origin);
      url.searchParams.set('date', formattedDate);
      if (branchId) url.searchParams.set('branchId', branchId);
      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.oils && json.oils.length > 0) {
        setOilSales(prev => {
          const filtered = prev.filter((o) => {
            const oDate = new Date(o.date).toISOString().split('T')[0];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const oBranchId = (o as any).branchId as string | undefined;
            return !(oDate === formattedDate && oBranchId === branchId);
          });
          return [...filtered, ...json.oils];
        });
        return json.oils;
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch oil sales for date", error);
      return [];
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
    if (selectedDate && selectedBranchId) {
      setIsDataReady(false);
      setIsLoadingData(true);

      const promises = [
        fetchMeterReadingForDate(new Date(selectedDate), selectedBranchId),
        fetchOilSalesForDate(new Date(selectedDate), selectedBranchId),
      ] as const;

      Promise.all(promises)
        .then(([readings, oils]) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fetchedReadings = readings as any[];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fetchedOils = oils as any[];

          const fuelTotals: Record<string, number> = {};
          fetchedReadings.forEach((reading) => {
            const fuelType = reading.fuelType;
            if (fuelType) {
              const amount = reading.totalAmount
                ? Math.round(reading.totalAmount)
                : reading.sale
                  ? Math.round((reading.fuelRate || 0) * (reading.sale || 0))
                  : reading.difference
                    ? Math.round((reading.fuelRate || 0) * (reading.difference || 0))
                    : 0;
              fuelTotals[fuelType] = (fuelTotals[fuelType] || 0) + amount;
            }
          });

          // Ensure all branch fuel types are in fuelTotals, even if 0
          // Get all fuel product names for this branch
          const branchFuelProductNames = branchFuelProducts.map((p: { productName: string }) => p.productName.toUpperCase());
          branchFuelProductNames.forEach((productName: string) => {
            if (!fuelTotals[productName] && fuelTotals[productName] !== 0) {
              fuelTotals[productName] = 0;
            }
          });

          const fuelTotal = Object.values(fuelTotals).reduce((sum, amount) => sum + amount, 0);
          // Explicitly set to 0 if undefined to ensure 0 values are saved
          const xgDieselTotal = fuelTotals["XG-DIESEL"] ?? 0;
          const msPetrolTotal = fuelTotals["MS-PETROL"] ?? 0;
          const powerPetrolTotal = fuelTotals["POWER PETROL"] ?? 0;
          const hsdTotal = fuelTotals["HSD-DIESEL"] ?? 0;

          const productsObj: Record<string, number> = {};
          fetchedOils.forEach((o) => {
            const key = o.productType?.toUpperCase() || "UNKNOWN";
            const amount = Number(o.price || 0);
            productsObj[key] = (productsObj[key] || 0) + amount;
          });

          // Ensure all values are valid numbers (no NaN)
          const cleanedProductsObj: Record<string, number> = {};
          Object.entries(productsObj).forEach(([key, val]) => {
            const num = Number(val);
            cleanedProductsObj[key] = isNaN(num) ? 0 : num;
          });

          form.setValue("products", cleanedProductsObj);

          const dynamicProductsTotal = Math.round(
            Object.values(productsObj).reduce((s, n) => s + (Number(n) || 0), 0)
          );
          const total = fuelTotal + dynamicProductsTotal;
          const roundedTotal = Math.round(total);

          const totalPayments =
            (Number(atmPayment) || 0) +
            (Number(paytmPayment) || 0) +
            (Number(fleetPayment) || 0);
          const cashPayment = roundedTotal - totalPayments;

          // Explicitly set all fuel totals, including 0 values - ensure all are numbers
          form.setValue("rate", Number(roundedTotal) || 0);
          form.setValue("hsdDieselTotal", Number(Math.round(hsdTotal)) || 0);
          form.setValue("xgDieselTotal", Number(Math.round(xgDieselTotal)) || 0);
          form.setValue("msPetrolTotal", Number(Math.round(msPetrolTotal)) || 0);
          form.setValue("powerPetrolTotal", Number(Math.round(powerPetrolTotal)) || 0);
          // Ensure fuelTotals has all numeric values
          const cleanedFuelTotals: Record<string, number> = {};
          Object.entries(fuelTotals).forEach(([key, val]) => {
            const num = Number(val);
            cleanedFuelTotals[key] = isNaN(num) ? 0 : num;
          });
          form.setValue("fuelTotals", cleanedFuelTotals);
          form.setValue("cashPayment", Number(cashPayment) || 0);
          
          // Ensure all fuel totals are explicitly set to 0 if they don't exist
          // This ensures 0 values are properly tracked by the form
          if (branchFuelProducts.length > 0) {
            const fuelProductToFieldMap: Record<string, keyof SalesFormValues> = {
              "HSD-DIESEL": "hsdDieselTotal",
              "XG-DIESEL": "xgDieselTotal",
              "MS-PETROL": "msPetrolTotal",
              "POWER PETROL": "powerPetrolTotal",
            };
            
            branchFuelProducts.forEach((p: { productName: string }) => {
              const productName = p.productName.toUpperCase();
              const fieldName = fuelProductToFieldMap[productName];
              if (fieldName && fuelTotals[productName] === undefined) {
                form.setValue(fieldName, Number(0));
              }
            });
          }

          setIsDataReady(true);
          setIsLoadingData(false);
        })
        .catch((error) => {
          console.error("Wizard SalesStep error fetching data:", error);
          setIsLoadingData(false);
        });
    }
  }, [selectedDate, selectedBranchId, atmPayment, paytmPayment, fleetPayment, form, branchFuelProducts]);

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
                        value={field.value != null ? Number(field.value) : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? undefined : Number(val));
                        }}
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
                        value={field.value != null ? Number(field.value) : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? undefined : Number(val));
                        }}
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
                        value={field.value != null ? Number(field.value) : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? undefined : Number(val));
                        }}
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
                                  value={field.value != null ? Number(field.value) : ""}
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
              disabled={isLoadingData || !isDataReady}
            >
              {isLoadingData ? 'Loading...' : 'Complete'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </FormProvider>
  );
};

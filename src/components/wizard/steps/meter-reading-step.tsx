"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bulkSchema } from '@/schemas/bulk-schema';
import { z } from 'zod';
import { useWizard } from '../form-wizard';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ProductType } from '@/types/product';
// import { Loader2 } from 'lucide-react'; // Unused import removed

type MachineWithNozzles = {
  id: string;
  machineName: string;
  branchId: string | null;
  nozzles: {
    id: string;
    nozzleNumber: string;
    openingReading: number;  
    fuelType: string;
  }[];
};

type BulkForm = z.infer<typeof bulkSchema>;

export const MeterReadingStep: React.FC<{ branchId?: string }> = ({ branchId }) => {
  const { markStepCompleted, markCurrentStepCompleted, currentStep, setOnSaveAndNext, setIsStepDisabled } = useWizard();
  const [machines, setMachines] = useState<MachineWithNozzles[]>([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tankLevels, setTankLevels] = useState<Record<string, { currentLevel: number; tankName: string; fuelType: string }>>({});
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  const router = useRouter();

  const { commonDate } = useWizard();

  const form = useForm<BulkForm>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      date: commonDate,
      rows: [],
    },
  });

  const nozzleMap = useMemo(() => {
    const m = new Map<string, { fuelType: string }>();
    machines.forEach((mach) =>
      mach.nozzles.forEach((n) => m.set(n.id, { fuelType: n.fuelType }))
    );
    return m;
  }, [machines]);

  // Function to validate tank level
  const validateTankLevel = useCallback((nozzleId: string, closingValue: number, openingValue: number) => {
    const tankInfo = tankLevels[nozzleId];
    
    if (!tankInfo) {
      return {
        isValid: false,
        message: "insufficient level"
      };
    }

    const difference = closingValue - openingValue;
    if (difference < 0) return null; // Invalid reading (closing < opening)

    const remainingLevel = tankInfo.currentLevel - difference;
    
    if (remainingLevel < 0) {
      return {
        isValid: false,
        message: "insufficient level"
      };
    }

  }, [tankLevels]);

  // Function to check stock availability for each product type
  const validateStockAvailability = useCallback(() => {
    const rows = form.getValues('rows');
    const stockIssues: { fuelType: string; totalSale: number; availableStock: number }[] = [];

    // Calculate total sales by fuel type
    const salesByFuelType = new Map<string, number>();
    rows.forEach(row => {
      if (row.sale && row.fuelType) {
        const currentSale = salesByFuelType.get(row.fuelType) || 0;
        salesByFuelType.set(row.fuelType, currentSale + row.sale);
      }
    });

    // Check stock for each fuel type
    salesByFuelType.forEach((totalSale, fuelType) => {
      // Find the tank level for this fuel type
      const tankInfo = Object.values(tankLevels).find(tank => tank.fuelType === fuelType);
      if (tankInfo) {
        if (totalSale > tankInfo.currentLevel) {
          stockIssues.push({
            fuelType,
            totalSale,
            availableStock: tankInfo.currentLevel
          });
        }
      }
    });

    return stockIssues;
  }, [form, tankLevels]);

  // Function to check if there are any validation errors
  const checkValidationErrors = useCallback(() => {
    const rows = form.getValues('rows');
    let hasErrors = false;

    // Check individual tank level validation
    for (const row of rows) {
      if (row.closing != null && row.opening != null) {
        const validation = validateTankLevel(row.nozzleId, row.closing, row.opening);
        if (validation && !validation.isValid) {
          hasErrors = true;
          break;
        }
      }
    }

    // Check stock availability validation
    if (!hasErrors) {
      const stockIssues = validateStockAvailability();
      if (stockIssues.length > 0) {
        hasErrors = true;
      }
    }

    setHasValidationErrors(hasErrors);
    setIsStepDisabled(hasErrors);
  }, [form, validateTankLevel, validateStockAvailability, setIsStepDisabled]);

  // Load data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch machines and tank levels in parallel
        const machinesUrl = branchId ? `/api/machines/with-nozzles?branchId=${branchId}` : '/api/machines/with-nozzles';
        const tankLevelsUrl = branchId ? `/api/tanks/current-levels?branchId=${branchId}` : '/api/tanks/current-levels';
        const [machinesRes, tankLevelsRes] = await Promise.all([
          fetch(machinesUrl),
          fetch(tankLevelsUrl)
        ]);

        const machinesJson = await machinesRes.json();
        const tankLevelsJson = await tankLevelsRes.json();

        const data: MachineWithNozzles[] = machinesJson.data ?? [];
        setMachines(data);
        setTankLevels(tankLevelsJson.data ?? {});

        // Create a map of branch-specific fuel rates
        const branchPriceMap = new Map<string, Map<string, number>>();
        products.forEach(p => {
          if (p.branchId) {
            if (!branchPriceMap.has(p.branchId)) {
              branchPriceMap.set(p.branchId, new Map());
            }
            branchPriceMap.get(p.branchId)!.set(p.productName, p.sellingPrice);
          }
        });

        const rows: BulkForm['rows'] = data.flatMap((m) =>
          m.nozzles.map((n) => {
            const opening = n.openingReading;   
            // Get fuel rate for the specific branch
            const branchPrices = m.branchId ? branchPriceMap.get(m.branchId) : null;
            const fuelRate = branchPrices?.get(n.fuelType) ?? undefined;

            return {
              nozzleId: n.id,
              fuelType: n.fuelType,
              opening,           
              closing: undefined, 
              fuelRate,
              quantity: undefined,
              totalAmount: undefined,
            };
          })
        );      

        form.reset({ 
          date: commonDate, 
          rows 
        });
        setIsInitialized(true);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load machines/nozzles');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [products, form, branchId, commonDate]);

  // Fetch products
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

  const rows = form.watch('rows');

  const getRowIndex = (nozzleId: string) =>
    rows.findIndex((r) => r.nozzleId === nozzleId);

  // Watch for changes in rows and check validation
  useEffect(() => {
    if (isInitialized) {
      checkValidationErrors();
    }
  }, [rows, isInitialized, checkValidationErrors]);

  // Submit function
  const submit = useCallback(async (values: BulkForm): Promise<boolean> => {
    try {
      // Check for validation errors before submitting
      if (hasValidationErrors) {
        const stockIssues = validateStockAvailability();
        if (stockIssues.length > 0) {
          const fuelTypes = stockIssues.map(issue => issue.fuelType).join(', ');
          toast.error(`Cannot save: Insufficient stock for ${fuelTypes}. Please adjust your closing readings.`);
        } else {
          toast.error("Cannot save with insufficient stock levels. Please check your closing readings.");
        }
        return false;
      }

      // ensure closing >= opening before saving
      const items = values.rows.map((r) => {
        const fuelType = nozzleMap.get(r.nozzleId)?.fuelType;
        const opening = typeof r.opening === "number" ? r.opening : null;
        let closing = typeof r.closing === "number" ? r.closing : null;

        // if closing is empty, set it to opening
        if (closing === null && opening !== null) {
          closing = opening;
        }

        // enforce rule only at save time
        if (closing !== null && opening !== null && closing < opening) {
          closing = opening;
        }

        const sale =
          opening !== null && closing !== null ? closing - opening : null;
        const totalAmount =
          sale !== null && r.fuelRate
            ? Number((sale * r.fuelRate).toFixed(2))
            : null;

        return {
          nozzleId: r.nozzleId,
          fuelType,
          date: values.date,
          openingReading: opening,
          closingReading: closing,
          fuelRate: typeof r.fuelRate === "number" ? r.fuelRate : null,
          sale,
          totalAmount,
        };
      });

      // Make sure at least one row has a value
      const hasAnyReading = items.some(
        (item) => item.openingReading !== null || item.closingReading !== null
      );
      if (!hasAnyReading) {
        toast.error("Enter at least one opening or closing reading.");
        return false;
      }

      const res = await fetch("/api/meterreadings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error ?? "Failed to save meter readings");
        return false;
      }

      toast.success("Meter readings recorded");
      markStepCompleted(currentStep);
      router.refresh();
      return true;
    } catch (e) {
      console.error(e);
      toast.error("Unexpected error");
      return false;
    }
  }, [nozzleMap, markStepCompleted, currentStep, router, hasValidationErrors, validateStockAvailability]);

  // Set up the save handler only when initialized - but don't call it
  useEffect(() => {
    if (isInitialized) {
      setOnSaveAndNext(() => async () => {
        try {
          const values = form.getValues();
          const result = await submit(values);
          return result;
        } catch (error) {
          console.error("Error saving meter reading:", error);
          return false;
        }
      });
    }
  }, [isInitialized, form, submit, setOnSaveAndNext]);
  
  return (
    <FormProvider {...form}>
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Meter Reading Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="flex h-full flex-col">
            {/* Global controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="w-full text-left font-normal">
                            {field.value
                              ? new Date(field.value).toLocaleDateString("en-EG") 
                              : "Pick date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="p-0">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(val) => field.onChange(val ?? new Date())}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Machines & nozzles */}
            <div className="mt-6 space-y-6">
              {loading && (
                <div className="text-sm text-muted-foreground">Loading…</div>
              )}
              {machines.map((machine) => (
                <div key={machine.id} className="rounded-2xl border p-4">
                  <div className="mb-3 text-base font-semibold">
                    {machine.machineName}
                  </div>

                  <div className="hidden sm:grid sm:grid-cols-20 gap-1 px-2 text-xs text-muted-foreground">
                    <div className="col-span-4">Nozzle</div>
                    <div className="col-span-2 text-right">Fuel</div>
                    <div className="col-span-3 text-right">Opening</div>
                    <div className="col-span-3 text-right">Closing</div>
                    <div className="col-span-2 text-right">Sale</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-4 text-right">Total</div>
                  </div>

                  {machine.nozzles.map((n) => {
                    const idx = getRowIndex(n.id);

                    return (
                      <div
                        key={n.id}
                        className="grid grid-cols-2 sm:grid-cols-20 gap-1 items-center px-2 py-2"
                      >
                        <div className="col-span-2 sm:col-span-4 font-medium">
                          <div className="font-medium">{n.nozzleNumber}</div>
                        </div>

                        <div className="hidden sm:block sm:col-span-2 text-right text-sm">
                          {n.fuelType}
                        </div>

                        {/* Opening */}
                        <div className="col-span-1 sm:col-span-3">
                          <FormField
                            control={form.control}
                            name={`rows.${idx}.opening`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    disabled
                                    type="number"
                                    placeholder="opening"
                                    value={field.value ?? ""}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value === "" ? undefined : Number(e.target.value)
                                      )
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Closing */}
                        <div className="col-span-1 sm:col-span-3">
                          <FormField
                            control={form.control}
                            name={`rows.${idx}.closing`}
                            render={({ field }) => {
                              const openingValue = form.getValues(`rows.${idx}.opening`);
                              const closingValue = field.value;
                              const validation = closingValue != null && openingValue != null 
                                ? validateTankLevel(n.id, closingValue, openingValue) 
                                : null;

                              return (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="closing"
                                      value={field.value ?? ""}
                                      className={validation && !validation.isValid ? "border-red-500" : ""}
                                      onChange={(e) => {
                                        const newClosingValue = e.target.value === "" ? undefined : Number(e.target.value);
                                        
                                        field.onChange(newClosingValue);
                                        
                                        const openingValue = form.getValues(`rows.${idx}.opening`);
                                        const fuelRate = form.getValues(`rows.${idx}.fuelRate`);
                                        
                                        if (openingValue != null && newClosingValue != null) {
                                          const sale = newClosingValue - openingValue;
                                          form.setValue(`rows.${idx}.sale`, sale);
                                        
                                          if (fuelRate != null) {
                                            const amount = sale * fuelRate;
                                            form.setValue(`rows.${idx}.totalAmount`, amount);
                                          } else {
                                            form.setValue(`rows.${idx}.totalAmount`, undefined);
                                          }
                                        } else {
                                          form.setValue(`rows.${idx}.sale`, undefined);
                                          form.setValue(`rows.${idx}.totalAmount`, undefined);
                                        }
                                        
                                        // Trigger validation check immediately
                                        setTimeout(() => checkValidationErrors(), 0);
                                      }}
                                    />
                                  </FormControl>
                                  {validation && (
                                    <div className={`text-xs mt-1 ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                                      {validation.message}
                                    </div>
                                  )}
                                </FormItem>
                              );
                            }}
                          />
                        </div>

                        {/* Sale */}
                        <div className="col-span-1 sm:col-span-2">
                          <FormField
                            control={form.control}
                            name={`rows.${idx}.sale`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    disabled
                                    type="number"
                                    placeholder="sale"
                                    value={field.value != null ? Number(field.value).toFixed(2) : ""}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value === "" ? undefined : Number(e.target.value)
                                      )
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Price */}
                        <div className="col-span-1 sm:col-span-2">
                          <FormField
                            control={form.control}
                            name={`rows.${idx}.fuelRate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    disabled
                                    type="number"
                                    placeholder="price/unit"
                                    value={field.value ?? ""}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value === "" ? undefined : Number(e.target.value)
                                      )
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Total */}
                        <div className="col-span-1 sm:col-span-4">
                          <FormField
                            control={form.control}
                            name={`rows.${idx}.totalAmount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="total amount"
                                    value={field.value != null ? Number(field.value).toFixed(2) : ""}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value === "" ? undefined : Number(e.target.value)
                                      )
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="flex justify-end pr-4 gap-10">
              {/* HSD-DIESEL */}
              <div className="text-right space-y-1">
                <div className="text-muted-foreground text-sm">HSD-DIESEL:</div>
                <div className="text-base text-gray-600">
                  Sale:{" "}
                  {(form.watch("rows") ?? [])
                  .filter((r) => r.fuelType === "HSD-DIESEL")
                  .map((r) => r.sale ?? 0)
                  .reduce((sum, item) => sum + Number(item || 0), 0).toFixed(2)}{" "}
                  L
                </div>
                <div className="text-xl font-semibold text-blue-900">
                  ₹{" "}
                  {Math.round(
                    (form.watch("rows") ?? [])
                    .filter((r) => r.fuelType === "HSD-DIESEL")
                    .map((r) => r.totalAmount ?? 0)
                    .reduce((sum, item) => sum + Number(item || 0), 0)
                  ).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
              </div>

              {/* XG-DIESEL */}
              <div className="text-right space-y-1">
                <div className="text-muted-foreground text-sm">XG-DIESEL:</div>
                <div className="text-base text-gray-600">
                  Sale:{" "}
                  {(form.watch("rows") ?? [])
                        .filter((r) => r.fuelType === "XG-DIESEL")
                  .map((r) => r.sale ?? 0)
                  .reduce((sum, item) => sum + Number(item || 0), 0).toFixed(2)}{" "}
                  L
                </div>
                <div className="text-xl font-semibold text-blue-700">
                  ₹{" "}
                  {Math.round(
                    (form.watch("rows") ?? [])
                    .filter((r) => r.fuelType === "XG-DIESEL")
                    .map((r) => r.totalAmount ?? 0)
                    .reduce((sum, item) => sum + Number(item || 0), 0)
                  ).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
              </div>

              {/* MS-PETROL */}
              <div className="text-right space-y-1">
                <div className="text-muted-foreground text-sm">MS-PETROL:</div>
                <div className="text-base text-gray-600">
                  Sale:{" "}
                  {(form.watch("rows") ?? [])
                  .filter((r) => r.fuelType === "MS-PETROL")
                  .map((r) => r.sale ?? 0)
                  .reduce((sum, item) => sum + Number(item || 0), 0).toFixed(2)}{" "}
                  L
                </div>
                <div className="text-xl font-semibold text-green-900">
                  ₹{" "}
                  {Math.round(
                    (form.watch("rows") ?? [])
                    .filter((r) => r.fuelType === "MS-PETROL")
                    .map((r) => r.totalAmount ?? 0)
                    .reduce((sum, item) => sum + Number(item || 0), 0)
                  ).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
              </div>

              {/* Grand Total */}
              <div className="text-right space-y-1">
                <div className="text-muted-foreground text-sm">Total Sale:</div>
                <div className="text-base font-medium">
                  {(form.watch("rows") ?? [])
                    .filter(
                      (r) =>
                        typeof r.fuelType === "string" &&
                        ["HSD-DIESEL", "XG-DIESEL", "MS-PETROL"].includes(r.fuelType)
                    )
                    .map((r) => r.sale ?? 0)
                    .reduce((sum, item) => sum + Number(item || 0), 0)
                    .toFixed(2)}{" "}
                  L
                </div>
                <div className="text-xl font-semibold">
                  ₹{" "}
                  {Math.round(
                    Math.round(
                      (form.watch("rows") ?? [])
                        .filter((r) => r.fuelType === "HSD-DIESEL")
                    .map((r) => r.totalAmount ?? 0)
                    .reduce((sum, item) => sum + Number(item || 0), 0)
                    ) +
                    Math.round(
                      (form.watch("rows") ?? [])
                    .filter((r) => r.fuelType === "XG-DIESEL")
                    .map((r) => r.totalAmount ?? 0)
                    .reduce((sum, item) => sum + Number(item || 0), 0)
                    ) +
                    Math.round(
                      (form.watch("rows") ?? [])
                    .filter((r) => r.fuelType === "MS-PETROL")
                    .map((r) => r.totalAmount ?? 0)
                    .reduce((sum, item) => sum + Number(item || 0), 0)
                    )
                  ).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>

            {/* Stock Validation Messages */}
            {(() => {
              const stockIssues = validateStockAvailability();
              if (stockIssues.length > 0) {
                return (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-red-800 font-semibold mb-2">⚠️ Insufficient Stock</h4>
                    <div className="space-y-1">
                      {stockIssues.map((issue, index) => (
                        <div key={index} className="text-red-700 text-sm">
                          <strong>{issue.fuelType}:</strong> Total sale ({issue.totalSale.toFixed(2)}L) exceeds available stock ({issue.availableStock.toFixed(2)}L)
                        </div>
                      ))}
                    </div>
                    <div className="text-red-600 text-xs mt-2">
                      Please adjust your closing readings to match available stock levels.
                    </div>
                  </div>
                );
              }
              return null;
            })()}
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

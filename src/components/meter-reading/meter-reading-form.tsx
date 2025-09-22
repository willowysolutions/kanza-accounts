'use client';

import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { bulkSchema } from '@/schemas/bulk-schema';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ProductType } from '@/types/product';
import { Card } from '../ui/card';
import { MeterReading } from '@/types/meter-reading';
import { Loader2 } from "lucide-react";


type MachineWithNozzles = {
  id: string;
  machineName: string;
  nozzles: {
    id: string;
    nozzleNumber: string;
    openingReading: number;  
    fuelType: string;
  }[];
};


type BulkForm = z.infer<typeof bulkSchema>;

export function MeterReadingFormSheet({
  meterReading,
  open,
  openChange,
}: {
  meterReading? : MeterReading;
  open?: boolean;
  openChange?: (open: boolean) => void;
}) {
  const isControlled = typeof open === "boolean";
  const [machines, setMachines] = useState<MachineWithNozzles[]>([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [tankLevels, setTankLevels] = useState<Record<string, { currentLevel: number; tankName: string; fuelType: string }>>({});

  const form = useForm<BulkForm>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      date: meterReading?.date || new Date(),
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
  const validateTankLevel = (nozzleId: string, closingValue: number, openingValue: number) => {
    const tankInfo = tankLevels[nozzleId];
    if (!tankInfo) return {
      isValid: false,
      message: "insufficient level"
    };

    const difference = closingValue - openingValue;
    if (difference < 0) return null; // Invalid reading (closing < opening)

    const remainingLevel = tankInfo.currentLevel - difference;
    if (remainingLevel < 0) {
      return {
        isValid: false,
        message: "insufficient level"
      };
    }

  };

useEffect(() => {
  const load = async () => {
    setLoading(true);
    try {
      // Fetch machines and tank levels in parallel
      const [machinesRes, tankLevelsRes] = await Promise.all([
        fetch('/api/machines/with-nozzles'),
        fetch('/api/tanks/current-levels')
      ]);

      const machinesJson = await machinesRes.json();
      const tankLevelsJson = await tankLevelsRes.json();

      const data: MachineWithNozzles[] = machinesJson.data ?? [];
      setMachines(data);
      setTankLevels(tankLevelsJson.data ?? {});

      const priceMap = new Map(
        products.map(p => [p.productName, p.sellingPrice])
      );

      const rows: BulkForm['rows'] = data.flatMap((m) =>
        m.nozzles.map((n) => {
          const opening = n.openingReading;   
          const fuelRate = priceMap.get(n.fuelType) ?? undefined;

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
        date: new Date(), 
        rows 
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to load machines/nozzles');
    } finally {
      setLoading(false);
    }
  };

  load();
}, [products, form]);

  const rows = form.watch('rows');

  const getRowIndex = (nozzleId: string) =>
    rows.findIndex((r) => r.nozzleId === nozzleId);

  //submit
  const submit = async (values: BulkForm) => {
  try {
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
      return;
    }

    const res = await fetch("/api/meterreadings/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error ?? "Failed to save meter readings");
      return;
    }

    toast.success("Meter readings recorded");
    if (isControlled) {
      openChange?.(false);
    }
  } catch (e) {
    console.error(e);
    toast.error("Unexpected error");
  }
};


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
  

return (
    <Sheet open={open} onOpenChange={openChange}>
      {!isControlled && (
      <SheetTrigger asChild>
        <Button>
          <Plus className="size-4 mr-2" />
          Record Readings
        </Button>
      </SheetTrigger>
      )}
      <SheetContent side="top" className="w-full overflow-y-scroll max-h-screen p-5">
        <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit((vals) => submit(vals))}
          className="flex h-full flex-col"
        >
          <SheetHeader className="mb-4">
            <SheetTitle>Record Meter Readings</SheetTitle>
            <SheetDescription>
              Enter opening/closing for all available nozzles.
            </SheetDescription>
          </SheetHeader>

          {/* Body */}
          <Card className="flex-1 overflow-auto pr-2 p-5">
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
                              ? new Date(field.value).toLocaleDateString()
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
                                        const newClosingValue =
                                          e.target.value === ""
                                            ? undefined
                                            : Number(e.target.value);

                                        field.onChange(newClosingValue);

                                        const openingValue = form.getValues(`rows.${idx}.opening`);
                                        const fuelRate = form.getValues(`rows.${idx}.fuelRate`);

                                        if (openingValue != null && newClosingValue != null) {
                                          // calculate sale
                                          const sale = newClosingValue - openingValue;
                                          form.setValue(`rows.${idx}.sale`, sale);

                                          // calculate total amount
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
          <div className="flex justify-end pr-4 gap-10">
            {/* HSD-DIESEL */}
            <div className="text-right space-y-1">
              <div className="text-muted-foreground text-sm">HSD-DIESEL:</div>
              <div className="text-base text-gray-600">
                Sale:{" "}
                {(form.watch("rows") ?? [])
                  .filter(r => r.fuelType === "HSD-DIESEL")
                  .map(r => r.sale ?? 0)
                  .reduce((sum, item) => sum + Number(item || 0), 0).toFixed(2)}{" "}
                L
              </div>
              <div className="text-xl font-semibold text-blue-900">
                ₹{" "}
                {Math.round(
                  (form.watch("rows") ?? [])
                    .filter(r => r.fuelType === "HSD-DIESEL")
                    .map(r => r.totalAmount ?? 0)
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
                  .filter(r => r.fuelType === "XG-DIESEL")
                  .map(r => r.sale ?? 0)
                  .reduce((sum, item) => sum + Number(item || 0), 0).toFixed(2)}{" "}
                L
              </div>
              <div className="text-xl font-semibold text-blue-700">
                ₹{" "}
                {Math.round(
                  (form.watch("rows") ?? [])
                    .filter(r => r.fuelType === "XG-DIESEL")
                    .map(r => r.totalAmount ?? 0)
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
                  .filter(r => r.fuelType === "MS-PETROL")
                  .map(r => r.sale ?? 0)
                  .reduce((sum, item) => sum + Number(item || 0), 0).toFixed(2)}{" "}
                L
              </div>
              <div className="text-xl font-semibold text-green-900">
                ₹{" "}
                {Math.round(
                  (form.watch("rows") ?? [])
                    .filter(r => r.fuelType === "MS-PETROL")
                    .map(r => r.totalAmount ?? 0)
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
                  r =>
                    typeof r.fuelType === "string" &&
                    ["HSD-DIESEL", "XG-DIESEL", "MS-PETROL"].includes(r.fuelType)
                )
                .map(r => r.sale ?? 0)
                .reduce((sum, item) => sum + Number(item || 0), 0)
                .toFixed(2)}{" "}
              L
            </div>
            <div className="text-xl font-semibold">
              ₹{" "}
              {Math.round(
                Math.round(
                  (form.watch("rows") ?? [])
                    .filter(r => r.fuelType === "HSD-DIESEL")
                    .map(r => r.totalAmount ?? 0)
                    .reduce((sum, item) => sum + Number(item || 0), 0)
                ) +
                Math.round(
                  (form.watch("rows") ?? [])
                    .filter(r => r.fuelType === "XG-DIESEL")
                    .map(r => r.totalAmount ?? 0)
                    .reduce((sum, item) => sum + Number(item || 0), 0)
                ) +
                Math.round(
                  (form.watch("rows") ?? [])
                    .filter(r => r.fuelType === "MS-PETROL")
                    .map(r => r.totalAmount ?? 0)
                    .reduce((sum, item) => sum + Number(item || 0), 0)
                )
              ).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
          </div>
          </div>

          </Card>

          {/* Footer */}
          <SheetFooter>
            <div className="mt-4 flex justify-end gap-2">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </SheetClose>

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save All"
                )}
              </Button>

            </div>
          </SheetFooter>
        </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );}

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
import { Plus, Pencil, Loader2 } from "lucide-react";
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
  const [branchFuelProducts, setBranchFuelProducts] = useState<{ productName: string }[]>([]);

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
    powerPetrolTotal: sales && (sales as unknown as Record<string, unknown>).powerPetrolTotal ? Number((sales as unknown as Record<string, unknown>).powerPetrolTotal) || undefined : undefined,
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
    console.log("🔵 handleSubmit called", { values, selectedBranchId });
    try {
      // Ensure branchId is set
      if (!selectedBranchId) {
        console.error("❌ No branch selected");
        toast.error("Please select a branch");
        return;
      }

      // Prepare the payload, converting empty strings/undefined to null for nullable fields
      // Transform empty strings to null before sending
      const transformValue = (val: unknown): number | null => {
        if (val === "" || val === null || val === undefined) return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      const payload = {
        ...values,
        branchId: selectedBranchId,
        atmPayment: transformValue(values.atmPayment),
        paytmPayment: transformValue(values.paytmPayment),
        fleetPayment: transformValue(values.fleetPayment),
      };

      console.log("📤 Sending payload:", payload);

      const url = sales
        ? `/api/sales/${sales.id}`
        : `/api/sales/create`;
      const method = sales ? "PATCH" : "POST";

      console.log(`📡 Making ${method} request to ${url}`);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("📥 Response status:", res.status, res.statusText);

      const responseData = await res.json();

      if (!res.ok) {
        const error = responseData.error || "Something went wrong";
        const issues = responseData.issues;
        
        if (error.includes("already exists for this date")) {
          toast.error("A sale already exists for this date.");
        } else if (issues) {
          // Show validation errors
          const errorMessages = Object.entries(issues)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`)
            .join("\n");
          toast.error(`Validation errors:\n${errorMessages}`);
        } else {
          toast.error(error);
        }
        console.error("API Error:", responseData);
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

  // Fetch meter readings for specific date and branch when needed
  const fetchMeterReadingForDate = async (date: Date, branchId?: string) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const url = new URL('/api/meterreadings', window.location.origin);
      url.searchParams.set('date', formattedDate);
      url.searchParams.set('limit', '100');
      if (branchId) {
        url.searchParams.set('branchId', branchId);
      }
      
      const res = await fetch(url.toString());
      const json = await res.json();
      
      if (json.withDifference && json.withDifference.length > 0) {
        // Merge with existing meter readings, avoiding duplicates
        setMeterReading(prev => {
          const newIds = new Set(json.withDifference.map((r: { id: string }) => r.id));
          const existing = prev.filter(r => !newIds.has(r.id));
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

  // Fetch oil sales for specific date and branch when needed
  const fetchOilSalesForDate = async (date: Date, branchId?: string) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const url = new URL('/api/oils', window.location.origin);
      url.searchParams.set('date', formattedDate);
      url.searchParams.set('limit', '100');
      if (branchId) {
        url.searchParams.set('branchId', branchId);
      }
      
      const res = await fetch(url.toString());
      const json = await res.json();
      
      if (json.oils && json.oils.length > 0) {
        // Merge with existing oil sales, avoiding duplicates
        setOilSales(prev => {
          const newIds = new Set(json.oils.map((o: { id: string }) => o.id));
          const existing = prev.filter(o => !newIds.has(o.id));
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
  if (selectedDate && selectedBranchId) {
    const formattedDate = new Date(selectedDate).toLocaleDateString();

    // --- Fuel Sales ---
    // Filter by both date AND branch
    const matchingReadings = meterReading.filter(
      (reading) => {
        const readingDate = new Date(reading.date).toLocaleDateString();
        const readingBranchId = (reading as { branchId?: string }).branchId;
        return readingDate === formattedDate && readingBranchId === selectedBranchId;
      }
    );

    // --- Oil & Gas Sales (Dynamic products) ---
    // Filter by both date AND branch
    const matchingOils = oilSales.filter(
      (item) => {
        const itemDate = new Date(item.date).toLocaleDateString();
        const itemBranchId = (item as { branchId?: string }).branchId;
        return itemDate === formattedDate && itemBranchId === selectedBranchId;
      }
    );

    // If no matching data found, fetch data for this specific date and branch and return early
    if (matchingReadings.length === 0 || matchingOils.length === 0) {
      if (matchingReadings.length === 0) {
        fetchMeterReadingForDate(new Date(selectedDate), selectedBranchId);
      }
      if (matchingOils.length === 0) {
        fetchOilSalesForDate(new Date(selectedDate), selectedBranchId);
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
    form.setValue("powerPetrolTotal", Math.round(powerPetrolTotal));
    // Save all fuel totals dynamically
    form.setValue("fuelTotals", fuelTotals);
    form.setValue("cashPayment", cashPayment);
  }
}, [
  selectedDate,
  selectedBranchId,
  meterReading,
  oilSales,
  atmPayment,
  paytmPayment,
  fleetPayment,
  form,
]);

// Separate useEffect to handle calculation when data is updated
useEffect(() => {
  if (selectedDate && selectedBranchId && meterReading.length > 0 && oilSales.length > 0) {
    const formattedDate = new Date(selectedDate).toLocaleDateString();

    // --- Fuel Sales ---
    // Filter by both date AND branch
    const matchingReadings = meterReading.filter(
      (reading) => {
        const readingDate = new Date(reading.date).toLocaleDateString();
        const readingBranchId = (reading as { branchId?: string }).branchId;
        return readingDate === formattedDate && readingBranchId === selectedBranchId;
      }
    );

    // --- Oil & Gas Sales (Dynamic products) ---
    // Filter by both date AND branch
    const matchingOils = oilSales.filter(
      (item) => {
        const itemDate = new Date(item.date).toLocaleDateString();
        const itemBranchId = (item as { branchId?: string }).branchId;
        return itemDate === formattedDate && itemBranchId === selectedBranchId;
      }
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
      const msPetrolTotal = fuelTotals["MS-PETROL"] || 0;
      const powerPetrolTotal = fuelTotals["POWER PETROL"] || 0;
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
      form.setValue("powerPetrolTotal", Math.round(powerPetrolTotal));
      // Save all fuel totals dynamically
      form.setValue("fuelTotals", fuelTotals);
      form.setValue("cashPayment", cashPayment);
    }
  }
}, [selectedDate, selectedBranchId, meterReading, oilSales, atmPayment, paytmPayment, fleetPayment, form]);

  // Add debug handler - ensure it's not async blocking
  const onSubmitHandler = (values: SalesFormValues) => {
    console.log("🟢 FormDialog onSubmit called with values:", values);
    console.log("🟢 Form validation state:", form.formState);
    console.log("🟢 Form errors:", form.formState.errors);
    
    // Call handleSubmit without awaiting to avoid blocking form submission
    handleSubmit(values, () => {
      console.log("🟢 Closing dialog");
      openChange?.(false);
    }).catch((error) => {
      console.error("❌ Error in handleSubmit:", error);
    });
  };

  return (
    <FormDialog
      open={open}
      openChange={openChange}
      form={form}
      onSubmit={onSubmitHandler}
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
                .filter(o => {
                  const itemDate = new Date(o.date).toLocaleDateString();
                  const formDate = selectedDate ? new Date(selectedDate).toLocaleDateString() : "";
                  const itemBranchId = (o as { branchId?: string }).branchId;
                  return itemDate === formDate && itemBranchId === selectedBranchId;
                })
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
                // If product doesn't have a mapping, create a dynamic field using fuelTotals
                // For now, we'll skip products without mappings to avoid schema issues
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

          return (
            <div className="grid grid-cols-2 gap-4">
              {fieldsToShow.map((fieldConfig) => (
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
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              sales ? "Update" : "Save"
            )}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}

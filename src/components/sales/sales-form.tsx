"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
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
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

  const router = useRouter();

// Helper to ensure products object has all numeric values
const ensureNumericProducts = (products: Record<string, unknown> | undefined): Record<string, number> => {
  if (!products) return {};
  const cleaned: Record<string, number> = {};
  Object.entries(products).forEach(([key, val]) => {
    const num = Number(val);
    cleaned[key] = isNaN(num) ? 0 : num;
  });
  return cleaned;
};

const form = useForm<SalesFormValues>({
  resolver: zodResolver(salesSchema),
  defaultValues: {
    date: sales?.date ? new Date(sales.date) : new Date(),
    rate: sales?.rate ?? undefined,
    products: ensureNumericProducts(parseProducts(sales?.products)),
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

// Initialize isDataReady based on whether we're editing existing sales
useEffect(() => {
  if (sales) {
    // If editing existing sales, data is already ready
    setIsDataReady(true);
  } else {
    // If creating new sales, wait for data to load
    setIsDataReady(false);
  }
}, [sales]);


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
        throw new Error("No branch selected");
      }

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

      console.log("📤 Sending payload:", payload);

      const url = sales
        ? `/api/sales/${sales.id}`
        : `/api/sales/create`;
      const method = sales ? "PATCH" : "POST";

      console.log(`📡 Making ${method} request to ${url}`);

      console.log("📡 About to make fetch request to:", url);
      console.log("📡 Method:", method);
      console.log("📡 Payload being sent:", JSON.stringify(payload, null, 2));

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("📥 Response status:", res.status, res.statusText);
      console.log("📥 Response ok:", res.ok);

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
        throw new Error(error || "Failed to save sale");
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
      const errorMessage = error instanceof Error ? error.message : "Something went wrong while saving sale";
      toast.error(errorMessage);
      throw error; // Re-throw to let onSubmitHandler handle it
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

  // Fetch meter readings for specific date and branch when needed
  const fetchMeterReadingForDate = async (date: Date, branchId?: string) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const url = new URL('/api/meterreadings', window.location.origin);
      url.searchParams.set('date', formattedDate);
      // Don't set limit - API will return all readings for the date (up to 1000)
      if (branchId) {
        url.searchParams.set('branchId', branchId);
      }
      
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
      // Don't set limit - let API handle it
      if (branchId) {
        url.searchParams.set('branchId', branchId);
      }
      
      const res = await fetch(url.toString());
      const json = await res.json();
      
      if (json.oils && json.oils.length > 0) {
        // Replace all oil sales for this date/branch instead of merging to avoid stale data
        setOilSales(prev => {
          const formattedDateStr = formattedDate;
          const filtered = prev.filter((o: { date: Date | string; branchId?: string }) => {
            const oDate = new Date(o.date).toISOString().split('T')[0];
            const oBranchId = (o as { branchId?: string }).branchId;
            // Keep oil sales that are NOT for this date/branch combination
            return !(oDate === formattedDateStr && oBranchId === branchId);
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

// Watch form values
const selectedDate = form.watch("date");

const atmPayment = form.watch("atmPayment");
const paytmPayment = form.watch("paytmPayment");
const fleetPayment = form.watch("fleetPayment");


useEffect(() => {
  if (selectedDate && selectedBranchId) {
    setIsDataReady(false);

    // Always fetch fresh data when date/branch changes to ensure we have all readings
    // This fixes the issue where HSD-DIESEL or other fuel types might be missing due to pagination
    setIsLoadingData(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promises: Promise<any[]>[] = [
      fetchMeterReadingForDate(new Date(selectedDate), selectedBranchId),
      fetchOilSalesForDate(new Date(selectedDate), selectedBranchId)
    ];
      
      // Wait for all fetches to complete, then calculate immediately
      Promise.all(promises).then(([readings, oils]) => {
        // Always use the freshly fetched data for calculation to ensure accuracy
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fetchedReadings = readings as any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fetchedOils = oils as any[];
        
        // Calculate fuel totals dynamically based on available fuel types
        const fuelTotals: Record<string, number> = {};
        fetchedReadings.forEach((reading: { fuelType?: string; fuelRate?: number; sale?: number; totalAmount?: number; difference?: number }) => {
          const fuelType = reading.fuelType;
          if (fuelType) {
            // Use totalAmount if available, otherwise calculate from sale * fuelRate or difference * fuelRate
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
        
        // For backward compatibility, set legacy fields if they exist
        // Explicitly set to 0 if undefined to ensure 0 values are saved
        const xgDieselTotal = fuelTotals["XG-DIESEL"] ?? 0;
        const msPetrolTotal = fuelTotals["MS-PETROL"] ?? 0;
        const powerPetrolTotal = fuelTotals["POWER PETROL"] ?? 0;
        const hsdTotal = fuelTotals["HSD-DIESEL"] ?? 0;

        const productsObj: Record<string, number> = {};
        fetchedOils.forEach((o: { productType?: string; price?: number }) => {
          const key = o.productType?.toUpperCase() || "UNKNOWN";
          const amount = Number(o.price || 0);
          productsObj[key] = (productsObj[key] || 0) + amount;
        });

        // Ensure all values are valid numbers (no NaN)
        // Sanitize product keys for form field names (replace special regex characters)
        const cleanedProductsObj: Record<string, number> = {};
        Object.entries(productsObj).forEach(([key, val]) => {
          const num = Number(val);
          const sanitizedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '_');
          cleanedProductsObj[sanitizedKey] = isNaN(num) ? 0 : num;
        });

        form.setValue("products", cleanedProductsObj);

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
      }).catch((error) => {
        console.error("Error fetching data:", error);
        setIsLoadingData(false);
      });
  }
}, [
  selectedDate,
  selectedBranchId,
  atmPayment,
  paytmPayment,
  fleetPayment,
  form,
  branchFuelProducts,
]);




  // Form submission handler - matches FormDialog's expected signature
  const onSubmitHandler = async (values: SalesFormValues, close: () => void) => {
    try {
      console.log("🟢🟢🟢 FormDialog onSubmitHandler CALLED with values:", values);
    console.log("🟢 Form validation state:", form.formState);
    console.log("🟢 Form errors:", form.formState.errors);
      console.log("🟢 Selected branch ID:", selectedBranchId);
      
      // Ensure branchId is set
      if (!selectedBranchId) {
        console.error("❌ No branch selected in onSubmitHandler");
        toast.error("Please select a branch");
        return; // Don't proceed if no branch
      }
      
      // Clean up ALL values before validation - ensure no NaN values
      const cleanedValues = {
        ...values,
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
      // Map sanitized keys back to original product names
      products: values.products ? (() => {
        const productsMap: Record<string, number> = {};
        // Get all unique product names from oilSales to create reverse mapping
        const productNameMap = new Map<string, string>();
        Array.from(new Set(
          oilSales
            .filter(o => {
              const itemDate = new Date(o.date).toLocaleDateString();
              const formDate = selectedDate ? new Date(selectedDate).toLocaleDateString() : "";
              const itemBranchId = (o as { branchId?: string }).branchId;
              return itemDate === formDate && itemBranchId === selectedBranchId;
            })
            .map(o => (o.productType || '').toUpperCase())
        )).forEach(product => {
          const sanitized = product.replace(/[.*+?^${}()|[\]\\]/g, '_');
          productNameMap.set(sanitized, product);
        });
        
        // Map sanitized keys back to original product names
        Object.entries(values.products).forEach(([key, val]) => {
          const originalName = productNameMap.get(key) || key;
          productsMap[originalName] = safeNumber(val);
        });
        return productsMap;
      })() : {},
        // Convert fuelTotals object - ensure all values are numbers
        fuelTotals: values.fuelTotals ? Object.fromEntries(
          Object.entries(values.fuelTotals)
            .map(([key, val]) => [key, safeNumber(val)])
        ) : undefined,
      };

      console.log("🟢 Cleaned values:", cleanedValues);

      // Validate the cleaned form data
      const validationResult = salesSchema.safeParse(cleanedValues);
      if (!validationResult.success) {
        console.error("❌ Validation failed:", validationResult.error.flatten().fieldErrors);
        const errorMessages = Object.entries(validationResult.error.flatten().fieldErrors)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`)
          .join("\n");
        toast.error(`Validation errors:\n${errorMessages}`);
        return; // Don't proceed if validation fails
      }
      
      // Use cleaned values for submission
      const finalValues = cleanedValues as SalesFormValues;
      
      console.log("🟢 Calling handleSubmit with finalValues");
      // Call handleSubmit with cleaned values and await it to ensure proper error handling
      await handleSubmit(finalValues, close);
      console.log("🟢 handleSubmit completed successfully");
    } catch (error) {
      console.error("❌ Error in onSubmitHandler:", error);
      console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace");
      toast.error(error instanceof Error ? error.message : "Failed to save sale");
      // Don't close dialog on error
    }
  };

  const isControlled = typeof open === "boolean";

  return (
    <Sheet open={open} onOpenChange={openChange}>
      {!isControlled && (
        <SheetTrigger asChild>
        <Button>
          {sales ? (
            <Pencil className="size-4 mr-2" />
          ) : (
            <Plus className="size-4 mr-2" />
          )}
          {sales ? "Edit Sale" : "New Sale"}
        </Button>
        </SheetTrigger>
      )}

      <SheetContent side="top" className="w-full h-[90vh] overflow-y-auto p-8">
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.log("🟡 Form onSubmit event triggered");
              form.handleSubmit(
                (values) => {
                  console.log("🟡 Form handleSubmit callback called with values:", values);
                  onSubmitHandler(values, () => {
                    if (openChange) openChange(false);
                  });
                },
                (errors) => {
                  console.error("❌ Form validation failed:", errors);
                  console.error("❌ Form errors object:", JSON.stringify(errors, null, 2));
                  const errorMessages = Object.entries(errors)
                    .map(([field, error]) => {
                      const err = error as { message?: string; type?: string };
                      return `${field}: ${err?.message || "Invalid"}`;
                    })
                    .join("\n");
                  if (errorMessages) {
                    toast.error(`Form validation errors:\n${errorMessages}`);
                  } else {
                    toast.error("Form validation failed. Please check all fields.");
                  }
                }
              )(e);
            }}
            className="space-y-4"
          >
            <SheetHeader>
              <SheetTitle>
            {sales ? "Edit Sale" : "Record New Sale"}
              </SheetTitle>
              <SheetDescription>
            {sales
              ? "Update the existing sale entry"
              : "Enter details for a new fuel sale transaction."}
              </SheetDescription>
            </SheetHeader>

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
                .filter(o => {
                  const itemDate = new Date(o.date).toLocaleDateString();
                  const formDate = selectedDate ? new Date(selectedDate).toLocaleDateString() : "";
                  const itemBranchId = (o as { branchId?: string }).branchId;
                  return itemDate === formDate && itemBranchId === selectedBranchId;
                })
                .map(o => (o.productType || '').toUpperCase())
            )
          ).map((product) => {
            // Sanitize product name for use as form field key (replace special regex characters)
            const sanitizedKey = product.replace(/[.*+?^${}()|[\]\\]/g, '_');
            return (
              <FormField
                key={product}
                control={form.control}
                name={`products.${sanitizedKey}` as `products.${string}`}
                render={({ field }) => {
                  // Ensure value is always a number for display, defaulting to 0
                  const numericValue = field.value != null 
                    ? (isNaN(Number(field.value)) ? 0 : Number(field.value))
                    : 0;
                  
                  return (
                    <FormItem>
                      <FormLabel>{product}</FormLabel>
                      <FormControl>
                        <Input type="number" readOnly value={numericValue} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            );
          })}
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
                          value={field.value != null ? Number(field.value) : ""}
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

            <SheetFooter>
            <div className="mt-4 flex justify-end gap-2">

              <SheetClose asChild>
                <Button type="button" variant="outline" size="lg">
              Cancel
            </Button>
              </SheetClose>
          <Button
            type="submit"
            size="lg"
            disabled={form.formState.isSubmitting || isLoadingData || !isDataReady}
            onClick={(e) => {
              console.log("🟡 Save button clicked");
              console.log("🟡 isSubmitting:", form.formState.isSubmitting);
              console.log("🟡 isLoadingData:", isLoadingData);
              console.log("🟡 isDataReady:", isDataReady);
              console.log("🟡 Button disabled:", form.formState.isSubmitting || isLoadingData || !isDataReady);
              console.log("🟡 Current form values:", form.getValues());
              console.log("🟡 Form errors:", form.formState.errors);
              console.log("🟡 Selected branch ID:", selectedBranchId);
              if (!isDataReady) {
                console.error("❌ Button is disabled because isDataReady is false");
                toast.error("Please wait for data to load before saving");
                e.preventDefault();
              }
            }}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isLoadingData ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              sales ? "Update" : "Save"
            )}
          </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

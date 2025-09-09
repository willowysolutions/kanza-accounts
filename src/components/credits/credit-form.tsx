"use client";

import {
  DialogClose,
} from "@/components/ui/dialog";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Credit } from "@prisma/client";
import { useRouter } from "next/navigation";
import { creditSchema } from "@/schemas/credit-schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";


export function CreditFormDialog({
  credits,
  open,
  openChange,
}: {
  credits?: Credit;
  open?: boolean;
  openChange?: (open: boolean) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerOption, setCustomerOptions] = useState<{ id: string; name: string; openingBalance: number; outstandingPayments:number; }[]>([]);
  const [products, setProducts] = useState<{id:string; productName :string; productUnit: string; purchasePrice: number; sellingPrice: number; }[]>([]);
  const router = useRouter();

  const form = useForm<z.infer<typeof creditSchema>>({
    resolver: zodResolver(creditSchema),
    defaultValues: {
      customerId: credits?.customerId || "",
      fuelType:credits?.fuelType || "",
      quantity:credits?.quantity || undefined,
      amount: credits?.amount || undefined,
      date: credits?.date || new Date(),
    },
  });

  // 🔑 Watch fields
  const selectedCustomerId = form.watch("customerId");
  const enteredAmount = form.watch("amount") ?? 0;

  // Find selected customer
  const selectedCustomer = customerOption.find(
    (c) => c.id === selectedCustomerId
  );

  // Calculate new balance for display
  const displayBalance =
    (selectedCustomer?.outstandingPayments ?? 0) + Number(enteredAmount || 0);

  const handleSubmit = async (
    values: z.infer<typeof creditSchema>,
    close: () => void
  ) => {
    setIsSubmitting(true);
    try {
      const url = credits
        ? `http://localhost:3000/api/credits/${credits.id}`
        : "http://localhost:3000/api/credits/create";

      const method = credits ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const response = await res.json();

      if (!res.ok) {
        toast.error(response.error || "Failed to save credits");
        return;
      }

      toast.success(
        credits ? "credits updated successfully" : "credits created successfully"
      );
      close();
      router.refresh();
    } catch (error) {
      console.error("Error saving credits:", error);
      toast.error("Unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inside your component

  // Watch fuelType and quantity
  const selectedFuelType = form.watch("fuelType");
  const enteredQuantity = form.watch("quantity") ?? 0;

  // Find selected product
  const selectedProduct = products.find(
    (p) => p.productName === selectedFuelType
  );

  // Auto-calculate amount when quantity or fuel changes
  useEffect(() => {
    if (selectedProduct && enteredQuantity) {
      form.setValue("amount", enteredQuantity * selectedProduct.sellingPrice);
    }
  }, [enteredQuantity, selectedFuelType, selectedProduct, form]);


  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/customers");
        const json = await res.json();
        setCustomerOptions(json.data || []);
      } catch (error) {
        console.error("Failed to fetch customers", error);
      }
    };

    fetchCustomers();
  }, []);

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
    <FormDialog
      open={open}
      openChange={openChange}
      form={form}
      onSubmit={(values) => handleSubmit(values, () => openChange?.(false))}
    >
      <FormDialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          {credits ? "Edit Credits" : "New Credits"}
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>
            {credits ? "Edit Credits" : "New Credits"}
          </FormDialogTitle>
          <FormDialogDescription>
            {credits
              ? "Update credits details. Click save when you're done."
              : "Fill out the credits details. Click save when you're done."}
          </FormDialogDescription>
        </FormDialogHeader>

        {/* Customer Select */}
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customerOption.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Show calculated balance */}
                {selectedCustomer && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Outstanding :{" "}
                    <span className="font-medium">{displayBalance}</span>
                  </p>
                )}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4 mt-4">
         <FormField
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fuel Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Fuel Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.productName}>
                        {p.productName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />


          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>


        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
                
              </FormItem>
            )}
          />

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
        </div>

        <FormDialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {credits ? "Update" : "Save"}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}

"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { creditSchema } from '@/schemas/credit-schema';
import { useWizard } from '../form-wizard';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
// import { formatDate } from '@/lib/utils'; // Removed to fix hydration issue

// type CreditWithId = z.infer<typeof creditSchema> & { id?: string; tempId?: string };

export const CreditStep: React.FC<{ branchId?: string }> = ({ branchId }) => {
  const { 
    markStepCompleted, 
    markCurrentStepCompleted,
    currentStep, 
    setOnSaveAndNext,
    addedCredits,
    setAddedCredits,
    savedRecords,
    setSavedRecords,
    commonDate
  } = useWizard();
  const [customerOption, setCustomerOptions] = useState<{ id: string; name: string; openingBalance: number; outstandingPayments: number; limit?: number; }[]>([]);
  const [products, setProducts] = useState<{id: string; productName: string; productUnit: string; purchasePrice: number; sellingPrice: number; }[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const router = useRouter();

  const form = useForm<z.infer<typeof creditSchema>>({
    resolver: zodResolver(creditSchema),
    defaultValues: {
      customerId: "",
      fuelType: "",
      quantity: undefined,
      amount: undefined,
      date: commonDate,
      reason: "",
    },
  });

  // Watch fields
  const selectedCustomerId = form.watch("customerId");
  const enteredAmount = form.watch("amount") ?? 0;

  // Find selected customer
  const selectedCustomer = customerOption.find(
    (c) => c.id === selectedCustomerId
  );

  // Calculate new balance for display
  const displayBalance =
    (selectedCustomer?.outstandingPayments ?? 0) + Number(enteredAmount || 0);

  // Check if outstanding + entered amount exceeds customer limit
  const exceedsLimit = selectedCustomer?.limit && displayBalance > selectedCustomer.limit;

  const handleSubmit = useCallback(async (values: z.infer<typeof creditSchema>): Promise<boolean> => {
    // Validate reason when limit is exceeded
    if (exceedsLimit && (!values.reason || values.reason.trim() === "")) {
      toast.error("Reason is required when outstanding + credit amount exceeds customer limit");
      return false;
    }

    try {
      // If we're editing, use PUT/PATCH, otherwise use POST
      if (editingIndex !== null) {
        const credit = addedCredits[editingIndex];
        if (credit.id) {
          const res = await fetch(`/api/credits/${credit.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });
          
          if (!res.ok) {
            const response = await res.json();
            toast.error(response.error || "Failed to update credit");
            return false;
          }
          
          setAddedCredits(prev => prev.map((item, index) => 
            index === editingIndex ? { ...values, amount: Number(values.amount), id: credit.id, tempId: credit.tempId } : item
          ));
          toast.success("Credit updated successfully");
          setEditingIndex(null);
          form.reset({
            customerId: "",
            fuelType: "",
            quantity: undefined,
            amount: undefined,
            date: new Date(),
            reason: "",
          });
          return true;
        } else {
          toast.info("Creating new credit with updated values.");
          
          // Create a new credit with the updated values
          const res = await fetch('/api/credits/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });

          if (!res.ok) {
            const response = await res.json();
            toast.error(response.error || "Failed to save credits");
            return false;
          }

          const response = await res.json();
          
          // Try to get ID from different possible locations
          const creditId = response.id || response.data?.id || response.data?.credit?.id;
          
          if (!creditId) {
            toast.error("Server response missing ID - credit may not be saved properly");
            return false;
          }
          
          // Update the local state with the new ID
          setAddedCredits(prev => prev.map((item, index) => 
            index === editingIndex ? { ...values, amount: Number(values.amount), id: creditId, tempId: item.tempId } : item
          ));
          
          toast.success("Credit updated and saved to database");
          setEditingIndex(null);
          form.reset({
            customerId: "",
            fuelType: "",
            quantity: undefined,
            amount: undefined,
            date: new Date(),
            reason: "",
          });
          router.refresh();
          return true;
        }
      } else {
        // Create new credit
        const res = await fetch('/api/credits/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          const response = await res.json();
          toast.error(response.error || "Failed to save credits");
          return false;
        }

        const response = await res.json();
        
        // Try to get ID from different possible locations
        const creditId = response.id || response.data?.id || response.data?.credit?.id;
        
        if (!creditId) {
          toast.error("Server response missing ID - credit may not be saved properly");
          return false;
        }
        
        toast.success("Credits created successfully");
        setSavedRecords(prev => ({ ...prev, credits: prev.credits + 1 }));
        const creditWithId = { ...values, amount: Number(values.amount), id: creditId, tempId: `temp_${Date.now()}` };
        setAddedCredits(prev => [...prev, creditWithId]);
        router.refresh();
        return true;
      }
    } catch (error) {
      console.error("Error saving credits:", error);
      toast.error("Unexpected error occurred");
      return false;
    }
  }, [router, editingIndex, addedCredits, form, setAddedCredits, setSavedRecords, exceedsLimit]);

  const handleAddAnother = async () => {
    const values = form.getValues();
    const result = await handleSubmit(values);
    if (result) {
      form.reset({
        customerId: values.customerId, // Keep customer selected
        fuelType: "",
        quantity: undefined,
        amount: undefined,
        date: values.date,
        reason: "",
      });
      setEditingIndex(null);
    }
    return result;
  };

  const handleEdit = (index: number) => {
    const credit = addedCredits[index];
    form.reset({
      customerId: credit.customerId,
      fuelType: credit.fuelType,
      quantity: credit.quantity,
      amount: credit.amount,
      date: credit.date,
      reason: (credit as { reason?: string })?.reason || "",
    });
    setEditingIndex(index);
  };

  const handleDelete = async (index: number) => {
    const credit = addedCredits[index];
    if (credit.id) {
      try {
        const res = await fetch(`/api/credits/${credit.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          toast.error("Failed to delete credit");
          return;
        }
      } catch (error) {
        console.error("Error deleting credit:", error);
        toast.error("Failed to delete credit");
        return;
      }
    }
    
    setAddedCredits(prev => prev.filter((_, i) => i !== index));
    setSavedRecords(prev => ({ ...prev, credits: Math.max(0, prev.credits - 1) }));
    toast.success("Credit deleted successfully");
  };


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

  // Search-based customer fetching
  const fetchCustomers = useCallback(async (searchTerm: string = "") => {
    try {
      const params = new URLSearchParams({
        limit: '100', // Increased limit to fetch more customers
        search: searchTerm
      });
      
      if (branchId) {
        params.append('branchId', branchId);
      }
      
      const res = await fetch(`/api/customers?${params.toString()}`);
      const json = await res.json();
      
      return json.data?.map((customer: { id: string; name: string; openingBalance: number; outstandingPayments: number; limit?: number }) => ({
        id: customer.id,
        name: customer.name,
        openingBalance: customer.openingBalance || 0,
        outstandingPayments: customer.outstandingPayments || 0,
        limit: customer.limit
      })) || [];
    } catch (error) {
      console.error("Failed to fetch customers", error);
      return [];
    }
  }, [branchId]);

  // Load customers when search term changes
  useEffect(() => {
    const loadCustomers = async () => {
      const customers = await fetchCustomers(customerSearch);
      setCustomerOptions(customers);
    };
    
    loadCustomers();
  }, [branchId, customerSearch, fetchCustomers]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const json = await res.json();
        
        // Deduplicate products by name, keeping the first occurrence
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uniqueProducts = json.data?.reduce((acc: any[], product: any) => {
          const existingProduct = acc.find(p => p.productName === product.productName);
          if (!existingProduct) {
            acc.push(product);
          }
          return acc;
        }, []) || [];
        
        setProducts(uniqueProducts);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to fetch products", error);
      }
    };

    fetchProducts();
  }, []);

  // Set up the save handler only when initialized - but don't call it
  useEffect(() => {
    if (isInitialized) {
      setOnSaveAndNext(() => async () => {
        if (savedRecords.credits > 0) {
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
          console.error("Error saving credits:", error);
          return false;
        }
      });
    }
  }, [isInitialized, savedRecords, markStepCompleted, currentStep, form, handleSubmit, setOnSaveAndNext]);

  return (
<FormProvider {...form}>
  <Card>
    <CardHeader>
      <CardTitle>Step 5: Credit Form</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <form className="space-y-4">
        {/* Customer Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search Customer</label>
          <Input
            placeholder="Type to search customers..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="w-full"
          />
        </div>

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
              {selectedCustomer && (
                <p className="text-sm text-muted-foreground mt-1">
                  Outstanding:{" "}
                  <span className="font-medium">{displayBalance}</span>
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fuel Type & Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <FormLabel>Quantity (optional)</FormLabel>
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

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full justify-start bg-muted cursor-not-allowed"
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
        </div>

        {/* Reason field - only show when outstanding + credit amount exceeds limit */}
        {exceedsLimit && (
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason (Required - Outstanding + Credit exceeds limit)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter reason for exceeding customer limit"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          {editingIndex !== null ? (
            <>
              <Button 
                type="button" 
                onClick={form.handleSubmit(handleSubmit)}
              >
                Update Credit
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditingIndex(null);
                  form.reset({
                    customerId: "",
                    fuelType: "",
                    quantity: undefined,
                    amount: undefined,
                    date: new Date(),
                    reason: "",
                  });
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button 
                type="button" 
                onClick={handleAddAnother}
              >
                Add Another Credit
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={markCurrentStepCompleted}
              >
                Complete
              </Button>
            </>
          )}
        </div>

        {savedRecords.credits > 0 && (
          <div className="text-sm text-muted-foreground">
            {savedRecords.credits} credit(s) saved for this day
          </div>
        )}
      </form>
    </CardContent>
  </Card>

  {/* Added Credits Table */}
  {addedCredits.length > 0 && (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Added Credits for Today</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Customer</th>
                <th className="text-left p-2 font-medium">Fuel Type</th>
                <th className="text-right p-2 font-medium">Quantity</th>
                <th className="text-right p-2 font-medium">Amount</th>
                <th className="text-center p-2 font-medium">Date</th>
                <th className="text-center p-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {addedCredits.map((credit, index) => (
                <tr key={credit.tempId || index} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    {customerOption.find(c => c.id === credit.customerId)?.name || 'Unknown'}
                  </td>
                  <td className="p-2">
                    {products.find(p => p.productName === credit.fuelType)?.productName || credit.fuelType}
                  </td>
                  <td className="p-2 text-right">{credit.quantity || "-"}</td>
                  <td className="p-2 text-right">
                    ₹{typeof credit.amount === "number"
                      ? credit.amount.toFixed(2)
                      : parseFloat(credit.amount || "0").toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    {new Date(credit.date).toLocaleDateString('en-CA')}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(index)}
                        disabled={editingIndex !== null}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(index)}
                        disabled={editingIndex !== null}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )}
</FormProvider>
  );
};

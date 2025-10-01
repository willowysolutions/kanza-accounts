"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bankDepositeSchema } from '@/schemas/bank-deposite-schema';
import { useWizard } from '../form-wizard';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
// import { formatDate } from '@/lib/utils'; // Removed to fix hydration issue
import { Edit2, Trash2 } from 'lucide-react';

// type BankDepositWithId = z.infer<typeof bankDepositeSchema> & { id?: string; tempId?: string };

export const BankDepositStep: React.FC<{ branchId?: string }> = ({ branchId }) => {
  const { 
    markStepCompleted, 
    markCurrentStepCompleted,
    currentStep, 
    setOnSaveAndNext,
    addedDeposits,
    setAddedDeposits,
    savedRecords,
    setSavedRecords,
    commonDate
  } = useWizard();
  const [bankOptions, setBankOptions] = useState<{ bankName: string; id: string; }[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof bankDepositeSchema>>({
    resolver: zodResolver(bankDepositeSchema),
    defaultValues: {
      bankId: "",
      date: commonDate,
      amount: undefined,
    },
  });

  const handleSubmit = useCallback(async (values: z.infer<typeof bankDepositeSchema>): Promise<boolean> => {
    try {
      // If we're editing, use PUT/PATCH, otherwise use POST
      if (editingIndex !== null) {
        const deposit = addedDeposits[editingIndex];
        if (deposit.id) {
          const res = await fetch(`/api/bank-deposite/${deposit.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });
          
          if (!res.ok) {
            const response = await res.json();
            toast.error(response.error || "Failed to update bank deposit");
            return false;
          }
          
          setAddedDeposits(prev => prev.map((item, index) => 
            index === editingIndex ? { ...values, amount: Number(values.amount), id: deposit.id, tempId: deposit.tempId } : item
          ));
          toast.success("Bank deposit updated successfully");
          setEditingIndex(null);
          form.reset({
            bankId: "",
            date: new Date(),
            amount: undefined,
          });
          return true;
        } else {
          toast.info("Creating new deposit with updated values.");
          
          // Create a new deposit with the updated values
          const res = await fetch('/api/bank-deposite/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });

          if (!res.ok) {
            const response = await res.json();
            toast.error(response.error || "Failed to save bank deposit");
            return false;
          }

          const response = await res.json();
          
          // Try to get ID from different possible locations
          const depositId = response.id || response.data?.id || response.data?.deposit?.id;
          
          if (!depositId) {
            toast.error("Server response missing ID - deposit may not be saved properly");
            return false;
          }
          
          // Update the local state with the new ID
          setAddedDeposits(prev => prev.map((item, index) => 
            index === editingIndex ? { ...values, amount: Number(values.amount), id: depositId, tempId: item.tempId } : item
          ));
          
          toast.success("Deposit updated and saved to database");
          setEditingIndex(null);
          form.reset({
            bankId: "",
            date: new Date(),
            amount: undefined,
          });
          router.refresh();
          return true;
        }
      } else {
        // Create new bank deposit
        const res = await fetch('/api/bank-deposite/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          const response = await res.json();
          toast.error(response.error || "Failed to save bank deposit");
          return false;
        }

        const response = await res.json();
        
        // Try to get ID from different possible locations
        const depositId = response.id || response.data?.id || response.data?.deposit?.id;
        
        if (!depositId) {
          toast.error("Server response missing ID - deposit may not be saved properly");
          return false;
        }
        
        toast.success("Bank deposit added successfully");
        setSavedRecords(prev => ({ ...prev, deposits: prev.deposits + 1 }));
        const depositWithId = { ...values, amount: Number(values.amount), id: depositId, tempId: `temp_${Date.now()}` };
        setAddedDeposits(prev => [...prev, depositWithId]);
        router.refresh();
        return true;
      }
    } catch (error) {
      console.error("Error saving bank deposit:", error);
      toast.error("Unexpected error occurred");
      return false;
    }
  }, [router, editingIndex, addedDeposits, form, setAddedDeposits, setSavedRecords]);

  const handleAddAnother = async () => {
    const values = form.getValues();
    const result = await handleSubmit(values);
    if (result) {
      form.reset({
        bankId: values.bankId, // Keep bank selected
        date: values.date,
        amount: undefined,
      });
      setEditingIndex(null);
    }
    return result;
  };

  const handleEdit = (index: number) => {
    const deposit = addedDeposits[index];
    if (deposit) {
      form.reset({
        bankId: deposit.bankId || "",
        date: new Date(deposit.date),
        amount: deposit.amount,
      });
      setEditingIndex(index);
    }
  };

  const handleDelete = async (index: number) => {
    const deposit = addedDeposits[index];
    if (!deposit) return;
    
    try {
      // If it has an ID, delete from server
      if (deposit.id) {
        const res = await fetch(`/api/bank-deposite/${deposit.id}`, {
          method: 'DELETE',
        });
        
        if (!res.ok) {
          const response = await res.json();
          toast.error(response.error || "Failed to delete bank deposit");
          return;
        }
      }
      
      // Remove from local state
      setAddedDeposits(prev => prev.filter((_, i) => i !== index));
      setSavedRecords(prev => ({ ...prev, deposits: Math.max(0, prev.deposits - 1) }));
      
      // If we were editing this item, reset editing state
      if (editingIndex === index) {
        setEditingIndex(null);
        form.reset({
          bankId: "",
          date: new Date(),
          amount: undefined,
        });
      }
      
      toast.success("Bank deposit deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Error deleting bank deposit:", error);
      toast.error("Failed to delete bank deposit");
    }
  };


  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch("/api/banks");
        const json = await res.json();
        
        // Filter banks by branch if branchId is provided
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredBanks = json.banks?.filter((bank: any) => {
          return branchId ? bank.branchId === branchId : true;
        }) || [];
        
        setBankOptions(filteredBanks);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to fetch banks", error);
      }
    };

    fetchBanks();
  }, [branchId]);

  // Set up the save handler only when initialized - but don't call it
  useEffect(() => {
    if (isInitialized) {
      setOnSaveAndNext(() => async () => {
        if (savedRecords.deposits > 0) {
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
          console.error("Error saving bank deposit:", error);
          return false;
        }
      });
    }
  }, [isInitialized, savedRecords, markStepCompleted, currentStep, form, handleSubmit, setOnSaveAndNext]);

  return (
    <FormProvider {...form}>
      <Card>
        <CardHeader>
          <CardTitle>Step 6: Bank Deposit Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4">
            {/* Bank & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bankId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bankOptions.map((bank) => (
                          <SelectItem key={bank?.id} value={bank?.id}>
                            {bank?.bankName}
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

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Enter amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              {editingIndex !== null ? (
                <>
                  <Button 
                    type="button" 
                    onClick={form.handleSubmit(handleSubmit)}
                  >
                    Update Deposit
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setEditingIndex(null);
                      form.reset({
                        bankId: "",
                        date: new Date(),
                        amount: undefined,
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
                    Add Another Deposit
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

            {savedRecords.deposits > 0 && (
              <div className="text-sm text-muted-foreground">
                {savedRecords.deposits} deposit(s) saved for this day
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Added Bank Deposits Table */}
      {addedDeposits.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Added Bank Deposits for Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Bank</th>
                    <th className="text-right p-2 font-medium">Amount</th>
                    <th className="text-center p-2 font-medium">Date</th>
                    <th className="text-center p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {addedDeposits.map((deposit, index) => (
                    <tr key={deposit.tempId || index} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        {bankOptions.find(b => b.id === deposit.bankId)?.bankName || 'Unknown Bank'}
                      </td>
                      <td className="p-2 text-right">
                        ₹{typeof deposit.amount === "number"
                          ? deposit.amount.toFixed(2)
                          : parseFloat(deposit.amount || "0").toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        {new Date(deposit.date).toLocaleDateString('en-CA')}
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

"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema } from '@/schemas/expense-schema';
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

// type ExpenseWithId = z.infer<typeof expenseSchema> & { id?: string; tempId?: string };

export const ExpenseStep: React.FC = () => {
  const { 
    markStepCompleted, 
    markCurrentStepCompleted,
    currentStep, 
    setOnSaveAndNext,
    addedExpenses,
    setAddedExpenses,
    savedRecords,
    setSavedRecords,
    commonDate
  } = useWizard();
  const [expenseCategoryList, setExpenseCategoryList] = useState<{ name: string; id: string; limit?: number }[]>([]);
  const [bankList, setBankList] = useState<{ bankName: string; id: string }[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: undefined,
      date: commonDate,
      expenseCategoryId: "",
      bankId: undefined,
      reason: "",
    },
  });

  // Watch fields
  const selectedCategoryId = form.watch("expenseCategoryId");
  const enteredAmount = form.watch("amount") ?? 0;

  // Find selected category
  const selectedCategory = expenseCategoryList.find(
    (c) => c.id === selectedCategoryId
  );

  // Check if expense amount exceeds TA category limit
  const exceedsLimit = selectedCategory?.limit && selectedCategory.name === "TA" && Number(enteredAmount || 0) > selectedCategory.limit;

  const handleSubmit = useCallback(async (values: z.infer<typeof expenseSchema>): Promise<boolean> => {
    // Validate reason when limit is exceeded
    if (exceedsLimit && (!values.reason || values.reason.trim() === "")) {
      toast.error("Reason is required when expense amount exceeds TA category limit");
      return false;
    }

    try {
      // If we're editing, use PUT/PATCH, otherwise use POST
      if (editingIndex !== null) {
        const expense = addedExpenses[editingIndex];
        if (expense.id) {
          const res = await fetch(`/api/expenses/${expense.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });
          
          if (!res.ok) {
            const response = await res.json();
            toast.error(response.error || "Failed to update expense");
            return false;
          }
          
          setAddedExpenses(prev => prev.map((item, index) => 
            index === editingIndex ? { ...values, amount: Number(values.amount), id: expense.id, tempId: expense.tempId } : item
          ));
          toast.success("Expense updated successfully");
          setEditingIndex(null);
          form.reset({
            description: "",
            amount: undefined,
            date: new Date(),
            expenseCategoryId: "",
            bankId: undefined,
            reason: "",
          });
          return true;
        } else {
          toast.info("Creating new expense with updated values.");
          
          // Create a new expense with the updated values
          const res = await fetch('/api/expenses/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });

          if (!res.ok) {
            const response = await res.json();
            toast.error(response.error || "Failed to save expense");
            return false;
          }

          const response = await res.json();
          
          // Try to get ID from different possible locations
          const expenseId = response.id || response.data?.id || response.data?.expense?.id;
          
          if (!expenseId) {
            toast.error("Server response missing ID - expense may not be saved properly");
            return false;
          }
          
          // Update the local state with the new ID
          setAddedExpenses(prev => prev.map((item, index) => 
            index === editingIndex ? { ...values, amount: Number(values.amount), id: expenseId, tempId: item.tempId } : item
          ));
          
          toast.success("Expense updated and saved to database");
          setEditingIndex(null);
          form.reset({
            description: "",
            amount: undefined,
            date: new Date(),
            expenseCategoryId: "",
            bankId: undefined,
            reason: "",
          });
          router.refresh();
          return true;
        }
      } else {
        // Create new expense
        const res = await fetch('/api/expenses/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          const response = await res.json();
          toast.error(response.error || "Failed to save expense");
          return false;
        }

        const response = await res.json();
        
        // Try to get ID from different possible locations
        const expenseId = response.id || response.data?.id || response.data?.expense?.id;
        
        if (!expenseId) {
          toast.error("Server response missing ID - expense may not be saved properly");
          return false;
        }
        
        toast.success("Expense created successfully");
        setSavedRecords(prev => ({ ...prev, expenses: prev.expenses + 1 }));
        const expenseWithId = { ...values, amount: Number(values.amount), id: expenseId, tempId: `temp_${Date.now()}` };
        setAddedExpenses(prev => [...prev, expenseWithId]);
        router.refresh();
        return true;
      }
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Unexpected error occurred");
      return false;
    }
  }, [router, editingIndex, addedExpenses, form, setAddedExpenses, setSavedRecords, exceedsLimit]);

  const handleAddAnother = async () => {
    const values = form.getValues();
    const result = await handleSubmit(values);
    if (result) {
      form.reset({
        description: "",
        amount: undefined,
        date: values.date,
        expenseCategoryId: "",
        bankId: undefined,
        reason: "",
      });
      setEditingIndex(null);
    }
    return result;
  };

  const handleEdit = (index: number) => {
    const expense = addedExpenses[index];
    form.reset({
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      expenseCategoryId: expense.expenseCategoryId,
      bankId: expense.bankId,
      reason: (expense as { reason?: string })?.reason || "",
    });
    setEditingIndex(index);
  };

  const handleDelete = async (index: number) => {
    const expense = addedExpenses[index];
    if (expense.id) {
      try {
        const res = await fetch(`/api/expenses/${expense.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          toast.error("Failed to delete expense");
          return;
        }
      } catch (error) {
        console.error("Error deleting expense:", error);
        toast.error("Failed to delete expense");
        return;
      }
    } else {
      toast.info("Removing unsaved expense from list.");
    }
    
    setAddedExpenses(prev => prev.filter((_, i) => i !== index));
    setSavedRecords(prev => ({ ...prev, expenses: Math.max(0, prev.expenses - 1) }));
    toast.success("Expense deleted successfully");
  };


  useEffect(() => {
    const fetchCategorys = async () => {
      try {
        const res = await fetch("/api/expensescategory");
        const json = await res.json();
        setExpenseCategoryList(json.data || []);
      } catch (error) {
        console.error("Failed to fetch expense category", error);
      }
    };

    fetchCategorys();
  }, []);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch("/api/banks");
        const json = await res.json();
        setBankList(json.banks || []);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to fetch banks", error);
      }
    };

    fetchBanks();
  }, []);

  // Set up the save handler only when initialized - but don't call it
  useEffect(() => {
    if (isInitialized) {
      setOnSaveAndNext(() => async () => {
        if (savedRecords.expenses > 0) {
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
          console.error("Error saving expense:", error);
          return false;
        }
      });
    }
  }, [isInitialized, savedRecords, markStepCompleted, currentStep, form, handleSubmit, setOnSaveAndNext]);

  return (
<FormProvider {...form}>
  <Card>
    <CardHeader>
      <CardTitle>Step 4: Expense Form</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <form className="space-y-4">
        {/* Expense Category & Bank */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expenseCategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expense Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {expenseCategoryList.map((expenseCategory) => (
                      <SelectItem key={expenseCategory?.id} value={expenseCategory?.id}>
                        {expenseCategory?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Bank (only if category = bank) */}
          {(() => {
            const selectedCategoryId = form.watch("expenseCategoryId");
            const selectedCategory = expenseCategoryList.find(c => c.id === selectedCategoryId);

            if (selectedCategory?.name.toLowerCase() === "bank") {
              return (
                <FormField
                  control={form.control}
                  name="bankId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Bank</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select bank" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bankList.map((bank) => (
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
              );
            }
            return null;
          })()}

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter description" {...field}/>
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
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Enter amount"
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

        {/* Reason field - only show when TA expense amount exceeds limit */}
        {exceedsLimit && (
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason (Required - TA expense exceeds limit)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter reason for exceeding TA category limit"
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
                Update Expense
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditingIndex(null);
                  form.reset({
                    description: "",
                    amount: undefined,
                    date: new Date(),
                    expenseCategoryId: "",
                    bankId: undefined,
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
                Add Another Expense
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

        {savedRecords.expenses > 0 && (
          <div className="text-sm text-muted-foreground">
            {savedRecords.expenses} expense(s) saved for this day
          </div>
        )}
      </form>
    </CardContent>
  </Card>

  {/* Added Expenses Table */}
  {addedExpenses.length > 0 && (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Added Expenses for Today</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Description</th>
                <th className="text-left p-2 font-medium">Category</th>
                <th className="text-right p-2 font-medium">Amount</th>
                <th className="text-center p-2 font-medium">Date</th>
                <th className="text-center p-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {addedExpenses.map((expense, index) => (
                <tr key={expense.tempId || index} className="border-b hover:bg-muted/50">
                  <td className="p-2">{expense.description || '-'}</td>
                  <td className="p-2">
                    {expenseCategoryList.find(c => c.id === expense.expenseCategoryId)?.name || 'Unknown'}
                  </td>
                  <td className="p-2 text-right">
                    ₹{typeof expense.amount === "number"
                      ? expense.amount.toFixed(2)
                      : parseFloat(expense.amount || "0").toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    {new Date(expense.date).toLocaleDateString('en-CA')}
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

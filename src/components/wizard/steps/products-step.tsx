"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { oilSchema } from '@/schemas/oil-schema';
import { useWizard } from '../form-wizard';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';

type OilFormValues = z.infer<typeof oilSchema>;

export const ProductsStep: React.FC<{ branchId?: string }> = ({ branchId }) => {
  const { 
    markStepCompleted, 
    markCurrentStepCompleted,
    currentStep, 
    setOnSaveAndNext,
    addedProducts,
    setAddedProducts,
    savedRecords,
    setSavedRecords,
    commonDate
  } = useWizard();
  const [isInitialized, setIsInitialized] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [productOption, setProductOptions] = useState<{ 
    productName: string;
    id: string;
    purchasePrice: number;
    sellingPrice: number;
    productUnit: string;
    branchId: string | null;
  }[]>([]);
  const router = useRouter();

  const form = useForm<OilFormValues>({
    resolver: zodResolver(oilSchema),
    defaultValues: {
      date: commonDate,
      productType: "",
      quantity: undefined,
      price: undefined,
    },
  });

  const quantity = useWatch({ control: form.control, name: "quantity" });
  const oilType = useWatch({ control: form.control, name: "productType" });

  // Auto-calculate price
  useEffect(() => {
    const quantity = form.watch("quantity") || 0;
    const selectedProductName = form.watch("productType"); 

    if (!selectedProductName) return;

    const selectedProduct = productOption.find(
      (p) => p.productName === selectedProductName
    );

    if (selectedProduct) {
      // auto calculate based on purchasePrice
      const autoPrice = quantity * selectedProduct.sellingPrice;
      form.setValue("price", Math.round(autoPrice) || 0);
    }
  }, [quantity, oilType, productOption, form]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const json = await res.json();
        
        // Filter products by branch and exclude fuel products (MS-PETROL, HSD-DIESEL, XG-DIESEL)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredProducts = json.data?.filter((product: any) => {
          // Filter by branch if branchId is provided
          const branchMatch = branchId ? product.branchId === branchId : true;
          // Exclude fuel products
          const notFuelProduct = !["HSD-DIESEL", "MS-PETROL", "XG-DIESEL"].includes(product.productName);
          return branchMatch && notFuelProduct;
        }) || [];
        
        // Deduplicate products by name, keeping the first occurrence
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uniqueProducts = filteredProducts.reduce((acc: any[], product: any) => {
          const existingProduct = acc.find(p => p.productName === product.productName);
          if (!existingProduct) {
            acc.push(product);
          }
          return acc;
        }, []) || [];
        
        setProductOptions(uniqueProducts);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to fetch products", error);
      }
    };
  
    fetchProducts();
  }, [branchId]);

  const handleSubmit = useCallback(async (values: OilFormValues): Promise<boolean> => {
    try {
      // If we're editing, use PUT/PATCH, otherwise use POST
      if (editingIndex !== null) {
        const product = addedProducts[editingIndex];
        if (product.id) {
          const res = await fetch(`/api/oils/${product.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });
          
          if (!res.ok) {
            const { error } = await res.json();
            toast.error(error || "Failed to update product");
            return false;
          }
          
          setAddedProducts(prev => prev.map((item, index) => 
            index === editingIndex ? { ...values, price: Number(values.price), id: product.id, tempId: product.tempId } : item
          ));
          toast.success("Product updated successfully");
          setEditingIndex(null);
          form.reset({
            date: new Date(),
            productType: "",
            quantity: undefined,
            price: undefined,
          });
          return true;
        } else {
          toast.info("Creating new product with updated values.");
          
          // Create a new product with the updated values
          const res = await fetch('/api/oils/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });

          if (!res.ok) {
            const response = await res.json();
            toast.error(response.error || "Failed to save oil entry");
            return false;
          }

          const response = await res.json();
          
          // Try to get ID from different possible locations
          const productId = response.id || response.data?.id || response.data?.product?.id;
          
          if (!productId) {
            toast.error("Server response missing ID - product may not be saved properly");
            return false;
          }
          
          // Update the local state with the new ID
          setAddedProducts(prev => prev.map((item, index) => 
            index === editingIndex ? { ...values, price: Number(values.price), id: productId, tempId: item.tempId } : item
          ));
          
          toast.success("Product updated and saved to database");
          setEditingIndex(null);
          form.reset({
            date: new Date(),
            productType: "",
            quantity: undefined,
            price: undefined,
          });
          router.refresh();
          return true;
        }
      } else {
        // Create new product
        const res = await fetch('/api/oils/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          const response = await res.json();
          toast.error(response.error || "Failed to save oil entry");
          return false;
        }

        const response = await res.json();
        
        // Try to get ID from different possible locations
        const productId = response.id || response.data?.id || response.data?.product?.id;
        
        if (!productId) {
          toast.error("Server response missing ID - product may not be saved properly");
          return false;
        }
        
        toast.success("Oil entry created successfully");
        setSavedRecords(prev => ({ ...prev, products: prev.products + 1 }));
        const productWithId = { ...values, price: Number(values.price), id: productId, tempId: `temp_${Date.now()}` };
        setAddedProducts(prev => [...prev, productWithId]);
        router.refresh();
        return true;
      }
    } catch (error) {
      console.error("Something went wrong:", error);
      toast.error("Something went wrong while saving oil entry");
      return false;
    }
  }, [router, editingIndex, addedProducts, form, setAddedProducts, setSavedRecords]);

  const handleAddAnother = async () => {
    const values = form.getValues();
    const result = await handleSubmit(values);
    if (result) {
      form.reset({
        date: values.date, // Keep the same date
        productType: "",
        quantity: undefined,
        price: undefined,
      });
      setEditingIndex(null);
    }
    return result;
  };

  const handleEdit = (index: number) => {
    const product = addedProducts[index];
    form.reset({
      date: product.date,
      productType: product.productType,
      quantity: product.quantity,
      price: product.price,
    });
    setEditingIndex(index);
  };

  const handleDelete = async (index: number) => {
    const product = addedProducts[index];
    if (product.id) {
      try {
        const res = await fetch(`/api/oils/${product.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          toast.error("Failed to delete product");
          return;
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product");
        return;
      }
    }
    
    setAddedProducts(prev => prev.filter((_, i) => i !== index));
    setSavedRecords(prev => ({ ...prev, products: Math.max(0, prev.products - 1) }));
    toast.success("Product deleted successfully");
  };


  // Set up the save handler only when initialized - but don't call it
  useEffect(() => {
    if (isInitialized) {
      setOnSaveAndNext(() => async () => {
        if (savedRecords.products > 0) {
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
          console.error("Error saving oil entry:", error);
          return false;
        }
      });
    }
  }, [isInitialized, savedRecords, markStepCompleted, currentStep, form, handleSubmit, setOnSaveAndNext]);

  return (
    <FormProvider {...form}>
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Products Form (Oil, AdBlue, etc.)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Oil or Gas type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productOption.map((product) => (
                          <SelectItem key={product.id} value={product.productName}>
                            {product.productName}
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Liters/Units"
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="000.00"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4">
              {editingIndex !== null ? (
                <>
                  <Button 
                    type="button" 
                    onClick={form.handleSubmit(handleSubmit)}
                    className="flex-1"
                  >
                    Update Product
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setEditingIndex(null);
                      form.reset({
                        date: new Date(),
                        productType: "",
                        quantity: undefined,
                        price: undefined,
                      });
                    }}
                    className="flex-1"
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
                  Add Another Product
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

            {savedRecords.products > 0 && (
              <div className="text-sm text-muted-foreground">
                {savedRecords.products} product(s) saved for this day
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Display Added Products */}
      {addedProducts.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Added Products for Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Product Type</th>
                    <th className="text-right p-2 font-medium">Quantity</th>
                    <th className="text-right p-2 font-medium">Price</th>
                    <th className="text-center p-2 font-medium">Date</th>
                    <th className="text-center p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {addedProducts.map((product, index) => (
                    <tr key={product.tempId || index} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="font-medium">{product.productType}</div>
                        <div className="text-sm text-muted-foreground">
                          {productOption.find(p => p.productName === product.productType)?.productUnit || 'units'}
                        </div>
                      </td>
                      <td className="p-2 text-right">
                        <div className="text-sm">{product.quantity || '-'}</div>
                      </td>
                      <td className="p-2 text-right">
                        <div className="font-medium">₹{typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(product.price || '0').toFixed(2)}</div>
                      </td>
                      <td className="p-2 text-center">
                        <div className="text-sm">{new Date(product.date).toLocaleDateString('en-CA')}</div>
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

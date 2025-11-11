"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Sales } from "@/types/sales";

interface SalesDateDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  branchId?: string;
}

interface ProductSale {
  productName: string;
  quantity: number;
  amount: number;
}

type Product = {
  productName: string;
  sellingPrice: number;
  productCategory: string;
};

export function SalesDateDetailSheet({
  open,
  onOpenChange,
  selectedDate,
  branchId,
}: SalesDateDetailSheetProps) {
  const [loading, setLoading] = useState(false);
  const [productSales, setProductSales] = useState<ProductSale[]>([]);

  const fetchProducts = useCallback(async () => {
    if (!branchId) return [];
    try {
      const res = await fetch(`/api/products?branchId=${branchId}`);
      const json = await res.json();
      return (json.data || []) as Product[];
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }, [branchId]);

  const fetchOilSales = useCallback(async (date: Date, branchId: string) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const url = new URL('/api/oils', window.location.origin);
      url.searchParams.set('date', formattedDate);
      url.searchParams.set('branchId', branchId);
      
      const res = await fetch(url.toString());
      const json = await res.json();
      return (json.oils || []) as Array<{ productType: string; quantity: number; price: number }>;
    } catch (error) {
      console.error("Error fetching oil sales:", error);
      return [];
    }
  }, []);

  const fetchSalesForDate = useCallback(async () => {
    if (!selectedDate || !branchId) return;

    setLoading(true);
    try {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      // Fetch sales, products, and oil sales in parallel
      const [salesResponse, products, oilSales] = await Promise.all([
        fetch(
          `/api/sales?filter=custom&from=${startDate.toISOString()}&to=${endDate.toISOString()}&branchId=${branchId}`
        ),
        fetchProducts(),
        fetchOilSales(selectedDate, branchId),
      ]);

      const salesData = await salesResponse.json();
      const sales = salesData.sales || [];

      // Create a map of oil product names to quantities for the date
      const oilQuantitiesMap = new Map<string, number>();
      oilSales.forEach((oil) => {
        const productName = (oil.productType || '').toUpperCase();
        const existingQty = oilQuantitiesMap.get(productName) || 0;
        oilQuantitiesMap.set(productName, existingQty + (oil.quantity || 0));
      });

      // Create a map of product names to selling prices (for fuel products)
      const productPriceMap = new Map<string, number>();
      products.forEach((product) => {
        const upperName = product.productName.toUpperCase();
        if (product.productCategory === "FUEL" && product.sellingPrice) {
          // Use the first price found for each product name (in case of duplicates)
          if (!productPriceMap.has(upperName)) {
            productPriceMap.set(upperName, product.sellingPrice);
          }
        }
      });

      // Process sales to extract product details - exactly as shown in sales form
      // Process each sale individually and aggregate
      const productsMap = new Map<string, { quantity: number; amount: number }>();

      sales.forEach((sale: Sales) => {
        // Get fuelTotals from JSON or use legacy fields
        const fuelTotals =
          sale.fuelTotals && typeof sale.fuelTotals === "object"
            ? (sale.fuelTotals as Record<string, number>)
            : {};

        // Process HSD-DIESEL - check fuelTotals first, then legacy field
        const hsdAmount = fuelTotals["HSD-DIESEL"] ?? sale.hsdDieselTotal ?? null;
        if (hsdAmount != null && hsdAmount !== undefined) {
          const existing = productsMap.get("HSD-DIESEL") || { quantity: 0, amount: 0 };
          const sellingPrice = productPriceMap.get("HSD-DIESEL") || 0;
          const qty = sellingPrice > 0 ? Number(hsdAmount) / sellingPrice : 0;
          productsMap.set("HSD-DIESEL", {
            quantity: existing.quantity + qty,
            amount: existing.amount + Number(hsdAmount),
          });
        }

        // Process XG-DIESEL - check fuelTotals first, then legacy field
        const xgAmount = fuelTotals["XG-DIESEL"] ?? sale.xgDieselTotal ?? null;
        if (xgAmount != null && xgAmount !== undefined) {
          const existing = productsMap.get("XG-DIESEL") || { quantity: 0, amount: 0 };
          const sellingPrice = productPriceMap.get("XG-DIESEL") || 0;
          const qty = sellingPrice > 0 ? Number(xgAmount) / sellingPrice : 0;
          productsMap.set("XG-DIESEL", {
            quantity: existing.quantity + qty,
            amount: existing.amount + Number(xgAmount),
          });
        }

        // Process MS-PETROL - check fuelTotals first, then legacy field
        const msAmount = fuelTotals["MS-PETROL"] ?? sale.msPetrolTotal ?? null;
        if (msAmount != null && msAmount !== undefined) {
          const existing = productsMap.get("MS-PETROL") || { quantity: 0, amount: 0 };
          const sellingPrice = productPriceMap.get("MS-PETROL") || 0;
          const qty = sellingPrice > 0 ? Number(msAmount) / sellingPrice : 0;
          productsMap.set("MS-PETROL", {
            quantity: existing.quantity + qty,
            amount: existing.amount + Number(msAmount),
          });
        }

        // Process POWER PETROL - check fuelTotals first, then legacy field
        const powerAmount =
          fuelTotals["POWER PETROL"] ??
          fuelTotals["XP 95 PETROL"] ??
          (sale as Sales & { powerPetrolTotal?: number }).powerPetrolTotal ??
          null;
        if (powerAmount != null && powerAmount !== undefined) {
          const existing = productsMap.get("POWER PETROL") || { quantity: 0, amount: 0 };
          const sellingPrice = productPriceMap.get("POWER PETROL") || 0;
          const qty = sellingPrice > 0 ? Number(powerAmount) / sellingPrice : 0;
          productsMap.set("POWER PETROL", {
            quantity: existing.quantity + qty,
            amount: existing.amount + Number(powerAmount),
          });
        }

        // Process other fuel products from fuelTotals (if any)
        Object.entries(fuelTotals).forEach(([productName, amount]) => {
          const upperName = productName.toUpperCase();
          // Skip if already processed above
          if (
            upperName !== "HSD-DIESEL" &&
            upperName !== "XG-DIESEL" &&
            upperName !== "MS-PETROL" &&
            upperName !== "POWER PETROL" &&
            upperName !== "XP 95 PETROL" &&
            amount != null
          ) {
            const existing = productsMap.get(productName) || { quantity: 0, amount: 0 };
            const sellingPrice = productPriceMap.get(upperName) || 0;
            const qty = sellingPrice > 0 ? amount / sellingPrice : 0;
            productsMap.set(productName, {
              quantity: existing.quantity + qty,
              amount: existing.amount + amount,
            });
          }
        });

        // Process products (oils, etc.) - get quantity from oil sales
        if (sale.products && typeof sale.products === "object") {
          const products = sale.products as Record<string, number>;
          Object.entries(products).forEach(([productName, amount]) => {
            if (amount != null && amount !== undefined) {
              const existing = productsMap.get(productName) || { quantity: 0, amount: 0 };
              // Get quantity from oil sales map
              const qty = oilQuantitiesMap.get(productName.toUpperCase()) || 0;
              productsMap.set(productName, {
                quantity: existing.quantity + qty,
                amount: existing.amount + Number(amount),
              });
            }
          });
        }
      });

      const productList: ProductSale[] = Array.from(productsMap.entries())
        .map(([productName, data]) => ({
          productName,
          quantity: data.quantity,
          amount: data.amount,
        }))
        .filter(p => p.amount > 0 || p.quantity > 0) // Show products with sales or quantity
        .sort((a, b) => {
          // Sort: fuel products first, then oil products
          const aIsFuel = productPriceMap.has(a.productName.toUpperCase());
          const bIsFuel = productPriceMap.has(b.productName.toUpperCase());
          if (aIsFuel && !bIsFuel) return -1;
          if (!aIsFuel && bIsFuel) return 1;
          return a.productName.localeCompare(b.productName);
        });

      setProductSales(productList);
    } catch (error) {
      console.error("Error fetching sales for date:", error);
      setProductSales([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, branchId, fetchProducts, fetchOilSales]);

  useEffect(() => {
    if (open && selectedDate && branchId) {
      fetchSalesForDate();
    }
  }, [open, selectedDate, branchId, fetchSalesForDate]);

  const handleExport = () => {
    if (!selectedDate || productSales.length === 0) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const dateStr = formatDate(selectedDate);

    doc.setFontSize(16);
    doc.text(`Sales Details - ${dateStr}`, 40, 40);

    autoTable(doc, {
      startY: 60,
      head: [["Date", "Product Name", "Sale Quantity (L)", "Sale Amount (₹)"]],
      body: productSales.map((p) => [
        dateStr,
        p.productName,
        p.quantity > 0 ? p.quantity.toFixed(2) : "-",
        p.amount.toFixed(2),
      ]),
      foot: [
        [
          "Total",
          "",
          (() => {
            const totalQty = productSales.reduce((sum, p) => sum + p.quantity, 0);
            return totalQty > 0 ? totalQty.toFixed(2) : "-";
          })(),
          productSales.reduce((sum, p) => sum + p.amount, 0).toFixed(2),
        ],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    });

    doc.save(`Sales-Details-${dateStr.replace(/\//g, "-")}.pdf`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="w-full h-[80vh] overflow-y-auto p-10">
        <SheetHeader>
          <SheetTitle>
            Sales Details - {selectedDate ? formatDate(selectedDate) : ""}
          </SheetTitle>
          <SheetDescription>
            Product-wise sales breakdown for the selected date
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : productSales.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No sales found for this date</p>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Sale Quantity</TableHead>
                    <TableHead className="text-right">Sale Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productSales.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {selectedDate ? formatDate(selectedDate) : ""}
                      </TableCell>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="text-right">
                        {product.quantity > 0 ? `${product.quantity.toFixed(2)} L` : product.quantity === 0 && product.amount > 0 ? "0.00 L" : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Sales:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(
                      productSales.reduce((sum, p) => sum + p.amount, 0)
                    )}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}


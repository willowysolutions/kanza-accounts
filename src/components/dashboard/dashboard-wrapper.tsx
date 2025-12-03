"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconBottle,
  IconCurrencyDollar,
} from "@tabler/icons-react";
import { Fuel, Calendar } from "lucide-react";
import { ChartAreaInteractive } from "@/components/dashboard/chart";
import DashboardCharts from "@/components/graphs/sales-purchase-graph";
import { CustomerDownloadButton } from "@/components/dashboard/customer-download-button";
import { CustomerHistoryModal } from "@/components/customers/customer-history-modal";
import { WizardButton } from "@/components/dashboard/wizard-button";
import { DownloadReportButton } from "@/components/dashboard/download-report-button";
import { formatDate } from "@/lib/utils";
import { formatDisplayDate } from "@/lib/date-utils";
import { convertToISTDateString } from "@/lib/date-utils";
import { Customer } from "@/types/customer";
import { useRouter, useSearchParams } from "next/navigation";

// Separate component for the customer name button (defined before use)
function CustomerNameButton({ customer }: { customer: Customer }) {
  const [openHistory, setOpenHistory] = useState(false);

  return (
    <>
      <button
        className="text-blue-600 hover:underline cursor-pointer"
        onClick={() => setOpenHistory(true)}
      >
        {customer.name}
      </button>
      
      <CustomerHistoryModal
        customerId={customer.id}
        open={openHistory}
        onOpenChange={setOpenHistory}
      />
    </>
  );
}

interface DashboardWrapperProps {
  branches: { id: string; name: string }[];
  initialSalesData: Array<{ month: string; value: number }>;
  initialPurchaseData: Array<{ month: string; value: number }>;
  allSales: Array<{
    id: string;
    date: Date;
    rate: number;
    cashPayment: number;
    atmPayment: number | null;
    paytmPayment: number | null;
    fleetPayment: number | null;
    hsdDieselTotal?: number | null;
    xgDieselTotal?: number | null;
    msPetrolTotal?: number | null;
    powerPetrolTotal?: number | null;
    fuelTotals?: Record<string, number> | null;
    branchId: string | null;
  }>;
  customers: Customer[];
  role?: string | null;
  userBranchId?: string;
  page?: number;
  stocksByBranch: Array<{
    branchId: string;
    branchName: string;
    stocks: Array<{ item: string; quantity: number; branchId: string | null }>;
  }>;
}

export function DashboardWrapper({
  branches,
  initialSalesData,
  initialPurchaseData,
  allSales,
  customers,
  role,
  userBranchId,
  page = 0,
  stocksByBranch,
}: DashboardWrapperProps) {
  const isAdmin = (role ?? "").toLowerCase() === "admin";
  const visibleBranches = isAdmin
    ? branches
    : branches.filter((b) => b.id === (userBranchId ?? ""));

  const router = useRouter();
  const searchParams = useSearchParams();

  // Common branch selector state - ensure we have a valid initial value
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    if (visibleBranches.length > 0 && visibleBranches[0]?.id) {
      return visibleBranches[0].id;
    }
    return "";
  });

  // State for products, rates, and stocks for the selected branch
  const [branchProducts, setBranchProducts] = useState<
    Array<{
      id: string;
      productName: string;
      sellingPrice: number;
      productCategory?: string;
    }>
  >([]);
  const [branchStocks, setBranchStocks] = useState<
    Array<{ item: string; quantity: number }>
  >([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Keep selectedBranchId in sync with URL branchId (for reloads / direct links)
  useEffect(() => {
    const branchParam = searchParams.get("branchId");
    if (branchParam && branchParam !== selectedBranchId) {
      setSelectedBranchId(branchParam);
    }
  }, [searchParams, selectedBranchId]);

  // Helper to build pagination hrefs while preserving current query params
  const buildPageHref = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    return `?${params.toString()}`;
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("branchId", branchId);
    params.set("page", "0"); // Reset pagination when branch changes
    router.push(`?${params.toString()}`);
  };

  // Fetch products and stocks for the selected branch
  useEffect(() => {
    const fetchBranchData = async () => {
      if (!selectedBranchId) return;

      setLoadingProducts(true);
      try {
        // Fetch products for the branch
        const productsRes = await fetch(`/api/products?branchId=${selectedBranchId}`);
        const productsData = await productsRes.json();
        const products = productsData.data || [];

        // Filter: ONLY FUEL category products AND ONLY for the selected branch
        const fuelProducts = products.filter(
          (p: { productCategory?: string; branchId?: string | null; productName: string }) => 
            p.productCategory === "FUEL" && p.branchId === selectedBranchId
        ) as Array<{
          id: string;
          productName: string;
          sellingPrice: number;
          productCategory?: string;
        }>;

        // Remove duplicates by product name (in case there are multiple entries)
        const uniqueFuelProductsMap = new Map<string, typeof fuelProducts[0]>();
        fuelProducts.forEach((p) => {
          const upperName = p.productName.toUpperCase();
          if (!uniqueFuelProductsMap.has(upperName)) {
            uniqueFuelProductsMap.set(upperName, p);
          }
        });
        const uniqueFuelProducts = Array.from(uniqueFuelProductsMap.values());

        setBranchProducts(uniqueFuelProducts);

        // Get stocks for the selected branch
        const branchStocksData =
          stocksByBranch.find((sb) => sb.branchId === selectedBranchId)?.stocks ||
          [];
        setBranchStocks(branchStocksData);
      } catch (error) {
        console.error("Failed to fetch branch data:", error);
        setBranchProducts([]);
        setBranchStocks([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchBranchData();
  }, [selectedBranchId, stocksByBranch]);

  // Get fuel products for the selected branch - ONLY show products that actually exist in the branch
  const fuelProductsToShow = useMemo(() => {
    if (branchProducts.length === 0) return [];

    // Create a map of product names (uppercase) to products for easy lookup
    const productMap = new Map<string, typeof branchProducts[0]>();
    branchProducts.forEach((product) => {
      const upperName = product.productName.toUpperCase().trim();
      // Only add if not already in map (prevent duplicates)
      if (!productMap.has(upperName)) {
        productMap.set(upperName, product);
      }
    });

    const result: typeof branchProducts = [];
    
    // 1. Always add MS-PETROL if it exists in branch products
    if (productMap.has("MS-PETROL")) {
      result.push(productMap.get("MS-PETROL")!);
    }
    
    // 2. Always add HSD-DIESEL if it exists in branch products
    if (productMap.has("HSD-DIESEL")) {
      result.push(productMap.get("HSD-DIESEL")!);
    }
    
    // 3. Add XG-DIESEL OR POWER PETROL (only if they exist in branch products)
    // Prefer XG-DIESEL, but if branch has POWER PETROL and not XG-DIESEL, show POWER PETROL
    // If branch has neither, skip this (will show only 2 cards: MS-PETROL and HSD-DIESEL)
    if (productMap.has("XG-DIESEL")) {
      result.push(productMap.get("XG-DIESEL")!);
    } else if (productMap.has("POWER PETROL")) {
      result.push(productMap.get("POWER PETROL")!);
    } else if (productMap.has("XP 95 PETROL")) {
      result.push(productMap.get("XP 95 PETROL")!);
    }
    // If branch has neither XG-DIESEL nor POWER PETROL, skip this (will show only 2-3 cards)
    
    // 4. Add 2T-OIL if it exists in branch products (optional - only if branch has it)
    if (productMap.has("2T-OIL")) {
      result.push(productMap.get("2T-OIL")!);
    }
    // Return only products that actually exist in the branch
    // Will return 2, 3, or 4 cards depending on what the branch actually has
    return result;
  }, [branchProducts]);

  // Card colors for different products
  const getCardColor = (index: number, productName: string) => {
    const colors = [
      "bg-blue-950",
      "bg-green-600",
      "bg-blue-500",
      "bg-sky-600",
    ];
    const productColors: Record<string, string> = {
      "MS-PETROL": "bg-blue-950",
      "HSD-DIESEL": "bg-blue-500",
      "XG-DIESEL": "bg-green-600",
      "POWER PETROL": "bg-purple-600",
      "XP 95 PETROL": "bg-purple-600",
      "2T-OIL": "bg-sky-600",
    };
    return (
      productColors[productName.toUpperCase()] || colors[index % colors.length]
    );
  };

  // Get icon for product
  const getProductIcon = (productName: string) => {
    const upperName = productName.toUpperCase();
    if (upperName.includes("OIL")) {
      return <IconBottle className="h-4 w-4" />;
    }
    if (upperName.includes("DIESEL") || upperName.includes("PETROL")) {
      return <Fuel className="h-4 w-4 text-white" />;
    }
    return <IconCurrencyDollar className="h-4 w-4" />;
  };

  // Filter sales and customers for selected branch
  const filteredSales = useMemo(() => {
    return allSales.filter(
      (sale) => sale.branchId === selectedBranchId
    );
  }, [allSales, selectedBranchId]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (customer) => customer.branchId === selectedBranchId
    );
  }, [customers, selectedBranchId]);

  // Pagination for customers (similar to sales report)
  const customerPageSize = 5;
  const customerPages = useMemo(() => {
    const totalPages = Math.ceil(filteredCustomers.length / customerPageSize);
    const startIndex = page * customerPageSize;
    const endIndex = startIndex + customerPageSize;
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);
    return {
      customers: paginatedCustomers,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages - 1,
      hasPrevious: page > 0,
    };
  }, [filteredCustomers, page, customerPageSize]);

  // Get meter reading data for selected branch
  const [lastMeterReadingDate, setLastMeterReadingDate] = useState<
    Date | undefined
  >(undefined);

  useEffect(() => {
    const fetchMeterReading = async () => {
      if (!selectedBranchId) return;
      try {
        const res = await fetch(
          `/api/meterreadings?branchId=${selectedBranchId}&limit=1`
        );
        const json = await res.json();
        if (json.withDifference && json.withDifference.length > 0) {
          setLastMeterReadingDate(new Date(json.withDifference[0].date));
        }
      } catch (error) {
        console.error("Failed to fetch meter reading:", error);
      }
    };
    fetchMeterReading();
  }, [selectedBranchId]);

  // Determine which fuel column to show (XG-DIESEL or POWER PETROL)
  const hasXgDiesel = useMemo(() => {
    return branchProducts.some(
      (p) => p.productName.toUpperCase() === "XG-DIESEL"
    );
  }, [branchProducts]);

  const hasPowerPetrol = useMemo(() => {
    return branchProducts.some(
      (p) =>
        p.productName.toUpperCase() === "POWER PETROL" ||
        p.productName.toUpperCase() === "XP 95 PETROL"
    );
  }, [branchProducts]);

  // Group sales by date for the selected branch
  const branchSalesMap = useMemo(() => {
    const map = new Map<
      string,
      {
        cashPayment: number;
        atmPayment: number;
        paytmPayment: number;
        fleetPayment: number;
        hsdDieselTotal: number;
        xgDieselTotal: number;
        powerPetrolTotal: number;
        msPetrolTotal: number;
        totalAmount: number;
        originalDate: string;
      }
    >();

    filteredSales.forEach((sale) => {
      const dateKey = convertToISTDateString(sale.date);
      const originalDate = convertToISTDateString(sale.date);

      // Get fuel totals from fuelTotals JSON if available, otherwise use legacy fields
      const fuelTotals =
        typeof sale.fuelTotals === "object" && sale.fuelTotals
          ? sale.fuelTotals
          : {};

      const existing = map.get(dateKey) || {
        cashPayment: 0,
        atmPayment: 0,
        paytmPayment: 0,
        fleetPayment: 0,
        hsdDieselTotal: 0,
        xgDieselTotal: 0,
        powerPetrolTotal: 0,
        msPetrolTotal: 0,
        totalAmount: 0,
        originalDate: originalDate,
      };

      // Get values from fuelTotals JSON or legacy fields
      const hsdTotal =
        fuelTotals["HSD-DIESEL"] ?? sale.hsdDieselTotal ?? 0;
      const xgTotal =
        fuelTotals["XG-DIESEL"] ?? sale.xgDieselTotal ?? 0;
      const powerTotal =
        fuelTotals["POWER PETROL"] ??
        fuelTotals["XP 95 PETROL"] ??
        sale.powerPetrolTotal ??
        0;
      const msTotal =
        fuelTotals["MS-PETROL"] ?? sale.msPetrolTotal ?? 0;

      map.set(dateKey, {
        cashPayment: existing.cashPayment + (sale.cashPayment ?? 0),
        atmPayment: existing.atmPayment + (sale.atmPayment ?? 0),
        paytmPayment: existing.paytmPayment + (sale.paytmPayment ?? 0),
        fleetPayment: existing.fleetPayment + (sale.fleetPayment ?? 0),
        hsdDieselTotal: existing.hsdDieselTotal + hsdTotal,
        xgDieselTotal: existing.xgDieselTotal + xgTotal,
        powerPetrolTotal: existing.powerPetrolTotal + powerTotal,
        msPetrolTotal: existing.msPetrolTotal + msTotal,
        totalAmount: existing.totalAmount + (sale.rate ?? 0),
        originalDate: originalDate,
      });
    });

    return map;
  }, [filteredSales]);

  const getDatesWithSalesData = (page: number = 0, pageSize: number = 5) => {
    const allDates = Array.from(branchSalesMap.keys()).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    return allDates.slice(startIndex, endIndex);
  };

  const salesRows = getDatesWithSalesData(page).map((date) => {
    const salesData =
      branchSalesMap.get(date) || {
        cashPayment: 0,
        atmPayment: 0,
        paytmPayment: 0,
        fleetPayment: 0,
        hsdDieselTotal: 0,
        xgDieselTotal: 0,
        powerPetrolTotal: 0,
        msPetrolTotal: 0,
        totalAmount: 0,
        originalDate: date,
      };
    return { date, sales: salesData };
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
        {/* Dashboard Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive overview for{" "}
            {visibleBranches.find((b) => b.id === selectedBranchId)?.name ||
              "selected branch"}
          </p>
        </div>

        {/* Common Branch Selector - Full Width Below Heading */}
        {visibleBranches.length > 1 && (
          <div className="w-full">
            <Tabs
              value={selectedBranchId}
              onValueChange={handleBranchChange}
              className="w-full"
            >
              <TabsList className="flex flex-wrap gap-2 w-full justify-start">
                {visibleBranches.map((branch) => (
                  <TabsTrigger key={branch.id} value={branch.id} className="flex-1 min-w-[120px]">
                    {branch.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Dynamic Price Cards - Based on Branch Fuel Products */}
        <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${
          fuelProductsToShow.length === 2 
            ? 'lg:grid-cols-2' 
            : fuelProductsToShow.length === 3 
            ? 'lg:grid-cols-3' 
            : fuelProductsToShow.length === 4
            ? 'lg:grid-cols-4'
            : 'lg:grid-cols-1'
        }`}>
          {loadingProducts ? (
            // Loading state - show based on expected number of products
            Array.from({ length: fuelProductsToShow.length > 0 ? fuelProductsToShow.length : 4 }).map((_, i) => (
              <Card key={i} className="bg-gray-100 text-gray-400">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription>Loading...</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <div className="text-sm mt-1">Loading stock...</div>
                </CardContent>
              </Card>
            ))
          ) : fuelProductsToShow.length > 0 ? (
            // Show fuel products for the selected branch
            fuelProductsToShow.map((product, index) => {
              const stock = branchStocks.find(
                (s) => s.item.toUpperCase() === product.productName.toUpperCase()
              );
              const cardColor = getCardColor(index, product.productName);

              return (
                <Card key={product.id} className={`${cardColor} text-white`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-white">
                      {product.productName} PRICE
                    </CardDescription>
                    {getProductIcon(product.productName)}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ₹{product.sellingPrice?.toFixed(2) ?? "N/A"}
                    </div>
                    <div className="text-sm mt-1">
                      Available Stock:{" "}
                      {stock?.quantity.toFixed(2) ?? "0.00"} L
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            // No fuel products found
            <Card className="bg-gray-100 text-gray-400 col-span-4">
              <CardHeader>
                <CardDescription>
                  No fuel products found for this branch
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Customer Details - Filtered by Selected Branch (No Branch Selector) */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b">
                    <th className="p-2">Name</th>
                    <th className="p-2">Opening</th>
                    <th className="p-2">Pending</th>
                    <th className="p-2">Branch</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customerPages.customers.length > 0 ? (
                    customerPages.customers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-muted">
                        <td className="p-2">
                          <CustomerNameButton customer={customer} />
                        </td>
                        <td className="p-2">₹{((customer as { calculatedOpeningBalance?: number }).calculatedOpeningBalance ?? customer.openingBalance)?.toFixed(2) || '0.00'}</td>
                        <td className={`p-2 ${(() => {
                          const limit = (customer as { limit?: number }).limit;
                          return limit && customer.outstandingPayments > limit ? 'text-red-600 font-semibold' : '';
                        })()}`}>
                          ₹{customer.outstandingPayments?.toFixed(2) || '0.00'}
                        </td>
                        <td className="p-2">{customer.branch?.name || '...'}</td>
                        <td className="p-2">
                          <CustomerDownloadButton customers={[customer]} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No customers found for this branch
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls for Customer Details */}
            {filteredCustomers.length > customerPageSize && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {Math.min(page * customerPageSize + 1, filteredCustomers.length)} - {Math.min((page + 1) * customerPageSize, filteredCustomers.length)} of {filteredCustomers.length} customers
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={buildPageHref(Math.max(page - 1, 0))}
                    className={`inline-flex items-center rounded-md border px-3 py-1 text-sm ${
                      !customerPages.hasPrevious ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                    }`}
                    aria-disabled={!customerPages.hasPrevious}
                  >
                    Previous
                  </a>
                  <a
                    href={buildPageHref(page + 1)}
                    className={`inline-flex items-center rounded-md border px-3 py-1 text-sm ${
                      !customerPages.hasNext ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                    }`}
                    aria-disabled={!customerPages.hasNext}
                  >
                    Next
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branch Sales Report - Filtered by Selected Branch */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Branch Sales Report</CardTitle>
              <div className="flex items-center gap-4">
                <WizardButton />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 text-red-500" />
              <span className="text-red-500">
                Last meter reading:{" "}
                {lastMeterReadingDate
                  ? formatDisplayDate(lastMeterReadingDate)
                  : "No readings yet"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b">
                    <th className="p-2">Date</th>
                    <th className="p-2">Cash Payment</th>
                    <th className="p-2">ATM Payment</th>
                    <th className="p-2">Paytm Payment</th>
                    <th className="p-2">Fleet Payment</th>
                    <th className="p-2">HSD-DIESEL</th>
                    {hasXgDiesel && <th className="p-2">XG-DIESEL</th>}
                    {!hasXgDiesel && hasPowerPetrol && (
                      <th className="p-2">POWER PETROL</th>
                    )}
                    <th className="p-2">MS-PETROL</th>
                    <th className="p-2">Total Amount</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salesRows
                    .filter(({ sales }) => {
                      return (
                        sales.cashPayment > 0 ||
                        sales.atmPayment > 0 ||
                        sales.paytmPayment > 0 ||
                        sales.fleetPayment > 0 ||
                        sales.hsdDieselTotal > 0 ||
                        sales.xgDieselTotal > 0 ||
                        sales.powerPetrolTotal > 0 ||
                        sales.msPetrolTotal > 0 ||
                        sales.totalAmount > 0
                      );
                    })
                    .map(({ date, sales }) => (
                      <tr key={date} className="border-b hover:bg-muted">
                        <td className="p-2">{formatDate(date)}</td>
                        <td className="p-2">₹{sales.cashPayment.toFixed(2)}</td>
                        <td className="p-2">₹{sales.atmPayment.toFixed(2)}</td>
                        <td className="p-2">₹{sales.paytmPayment.toFixed(2)}</td>
                        <td className="p-2">₹{sales.fleetPayment.toFixed(2)}</td>
                        <td className="p-2 text-blue-600">
                          ₹{(sales.hsdDieselTotal || 0).toFixed(2)}
                        </td>
                        {hasXgDiesel && (
                          <td className="p-2 text-blue-600">
                            ₹{(sales.xgDieselTotal || 0).toFixed(2)}
                          </td>
                        )}
                        {!hasXgDiesel && hasPowerPetrol && (
                          <td className="p-2 text-purple-600">
                            ₹{(sales.powerPetrolTotal || 0).toFixed(2)}
                          </td>
                        )}
                        <td className="p-2 text-red-600">
                          ₹{(sales.msPetrolTotal || 0).toFixed(2)}
                        </td>
                        <td className="p-2 font-bold">
                          ₹{sales.totalAmount.toFixed(2)}
                        </td>
                        <td className="p-2">
                          <DownloadReportButton
                            date={sales.originalDate}
                            branchId={selectedBranchId}
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {branchSalesMap.size > 5 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {Math.min(page * 5 + 1, branchSalesMap.size)} - {Math.min((page + 1) * 5, branchSalesMap.size)} of {branchSalesMap.size} dates
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={buildPageHref(Math.max(page - 1, 0))}
                    className={`inline-flex items-center rounded-md border px-3 py-1 text-sm ${
                      page <= 0 ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                    }`}
                    aria-disabled={page <= 0}
                  >
                    Previous
                  </a>
                  <a
                    href={buildPageHref(page + 1)}
                    className={`inline-flex items-center rounded-md border px-3 py-1 text-sm ${
                      page >= Math.ceil(branchSalesMap.size / 5) - 1
                        ? "opacity-50 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                    aria-disabled={page >= Math.ceil(branchSalesMap.size / 5) - 1}
                  >
                    Next
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales vs Purchases Graph - Use Selected Branch (No Branch Selector) */}
        <div className="w-full">
          <ChartAreaInteractive branchId={selectedBranchId} />
        </div>
        <div className="w-full">
          <DashboardCharts
            branchId={selectedBranchId}
            initialSalesData={initialSalesData}
            initialPurchaseData={initialPurchaseData}
          />
        </div>

        {/* Stock Levels - Show Selected Branch */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold">
                {visibleBranches.find((b) => b.id === selectedBranchId)?.name ||
                  "Selected Branch"}{" "}
                Stock Levels
              </h3>
              <p className="text-xs text-muted-foreground">
                {branchStocks.length} stock item
                {branchStocks.length !== 1 ? "s" : ""} in this branch
              </p>
            </div>
            <ul className="divide-y">
              {(() => {
                // Pagination for stock levels
                const stockPageSize = 5;
                const stockStartIndex = page * stockPageSize;
                const stockEndIndex = stockStartIndex + stockPageSize;
                const paginatedStocks = branchStocks.slice(stockStartIndex, stockEndIndex);
                const stockTotalPages = Math.ceil(branchStocks.length / stockPageSize);
                const stockHasNext = page < stockTotalPages - 1;
                const stockHasPrevious = page > 0;

                return (
                  <>
                    {paginatedStocks.length > 0 ? (
                      paginatedStocks.map((stock, index) => (
                        <li
                          key={`${stock.item}-${selectedBranchId}-${index}`}
                          className="flex justify-between py-2"
                        >
                          <span>{stock.item}</span>
                          <span>{(stock.quantity || 0).toFixed(2)}</span>
                        </li>
                      ))
                    ) : (
                      <li className="py-4 text-center text-sm text-muted-foreground">
                        No stock items found for this branch
                      </li>
                    )}
                    {/* Pagination Controls for Stock Levels */}
                    {branchStocks.length > stockPageSize && (
                      <li className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Showing {Math.min(stockStartIndex + 1, branchStocks.length)} - {Math.min(stockEndIndex, branchStocks.length)} of {branchStocks.length} items
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`?page=${Math.max(page - 1, 0)}`}
                              className={`inline-flex items-center rounded-md border px-3 py-1 text-sm ${
                                !stockHasPrevious ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                              }`}
                              aria-disabled={!stockHasPrevious}
                            >
                              Previous
                            </a>
                            <a
                              href={`?page=${page + 1}`}
                              className={`inline-flex items-center rounded-md border px-3 py-1 text-sm ${
                                !stockHasNext ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                              }`}
                              aria-disabled={!stockHasNext}
                            >
                              Next
                            </a>
                          </div>
                        </div>
                      </li>
                    )}
                  </>
                );
              })()}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


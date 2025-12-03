"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { StockReportExport } from "@/components/reports/stock-report-export";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { IconFileExport } from "@tabler/icons-react";

type StockReportItem = {
  product: string;
  balanceStock: number;
};

type StockReportsWithBranchTabsProps = {
  branches: { id: string; name: string }[];
  stockReportsByBranch: { 
    branchId: string; 
    branchName: string; 
    stockReport: StockReportItem[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      limit: number;
    };
  }[];
  filter: string;
  from?: Date;
  to?: Date;
  productName?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  currentPage: number;
};

export function StockReportsWithBranchTabs({ 
  branches, 
  stockReportsByBranch, 
  filter, 
  from, 
  to,
  productName,
  pagination, // eslint-disable-line @typescript-eslint/no-unused-vars
  currentPage // eslint-disable-line @typescript-eslint/no-unused-vars
}: StockReportsWithBranchTabsProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductFilter, setSelectedProductFilter] = useState(productName || "all");
  const [selectedProductForModal, setSelectedProductForModal] = useState<string | null>(null);
  const [modalDateRange, setModalDateRange] = useState<DateRange | undefined>();
  const [modalTempDateRange, setModalTempDateRange] = useState<DateRange | undefined>();
  const [isModalPopoverOpen, setIsModalPopoverOpen] = useState(false);

  // Month filter options (reuse approach from balance sheet: last 12 months up to current)
  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = format(d, "MMMM yyyy");
      options.push({ value, label });
    }

    return options;
  }, []);

  // Determine initial month (from URL range if present, otherwise current month)
  const initialMonthBase = useMemo(() => {
    if (from) return from;
    return new Date();
  }, [from]);

  const initialMonthString = useMemo(
    () =>
      `${initialMonthBase.getFullYear()}-${String(
        initialMonthBase.getMonth() + 1
      ).padStart(2, "0")}`,
    [initialMonthBase]
  );

  const [selectedMonth, setSelectedMonth] = useState(initialMonthString);

  const selectedMonthLabel = useMemo(
    () => monthOptions.find((m) => m.value === selectedMonth)?.label ?? "",
    [monthOptions, selectedMonth]
  );

  // Get unique products from the active branch only for filter dropdown
  const allProducts = useMemo(() => {
    const branchData = stockReportsByBranch.find(b => b.branchId === activeBranch);
    if (!branchData) return [];
    
    const productSet = new Set<string>();
    branchData.stockReport.forEach(item => {
      productSet.add(item.product);
    });
    return Array.from(productSet).sort();
  }, [stockReportsByBranch, activeBranch]);

  // Get filtered and searched data for active branch
  const getFilteredData = useCallback((branchId: string) => {
    const branchData = stockReportsByBranch.find(b => b.branchId === branchId);
    if (!branchData) return [];

    let filtered = branchData.stockReport;

    // Filter by product
    if (selectedProductFilter !== "all") {
      filtered = filtered.filter(item => item.product === selectedProductFilter);
    }

    // Search filter (by product name only)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) =>
        item.product.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedProductFilter, searchQuery, stockReportsByBranch]);

  const filteredData = getFilteredData(activeBranch);

  // Aggregate by product for main table: show only product and available stock
  // Deduplicate by product so each product appears only once
  const aggregatedByProduct = useMemo(() => {
    const data = getFilteredData(activeBranch);
    const byProduct = new Map<string, number>();

    data.forEach((item) => {
      // Last balanceStock wins; all rows for a product should have same stock anyway
      byProduct.set(item.product, item.balanceStock);
    });

    return Array.from(byProduct.entries())
      .map(([product, availableStock]) => ({ product, availableStock }))
      .sort((a, b) => a.product.localeCompare(b.product));
  }, [activeBranch, getFilteredData]);

  // History data for modal: fetched separately via API for the selected product
  type ProductHistoryItem = {
    date: string;
    purchaseQty: number;
    saleQty: number;
  };

  const [productHistory, setProductHistory] = useState<ProductHistoryItem[]>([]);

  // Fetch base history for selected product & month when modal opens
  useEffect(() => {
    if (!selectedProductForModal) {
      setProductHistory([]);
      return;
    }

    const fetchHistory = async () => {
      try {
        const params = new URLSearchParams({
          productName: selectedProductForModal,
          branchId: activeBranch,
        });
        if (from) params.set("from", from.toISOString());
        if (to) params.set("to", to.toISOString());

        const res = await fetch(`/api/stocks/product-history?${params.toString()}`);
        if (!res.ok) {
          setProductHistory([]);
          return;
        }
        const json = await res.json();
        setProductHistory(json.history || []);
      } catch {
        setProductHistory([]);
      }
    };

    fetchHistory();
  }, [selectedProductForModal, activeBranch, from, to]);

  // Apply optional custom date range inside the modal
  const historyForSelectedProduct = useMemo(() => {
    let base = [...productHistory];

    if (modalDateRange?.from && modalDateRange?.to) {
      const start = new Date(modalDateRange.from);
      start.setHours(0, 0, 0, 0);
      const end = new Date(modalDateRange.to);
      end.setHours(23, 59, 59, 999);

      base = base.filter((item) => {
        const d = new Date(item.date);
        return d >= start && d <= end;
      });
    }

    return base.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [productHistory, modalDateRange]);

  const handleExportHistoryPDF = () => {
    if (!selectedProductForModal || historyForSelectedProduct.length === 0) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);

    const monthPart = selectedMonthLabel || "All Dates";
    doc.text(
      `Stock History - ${selectedProductForModal} (${monthPart})`,
      40,
      40
    );

    const tableBody = historyForSelectedProduct.map((item) => [
      format(new Date(item.date), "dd/MM/yyyy"),
      item.purchaseQty.toFixed(2),
      item.saleQty.toFixed(2),
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["Date", "Purchase Qty", "Sale Qty"]],
      body: tableBody,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
    });

    const safeProduct = selectedProductForModal.replace(/\s+/g, "-");
    const safeMonth = monthPart.replace(/\s+/g, "-");
    doc.save(`Stock-History-${safeProduct}-${safeMonth}.pdf`);
  };

  // Month change handler: updates URL with from/to for the selected month
  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    if (!value) return;

    const [yearStr, monthStr] = value.split("-");
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1; // 0-based

    if (Number.isNaN(year) || Number.isNaN(monthIndex)) return;

    const fromDate = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const toDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    const url = new URL(window.location.href);
    url.searchParams.set("filter", "custom");
    url.searchParams.set("from", fromDate.toISOString());
    url.searchParams.set("to", toDate.toISOString());
    url.searchParams.set("page", "1");
    window.location.href = url.toString();
  };


  // Handle product filter change
  const handleProductFilterChange = (value: string) => {
    setSelectedProductFilter(value);
    const url = new URL(window.location.href);
    if (value === "all") {
      url.searchParams.delete('productName');
    } else {
      url.searchParams.set('productName', value);
    }
    window.location.href = url.toString();
  };

  // Reset product filter when branch changes
  useEffect(() => {
    if (selectedProductFilter !== "all") {
      // Check if selected product exists in new branch
      const branchData = stockReportsByBranch.find(b => b.branchId === activeBranch);
      const productExists = branchData?.stockReport.some(item => item.product === selectedProductFilter);
      if (!productExists) {
        setSelectedProductFilter("all");
        const url = new URL(window.location.href);
        url.searchParams.delete('productName');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeBranch, stockReportsByBranch, selectedProductFilter]);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Stock Reports</h1>
            <p className="text-muted-foreground">Stock reports by branch</p>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">
                Month
              </span>
              <Select
                value={selectedMonth}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="w-[220px] bg-white">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Tabs value={activeBranch} onValueChange={setActiveBranch} className="w-full">
          <TabsList className="mb-4 flex flex-wrap gap-2 w-full">
            {branches.map((branch) => (
              <TabsTrigger key={branch.id} value={branch.id}>
                {branch.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {stockReportsByBranch.map(({ branchId, branchName, stockReport, pagination: branchPagination }) => (
            <TabsContent key={branchId} value={branchId}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branchName} Stock Report</h2>
                <p className="text-sm text-muted-foreground">
                  {branchPagination?.totalCount ?? stockReport.length} record{(branchPagination?.totalCount ?? stockReport.length) !== 1 ? 's' : ''} in this branch ({filter})
                </p>
              </div>
              
              <Card className="p-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Stock Report</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Summary of stock movements ({filter})
                    </p>
                  </div>
                  <StockReportExport 
                    stockReport={filteredData} 
                    branchName={branchName}
                    filter={filter} 
                    from={from} 
                    to={to} 
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filters */}
                  <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Filter by Product:</label>
                      <Select value={selectedProductFilter} onValueChange={handleProductFilterChange}>
                        <SelectTrigger className="w-[200px] bg-white">
                          <SelectValue placeholder="All Products" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Products</SelectItem>
                          {allProducts.map((product) => (
                            <SelectItem key={product} value={product}>
                              {product}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Search:</label>
                      <Input
                        placeholder="Search by product or date..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-[250px] bg-white"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableCaption>Current stock by product.</TableCaption>
                      <TableHeader className="bg-blue-950">
                        <TableRow>
                          <TableHead className="text-white">Product</TableHead>
                          <TableHead className="text-white text-right">
                            Available Stock
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aggregatedByProduct.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={2}
                              className="text-center text-muted-foreground"
                            >
                              No stock records found for this branch
                            </TableCell>
                          </TableRow>
                        ) : (
                          aggregatedByProduct.map((item) => (
                            <TableRow
                              key={item.product}
                              className="cursor-pointer hover:bg-muted"
                              onClick={() =>
                                setSelectedProductForModal(item.product)
                              }
                            >
                              <TableCell className="font-medium">
                                <button
                                  type="button"
                                  className="text-blue-600 hover:underline cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProductForModal(item.product);
                                  }}
                                >
                                  {item.product}
                                </button>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {item.availableStock.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Product history modal: purchase & sale qty by date */}
              <Dialog
                open={!!selectedProductForModal}
                onOpenChange={(open) =>
                  setSelectedProductForModal(open ? selectedProductForModal : null)
                }
              >
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>
                      Stock History - {selectedProductForModal}
                    </DialogTitle>
                  </DialogHeader>

                  {/* Modal filters & export */}
                  <div className="mb-3 flex gap-3 items-center justify-between">
                    <Popover
                      open={isModalPopoverOpen}
                      onOpenChange={(open) => {
                        setIsModalPopoverOpen(open);
                        if (open) {
                          setModalTempDateRange(modalDateRange);
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 bg-white"
                        >
                          <CalendarIcon className="h-4 w-4" />
                          {modalDateRange?.from && modalDateRange?.to
                            ? `${format(
                                modalDateRange.from,
                                "dd/MM/yyyy"
                              )} - ${format(
                                modalDateRange.to,
                                "dd/MM/yyyy"
                              )}`
                            : "Pick date range"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={modalTempDateRange || modalDateRange}
                          onSelect={setModalTempDateRange}
                          numberOfMonths={2}
                        />
                        <div className="p-3 border-t flex gap-2">
                          {(modalTempDateRange?.from &&
                            modalTempDateRange?.to) ||
                          (modalDateRange?.from && modalDateRange?.to) ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setModalTempDateRange(undefined);
                                  setModalDateRange(undefined);
                                  setIsModalPopoverOpen(false);
                                }}
                              >
                                Clear
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setModalDateRange(modalTempDateRange);
                                  setIsModalPopoverOpen(false);
                                }}
                                disabled={
                                  !modalTempDateRange?.from ||
                                  !modalTempDateRange?.to
                                }
                              >
                                Apply
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Button
                      onClick={handleExportHistoryPDF}
                      disabled={
                        !selectedProductForModal ||
                        historyForSelectedProduct.length === 0
                      }
                      className="bg-black text-white flex items-center gap-2"
                    >
                      <IconFileExport className="h-4 w-4" />
                      Export
                    </Button>
                  </div>

                  <div className="overflow-x-auto max-h-[60vh]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">
                            Purchase Qty
                          </TableHead>
                          <TableHead className="text-right">Sale Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyForSelectedProduct.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="text-center text-muted-foreground"
                            >
                              No history for this product in the selected range.
                            </TableCell>
                          </TableRow>
                        ) : (
                          historyForSelectedProduct.map((item, index) => (
                            <TableRow
                              key={`${item.date}-${index}`}
                            >
                              <TableCell>{formatDate(item.date)}</TableCell>
                              <TableCell className="text-right">
                                {item.purchaseQty.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.saleQty.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}


"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
import { FilterSelect } from "@/components/filters/filter-select";
import { CustomDateFilter } from "@/components/filters/custom-date-filter";
import { StockReportExport } from "@/components/reports/stock-report-export";
import { PaginationControls } from "@/components/ui/pagination-controls";

type StockReportItem = {
  product: string;
  date: Date | string;
  purchaseQty: number;
  saleQty: number;
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

  // Server-side pagination navigation
  const goToPage = (page: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    window.location.href = url.toString();
  };

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
  const getFilteredData = (branchId: string) => {
    const branchData = stockReportsByBranch.find(b => b.branchId === branchId);
    if (!branchData) return [];

    let filtered = branchData.stockReport;

    // Filter by product
    if (selectedProductFilter !== "all") {
      filtered = filtered.filter(item => item.product === selectedProductFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.product.toLowerCase().includes(query) ||
        formatDate(item.date).toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredData = getFilteredData(activeBranch);


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
          <div className="flex gap-3">
            <FilterSelect defaultValue={filter} />
            <CustomDateFilter />
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
                      <TableCaption>A summary of stock movements.</TableCaption>
                      <TableHeader className="bg-blue-950">
                        <TableRow>
                          <TableHead className="text-white">Product</TableHead>
                          <TableHead className="text-white">Date</TableHead>
                          <TableHead className="text-white text-right">Purchase Qty</TableHead>
                          <TableHead className="text-white text-right">Sale Qty</TableHead>
                          <TableHead className="text-white text-right">Balance Stock</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              No stock records found for this branch
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredData.map((item, index) => (
                            <TableRow key={`${item.product}-${item.date}-${index}`}>
                              <TableCell className="font-medium">
                                {item.product}
                              </TableCell>
                              <TableCell>
                                {formatDate(item.date)}
                              </TableCell>
                              <TableCell className="text-right">{item.purchaseQty.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{item.saleQty.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-medium">
                                {item.balanceStock.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination Controls */}
                  {branchPagination && branchPagination.totalCount > 0 && (
                    <PaginationControls
                      currentPage={branchPagination.currentPage}
                      totalPages={branchPagination.totalPages}
                      onPageChange={goToPage}
                      totalItems={branchPagination.totalCount}
                      itemsPerPage={branchPagination.limit}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}


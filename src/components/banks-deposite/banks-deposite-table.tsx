"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useEffect, useCallback } from "react";
import { BankDepositeTableProps } from "@/types/bank-deposite";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function BankDepositeTable<TValue>({
  columns,
  data: initialData,
  branchId,
}: BankDepositeTableProps<TValue> & { branchId?: string }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 15
  });

  // Fetch data from API with pagination
  const fetchData = useCallback(async (page: number, searchTerm: string = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15'
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (branchId) {
        params.append('branchId', branchId);
      }

      const response = await fetch(`/api/bank-deposite?${params.toString()}`);
      const result = await response.json();
      
      if (response.ok) {
        setData(result.bankDeposite);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error('Error fetching bank deposits:', error);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  // Initial data load
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setData(initialData);
    } else {
      fetchData(1);
    }
  }, [initialData, fetchData]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (globalFilter !== "") {
        fetchData(1, globalFilter);
      } else {
        fetchData(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [globalFilter, fetchData]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const category = row.getValue("bank") as string;

      const filter = String(filterValue || "").toLowerCase();

      return (
        category?.toLowerCase().includes(filter)
      );
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-2">
            <CardTitle>Bank Deposites</CardTitle>
            <CardDescription>A list of all Bank Deposites</CardDescription>
          </div>

        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="bg-primary text-primary-foreground font-black"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* API Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {data.length} of {pagination.totalCount} records
              {pagination.totalPages > 1 && (
                <span> • Page {pagination.currentPage} of {pagination.totalPages}</span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData(pagination.currentPage - 1, globalFilter)}
                disabled={!pagination.hasPrevPage || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData(pagination.currentPage + 1, globalFilter)}
                disabled={!pagination.hasNextPage || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

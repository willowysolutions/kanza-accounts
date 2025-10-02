"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  SortingState,
  getSortedRowModel,
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
import { PaymentHistoryTableProps } from "@/types/payment-history";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { PaymentEditModal } from "./payment-edit-modal";
import { PaymentDeleteModal } from "./payment-delete-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PaymentHistoryTable<TValue>({ columns, data: initialData, branchId }: PaymentHistoryTableProps<TValue> & { branchId?: string }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    id: string;
    paidAmount: number;
    paymentMethod: string;
    paidOn: Date;
    customerId?: string;
    supplierId?: string;
    branchId?: string;
    customer?: { name: string; id: string; branchId?: string };
    supplier?: { name: string; id: string; branchId?: string };
  } | null>(null);
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

      const response = await fetch(`/api/payments/history?${params.toString()}`);
      const result = await response.json();
      
      if (response.ok) {
        setData(result.paymentHistory);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  const handleEditPayment = (payment: {
    id: string | number;
    paidAmount: number;
    paymentMethod: string;
    paidOn: string | Date;
    customerId?: string;
    supplierId?: string;
    branchId?: string;
    customer?: { name?: string; id?: string; branchId?: string };
    supplier?: { name?: string; id?: string; branchId?: string };
  }) => {
    setSelectedPayment({
      id: String(payment.id),
      paidAmount: payment.paidAmount,
      paymentMethod: payment.paymentMethod,
      paidOn: new Date(payment.paidOn),
      customerId: payment.customerId,
      supplierId: payment.supplierId,
      branchId: payment.branchId,
      customer: payment.customer?.name ? { 
        name: payment.customer.name, 
        id: payment.customer.id || payment.customerId || '',
        branchId: payment.customer.branchId || payment.branchId
      } : undefined,
      supplier: payment.supplier?.name ? { 
        name: payment.supplier.name, 
        id: payment.supplier.id || payment.supplierId || '',
        branchId: payment.supplier.branchId || payment.branchId
      } : undefined,
    });
    setEditModalOpen(true);
  };

  const handleDeletePayment = (payment: {
    id: string | number;
    paidAmount: number;
    paymentMethod: string;
    paidOn: string | Date;
    customerId?: string;
    supplierId?: string;
    branchId?: string;
    customer?: { name?: string; id?: string; branchId?: string };
    supplier?: { name?: string; id?: string; branchId?: string };
  }) => {
    setSelectedPayment({
      id: String(payment.id),
      paidAmount: payment.paidAmount,
      paymentMethod: payment.paymentMethod,
      paidOn: new Date(payment.paidOn),
      customerId: payment.customerId,
      supplierId: payment.supplierId,
      branchId: payment.branchId,
      customer: payment.customer?.name ? { 
        name: payment.customer.name, 
        id: payment.customer.id || payment.customerId || '',
        branchId: payment.customer.branchId || payment.branchId
      } : undefined,
      supplier: payment.supplier?.name ? { 
        name: payment.supplier.name, 
        id: payment.supplier.id || payment.supplierId || '',
        branchId: payment.supplier.branchId || payment.branchId
      } : undefined,
    });
    setDeleteModalOpen(true);
  };

  const handlePaymentUpdated = () => {
    // Refresh the data
    fetchData(pagination.currentPage, globalFilter);
  };

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

  // Create columns with handlers
  const columnsWithHandlers = columns.map((column: unknown) => {
    if ((column as { id?: string }).id === "actions") {
      return {
        ...(column as Record<string, unknown>),
        cell: ({ row }: { row: { original: unknown } }) => {
          const payment = row.original as {
            id: string | number;
            paidAmount: number;
            paymentMethod: string;
            paidOn: string | Date;
            customer?: { name?: string };
            supplier?: { name?: string };
          };

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditPayment(payment)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDeletePayment(payment)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      };
    }
    return column;
  });

  const table = useReactTable({
    data,
    columns: columnsWithHandlers as typeof columns,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      globalFilter,
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Payments History</CardTitle>
          <CardDescription>A list of all payments history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end gap-4 mb-4 items-center">
            {/* Customer */}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-600 " />
              <span className="text-sm text-gray-700">Customer</span>
            </div>

            {/* Supplier */}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-600" />
              <span className="text-sm text-gray-700">Supplier</span>
            </div>
          </div>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="">
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
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
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
      
      {/* Edit Modal */}
      <PaymentEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        payment={selectedPayment}
        onPaymentUpdated={handlePaymentUpdated}
      />
      
      {/* Delete Modal */}
      <PaymentDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        payment={selectedPayment}
        onPaymentDeleted={handlePaymentUpdated}
      />
    </div>
  );
}

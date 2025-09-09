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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { ExpenseTableProps } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";

export function ExpenseTable<TValue>({ columns, data }: ExpenseTableProps<TValue>) {
      const [sorting, setSorting] = useState<SortingState>([]);
      const [globalFilter, setGlobalFilter] = useState("");
    
  const table = useReactTable({
      data,
      columns,
      onSortingChange: setSorting,
      onGlobalFilterChange: setGlobalFilter,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getSortedRowModel: getSortedRowModel(),
      globalFilterFn: (row, columnId, filterValue) => {
        const title = row.getValue('title') as string;
        const description = row.getValue('description') as string;
        const category = row.getValue('category') as string

        const filter = String(filterValue || '').toLowerCase();

        return title.toLowerCase().includes(filter) || 
        description.toLocaleLowerCase().includes(filter) || 
        category.toLocaleLowerCase().includes(filter) 
      },
      state: {
        sorting,
        globalFilter,
      },
    });

    const totalExpenseAmount = data.reduce((acc, row) => acc + (row?.amount ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
    <Card>
      <CardHeader>
          <div className="space-y-2">
            <CardTitle>Expenses</CardTitle>
            <CardDescription>A list of all Expenses</CardDescription>
          </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="bg-primary text-primary-foreground font-black">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
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

          <TableFooter className="bg-muted/50 text-sm font-medium border-t">
              <TableRow>
                <TableCell colSpan={3} />
                <TableCell className="text-center border-r-2">Total:</TableCell>
                <TableCell className="border-r-2">{formatCurrency(totalExpenseAmount)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
        </Table>
      </CardContent>
    </Card>
    </div>
  );
}

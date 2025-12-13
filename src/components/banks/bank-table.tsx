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
import { formatCurrency } from "@/lib/utils";
import { BankTableProps } from "@/types/bank";

export function BankTable<TValue>({ columns, data }: BankTableProps<TValue>) {
      const [sorting, setSorting] = useState<SortingState>([]);
      const [globalFilter, setGlobalFilter] = useState("");
    
  const resolvedColumns = typeof columns === 'function' ? columns() : columns;
    
  const table = useReactTable({
      data,
      columns: resolvedColumns,
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

    const totalBankBalance = data.reduce((acc, row) => acc + (row?.balanceAmount ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
    <Card>
      <CardHeader>
          <div className="space-y-2">
            <CardTitle>Banks</CardTitle>
            <CardDescription>A list of all Banks</CardDescription>
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
                <TableCell colSpan={2} />
                <TableCell className="text-center border-r-2">Balance:</TableCell>
                <TableCell className="border-r-2">{formatCurrency(totalBankBalance)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
        </Table>
      </CardContent>
    </Card>
    </div>
  );
}

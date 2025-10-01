'use client';

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { SalesFormModal } from "./sales-form";
import { SalesDeleteDialog } from "./sales-delete-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Sales } from "@/types/sales";

export const salesColumns = (userRole?: string): ColumnDef<Sales>[] => [
  {
    accessorKey: "date",
    header: "Date & Time",
    cell:({row}) => {
      const dateTime = row.original.date
      return (
        <div>{formatDate(dateTime)}</div>
      )
    }
  },
  {
    accessorKey:"cashPayment",
    header:"Cash Payment",
    cell: ({row}) => {
      const cashPayment = row.original.cashPayment
      return (
        <div>{formatCurrency(cashPayment)}</div>
      )
    }
  },
  {
    accessorKey:"atmPayment",
    header:"ATM Payment",
    cell: ({row}) => {
      const atmPayment = row.original.atmPayment
      return (
        <div>{formatCurrency(atmPayment)}</div>
      )
    }
  },
  {
    accessorKey:"paytmPayment",
    header:"Paytm Payment",
    cell: ({row}) => {
      const paytmPayment = row.original.paytmPayment
      return (
        <div>{formatCurrency(paytmPayment)}</div>
      )
    }
  },
  {
    accessorKey:"fleetPayment",
    header:"Fleet Payment",
    cell: ({row}) => {
      const fleetPayment = row.original.fleetPayment
      return (
        <div>{formatCurrency(fleetPayment)}</div>
      )
    }
  },
  {
    accessorKey:"hsdDieselTotal",
    header:"HSD-DIESEL",
    cell: ({row}) => {
      const hsdDieselTotal = row.original.hsdDieselTotal
      return (
        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium bg-blue-100 text-blue-800`}>
        {formatCurrency(hsdDieselTotal)}
        </div>
      )
    }
  },
  {
    accessorKey:"xgDieselTotal",
    header:"XG-DIESEL",
    cell: ({row}) => {
      const xgDieselTotal = row.original.xgDieselTotal
      return (
        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium bg-green-100 text-green-800`}>
        {formatCurrency(xgDieselTotal)}
        </div>
      )
    }
  },
  {
    accessorKey:"msPetrolTotal",
    header:"MS-PETROL",
    cell: ({row}) => {
      const msPetrolTotal = row.original.msPetrolTotal
      return (
        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium bg-red-100 text-red-800`}>
        {formatCurrency(msPetrolTotal)}
        </div>
      )
    }
  },
  {
    accessorKey: "rate",
    header: "Total Amount",
    cell:({row}) => {
      const rate = row.original.rate

      return (
        <div>
          {formatCurrency(rate)}
        </div>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <SalesActions sales={row.original} userRole={userRole} />,
  },
];

const SalesActions = ({ sales, userRole }: { sales: Sales; userRole?: string }) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  // Only show actions for admin users
  const isAdmin = userRole?.toLowerCase() === 'admin';
  
  if (!isAdmin) {
    return null; // Don't show actions for non-admin users
  }

  return (
    <>
      <div className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setOpenEdit(true)}>
              <Edit2 className="size-4 mr-2" /> Edit
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={() => setOpenDelete(!openDelete)}
              className="text-destructive">
              <Trash2 className="size-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SalesFormModal open={openEdit} openChange={setOpenEdit} sales={sales}/>

      <SalesDeleteDialog 
        sales={sales}
        open={openDelete}
        setOpen={setOpenDelete}/>
    </>
  );
};

'use client';

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Sales } from "@/types/sales";
import { ReportModal } from "./report-modal";

export const reportColumns: ColumnDef<Sales>[] = [
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
    header:"Cash Payment"
  },
  {
    accessorKey:"atmPayment",
    header:"ATM Payment"
  },
  {
    accessorKey:"paytmPayment",
    header:"Paytm Payment"
  },
  {
    accessorKey:"fleetPayment",
    header:"Fleet Payment"
  },
  {
    accessorKey:"oilT2Total",
    header:"2T-OIL",
    cell: ({row}) => {
      const oilT2Total = row.original.oilT2Total
      return (
        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium bg-black text-white`}>
        {formatCurrency(oilT2Total)}
        </div>
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
    accessorKey:"xzDieselTotal",
    header:"XZ-DIESEL",
    cell: ({row}) => {
      const xzDieselTotal = row.original.xgDieselTotal
      return (
        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium bg-blue-100 text-blue-800`}>
        {formatCurrency(xzDieselTotal)}
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
    cell: ({ row }) => <SalesActions sales={row.original} />,
  },
];

const SalesActions = ({ sales }: { sales: Sales }) => {
  const [openReport, setOpenReport] = useState(false);

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
            <DropdownMenuItem
              onSelect={() => setOpenReport(true)}
              className="text-destructive"
            >
              <Eye className="size-4 mr-2" /> View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ReportModal
        open={openReport}
        onOpenChange={setOpenReport}
        date={sales.date}
      />
    </>
  );
};


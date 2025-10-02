"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";
import { PaymentHistory } from "@/types/payment-history";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

export const paymentHistoryColumns: ColumnDef<PaymentHistory>[] = [
  {
    accessorKey: "party",
    header: "Name",
    cell: ({ row }) => {
      const customer = row.original.customer?.name;
      const supplier = row.original.supplier?.name;

      if (customer) {
        return (
          <span className="px-2 py-1 rounded-lg text-green-800 bg-green-100">
            {customer}
          </span>
        );
      }

      if (supplier) {
        return (
          <span className="px-2 py-1 rounded-lg text-red-800 bg-red-100">
            {supplier}
          </span>
        );
      }

      return <span>-</span>;
    },
  },
  {
    accessorKey: "paidAmount",
    header: "Amount",
    cell: ({ row }) => (
      <div>₹ {row.original.paidAmount.toFixed(2)}</div>
    ),
  },
  {
    accessorKey: "paymentMethod",
    header: "Payment Method",
  },
  {
    accessorKey: "paidOn",
    header: "Date",
    cell: ({ row }) => {
      const date = row.original.paidOn;
      return <div>{formatDate(date)}</div>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => console.log("Edit payment:", payment.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log("Delete payment:", payment.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

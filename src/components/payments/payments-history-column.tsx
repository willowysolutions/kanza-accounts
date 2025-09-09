"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";
import { PaymentHistory } from "@/types/payment-history";

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
];

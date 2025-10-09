'use client';

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { SalesFormModal } from "./sales-form";
import { SalesDeleteDialog } from "./sales-delete-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Sales } from "@/types/sales";

export const salesColumns = (userRole?: string): ColumnDef<Sales>[] => [
  {
    accessorKey: "date",
    header: "Date & Time",
    cell: ({ row }) => {
      const dateTime = row.original.date;
      return <div>{formatDate(dateTime)}</div>;
    },
  },
  {
    accessorKey: "cashPayment",
    header: "Cash Payment",
    cell: ({ row }) => <div>{formatCurrency(row.original.cashPayment)}</div>,
  },
  {
    accessorKey: "atmPayment",
    header: "ATM Payment",
    cell: ({ row }) => <div>{formatCurrency(row.original.atmPayment)}</div>,
  },
  {
    accessorKey: "paytmPayment",
    header: "Paytm Payment",
    cell: ({ row }) => <div>{formatCurrency(row.original.paytmPayment)}</div>,
  },
  {
    accessorKey: "fleetPayment",
    header: "Fleet Payment",
    cell: ({ row }) => <div>{formatCurrency(row.original.fleetPayment)}</div>,
  },
  {
    accessorKey: "hsdDieselTotal",
    header: "HSD-DIESEL",
    cell: ({ row }) => (
      <div className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
        {formatCurrency(row.original.hsdDieselTotal)}
      </div>
    ),
  },
  {
    accessorKey: "xgDieselTotal",
    header: "XG-DIESEL",
    cell: ({ row }) => (
      <div className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
        {formatCurrency(row.original.xgDieselTotal)}
      </div>
    ),
  },
  {
    accessorKey: "msPetrolTotal",
    header: "MS-PETROL",
    cell: ({ row }) => (
      <div className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-medium text-red-800">
        {formatCurrency(row.original.msPetrolTotal)}
      </div>
    ),
  },
  {
    accessorKey: "rate",
    header: "Total Amount",
    cell: ({ row }) => <div>{formatCurrency(row.original.rate)}</div>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <SalesActions sales={row.original} userRole={userRole} />,
  },
];

const SalesActions = ({
  sales,
  userRole,
}: {
  sales: Sales;
  userRole?: string;
}) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const isAdmin = userRole?.toLowerCase() === "admin";
  if (!isAdmin) return null;

  return (
    <>
      <div className="flex justify-end items-center gap-2">
        {/* Edit Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpenEdit(true)}
          title="Edit Sale"
          className="h-8 w-8"
        >
          <Edit2 className="h-4 w-4" />
        </Button>

        {/* Delete Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpenDelete(true)}
          title="Delete Sale"
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Edit Modal */}
      <SalesFormModal open={openEdit} openChange={setOpenEdit} sales={sales} />

      {/* Delete Modal */}
      <SalesDeleteDialog
        sales={sales}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </>
  );
};

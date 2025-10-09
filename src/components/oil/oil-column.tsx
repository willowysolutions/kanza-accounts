"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OilFormModal } from "./oil-form";
import { OilDeleteDialog } from "./oil-delete-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Oil } from "@/types/oils";

export const oilColumns: ColumnDef<Oil>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.original.date;
      return <div>{formatDate(date)}</div>;
    },
  },
  {
    accessorKey: "branchId",
    header: "Branch",
    cell: ({ row }) => {
      const branch = row.original.branch?.name;
      return <div>{branch || "—"}</div>;
    },
  },
  {
    accessorKey: "productType",
    header: "Product Name",
    cell: ({ row }) => <div className="px-3">{row.original.productType}</div>,
  },
  {
    accessorKey: "quantity",
    header: "Sale Quantity",
    cell: ({ row }) => {
      const quantity = row.original.quantity;
      return <div className="px-3">{quantity} L</div>;
    },
  },
  {
    accessorKey: "price",
    header: "Amount (₹)",
    cell: ({ row }) => {
      const price = row.original.price;
      return <div className="px-3">{formatCurrency(price)}</div>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <OilActions oil={row.original} />,
  },
];

const OilActions = ({ oil }: { oil: Oil }) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Edit Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpenEdit(true)}
        className="h-8 w-8 p-0"
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpenDelete(true)}
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Edit Form */}
      <OilFormModal
        open={openEdit}
        openChange={setOpenEdit}
        oil={oil}
        userRole="admin"
        userBranchId={oil.branchId || undefined}
      />

      {/* Delete Dialog */}
      <OilDeleteDialog
        oil={oil}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};

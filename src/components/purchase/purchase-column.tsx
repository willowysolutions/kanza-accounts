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
import { Purchase } from "@/types/purchase";
import { PurchaseFormModal } from "./purchase-form";

export const purchaseColumns: ColumnDef<Purchase>[] = [
  {
    accessorKey: "purchaseNumber",
    header: "Po no",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "supplier",
    header: "Supplier",
  },
  {
    accessorKey: "product",
    header: "Product",
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
  },
  {
    accessorKey: "rate",
    header: "Rate",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "deliveryDate",
    header: "Delivery Date",
  },
  {
    id: "actions",
    cell: ({ row }) => <PurchaseActions purchase={row.original} />,
  },
];

const PurchaseActions = ({ }: { purchase: Purchase }) => {
  const [openEdit, setOpenEdit] = useState(false);
  // const [openDelete, setOpenDelete] = useState(false); // Enable when delete modal is added

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
            <DropdownMenuItem onClick={() => setOpenEdit(true)}>
              <Edit2 className="size-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="size-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <PurchaseFormModal open={openEdit} openChange={setOpenEdit} />
    </>
  );
};

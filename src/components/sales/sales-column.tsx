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
import { Sales } from "@/types/sales";
import { SalesFormModal } from "./sales-form";

export const salesColumns: ColumnDef<Sales>[] = [
  {
    accessorKey: "transactionId",
    header: "Po no",
  },
  {
    accessorKey: "date",
    header: "Date & Time",
  },
  {
    accessorKey: "customer",
    header: "Customer",
  },
  {
    accessorKey: "nozzle",
    header: "Nozzle",
  },
  {
    accessorKey: "Fuel",
    header: "Fuel Type",
  },
  {
    accessorKey: "quantity",
    header: "Qty (L)",
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
    accessorKey: "paymentMethod",
    header: "Payment Method",
  },
  {
    accessorKey: "attendant",
    header: "Attendant",
  },
  {
    id: "actions",
    cell: ({ row }) => <SalesActions sales={row.original} />,
  },
];

const SalesActions = ({ }: { sales: Sales }) => {
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

      <SalesFormModal open={openEdit} openChange={setOpenEdit} />
    </>
  );
};

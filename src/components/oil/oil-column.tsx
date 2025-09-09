"use client";

import { Oil } from "@prisma/client";
import { OilFormModal } from "./oil-form";

import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { OilDeleteDialog } from "./oil-delete-dialog";
import { formatDate } from "@/lib/utils";

export const oilColumns: ColumnDef<Oil>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({row}) => {
        const date = row.original.date;
        return (
            <div>{formatDate(date)}</div>
        )
    }
  },
  {
    accessorKey: "productType",
    header: "Name"
  },
  {
    accessorKey:"quantity",
    header:"Quantity",
    cell: ({row}) => {
        const quantity = row.original.quantity;
        return (
            <div className="px-3">{quantity} L</div>
        )
    }
  },
  {
    accessorKey: "price",
    header: "Price"
  },
  {
    id: "action",
    cell: ({ row }) =>
      row.original && <OilsDropdeownMenu oil={row.original} />,
  },
];

export const OilsDropdeownMenu = ({ oil }: { oil: Oil }) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setOpenEdit(!openEdit)}>
            <Edit2 className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => setOpenDelete(!openDelete)}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <OilFormModal open={openEdit} openChange={setOpenEdit} oil={oil} />

      {/* Dialogs */}
      <OilDeleteDialog
        oil={oil}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};

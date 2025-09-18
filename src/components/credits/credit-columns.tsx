"use client";

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
import { Credit } from "@/types/credits";
import { CreditFormDialog } from "./credit-form";
import { CreditDeleteDialog } from "./credit-delete-dailog";
import { formatCurrency, formatDate } from "@/lib/utils";

export const creditColumns: ColumnDef<Credit>[] = [
  {
    accessorFn: (row) => row.customer?.name ?? "",
    id: "customerName",
    header: "Customer",
    cell: ({ getValue }) => <div>{getValue<string>()}</div>,
  },
  {
    accessorKey: "branchId",
    header: "Branch",
    cell: ({ row }) => {
      const branch = row.original.branch.name;
      return <div>{branch ? String(branch) : "..."}</div>;
    },
  },
  {
    accessorKey: "fuelType",
    header: "Fuel Type",
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => <div className="px-3">{row.getValue("quantity")}</div>,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      return <span>{formatCurrency(amount)}</span>;
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({row}) => {
      const date = row.original.date

      return (
        <div>
          {formatDate(date)}
        </div>
      )
    }
  },
  {
    id: "action",
    cell: ({ row }) =>
      row.original && <CreditDropdownMenu credit={row.original} />,
  },
];

export const CreditDropdownMenu = ({ credit }: { credit: Credit }) => {
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
          <DropdownMenuItem onSelect={() => setOpenEdit(true)}>
            <Edit2 className="size-4 mr-2" />
            Edit 
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => setOpenDelete(true)}
          >
            <Trash2 className="size-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreditFormDialog
        open={openEdit}
        openChange={setOpenEdit}
        credits={credit}
      />

      <CreditDeleteDialog
        credits={credit}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};

"use client";
import { BankDepositeFormDialog } from "./banks-deposite-form";

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
import { BankDepositeDeleteDialog } from "./banks-deposite-delete-dailog";
import { BankDeposite } from "@/types/bank-deposite";
import { formatDate } from "@/lib/utils";

export const bankDepositeColumns: ColumnDef<BankDeposite>[] = [
  {
    accessorKey: "date",
    header :"Date",
    cell: ({row}) => {
      const date = row.original.date
      return (
        <div>{formatDate(date)}</div>
      )
    }
  },
  {
    accessorKey: "bank",
    header: "Bank",
    cell: ({row}) => {
      const bank = row.original.bank.bankName;
      return (
        <div>{bank}</div>
      )
    }
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
    accessorKey: "amount",
    header: "Amount",
  },
  {
    id: "action",
    cell: ({ row }) =>
      row.original && <BankDepositeDropdeownMenu bankDeposite={row.original} />,
  },
];

export const BankDepositeDropdeownMenu = ({ bankDeposite }: { bankDeposite: BankDeposite }) => {
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
      <BankDepositeFormDialog open={openEdit} openChange={setOpenEdit} bankDeposite={bankDeposite} />

      {/* Dialogs */}
      <BankDepositeDeleteDialog
        bankDeposite={bankDeposite}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};

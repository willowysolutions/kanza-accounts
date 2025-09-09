"use client";
import { BankFormDialog } from "./bank-form";

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
import { Bank } from "@prisma/client";
import { BankDeleteDialog } from "./bank-delete-dailog";

export const bankColumns: ColumnDef<Bank>[] = [
  {
    accessorKey: "bankName",
    header :"Bank Name"
  },
  {
    accessorKey: "accountNumber",
    header: "Account Number",
  },
  {
    accessorKey: "ifse",
    header: "IFSE",
  },
  {
    accessorKey: "balanceAmount",
    header: "Balance",
  },
  {
    id: "action",
    cell: ({ row }) =>
      row.original && <BankDropdeownMenu bank={row.original} />,
  },
];

export const BankDropdeownMenu = ({ bank }: { bank: Bank }) => {
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
      <BankFormDialog open={openEdit} openChange={setOpenEdit} bank={bank} />

      {/* Dialogs */}
      <BankDeleteDialog
        bank={bank}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};

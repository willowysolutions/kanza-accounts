"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { BankFormDialog } from "./bank-form";
import { BankDeleteDialog } from "./bank-delete-dailog";
import { Bank } from "@prisma/client";

export const bankColumns: ColumnDef<Bank>[] = [
  {
    accessorKey: "bankName",
    header: "Bank Name",
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
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <BankActions bank={row.original} />,
  },
];

const BankActions = ({ bank }: { bank: Bank }) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <div className="flex gap-2">
      {/* Edit Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpenEdit(true)}
        className="text-blue-600 hover:text-blue-700"
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpenDelete(true)}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Edit Dialog */}
      <BankFormDialog open={openEdit} openChange={setOpenEdit} bank={bank} />

      {/* Delete Dialog */}
      <BankDeleteDialog open={openDelete} setOpen={setOpenDelete} bank={bank} />
    </div>
  );
};

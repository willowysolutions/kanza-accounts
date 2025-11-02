"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BankDepositeFormDialog } from "./banks-deposite-form";
import { BankDepositeDeleteDialog } from "./banks-deposite-delete-dailog";
import { BankDeposite } from "@/types/bank-deposite";
import { formatDate } from "@/lib/utils";

export const bankDepositeColumns = (
  userRole?: string
): ColumnDef<BankDeposite>[] => {
  const isAdmin = userRole?.toLowerCase() === "admin";
  
  const columns: ColumnDef<BankDeposite>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.original.date;
        return <div>{formatDate(date)}</div>;
      },
    },
    {
      accessorKey: "bank",
      header: "Bank",
      cell: ({ row }) => {
        const bank = row.original.bank.bankName;
        return <div>{bank}</div>;
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
    },
  ];

  // Only add Actions column for admin users
  if (isAdmin) {
    columns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) =>
        row.original && (
          <BankDepositeInlineActions
            bankDeposite={row.original}
            userRole={userRole}
          />
        ),
    });
  }

  return columns;
};

export const BankDepositeInlineActions = ({
  bankDeposite,
  userRole,
}: {
  bankDeposite: BankDeposite;
  userRole?: string;
}) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const isAdmin = userRole?.toLowerCase() === "admin";
  if (!isAdmin) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Edit Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpenEdit(true)}
        className="h-8 w-8 text-blue-600 hover:text-blue-800"
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpenDelete(true)}
        className="h-8 w-8 text-destructive hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Edit Dialog */}
      <BankDepositeFormDialog
        open={openEdit}
        openChange={setOpenEdit}
        bankDeposite={bankDeposite}
      />

      {/* Delete Dialog */}
      <BankDepositeDeleteDialog
        bankDeposite={bankDeposite}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};

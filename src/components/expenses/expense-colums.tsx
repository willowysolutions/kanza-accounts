"use client";
import { Expense } from "@/types/expense";
import { ExpenseFormDialog } from "./expense-form";

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
import { ExpenseDeleteDialog } from "./expense-delete-dailog"
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

export const expenseColumns: ColumnDef<Expense>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
        const date = row.getValue("date") as string | Date;
        return (
        <div>
            {date ? formatDate(date) : "-"}
        </div>
        );
    },
    },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
    const expenseCategory = row.original.category.name;
        return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium bg-blue-100 text-blue-800`}>
            {expenseCategory}
        </span>
        );
    }
  },
  {
    accessorKey: "description",
    header: "Description",
     cell: ({row}) => {
        const description = row.getValue("description");
        return (
            <div className="px-3">
                {description ? String(description) : "..."}
            </div>
        )
    }
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
    const amount = row.getValue("amount") as number;
    return <div className="font-medium">{formatCurrency(amount)}</div>;
    }
  },
  {
    id: "action",
    cell: ({ row }) =>
      row.original && <ExpenseDropdeownMenu expense={row.original} />,
  },
];

export const ExpenseDropdeownMenu = ({ expense }: { expense: Expense }) => {
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
      <ExpenseFormDialog open={openEdit} openChange={setOpenEdit} expense={expense} />

      {/* Dialogs */}
      <ExpenseDeleteDialog
        expense={expense}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};

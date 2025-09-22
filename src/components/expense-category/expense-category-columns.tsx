"use client";

import { ExpenseCategory, Expense } from "@prisma/client";

type ExpenseCategoryWithExpenses = ExpenseCategory & {
  expenses: Expense[];
};
import { ExpenseCategoryFormDialog } from "./expense-category-form";

import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseCategoryDeleteDialog } from "./expense-category-delete-dailog";
import { useState } from "react";

export const expenseCategoryColumns: ColumnDef<ExpenseCategoryWithExpenses>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      const renderIcon = () => {
        if (!sort) return <ArrowUpDown className="size-4" />;
        if (sort === "asc") return <ArrowUp className="size-4" />;
        if (sort === "desc") return <ArrowDown className="size-4" />;
        return null;
      };

      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(sort === "asc")}
        >
          Name
          {renderIcon()}
        </Button>
      );
    },
    cell: ({ row }) =>  <div className="px-3">{row.getValue('name') as string}</div>,
  },
  {
    accessorKey: "limit",
    header: "Limit",
    cell: ({ row }) => {
      const limit = row.getValue('limit') as number | null;
      return (
        <div>
          {limit ? `₹${limit.toFixed(2)}` : 'No limit'}
        </div>
      );
    },
  },
  {
    id: "balanceLimit",
    header: "Balance Limit",
    cell: ({ row }) => {
      const expenseCategory = row.original;
      const limit = expenseCategory.limit;
      const totalExpenses = expenseCategory.expenses?.reduce((sum: number, expense: Expense) => sum + expense.amount, 0) || 0;
      const exceedsLimit = limit && totalExpenses > limit;
      
      return (
        <div className={` ${exceedsLimit ? 'text-red-600 font-semibold' : ''}`}>
          ₹{totalExpenses.toFixed(2)}
        </div>
      );
    },
  },
  {
    id: "action",
    cell: ({ row }) =>
      row.original && <ExpenseCategoryDropdeownMenu expenseCategory={row.original} />,
  },
];

export const ExpenseCategoryDropdeownMenu = ({ expenseCategory }: { expenseCategory: ExpenseCategoryWithExpenses }) => {
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
      <ExpenseCategoryFormDialog open={openEdit} openChange={setOpenEdit} expenseCategory={expenseCategory} />

      {/* Dialogs */}
      <ExpenseCategoryDeleteDialog
        expenseCategory={expenseCategory}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};

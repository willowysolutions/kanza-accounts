"use client";

import { ExpenseCategory, Expense } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { ExpenseCategoryFormDialog } from "./expense-category-form";
import { ExpenseCategoryDeleteDialog } from "./expense-category-delete-dailog";
import { useState } from "react";

type ExpenseCategoryWithExpenses = ExpenseCategory & {
  expenses: Expense[];
};

export const expenseCategoryColumns = (userRole?: string): ColumnDef<ExpenseCategoryWithExpenses>[] => {
  const isGm = (userRole?.toLowerCase() === "gm");
  
  const columns: ColumnDef<ExpenseCategoryWithExpenses>[] = [
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
            className="font-semibold"
          >
            Name
            {renderIcon()}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="px-3">{row.getValue("name") as string}</div>
      ),
    },
    {
      accessorKey: "limit",
      header: "Limit",
      cell: ({ row }) => {
        const limit = row.getValue("limit") as number | null;
        return <div>{limit ? `₹${limit.toFixed(2)}` : "No limit"}</div>;
      },
    },
    {
      id: "balanceLimit",
      header: "Balance Limit",
      cell: ({ row }) => {
        const expenseCategory = row.original;
        const limit = expenseCategory.limit;
        const totalExpenses =
          expenseCategory.expenses?.reduce(
            (sum: number, expense: Expense) => sum + expense.amount,
            0
          ) || 0;
        const exceedsLimit = limit && totalExpenses > limit;

        return (
          <div
            className={`${exceedsLimit ? "text-red-600 font-semibold" : ""}`}
          >
            ₹{totalExpenses.toFixed(2)}
          </div>
        );
      },
    },
  ];

  // Only add Actions column for non-GM users
  if (!isGm) {
    columns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <ExpenseCategoryActions expenseCategory={row.original} />
      ),
    });
  }

  return columns;
};

const ExpenseCategoryActions = ({
  expenseCategory,
}: {
  expenseCategory: ExpenseCategoryWithExpenses;
}) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <div className="flex justify-start items-center gap-2">
      {/* Edit */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpenEdit(true)}
        className="text-blue-600 hover:text-blue-700"
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpenDelete(true)}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Edit Dialog */}
      <ExpenseCategoryFormDialog
        open={openEdit}
        openChange={setOpenEdit}
        expenseCategory={expenseCategory}
      />

      {/* Delete Dialog */}
      <ExpenseCategoryDeleteDialog
        expenseCategory={expenseCategory}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};

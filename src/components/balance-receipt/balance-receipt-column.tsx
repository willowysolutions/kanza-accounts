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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { BalanceReceipt } from "@/types/balance-receipt";
import { BalanceReceiptFormDialog } from "./balance-receipt-form";
import { formatCurrency } from "@/lib/utils";

export const balanceReceiptColumn: ColumnDef<BalanceReceipt>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const d = new Date(row.getValue("date"));
      return <span>{format(d, "PP")}</span>;
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      const rowDate = new Date(row.getValue(id) as string | Date);
      const filterDate = new Date(value as string | Date);
      return isSameDay(rowDate, filterDate);
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "branch",
    header: "Branch",
    cell: ({row}) => {
        const branch = row.original.branch;
        return (
            <div>{branch.name}</div>
        )
    }
  },
  {
    accessorKey: "amount",
    header: "Balance Amount",
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      return <span>{formatCurrency(amount)}</span>;
    },
  },
  {
      id: "action",
      cell: ({ row }) =>
        row.original && <BalanceReceiptDropdownMenu balanceReceipt={row.original} />,
    },
];

export const BalanceReceiptDropdownMenu = ({ balanceReceipt }: { balanceReceipt: BalanceReceipt }) => {
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
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <BalanceReceiptFormDialog open={openEdit} openChange={setOpenEdit} balanceReceipt={balanceReceipt} />
    </div>
  );
};

'use client';

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { PurchaseFormModal } from "./purchase-form";
import { PurchaseDeleteDialog } from "./purchase-delete-dialog";
import { Purchase } from "@/types/purchase";
import { formatCurrency, formatDate} from "@/lib/utils"

export const purchaseColumns: ColumnDef<Purchase>[] = [
  {
    accessorKey: "branchId",
    header: "Branch",
    cell: ({ row }) => {
      const branch = row.original.branch.name;
      return <div>{branch ? String(branch) : "..."}</div>;
    },
  },
  {
      accessorKey: "date",
      header: "Date & Time",
      cell:({row}) => {
        const dateTime = row.original.date
        return (
          <div>{formatDate(dateTime)}</div>
        )
      }
    },
  {
    accessorKey: "supplier",
    header: "Supplier",
    cell: ({row}) => {
      const supplier = row.original.supplier?.name

      return (
        <span>
          {supplier}
        </span>
      )
    }
  },
  {
    accessorKey: "productType",
    header: "Product",
    cell: ({ row }) => {
    const productType = row.original.productType;

    const productTypeColorMap: Record<string, string> = {
      'XP-DIESEL': "bg-green-100 text-green-800",
      'HSD-DIESEL': "bg-blue-100 text-blue-800",
      'MS-PETROL': "bg-red-100 text-red-800",
    };

        const colorClasses = productTypeColorMap[productType] || "bg-gray-100 text-gray-800";

        return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${colorClasses}`}>
            {productType}
        </span>
        );
    },
    enableColumnFilter:true,
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
  },
  {
    accessorKey: "purchasePrice",
    header: "Amount",
    cell: ({row}) => {
      const total = row.original.purchasePrice
      return (
        <div>{formatCurrency(total)}</div>
      )
    }
  },
  {
    accessorKey: "paidAmount",
    header: "Amount Paid",
    cell: ({row}) => {
      const totalPaid = row.original.paidAmount
      return (
        <div>{formatCurrency(totalPaid)}</div>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <PurchaseActions purchase={row.original} />,
  },
];

const PurchaseActions = ({ purchase }: { purchase: Purchase }) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false); 

  return (
    <>
      <div className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setOpenEdit(true)}>
              <Edit2 className="size-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setOpenDelete(!openDelete)}
            className="text-destructive">
              <Trash2 className="size-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <PurchaseFormModal open={openEdit} openChange={setOpenEdit} purchase={purchase}/>

      <PurchaseDeleteDialog 
        purchase={purchase}
        open={openDelete}
        setOpen={setOpenDelete}/>
    </>
  );
};

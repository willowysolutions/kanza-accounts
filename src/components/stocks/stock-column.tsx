'use client';
import { ColumnDef } from "@tanstack/react-table";
import { Stock } from "@/types/stocks";

export const stockColumns:ColumnDef<Stock>[] = [
  {
    accessorKey: "item",
    header: "Item",
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
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({row}) => {
      const quantity = row.original.quantity
      return (
        <div>{quantity.toFixed(2)}</div>
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
];

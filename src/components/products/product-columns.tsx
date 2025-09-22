"use client";

import { Product } from "@/types/product";
import { ProductFormDialog } from "./product-form";
import { ProductDeleteDialog } from "./product-delete-dailog";
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

export const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "productName",
    header: "Product Name",
    cell: ({ row }) => <div className="px-3">{row.getValue("productName") as string}</div>,
  },
  {
    accessorKey: "productUnit",
    header: "Unit",
    cell: ({ row }) => <div>{row.getValue("productUnit")}</div>,
  },
  {
    accessorKey: "purchasePrice",
    header: "Purchase Price",
    cell: ({ row }) => <div className="px-3">{row.getValue("purchasePrice")}</div>,
  },
  {
    accessorKey: "sellingPrice",
    header: "Selling Price",
    cell: ({ row }) => <div className="px-3">{row.getValue("sellingPrice")}</div>,
  },
  {
    id: "action",
    cell: ({ row }) =>
      row.original && <ProductDropdownMenu product={row.original} />,
  },
];

export const ProductDropdownMenu = ({ product }: { product: Product }) => {
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
          <DropdownMenuItem onSelect={() => setOpenEdit(true)}>
            <Edit2 className="size-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => setOpenDelete(true)}
          >
            <Trash2 className="size-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProductFormDialog
        open={openEdit}
        openChange={setOpenEdit}
        products={product}
      />

      <ProductDeleteDialog
        product={product}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};

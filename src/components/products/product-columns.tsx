"use client";

import { ProductType } from "@/types/product";
import { ProductFormDialog } from "./product-form";
import { ProductDeleteDialog } from "./product-delete-dailog";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { useState } from "react";

export const productColumns = (userRole?: string, userBranchId?: string): ColumnDef<ProductType>[] => [
  {
    accessorKey: "productName",
    header: "Product Name",
    cell: ({ row }) => <div className="px-3">{row.getValue("productName")}</div>,
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
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ProductActions product={row.original} userRole={userRole} userBranchId={userBranchId} />,
  },
];

const ProductActions = ({
  product,
  userRole,
  userBranchId,
}: {
  product: ProductType;
  userRole?: string;
  userBranchId?: string;
}) => {
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

      {/* Edit Form */}
      <ProductFormDialog
        open={openEdit}
        openChange={setOpenEdit}
        products={product}
        userRole={userRole}
        userBranchId={userBranchId}
      />

      {/* Delete Dialog */}
      <ProductDeleteDialog
        product={product}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};

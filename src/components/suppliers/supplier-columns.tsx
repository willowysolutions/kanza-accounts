"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { SupplierFormDialog } from "./supplier-form";
import { SupplierDeleteDialog } from "./supplier-delete-dailog";
import { Supplier } from "@prisma/client";
import { useUser } from "./supplier-table";

export const supplierColumns = (isGm?: boolean): ColumnDef<Supplier>[] => {
  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "SupplierId",
      header: ({ column }) => {
        const sort = column.getIsSorted();
        const renderIcon = () => {
          if (!sort) return <ArrowUpDown className="size-4" />;
          if (sort === "asc") return <ArrowUp className="size-4" />;
          if (sort === "desc") return <ArrowDown className="size-4" />;
          return null;
        };

        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(sort === "asc")}>
            Supplier Id {renderIcon()}
          </Button>
        );
      },
      cell: ({ row }) => <div className="px-3">{row.getValue("SupplierId") as string}</div>,
    },
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
          <Button variant="ghost" onClick={() => column.toggleSorting(sort === "asc")}>
            Name {renderIcon()}
          </Button>
        );
      },
      cell: ({ row }) => <div className="px-3">{row.getValue("name") as string}</div>,
    },
    {
      accessorKey: "openingBalance",
      header: "Opening",
      cell: ({ row }) => <div>{row.getValue("openingBalance")}</div>,
    },
    {
      accessorKey: "outstandingPayments",
      header: "Pending",
      cell: ({ row }) => <div>{row.getValue("outstandingPayments")}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="px-3">{row.getValue("email") || "..."}</div>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <div className="px-3">{row.getValue("phone") || "..."}</div>,
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => <div className="px-3">{row.getValue("address") || "..."}</div>,
    },
  ];

  if (!isGm) {
    columns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => <SupplierActions supplier={row.original} />,
    });
  }

  return columns;
};

const SupplierActions = ({ supplier }: { supplier: Supplier }) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const { userRole, userBranchId } = useUser();

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

      {/* Edit Modal */}
      <SupplierFormDialog
        open={openEdit}
        openChange={setOpenEdit}
        suppliers={supplier}
        userRole={userRole}
        userBranchId={userBranchId}
      />

      {/* Delete Modal */}
      <SupplierDeleteDialog
        supplier={supplier}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};

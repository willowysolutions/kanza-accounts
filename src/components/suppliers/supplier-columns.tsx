"use client";

import { Supplier } from "@prisma/client";
import { SupplierFormDialog } from "./supplier-form";
import { SupplierDeleteDialog } from "./supplier-delete-dailog";
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
import { useState } from "react";

export const supplierColumns: ColumnDef<Supplier>[] = [
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
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(sort === "asc")}
        >
          Supplier Id
          {renderIcon()}
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
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(sort === "asc")}
        >
          Name
          {renderIcon()}
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
    cell: ({row}) => {
        const email = row.getValue("email");
        return (
            <div className="px-3">
                {email ? String(email) : "..."}
            </div>
        )
    }
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({row}) => {
        const phone = row.getValue("phone");
        return (
            <div className="px-3">
                {phone ? String(phone) : "..."}
            </div>
        )
    }
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({row}) => {
        const address = row.getValue("address");
        return (
            <div className="px-3">
                {address ? String(address) : "..."}
            </div>
        )
    }
  },
  
  {
    id: "action",
    cell: ({ row }) =>
      row.original && <SupplierDropdownMenu supplier={row.original} />,
  },
];

export const SupplierDropdownMenu = ({ supplier }: { supplier: Supplier }) => {
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

      <SupplierFormDialog
        open={openEdit}
        openChange={setOpenEdit}
        suppliers={supplier}
      />

      <SupplierDeleteDialog
        supplier={supplier}
        open={openDelete}
        setOpen={setOpenDelete}
      />
    </div>
  );
};

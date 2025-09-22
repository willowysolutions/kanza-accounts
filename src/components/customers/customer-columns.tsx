"use client";

import { CustomerFormDialog } from "./customer-form";
import { CustomerDeleteDialog } from "./customer-delete-dailog";
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
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CustomerHistoryModal } from "./customer -history-modal";
import { Customer } from "@/types/customer";

export const customerColumns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: function NameCell({ row }) {
      const customer = row.original;
      const [openHistory, setOpenHistory] = useState(false);

      return (
        <>
          <button
            className="text-blue-600 hover:underline cursor-pointer"
            onClick={() => setOpenHistory(true)}
          >
            {customer.name}
          </button>
  
          <CustomerHistoryModal
            customerId={customer.id}
            open={openHistory}
            onOpenChange={setOpenHistory}
          />
        </>
      );
    },
  },  
  {
    accessorKey: "limit",
    header: "Limit",
  },
  {
    accessorKey: "openingBalance",
    header: "Opening",
  },
  {
    accessorKey: "outstandingPayments",
    header: "Pending",
    cell: ({ row }) => {
      const customer = row.original;
      const pendingAmount = customer.outstandingPayments;
      const limit = (customer as { limit?: number }).limit;
      const exceedsLimit = limit && pendingAmount > limit;
      
      return (
        <div className={`px-3 ${exceedsLimit ? 'text-red-600 font-semibold' : ''}`}>
          {pendingAmount}
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email");
      return <div className="px-3">{email ? String(email) : "..."}</div>;
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.getValue("phone");
      return <div className="px-3">{phone ? String(phone) : "..."}</div>;
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      const address = row.getValue("address");
      return <div className="px-3">{address ? String(address) : "..."}</div>;
    },
  },
  {
    id: "action",
    cell: ({ row }) =>
      row.original && <CustomerDropdownMenu customer={row.original} />,
  },
];

export const CustomerDropdownMenu = ({ customer }: { customer: Customer }) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

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
          <DropdownMenuItem onSelect={() => setOpenHistory(true)}>
            <History className="size-4 mr-2" />
            History
          </DropdownMenuItem>
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

      {/* Edit Dialog */}
      <CustomerFormDialog
        open={openEdit}
        openChange={setOpenEdit}
        customers={customer}
      />

      {/* Delete Dialog */}
      <CustomerDeleteDialog
        customers={customer}
        open={openDelete}
        setOpen={setOpenDelete}
      />

      <CustomerHistoryModal
        customerId={customer.id}
        open={openHistory}
        onOpenChange={setOpenHistory}
      />
    </div>
  );
};

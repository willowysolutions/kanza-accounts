'use client';

import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NozzleFormModal } from "./nozzle-form";
import { Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { Nozzle } from "@/types/nozzle";

export const nozzleColumns: ColumnDef<Nozzle>[] = [
  {
    accessorKey: "nozzleNumber",
    header: "Nozzle#",
  },
  {
    accessorKey: "machine",
    header: "Machine",
  },
  {
    accessorKey: "fuelType",
    header: "Fuel Type",
  },
  {
    accessorKey: "initialHours",
    header: "Hours Meter",
  },
  {
    id: "actions",
    cell: ({ row }) => <StockActions nozzle={row.original} />,
  },
];

const StockActions = ({  }: { nozzle: Nozzle }) => {
  const [openEdit, setOpenEdit] = useState(false);
  // const [openDelete, setOpenDelete] = useState(false); // Uncomment when delete modal is used

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
            <DropdownMenuItem onClick={() => setOpenEdit(true)}>
              <Edit2 className="size-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="size-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <NozzleFormModal open={openEdit} openChange={setOpenEdit} />
    </>
  );
};

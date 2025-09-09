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
import { NozzleDeleteDialog } from "./nozzle-delete-dialog";
import { Nozzle } from "@/types/nozzle";

export const nozzleColumns: ColumnDef<Nozzle>[] = [
  {
    accessorKey: "nozzleNumber",
    header: "Nozzle#",
  },
  {
    accessorKey: "machine",
    header: "Machine",
    cell: ({row}) => {
      const machine = row.original.machine?.machineName

      return (
        <span>
          {machine}
        </span>
      )
    }
  },
  {
    accessorKey: "fuelType",
    header: "Fuel Type",
    cell: ({ row }) => {
    const fuelType = row.original.fuelType;

    const fuelTypeColorMap: Record<string, string> = {
      'XG-DIESEL': "bg-green-100 text-green-800",
      'HSD-DIESEL': "bg-blue-100 text-blue-800",
      'MS-PETROL': "bg-red-100 text-red-800",
    };

        const colorClasses = fuelTypeColorMap[fuelType] || "bg-gray-100 text-gray-800";

        return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${colorClasses}`}>
            {fuelType}
        </span>
        );
    },
    enableColumnFilter:true,
  },
  {
    accessorKey:"openingReading",
    header: "Opening Reading"
  },
  {
    id: "actions",
    cell: ({ row }) => <StockActions nozzle={row.original} />,
  },
];

const StockActions = ({ nozzle }: { nozzle: Nozzle }) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false); // Uncomment when delete modal is used

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
            <DropdownMenuItem onSelect={() => setOpenDelete(!openEdit)}
              className="text-destructive">
              <Trash2 className="size-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <NozzleFormModal open={openEdit} openChange={setOpenEdit} nozzle={nozzle}/>

      <NozzleDeleteDialog 
        nozzle={nozzle}
        open={openDelete}
        setOpen={setOpenDelete}/>
    </>
  );
};

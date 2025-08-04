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
import { MeterReading } from "@/types/meter-reading";
import { MeterReadingFormModal } from "./meter-reading-form";

export const meterReadinColumns: ColumnDef<MeterReading>[] = [
  {
    accessorKey: "dateTime",
    header: "Date & Time",
  },
  {
    accessorKey: "nozzle",
    header: "Nozzle",
  },
  {
    accessorKey: "fuelType",
    header: "Fuel Type",
  },
  {
    accessorKey: "readingType",
    header: "Reading Type",
  },
  {
    accessorKey: "meterReading",
    header: "Current Reading",
  },
  {
    accessorKey: "difference",
    header: "Difference",
  },
  {
    accessorKey: "attendant",
    header: "Attendant",
  },
  {
    id: "actions",
    cell: ({ row }) => <MeterReadingActions meterReading={row.original} />,
  },
];

const MeterReadingActions = ({ }: { meterReading: MeterReading }) => {
  const [openEdit, setOpenEdit] = useState(false);
  // const [openDelete, setOpenDelete] = useState(false); // Enable when delete modal is added

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

      <MeterReadingFormModal open={openEdit} openChange={setOpenEdit} />
    </>
  );
};

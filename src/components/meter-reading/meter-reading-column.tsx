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
import { MeterReadingDeleteDialog } from "./meter-delete-dialog";
import { MeterReading } from "@/types/meter-reading";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MeterReadingUpdateForm } from "./meter-reading-update-form";

export const meterReadinColumns = (userRole?: string): ColumnDef<MeterReading>[] => [
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
    accessorKey: "nozzleId",
    header: "Nozzle",
    cell: ({row}) => {
      const nozzle = row.original.nozzle.nozzleNumber

      return (
        <span>
          {nozzle}
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
      'MS-PETROL': "bg-red-100 text-red-800",
      'HSD-DIESEL': "bg-blue-100 text-blue-800",
      'XG-DIESEL': "bg-green-100 text-green-800",
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
    accessorKey: "openingReading",
    header: "Opening",  
  },
  {
    accessorKey: "closingReading",
    header: "Closing",
    
  },
  {
    accessorKey: "difference",
    header: "Difference",
    cell: ({row}) => {
      const difference = row.original.difference
      return (
        <div>{difference?.toFixed(2)}</div>
      )
    }
  },
  {
    accessorKey: "totalAmount",
    header: "Total Sold",
    cell: ({row}) => {
      const soldAmount = row.original.totalAmount
      return (
        <div>{formatCurrency(soldAmount)}</div>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <MeterReadingActions meterReading={row.original} userRole={userRole} />,
  },
];

const MeterReadingActions = ({ meterReading, userRole }: { meterReading: MeterReading; userRole?: string }) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);  

  // Only show actions for admin users
  const isAdmin = userRole?.toLowerCase() === 'admin';
  
  if (!isAdmin) {
    return null; // Don't show actions for non-admin users
  }

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
        <MeterReadingUpdateForm open={openEdit} openChange={setOpenEdit} meterReading={meterReading}/>
        <MeterReadingDeleteDialog 
          meterReading={meterReading}
          open={openDelete}
          setOpen={setOpenDelete}
        />
      </div>

    </>
  );
};

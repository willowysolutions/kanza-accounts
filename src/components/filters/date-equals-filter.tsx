"use client";

import * as React from "react";
import { Table as RTTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format, startOfDay } from "date-fns";

type Props<TData> = {
  table: RTTable<TData>;
  columnId: string; // e.g. "date"
  label?: string;
};

export function DateEqualsFilter<TData>({ table, columnId, label = "Date" }: Props<TData>) {
  const column = table.getColumn(columnId);
  const raw = column?.getFilterValue() as string | Date | undefined;
  const selected = raw ? new Date(raw) : undefined;

  const setDate = (d?: Date) => {
    if (!column) return;
    column.setFilterValue(d ? startOfDay(d).toISOString() : undefined);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {selected ? `${label}: ${format(selected, "PP")}` : `${label}: Pick a date`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => setDate(d)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {selected && (
        <Button variant="ghost" className="h-9 px-2" onClick={() => setDate(undefined)}>
          <X className="h-4 w-4" />
          <span className="sr-only">Clear date</span>
        </Button>
      )}
    </div>
  );
}

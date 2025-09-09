"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

export function CustomDateFilter() {
  const router = useRouter();
  const params = useSearchParams();

  const [range, setRange] = useState<DateRange | undefined>({
  from: params.get("from") ? new Date(params.get("from")!) : undefined,
  to: params.get("to") ? new Date(params.get("to")!) : undefined,
});

  function applyFilter() {
    const query = new URLSearchParams(params.toString());
    query.set("filter", "custom");
    if (range?.from) query.set("from", range.from.toISOString());
    if (range?.to) query.set("to", range.to.toISOString());
    router.push("?" + query.toString());
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {range?.from && range?.to
              ? `${format(range?.from, "PP")} - ${format(range.to, "PP")}`
              : "Pick date range"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      <Button onClick={applyFilter} disabled={!range?.from || !range?.to}>
        Apply
      </Button>
    </div>
  );
}

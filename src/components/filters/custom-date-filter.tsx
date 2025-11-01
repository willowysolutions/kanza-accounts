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
    const url = new URL(window.location.href);
    url.searchParams.set("filter", "custom");
    if (range?.from) {
      url.searchParams.set("from", range.from.toISOString());
    } else {
      url.searchParams.delete("from");
    }
    if (range?.to) {
      url.searchParams.set("to", range.to.toISOString());
    } else {
      url.searchParams.delete("to");
    }
    // Reset page to 1 when applying new filters
    url.searchParams.set("page", "1");
    router.push(url.pathname + url.search);
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 bg-white">
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

      <Button onClick={applyFilter} disabled={!range?.from || !range?.to} className="bg-white">
        Apply
      </Button>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export function SingleDateFilter() {
  const router = useRouter();
  const params = useSearchParams();

  // Initialize from query params if present
  const [date, setDate] = useState<Date | undefined>(
    params.get("date") ? new Date(params.get("date")!) : undefined
  );

  function applyFilter() {
    const query = new URLSearchParams(params.toString());
    if (date) {
      query.set("date", date.toISOString());
    } else {
      query.delete("date");
    }
    router.push("?" + query.toString());
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {date ? format(date, "PP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button onClick={applyFilter} disabled={!date}>
        Apply
      </Button>
    </div>
  );
}

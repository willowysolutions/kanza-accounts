"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
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
  const [tempRange, setTempRange] = useState<DateRange | undefined>(range);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Reset temp range when popover opens
  useEffect(() => {
    if (isPopoverOpen) {
      setTempRange(range);
    }
  }, [isPopoverOpen, range]);

  function applyFilter() {
    const url = new URL(window.location.href);
    url.searchParams.set("filter", "custom");
    if (tempRange?.from) {
      url.searchParams.set("from", tempRange.from.toISOString());
    } else {
      url.searchParams.delete("from");
    }
    if (tempRange?.to) {
      url.searchParams.set("to", tempRange.to.toISOString());
    } else {
      url.searchParams.delete("to");
    }
    // Reset page to 1 when applying new filters
    url.searchParams.set("page", "1");
    setRange(tempRange);
    setIsPopoverOpen(false);
    router.push(url.pathname + url.search);
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
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
            selected={tempRange}
            onSelect={setTempRange}
            numberOfMonths={2}
          />
          <div className="p-3 border-t flex gap-2">
            {(tempRange?.from && tempRange?.to) || (range?.from && range?.to) ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setTempRange(undefined);
                    setRange(undefined);
                    setIsPopoverOpen(false);
                    const url = new URL(window.location.href);
                    url.searchParams.delete("from");
                    url.searchParams.delete("to");
                    if (url.searchParams.get("filter") === "custom") {
                      url.searchParams.delete("filter");
                    }
                    router.push(url.pathname + url.search);
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={applyFilter}
                  disabled={!tempRange?.from || !tempRange?.to}
                >
                  Apply
                </Button>
              </>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

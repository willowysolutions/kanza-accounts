"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FilterSelect({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();

  return (
    <Select
      defaultValue={defaultValue}
      onValueChange={(value) => {
        const url = new URL(window.location.href);
        url.searchParams.set('filter', value);
        // Clear date parameters when switching to predefined filters
        if (value !== 'custom') {
          url.searchParams.delete('from');
          url.searchParams.delete('to');
        }
        router.push(url.pathname + url.search);
      }}
    >
      <SelectTrigger className="w-[200px] bg-white">
        <SelectValue placeholder="Filter by date" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="today">Today</SelectItem>
        <SelectItem value="yesterday">Yesterday</SelectItem>
        <SelectItem value="week">This Week</SelectItem>
        <SelectItem value="month">This Month</SelectItem>
        <SelectItem value="year">This Year</SelectItem>
      </SelectContent>
    </Select>
  );
}

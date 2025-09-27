"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  fetchData: (searchTerm: string) => Promise<{ value: string; label: string }[]>;
  className?: string;
}

export function SearchSelect({
  value,
  onValueChange,
  placeholder = "Select item...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found.",
  fetchData,
  className,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Debounced search
  const debouncedSearch = useCallback(
    async (term: string) => {
      if (term.length < 2) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchData(term);
        setOptions(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  // Debounce the search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, debouncedSearch]);

  // Load initial data if value is set
  useEffect(() => {
    if (value && options.length === 0) {
      debouncedSearch("");
    }
  }, [value, options.length, debouncedSearch]);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {loading ? (
              <div className="p-2 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : options.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

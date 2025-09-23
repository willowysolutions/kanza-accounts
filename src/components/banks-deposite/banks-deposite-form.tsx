"use client";

import {
  DialogClose,
} from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormDialog,
  FormDialogContent,
  FormDialogDescription,
  FormDialogFooter,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogTrigger,
} from "@/components/ui/form-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BankDepositeFormProps } from "@/types/bank-deposite";
import { bankDepositeSchema } from "@/schemas/bank-deposite-schema";

export const BankDepositeFormDialog = ({
  bankDeposite,
  open,
  openChange,
  branchId,
}: BankDepositeFormProps & { branchId?: string }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankOptions, setBankOptions] = useState<{ bankName: string; id: string;}[]>([]);
  const router = useRouter();


  const form = useForm<z.infer<typeof bankDepositeSchema>>({
    resolver: zodResolver(bankDepositeSchema),
    defaultValues: {
      bankId: bankDeposite?.bankId || "",
      date: bankDeposite?.date ?? new Date(),
      amount: bankDeposite?.amount || undefined,
    },
  });

  const handleSubmit = async (
    values: z.infer<typeof bankDepositeSchema>,
    close: () => void
  ) => {
    setIsSubmitting(true);
    try {
      const url = bankDeposite
        ? `/api/bank-deposite/${bankDeposite.id}`
        : `/api/bank-deposite/create`;

      const method = bankDeposite ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const response = await res.json();

      if (!res.ok) {
        toast.error(response.error || "Failed to save expense");
        return;
      }

      toast.success(bankDeposite ? "Bank deposite updated successfully" : "Bank deposite added");
      close();
      router.refresh();
    } catch (error) {
      console.error("Error saving bank deposite:", error);
      toast.error("Unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

    useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch("/api/banks");
        const json = await res.json();
        
        // Filter banks by branch if branchId is provided
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredBanks = json.banks?.filter((bank: any) => {
          return branchId ? bank.branchId === branchId : true;
        }) || [];
        
        setBankOptions(filteredBanks);
      } catch (error) {
        console.error("Failed to fetch banks", error);
      }
    };
  
      fetchBanks();
    }, [branchId]);

    console.log(bankOptions);
    


  return (
    <FormDialog
      open={open}
      openChange={openChange}
      form={form}
      onSubmit={(values) => handleSubmit(values, () => openChange?.(false))}
    >
      <FormDialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-2" />
            Deposite
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>{bankDeposite ? "Edit Bank Deposite" : "New Bank Deposite"}</FormDialogTitle>
          <FormDialogDescription>
            Fill out the expense details. Click save when you’re done.
          </FormDialogDescription>
        </FormDialogHeader>


        {/* Title */}
        <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="bankId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="bank" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {bankOptions.map((bank) => (
                    <SelectItem key={bank?.id} value={bank?.id}>
                      {bank?.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className="w-full text-left">
                        {field.value
                          ? new Date(field.value).toLocaleDateString()
                          : "Pick date"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={new Date(field.value)}
                      onSelect={field.onChange}
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        {/* Amount */}
        <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? ""}
                  placeholder="0.00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        </div>

        <FormDialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : bankDeposite ? "Update" : "Save"}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
};

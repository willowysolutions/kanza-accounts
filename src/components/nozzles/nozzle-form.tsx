"use client";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormDialog,
  FormDialogContent,
  FormDialogDescription,
  FormDialogFooter,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogTrigger,
} from "@/components/ui/form-dialog";
import { DialogClose } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { nozzleSchema } from "@/schemas/nozzle-schema";
import { Plus } from "lucide-react";

type NozzleFormValues = z.infer<typeof nozzleSchema>;

export function NozzleFormModal({
  open,
  openChange,
}: {
  open?: boolean;
  openChange?: (open: boolean) => void;
}) {
  const form = useForm<NozzleFormValues>({
    resolver: zodResolver(nozzleSchema),
    defaultValues: {
      nozzleNumber: "",
      machineId: "",
      fuelType: "",
      initialHours: 0,
    },
  });

  const handleSubmit = () => {};

  return (
    <FormDialog
      open={open}
      openChange={openChange}
      form={form}
      onSubmit={handleSubmit}
    >
      <FormDialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add Nozzle
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>Add New Nozzle</FormDialogTitle>
          <FormDialogDescription>
            Configure a new fuel dispensing nozzle.
          </FormDialogDescription>
        </FormDialogHeader>

        <FormField
          control={form.control}
          name="nozzleNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nozzle Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g. N001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="machineId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Machine</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select machine" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Machine 1</SelectItem>
                    <SelectItem value="2">Machine 2</SelectItem>
                    <SelectItem value="3">Machine 3</SelectItem>
                    <SelectItem value="4">Machine 4</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fuel Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="cng">CNG</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="initialHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Hours</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormDialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit">Save</Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}

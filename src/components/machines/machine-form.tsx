'use client';

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
import { Plus } from "lucide-react";
import { machineSchema } from "@/schemas/machine-schema";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Checkbox } from "../ui/checkbox";
import { Machine } from "@/types/machine";
import { useRouter } from "next/navigation";



type TankFormValues = z.infer<typeof machineSchema>;

export function MachineFormModal({
  open,
  openChange,
  machine,
}: {
  open?: boolean;
  openChange?: (open: boolean) => void;
  machine?:Machine;
}) {
    const [allTanks, setAllTanks] = useState<{ tankName: string; id: string; fuelType:string; branchId?: string | null}[]>([]);
    const [branchOptions, setBranchOptions] = useState<{ name: string; id: string }[]>([]);
    const router = useRouter();

    const form = useForm<TankFormValues>({
      resolver: zodResolver(machineSchema),
      defaultValues: {
        machineName: machine?.machineName || "",
        machineTanks: machine?.machineTanks?.map(mt => mt.tankId) || [],
        noOfNozzles: machine?.noOfNozzles || 0,
        branchId: machine?.branchId || undefined,
      },
    });

    // Watch branchId from form
    const selectedBranchId = form.watch("branchId");

        const handleSubmit = async (
          values: TankFormValues,
          close: () => void
        ) => {
          try {
            const url = machine
              ? `/api/machines/${machine.id}`
              : "/api/machines/create";

            const method = machine ? "PATCH" : "POST";

            const res = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(values),
            });

            if (!res.ok) {
              const { error } = await res.json();
              toast.error(error || "Failed to save machine");
              return;
            }

            toast.success(
              machine
                ? "Machine updated successfully"
                : "Machine created successfully"
            );

            close();
            router.refresh();
          } catch (error) {
            console.error("Something went wrong:", error);
            toast.error("Unexpected error occurred");
          }
        };

        useEffect(() => {
        const fetchTanks = async () => {
          try {
            const res = await fetch("/api/tanks");
            const json = await res.json();
            setAllTanks(json.data || []);
          } catch (error) {
            console.error("Failed to fetch tanks", error);
          }
        };

        fetchTanks();
      }, []);

      // Filter tanks when branch changes and clear selected tanks if they don't belong to the new branch
      useEffect(() => {
        const selectedTanks = form.getValues("machineTanks");
        if (!selectedBranchId) {
          // Clear tanks if branch is cleared
          if (selectedTanks && selectedTanks.length > 0) {
            form.setValue("machineTanks", []);
          }
        } else if (selectedTanks && selectedTanks.length > 0) {
          // Filter out tanks that don't belong to the selected branch
          const availableTanksForBranch = allTanks.filter(tank => tank.branchId === selectedBranchId);
          const validSelectedTanks = selectedTanks.filter(tankId => 
            availableTanksForBranch.some(tank => tank.id === tankId)
          );
          
          // Update form if some selected tanks were removed
          if (validSelectedTanks.length !== selectedTanks.length) {
            form.setValue("machineTanks", validSelectedTanks);
          }
        }
      }, [selectedBranchId, allTanks, form]);

      useEffect(() => {
        const fetchBranches = async () => {
          try {
            const res = await fetch("/api/branch");
            const json = await res.json();
            setBranchOptions(json.data || []);
          } catch (error) {
            console.error("Failed to fetch branches", error);
          }
        };

        fetchBranches();
      }, []);

  return (
    <FormDialog open={open} openChange={openChange} form={form} onSubmit={handleSubmit}>
      <FormDialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-2" />
          Add Machine
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>
            {machine ? "Edit Machine" : "Add New Machine"}
          </FormDialogTitle>
          <FormDialogDescription>
            {machine
              ? "Update machine details. Click save when you're done."
              : "Enter the details of the machine."}
          </FormDialogDescription>
        </FormDialogHeader>

        {/* Branch field - moved to first position */}
        <FormField
          control={form.control}
          name="branchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {branchOptions.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="machineName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Machine Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

         <FormField
            control={form.control}
            name="machineTanks" 
            render={({ field }) => {
              // Filter tanks by selected branch
              const filteredTanks = selectedBranchId 
                ? allTanks.filter(tank => tank.branchId === selectedBranchId)
                : [];
              
              const selectedTanks = filteredTanks.filter(tank =>
                field.value?.includes(tank.id)
              )

              return (
                <FormItem>
                  <FormLabel>Connected Tanks</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={`w-full justify-between ${
                            !selectedTanks.length ? "text-muted-foreground" : ""
                          }`}
                          disabled={!selectedBranchId}
                        >
                          {!selectedBranchId 
                            ? "Select Branch First"
                            : selectedTanks.length
                            ? selectedTanks
                                .map(
                                  tank =>
                                    `${tank.tankName} (${tank.fuelType.charAt(0).toUpperCase() + tank.fuelType.slice(1)})`
                                )
                                .join(", ")
                            : "Select Tanks"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-2">
                      <div className="flex flex-col gap-2">
                        {filteredTanks.length === 0 ? (
                          <div className="text-sm text-muted-foreground p-2">
                            {!selectedBranchId ? "Please select a branch first" : "No tanks available for this branch"}
                          </div>
                        ) : (
                          filteredTanks.map(tank => {
                            const isChecked = field.value?.includes(tank.id)
                            return (
                              <div key={tank.id} className="flex items-center gap-2">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...(field.value || []), tank.id])
                                    } else {
                                      field.onChange(
                                        field.value.filter((id: string) => id !== tank.id)
                                      )
                                    }
                                  }}
                                />
                                <span>
                                  {tank.tankName} (
                                  {tank.fuelType.charAt(0).toUpperCase() +
                                    tank.fuelType.slice(1)}
                                  )
                                </span>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
          </div>

        <FormField
          control={form.control}
          name="noOfNozzles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Nozzles</FormLabel>
              <FormControl>
                <Input {...field} />
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
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {machine ? "Update" : "Save"}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}

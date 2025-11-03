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
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Nozzle } from "@prisma/client";
import { useRouter } from "next/navigation";

type NozzleFormValues = z.infer<typeof nozzleSchema>;

export function NozzleFormModal({
  nozzle,
  open,
  openChange,
}: {
  nozzle?: Nozzle;
  open?: boolean;
  openChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [allMachines, setAllMachines] = useState<{ 
    machineName: string; 
    id: string;
    branchId?: string | null;
    machineTanks?: Array<{ tank: { fuelType: string } }>;
  }[]>([]);
  const [branchOptions, setBranchOptions] = useState<{ name: string; id: string }[]>([]);

  const form = useForm<NozzleFormValues>({
    resolver: zodResolver(nozzleSchema),
    defaultValues: {
      nozzleNumber: nozzle?.nozzleNumber || "",
      machineId: nozzle?.machineId || "",
      fuelType: nozzle?.fuelType || "",
      openingReading: nozzle?.openingReading || 0,
      branchId: nozzle?.branchId || undefined,
    },
  });

  // Watch branchId and machineId from form
  const selectedBranchId = form.watch("branchId");
  const selectedMachineId = form.watch("machineId");

  // Create stable reference for machines length to prevent dependency array size changes
  const machinesCount = allMachines.length;

  const handleSubmit = async (
    values: z.infer<typeof nozzleSchema>,
    close: () => void
  ) => {
    try {
      const res = await fetch(
        nozzle
          ? `/api/nozzles/${nozzle.id}` // Update
          : `/api/nozzles/create`, // Create
        {
          method: nozzle ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to save nozzle");
        return;
      }

      toast.success(nozzle ? "Nozzle updated successfully" : "Nozzle added successfully");
      close();
      router.refresh();
    } catch (error) {
      console.error("Something went wrong:", error);
    }
  };

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const res = await fetch("/api/machines");
        const json = await res.json();
        setAllMachines(json.data || []);
      } catch (error) {
        console.error("Failed to fetch machines", error);
      }
    };

    fetchMachines();
  }, []);

  // Clear machine and fuel type when branch changes
  useEffect(() => {
    if (!selectedBranchId || machinesCount === 0) return;
    
    const currentMachineId = form.getValues("machineId");
    if (currentMachineId) {
      const selectedMachine = allMachines.find(m => m.id === currentMachineId);
      // Clear if machine doesn't belong to the selected branch (or if editing and branch changed)
      if (selectedMachine && selectedMachine.branchId !== selectedBranchId) {
        form.setValue("machineId", "");
        form.setValue("fuelType", "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId, machinesCount]);

  // Clear fuel type when machine changes or becomes invalid
  useEffect(() => {
    if (!selectedMachineId || machinesCount === 0) {
      // Clear fuel type if no machine is selected
      if (form.getValues("fuelType")) {
        form.setValue("fuelType", "");
      }
      return;
    }

    const selectedMachine = allMachines.find(m => m.id === selectedMachineId);
    const currentFuelType = form.getValues("fuelType");
    
    if (selectedMachine?.machineTanks && currentFuelType) {
      // Get valid fuel types for this machine
      const validFuelTypes = selectedMachine.machineTanks
        .map(mt => mt.tank?.fuelType)
        .filter((ft): ft is string => {
          if (!ft) return false;
          const ftLower = ft.toLowerCase();
          return ftLower.includes("petrol") || ftLower.includes("diesel");
        });
      
      // Clear fuel type if it's not valid for the selected machine
      if (!validFuelTypes.includes(currentFuelType)) {
        form.setValue("fuelType", "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMachineId, machinesCount]);

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
    <FormDialog
      open={open}
      openChange={openChange}
      form={form}
      onSubmit={handleSubmit}
    >
      <FormDialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          {nozzle ? "Edit Nozzle" : "Add Nozzle"}
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>{nozzle ? "Edit Nozzle" : "Add New Nozzle"}</FormDialogTitle>
          <FormDialogDescription>
            {nozzle
              ? "Update the nozzle details."
              : "Configure a new fuel dispensing nozzle."}
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

          <FormField control={form.control} name="machineId" render={({ field }) => {
            // Filter machines by selected branch
            const filteredMachines = selectedBranchId 
              ? allMachines.filter(machine => machine.branchId === selectedBranchId)
              : [];

            return (
              <FormItem>
                <FormLabel>Machine</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={!selectedBranchId}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={!selectedBranchId ? "Select Branch First" : "Select Machine"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredMachines.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-2">
                        {!selectedBranchId ? "Please select a branch first" : "No machines available for this branch"}
                      </div>
                    ) : (
                      filteredMachines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.machineName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }} />

          <FormField
          control={form.control}
          name="fuelType"
          render={({ field }) => {
            // Get available fuel types from selected machine's tanks
            let availableFuelTypes: string[] = [];
            
            if (selectedMachineId) {
              const selectedMachine = allMachines.find(m => m.id === selectedMachineId);
              if (selectedMachine?.machineTanks) {
                // Extract unique fuel types from tanks connected to the machine
                // Filter to only include petrol or diesel (case insensitive)
                const fuelTypes = new Set<string>();
                selectedMachine.machineTanks.forEach(mt => {
                  const fuelType = mt.tank?.fuelType || "";
                  const fuelTypeLower = fuelType.toLowerCase();
                  if (fuelTypeLower.includes("petrol") || fuelTypeLower.includes("diesel")) {
                    fuelTypes.add(fuelType);
                  }
                });
                availableFuelTypes = Array.from(fuelTypes);
              }
            }

            return (
              <FormItem>
                <FormLabel>Fuel Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedMachineId || availableFuelTypes.length === 0}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue 
                        placeholder={
                          !selectedMachineId 
                            ? "Select Machine First" 
                            : availableFuelTypes.length === 0 
                            ? "No fuel types available" 
                            : "Select fuel type"
                        } 
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableFuelTypes.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-2">
                        {!selectedMachineId ? "Please select a machine first" : "No fuel types available for this machine"}
                      </div>
                    ) : (
                      availableFuelTypes.map(fuelType => (
                        <SelectItem key={fuelType} value={fuelType}>
                          {fuelType}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="openingReading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opening Balance</FormLabel>
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
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              nozzle ? "Update" : "Save"
            )}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}

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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Branch } from "@prisma/client";
import { useRouter } from "next/navigation";
import { branchSchema } from "@/schemas/branch-schema";

export function BranchFormModal({
  branch,
  open,
  openChange,
}: {
  branch?: Branch;
  open?: boolean;
  openChange?: (open: boolean) => void;
}) {
  const router = useRouter()

  const form = useForm<z.infer<typeof branchSchema>>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: branch?.name || "",
      email: branch?.email || "",
      phone: branch?.phone || "",
    },
  });

  const handleSubmit = async (
    values: z.infer<typeof branchSchema>,
    close: () => void
  ) => {
    try {
      const url = branch
        ? `/api/branch/${branch.id}`
        : "/api/branch/create";

      const method = branch ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const { error, issues } = await res.json();
        console.error("Validation/Error issues:", issues);
        toast.error(error || "Failed to save branch");
        return;
      }

      toast.success(branch ? "Branch updated successfully" : "Branch created successfully");
      close();
      router.refresh()
    } catch (error) {
      console.error("Something went wrong:", error);
      toast.error("Unexpected error occurred");
    }
  };


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
          New Branch
        </Button>
      </FormDialogTrigger>

      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>
            {branch ? "Edit Branch" : "New Branch"}
          </FormDialogTitle>
          <FormDialogDescription>
            Fill out the branch details. Click save when you&apos;re done.
          </FormDialogDescription>
        </FormDialogHeader>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch Name</FormLabel>
              <FormControl>
                <Input placeholder="Branch Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Phone Number" {...field} />
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
              branch ? "Update" : "Save"
            )}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}

"use client";

import * as React from "react";
import { useState } from "react";
import { UseFormReturn, FieldValues } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";


interface FormDialogProps<T extends FieldValues = FieldValues> {
  // Control props
  open?: boolean;
  openChange?: (open: boolean) => void;

  // Form props
  form: UseFormReturn<T>;
  onSubmit: (data: T, close: () => void) => void | Promise<void>;

  // Content
  children: React.ReactNode;

  // Styling
  className?: string;
}

interface FormDialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface FormDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

// Context for sharing dialog state and form
const FormDialogContext = React.createContext<{
  isControlled: boolean;
  form: UseFormReturn<FieldValues>;
  onSubmit: (data: FieldValues) => void;
} | null>(null);

export function FormDialog<T extends FieldValues = FieldValues>({
  open: externalOpen,
  openChange: externalOpenChange,
  form,
  onSubmit,
  children,
}: FormDialogProps<T>) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Smart detection: controlled if open prop is provided (not undefined)
  const isControlled = externalOpen !== undefined;

  // Use external state if controlled, otherwise use internal state
  const open = isControlled ? externalOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    // Reset form when dialog closes
    if (!newOpen) form.reset();

    // Update internal state if uncontrolled
    if (!isControlled) setInternalOpen(newOpen);

    // Always call external openChange if provided
    if (externalOpenChange) externalOpenChange(newOpen);
  };

  const handleSubmit = (data: T) => {
    console.log("📋 FormDialog handleSubmit called with data:", data);
    try {
      const result = onSubmit(data, () => handleOpenChange(false));
      // Handle async onSubmit
      if (result && typeof result === "object" && "then" in result && typeof (result as Promise<unknown>).then === "function") {
        (result as Promise<void>).catch((error) => {
          console.error("❌ FormDialog onSubmit error:", error);
        });
      }
    } catch (error) {
      console.error("❌ FormDialog handleSubmit error:", error);
    }
  };

  return (
    <FormDialogContext.Provider
      value={{
        isControlled,
        form: form as UseFormReturn<FieldValues>,
        onSubmit: handleSubmit as (data: FieldValues) => void,
      }}
    >
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {children}
      </Dialog>
    </FormDialogContext.Provider>
  );
}

// Composable content component
export function FormDialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(FormDialogContext);

  if (!context) {
    throw new Error("FormDialogContent must be used within FormDialog");
  }

  return (
    <DialogContent className={className}>
      <Form {...context.form}>
        <form
          onSubmit={(e) => {
            console.log("🔥 Form submit event triggered");
            e.preventDefault();
            context.form.handleSubmit(
              (data) => {
                console.log("✅ Form validation passed, calling onSubmit with data:", data);
                context.onSubmit(data);
              },
              (errors) => {
                console.error("❌ Form validation failed with errors:", errors);
                // Show validation errors
                const errorMessages = Object.entries(errors)
                  .map(([field, error]) => {
                    const err = error as { message?: string };
                    return `${field}: ${err?.message || "Invalid"}`;
                  })
                  .join("\n");
                if (errorMessages) {
                  console.error("Validation errors:", errorMessages);
                  // The parent component should handle showing toast errors
                }
              }
            )();
          }}
          className="space-y-4"
        >
          {children}
        </form>
      </Form>
    </DialogContent>
  );
}

// Composable trigger component
export function FormDialogTrigger({
  children,
  asChild = true,
}: FormDialogTriggerProps) {
  const context = React.useContext(FormDialogContext);

  // Only render if dialog is not controlled externally
  if (context?.isControlled) {
    return null;
  }

  return <DialogTrigger asChild={asChild}>{children}</DialogTrigger>;
}

// Composable footer component
export function FormDialogFooter({
  children,
  className,
}: FormDialogFooterProps) {
  return <DialogFooter className={className}>{children}</DialogFooter>;
}

// Re-export other dialog components for convenience
export {
  DialogHeader as FormDialogHeader,
  DialogTitle as FormDialogTitle,
  DialogDescription as FormDialogDescription,
} from "@/components/ui/dialog";

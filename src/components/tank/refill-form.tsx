'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useMemo } from 'react'

import {
  FormDialog,
  FormDialogContent,
  FormDialogDescription,
  FormDialogFooter,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogTrigger,
} from "@/components/ui/form-dialog";
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Droplets } from 'lucide-react'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogClose } from '../ui/dialog'
import { Tank } from '@/types/tank'
import { FormProvider } from 'react-hook-form'
import { refillTankSchema } from '@/schemas/refill-schema'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'



type RefillTankFormValues = z.infer<typeof refillTankSchema>

interface RefillTankFormDialogProps {
  open: boolean
  openChange?: (open: boolean) => void;  
  tank : Tank
}

export function RefillTankFormDialog({
  open,
  openChange,
  tank
}: RefillTankFormDialogProps) {
  const router = useRouter();
  const form = useForm<RefillTankFormValues>({
    resolver: zodResolver(refillTankSchema),
    defaultValues: {
      tankId:tank.id,
      refillAmount: 0,
    },
  })

  const amount = form.watch('refillAmount')
  const newLevel = useMemo(() => (tank?.currentLevel) + Number(amount || 0), [tank?.currentLevel, amount])

  const isSubmitting = form.formState.isSubmitting;
  const isOverCapacity = typeof tank?.capacity === "number" && newLevel > Number(tank.capacity);

  const isSubmitDisabled = isSubmitting || isOverCapacity;

const handleSubmit = async (
  values: z.infer<typeof refillTankSchema>,
  close: () => void) => {
  try {
    const res = await fetch("/api/refill/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const {error} = await res.json();
      toast.error(error || "Failed to refill tank");
      return;
    }

    toast.success("Refill successfull");
    close();
    router.refresh();
  } catch (error) {
    console.error("Something went wrong:", error);
  }
};

  return (
    <FormDialog
  open={open}
  openChange={openChange}
  onSubmit={handleSubmit}
  form={form}
>
  <FormProvider {...form}>
    <FormDialogTrigger>
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={() => {}}
      >
        <Droplets className="mr-1 h-3 w-3" />
        Refill
      </Button>
    </FormDialogTrigger>

    <FormDialogContent className="sm:max-w-md">
      <FormDialogHeader>
        <FormDialogTitle>Refill Tank</FormDialogTitle>
        <FormDialogDescription>
          {`Add fuel to ${tank?.tankName}`}
        </FormDialogDescription>
      </FormDialogHeader>

      <FormField
        control={form.control}
        name="refillAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{`Amount to Add (Liters)`}</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter amount" type="number" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="rounded-md border bg-muted p-3 text-sm space-y-1">
        <p className="text-muted-foreground">
          Current Level: {(tank?.currentLevel ?? 0).toLocaleString()}L
        </p>
        <p>
          New Level:{' '}
          <span
            className={cn(
              newLevel > tank?.capacity ? 'text-red-600 font-medium' : 'text-foreground'
            )}
          >
            {newLevel.toLocaleString()}L
          </span>
        </p>
      </div>

      <FormDialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitDisabled}>
          Confirm Refill
        </Button>
      </FormDialogFooter>
    </FormDialogContent>
  </FormProvider>
</FormDialog>

  )
}

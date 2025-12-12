import { BranchInput } from "@/schemas/branch-schema";
import { Branch } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ReactNode } from "react";


export type BranchModalProps = {
  isEdit?: boolean;
  initialData?: BranchInput & { id: string };
  triggerLabel?: ReactNode;
};

export interface BranchFormProps {
  branch?: Branch;
  open?: boolean;
  openChange?: (open: boolean) => void;
}

export interface BranchTableProps<TValue> {
  columns: ((isGm?: boolean) => ColumnDef<Branch, TValue>[]) | ColumnDef<Branch, TValue>[];
  data: Branch[];
  isGm?: boolean;
}
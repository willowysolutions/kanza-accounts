import { Product as PrismaProduct } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export type ProductType = {
  id:string;
  productName :string;
  productCategory?: "FUEL" | "OTHER";
  productUnit: string;
  purchasePrice: number;
  sellingPrice: number;
  branchId: string | null;
}

export interface ProductTableProps<TValue> {
  columns: ((userRole?: string, userBranchId?: string) => ColumnDef<ProductType, TValue>[]) | ColumnDef<ProductType, TValue>[];
  data: ProductType[];
  userRole?: string;
  userBranchId?: string;
}



export interface Product extends PrismaProduct {
  branch: { name: string };
}

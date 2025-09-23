import { Product as PrismaProduct } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export type ProductType = {
  id:string;
  productName :string;
  productUnit: string;
  purchasePrice: number;
  sellingPrice: number;
  branchId: string | null;
}

export interface ProductTableProps<TValue> {
  columns: ColumnDef<ProductType, TValue>[];
  data: ProductType[];
}



export interface Product extends PrismaProduct {
  branch: { name: string };
}

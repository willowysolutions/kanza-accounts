import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { formatCurrency } from "@/lib/utils";
import { FilterSelect } from "@/components/filters/filter-select";
import { CustomDateFilter } from "@/components/filters/custom-date-filter";
import { PurchaseReportExport } from "@/components/reports/purchase-report-export";


function getDateRange(filter: string, customStart?: Date, customEnd?: Date) {
  const now = new Date();
  let start: Date | undefined;
  let end: Date | undefined = new Date();

  switch (filter) {
    case "all":
      start = undefined;
      end = undefined;
      break;
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "yesterday":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      start = weekStart;
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "custom":
      start = customStart;
      end = customEnd;
      break;
  }

  return { start, end };
}


export default async function PurchaseReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filter = typeof params.filter === "string" ? params.filter : "today";

  const from = params.from ? new Date(params.from as string) : undefined;
  const to = params.to ? new Date(params.to as string) : undefined;


  const { start, end } = getDateRange(filter);
  const session = await auth.api.getSession({ headers: await headers() });
  const branchId = session?.user?.branch;
  const branchClause = session?.user?.role === "admin" ? {} : { branchId };

  const purchases = await prisma.purchase.findMany({
    where: {
      ...branchClause,
      date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      supplier: true,
      branch: true,
    },
  });

  return (
    <div>
      <div className="my-4">
        <h1 className="text-2xl font-bold tracking-tight">Purchase Report</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Purchase Report</CardTitle>
              <p className="text-sm text-muted-foreground">
                Summary of all purchase transactions
              </p>
            </div>

            <div className="flex gap-3">
              <FilterSelect defaultValue={filter} />
              <CustomDateFilter />
              <PurchaseReportExport purchases={purchases} filter={filter} from={from} to={to} />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableCaption>A summary of purchase details.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Purchase Price</TableHead>
                  <TableHead className="text-right">Paid Amount</TableHead>
                  <TableHead className="text-right">Pending Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id.toString()}>
                    <TableCell>
                      {new Date(purchase.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {purchase.supplier?.name ?? "-"}
                    </TableCell>
                    <TableCell>{purchase.branch?.name ?? "-"}</TableCell>
                    <TableCell>{purchase.phone}</TableCell>
                    <TableCell>{purchase.productType}</TableCell>
                    <TableCell className="text-right">{purchase.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(purchase.purchasePrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(purchase.paidAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(purchase.pendingAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="bg-primary text-primary-foreground font-black">
                <TableRow>
                  <TableCell colSpan={6} className="text-right font-medium">
                    Grand Total
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(
                      purchases.reduce((sum, p) => sum + p.purchasePrice, 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(
                      purchases.reduce((sum, p) => sum + p.paidAmount, 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(
                      purchases.reduce((sum, p) => sum + p.pendingAmount, 0)
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

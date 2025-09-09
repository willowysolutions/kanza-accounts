// app/sales-report/page.tsx
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
import { formatCurrency } from "@/lib/utils";
import { FilterSelect } from "@/components/filters/filter-select"
import { CustomDateFilter } from "@/components/filters/custom-date-filter";
import { SalesReportExport } from "@/components/reports/sales-report-export";

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

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filter = typeof params.filter === "string" ? params.filter : "today";

  const from = params.from ? new Date(params.from as string) : undefined;
  const to = params.to ? new Date(params.to as string) : undefined;

  const { start, end } = getDateRange(filter, from, to);

  const sales = await prisma.sale.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    include: { branch: true },
    orderBy: { date: "desc" },
  });
  return (
    <div>
      <div className="my-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Sales Report</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sales Report</CardTitle>
              <p className="text-sm text-muted-foreground">
                Summary of all sales transactions ({filter})
              </p>
            </div>
            <div className="flex gap-3">
              <FilterSelect defaultValue={filter} />
              <CustomDateFilter />
              <SalesReportExport sales={sales} filter={filter} from={from} to={to} />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableCaption>A summary of sales details.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">ATM Payment</TableHead>
                  <TableHead className="text-right">Paytm Payment</TableHead>
                  <TableHead className="text-right">Fleet Payment</TableHead>
                  <TableHead className="text-right">XG Diesel Total</TableHead>
                  <TableHead className="text-right">HSD Diesel Total</TableHead>
                  <TableHead className="text-right">MS Petrol Total</TableHead>
                  <TableHead className="text-right">Grand Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id.toString()}>
                    <TableCell>
                      {new Date(sale.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{sale.branch?.name ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sale.atmPayment)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sale.paytmPayment)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sale.fleetPayment)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sale.xgDieselTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sale.hsdDieselTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sale.msPetrolTotal)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(sale.rate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="bg-primary text-primary-foreground font-black">
                <TableRow>
                  <TableCell colSpan={2} className="text-right font-medium">
                    Grand Total
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(
                      sales.reduce((sum, s) => sum + s.atmPayment, 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(
                      sales.reduce((sum, s) => sum + s.paytmPayment, 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(
                      sales.reduce((sum, s) => sum + s.fleetPayment, 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-400">
                    {formatCurrency(
                      sales.reduce((sum, s) => sum + s.xgDieselTotal, 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-blue-800">
                    {formatCurrency(
                      sales.reduce((sum, s) => sum + s.hsdDieselTotal, 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-red-800">
                    {formatCurrency(
                      sales.reduce((sum, s) => sum + s.msPetrolTotal, 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-800">
                    {formatCurrency(
                      sales.reduce((sum, s) => sum + s.rate, 0)
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

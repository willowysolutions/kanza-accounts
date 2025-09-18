// src/app/(sidebar)/reports/general-report/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { FilterSelect } from "@/components/filters/filter-select";
import { CustomDateFilter } from "@/components/filters/custom-date-filter";
import { GeneralReportExport } from "@/components/reports/general-report-export";
import { headers, cookies } from "next/headers";

type Rows = {
  date: Date;
  sales: number;
  purchases: number;
  expenses: number;
  customerPayments: number;
  finalTotal: number;
};

export default async function GeneralReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filter = typeof params.filter === "string" ? params.filter : "today";

  const from = params.from ? new Date(params.from as string) : undefined;
  const to = params.to ? new Date(params.to as string) : undefined;

  const query = new URLSearchParams();
  query.set("filter", filter);
  if (from) query.set("from", from.toISOString());
  if (to) query.set("to", to.toISOString());

  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const cookie = (await cookies()).toString();

  const res = await fetch(`${proto}://${host}/api/reports/general?${query.toString()}`, {
    cache: "no-store",
    headers: { cookie },
  });

  const { rows, totals } = await res.json();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">General Report</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>General Report (Summary)</CardTitle>
          </div>
          <div className="flex gap-3">
            <FilterSelect defaultValue={filter} />
            <CustomDateFilter />
            <GeneralReportExport
              rows={rows}
              totals={totals}
              filter={filter}
              from={from}
              to={to}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Date</TableHead>
                <TableHead className="text-right">Total Sales</TableHead>
                <TableHead className="text-right">Total Purchases</TableHead>
                <TableHead className="text-right">Total Expenses</TableHead>
                <TableHead className="text-right">Credit Received</TableHead>
                <TableHead className="text-right">Final Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row: Rows) => (
                <TableRow key={new Date(row.date).toISOString()}>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell className="text-right">
                    ₹{row.sales.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{row.purchases.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{row.expenses.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{row.customerPayments.toLocaleString()}
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      row.finalTotal >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ₹{row.finalTotal.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="font-semibold">
                <TableCell className="text-right">Grand Total</TableCell>
                <TableCell className="text-right">
                  ₹{totals.totalSales.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  ₹{totals.totalPurchases.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  ₹{totals.totalExpenses.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  ₹{totals.totalCustomerPayments.toLocaleString()}
                </TableCell>
                <TableCell
                  className={`text-right ${
                    totals.totalFinal >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  ₹{totals.totalFinal.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

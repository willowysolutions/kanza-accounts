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

export default async function SupplierReportPage() {
  const suppliers = await prisma.supplier.findMany();

  return (
    <div>
      <div className="my-4">
        <h1 className="text-2xl font-bold tracking-tight">Supplier Report</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Supplier Report</CardTitle>
            <p className="text-sm text-muted-foreground">
              Summary of all supplier accounts
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableCaption>A summary of supplier details.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Opening Balance</TableHead>
                  <TableHead className="text-right">Outstanding Payments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id.toString()}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(supplier.openingBalance)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(supplier.outstandingPayments)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="bg-primary text-primary-foreground font-black">
                <TableRow>
                  <TableCell className="text-right font-medium" colSpan={3}>
                    Grand Total
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(
                      suppliers.reduce((sum, s) => sum + s.openingBalance, 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(
                      suppliers.reduce((sum, s) => sum + s.outstandingPayments, 0)
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

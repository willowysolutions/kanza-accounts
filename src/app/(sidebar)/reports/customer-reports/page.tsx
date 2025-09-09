// app/customer-report/page.tsx
import { prisma } from "@/lib/prisma";
import CustomerReportTable from "@/components/customers/customer-report-table";

export default async function CustomerReportPage() {
  const customers = await prisma.customer.findMany();

  return (
    <div>
      <div className="my-4">
        <h1 className="text-2xl font-bold tracking-tight">Customer Report</h1>
      </div>
      <CustomerReportTable customers={customers} />
    </div>
  );
}

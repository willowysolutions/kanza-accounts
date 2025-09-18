// app/customer-report/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import CustomerReportTable from "@/components/customers/customer-report-table";

export default async function CustomerReportPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const branchId = session?.user?.branch;
  const branchClause = session?.user?.role === "admin" ? {} : { branchId };

  const customers = await prisma.customer.findMany({ where: branchClause });

  return (
    <div>
      <div className="my-4">
        <h1 className="text-2xl font-bold tracking-tight">Customer Report</h1>
      </div>
      <CustomerReportTable customers={customers} />
    </div>
  );
}

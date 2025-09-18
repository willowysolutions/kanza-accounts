import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import PaymentTabs from "@/components/payments/payment-tabs";

export default async function PaymentHistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const branchId = session?.user?.branch;
  const isAdmin = session?.user?.role?.toLowerCase() === "admin";
  const whereClause = isAdmin || !branchId
    ? {}
    : {
        OR: [
          { branchId },
          { customer: { is: { branchId } } },
        ],
      };

  const paymentHistory = await prisma.paymentHistory.findMany({
    where: whereClause,
    orderBy: { paidOn: "desc" },
    include: { customer: true, supplier: true },
  });

  const customerPayments = paymentHistory
    .filter((p) => p.customerId)
    .map((p) => ({
      id: p.id,
      paidAmount: p.paidAmount,
      paymentMethod: p.paymentMethod,
      paidOn: p.paidOn,
      customer: p.customer
        ? { name: p.customer.name ?? undefined, outstandingPayments: p.customer.outstandingPayments }
        : undefined,
    }));

  const supplierPayments = paymentHistory
    .filter((p) => p.supplierId)
    .map((p) => ({
      id: p.id,
      paidAmount: p.paidAmount,
      paymentMethod: p.paymentMethod,
      paidOn: p.paidOn,
      supplier: p.supplier
        ? { name: p.supplier.name ?? undefined, outstandingPayments: p.supplier.outstandingPayments }
        : undefined,
    }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Payment History</h1>
      <PaymentTabs
        customerPayments={customerPayments}
        supplierPayments={supplierPayments}
      />
    </div>
  );
}

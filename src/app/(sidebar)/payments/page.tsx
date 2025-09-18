import PaymentManagement from "@/components/payments/payment-management";
  import { headers, cookies } from "next/headers";
export default async function PaymentsPage() {

  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const cookie = (await cookies()).toString();
  
  // Customer dues
  const dueRes = await fetch(`${proto}://${host}/api/payments/due`, {
    cache: "no-store",
    headers: { cookie },
  });
  const { customers } = await dueRes.json();
  
  // Supplier dues
  const purchaseDueRes = await fetch(`${proto}://${host}/api/payments/purchase-due`, {
    cache: "no-store",
    headers: { cookie },
  });
  const { suppliers } = await purchaseDueRes.json();
  
  // Payment history
  const historyRes = await fetch(`${proto}://${host}/api/payments/history`, {
    cache: "no-store",
    headers: { cookie },
  });
  const { paymentHistory } = await historyRes.json();
    

  return (
    <div className="flex flex-1 flex-col">
      <PaymentManagement customerPayment={customers} supplierPayment={suppliers} paymentHistory={paymentHistory}/>
    </div>
  );
}

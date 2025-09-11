import PaymentManagement from "@/components/payments/payment-management";

export default async function PaymentsPage() {

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Customer dues
const dueRes = await fetch(`${baseUrl}/api/payments/due`, {
  cache: "no-store",
});
const { customers } = await dueRes.json();

// Supplier dues
const purchaseDueRes = await fetch(`${baseUrl}/api/payments/purchase-due`, {
  cache: "no-store",
});
const { suppliers } = await purchaseDueRes.json();

// Payment history
const historyRes = await fetch(`${baseUrl}/api/payments/history`, {
  cache: "no-store",
});
const { paymentHistory } = await historyRes.json();
  

  return (
    <div className="flex flex-1 flex-col">
      <PaymentManagement customerPayment={customers} supplierPayment={suppliers} paymentHistory={paymentHistory}/>
    </div>
  );
}

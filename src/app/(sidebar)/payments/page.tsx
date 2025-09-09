import PaymentManagement from "@/components/payments/payment-management";

export default async function PaymentsPage() {

  const dueRes = await fetch("http://localhost:3000/api/payments/due");
  const {customers} = await dueRes.json();

  const purchaseDueRes = await fetch("http://localhost:3000/api/payments/purchase-due");
  const {suppliers} = await purchaseDueRes.json();

  const historyRes = await fetch("http://localhost:3000/api/payments/history");
  const {paymentHistory} = await historyRes.json();
  

  return (
    <div className="flex flex-1 flex-col">
      <PaymentManagement customerPayment={customers} supplierPayment={suppliers} paymentHistory={paymentHistory}/>
    </div>
  );
}

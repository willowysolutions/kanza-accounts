export const dynamic = "force-dynamic";

import BankManagement from "@/components/banks/bank-management";

export default async function BankPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const resRes = await fetch(`${baseUrl}/api/banks`, {
    cache: "no-store",
  });
  const { banks } = await resRes.json();

  const resDeposite = await fetch(`${baseUrl}/api/bank-deposite`, {
    cache: "no-store",
  });
  const { bankDeposite } = await resDeposite.json();
  
  return (
    <div className="flex flex-1 flex-col">
      <BankManagement bank={banks} bankDeposite={bankDeposite}/>
    </div>
  );
}

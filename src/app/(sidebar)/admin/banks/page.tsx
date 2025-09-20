export const dynamic = "force-dynamic";

import BankManagement from "@/components/banks/bank-management";
import { headers, cookies } from "next/headers";

export default async function BankPage() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const cookie = (await cookies()).toString();
  
  // 🔹 Banks
  const resRes = await fetch(`${proto}://${host}/api/banks`, {
    cache: "no-store",
    headers: { cookie },
  });
  const { banks } = await resRes.json();
  
  // 🔹 Bank Deposits
  const resDeposite = await fetch(`${proto}://${host}/api/bank-deposite`, {
    cache: "no-store",
    headers: { cookie },
  });
  const { bankDeposite } = await resDeposite.json();
    
  return (
    <div className="flex flex-1 flex-col">
      <BankManagement bank={banks} bankDeposite={bankDeposite}/>
    </div>
  );
}

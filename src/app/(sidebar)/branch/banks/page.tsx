export const dynamic = "force-dynamic";

import BankManagement from "@/components/banks/bank-management";

export default async function BankPage() {
    const resRes = await await fetch("http://localhost:3000/api/banks")
    const {banks} = await resRes.json() 

    const resDeposite = await await fetch("http://localhost:3000/api/bank-deposite")
    const {bankDeposite} = await resDeposite.json() 

  return (
    <div className="flex flex-1 flex-col">
      <BankManagement bank={banks} bankDeposite={bankDeposite}/>
    </div>
  );
}

import { creditColumns } from "@/components/credits/credit-columns";
import { CreditFormDialog } from "@/components/credits/credit-form";
import { CreditTable } from "@/components/credits/credit-table";

export const dynamic = "force-dynamic";


export default async function CreditsPage() {
const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const res = await fetch(`${baseUrl}/api/credits`, {
  cache: "no-store",
});

const { data } = await res.json();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Credits</h1>
              <p className="text-muted-foreground">Manage customer credits</p>
            </div>
            <CreditFormDialog />
          </div>

          <CreditTable data={data} columns={creditColumns} />
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

import { TankFormDialog } from "@/components/tank/tank-form";
import { TankCard } from "@/components/tank/tank-card";
import { headers, cookies } from "next/headers";

export default async function TankPage() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const cookie = (await cookies()).toString();
  
  // 🔹 Tanks
  const res = await fetch(`${proto}://${host}/api/tanks`, {
    cache: "no-store",
    headers: { cookie },
  });
  const { data } = await res.json();
  
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tank Management</h1>
              <p className="text-muted-foreground">Monitor and manage fuel tank levels</p>
            </div>
            <TankFormDialog />
          </div>

          <TankCard tanks={data}/>
        </div>
      </div>
    </div>
  );
}

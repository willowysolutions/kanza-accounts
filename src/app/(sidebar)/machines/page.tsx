export const dynamic = "force-dynamic";

import { Machinecard } from "@/components/machines/machine-card";
import { MachineFormModal } from "@/components/machines/machine-form";

export default async function MachinePage() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    
    const res = await fetch(`${baseUrl}/api/machines`, {
      cache: "no-store",
    });
    const { data } = await res.json();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Machine Management</h1>
              <p className="text-muted-foreground">Monitor and manage fuel dispensing machines</p>
            </div>
            <MachineFormModal />
          </div>

          <Machinecard data={data}/>
        </div>
      </div>
    </div>
  );
}

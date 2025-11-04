export const dynamic = "force-dynamic";

import { NozzleTable } from "@/components/nozzles/nozzle-table";
import { NozzleFormModal } from "@/components/nozzles/nozzle-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fuel, FuelIcon } from "lucide-react";
import { nozzleColumns } from "@/components/nozzles/nozzle-column";
import { Nozzle } from "@/types/nozzle";
import { cookies, headers } from "next/headers";

export default async function NozzlePage() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const cookie = (await cookies()).toString();
  
  // Fetch nozzles and branches
  const [nozzlesRes, branchesRes] = await Promise.all([
    fetch(`${proto}://${host}/api/nozzles`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/branch`, {
      cache: "no-store",
      headers: { cookie },
    })
  ]);
  
  const { data: nozzles } = await nozzlesRes.json();
  const { data: branches } = await branchesRes.json();

  // Group nozzles by branch
  const nozzlesByBranch = branches.map((branch: { id: string; name: string }) => ({
    branchId: branch.id,
    branchName: branch.name,
    nozzles: nozzles.filter((nozzle: { branchId: string | null }) => nozzle.branchId === branch.id)
  }));

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Nozzle Management</h1>
              <p className="text-muted-foreground">Monitor and manage fuel dispensing nozzles by branch</p>
            </div>
            <NozzleFormModal />
          </div>

          <Tabs defaultValue={branches[0]?.id} className="w-full">
            <TabsList className="mb-4 flex flex-wrap gap-2 w-full">
              {branches.map((branch: { id: string; name: string }) => (
                <TabsTrigger key={branch.id} value={branch.id}>
                  {branch.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {nozzlesByBranch.map(({ branchId, branchName, nozzles }: { branchId: string; branchName: string; nozzles: any[] }) => {
              const noOfNozzles = nozzles.length;
              const xpNozzleCount = nozzles.filter((nozzle: Nozzle) => nozzle.fuelType === "XG-DIESEL").length;
              const hspNozzleCount = nozzles.filter((nozzle: Nozzle) => nozzle.fuelType === "HSD-DIESEL").length;
              const msNozzleCount = nozzles.filter((nozzle: Nozzle) => nozzle.fuelType === "MS-PETROL").length;

              return (
                <TabsContent key={branchId} value={branchId}>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold">{branchName} Nozzles</h2>
                    <p className="text-sm text-muted-foreground">
                      {nozzles.length} nozzle{nozzles.length !== 1 ? 's' : ''} in this branch
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Nozzles</CardTitle>
                        <Fuel className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{noOfNozzles}</div>
                        <p className="text-xs text-muted-foreground">In this branch</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">XG-DIESEL</CardTitle>
                        <FuelIcon className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{xpNozzleCount}</div>
                        <p className="text-xs text-muted-foreground">Available Count</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">HSD-DIESEL</CardTitle>
                        <FuelIcon className="h-4 w-4 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{hspNozzleCount}</div>
                        <p className="text-xs text-muted-foreground">Available Count</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">MS-PETROL</CardTitle>
                        <FuelIcon className="h-4 w-4 text-red-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">{msNozzleCount}</div>
                        <p className="text-xs text-muted-foreground">Available Count</p>
                      </CardContent>
                    </Card>
                  </div>

                  <NozzleTable data={nozzles} columns={nozzleColumns}/>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

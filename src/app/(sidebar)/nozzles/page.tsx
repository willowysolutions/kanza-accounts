export const dynamic = "force-dynamic";

import { NozzleTable } from "@/components/nozzles/nozzle-table";
import { NozzleFormModal } from "@/components/nozzles/nozzle-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, FuelIcon } from "lucide-react";
import { nozzleColumns } from "@/components/nozzles/nozzle-column";
import { Nozzle } from "@/types/nozzle";

export default async function NozzlePage() {
    const res = await await fetch("http://localhost:3000/api/nozzles")
    const {data} = await res.json() 
    
    const noOfNozzles = data.length;

    const xpNozzleCount = data.filter(
      (nozzle: Nozzle) => nozzle.fuelType === "XG-DIESEL"
    ).length;

    const hspNozzleCount = data.filter(
      (nozzle: Nozzle) => nozzle.fuelType === "HSD-DIESEL"
    ).length;

    const msNozzleCount = data.filter(
      (nozzle: Nozzle) => nozzle.fuelType === "MS-PETROL"
    ).length;

  

  return (
    <div className="flex flex-1 flex-col">
    <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nozzles</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{noOfNozzles}</div>
            <p className="text-xs text-muted-foreground">Across all dispensers</p>
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
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Nozzle Management</h1>
              <p className="text-muted-foreground">Monitor and manage fuel dispensing nozzles</p>
            </div>
            <NozzleFormModal />
          </div>

          <NozzleTable data={data} columns={nozzleColumns}/>
        </div>
      </div>
    </div>
  );
}

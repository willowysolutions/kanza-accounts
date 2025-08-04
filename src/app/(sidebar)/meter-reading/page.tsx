export const dynamic = "force-dynamic";

import { MeterReadingTable } from "@/components/meter-reading/meter-reading-table";
import { MeterReadingFormModal } from "@/components/meter-reading/meter-reading-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, FileText, TrendingUp } from "lucide-react";
import { meterReadinColumns } from "@/components/meter-reading/meter-reading-column";


export default async function MeterReadingPage() {

  return (
    <div className="flex flex-1 flex-col">
        <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today Dispensed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">530.3L</div>
            {/* <div className="text-2xl font-bold">{totalDispensed.toFixed(1)}L</div> */}
            <p className="text-xs text-muted-foreground">Total fuel dispensed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opening Readings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            {/* <div className="text-2xl font-bold">{openingReadings.length}</div> */}
            <p className="text-xs text-muted-foreground">Recorded today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closing Readings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            {/* <div className="text-2xl font-bold">{closingReadings.length}</div> */}
            <p className="text-xs text-muted-foreground">Recorded today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Readings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">All readings today</p>
          </CardContent>
        </Card>
      </div>

      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Meter Reading</h1>
              <p className="text-muted-foreground">Track daily meter readings for all nozzles</p>
            </div>
            <MeterReadingFormModal />
          </div>

          <MeterReadingTable data={[]} columns={meterReadinColumns}/>
        </div>
      </div>
    </div>
  );
}

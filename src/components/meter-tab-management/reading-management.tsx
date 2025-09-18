"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MeterReadingTable } from "../meter-reading/meter-reading-table";
import { meterReadinColumns } from "../meter-reading/meter-reading-column";
import { MeterReading } from "@/types/meter-reading";
import { useState } from "react";
import { MeterReadingFormSheet } from "../meter-reading/meter-reading-form";
import { Oil } from "@prisma/client";
import { oilColumns } from "../oil/oil-column";
import { OilTable } from "../oil/oil-table";
import { OilFormModal } from "../oil/oil-form";
import { Sales } from "@/types/sales";
import { ReportTable } from "../export-report/report-table";
import { reportColumns } from "../export-report/report-column";

type MeterTabManagementProps = {
  meterReading: MeterReading[];
  oil: Oil[];
  sales: Sales[];
};

export default function MeterTabManagement({ meterReading,oil,sales }: MeterTabManagementProps) {
    const [activeTab, setActiveTab] = useState("purchase");
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meter Reading</h1>
            <p className="text-muted-foreground">Track daily meter readings for all nozzles</p>
          </div>
          {activeTab === "meter-reading" ? <MeterReadingFormSheet /> : activeTab === "other-Products" ? <OilFormModal /> : ""}
        </div>

        <Tabs
          defaultValue="meter-reading"
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList>
            <TabsTrigger value="meter-reading">Meter Reading</TabsTrigger>
            <TabsTrigger value="other-Products">Other Products</TabsTrigger>
            <TabsTrigger value="report">Report</TabsTrigger>
          </TabsList>

          <TabsContent value="meter-reading">
            <MeterReadingTable data={meterReading} columns={meterReadinColumns}/>
          </TabsContent>

          <TabsContent value="other-Products">
            <OilTable data={oil} columns={oilColumns}/>
          </TabsContent>

          <TabsContent value="report">
            <ReportTable data={sales} columns={reportColumns}/>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

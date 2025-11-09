"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MeterReadingTable } from "../meter-reading/meter-reading-table";
import { MeterReading } from "@/types/meter-reading";
import { useState, useEffect } from "react";
import { MeterReadingFormSheet } from "../meter-reading/meter-reading-form";
import { oilColumns } from "../oil/oil-column";
import { OilTable } from "../oil/oil-table";
import { OilFormModal } from "../oil/oil-form";
import { Sales } from "@/types/sales";
import { ReportTable } from "../export-report/report-table";
import { useReportColumns } from "../export-report/report-column";
import { Oil } from "@/types/oils";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

// Wrapper component to use the hook
function ReportTableWithDynamicColumns({
  data,
  userRole,
  branchId,
  pagination,
  currentPage,
}: {
  data: Sales[];
  userRole?: string;
  branchId: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  currentPage?: number;
}) {
  const columns = useReportColumns(userRole, branchId);
  
  return (
    <ReportTable 
      data={data} 
      columns={columns}
      pagination={pagination}
      currentPage={currentPage}
    />
  );
}

type MeterTabManagementProps = {
  meterReading: MeterReading[];
  oil: Oil[];
  sales: Sales[];
  branches: { id: string; name: string }[];
  userRole?: string;
  salesPagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  currentPage: number;
};

export default function MeterTabManagement({ meterReading, oil, sales, branches, userRole, salesPagination, currentPage }: MeterTabManagementProps) {
    const [activeTab, setActiveTab] = useState("meter-reading");
    const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check for tab parameter in URL and set active tab
    useEffect(() => {
      const tabParam = searchParams.get('tab');
      if (tabParam && ['meter-reading', 'other-Products', 'report'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }, [searchParams]);

    // Group data by branch
    const dataByBranch = branches.map((branch) => ({
      branchId: branch.id,
      branchName: branch.name,
      meterReading: meterReading.filter((reading: MeterReading) => reading.branchId === branch.id),
      oil: oil.filter((o: Oil) => o.branchId === branch.id),
      sales: sales.filter((sale: Sales) => sale.branchId === branch.id)
    }));

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meter Reading</h1>
            <p className="text-muted-foreground">Track daily meter readings for all nozzles by branch</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => router.push('/meter-reading/wizard')}>
              <Plus className="w-4 h-4 mr-2" />
              All Records
            </Button>
            {activeTab === "meter-reading" ? <MeterReadingFormSheet key={activeBranch} branchId={activeBranch} userRole={userRole} userBranchId={branches.find(b => b.id === activeBranch)?.id} /> : activeTab === "other-Products" ? <OilFormModal key={activeBranch} branchId={activeBranch} userRole={userRole} userBranchId={branches.find(b => b.id === activeBranch)?.id} /> : ""}
          </div>
        </div>

        {/* Branch Tabs */}
        <Tabs value={activeBranch} onValueChange={setActiveBranch} className="w-full">
          <TabsList className="mb-4 flex flex-wrap gap-2 w-full">
            {branches.map((branch) => (
              <TabsTrigger key={branch.id} value={branch.id}>
                {branch.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {dataByBranch.map(({ branchId, branchName, meterReading: branchMeterReading, oil: branchOil, sales: branchSales }) => (
            <TabsContent key={branchId} value={branchId}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branchName} Meter Reading</h2>
                <p className="text-sm text-muted-foreground">
                  {branchMeterReading.length} meter reading{branchMeterReading.length !== 1 ? 's' : ''} in this branch
                </p>
              </div>

              {/* Content Tabs for each branch */}
              <Tabs
                value={activeTab}
                className="w-full"
                onValueChange={(value) => setActiveTab(value)}
              >
                <TabsList>
                  <TabsTrigger value="meter-reading">Meter Reading</TabsTrigger>
                  <TabsTrigger value="other-Products">Other Products</TabsTrigger>
                  <TabsTrigger value="report">Report</TabsTrigger>
                </TabsList>

                <TabsContent value="meter-reading">
                  <MeterReadingTable data={branchMeterReading} userRole={userRole} branchId={branchId}/>
                </TabsContent>

                <TabsContent value="other-Products">
                  <OilTable data={branchOil} columns={oilColumns} branchId={branchId}/>
                </TabsContent>

                <TabsContent value="report">
                  <ReportTableWithDynamicColumns 
                    data={branchSales} 
                    userRole={userRole}
                    branchId={branchId}
                    pagination={salesPagination}
                    currentPage={currentPage}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

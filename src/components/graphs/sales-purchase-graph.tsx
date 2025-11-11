"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { getMonthlySalesAndPurchases } from "@/lib/actions/getMonthlySalesAndPurchases";

type ChartData = {
  month: string;
  value: number;
};

interface DashboardChartsProps {
  branchId?: string;
  initialSalesData?: ChartData[];
  initialPurchaseData?: ChartData[];
}

export default function DashboardCharts({ 
  branchId, 
  initialSalesData = [], 
  initialPurchaseData = [] 
}: DashboardChartsProps) {
  const [salesData, setSalesData] = useState<ChartData[]>(initialSalesData);
  const [purchaseData, setPurchaseData] = useState<ChartData[]>(initialPurchaseData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (branchId) {
      setLoading(true);
      getMonthlySalesAndPurchases(branchId)
        .then((data) => {
          setSalesData(data.salesData);
          setPurchaseData(data.purchaseData);
        })
        .catch((error) => {
          console.error("Error fetching monthly data:", error);
          setSalesData([]);
          setPurchaseData([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setSalesData(initialSalesData);
      setPurchaseData(initialPurchaseData);
    }
  }, [branchId, initialSalesData, initialPurchaseData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Sales Graph */}
      <Card className="shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle>Monthly Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchases Graph */}
      <Card className="shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle>Monthly Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : purchaseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={purchaseData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

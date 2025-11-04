"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, Truck } from "lucide-react";
import { useEffect, useState } from "react";

interface PurchaseTotals {
  xgDiesel: number;
  hsdDiesel: number;
  msPetrol: number;
  twoTOil: number;
}

interface PurchaseSummaryCardsProps {
  branchId: string;
}

export function PurchaseSummaryCards({ branchId }: PurchaseSummaryCardsProps) {
  const [totals, setTotals] = useState<PurchaseTotals>({
    xgDiesel: 0,
    hsdDiesel: 0,
    msPetrol: 0,
    twoTOil: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) {
      setLoading(false);
      return;
    }

    const fetchTotals = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/purchases?branchId=${branchId}&includeTotals=true&limit=1`);
        const result = await response.json();
        
        if (response.ok && result.totals) {
          setTotals(result.totals);
        }
      } catch (error) {
        console.error('Error fetching purchase totals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTotals();
  }, [branchId]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total XG-DIESEL Purchases</CardTitle>
          <Fuel className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">{totals.xgDiesel.toFixed(2)}L</div>
          <p className="text-xs text-muted-foreground">All time purchases</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total HSD-DIESEL Purchases</CardTitle>
          <Fuel className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{totals.hsdDiesel.toFixed(2)}L</div>
          <p className="text-xs text-muted-foreground">All time purchases</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MS-PETROL Purchases</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{totals.msPetrol.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Completed orders</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">2T-OIL Purchases</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-violet-600">{totals.twoTOil.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Completed orders</p>
        </CardContent>
      </Card>
    </div>
  );
}


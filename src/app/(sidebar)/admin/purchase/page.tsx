export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {  Fuel, Truck, } from "lucide-react";
import { Purchase } from "@/types/purchase";
import { PurchaseOrder } from "@/types/purchase-order";
import PurchaseManagement from "@/components/purchase/purchase-management";
import { headers, cookies } from "next/headers";
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function PurchasePage() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const cookie = (await cookies()).toString();

  // Get session to check user role and branch
  const session = await auth.api.getSession({
    headers: hdrs,
  });

  if (!session) {
    redirect('/login');
  }

  const userBranchId = typeof session.user.branch === 'string' ? session.user.branch : undefined;
  
  // Fetch purchases, purchase orders, and branches
  const [purchaseRes, orderRes, branchesRes] = await Promise.all([
    fetch(`${proto}://${host}/api/purchases`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/purchase-order`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/branch`, {
      cache: "no-store",
      headers: { cookie },
    })
  ]);
  
  const { purchase = [] } = await purchaseRes.json();
  const { purchaseOrder } = await orderRes.json();
  const { data: branches } = await branchesRes.json();

  // Group purchases by branch
  const purchasesByBranch = branches.map((branch: { id: string; name: string }) => ({
    branchId: branch.id,
    branchName: branch.name,
    purchases: purchase.filter((p: Purchase) => p.branchId === branch.id),
    purchaseOrders: purchaseOrder.filter((po: PurchaseOrder) => po.branchId === branch.id)
  }));

  return (
    <div className="flex flex-1 flex-col">
      <Tabs defaultValue={branches[0]?.id} className="w-full">
        <TabsList className="mb-4 flex flex-wrap gap-2">
          {branches.map((branch: { id: string; name: string }) => (
            <TabsTrigger key={branch.id} value={branch.id}>
              {branch.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {purchasesByBranch.map(({ branchId, branchName, purchases, purchaseOrders }: { branchId: string; branchName: string; purchases: Purchase[]; purchaseOrders: PurchaseOrder[] }) => {
          const xpTotal = purchases.filter((p: Purchase) => p.productType === "XG-DIESEL")
                        .reduce((sum: number, p: Purchase) => sum + p.quantity, 0) ?? 0;
          const hsdTotal = purchases.filter((p: Purchase) => p.productType === "HSD-DIESEL")
                        .reduce((sum: number, p: Purchase) => sum + p.quantity, 0);
          const msTotal = purchases.filter((p: Purchase) => p.productType === "MS-PETROL")
                        .reduce((sum: number, p: Purchase) => sum + p.quantity, 0);
          const twoTTodal = purchases.filter((p: Purchase) => p.productType === "2T-OIL")
                        .reduce((sum: number, p: Purchase) => sum + p.quantity, 0);

          return (
            <TabsContent key={branchId} value={branchId}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branchName} Purchases</h2>
                <p className="text-sm text-muted-foreground">
                  {purchases.length} purchase{purchases.length !== 1 ? 's' : ''} in this branch
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total XG-DIESEL Purchases</CardTitle>
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">{xpTotal.toFixed(2)}L</div>
                    <p className="text-xs text-muted-foreground">All time purchases</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total HSD-DIESEL Purchases</CardTitle>
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">{hsdTotal.toFixed(2)}L</div>
                    <p className="text-xs text-muted-foreground">All time purchases</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">MS-PETROL Purchases</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{msTotal.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Completed orders</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">2T-OIL Purchases</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-violet-600">{twoTTodal.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Completed orders</p>
                  </CardContent>
                </Card>
              </div>
              
              <PurchaseManagement 
                purchase={purchases} 
                purchaseOrder={purchaseOrders}
                userRole={session.user.role || undefined}
                userBranchId={userBranchId}
                branchId={branchId}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

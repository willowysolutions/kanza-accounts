export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {  Fuel, Truck, } from "lucide-react";
import { Purchase } from "@/types/purchase";
import PurchaseManagement from "@/components/purchase/purchase-management";

export default async function PurchasePage() {
    const purchaseRes = await fetch("http://localhost:3000/api/purchases")
    const {purchase =[]} = await purchaseRes.json() 
    console.log(purchase);
    

    const orderRes = await fetch("http://localhost:3000/api/purchase-order")
    const {purchaseOrder} = await orderRes.json()     

    const xpTotal = purchase.filter((purchase: Purchase) => purchase.productType === "XP-DIESEL")
                      .reduce((sum: number, purchase: Purchase) => sum + purchase.quantity, 0) ?? 0;

    const hsdTotal = purchase.filter((purchase: Purchase) => purchase.productType === "HSD-DIESEL")
                      .reduce((sum: number, purchase: Purchase) => sum + purchase.quantity, 0);
    
    const msTotal = purchase.filter((purchase: Purchase) => purchase.productType === "MS-PETROL")
                      .reduce((sum: number, purchase: Purchase) => sum + purchase.quantity, 0);
    
    const twoTTodal = purchase.filter((purchase: Purchase) => purchase.productType === "2T-OIL")
                      .reduce((sum: number, purchase: Purchase) => sum + purchase.quantity, 0);
    

  return (
    <div className="flex flex-1 flex-col">
        <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP-DIESEL Purchases</CardTitle>
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
      <PurchaseManagement purchase={purchase} purchaseOrder={purchaseOrder}/>
    </div>
  );
}

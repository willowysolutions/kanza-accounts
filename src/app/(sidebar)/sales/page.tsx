export const dynamic = "force-dynamic";

import { SalesTable } from "@/components/sales/sales-table";
import { SalesFormModal } from "@/components/sales/sales-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Receipt, ShoppingCart, TrendingUp } from "lucide-react";
import { salesColumns } from "@/components/sales/sales-column";


export default async function SalesPage() {

  return (
    <div className="flex flex-1 flex-col">
    <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* <div className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</div> */}
            <div className="text-2xl font-bold">₹25,525</div>
            {/* <p className="text-xs text-muted-foreground">{todaySales.length} transactions</p> */}
            <p className="text-xs text-muted-foreground">4 transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel Sold</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* <div className="text-2xl font-bold">{totalQuantity.toFixed(1)}L</div> */}
            <div className="text-2xl font-bold">283.4L</div>
            <p className="text-xs text-muted-foreground">Total volume today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                ₹6426
              {/* ₹{todaySales.length > 0 ? (totalAmount / todaySales.length).toFixed(0) : "0"} */}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* <div className="text-2xl font-bold">
              ₹{todaySales.filter(s => s.paymentMethod === "Cash").reduce((sum, s) => sum + s.amount, 0).toLocaleString()}
            </div> */}
            <div className="text-2xl font-bold">
                ₹25,12.17
            </div>
            <p className="text-xs text-muted-foreground">Cash transactions</p>
          </CardContent>
        </Card>
      </div>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sales Management</h1>
              <p className="text-muted-foreground">Track and manage fuel sales transactions</p>
            </div>
            <SalesFormModal />
          </div>

          <SalesTable data={[]} columns={salesColumns}/>
        </div>
      </div>
    </div>
  );
}

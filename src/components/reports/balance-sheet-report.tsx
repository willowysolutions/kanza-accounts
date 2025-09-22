"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BalanceSheetReportProps {
  branchId: string;
  branchName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sales: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  credits: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expenses: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bankDeposits: any[];
}

export function BalanceSheetReport({
  sales,
  credits,
  expenses,
  bankDeposits,
}: BalanceSheetReportProps) {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  // Filter data by selected month
  const filteredData = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const filteredSales = sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      return saleDate.getFullYear() === year && saleDate.getMonth() === month;
    });

    const filteredCredits = credits.filter((credit) => {
      const creditDate = new Date(credit.date);
      return creditDate.getFullYear() === year && creditDate.getMonth() === month;
    });

    const filteredExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
    });

    const filteredBankDeposits = bankDeposits.filter((deposit) => {
      const depositDate = new Date(deposit.date);
      return depositDate.getFullYear() === year && depositDate.getMonth() === month;
    });

    return {
      sales: filteredSales,
      credits: filteredCredits,
      expenses: filteredExpenses,
      bankDeposits: filteredBankDeposits,
    };
  }, [sales, credits, expenses, bankDeposits, selectedMonth]);

  // Calculate products sold data
  const productsData = useMemo(() => {
    const productTotals: { [key: string]: number } = {};
    
    filteredData.sales.forEach((sale) => {
      if (sale.msPetrolTotal) productTotals['MS-PETROL'] = (productTotals['MS-PETROL'] || 0) + sale.msPetrolTotal;
      if (sale.hsdDieselTotal) productTotals['HSD-DIESEL'] = (productTotals['HSD-DIESEL'] || 0) + sale.hsdDieselTotal;
      if (sale.xgDieselTotal) productTotals['XG-DIESEL'] = (productTotals['XG-DIESEL'] || 0) + sale.xgDieselTotal;
    });

    return Object.entries(productTotals).map(([product, total]) => ({
      product,
      total,
    }));
  }, [filteredData.sales]);

  // Calculate customer credits data
  const customerCreditsData = useMemo(() => {
    const customerTotals: { [key: string]: { credit: number; received: number } } = {};
    
    filteredData.credits.forEach((credit) => {
      const customerName = credit.customer?.name || 'Unknown';
      if (!customerTotals[customerName]) {
        customerTotals[customerName] = { credit: 0, received: 0 };
      }
      customerTotals[customerName].credit += credit.amount || 0;
    });

    // For received amounts, we'll use the sales data where customer is involved
    filteredData.sales.forEach((sale) => {
      if (sale.customer?.name) {
        const customerName = sale.customer.name;
        if (!customerTotals[customerName]) {
          customerTotals[customerName] = { credit: 0, received: 0 };
        }
        customerTotals[customerName].received += sale.rate || 0;
      }
    });

    return Object.entries(customerTotals).map(([customer, totals]) => ({
      customer,
      credit: totals.credit,
      received: totals.received,
    }));
  }, [filteredData.credits, filteredData.sales]);

  // Calculate expense categories data
  const expenseCategoriesData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    
    filteredData.expenses.forEach((expense) => {
      const categoryName = expense.category?.name || 'Unknown';
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + (expense.amount || 0);
    });

    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total,
    }));
  }, [filteredData.expenses]);

  // Calculate bank deposits data
  const bankDepositsData = useMemo(() => {
    const bankTotals: { [key: string]: number } = {};
    
    filteredData.bankDeposits.forEach((deposit) => {
      const bankName = deposit.bank?.bankName || 'Unknown';
      bankTotals[bankName] = (bankTotals[bankName] || 0) + (deposit.amount || 0);
    });

    return Object.entries(bankTotals).map(([bank, total]) => ({
      bank,
      total,
    }));
  }, [filteredData.bankDeposits]);

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-semibold">Select Month:</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !selectedMonth && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedMonth ? format(selectedMonth, "MMMM yyyy") : <span>Pick a month</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedMonth}
              onSelect={(date) => date && setSelectedMonth(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Grid Layout: 2 Rows x 2 Columns */}
      <div className="space-y-6">
        {/* Top Row: Customer Credits & Expense Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Credits Table */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Credits & Received - {format(selectedMonth, "MMMM yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Customer Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Credit Given (₹)</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Amount Received (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerCreditsData.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">{item.customer}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {item.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {item.received.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    {customerCreditsData.length === 0 && (
                      <tr>
                        <td colSpan={3} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                          No data available for this month
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td className="border border-gray-300 px-4 py-2">TOTAL</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {customerCreditsData.reduce((sum, item) => sum + item.credit, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {customerCreditsData.reduce((sum, item) => sum + item.received, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Expense Categories Table */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories - {format(selectedMonth, "MMMM yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Expense Category</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseCategoriesData.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">{item.category}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    {expenseCategoriesData.length === 0 && (
                      <tr>
                        <td colSpan={2} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                          No data available for this month
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td className="border border-gray-300 px-4 py-2">TOTAL</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {expenseCategoriesData.reduce((sum, item) => sum + item.total, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row: Products Sold & Bank Deposits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products Sold Table */}
          <Card>
            <CardHeader>
              <CardTitle>Products Sold - {format(selectedMonth, "MMMM yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsData.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">{item.product}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    {productsData.length === 0 && (
                      <tr>
                        <td colSpan={2} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                          No data available for this month
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td className="border border-gray-300 px-4 py-2">TOTAL</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {productsData.reduce((sum, item) => sum + item.total, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Bank Deposits Table */}
          <Card>
            <CardHeader>
              <CardTitle>Bank Deposits - {format(selectedMonth, "MMMM yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Bank Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Total Deposits (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankDepositsData.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">{item.bank}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    {bankDepositsData.length === 0 && (
                      <tr>
                        <td colSpan={2} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                          No data available for this month
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td className="border border-gray-300 px-4 py-2">TOTAL</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {bankDepositsData.reduce((sum, item) => sum + item.total, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

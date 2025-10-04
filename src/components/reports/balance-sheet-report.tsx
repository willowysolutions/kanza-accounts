"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { BalanceSheetExport } from "./balance-sheet-export";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BalanceSheetReportProps {
  branchName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sales: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  credits: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expenses: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bankDeposits: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payments: any[];
}

export function BalanceSheetReport({
  branchName,
  sales,
  credits,
  expenses,
  bankDeposits,
  payments,
}: BalanceSheetReportProps) {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedMonthValue, setSelectedMonthValue] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );

  // Generate month options for the last 12 months
  const monthOptions = useMemo(() => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const value = `${year}-${String(month).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    
    return options;
  }, []);

  const handleMonthChange = (value: string) => {
    setSelectedMonthValue(value);
    const [year, month] = value.split('-').map(Number);
    setSelectedMonth(new Date(year, month - 1, 1));
  };

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

    const filteredPayments = payments.filter((payment) => {
      const paymentDate = new Date(payment.paidOn);
      return paymentDate.getFullYear() === year && paymentDate.getMonth() === month;
    });

    return {
      sales: filteredSales,
      credits: filteredCredits,
      expenses: filteredExpenses,
      bankDeposits: filteredBankDeposits,
      payments: filteredPayments,
    };
  }, [sales, credits, expenses, bankDeposits, payments, selectedMonth]);

  // Calculate products sold data
  const productsData = useMemo(() => {
    const productTotals: { [key: string]: number } = {};
    
    filteredData.sales.forEach((sale) => {
      // Process dynamic products from the products field
      if (sale.products && typeof sale.products === 'object') {
        Object.entries(sale.products).forEach(([productName, amount]) => {
          if (typeof amount === 'number' && amount > 0) {
            productTotals[productName] = (productTotals[productName] || 0) + amount;
          }
        });
      }
      
      // Also include legacy fuel totals for backward compatibility
      if (sale.msPetrolTotal) productTotals['MS-PETROL'] = (productTotals['MS-PETROL'] || 0) + sale.msPetrolTotal;
      if (sale.hsdDieselTotal) productTotals['HSD-DIESEL'] = (productTotals['HSD-DIESEL'] || 0) + sale.hsdDieselTotal;
      if (sale.xgDieselTotal) productTotals['XG-DIESEL'] = (productTotals['XG-DIESEL'] || 0) + sale.xgDieselTotal;
    });

    // Sort products alphabetically for consistent display
    return Object.entries(productTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([product, total]) => ({
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

  // Calculate customer credit and received data (enhanced version)
  const customerCreditReceivedData = useMemo(() => {
    const customerTotals: { [key: string]: { credit: number; received: number } } = {};
    
    // Process credits
    filteredData.credits.forEach((credit) => {
      const customerName = credit.customer?.name || 'Unknown';
      if (!customerTotals[customerName]) {
        customerTotals[customerName] = { credit: 0, received: 0 };
      }
      customerTotals[customerName].credit += credit.amount || 0;
    });

    // Process payments received
    filteredData.payments.forEach((payment) => {
      if (payment.customer?.name) {
        const customerName = payment.customer.name;
        if (!customerTotals[customerName]) {
          customerTotals[customerName] = { credit: 0, received: 0 };
        }
        customerTotals[customerName].received += payment.paidAmount || 0;
      }
    });

    return Object.entries(customerTotals).map(([customer, totals]) => ({
      customer,
      credit: totals.credit,
      received: totals.received,
    }));
  }, [filteredData.credits, filteredData.payments]);

  // Calculate payment methods data from sales
  const paymentMethodsData = useMemo(() => {
    const methodTotals: { [key: string]: number } = {
      'Cash': 0,
      'ATM': 0,
      'Paytm': 0,
      'Fleet': 0,
    };
    
    filteredData.sales.forEach((sale) => {
      methodTotals['Cash'] += sale.cashPayment || 0;
      methodTotals['ATM'] += sale.atmPayment || 0;
      methodTotals['Paytm'] += sale.paytmPayment || 0;
      methodTotals['Fleet'] += sale.fleetPayment || 0;
    });

    // Only return methods that have values > 0
    return Object.entries(methodTotals)
      .filter(([, total]) => total > 0)
      .map(([method, total]) => ({
        method,
        total,
      }));
  }, [filteredData.sales]);

  return (
    <div className="space-y-6">
      {/* Month Selector and Export Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Select Month:</h3>
          <Select value={selectedMonthValue} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select a month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <BalanceSheetExport
          branchName={branchName}
          selectedMonth={selectedMonth}
          productsData={productsData}
          customerCreditsData={customerCreditsData}
          expenseCategoriesData={expenseCategoriesData}
          bankDepositsData={bankDepositsData}
          customerCreditReceivedData={customerCreditReceivedData}
          paymentMethodsData={paymentMethodsData}
        />
      </div>

      {/* Customer Credit and Received Table - Moved to Top */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Credit & Received - {format(selectedMonth, "MMMM yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Customer Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Debit (₹)</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {customerCreditReceivedData.map((item, index) => (
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
                  {customerCreditReceivedData.length === 0 && (
                    <tr>
                      <td colSpan={3} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                        No data available for this month
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-primary text-primary-foreground font-semibold">
                    <td className="border border-gray-300 px-4 py-2">TOTAL</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {customerCreditReceivedData.reduce((sum, item) => sum + item.credit, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {customerCreditReceivedData.reduce((sum, item) => sum + item.received, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Grid Layout: 2 Rows x 2 Columns */}
        <div className="space-y-6">
          {/* Top Row: Expense Categories & Products Sold */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Categories Table */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Categories - {format(selectedMonth, "MMMM yyyy")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">Expense</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Total Amount </th>
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
                      <tr className="bg-primary text-primary-foreground font-semibold">
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

            {/* Products Sold Table */}
            <Card>
              <CardHeader>
                <CardTitle>Products Sold - {format(selectedMonth, "MMMM yyyy")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Total Amount </th>
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
                      <tr className="bg-primary text-primary-foreground font-semibold">
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
          </div>

          {/* Bottom Row: Bank Deposits & Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bank Deposits Table */}
            <Card>
              <CardHeader>
                <CardTitle>Bank Deposits - {format(selectedMonth, "MMMM yyyy")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr>
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
                      <tr className="bg-primary text-primary-foreground font-semibold">
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

            {/* Payment Methods Table */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods Total - {format(selectedMonth, "MMMM yyyy")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">Payment Method</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Total Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentMethodsData.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-4 py-2">{item.method}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      {paymentMethodsData.length === 0 && (
                        <tr>
                          <td colSpan={2} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                            No data available for this month
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-primary text-primary-foreground font-semibold">
                        <td className="border border-gray-300 px-4 py-2">TOTAL</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {paymentMethodsData.reduce((sum, item) => sum + item.total, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
    </div>
  );
}

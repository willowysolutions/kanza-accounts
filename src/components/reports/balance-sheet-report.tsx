"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { BalanceSheetExport } from "./balance-sheet-export";
import { PaymentMethodsExport } from "./payment-methods-export";
import { ExpenseCategoriesExport } from "./expense-categories-export";
import { CustomerCreditReceivedExport } from "./customer-credit-received-export";
import { ProductsSoldExport } from "./products-sold-export";
import { ExpenseCategoryHistoryModal } from "./expense-category-history-modal";
import { PaymentMethodHistoryModal } from "./payment-method-history-modal";
import { BankDepositHistoryModal } from "./bank-deposit-history-modal";
import { BankDepositsExport } from "./bank-deposits-export";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

interface BalanceSheetReportProps {
  branchName: string;
  branchId?: string;
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
  branchId,
  sales,
  credits,
  expenses,
  bankDeposits,
  payments,
}: BalanceSheetReportProps) {
  // Date filter state
  const [dateFilter, setDateFilter] = useState<string>("month");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined);

  // Filter states
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("all");
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedBank, setSelectedBank] = useState<string>("all");

  // Expense category history modal state
  const [selectedCategoryForHistory, setSelectedCategoryForHistory] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Payment method history modal state
  const [selectedPaymentMethodForHistory, setSelectedPaymentMethodForHistory] = useState<string | null>(null);
  const [isPaymentMethodHistoryModalOpen, setIsPaymentMethodHistoryModalOpen] = useState(false);

  // Bank deposit history modal state
  const [selectedBankForHistory, setSelectedBankForHistory] = useState<string | null>(null);
  const [isBankHistoryModalOpen, setIsBankHistoryModalOpen] = useState(false);

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

  // Calculate date range based on filter type
  const getDateRangeForFilter = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    switch (dateFilter) {
      case "month": {
        // Use selected month if available, otherwise current month
        const selectedMonthValue = selectedDate ? selectedDate : new Date();
        startDate = new Date(selectedMonthValue.getFullYear(), selectedMonthValue.getMonth(), 1);
        endDate = new Date(selectedMonthValue.getFullYear(), selectedMonthValue.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case "week": {
        // Calculate start of week (Sunday) for the current week
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - day);
        startDate = new Date(startOfWeek);
        startDate.setHours(0, 0, 0, 0);
        // End of week is Saturday (6 days from Sunday)
        endDate = new Date(startOfWeek);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case "day": {
        const targetDate = selectedDate || now;
        startDate = new Date(targetDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case "custom": {
        if (dateRange?.from && dateRange?.to) {
          startDate = new Date(dateRange.from);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(dateRange.to);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      }
      case "all":
      default:
        startDate = undefined;
        endDate = undefined;
        break;
    }
    
    return { startDate, endDate };
  }, [dateFilter, selectedDate, dateRange]);

  // Filter data by selected date range
  const filteredData = useMemo(() => {
    const { startDate, endDate } = getDateRangeForFilter;

    const filterByDate = (date: Date | string) => {
      if (!startDate || !endDate) return true;
      const itemDate = new Date(date);
      return itemDate >= startDate && itemDate <= endDate;
    };

    const filteredSales = sales.filter((sale) => filterByDate(sale.date));
    const filteredCredits = credits.filter((credit) => filterByDate(credit.date));
    const filteredExpenses = expenses.filter((expense) => filterByDate(expense.date));
    const filteredBankDeposits = bankDeposits.filter((deposit) => filterByDate(deposit.date));
    const filteredPayments = payments.filter((payment) => filterByDate(payment.paidOn));

    return {
      sales: filteredSales,
      credits: filteredCredits,
      expenses: filteredExpenses,
      bankDeposits: filteredBankDeposits,
      payments: filteredPayments,
    };
  }, [sales, credits, expenses, bankDeposits, payments, getDateRangeForFilter]);

  // Calculate all products (unfiltered) for dropdown options
  const allProducts = useMemo(() => {
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

  // Calculate products sold data (filtered)
  const productsData = useMemo(() => {
    // Filter by selected product
    if (selectedProduct !== "all") {
      return allProducts.filter(item => item.product === selectedProduct);
    }

    return allProducts;
  }, [allProducts, selectedProduct]);

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

  // Calculate all expense categories (unfiltered) for dropdown options
  const allExpenseCategories = useMemo(() => {
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

  // Calculate expense categories data (filtered)
  const expenseCategoriesData = useMemo(() => {
    // Filter by selected expense category
    if (selectedExpenseCategory !== "all") {
      return allExpenseCategories.filter(item => item.category === selectedExpenseCategory);
    }

    return allExpenseCategories;
  }, [allExpenseCategories, selectedExpenseCategory]);

  // Calculate all banks (unfiltered) for dropdown options
  const allBanks = useMemo(() => {
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

  // Calculate bank deposits data (filtered)
  const bankDepositsData = useMemo(() => {
    // Filter by selected bank
    if (selectedBank !== "all") {
      return allBanks.filter(item => item.bank === selectedBank);
    }

    return allBanks;
  }, [allBanks, selectedBank]);

  // Calculate all customers (unfiltered) for dropdown options
  const allCustomers = useMemo(() => {
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

  // Calculate customer credit and received data (filtered)
  const customerCreditReceivedData = useMemo(() => {
    // Filter by selected customer
    if (selectedCustomer !== "all") {
      return allCustomers.filter(item => item.customer === selectedCustomer);
    }

    return allCustomers;
  }, [allCustomers, selectedCustomer]);

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

    // Get all methods with values > 0
    let allMethods = Object.entries(methodTotals)
      .filter(([, total]) => total > 0)
      .map(([method, total]) => ({
        method,
        total,
      }));

    // Filter by selected payment mode
    if (selectedPaymentMode !== "all") {
      allMethods = allMethods.filter(item => item.method === selectedPaymentMode);
    }

    return allMethods;
  }, [filteredData.sales, selectedPaymentMode]);

  // Get display label for date filter
  const getDateFilterLabel = () => {
    const { startDate, endDate } = getDateRangeForFilter;
    
    switch (dateFilter) {
      case "month":
        if (selectedDate) {
          return format(selectedDate, "MMMM yyyy");
        }
        return format(new Date(), "MMMM yyyy");
      case "week":
        if (startDate && endDate) {
          return `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`;
        }
        return "This Week";
      case "day":
        if (selectedDate) {
          return format(selectedDate, "dd/MM/yyyy");
        }
        return format(new Date(), "dd/MM/yyyy");
      case "custom":
        if (dateRange?.from && dateRange?.to) {
          return `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`;
        }
        return "Custom Date Range";
      case "all":
      default:
        return "All Time";
    }
  };

  // Get selected month for backward compatibility with export
  const selectedMonth = useMemo(() => {
    if (dateFilter === "month" && selectedDate) {
      return selectedDate;
    }
    return new Date();
  }, [dateFilter, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Date Filter and Export Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <h3 className="text-lg font-semibold">Filter by Date:</h3>
          <Select value={dateFilter} onValueChange={(value) => {
            setDateFilter(value);
            if (value !== "month" && value !== "day") {
              setSelectedDate(undefined);
            }
            if (value !== "custom") {
              setDateRange(undefined);
            }
            if (value === "month" && !selectedDate) {
              setSelectedDate(new Date());
            }
            if (value === "day" && !selectedDate) {
              setSelectedDate(new Date());
            }
          }}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Select filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="custom">Custom Date Range</SelectItem>
            </SelectContent>
          </Select>

          {/* Month selector for monthly filter */}
          {dateFilter === "month" && (
            <Select
              value={selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}` : ""}
              onValueChange={(value) => {
                const [year, month] = value.split('-').map(Number);
                setSelectedDate(new Date(year, month - 1, 1));
              }}
            >
              <SelectTrigger className="w-[240px] bg-white">
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
          )}

          {/* Day selector for daily filter */}
          {dateFilter === "day" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-white">
                  <CalendarIcon className="h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Select Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                />
                {selectedDate && (
                  <div className="p-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedDate(undefined)}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )}

          {/* Custom date range picker */}
          {dateFilter === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-white">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                    : "Pick date range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange as DateRange}
                  onSelect={(range) => setDateRange(range)}
                  numberOfMonths={2}
                />
                {dateRange?.from && dateRange?.to && (
                  <div className="p-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setDateRange(undefined)}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )}
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
      
      {/* Date filter display */}
      <div className="text-sm text-muted-foreground">
        Showing data for: <span className="font-semibold">{getDateFilterLabel()}</span>
      </div>

      {/* Customer Credit and Received Table - Moved to Top */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                  <CardTitle>Customer Credit & Received - {getDateFilterLabel()}</CardTitle>
              <CustomerCreditReceivedExport
                branchName={branchName}
                selectedMonth={selectedMonth}
                customerCreditReceivedData={customerCreditReceivedData}
                selectedCustomer={selectedCustomer}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-4">
              <label className="text-sm font-medium">Filter by Customer:</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="w-[240px] bg-white">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {allCustomers.map((item) => (
                    <SelectItem key={item.customer} value={item.customer}>
                      {item.customer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                        No data available for this month{selectedCustomer !== "all" ? ` and customer` : ""}
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
                <div className="flex items-center justify-between">
                  <CardTitle>Expense Categories - {getDateFilterLabel()}</CardTitle>
                  <ExpenseCategoriesExport
                    branchName={branchName}
                    selectedMonth={selectedMonth}
                    expenseCategoriesData={expenseCategoriesData}
                    selectedExpenseCategory={selectedExpenseCategory}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4">
                  <label className="text-sm font-medium">Filter by Expense Category:</label>
                  <Select value={selectedExpenseCategory} onValueChange={setSelectedExpenseCategory}>
                    <SelectTrigger className="w-[240px] bg-white">
                      <SelectValue placeholder="All Expense Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Expense Categories</SelectItem>
                      {allExpenseCategories.map((item) => (
                        <SelectItem key={item.category} value={item.category}>
                          {item.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                          <td className="border border-gray-300 px-4 py-2">
                            <button
                              className="text-blue-600 hover:underline cursor-pointer"
                              onClick={() => {
                                setSelectedCategoryForHistory(item.category);
                                setIsHistoryModalOpen(true);
                              }}
                            >
                              {item.category}
                            </button>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      {expenseCategoriesData.length === 0 && (
                        <tr>
                          <td colSpan={2} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                            No data available for this month{selectedExpenseCategory !== "all" ? ` and expense category` : ""}
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
                <div className="flex items-center justify-between">
                  <CardTitle>Products Sold - {getDateFilterLabel()}</CardTitle>
                  <ProductsSoldExport
                    branchName={branchName}
                    selectedMonth={selectedMonth}
                    productsData={productsData}
                    selectedProduct={selectedProduct}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4">
                  <label className="text-sm font-medium">Filter by Product:</label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="w-[240px] bg-white">
                      <SelectValue placeholder="All Products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      {allProducts.map((item) => (
                        <SelectItem key={item.product} value={item.product}>
                          {item.product}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                            No data available for this month{selectedProduct !== "all" ? ` and product` : ""}
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
                <div className="flex items-center justify-between">
                  <CardTitle>Bank Deposits - {getDateFilterLabel()}</CardTitle>
                  <BankDepositsExport
                    branchName={branchName}
                    selectedMonth={selectedMonth}
                    bankDepositsData={bankDepositsData}
                    selectedBank={selectedBank}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4">
                  <label className="text-sm font-medium">Filter by Bank:</label>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger className="w-[240px] bg-white">
                      <SelectValue placeholder="All Banks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Banks</SelectItem>
                      {allBanks.map((item) => (
                        <SelectItem key={item.bank} value={item.bank}>
                          {item.bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                          <td className="border border-gray-300 px-4 py-2">
                            <button
                              onClick={() => {
                                setSelectedBankForHistory(item.bank);
                                setIsBankHistoryModalOpen(true);
                              }}
                              className="text-blue-600 hover:underline cursor-pointer"
                            >
                              {item.bank}
                            </button>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      {bankDepositsData.length === 0 && (
                        <tr>
                          <td colSpan={2} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                            No data available for this month{selectedBank !== "all" ? ` and bank` : ""}
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
                <div className="flex items-center justify-between">
                  <CardTitle>Payment Methods Total - {getDateFilterLabel()}</CardTitle>
                  <PaymentMethodsExport
                    branchName={branchName}
                    selectedMonth={selectedMonth}
                    paymentMethodsData={paymentMethodsData}
                    selectedPaymentMode={selectedPaymentMode}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4">
                  <label className="text-sm font-medium">Filter by Payment Mode:</label>
                  <Select value={selectedPaymentMode} onValueChange={setSelectedPaymentMode}>
                    <SelectTrigger className="w-[180px] bg-white">
                      <SelectValue placeholder="All Payment Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment Methods</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="ATM">ATM</SelectItem>
                      <SelectItem value="Paytm">Paytm</SelectItem>
                      <SelectItem value="Fleet">Fleet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                          <td className="border border-gray-300 px-4 py-2">
                            <button
                              className="text-blue-600 hover:underline cursor-pointer"
                              onClick={() => {
                                setSelectedPaymentMethodForHistory(item.method);
                                setIsPaymentMethodHistoryModalOpen(true);
                              }}
                            >
                              {item.method}
                            </button>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      {paymentMethodsData.length === 0 && (
                        <tr>
                          <td colSpan={2} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                            No data available for this month{selectedPaymentMode !== "all" ? ` and payment mode` : ""}
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

      {/* Expense Category History Modal */}
      {selectedCategoryForHistory && (
        <ExpenseCategoryHistoryModal
          categoryName={selectedCategoryForHistory}
          branchId={branchId}
          open={isHistoryModalOpen}
          onOpenChange={setIsHistoryModalOpen}
        />
      )}

      {/* Payment Method History Modal */}
      {selectedPaymentMethodForHistory && (
        <PaymentMethodHistoryModal
          paymentMethod={selectedPaymentMethodForHistory}
          branchId={branchId}
          open={isPaymentMethodHistoryModalOpen}
          onOpenChange={setIsPaymentMethodHistoryModalOpen}
        />
      )}
      {selectedBankForHistory && (
        <BankDepositHistoryModal
          bankName={selectedBankForHistory}
          branchId={branchId}
          open={isBankHistoryModalOpen}
          onOpenChange={setIsBankHistoryModalOpen}
        />
      )}
    </div>
  );
}

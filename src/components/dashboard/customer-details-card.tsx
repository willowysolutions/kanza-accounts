"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer } from '@/types/customer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomerHistoryModal } from '@/components/customers/customer-history-modal';
import { CustomerDownloadButton } from './customer-download-button';
import { useState } from 'react';

interface CustomerDetailsCardProps {
  customers: Customer[];
  branches: { id: string; name: string }[];
  role?: string | null;
  userBranchId?: string | undefined;
  page?: number;
}

export function CustomerDetailsCard({ 
  customers, 
  branches, 
  role, 
  userBranchId, 
  page = 0 
}: CustomerDetailsCardProps) {
  const isAdmin = (role ?? '').toLowerCase() === 'admin';
  const visibleBranches = isAdmin ? branches : branches.filter(b => b.id === (userBranchId ?? ''));

  // Pagination settings
  const pageSize = 5;
  const startIndex = Math.max(page, 0) * pageSize;
  const endIndex = startIndex + pageSize;

  // Group customers by branch
  const branchCustomersMap = new Map<string, Customer[]>();
  
  customers.forEach(customer => {
    const branchId = customer.branchId || 'no-branch';
    if (!branchCustomersMap.has(branchId)) {
      branchCustomersMap.set(branchId, []);
    }
    branchCustomersMap.get(branchId)!.push(customer);
  });

  // Prepare data for each branch
  const branchData = visibleBranches.map(branch => {
    const branchCustomers = branchCustomersMap.get(branch.id) || [];
    const totalPages = Math.ceil(branchCustomers.length / pageSize);
    const pageCustomers = branchCustomers.slice(startIndex, endIndex);
    
    return {
      branchId: branch.id,
      name: branch.name,
      customers: pageCustomers,
      totalPages,
      hasNext: page < totalPages - 1,
      hasPrevious: page > 0,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Details</CardTitle>
      </CardHeader>
      <CardContent>
        <CustomerTabs branchData={branchData} page={page} />
      </CardContent>
    </Card>
  );
}

function CustomerTabs({ 
  branchData, 
  page 
}: { 
  branchData: Array<{
    branchId: string;
    name: string;
    customers: Customer[];
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }>;
  page: number;
}) {
  return (
    <Tabs defaultValue={branchData[0]?.branchId} className="w-full">
      <TabsList className="mb-4 flex flex-wrap gap-2 w-full">
        {branchData.map(({ branchId, name }) => (
          <TabsTrigger key={branchId} value={branchId}>{name}</TabsTrigger>
        ))}
      </TabsList>

      {branchData.map(({ branchId, customers, hasPrevious }) => (
        <TabsContent key={branchId} value={branchId} className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Opening</th>
                <th className="p-2">Pending</th>
                <th className="p-2">Branch</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <CustomerRow key={customer.id} customer={customer} />
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-end gap-2">
            <a
              href={`?page=${Math.max(page - 1, 0)}`}
              className="inline-flex items-center rounded-md border px-3 py-1 text-sm disabled:opacity-50"
              aria-disabled={!hasPrevious}
            >
              Previous
            </a>
            <a
              href={`?page=${page + 1}`}
              className="inline-flex items-center rounded-md border px-3 py-1 text-sm"
            >
              Next
            </a>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function CustomerRow({ customer }: { customer: Customer }) {
  return (
    <tr className="border-b hover:bg-muted">
      <td className="p-2">
        <CustomerNameButton customer={customer} />
      </td>
      <td className="p-2">₹{customer.openingBalance?.toFixed(2) || '0.00'}</td>
      <td className={`p-2 ${(() => {
        const limit = (customer as { limit?: number }).limit;
        return limit && customer.outstandingPayments > limit ? 'text-red-600 font-semibold' : '';
      })()}`}>
        ₹{customer.outstandingPayments?.toFixed(2) || '0.00'}
      </td>
      <td className="p-2">{customer.branch?.name || '...'}</td>
      <td className="p-2">
        <CustomerDownloadButton customers={[customer]} />
      </td>
    </tr>
  );
}

// Separate component for the button to avoid useState in the main component
function CustomerNameButton({ customer }: { customer: Customer }) {
  const [openHistory, setOpenHistory] = useState(false);

  return (
    <>
      <button
        className="text-blue-600 hover:underline cursor-pointer"
        onClick={() => setOpenHistory(true)}
      >
        {customer.name}
      </button>
      
      <CustomerHistoryModal
        customerId={customer.id}
        open={openHistory}
        onOpenChange={setOpenHistory}
      />
    </>
  );
}

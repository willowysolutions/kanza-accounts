'use client';

import { SalesTable } from './sales-table';
import { salesColumns } from './sales-column';
import { Sales } from '@/types/sales';

interface SalesTableWrapperProps {
  data: Sales[];
  userRole?: string;
  branchId: string;
}

export function SalesTableWrapper({ data, userRole, branchId }: SalesTableWrapperProps) {
  return (
    <SalesTable 
      data={data} 
      columns={salesColumns(userRole)}
      userRole={userRole} 
      branchId={branchId}
    />
  );
}

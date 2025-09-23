// /app/api/machines/with-nozzles/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });  
  const { searchParams } = new URL(request.url);
  const queryBranchId = searchParams.get('branchId');
  
  // Use query branchId if provided, otherwise use session branchId
  const branchId = queryBranchId || session?.user?.branch;
  const whereMachine = session?.user?.role === 'admin' ? 
    (queryBranchId ? { branchId: queryBranchId } : {}) : 
    { branchId };

  const machines = await prisma.machine.findMany({
    where: whereMachine,
    select: {
      id: true,
      machineName: true,
      branchId: true,
      nozzle: {
        select: {
          id: true,
          nozzleNumber: true,
          fuelType: true,
          openingReading:true,
          meterreading: {
            orderBy: { date: 'desc' },
            take: 1,
            select: { closingReading: true },
          },
        },
      },
    },
    orderBy: { machineName: 'asc' },
  });

  const data = machines.map((m) => ({
    id: m.id,
    machineName: m.machineName,
    branchId: m.branchId,
    nozzles: m.nozzle.map((n) => ({
      id: n.id,
      nozzleNumber: n.nozzleNumber,
      fuelType: n.fuelType,
      openingReading: n.openingReading ?? null,
    })),
  }));

  return NextResponse.json({ data }, { status: 200 });
}

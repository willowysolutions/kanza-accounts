// /app/api/machines/with-nozzles/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });  
  const branchId = session?.user?.branch;
  const whereMachine = session?.user?.role === 'admin' ? {} : { branchId };

  const machines = await prisma.machine.findMany({
    where: whereMachine,
    select: {
      id: true,
      machineName: true,
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
    nozzles: m.nozzle.map((n) => ({
      id: n.id,
      nozzleNumber: n.nozzleNumber,
      fuelType: n.fuelType,
      openingReading: n.openingReading ?? null,
    })),
  }));

  return NextResponse.json({ data }, { status: 200 });
}

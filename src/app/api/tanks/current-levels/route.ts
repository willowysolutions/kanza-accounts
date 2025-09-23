import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Get tank current levels for real-time validation
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const { searchParams } = new URL(request.url);
    const queryBranchId = searchParams.get('branchId');
    
    // Use query branchId if provided, otherwise use session branchId
    const branchId = queryBranchId || session?.user?.branch;
    const whereClause = session?.user?.role === 'admin' ? 
      (queryBranchId ? { branchId: queryBranchId } : {}) : 
      { branchId };
    
    const tanks = await prisma.tank.findMany({
      where: whereClause,
      select: {
        id: true,
        fuelType: true,
        currentLevel: true,
        tankName: true,
        machineTanks: {
          select: {
            machine: {
              select: {
                id: true,
                machineName: true,
                nozzle: {
                  select: {
                    id: true,
                    fuelType: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Create a map of nozzleId -> tank current level
    const nozzleTankMap = new Map<string, { currentLevel: number; tankName: string; fuelType: string }>();
    
    tanks.forEach(tank => {
      tank.machineTanks.forEach(mt => {
        mt.machine.nozzle.forEach(nozzle => {
          if (nozzle.fuelType === tank.fuelType) {
            nozzleTankMap.set(nozzle.id, {
              currentLevel: tank.currentLevel,
              tankName: tank.tankName,
              fuelType: tank.fuelType
            });
          }
        });
      });
    });

    return NextResponse.json({ data: Object.fromEntries(nozzleTankMap) }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tank current levels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

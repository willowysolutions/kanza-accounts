import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId') || session?.user?.branch;

    if (!branchId) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    // Get the last sale date for this branch
    const lastSale = await prisma.sale.findFirst({
      where: {
        branchId: branchId as string,
      },
      orderBy: {
        date: 'desc',
      },
      select: {
        date: true,
      },
    });

    // Get the last closed day for this branch
    const lastClosedDay = await prisma.closedDay.findFirst({
      where: {
        branchId: branchId as string,
      },
      orderBy: {
        date: 'desc',
      },
      select: {
        date: true,
      },
    });

    // Get the last meter reading for this branch
    const lastMeterReading = await prisma.meterReading.findFirst({
      where: {
        branchId: branchId as string,
      },
      orderBy: {
        date: 'desc',
      },
      select: {
        date: true,
      },
    });

    const lastSaleDate = lastSale?.date;
    const lastClosedDate = lastClosedDay?.date;
    const lastMeterDate = lastMeterReading?.date;

    let finalLastDate = null;
    const dates = [lastSaleDate, lastClosedDate, lastMeterDate].filter(Boolean) as Date[];
    if (dates.length > 0) {
      finalLastDate = new Date(Math.max(...dates.map(d => d.getTime())));
    }

    return NextResponse.json({ 
      lastDate: finalLastDate 
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching last sale date:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


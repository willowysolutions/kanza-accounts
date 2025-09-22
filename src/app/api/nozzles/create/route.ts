import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nozzleSchema } from "@/schemas/nozzle-schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Zod validation
    const result = nozzleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }


    // 1️⃣ Get the machine details
    const machine = await prisma.machine.findUnique({
      where: { id: result.data.machineId },
      select: { noOfNozzles: true },
    });

    if (!machine) {
      return NextResponse.json(
        { error: "Machine not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Count existing nozzles for that machine
    const nozzleCount = await prisma.nozzle.count({
      where: { machineId: result.data.machineId },
    });

    // 3️⃣ Check limit
    if (nozzleCount >= machine.noOfNozzles) {
      return NextResponse.json(
        { error: `This machine already has the maximum allowed nozzles (${machine.noOfNozzles}).` },
        { status: 400 }
      );
    }

    // 4️⃣ Create nozzle
    const nozzle = await prisma.nozzle.create({
      data: {
        ...result.data,
      },
    });

    return NextResponse.json({ data: nozzle }, { status: 201 });
  } catch (error) {
    console.error("Error creating nozzle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

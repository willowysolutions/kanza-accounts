import { NextRequest, NextResponse } from "next/server";
import { machineSchema } from "@/schemas/machine-schema";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

//create new machine

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = machineSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }    

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const branchId = session?.user?.branch;

    const machine = await prisma.machine.create({
    data: {
      machineName: result.data.machineName,
      model: result.data.model,
      serialNumber: result.data.serialNumber,
      noOfNozzles: result.data.noOfNozzles,
      branchId:branchId,
      machineTanks: {
        create: result.data.machineTanks.map(tankId => ({
          tank: { connect: { id: tankId } },
        })),
      },
    },
  });


    return NextResponse.json({ data: machine }, { status: 201 });
  } catch (error) {
    console.error("Error creating machine:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

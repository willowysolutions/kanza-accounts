import { NextRequest, NextResponse } from "next/server";
import { machineSchema } from "@/schemas/machine-schema";
import { prisma } from "@/lib/prisma";

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


    const machine = await prisma.machine.create({
    data: {
      ...result.data,
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

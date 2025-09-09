import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { machineSchemaWithId } from "@/schemas/machine-schema";
import { ObjectId } from "mongodb";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = machineSchemaWithId.safeParse({ id: params.id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { id, machineTanks, ...rest } = parsed.data;

    const machines = await prisma.machine.update({
      where: { id },
      data: {
        ...rest,
        machineTanks: {
          deleteMany: {},
          create: machineTanks.map(tankId => ({
            tank: { connect: { id: tankId } }
          })),
        },
      },
    });

    return NextResponse.json({ data: machines }, { status: 200 });
  } catch (error) {
    console.error("Error updating machines:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

//DELETE
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = await params.id;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid ID format" },
      { status: 400 }
    );
  }

  try {
    const deletedMachines = await prisma.machine.delete({
      where: { id },
    });

    return NextResponse.json({ data: deletedMachines }, { status: 200 });
  } catch (error) {
    console.error("Error deleting machine:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

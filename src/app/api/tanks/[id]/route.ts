import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { tankSchemaWithId } from "@/schemas/tank-schema";
import { ObjectId } from "mongodb";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const parsed = tankSchemaWithId.safeParse({ id: (await params).id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    const tank = await prisma.tank.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: tank }, { status: 200 });
  } catch (error) {
    console.error("Error updating tank:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

//DELETE
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid ID format" },
      { status: 400 }
    );
  }

  try {
    const deletedTank = await prisma.tank.delete({
      where: { id },
    });

    return NextResponse.json({ data: deletedTank }, { status: 200 });
  } catch (error) {
    console.error("Error deleting tank:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { branchSchemaWithId } from "@/schemas/branch-schema";
import { ObjectId } from "mongodb";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = branchSchemaWithId.safeParse({ id: params.id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    const branches = await prisma.branch.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: branches }, { status: 200 });
  } catch (error) {
    console.error("Error updating branches:", error);
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
    const deletedBranches = await prisma.branch.delete({
      where: { id },
    });

    return NextResponse.json({ data: deletedBranches }, { status: 200 });
  } catch (error) {
    console.error("Error deleting branch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
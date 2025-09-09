import { NextRequest, NextResponse } from "next/server";
import { branchSchema } from "@/schemas/branch-schema";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

//create new branch

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = branchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }    

    const branch = await prisma.branch.create({
      data: result.data,
    });
    
    revalidatePath("/branches");

    return NextResponse.json({ data: branch }, { status: 201 });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


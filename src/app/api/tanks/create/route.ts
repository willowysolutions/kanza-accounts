import { NextRequest, NextResponse } from "next/server";
import { tankSchema } from "@/schemas/tank-schema";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

//create new tank

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = tankSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }   
    


    const tank = await prisma.tank.create({
      data: {
        ...result.data,
      },
    });
    revalidatePath("/tanks");

    return NextResponse.json({ data: tank }, { status: 201 });
  } catch (error) {
    console.error("Error creating tank:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



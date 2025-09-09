import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const bankDeposite = await prisma.bankDeposite.findMany({
      orderBy: { bankId: "desc" },
      include:{bank:true}
    });

    return NextResponse.json({ bankDeposite }, { status: 200 });
  } catch (error) {
    console.error("Error fetching bank deposite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
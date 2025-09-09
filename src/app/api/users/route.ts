// app/api/users/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [users, roles, branch] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.role.findMany({
        orderBy: { createdAt: "asc" },
      }),
      prisma.branch.findMany({
      select:{id:true,name:true,phone:true,email:true,createdAt:true,updatedAt:true},
      orderBy: { createdAt: 'desc' },
    }),
    ]);

    return NextResponse.json({ users, roles, branch }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users/roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch users and roles" },
      { status: 500 }
    );
  }
}

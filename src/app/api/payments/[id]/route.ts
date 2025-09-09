// import { prisma } from "@/lib/prisma";
// import { NextResponse } from "next/server";
// import { customerPaymentSchema } from "@/schemas/payment-schema";

// export async function PATCH(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const body = await req.json();
//     const parsed = customerPaymentSchema.safeParse({ id: params.id, ...body });

//     if (!parsed.success) {
//       return NextResponse.json(
//         { error: "Invalid input", issues: parsed.error.errors },
//         { status: 400 }
//       );
//     }

//     const { customerId, ...data } = parsed.data;

//     const payment = await prisma.customerPayment.update({
//       where: { customerId },
//       data,
//     });

//     return NextResponse.json({ data: payment }, { status: 200 });
//   } catch (error) {
//     console.error("Error updating payment:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
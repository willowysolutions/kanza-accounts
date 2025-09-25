import { prisma } from "@/lib/prisma";
import { convertToIST, getISTDateRangeForQuery } from "@/lib/date-utils";

/**
 * IST-aware balance receipt utilities
 * Handles dates in IST timezone consistently
 */
export async function updateBalanceReceiptIST(
  branchId: string,
  date: Date,
  amountChange: number,
  tx?: any // eslint-disable-line @typescript-eslint/no-explicit-any
) {
  const prismaClient = tx || prisma;
  
  // Convert the date to IST date string using the same logic as report modal
  const dateString = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const { start, end } = getISTDateRangeForQuery(dateString);
  
  // Check if balance receipt exists for this date and branch
  const existingReceipt = await prismaClient.balanceReceipt.findFirst({
    where: {
      branchId,
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  if (existingReceipt) {
    // Update existing receipt atomically
    const result = await prismaClient.balanceReceipt.update({
      where: { id: existingReceipt.id },
      data: {
        amount: existingReceipt.amount + amountChange,
      },
    });
    return result;
  } else {
    // Create new receipt with previous balance + current change
    const previousBalance = await getPreviousDayBalanceIST(branchId, date, prismaClient);
    const result = await prismaClient.balanceReceipt.create({
      data: {
        date: convertToIST(new Date(dateString + 'T00:00:00.000Z')), // Ensure date is stored in IST timezone
        amount: previousBalance + amountChange,
        branchId,
      },
    });
    return result;
  }
}

/**
 * Get previous day's balance for carry forward (IST timezone)
 */
async function getPreviousDayBalanceIST(branchId: string, currentDate: Date, prismaClient: any): Promise<number> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const previousDay = new Date(currentDate);
  previousDay.setDate(previousDay.getDate() - 1);
  
  // Convert the previous day to IST date string using the same logic as report modal
  const previousDateString = previousDay.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const { start, end } = getISTDateRangeForQuery(previousDateString);
  
  const previousReceipt = await prismaClient.balanceReceipt.findFirst({
    where: {
      branchId,
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { date: 'desc' },
  });
  
  return previousReceipt?.amount || 0;
}

/**
 * Get current cash balance for a branch on a specific date (IST timezone)
 */
export async function getCurrentBalanceIST(branchId: string, date: Date): Promise<number> {
  // Convert the date to IST date string using the same logic as report modal
  const dateString = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const { start, end } = getISTDateRangeForQuery(dateString);
  
  const receipt = await prisma.balanceReceipt.findFirst({
    where: {
      branchId,
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { date: 'desc' },
  });
  
  return receipt?.amount || 0;
}

/**
 * Get balance receipt for a specific date and branch (IST timezone)
 */
export async function getBalanceReceiptIST(branchId: string, date: Date) {
  // Convert the date to IST date string using the same logic as report modal
  const dateString = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const { start, end } = getISTDateRangeForQuery(dateString);
  
  return await prisma.balanceReceipt.findFirst({
    where: {
      branchId,
      date: {
        gte: start,
        lte: end,
      },
    },
  });
}

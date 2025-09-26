import { prisma } from "@/lib/prisma";
import { getISTDateRangeForQuery } from "@/lib/date-utils";

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
    // Check if this is a sale (positive amountChange) and the existing receipt has 0 amount
    // If so, we need to add yesterday's balance + cash payment (like creating a new receipt)
    if (amountChange > 0 && existingReceipt.amount === 0) {
      // This is a sale with an existing 0-amount receipt - treat it like a new receipt
      const previousBalance = await getPreviousDayBalanceIST(branchId, date, prismaClient);
      const newAmount = previousBalance + amountChange;
      
      const result = await prismaClient.balanceReceipt.update({
        where: { id: existingReceipt.id },
        data: {
          amount: newAmount,
        },
      });
      return result;
    } else {
      // Normal update for existing receipt
      const result = await prismaClient.balanceReceipt.update({
        where: { id: existingReceipt.id },
        data: {
          amount: existingReceipt.amount + amountChange,
        },
      });
      return result;
    }
  } else {
    // Create new receipt
    const previousBalance = await getPreviousDayBalanceIST(branchId, date, prismaClient);
    
    // Create IST date for storage (previous day's 18:30:00.000Z represents IST midnight)
    // For Sep 5 IST, we need Sep 4 18:30 UTC to represent Sep 5 00:00 IST
    const [year, month, day] = dateString.split('-').map(Number);
    const previousDay = new Date(year, month - 1, day - 1);
    const istDate = new Date(`${previousDay.getFullYear()}-${String(previousDay.getMonth() + 1).padStart(2, '0')}-${String(previousDay.getDate()).padStart(2, '0')}T18:30:00.000Z`);
    
    // Determine the new balance amount
    let newAmount: number;
    if (amountChange < 0) {
      // For expenses/credits/bank-deposits (negative amountChange)
      // If no previous balance receipt exists, start with 0 - amount (not previousBalance)
      newAmount = 0 + amountChange; // This gives us 0 - amount
    } else {
      // For sales (positive amountChange)
      // Use previous balance + current change
      newAmount = previousBalance + amountChange;
    }
    
    const result = await prismaClient.balanceReceipt.create({
      data: {
        date: istDate, // Store in IST format (18:30:00.000Z)
        amount: newAmount,
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

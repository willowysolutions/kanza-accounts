#!/usr/bin/env node

/*
  Danger: This script deletes data across multiple collections for ALL branches
  EXCEPT the protected COCO KONDOTTY branch.

  Protected branch name: COCO KONDOTTY
  Protected branch id:   68dfb3cd147073f90cd85d88

  Usage:
    node delete-non-coco-data.mjs            # dry-run (shows counts only)
    node delete-non-coco-data.mjs --execute  # performs deletion

  Notes:
  - Requires Prisma to be configured (CLUSTER_URL env var).
  - Only records with a non-null branchId different from the protected id are targeted.
  - Collections affected: MeterReading, Sale, Credit, Expense, BankDeposite, CustomerPayment, PaymentHistory, Oil, Stock, Purchase, Customer
*/

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROTECTED_BRANCH_ID = '68dfb3cd147073f90cd85d88';
const isExecute = process.argv.includes('--execute');

function whereNonCoco() {
  return {
    branchId: {
      not: PROTECTED_BRANCH_ID,
    },
    // Be explicit: avoid touching records with null branchId
    NOT: [{ branchId: null }],
  };
}

async function main() {
  console.log(`\nDelete data for ALL branches except protected branch:`);
  console.log(` - Protected branch id: ${PROTECTED_BRANCH_ID}`);
  console.log(` - Mode: ${isExecute ? 'EXECUTE (will delete)' : 'DRY-RUN (no deletes)'}`);

  // Resolve the protected branch to double-check existence
  const protectedBranch = await prisma.branch.findUnique({
    where: { id: PROTECTED_BRANCH_ID },
    select: { id: true, name: true },
  });

  if (!protectedBranch) {
    console.error(`\n❌ Protected branch not found by id ${PROTECTED_BRANCH_ID}. Aborting.`);
    process.exit(1);
  }
  console.log(`✔ Found protected branch: ${protectedBranch.name} (${protectedBranch.id})`);

  // Build tasks with model label, count and delete actions
  const tasks = [
    {
      label: 'MeterReading',
      count: () => prisma.meterReading.count({ where: whereNonCoco() }),
      del:   () => prisma.meterReading.deleteMany({ where: whereNonCoco() }),
    },
    {
      label: 'Sale',
      count: () => prisma.sale.count({ where: whereNonCoco() }),
      del:   () => prisma.sale.deleteMany({ where: whereNonCoco() }),
    },
    {
      label: 'Credit',
      count: () => prisma.credit.count({ where: whereNonCoco() }),
      del:   () => prisma.credit.deleteMany({ where: whereNonCoco() }),
    },
    {
      label: 'Expense',
      count: () => prisma.expense.count({ where: whereNonCoco() }),
      del:   () => prisma.expense.deleteMany({ where: whereNonCoco() }),
    },
    {
      label: 'BankDeposite',
      count: () => prisma.bankDeposite.count({ where: whereNonCoco() }),
      del:   () => prisma.bankDeposite.deleteMany({ where: whereNonCoco() }),
    },
    {
      label: 'CustomerPayment',
      count: () => prisma.customerPayment.count({ where: whereNonCoco() }),
      del:   () => prisma.customerPayment.deleteMany({ where: whereNonCoco() }),
    },
    {
      label: 'PaymentHistory',
      count: () => prisma.paymentHistory.count({ where: whereNonCoco() }),
      del:   () => prisma.paymentHistory.deleteMany({ where: whereNonCoco() }),
    },
    {
      label: 'Purchase',
      count: () => prisma.purchase.count({ where: whereNonCoco() }),
      del:   () => prisma.purchase.deleteMany({ where: whereNonCoco() }),
    },
    {
      label: 'Oil',
      count: () => prisma.oil.count({ where: whereNonCoco() }),
      del:   () => prisma.oil.deleteMany({ where: whereNonCoco() }),
    },
    {
      label: 'Stock',
      count: () => prisma.stock.count({ where: whereNonCoco() }),
      del:   () => prisma.stock.deleteMany({ where: whereNonCoco() }),
    },
    // Delete customers last (after credits/payments/history are removed)
    {
      label: 'Customer',
      count: () => prisma.customer.count({ where: whereNonCoco() }),
      del:   () => prisma.customer.deleteMany({ where: whereNonCoco() }),
    },
  ];

  console.log('\nCollecting counts...');
  const counts = await Promise.all(tasks.map(t => t.count().then(c => ({ label: t.label, count: c }))));

  // Print summary
  console.log('\nPlanned deletions (non-COCO branches):');
  for (const { label, count } of counts) {
    console.log(` - ${label}: ${count}`);
  }

  if (!isExecute) {
    console.log('\nDRY-RUN complete. Re-run with --execute to perform deletion.');
    return;
  }

  console.log('\nExecuting deletions...');
  for (const t of tasks) {
    const res = await t.del();
    console.log(` - Deleted from ${t.label}: ${res.count}`);
  }

  console.log('\n✔ Deletion completed. Protected branch data preserved.');
}

main()
  .catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



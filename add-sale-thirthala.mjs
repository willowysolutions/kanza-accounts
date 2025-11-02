/**
 * Script to add a sale for THIRTHALA branch
 * Based on the form data from the Record New Sale modal
 */

import { PrismaClient } from '@prisma/client';
import { ObjectId } from 'mongodb';

const prisma = new PrismaClient();

async function addSaleForThirthala() {
  try {
    console.log('🔍 Finding THIRTHALA branch...');
    
    // Find THIRTHALA branch (case-insensitive search)
    const branch = await prisma.branch.findFirst({
      where: {
        name: {
          contains: 'THIRTHALA',
          mode: 'insensitive',
        },
      },
    });

    if (!branch) {
      console.error('❌ THIRTHALA branch not found!');
      console.log('Available branches:');
      const allBranches = await prisma.branch.findMany({
        select: { id: true, name: true },
      });
      allBranches.forEach(b => console.log(`  - ${b.name} (${b.id})`));
      return;
    }

    console.log(`✅ Found branch: ${branch.name} (${branch.id})`);

    // Sale data from the form
    const saleDate = new Date('2025-10-26'); // 26/10/2025
    
    // Check if sale already exists for this date and branch
    const existingSale = await prisma.sale.findFirst({
      where: {
        branchId: branch.id,
        date: {
          gte: new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate()),
          lt: new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate() + 1),
        },
      },
    });

    if (existingSale) {
      console.log('⚠️  Sale already exists for this date and branch!');
      console.log(`   Existing sale ID: ${existingSale.id}`);
      return;
    }

    // Prepare sale data
    const saleData = {
      date: saleDate,
      rate: 503247.00,
      cashPayment: 259729.00,
      atmPayment: 0, // Will be null
      paytmPayment: 243518,
      fleetPayment: 0, // Will be null
      
      // Products (oil/gas products)
      products: {
        "2T-OIL": 300,
        "B.W 6.5 LITTER": 100,
      },
      
      // Legacy fuel fields
      hsdDieselTotal: 203866,
      msPetrolTotal: 288738,
      powerPetrolTotal: 10243,
      xgDieselTotal: null, // This branch doesn't have XG-DIESEL
      
      // Dynamic fuel totals
      fuelTotals: {
        "HSD-DIESEL": 203866,
        "MS-PETROL": 288738,
        "POWER PETROL": 10243,
      },
      
      branchId: branch.id,
    };

    // Transform 0 values to null for nullable fields
    if (saleData.atmPayment === 0) saleData.atmPayment = null;
    if (saleData.fleetPayment === 0) saleData.fleetPayment = null;

    console.log('📝 Creating sale...');
    console.log('   Date:', saleDate.toISOString());
    console.log('   Branch:', branch.name);
    console.log('   Rate:', saleData.rate);
    console.log('   Cash Payment:', saleData.cashPayment);
    console.log('   Paytm Payment:', saleData.paytmPayment);
    console.log('   Products:', JSON.stringify(saleData.products));
    console.log('   Fuel Totals:', JSON.stringify(saleData.fuelTotals));

    // Create the sale
    const sale = await prisma.sale.create({
      data: saleData,
    });

    console.log('✅ Sale created successfully!');
    console.log(`   Sale ID: ${sale.id}`);
    console.log(`   Date: ${sale.date.toISOString()}`);
    console.log(`   Branch: ${branch.name}`);
    console.log(`   Total Amount: ₹${sale.rate.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error creating sale:', error);
    if (error.code === 'P2002') {
      console.error('   Duplicate entry - sale may already exist for this date');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addSaleForThirthala();


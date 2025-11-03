/**
 * Script to migrate existing products to correct categories
 * Fuel products: MS-PETROL, HSD-DIESEL, XG-DIESEL, XP 95 PETROL, POWER PETROL
 * All other products: OTHER
 */

import { PrismaClient } from '@prisma/client';
import { ObjectId } from 'mongodb';

const prisma = new PrismaClient();

async function migrateProductCategories() {
  try {
    console.log('🔍 Fetching all products...');
    
    const products = await prisma.product.findMany({
      select: {
        id: true,
        productName: true,
        productCategory: true,
      },
    });

    console.log(`📦 Found ${products.length} products to process`);

    // Define fuel product names (case-insensitive matching)
    const fuelProductNames = ["MS-PETROL", "HSD-DIESEL", "XG-DIESEL", "XP 95 PETROL", "POWER PETROL"];

    let fuelCount = 0;
    let otherCount = 0;
    let updatedCount = 0;

    for (const product of products) {
      const normalizedName = product.productName.toUpperCase().trim();
      const isFuelProduct = fuelProductNames.some(fuelName => 
        normalizedName === fuelName.toUpperCase().trim()
      );

      const shouldBeCategory = isFuelProduct ? "FUEL" : "OTHER";
      const needsUpdate = product.productCategory !== shouldBeCategory;

      if (isFuelProduct) {
        fuelCount++;
      } else {
        otherCount++;
      }

      if (needsUpdate) {
        console.log(`📝 Updating: "${product.productName}" from ${product.productCategory || 'undefined'} to ${shouldBeCategory}`);
        
        await prisma.product.update({
          where: { id: product.id },
          data: { productCategory: shouldBeCategory },
        });
        
        updatedCount++;
      } else {
        console.log(`✓ "${product.productName}" already has correct category: ${product.productCategory || 'undefined'}`);
      }
    }

    console.log('\n✅ Migration complete!');
    console.log(`   Fuel products: ${fuelCount}`);
    console.log(`   Other products: ${otherCount}`);
    console.log(`   Updated: ${updatedCount} products`);
    console.log(`   Unchanged: ${products.length - updatedCount} products`);

    // Show summary by category (manually count to handle nulls)
    const allProducts = await prisma.product.findMany({
      select: { productCategory: true },
    });
    
    const categoryCounts = {
      FUEL: 0,
      OTHER: 0,
      null: 0,
    };
    
    allProducts.forEach(p => {
      const category = p.productCategory || 'null';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    console.log('\n📊 Final category distribution:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count > 0) {
        console.log(`   ${category === 'null' ? 'undefined' : category}: ${count} products`);
      }
    });

  } catch (error) {
    console.error('❌ Error migrating product categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateProductCategories();


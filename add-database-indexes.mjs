/**
 * Script to add database indexes for improved performance
 * Run this script to add necessary indexes to your MongoDB database
 */

import { MongoClient } from 'mongodb';

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/kanza-account';

async function addDatabaseIndexes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Define indexes to create
    const indexes = [
      // Sales collection indexes
      { collection: 'Sale', index: { date: 1, branchId: 1 } },
      { collection: 'Sale', index: { date: 1 } },
      { collection: 'Sale', index: { branchId: 1 } },
      
      // Purchase collection indexes
      { collection: 'Purchase', index: { date: 1, branchId: 1 } },
      { collection: 'Purchase', index: { date: 1 } },
      { collection: 'Purchase', index: { branchId: 1 } },
      
      // Expense collection indexes
      { collection: 'Expense', index: { date: 1, branchId: 1 } },
      { collection: 'Expense', index: { date: 1 } },
      { collection: 'Expense', index: { branchId: 1 } },
      
      // Credit collection indexes
      { collection: 'Credit', index: { date: 1, branchId: 1 } },
      { collection: 'Credit', index: { date: 1 } },
      { collection: 'Credit', index: { branchId: 1 } },
      
      // MeterReading collection indexes
      { collection: 'MeterReading', index: { date: 1, branchId: 1 } },
      { collection: 'MeterReading', index: { date: 1 } },
      { collection: 'MeterReading', index: { branchId: 1 } },
      
      // BalanceReceipt collection indexes
      { collection: 'BalanceReceipt', index: { date: 1, branchId: 1 } },
      { collection: 'BalanceReceipt', index: { date: 1 } },
      { collection: 'BalanceReceipt', index: { branchId: 1 } },
      
      // CustomerPayment collection indexes
      { collection: 'CustomerPayment', index: { paidOn: 1, branchId: 1 } },
      { collection: 'CustomerPayment', index: { paidOn: 1 } },
      { collection: 'CustomerPayment', index: { branchId: 1 } },
      
      // BankDeposite collection indexes
      { collection: 'BankDeposite', index: { date: 1, branchId: 1 } },
      { collection: 'BankDeposite', index: { date: 1 } },
      { collection: 'BankDeposite', index: { branchId: 1 } },
      
      // Oil collection indexes
      { collection: 'Oil', index: { date: 1, branchId: 1 } },
      { collection: 'Oil', index: { date: 1 } },
      { collection: 'Oil', index: { branchId: 1 } },
    ];

    console.log('Adding database indexes...');
    
    for (const { collection, index } of indexes) {
      try {
        await db.collection(collection).createIndex(index);
        console.log(`✓ Added index to ${collection}: ${JSON.stringify(index)}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`- Index already exists for ${collection}: ${JSON.stringify(index)}`);
        } else {
          console.error(`✗ Error adding index to ${collection}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Database indexes added successfully!');
    console.log('\nPerformance improvements:');
    console.log('- Date-based queries will be much faster');
    console.log('- Branch-specific queries will be optimized');
    console.log('- Dashboard loading should be significantly faster');
    
  } catch (error) {
    console.error('Error adding database indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  addDatabaseIndexes();
}

export { addDatabaseIndexes };

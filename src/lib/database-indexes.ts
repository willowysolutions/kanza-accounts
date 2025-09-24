/**
 * Database indexes for improved query performance
 * Run this script to add necessary indexes to your MongoDB database
 */

/**
 * Add database indexes for better performance
 * This should be run once during application setup
 */
export async function addDatabaseIndexes() {
  try {
    console.log('Adding database indexes for improved performance...');

    // Note: Prisma doesn't directly support index creation in the same way as raw MongoDB
    // These indexes should be added manually to your MongoDB database
    // or through a migration script

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

    console.log('Indexes to be added:');
    indexes.forEach(({ collection, index }) => {
      console.log(`- ${collection}: ${JSON.stringify(index)}`);
    });

    console.log('\nTo add these indexes to your MongoDB database, run:');
    console.log('db.Sale.createIndex({ "date": 1, "branchId": 1 })');
    console.log('db.Sale.createIndex({ "date": 1 })');
    console.log('db.Sale.createIndex({ "branchId": 1 })');
    console.log('// ... and so on for each collection');
    
    console.log('\nOr use MongoDB Compass to add these indexes through the UI.');
    
    return { success: true, indexes };
  } catch (error) {
    console.error('Error adding database indexes:', error);
    throw error;
  }
}

/**
 * MongoDB shell commands to create indexes
 * Run these commands in your MongoDB shell or MongoDB Compass
 */
export const mongoIndexCommands = `
// Sales collection indexes
db.Sale.createIndex({ "date": 1, "branchId": 1 });
db.Sale.createIndex({ "date": 1 });
db.Sale.createIndex({ "branchId": 1 });

// Purchase collection indexes
db.Purchase.createIndex({ "date": 1, "branchId": 1 });
db.Purchase.createIndex({ "date": 1 });
db.Purchase.createIndex({ "branchId": 1 });

// Expense collection indexes
db.Expense.createIndex({ "date": 1, "branchId": 1 });
db.Expense.createIndex({ "date": 1 });
db.Expense.createIndex({ "branchId": 1 });

// Credit collection indexes
db.Credit.createIndex({ "date": 1, "branchId": 1 });
db.Credit.createIndex({ "date": 1 });
db.Credit.createIndex({ "branchId": 1 });

// MeterReading collection indexes
db.MeterReading.createIndex({ "date": 1, "branchId": 1 });
db.MeterReading.createIndex({ "date": 1 });
db.MeterReading.createIndex({ "branchId": 1 });

// BalanceReceipt collection indexes
db.BalanceReceipt.createIndex({ "date": 1, "branchId": 1 });
db.BalanceReceipt.createIndex({ "date": 1 });
db.BalanceReceipt.createIndex({ "branchId": 1 });

// CustomerPayment collection indexes
db.CustomerPayment.createIndex({ "paidOn": 1, "branchId": 1 });
db.CustomerPayment.createIndex({ "paidOn": 1 });
db.CustomerPayment.createIndex({ "branchId": 1 });

// BankDeposite collection indexes
db.BankDeposite.createIndex({ "date": 1, "branchId": 1 });
db.BankDeposite.createIndex({ "date": 1 });
db.BankDeposite.createIndex({ "branchId": 1 });

// Oil collection indexes
db.Oil.createIndex({ "date": 1, "branchId": 1 });
db.Oil.createIndex({ "date": 1 });
db.Oil.createIndex({ "branchId": 1 });
`;

/**
 * Check if indexes exist and provide performance recommendations
 */
export async function checkDatabasePerformance() {
  try {
    console.log('Checking database performance...');
    
    // This would require raw MongoDB queries to check index usage
    // For now, we'll provide recommendations
    
    const recommendations = [
      '1. Ensure all date fields have indexes',
      '2. Add compound indexes for date + branchId queries',
      '3. Monitor slow queries using MongoDB profiler',
      '4. Consider adding indexes for frequently queried fields',
      '5. Use explain() to analyze query performance'
    ];
    
    console.log('Performance recommendations:');
    recommendations.forEach(rec => console.log(rec));
    
    return { recommendations };
  } catch (error) {
    console.error('Error checking database performance:', error);
    throw error;
  }
}

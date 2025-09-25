// Test script to verify the date query logic
function convertToISTDateString(date) {
  // Create a new date object to avoid mutating the original
  const utcDate = new Date(date);
  
  // Convert to IST by adding 5.5 hours (5 hours 30 minutes)
  const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
  
  // Format as YYYY-MM-DD
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

function getISTDateRangeForQuery(dateString) {
  // Parse the IST date string
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create IST date (start of day)
  const istStartDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  const istEndDate = new Date(year, month - 1, day, 23, 59, 59, 999);
  
  // Convert to UTC for database queries
  // IST is UTC+5:30, so we need to subtract 5:30 to get UTC
  const utcStartDate = new Date(istStartDate.getTime() - (5.5 * 60 * 60 * 1000));
  const utcEndDate = new Date(istEndDate.getTime() - (5.5 * 60 * 60 * 1000));
  
  return {
    start: utcStartDate,
    end: utcEndDate
  };
}

console.log('Testing Date Query Logic:');
console.log('========================');

// Simulate stored data (September 3rd IST stored as UTC)
const storedDate = new Date('2025-09-02T18:30:00.000Z'); // This represents Sep 3rd IST midnight
console.log('Stored Date (Sep 3rd IST as UTC):', storedDate.toISOString());

// Convert stored date to IST string (what gets passed to download button)
const istDateString = convertToISTDateString(storedDate);
console.log('IST Date String (for download):', istDateString);

// Get query range using new function
const { start: startOfDay, end: endOfDay } = getISTDateRangeForQuery(istDateString);
console.log('Query Range Start:', startOfDay.toISOString());
console.log('Query Range End:', endOfDay.toISOString());

// Check if stored date falls within query range
const isInRange = storedDate >= startOfDay && storedDate <= endOfDay;
console.log('Is stored date in query range?', isInRange);

console.log('\nExpected behavior:');
console.log('- Stored date: 2025-09-02T18:30:00.000Z (Sep 3rd IST midnight)');
console.log('- Query should find this data when looking for Sep 3rd');
console.log('- The stored date should be within the query range');

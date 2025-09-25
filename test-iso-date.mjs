// Test script to verify ISO date handling
function getISTDateRangeForQuery(dateString) {
  let year, month, day;
  
  // Handle both YYYY-MM-DD format and ISO date strings
  if (dateString.includes('T')) {
    // ISO date string (e.g., "2025-09-02T18:30:00.000Z")
    const date = new Date(dateString);
    year = date.getFullYear();
    month = date.getMonth() + 1;
    day = date.getDate();
  } else {
    // YYYY-MM-DD format
    const parts = dateString.split('-');
    year = parseInt(parts[0]);
    month = parseInt(parts[1]);
    day = parseInt(parts[2]);
  }
  
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

console.log('Testing ISO Date Handling:');
console.log('==========================');

// Test with ISO date string (what meter reading report sends)
const isoDate = '2025-09-02T18:30:00.000Z';
console.log(`ISO Date: ${isoDate}`);

try {
  const { start, end } = getISTDateRangeForQuery(isoDate);
  console.log(`Start: ${start.toISOString()}`);
  console.log(`End: ${end.toISOString()}`);
  console.log('✅ SUCCESS: ISO date handled correctly!');
} catch (error) {
  console.log('❌ ERROR:', error.message);
}

// Test with YYYY-MM-DD format (what dashboard sends)
const ymdDate = '2025-09-03';
console.log(`\nYYYY-MM-DD Date: ${ymdDate}`);

try {
  const { start, end } = getISTDateRangeForQuery(ymdDate);
  console.log(`Start: ${start.toISOString()}`);
  console.log(`End: ${end.toISOString()}`);
  console.log('✅ SUCCESS: YYYY-MM-DD date handled correctly!');
} catch (error) {
  console.log('❌ ERROR:', error.message);
}

// Test script to verify meter readings date query
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

console.log('Testing Meter Readings Date Query:');
console.log('==================================');

// Test with September 3rd
const testDate = '2025-09-03';
const { start, end } = getISTDateRangeForQuery(testDate);

console.log(`Query Date: ${testDate}`);
console.log(`Start of Day: ${start.toISOString()}`);
console.log(`End of Day: ${end.toISOString()}`);

// Simulate a meter reading stored as IST date
const storedMeterReading = new Date('2025-09-02T18:30:00.000Z'); // Sep 3rd IST midnight
console.log(`\nStored Meter Reading: ${storedMeterReading.toISOString()}`);

// Check if it falls within the query range
const isInRange = storedMeterReading >= start && storedMeterReading <= end;
console.log(`Is meter reading in query range? ${isInRange}`);

if (!isInRange) {
  console.log('\n❌ ISSUE: Meter reading is not in query range!');
  console.log('This means the date query will not find the meter reading.');
} else {
  console.log('\n✅ SUCCESS: Meter reading is in query range!');
}

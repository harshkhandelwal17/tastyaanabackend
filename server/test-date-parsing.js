/**
 * Test script to verify parseIndianDate function works correctly
 */

function getIndianDate() {
  const now = new Date();
  const indianTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // IST is UTC+5:30
  return indianTime.toISOString().split('T')[0];
}

function parseIndianDate(dateStr) {
  // Parse the date string (YYYY-MM-DD format)
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Create date at midnight IST (Indian Standard Time)
  // For 2025-11-28, we want 2025-11-28 00:00:00 IST
  // Which is 2025-11-27 18:30:00 UTC (IST is UTC+5:30, so subtract 5.5 hours)
  
  // Create UTC date for the given date at 18:30:00 (which is midnight IST)
  const utcDate = new Date(Date.UTC(year, month - 1, day - 1, 18, 30, 0, 0));
  
  return utcDate;
}

// Test the functions
console.log('Testing date parsing functions...');
console.log('Current Indian date:', getIndianDate());

const testDate = '2025-11-28';
const parsedDate = parseIndianDate(testDate);
console.log(`Input date: ${testDate}`);
console.log(`Parsed UTC date: ${parsedDate.toISOString()}`);
console.log(`Parsed date (Indian timezone): ${new Date(parsedDate.getTime() + 5.5 * 60 * 60 * 1000).toISOString()}`);

// Test with today's date
const todayIST = getIndianDate();
const todayParsed = parseIndianDate(todayIST);
console.log(`Today (IST): ${todayIST}`);
console.log(`Today parsed UTC: ${todayParsed.toISOString()}`);
console.log(`Today parsed (IST): ${new Date(todayParsed.getTime() + 5.5 * 60 * 60 * 1000).toISOString()}`);
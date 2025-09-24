/**
 * Test script to verify IST date conversion
 * Run this to check if dates are being converted correctly
 */

import { convertToIST } from './src/lib/date-utils.ts';

// Test with a sample date
const testDate = new Date('2025-09-23T00:00:00.000Z'); // UTC midnight
console.log('Original UTC date:', testDate.toISOString());
console.log('Original UTC date (local):', testDate.toString());

const istDate = convertToIST(testDate);
console.log('Converted IST date:', istDate.toISOString());
console.log('Converted IST date (local):', istDate.toString());

// Test with a date that should be September 23rd in IST
const sept23IST = new Date('2025-09-23T00:00:00.000+05:30'); // IST midnight
console.log('\nSeptember 23rd IST:', sept23IST.toISOString());
console.log('September 23rd IST (local):', sept23IST.toString());

const convertedSept23 = convertToIST(sept23IST);
console.log('Converted September 23rd:', convertedSept23.toISOString());
console.log('Converted September 23rd (local):', convertedSept23.toString());

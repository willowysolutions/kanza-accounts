/**
 * Date utilities for consistent timezone handling
 * Fixes the date mismatch between local and Vercel environments
 */

/**
 * Get current date in a consistent timezone (IST)
 * This ensures the same date is used regardless of server timezone
 */
export function getCurrentDateIST(): Date {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60; // 5 hours 30 minutes in minutes
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (istOffset * 60000));
  return ist;
}

/**
 * Get start of day in IST timezone
 */
export function getStartOfDayIST(date?: Date): Date {
  const targetDate = date || getCurrentDateIST();
  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get end of day in IST timezone
 */
export function getEndOfDayIST(date?: Date): Date {
  const targetDate = date || getCurrentDateIST();
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Format date as YYYY-MM-DD in IST timezone
 */
export function formatDateIST(date?: Date): string {
  const targetDate = date || getCurrentDateIST();
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse date string and ensure it's in IST timezone
 */
export function parseDateIST(dateString: string): Date {
  const date = new Date(dateString);
  // Ensure we're working with IST timezone
  const istOffset = 5.5 * 60; // 5 hours 30 minutes in minutes
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (istOffset * 60000));
}

/**
 * Convert a Date object to IST timezone for database storage
 * This ensures the date is stored correctly in IST timezone
 */
export function convertToIST(date: Date): Date {
  // Get the date components in local timezone
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  // Create a date string in IST format and parse it
  const istDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.000+05:30`;
  
  return new Date(istDateString);
}

/**
 * Get date range for queries with IST timezone
 */
export function getDateRangeIST(filter?: string, from?: string, to?: string) {
  const now = getCurrentDateIST();
  let start: Date | undefined;
  let end: Date | undefined;

  switch (filter) {
    case "today":
      start = getStartOfDayIST(now);
      end = getEndOfDayIST(now);
      break;
    case "yesterday":
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      start = getStartOfDayIST(yesterday);
      end = getEndOfDayIST(yesterday);
      break;
    case "week":
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      start = getStartOfDayIST(start);
      end = getEndOfDayIST(now);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start = getStartOfDayIST(start);
      end = getEndOfDayIST(now);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      start = getStartOfDayIST(start);
      end = getEndOfDayIST(now);
      break;
    case "custom":
      if (from) start = getStartOfDayIST(parseDateIST(from));
      if (to) end = getEndOfDayIST(parseDateIST(to));
      break;
    case "all":
    default:
      start = undefined;
      end = undefined;
  }

  return { start, end };
}

/**
 * Convert date to display format (DD MMM YYYY)
 */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
}

/**
 * Get yesterday's date in IST
 */
export function getYesterdayIST(): Date {
  const yesterday = new Date(getCurrentDateIST());
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

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
 * Get start of day for IST date queries (handles IST to UTC conversion)
 * This is used when querying for data stored as IST dates
 */
export function getStartOfDayISTForQuery(date: Date): Date {
  // The date is already in UTC format from parseDateIST
  // We need to find the start of day in IST timezone
  // Since data is stored as IST dates (e.g., 2025-09-02T18:30:00.000Z for Sep 3rd IST)
  // We need to look for data that represents the start of the IST day
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get end of day for IST date queries (handles IST to UTC conversion)
 * This is used when querying for data stored as IST dates
 */
export function getEndOfDayISTForQuery(date: Date): Date {
  // The date is already in UTC format from parseDateIST
  // We need to find the end of day in IST timezone
  // Since data is stored as IST dates, we need to look for data that represents the end of the IST day
  const end = new Date(date);
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
 * Convert UTC date to IST date string for consistent display
 * This ensures the same date is shown regardless of server timezone
 */
export function convertToISTDateString(date: Date): string {
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

/**
 * Parse date string and ensure it's in IST timezone
 */
export function parseDateIST(dateString: string): Date {
  // If the date string is in YYYY-MM-DD format, treat it as IST date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // Create date in IST timezone, then convert to UTC for database queries
    const [year, month, day] = dateString.split('-').map(Number);
    const istDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    
    // Convert to UTC equivalent for database queries
    // IST is UTC+5:30, so we need to subtract 5:30 to get UTC
    const utcDate = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));
    return utcDate;
  }
  
  // For other formats, use the original logic
  const date = new Date(dateString);
  const istOffset = 5.5 * 60; // 5 hours 30 minutes in minutes
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (istOffset * 60000));
}

/**
 * Parse date string for IST date queries (handles the specific case of IST stored dates)
 * This function is specifically designed to handle dates stored as IST in the database
 */
export function parseDateISTForQuery(dateString: string): Date {
  // If the date string is in YYYY-MM-DD format, treat it as IST date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // Create date in IST timezone
    const [year, month, day] = dateString.split('-').map(Number);
    const istDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    
    // Convert to UTC equivalent for database queries
    // IST is UTC+5:30, so we need to subtract 5:30 to get UTC
    const utcDate = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));
    return utcDate;
  }
  
  // For other formats, use the original logic
  const date = new Date(dateString);
  const istOffset = 5.5 * 60; // 5 hours 30 minutes in minutes
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (istOffset * 60000));
}

/**
 * Get date range for IST stored dates
 * This function handles the specific case where dates are stored as IST in the database
 */
export function getISTDateRangeForQuery(dateString: string): { start: Date; end: Date } {
  let year: number, month: number, day: number;
  
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

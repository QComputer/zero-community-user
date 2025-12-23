import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Persian date utilities
export function gregorianToPersian(gregorianDate: Date | string): string {
  const date = typeof gregorianDate === 'string' ? new Date(gregorianDate) : gregorianDate;

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  // Simple Persian date conversion (approximate)
  // For production, consider using a proper Persian calendar library
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth() + 1; // getMonth() returns 0-11
  const gregorianDay = date.getDate();

  // Approximate conversion (not 100% accurate for all dates)
  let persianYear = gregorianYear - 621;
  let persianMonth = gregorianMonth;
  let persianDay = gregorianDay;

  // Adjust for Persian calendar differences
  if (gregorianMonth > 3 || (gregorianMonth === 3 && gregorianDay >= 21)) {
    persianYear += 1;
  }

  // Persian month names
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  // Adjust month and day based on Persian calendar
  if (gregorianMonth === 1) {
    persianMonth = gregorianDay >= 21 ? 11 : 10;
    persianDay = gregorianDay >= 21 ? gregorianDay - 20 : gregorianDay + 10;
  } else if (gregorianMonth === 2) {
    persianMonth = gregorianDay >= 20 ? 12 : 11;
    persianDay = gregorianDay >= 20 ? gregorianDay - 19 : gregorianDay + 9;
  } else if (gregorianMonth === 3) {
    persianMonth = gregorianDay >= 21 ? 1 : 12;
    persianDay = gregorianDay >= 21 ? gregorianDay - 20 : gregorianDay + 9;
  } else if (gregorianMonth === 4) {
    persianMonth = gregorianDay >= 21 ? 2 : 1;
    persianDay = gregorianDay >= 21 ? gregorianDay - 20 : gregorianDay + 10;
  } else if (gregorianMonth === 5) {
    persianMonth = gregorianDay >= 22 ? 3 : 2;
    persianDay = gregorianDay >= 22 ? gregorianDay - 21 : gregorianDay + 9;
  } else if (gregorianMonth === 6) {
    persianMonth = gregorianDay >= 22 ? 4 : 3;
    persianDay = gregorianDay >= 22 ? gregorianDay - 21 : gregorianDay + 9;
  } else if (gregorianMonth === 7) {
    persianMonth = gregorianDay >= 23 ? 5 : 4;
    persianDay = gregorianDay >= 23 ? gregorianDay - 22 : gregorianDay + 8;
  } else if (gregorianMonth === 8) {
    persianMonth = gregorianDay >= 23 ? 6 : 5;
    persianDay = gregorianDay >= 23 ? gregorianDay - 22 : gregorianDay + 8;
  } else if (gregorianMonth === 9) {
    persianMonth = gregorianDay >= 23 ? 7 : 6;
    persianDay = gregorianDay >= 23 ? gregorianDay - 22 : gregorianDay + 8;
  } else if (gregorianMonth === 10) {
    persianMonth = gregorianDay >= 23 ? 8 : 7;
    persianDay = gregorianDay >= 23 ? gregorianDay - 22 : gregorianDay + 8;
  } else if (gregorianMonth === 11) {
    persianMonth = gregorianDay >= 22 ? 9 : 8;
    persianDay = gregorianDay >= 22 ? gregorianDay - 21 : gregorianDay + 9;
  } else if (gregorianMonth === 12) {
    persianMonth = gregorianDay >= 22 ? 10 : 9;
    persianDay = gregorianDay >= 22 ? gregorianDay - 21 : gregorianDay + 9;
  }

  // Convert numbers to Persian numerals
  const persianDayStr = toPersianNumbers(persianDay.toString());
  const persianYearStr = toPersianNumbers(persianYear.toString());

  return `${persianDayStr} ${persianMonths[persianMonth - 1]} ${persianYearStr}`;
}

export function formatPersianDate(date: Date | string, format: 'short' | 'medium' | 'long' | 'full' = 'medium'): string {
  const persianDate = gregorianToPersian(date);

  if (format === 'short') {
    // Extract just day and month
    const parts = persianDate.split(' ');
    return `${parts[0]} ${parts[1]}`;
  } else if (format === 'long' || format === 'full') {
    return persianDate;
  }

  // medium format (default)
  return persianDate;
}

// Persian calendar utilities for date picker
export function persianToGregorian(persianYear: number, persianMonth: number, persianDay: number): Date {
  // Approximate conversion (not 100% accurate for all dates)
  let gregorianYear = persianYear + 621;
  let gregorianMonth = persianMonth;
  let gregorianDay = persianDay;

  // Adjust for Persian calendar differences
  if (persianMonth > 10 || (persianMonth === 10 && persianDay >= 11)) {
    gregorianYear += 1;
  }

  // Adjust month and day
  if (persianMonth === 1) {
    gregorianMonth = persianDay >= 12 ? 4 : 3;
    gregorianDay = persianDay >= 12 ? persianDay - 11 : persianDay + 20;
  } else if (persianMonth === 2) {
    gregorianMonth = persianDay >= 11 ? 5 : 4;
    gregorianDay = persianDay >= 11 ? persianDay - 10 : persianDay + 20;
  } else if (persianMonth === 3) {
    gregorianMonth = persianDay >= 11 ? 6 : 5;
    gregorianDay = persianDay >= 11 ? persianDay - 10 : persianDay + 21;
  } else if (persianMonth === 4) {
    gregorianMonth = persianDay >= 10 ? 7 : 6;
    gregorianDay = persianDay >= 10 ? persianDay - 9 : persianDay + 21;
  } else if (persianMonth === 5) {
    gregorianMonth = persianDay >= 10 ? 8 : 7;
    gregorianDay = persianDay >= 10 ? persianDay - 9 : persianDay + 22;
  } else if (persianMonth === 6) {
    gregorianMonth = persianDay >= 9 ? 9 : 8;
    gregorianDay = persianDay >= 9 ? persianDay - 8 : persianDay + 22;
  } else if (persianMonth === 7) {
    gregorianMonth = persianDay >= 9 ? 10 : 9;
    gregorianDay = persianDay >= 9 ? persianDay - 8 : persianDay + 22;
  } else if (persianMonth === 8) {
    gregorianMonth = persianDay >= 9 ? 11 : 10;
    gregorianDay = persianDay >= 9 ? persianDay - 8 : persianDay + 22;
  } else if (persianMonth === 9) {
    gregorianMonth = persianDay >= 8 ? 12 : 11;
    gregorianDay = persianDay >= 8 ? persianDay - 7 : persianDay + 22;
  } else if (persianMonth === 10) {
    gregorianMonth = persianDay >= 8 ? 1 : 12;
    gregorianDay = persianDay >= 8 ? persianDay - 7 : persianDay + 23;
    if (persianDay >= 8) gregorianYear += 1;
  } else if (persianMonth === 11) {
    gregorianMonth = persianDay >= 7 ? 2 : 1;
    gregorianDay = persianDay >= 7 ? persianDay - 6 : persianDay + 24;
    if (persianDay >= 7) gregorianYear += 1;
  } else if (persianMonth === 12) {
    gregorianMonth = persianDay >= 7 ? 3 : 2;
    gregorianDay = persianDay >= 7 ? persianDay - 6 : persianDay + 24;
    if (persianDay >= 7) gregorianYear += 1;
  }

  return new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
}

export function getPersianMonthDays(month: number): number {
  // Persian months have either 29 or 30 days
  // For simplicity, using standard Persian calendar rules
  const longMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // 30 days
  const shortMonths = [12]; // 29 days (Esfand)

  if (longMonths.includes(month)) return 30;
  if (shortMonths.includes(month)) return 29;

  return 30; // fallback
}

export function getPersianMonthName(month: number): string {
  const months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  return months[month - 1] || '';
}

// Persian number formatting utilities
export function toPersianNumbers(input: string | number): string {
  if (typeof input === 'number') {
    input = input.toString();
  }
  
  const persianNumbers = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };
  
  return input.replace(/[0-9]/g, (digit) => persianNumbers[digit as keyof typeof persianNumbers]);
}

export function formatPersianCurrency(amount: number, currency: string = 'IRT'): string {
  // Format number with comma separators
  const formattedNumber = amount.toLocaleString('fa-IR');
  
  if (currency === 'USD') {
    return `$${formattedNumber}`;
  } else {
    return `${formattedNumber} تومان`;
  }
}

export function formatPersianNumber(number: number, options: { decimals?: number; compact?: boolean } = {}): string {
  const { decimals = 0, compact = false } = options;
  
  const formatter = new Intl.NumberFormat('fa-IR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation: compact ? 'compact' : 'standard',
    compactDisplay: 'short'
  });
  
  return formatter.format(number);
}

export function formatPersianTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid Time';
  }
  
  // Use Persian locale for time formatting
  return d.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function formatPersianDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  
  const persianDate = formatPersianDate(d, 'medium');
  const persianTime = formatPersianTime(d);
  
  return `${persianDate} - ${persianTime}`;
}

export function formatPersianRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} ثانیه پیش`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} دقیقه پیش`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ساعت پیش`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} روز پیش`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} ماه پیش`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} سال پیش`;
  }
}

// Enhanced Persian date formatting with more options
export function formatPersianDateExtended(date: Date | string, options: {
  format?: 'short' | 'medium' | 'long' | 'full';
  includeWeekday?: boolean;
  includeTime?: boolean;
} = {}): string {
  const { format = 'medium', includeWeekday = false, includeTime = false } = options;
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  
  let result = '';
  
  if (includeWeekday) {
    const weekdays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
    const weekday = weekdays[d.getDay()];
    result += `${weekday}، `;
  }
  
  const persianDate = formatPersianDate(d, format);
  result += persianDate;
  
  if (includeTime) {
    const persianTime = formatPersianTime(d);
    result += ` ساعت ${persianTime}`;
  }
  
  return result;
}
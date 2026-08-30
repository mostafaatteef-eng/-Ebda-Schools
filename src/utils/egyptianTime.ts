/**
 * Egyptian Timezone & Formatting Utilities (Africa/Cairo)
 * أدوات التوقيت والتاريخ والعملة المصرية الرسمية
 */

export const EGYPT_TIMEZONE = 'Africa/Cairo';
export const EGYPT_CURRENCY_SYMBOL = 'ج.م';
export const EGYPT_CURRENCY_NAME = 'جنيه مصري';

/**
 * Returns current timestamp formatted in Cairo timezone (ISO-like string)
 */
export function getCairoNowISO(): string {
  const now = new Date();
  return now.toISOString();
}

/**
 * Returns current date in YYYY-MM-DD in Africa/Cairo timezone
 */
export function getCairoCurrentDate(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: EGYPT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // outputs YYYY-MM-DD
}

/**
 * Returns current time in HH:mm in Africa/Cairo timezone
 */
export function getCairoCurrentTime(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: EGYPT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(now); // outputs HH:mm
}

/**
 * Returns current time string in HH:mm:ss in Africa/Cairo timezone
 */
export function getCairoCurrentTimeString(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('ar-EG', {
    timeZone: EGYPT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  return formatter.format(now);
}

/**
 * Format any date string (YYYY-MM-DD or ISO) to Egyptian standard format: DD/MM/YYYY
 */
export function formatEgyptianDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: EGYPT_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return formatter.format(d);
  } catch (e) {
    return dateStr;
  }
}

/**
 * Format date to Arabic Month and Year e.g. "أغسطس 2026"
 */
export function formatArabicMonthYear(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00Z`);
    return new Intl.DateTimeFormat('ar-EG', {
      timeZone: EGYPT_TIMEZONE,
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch (e) {
    return dateStr;
  }
}

/**
 * Format Currency in Egyptian Pounds: "12,500 ج.م"
 */
export function formatEgyptianCurrency(amount?: number | null, compact: boolean = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) return `0 ${EGYPT_CURRENCY_SYMBOL}`;
  const formattedNumber = new Intl.NumberFormat('ar-EG', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);

  return compact ? `${formattedNumber} ج.م` : `${formattedNumber} ${EGYPT_CURRENCY_SYMBOL}`;
}

/**
 * Format full datetime in Egyptian Arabic locale: "29/08/2026 02:45 م"
 */
export function formatEgyptianDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('ar-EG', {
      timeZone: EGYPT_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch (e) {
    return dateStr;
  }
}

/**
 * Arabic day names in Egyptian calendar
 */
export const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export function getArabicDayName(dateStr: string): string {
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    return ARABIC_DAYS[d.getDay()] || '';
  } catch {
    return '';
  }
}

export const getEgyptianDayName = getArabicDayName;

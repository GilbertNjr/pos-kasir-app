/**
 * Utility for handling Asia/Jakarta (WIB = UTC+7) time calculations.
 * Ensures reports match local store time (WIB) regardless of whether server is UTC or local.
 */

export function getWIBDateParts(d: Date = new Date()) {
  const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
  const wibDate = new Date(utcMs + (7 * 3600 * 1000));

  return {
    year: wibDate.getUTCFullYear(),
    month: wibDate.getUTCMonth(),
    date: wibDate.getUTCDate(),
    day: wibDate.getUTCDay(),
    hours: wibDate.getUTCHours(),
    minutes: wibDate.getUTCMinutes(),
    seconds: wibDate.getUTCSeconds(),
  };
}

export function getWIBDateRange(
  period_type: string = 'DAILY',
  customStart?: string,
  customEnd?: string
): { startDate: Date; endDate: Date } {
  const parts = getWIBDateParts(new Date());

  if (period_type === 'ALL') {
    return {
      startDate: new Date(0),
      endDate: new Date('2099-12-31T23:59:59.999Z'),
    };
  }

  if (period_type === 'DAILY') {
    // 00:00:00 WIB of current WIB day to 23:59:59 WIB of current WIB day
    const startWIBMs = Date.UTC(parts.year, parts.month, parts.date, 0, 0, 0) - (7 * 3600 * 1000);
    const endWIBMs = Date.UTC(parts.year, parts.month, parts.date, 23, 59, 59, 999) - (7 * 3600 * 1000);
    return { startDate: new Date(startWIBMs), endDate: new Date(endWIBMs) };
  }

  if (period_type === 'WEEKLY') {
    // 7 days ago WIB 00:00:00 to Today WIB 23:59:59
    const startWIBMs = Date.UTC(parts.year, parts.month, parts.date - 6, 0, 0, 0) - (7 * 3600 * 1000);
    const endWIBMs = Date.UTC(parts.year, parts.month, parts.date, 23, 59, 59, 999) - (7 * 3600 * 1000);
    return { startDate: new Date(startWIBMs), endDate: new Date(endWIBMs) };
  }

  if (period_type === 'MONTHLY') {
    // 1st day of current WIB month 00:00:00 to Last day of current WIB month 23:59:59
    const startWIBMs = Date.UTC(parts.year, parts.month, 1, 0, 0, 0) - (7 * 3600 * 1000);
    const endWIBMs = Date.UTC(parts.year, parts.month + 1, 0, 23, 59, 59, 999) - (7 * 3600 * 1000);
    return { startDate: new Date(startWIBMs), endDate: new Date(endWIBMs) };
  }

  if (period_type === 'YEARLY') {
    // Jan 1 to Dec 31 of current WIB year
    const startWIBMs = Date.UTC(parts.year, 0, 1, 0, 0, 0) - (7 * 3600 * 1000);
    const endWIBMs = Date.UTC(parts.year, 11, 31, 23, 59, 59, 999) - (7 * 3600 * 1000);
    return { startDate: new Date(startWIBMs), endDate: new Date(endWIBMs) };
  }

  if (period_type === 'CUSTOM' && customStart && customEnd) {
    let startDate = new Date(customStart);
    if (isNaN(startDate.getTime())) startDate = new Date(0);
    let endDate = new Date(customEnd);
    if (!isNaN(endDate.getTime())) {
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date();
    }
    return { startDate, endDate };
  }

  // Default to DAILY
  const startWIBMs = Date.UTC(parts.year, parts.month, parts.date, 0, 0, 0) - (7 * 3600 * 1000);
  const endWIBMs = Date.UTC(parts.year, parts.month, parts.date, 23, 59, 59, 999) - (7 * 3600 * 1000);
  return { startDate: new Date(startWIBMs), endDate: new Date(endWIBMs) };
}

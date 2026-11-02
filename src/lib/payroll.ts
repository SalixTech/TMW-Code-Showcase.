import type {
  PayRates,
  PayrollTimeZone,
  PayrollWeekStart,
} from "@/types/pay";
import type { Trip } from "@/types/trip";
import { calculateTripTotal } from "@/lib/payStorage";

const PAYROLL_TIME_ZONE_IDS: Record<PayrollTimeZone, string> = {
  EASTERN: "America/New_York",
  CENTRAL: "America/Chicago",
  MOUNTAIN: "America/Denver",
  PACIFIC: "America/Los_Angeles",
};

const WEEKDAY_INDEX: Record<PayrollWeekStart, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

function zonedDateParts(timestamp: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));

  const values: Record<string, number> = {};

  for (const part of parts) {
    if (
      part.type === "year" ||
      part.type === "month" ||
      part.type === "day"
    ) {
      values[part.type] = Number(part.value);
    }
  }

  return {
    year: values.year,
    month: values.month,
    day: values.day,
  };
}

function getTimeZoneOffsetMs(timestamp: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(timestamp));

  const values: Record<string, number> = {};

  for (const part of parts) {
    if (
      part.type === "year" ||
      part.type === "month" ||
      part.type === "day" ||
      part.type === "hour" ||
      part.type === "minute" ||
      part.type === "second"
    ) {
      values[part.type] = Number(part.value);
    }
  }

  const interpretedAsUtc = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second
  );

  return interpretedAsUtc - timestamp;
}

function zonedStartOfDayMs(
  year: number,
  month: number,
  day: number,
  timeZone: string
) {
  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const firstOffset = getTimeZoneOffsetMs(utcGuess, timeZone);

  let result = utcGuess - firstOffset;

  const secondOffset = getTimeZoneOffsetMs(result, timeZone);

  if (secondOffset !== firstOffset) {
    result = utcGuess - secondOffset;
  }

  return result;
}

function addCalendarDays(
  year: number,
  month: number,
  day: number,
  amount: number
) {
  const date = new Date(Date.UTC(year, month - 1, day + amount));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function getPayrollWeekRange(
  timestamp: number,
  payrollWeekStart: PayrollWeekStart,
  payrollTimeZone: PayrollTimeZone
) {
  const zoneId = PAYROLL_TIME_ZONE_IDS[payrollTimeZone];
  const current = zonedDateParts(timestamp, zoneId);

  const utcCalendarDate = new Date(
    Date.UTC(current.year, current.month - 1, current.day)
  );

  const currentWeekday = utcCalendarDate.getUTCDay();
  const targetWeekday = WEEKDAY_INDEX[payrollWeekStart];
  const daysSinceStart = (currentWeekday - targetWeekday + 7) % 7;

  const startDate = addCalendarDays(
    current.year,
    current.month,
    current.day,
    -daysSinceStart
  );

  const nextWeekDate = addCalendarDays(
    startDate.year,
    startDate.month,
    startDate.day,
    7
  );

  const start = zonedStartOfDayMs(
    startDate.year,
    startDate.month,
    startDate.day,
    zoneId
  );

  const nextStart = zonedStartOfDayMs(
    nextWeekDate.year,
    nextWeekDate.month,
    nextWeekDate.day,
    zoneId
  );

  return {
    start,
    end: nextStart - 1,
  };
}

export function getPaySummary(trips: Trip[], payRates: PayRates) {
  const now = Date.now();

  const currentWeek = getPayrollWeekRange(
    now,
    payRates.payrollWeekStart,
    payRates.payrollTimeZone
  );

  const previousWeek = getPayrollWeekRange(
    currentWeek.start - 1,
    payRates.payrollWeekStart,
    payRates.payrollTimeZone
  );

  const currentWeekTrips = trips.filter(
    (trip) =>
      trip.isCompleted &&
      trip.completedDate >= currentWeek.start &&
      trip.completedDate <= currentWeek.end
  );

  const previousWeekTrips = trips.filter(
    (trip) =>
      trip.isCompleted &&
      trip.completedDate >= previousWeek.start &&
      trip.completedDate <= previousWeek.end
  );

  const thisWeekPay = currentWeekTrips.reduce(
    (sum, trip) => sum + calculateTripTotal(trip, payRates),
    0
  );

  const lastWeekPay = previousWeekTrips.reduce(
    (sum, trip) => sum + calculateTripTotal(trip, payRates),
    0
  );

  return {
    thisWeekPay,
    lastWeekPay,
    difference: thisWeekPay - lastWeekPay,
    currentWeekTripCount: currentWeekTrips.length,
    previousWeekTripCount: previousWeekTrips.length,
  };
}

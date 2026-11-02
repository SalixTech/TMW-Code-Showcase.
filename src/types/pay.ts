export type PayPeriodType =
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "CUSTOM";

export type PayrollWeekStart =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

export type PayrollTimeZone =
  | "EASTERN"
  | "CENTRAL"
  | "MOUNTAIN"
  | "PACIFIC";

export type TripIdMatchType =
  | "STARTS_WITH"
  | "ENDS_WITH"
  | "CONTAINS"
  | "EXACT";

export type PayExceptionType =
  | "NO_MILEAGE_PAY"
  | "NO_HOURLY_PAY"
  | "NO_STOP_PAY"
  | "NO_TRAILER_PAY"
  | "NO_SHAG_PAY";

export interface TripPayException {
  id: string;
  matchType: TripIdMatchType;
  matchValue: string;
  exceptionType: PayExceptionType;
  enabled: boolean;
}

export interface PayRates {
  isConfigured: boolean;

  payType: "CPM" | "HOURLY";

  mileagePayEnabled: boolean;
  mileageRate: number;

  hourlyPayEnabled: boolean;
  hourlyRate: number;

  stopPayEnabled: boolean;
  stopPay: number;

  trailerPayEnabled: boolean;
  trailerPay: number;

  shagPayEnabled: boolean;
  shagPay: number;

  payPeriodType: PayPeriodType;
  payrollWeekStart: PayrollWeekStart;
  payrollTimeZone: PayrollTimeZone;

  payPeriodAnchorStart: number;
  payPeriodAnchorEnd: number;

  tripPayExceptions: TripPayException[];
}
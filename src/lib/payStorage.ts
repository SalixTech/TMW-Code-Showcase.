// Portfolio excerpt: pure pay calculations from the original module.
// Firebase persistence, listeners, and account access are intentionally omitted.
import type { Trip } from "@/types/trip";
import type { PayRates, PayExceptionType, TripPayException } from "@/types/pay";

function matchesException(
  tripId: string,
  exception: TripPayException
) {
  if (!exception.enabled) {
    return false;
  }

  const normalizedTripId =
    tripId.trim().toUpperCase();

  const normalizedValue =
    exception.matchValue
      .trim()
      .toUpperCase();

  if (!normalizedValue) {
    return false;
  }

  switch (exception.matchType) {
    case "STARTS_WITH":
      return normalizedTripId.startsWith(
        normalizedValue
      );

    case "ENDS_WITH":
      return normalizedTripId.endsWith(
        normalizedValue
      );

    case "CONTAINS":
      return normalizedTripId.includes(
        normalizedValue
      );

    case "EXACT":
      return normalizedTripId === normalizedValue;
  }
}

function isPayExcluded(
  trip: Trip,
  rates: PayRates,
  exceptionType: PayExceptionType
) {
  return rates.tripPayExceptions.some(
    (exception) =>
      exception.exceptionType === exceptionType &&
      matchesException(
        trip.tripId,
        exception
      )
  );
}

export function calculateTripTotal(
  trip: Trip,
  rates: PayRates
) {
  let total = 0;

  if (
    rates.mileagePayEnabled &&
    !isPayExcluded(
      trip,
      rates,
      "NO_MILEAGE_PAY"
    )
  ) {
    total +=
      trip.mileage *
      trip.mileageRate;
  }

  if (
    rates.hourlyPayEnabled &&
    !isPayExcluded(
      trip,
      rates,
      "NO_HOURLY_PAY"
    )
  ) {
    total +=
      trip.hoursWorked *
      trip.hourlyRate;
  }

  if (
    rates.shagPayEnabled &&
    trip.isShagRun &&
    !isPayExcluded(
      trip,
      rates,
      "NO_SHAG_PAY"
    )
  ) {
    total += trip.shagPay;
  }

  if (
    rates.stopPayEnabled &&
    !isPayExcluded(
      trip,
      rates,
      "NO_STOP_PAY"
    )
  ) {
    total +=
      trip.stops *
      trip.stopPay;
  }

  if (
    rates.trailerPayEnabled &&
    !isPayExcluded(
      trip,
      rates,
      "NO_TRAILER_PAY"
    )
  ) {
    total += trip.trailerPay;
  }

  return total;
}

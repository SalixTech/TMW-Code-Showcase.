export type PayType = "CPM" | "HOURLY";

export type TrailerStatus = "LOADED" | "EMPTY" | "EQUIPMENT_MOVE";

export interface Trip {
  /** Permanent Firestore document identity. Never changes when Trip ID is edited. */
  firestoreId: string;

  tripId: string;

  completedDate: number;

  mileage: number;
  loadedMiles: number;
  deadheadMiles: number;

  hoursWorked: number;
  payType: PayType;

  stops: number;

  trailerNumber: string;
  trailerLicensePlate: string;

  haulingEmptyTrailer: boolean;
  trailerStatus: TrailerStatus;
  shipperTrailerStatus: TrailerStatus;

  emptyTrailerNumber: string;
  emptyTrailerLicensePlate: string;

  isCompleted: boolean;

  /** Explicitly marks a load as preassigned. */
  isPreassigned: boolean;

  mileageRate: number;
  hourlyRate: number;
  stopPay: number;
  trailerPay: number;

  isShagRun: boolean;
  shagPay: number;

  lastUpdated: number;

  confirmationNumbers: string[];
}
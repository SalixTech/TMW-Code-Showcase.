"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Trip } from "@/types/trip";
import { formatDate } from "@/lib/format";

type TripViewOptions = {
  loadedMiles: boolean;
  deadheadMiles: boolean;
  trailerNumber: boolean;
  plate: boolean;
  stops: boolean;
  totalMiles: boolean;
  completedDate: boolean;
};

const DEFAULT_TRIP_VIEW: TripViewOptions = {
  loadedMiles: true,
  deadheadMiles: true,
  trailerNumber: true,
  plate: true,
  stops: false,
  totalMiles: false,
  completedDate: false,
};

const VIEW_OPTIONS_STORAGE_KEY = "trip-master-trips-view-options";

function sortTrips(trips: Trip[]) {
  return [...trips].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }

    if (!a.isCompleted && !b.isCompleted) {
      return b.lastUpdated - a.lastUpdated;
    }

    return b.completedDate - a.completedDate;
  });
}

export default function TripsScreen({
  trips,
  tripError,
  showStops,
  onOpenTrip,
}: {
  trips: Trip[];
  tripError: string;
  showStops: boolean;
  onOpenTrip: (trip: Trip) => void;
}) {
  const [tripSearch, setTripSearch] = useState("");
  const [showViewOptions, setShowViewOptions] = useState(false);
  const [tripView, setTripView] =
    useState<TripViewOptions>(DEFAULT_TRIP_VIEW);
  const viewOptionsRef = useRef<HTMLDivElement>(null);
  const viewOptionsPanelRef = useRef<HTMLDivElement>(null);
  const restoredViewOptionsRef = useRef(false);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const saved = sessionStorage.getItem(
          VIEW_OPTIONS_STORAGE_KEY
        );

        if (saved) {
          setTripView({
            ...DEFAULT_TRIP_VIEW,
            ...(JSON.parse(saved) as Partial<TripViewOptions>),
          });
        }
      } catch {
        // Keep defaults if saved view options are unavailable or invalid.
      } finally {
        restoredViewOptionsRef.current = true;
      }
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!restoredViewOptionsRef.current) {
      return;
    }

    try {
      sessionStorage.setItem(
        VIEW_OPTIONS_STORAGE_KEY,
        JSON.stringify(tripView)
      );
    } catch {
      // View customization still works if session storage is unavailable.
    }
  }, [tripView]);

  useEffect(() => {
    if (!showViewOptions) {
      return;
    }

    const panel = viewOptionsPanelRef.current;

    if (!panel) {
      return;
    }

    function blockPageScroll(event: WheelEvent) {
      event.preventDefault();
      event.stopPropagation();
    }

    panel.addEventListener("wheel", blockPageScroll, { passive: false });

    return () => {
      panel.removeEventListener("wheel", blockPageScroll);
    };
  }, [showViewOptions]);

  useEffect(() => {
    if (!showViewOptions) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        viewOptionsRef.current &&
        !viewOptionsRef.current.contains(event.target as Node)
      ) {
        setShowViewOptions(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowViewOptions(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showViewOptions]);

  useEffect(() => {
    if (!showStops && tripView.stops) {
      setTripView((current) => ({ ...current, stops: false }));
    }
  }, [showStops, tripView.stops]);

  const sortedTrips = useMemo(() => sortTrips(trips), [trips]);

  const filteredTrips = useMemo(() => {
    // Search human-facing identifiers, not Firestore document IDs. Normalizing
    // punctuation/spacing makes partial searches useful even when an ID was
    // pasted with separators or inconsistent casing.
    const normalizeSearchValue = (value: unknown) =>
      String(value ?? "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

    const query = normalizeSearchValue(tripSearch);

    if (!query) {
      return sortedTrips;
    }

    return sortedTrips.filter((trip) =>
      [
        trip.tripId,
        trip.trailerNumber,
        trip.trailerLicensePlate,
        trip.emptyTrailerNumber,
        trip.emptyTrailerLicensePlate,
        ...(trip.confirmationNumbers ?? []),
      ].some((value) =>
        normalizeSearchValue(value).includes(query)
      )
    );
  }, [tripSearch, sortedTrips]);

  const pendingTripCount = trips.filter(
    (trip) => !trip.isCompleted
  ).length;

  const completedTripCount =
    trips.length - pendingTripCount;

  function toggleTripViewOption(
    option: keyof TripViewOptions
  ) {
    setTripView((current) => ({
      ...current,
      [option]: !current[option],
    }));
  }

  function visibleDataColumns(trip: Trip) {
    const columns: Array<{
      label: string;
      value: string;
    }> = [];

    if (tripView.loadedMiles) {
      columns.push({
        label: "Loaded Miles",
        value: trip.loadedMiles.toLocaleString(),
      });
    }

    if (tripView.deadheadMiles) {
      columns.push({
        label: "Deadhead",
        value: trip.deadheadMiles.toLocaleString(),
      });
    }

    if (tripView.trailerNumber) {
      columns.push({
        label: "Trailer",
        value: trip.trailerNumber || "—",
      });
    }

    if (tripView.plate) {
      columns.push({
        label: "Plate",
        value: trip.trailerLicensePlate || "—",
      });
    }

    if (showStops && tripView.stops) {
      columns.push({
        label: "Stops",
        value: trip.stops.toString(),
      });
    }

    if (tripView.totalMiles) {
      columns.push({
        label: "Total Miles",
        value: trip.mileage.toLocaleString(),
      });
    }

    if (tripView.completedDate) {
      columns.push({
        label: "Completed",
        value:
          trip.isCompleted && trip.completedDate > 0
            ? formatDate(trip.completedDate)
            : "Pending",
      });
    }

    return columns;
  }

  return (
    <section>
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FF8C42]">
            Trips
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Trip History
          </h2>

          <p className="mt-2 text-slate-400">
            {trips.length} trips • {pendingTripCount} pending •{" "}
            {completedTripCount} completed
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
          <div className="w-full xl:w-96">
            <label
              htmlFor="trip-search"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Search Trips, Trailers, Or Plates
            </label>

            <input
              id="trip-search"
              type="search"
              value={tripSearch}
              onChange={(event) =>
                setTripSearch(event.target.value)
              }
              placeholder="Search by Trip ID, trailer, or plate"
              className="w-full rounded-2xl border border-white/10 bg-[#0B2D4D] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF8C42]"
            />
          </div>

          <div ref={viewOptionsRef} className="relative self-end">
            <button
              type="button"
              onClick={() =>
                setShowViewOptions((current) => !current)
              }
              className="min-h-12 rounded-2xl border border-white/10 bg-[#11263D] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-[#FF8C42]/60"
            >
              Customize View
            </button>

            {showViewOptions && (
              <div
                ref={viewOptionsPanelRef}
                className="absolute right-0 z-20 mt-2 w-72 overscroll-contain rounded-3xl border border-white/10 bg-[#11263D] p-5 shadow-2xl shadow-black/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">Trip Card Fields</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Choose the details you want to see on each trip card.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setTripView(DEFAULT_TRIP_VIEW)
                    }
                    className="text-xs font-semibold text-[#FF8C42]"
                  >
                    Reset
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    ["loadedMiles", "Loaded Miles"],
                    ["deadheadMiles", "Deadhead Miles"],
                    ["trailerNumber", "Trailer Number"],
                    ["plate", "License Plate"],
                    ...(showStops ? [["stops", "Stops"] as const] : []),
                    ["totalMiles", "Total Miles"],
                    ["completedDate", "Completed Date"],
                  ].map(([key, label]) => {
                    const option =
                      key as keyof TripViewOptions;

                    return (
                      <label
                        key={key}
                        className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-xl px-2 py-2 hover:bg-white/5"
                      >
                        <span className="text-sm text-slate-200">
                          {label}
                        </span>

                        <input
                          type="checkbox"
                          checked={tripView[option]}
                          onChange={() =>
                            toggleTripViewOption(option)
                          }
                          className="h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-slate-500 bg-transparent transition checked:border-[#FF8C42] checked:bg-[#FF8C42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C42]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11263D]"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {tripError && (
        <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Unable to load trips: {tripError}
        </p>
      )}

      <p className="mt-8 text-sm text-slate-400">
        Select a trip to view its details
      </p>

      <div className="mt-3 space-y-4">
        {filteredTrips.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#11263D] p-8 text-center">
            <p className="text-lg font-semibold">
              No trips found
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Try another Trip ID, trailer number, or plate.
            </p>
          </div>
        ) : (
          filteredTrips.map((trip) => {
            const columns = visibleDataColumns(trip);

            return (
              <button
                key={`${trip.tripId}-${trip.lastUpdated}`}
                type="button"
                onClick={() => onOpenTrip(trip)}
                className="w-full rounded-3xl border border-white/10 bg-[#11263D] p-5 text-left transition hover:border-[#FF8C42]/50 hover:bg-[#17334F]"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                  <div className="w-full xl:w-72 xl:flex-none">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold">
                        {trip.tripId || "Untitled Trip"}
                      </h3>

                      {trip.isPreassigned && (
                        <span className="rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 text-xs font-bold text-yellow-200">
                          PA
                        </span>
                      )}

                      <span
                        className={
                          trip.isCompleted
                            ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300"
                            : "rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300"
                        }
                      >
                        {trip.isCompleted ? "Completed" : "Pending"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      {trip.isCompleted
                        ? tripView.completedDate
                          ? "Completed trip"
                          : `Completed ${formatDate(
                              trip.completedDate
                            )}`
                        : "Trip is still pending"}
                    </p>
                  </div>

                  {columns.length > 0 && (
                    <div
                      className="grid min-w-0 flex-1 gap-3"
                      style={{
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(135px, 1fr))",
                      }}
                    >
                      {columns.map((column) => (
                        <div
                          key={column.label}
                          className={`rounded-2xl bg-[#0B2D4D] px-4 py-3 ${
                            column.label === "Completed"
                              ? "min-w-[190px]"
                              : "min-w-0"
                          }`}
                        >
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            {column.label}
                          </p>

                          <p className="mt-1 truncate text-lg font-bold">
                            {column.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

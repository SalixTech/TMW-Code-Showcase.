"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PayRates } from "@/types/pay";
import type { Trip } from "@/types/trip";
import { calculateTripTotal } from "@/lib/payStorage";
import { formatCurrency, formatDate } from "@/lib/format";
import { getPayrollWeekRange } from "@/lib/payroll";

type Period = "thisWeek" | "lastWeek" | "all";

type PayViewOptions = {
  totalMiles: boolean;
  loadedMiles: boolean;
  deadheadMiles: boolean;
  trailerNumber: boolean;
  plate: boolean;
  stops: boolean;
  completedDate: boolean;
};

const DEFAULT_PAY_VIEW: PayViewOptions = {
  totalMiles: true,
  loadedMiles: false,
  deadheadMiles: false,
  trailerNumber: false,
  plate: false,
  stops: false,
  completedDate: true,
};

const VIEW_OPTIONS_STORAGE_KEY = "trip-master-pay-view-options";

export default function PayScreen({
  trips,
  payRates,
}: {
  trips: Trip[];
  payRates: PayRates;
}) {
  const [period, setPeriod] = useState<Period>("thisWeek");
  const [selectedPayTrip, setSelectedPayTrip] =
    useState<Trip | null>(null);
  const [showViewOptions, setShowViewOptions] = useState(false);
  const [payView, setPayView] =
    useState<PayViewOptions>(DEFAULT_PAY_VIEW);
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
          setPayView({
            ...DEFAULT_PAY_VIEW,
            ...(JSON.parse(saved) as Partial<PayViewOptions>),
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
        JSON.stringify(payView)
      );
    } catch {
      // View customization still works if session storage is unavailable.
    }
  }, [payView]);

  useEffect(() => {
    if (!showViewOptions) {
      return;
    }

    const panel = viewOptionsPanelRef.current;

    function stopPanelScroll(event: WheelEvent) {
      event.preventDefault();
      event.stopPropagation();
    }

    panel?.addEventListener("wheel", stopPanelScroll, { passive: false });

    return () => {
      panel?.removeEventListener("wheel", stopPanelScroll);
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

  const periodTrips = useMemo(() => {
    const completed = trips
      .filter((trip) => trip.isCompleted)
      .sort(
        (a, b) =>
          b.completedDate - a.completedDate
      );

    if (period === "all") {
      return completed;
    }

    const current = getPayrollWeekRange(
      Date.now(),
      payRates.payrollWeekStart,
      payRates.payrollTimeZone
    );

    const range =
      period === "thisWeek"
        ? current
        : getPayrollWeekRange(
            current.start - 1,
            payRates.payrollWeekStart,
            payRates.payrollTimeZone
          );

    return completed.filter(
      (trip) =>
        trip.completedDate >= range.start &&
        trip.completedDate <= range.end
    );
  }, [trips, payRates, period]);

  const total = periodTrips.reduce(
    (sum, trip) =>
      sum + calculateTripTotal(trip, payRates),
    0
  );

  const miles = periodTrips.reduce(
    (sum, trip) => sum + trip.mileage,
    0
  );

  function toggleViewOption(
    option: keyof PayViewOptions
  ) {
    setPayView((current) => ({
      ...current,
      [option]: !current[option],
    }));
  }

  function visibleColumns(trip: Trip) {
    const columns: Array<{
      label: string;
      value: string;
    }> = [];

    if (payView.totalMiles) {
      columns.push({
        label: "Miles",
        value: trip.mileage.toLocaleString(),
      });
    }

    if (payView.loadedMiles) {
      columns.push({
        label: "Loaded",
        value: trip.loadedMiles.toLocaleString(),
      });
    }

    if (payView.deadheadMiles) {
      columns.push({
        label: "Deadhead",
        value: trip.deadheadMiles.toLocaleString(),
      });
    }

    if (payView.trailerNumber) {
      columns.push({
        label: "Trailer",
        value: trip.trailerNumber || "—",
      });
    }

    if (payView.plate) {
      columns.push({
        label: "Plate",
        value: trip.trailerLicensePlate || "—",
      });
    }

    if (payRates.stopPayEnabled && payView.stops) {
      columns.push({
        label: "Stops",
        value: trip.stops.toString(),
      });
    }

    if (payView.completedDate) {
      columns.push({
        label: "Completed",
        value: formatDate(trip.completedDate),
      });
    }

    return columns;
  }

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FF8C42]">
        Pay
      </p>

      <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-3xl font-bold">
            Pay Overview
          </h2>

          <p className="mt-2 text-slate-400">
            See what you've earned and how each completed trip adds up.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            ["thisWeek", "This Week"],
            ["lastWeek", "Last Week"],
            ["all", "All Completed"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setPeriod(value as Period)
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                period === value
                  ? "bg-[#FF8C42] text-white"
                  : "border border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}

          <div ref={viewOptionsRef} className="relative">
            <button
              type="button"
              onClick={() =>
                setShowViewOptions(
                  (current) => !current
                )
              }
              className="rounded-xl border border-white/10 bg-[#11263D] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-[#FF8C42]/60"
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
                    <p className="font-bold">
                      Pay Breakdown Fields
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Choose the details you want to see on each trip card.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPayView(
                        DEFAULT_PAY_VIEW
                      )
                    }
                    className="text-xs font-semibold text-[#FF8C42]"
                  >
                    Reset
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    ["totalMiles", "Total Miles"],
                    ["loadedMiles", "Loaded Miles"],
                    ["deadheadMiles", "Deadhead Miles"],
                    ["trailerNumber", "Trailer Number"],
                    ["plate", "License Plate"],
                    ...(payRates.stopPayEnabled ? [["stops", "Stops"] as const] : []),
                    ["completedDate", "Completed Date"],
                  ].map(([key, label]) => {
                    const option =
                      key as keyof PayViewOptions;

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
                          checked={
                            payView[option]
                          }
                          onChange={() =>
                            toggleViewOption(
                              option
                            )
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

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-[#FF8C42]/20 bg-[#11263D] p-6">
          <p className="text-sm uppercase tracking-[0.14em] text-slate-500">
            Estimated Pay
          </p>

          <p className="mt-3 text-4xl font-extrabold text-[#FF8C42]">
            {formatCurrency(total)}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#11263D] p-6">
          <p className="text-sm uppercase tracking-[0.14em] text-slate-500">
            Completed Trips
          </p>

          <p className="mt-3 text-4xl font-extrabold">
            {periodTrips.length}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#11263D] p-6">
          <p className="text-sm uppercase tracking-[0.14em] text-slate-500">
            Miles
          </p>

          <p className="mt-3 text-4xl font-extrabold">
            {miles.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#11263D]">
        <div className="border-b border-white/10 px-6 py-5">
          <h3 className="text-xl font-bold">
            Trip Pay Breakdown
          </h3>
        </div>

        {periodTrips.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No completed trips for this pay period yet.
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {periodTrips.map((trip) => {
              const columns =
                visibleColumns(trip);

              return (
                <button
                  type="button"
                  key={`${trip.firestoreId || trip.tripId}-${trip.completedDate}`}
                  onClick={() => setSelectedPayTrip(trip)}
                  className="flex w-full flex-col gap-5 px-6 py-5 text-left transition hover:bg-white/[0.03] xl:flex-row xl:items-center"
                >
                  <div className="w-full xl:w-56 xl:flex-none">
                    <p className="font-bold">
                      {trip.tripId}
                    </p>

                    {!payView.completedDate && (
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(
                          trip.completedDate
                        )}
                      </p>
                    )}
                  </div>

                  {columns.length > 0 && (
                    <div
                      className="grid min-w-0 flex-1 gap-3"
                      style={{
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(120px, 1fr))",
                      }}
                    >
                      {columns.map(
                        (column) => (
                          <div
                            key={column.label}
                            className="rounded-2xl bg-[#0B2D4D] px-4 py-3"
                          >
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              {column.label}
                            </p>

                            <p className="mt-1 truncate font-semibold">
                              {column.value}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div className="w-full xl:w-40 xl:flex-none xl:text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Trip Pay
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#FF8C42]">
                      {formatCurrency(
                        calculateTripTotal(
                          trip,
                          payRates
                        )
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {selectedPayTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedPayTrip(null);
        }}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#11263D] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FF8C42]">Trip Pay Details</p>
                <h3 className="mt-2 text-2xl font-bold">{selectedPayTrip.tripId}</h3>
                <p className="mt-2 text-sm text-slate-400">See exactly how this trip's estimated pay was calculated.</p>
              </div>
              <button type="button" onClick={() => setSelectedPayTrip(null)} className="rounded-xl px-3 py-2 text-xl text-slate-400 hover:bg-white/5 hover:text-white">×</button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Completed", formatDate(selectedPayTrip.completedDate)],
                ["Loaded Miles", selectedPayTrip.loadedMiles.toLocaleString()],
                ["Deadhead Miles", selectedPayTrip.deadheadMiles.toLocaleString()],
                ["Total Miles", selectedPayTrip.mileage.toLocaleString()],
                ["Trailer", selectedPayTrip.trailerNumber || "—"],
                ["Plate", selectedPayTrip.trailerLicensePlate || "—"],
                ...(payRates.stopPayEnabled ? [["Stops", selectedPayTrip.stops.toString()]] : []),
                ["Estimated Trip Pay", formatCurrency(calculateTripTotal(selectedPayTrip, payRates))],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#0B2D4D] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => setSelectedPayTrip(null)} className="rounded-2xl bg-[#FF8C42] px-5 py-3 font-bold text-white hover:brightness-110">Done</button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

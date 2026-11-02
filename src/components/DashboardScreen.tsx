"use client";

import type { PayRates } from "@/types/pay";
import type { Trip } from "@/types/trip";
import type { Screen } from "@/types/navigation";
import { formatCurrency } from "@/lib/format";
import { getPaySummary } from "@/lib/payroll";

export default function DashboardScreen({
  trips,
  payRates,
  tripError,
  payError,
  onNavigate,
  canViewTraining,
}: {
  trips: Trip[];
  payRates: PayRates;
  tripError: string;
  payError: string;
  onNavigate: (screen: Screen) => void;
  canViewTraining: boolean;
}) {
  const pendingTripCount = trips.filter(
    (trip) => !trip.isCompleted
  ).length;

  const uniqueTrailerCount = new Set(
    trips.flatMap((trip) =>
      [
        trip.trailerNumber.trim().toUpperCase(),
        trip.emptyTrailerNumber.trim().toUpperCase(),
      ].filter(Boolean)
    )
  ).size;

  const paySummary = getPaySummary(trips, payRates);

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FF8C42]">
          Dashboard
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          Welcome back
        </h2>

        <p className="mt-2 text-slate-400">
          Your trips, pay, trailers, and training are all ready when you need them.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-[#FF8C42]/20 bg-[#11263D] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            This Week Pay
          </p>

          <p className="mt-3 text-4xl font-extrabold text-[#FF8C42]">
            {formatCurrency(paySummary.thisWeekPay)}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            {paySummary.currentWeekTripCount} completed{" "}
            {paySummary.currentWeekTripCount === 1
              ? "trip"
              : "trips"}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#11263D] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Last Week Pay
          </p>

          <p className="mt-3 text-4xl font-extrabold">
            {formatCurrency(paySummary.lastWeekPay)}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            {paySummary.previousWeekTripCount} completed{" "}
            {paySummary.previousWeekTripCount === 1
              ? "trip"
              : "trips"}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#11263D] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Difference
          </p>

          <p
            className={`mt-3 text-4xl font-extrabold ${
              paySummary.difference > 0
                ? "text-emerald-300"
                : paySummary.difference < 0
                  ? "text-red-300"
                  : "text-white"
            }`}
          >
            {paySummary.difference > 0 ? "+" : ""}
            {formatCurrency(paySummary.difference)}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            This week vs last week
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => onNavigate("trips")}
          className="rounded-2xl border border-white/10 bg-[#11263D] p-5 text-left transition hover:border-[#FF8C42]/60 hover:bg-[#17334F]"
        >
          <p className="text-sm text-slate-400">Trips</p>
          <p className="mt-2 text-3xl font-bold">{trips.length}</p>
          <p className="mt-1 text-sm text-slate-400">
            {pendingTripCount > 0
              ? `${pendingTripCount} pending • View trips →`
              : "View trip history →"}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("trailers")}
          className="rounded-2xl border border-white/10 bg-[#11263D] p-5 text-left transition hover:border-[#FF8C42]/60 hover:bg-[#17334F]"
        >
          <p className="text-sm text-slate-400">Trailers</p>
          <p className="mt-2 text-3xl font-bold">{uniqueTrailerCount}</p>
          <p className="mt-1 text-sm text-slate-400">
            View trailer history →
          </p>
        </button>
        {canViewTraining && (

        <button
          type="button"
          onClick={() => onNavigate("training")}
          className="rounded-2xl border border-white/10 bg-[#11263D] p-5 text-left transition hover:border-[#FF8C42]/60 hover:bg-[#17334F]"
        >
          <p className="text-sm text-slate-400">Training</p>
          <p className="mt-2 text-2xl font-bold">Training Center</p>
          <p className="mt-1 text-sm text-slate-400">
            Records, progress & notes →
          </p>
        </button>
        )}

        <button
          type="button"
          onClick={() => onNavigate("settings")}
          className="rounded-2xl border border-white/10 bg-[#11263D] p-5 text-left transition hover:border-[#FF8C42]/60 hover:bg-[#17334F]"
        >
          <p className="text-sm text-slate-400">Settings</p>
          <p className="mt-2 text-2xl font-bold">Pay & Payroll</p>
          <p className="mt-1 text-sm text-slate-400">
            Review your settings →
          </p>
        </button>
      </div>

      {payError && (
        <p className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Unable to load pay settings: {payError}
        </p>
      )}

      {tripError && (
        <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Unable to load trips: {tripError}
        </p>
      )}
    </section>
  );
}

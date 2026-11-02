# TripMaster Web — Code Showcase

A focused TypeScript/React code sample from a driver-facing trip and pay application. The selection follows a concrete flow: structured trip records become configurable pay calculations, payroll-week summaries, and browsable trip/pay screens.

**Code review only — not a runnable application or live demo.** Application routes, authentication, backend integration, runtime configuration, styling/build setup, and data are not included.

## Reading guide

| Start here | What to look for |
| --- | --- |
| [`src/types/trip.ts`](src/types/trip.ts) and [`src/types/pay.ts`](src/types/pay.ts) | Trip lifecycle fields, captured per-trip rates, pay toggles, and configurable trip-ID exceptions. |
| [`src/lib/payStorage.ts`](src/lib/payStorage.ts) | Pure calculation excerpt: additive mileage/hourly/stop/trailer/shag pay, with normalized and enabled trip-ID exception rules. |
| [`src/lib/payroll.ts`](src/lib/payroll.ts) | Calendar-based workweek boundaries in four US time zones; completed-trip filtering and week-over-week pay summaries. |
| [`src/components/PayScreen.tsx`](src/components/PayScreen.tsx) | Period filtering, computed totals, selectable details, and session-scoped display preferences. |
| [`src/components/TripsScreen.tsx`](src/components/TripsScreen.tsx) | Pending/completed ordering, trip search, configurable columns, and a parent-supplied navigation callback. |
| [`src/components/DashboardScreen.tsx`](src/components/DashboardScreen.tsx) | Summary composition, unique-trailer counting, navigation, and error states. |

Shared formatting and navigation types are included so every local import resolves within `src/`. In the source application's alias convention, `@/` refers to `src/`.

## Selection and boundaries

- Uses the supplied archive's `src/` modules rather than the duplicate root-level component/library variants. Original paths are retained.
- Eight modules are unchanged. `src/lib/payStorage.ts` retains only the original pure calculation functions and their type imports; Firebase persistence, listeners, account access, and defaults are omitted. The filename is retained to preserve its consumers' imports.
- No credentials, API routes, mail templates, deployment configuration, account defaults, partner curriculum, uploaded records, or customer data are included.
- Components accept records and settings from their parent. They do not supply a demonstration dataset or a replacement backend.
- Calculations intentionally preserve source behavior: rates come from each trip, enablement/exceptions come from current settings, and the weekly summary uses completion dates. These are reviewable design decisions, not a claim of payroll compliance.

## Verification

The selection was checked with strict TypeScript compilation using local React type dependencies, local-import resolution, source-fidelity comparison, and focused synthetic checks of pay rules and payroll date boundaries. These are preparation-time checks, not a bundled application test suite. No browser, backend, integration, or production-access testing is represented here.

A working demo can be developed separately; this repository is intentionally limited to readable source.

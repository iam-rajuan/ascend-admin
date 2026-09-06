"use client";

import React from "react";
import Link from "next/link";
import { useLeadership } from "../context/leadership-context";

function formatScore(value: number | null | undefined) {
  if (typeof value !== "number") return "—";
  return value.toFixed(1);
}

// Real R1-R5 risk-severity scale (leadership_aggregate_service.
// RISK_SEVERITY_BY_BAND) - deliberately not L-prefixed, this codebase
// already has two other differently-meaning L-scales. R1=Ready (best) to
// R5=High Priority (worst).
const RISK_SEVERITY_COLOR: Record<string, string> = {
  R1: "bg-emerald-500",
  R2: "bg-teal-500",
  R3: "bg-amber-500",
  R4: "bg-orange-500",
  R5: "bg-rose-500",
};

function statusTone(status: string | null | undefined) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized.includes("sent") || normalized.includes("ready") || normalized.includes("completed")) {
    return "bg-emerald-500/10 text-emerald-500";
  }
  if (normalized.includes("review") || normalized.includes("pending") || normalized.includes("draft")) {
    return "bg-amber-500/10 text-amber-500";
  }
  if (normalized.includes("archive")) {
    return "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
  return "bg-sky-500/10 text-sky-500";
}

function MetricCard({
  title,
  value,
  subtext,
  accent,
}: {
  title: string;
  value: string;
  subtext: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#0e1628]">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">{title}</span>
      <h3 className={`mt-2 text-3xl font-extrabold tracking-tight ${accent || "text-slate-800 dark:text-white"}`}>{value}</h3>
      <p className="mt-2 text-[10px] font-semibold text-slate-400">{subtext}</p>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#0e1628] ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 border-b border-slate-100 pb-3 dark:border-white/5">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      {subtitle && <p className="mt-0.5 text-[10px] text-slate-400">{subtitle}</p>}
    </div>
  );
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

function HeroTrendChart({ months }: { months: Array<{ month: string; average_ops_score: number | null }> }) {
  const points = months.filter((m) => typeof m.average_ops_score === "number");
  if (points.length < 2) {
    return (
      <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
        Not enough scored months yet for a trend line - {points.length} recorded so far.
      </div>
    );
  }
  const scores = points.map((p) => p.average_ops_score as number);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 100);
  const w = 560;
  const h = 140;
  const coords = points.map((p, i) => {
    const x = points.length > 1 ? (i / (points.length - 1)) * w : 0;
    const y = h - ((((p.average_ops_score as number) - min) / (max - min || 1)) * h);
    return [x, y] as const;
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full" preserveAspectRatio="none">
      <path d={area} fill="var(--brand-color)" opacity="0.08" />
      <path d={path} fill="none" stroke="var(--brand-color)" strokeWidth="2.5" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === coords.length - 1 ? 4 : 2.5} fill="var(--brand-color)" />
      ))}
      {points.map((p, i) => (
        <text
          key={p.month}
          x={coords[i][0]}
          y={h + 16}
          fontSize="10"
          textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
          className="fill-slate-400"
        >
          {formatMonthLabel(p.month)}
        </text>
      ))}
    </svg>
  );
}

function MiniSparkline({ points, toneClass }: { points: number[]; toneClass: string }) {
  if (points.length < 2) {
    return <span className="text-[9px] text-slate-400">Not enough months yet</span>;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const w = 84;
  const h = 28;
  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return [x, y] as const;
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`h-7 w-21 ${toneClass}`}>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function driverBandTone(band: string | null | undefined) {
  const normalized = String(band ?? "").toLowerCase();
  if (normalized.includes("ready") || normalized.includes("monitor")) return "text-emerald-500";
  if (normalized.includes("caution")) return "text-amber-500";
  if (normalized.includes("action")) return "text-rose-500";
  return "text-slate-400";
}

function readinessBarColor(band: string | null | undefined) {
  const normalized = String(band ?? "").toLowerCase();
  if (normalized.includes("ready") || normalized.includes("monitor")) return "bg-emerald-500";
  if (normalized.includes("caution")) return "bg-amber-500";
  if (normalized.includes("action") || normalized.includes("priority")) return "bg-rose-500";
  return "bg-slate-300 dark:bg-slate-700";
}

function DriverTrendCard({
  component,
  band,
  months,
  cohortSize,
}: {
  component: string;
  band: string | null;
  months: Array<{ month: string; component_averages: Record<string, number> }>;
  cohortSize: number;
}) {
  const series = months
    .map((m) => m.component_averages[component])
    .filter((v): v is number => typeof v === "number");
  const latest = series[series.length - 1] ?? null;
  const momDelta = series.length >= 2 ? series[series.length - 1] - series[series.length - 2] : null;
  const tone = driverBandTone(band);
  const shortLabel = component.replace(" Readiness", "");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#0e1628]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 dark:text-white">{shortLabel}</span>
        <span className={`flex items-center gap-1 text-[9px] font-bold uppercase ${tone}`}>
          <span className="size-1.5 rounded-full bg-current" />
          {band || "—"}
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-slate-900 dark:text-white">{formatScore(latest)}</span>
          {typeof momDelta === "number" && (
            <span className={`text-[10px] font-bold ${momDelta >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {momDelta >= 0 ? "+" : ""}
              {momDelta.toFixed(1)}
            </span>
          )}
        </div>
        <MiniSparkline points={series} toneClass={tone} />
      </div>
      <p className="mt-2 text-[9px] text-slate-400">
        {months.length} mo · k={cohortSize}
      </p>
    </div>
  );
}

function SimpleKeyValueList({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="space-y-3 text-xs">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-slate-900/50">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{row.label}</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AggregateView() {
  const { loading, error, aggregate } = useLeadership();

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/5 dark:bg-[#0e1628]">Loading live aggregate data...</div>;
  }

  if (error || !aggregate) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-300">{error || "No aggregate data"}</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leadership · Aggregate</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Aggregate readiness</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Live aggregate OPS, by-flight comparison, recovery program summary, and risk heatmap. Cohort minimum k &ge; {aggregate.min_cohort_size}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/leadership/reports" className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-slate-800">
            Reports
          </Link>
          <Link href="/dashboard/leadership/trends" className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
            Open trends
          </Link>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex-shrink-0 space-y-4 lg:w-64">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Composite OPS · {aggregate.hero.months.length}-month readiness
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Cohort k = {aggregate.hero.cohort_size} · {aggregate.hero.score_band || "no band"}
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 dark:text-white">{formatScore(aggregate.hero.average_ops_score)}</span>
              {typeof aggregate.hero.mom_delta === "number" && (
                <span className={`text-sm font-bold ${aggregate.hero.mom_delta >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {aggregate.hero.mom_delta >= 0 ? "+" : ""}
                  {formatScore(aggregate.hero.mom_delta)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-[10px] dark:border-white/5">
              <div>
                <p className="font-bold uppercase tracking-wide text-slate-400">Period</p>
                <p className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">
                  {aggregate.hero.months[0] ? formatMonthLabel(aggregate.hero.months[0].month) : "—"} –{" "}
                  {aggregate.hero.months[aggregate.hero.months.length - 1]
                    ? formatMonthLabel(aggregate.hero.months[aggregate.hero.months.length - 1].month)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wide text-slate-400">
                  Target{aggregate.hero.target_is_approximated ? " (approx.)" : ""}
                </p>
                <p className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">{formatScore(aggregate.hero.approximate_target_score)}</p>
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <HeroTrendChart months={aggregate.hero.months} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <MetricCard title="Hero cohort" value={aggregate.hero.cohort_size.toString()} subtext={aggregate.hero.score_band || "No band"} />
        <MetricCard title="Average OPS" value={formatScore(aggregate.hero.average_ops_score)} subtext={`Target ${formatScore(aggregate.hero.approximate_target_score)}`} accent="text-emerald-500" />
        <MetricCard title="MoM delta" value={formatScore(aggregate.hero.mom_delta)} subtext="Month-over-month" />
        <MetricCard title="PvP delta" value={formatScore(aggregate.hero.pvp_delta)} subtext="Period-over-period" />
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supporting signal</p>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Driver trends</h2>
          <p className="text-xs text-slate-500">
            {aggregate.driver_trends.length} drivers · sparkline + delta · month-over-month
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {aggregate.driver_trends.map((item) => (
            <DriverTrendCard
              key={item.component}
              component={item.component}
              band={item.score_band}
              months={aggregate.hero.months}
              cohortSize={aggregate.hero.cohort_size}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader
            title="By-flight comparison"
            subtitle={`${aggregate.flight_comparison.flights_meeting_cohort_minimum} of ${aggregate.flight_comparison.total_flights} flights meet the cohort minimum - aggregate only, never individuals`}
          />
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                  <th className="pb-3 font-semibold">Flight</th>
                  <th className="pb-3 font-semibold">Readiness</th>
                  <th className="pb-3 font-semibold">MoM</th>
                  <th className="pb-3 font-semibold">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {aggregate.flight_comparison.flights.map((flight) => (
                  <tr key={flight.flight_id}>
                    <td className="py-3 font-semibold text-slate-800 dark:text-white">{flight.flight_name}</td>
                    <td className="py-3">
                      {typeof flight.average_ops_score === "number" ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full ${readinessBarColor(flight.score_band)}`}
                              style={{ width: `${Math.max(4, Math.min(100, flight.average_ops_score))}%` }}
                            />
                          </div>
                          <span className="font-mono text-slate-600 dark:text-slate-300">{formatScore(flight.average_ops_score)}</span>
                        </div>
                      ) : (
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(flight.score_band)}`}>{flight.score_band || "—"}</span>
                      )}
                    </td>
                    <td className="py-3 text-slate-500">{formatScore(flight.mom_delta)}</td>
                    <td className="py-3 text-slate-500">{flight.confidence || "—"}</td>
                  </tr>
                ))}
                {aggregate.flight_comparison.flights.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-slate-400">No flights met the aggregate comparison criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader title="Risk heatmap" subtitle="Real R1 (Ready) to R5 (High Priority) severity per driver, per flight" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr>
                  <th className="pb-2"></th>
                  {aggregate.risk_heatmap.flights.map((flight) => (
                    <th key={flight.flight_id} className="pb-2 text-center font-semibold text-slate-400" title={flight.flight_name}>
                      {flight.flight_name.slice(0, 3).toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(aggregate.risk_heatmap.flights[0]?.driver_bands ?? {}).map((driver) => (
                  <tr key={driver} className="border-t border-slate-100 dark:border-white/5">
                    <td className="py-2 pr-2 font-semibold text-slate-600 dark:text-slate-300">{driver.replace(" Readiness", "")}</td>
                    {aggregate.risk_heatmap.flights.map((flight) => {
                      const severity = flight.driver_severity[driver];
                      return (
                        <td key={flight.flight_id} className="py-2 text-center">
                          <span
                            className={`mx-auto block size-2.5 rounded-full ${severity ? RISK_SEVERITY_COLOR[severity] ?? "bg-slate-300" : "bg-slate-200 dark:bg-slate-800"}`}
                            title={
                              flight.suppressed
                                ? "Suppressed - below cohort minimum"
                                : severity
                                  ? `${severity} · ${flight.driver_bands[driver]}`
                                  : "No data"
                            }
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-[9px] text-slate-500 dark:border-white/5">
            <span className="font-bold uppercase tracking-wide text-slate-400">Legend:</span>
            {(["R1", "R2", "R3", "R4", "R5"] as const).map((code) => (
              <span key={code} className="flex items-center gap-1">
                <span className={`size-2 rounded-full ${RISK_SEVERITY_COLOR[code]}`} />
                {code}
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-slate-200 dark:bg-slate-800" />
              No data / suppressed
            </span>
          </div>
        </Card>
      </div>

      <p className="text-[10px] font-mono text-slate-400">
        Leadership · Aggregate · k &ge; {aggregate.min_cohort_size} · CUI
      </p>

      <Card>
        <CardHeader title="Recovery program summary" subtitle={`${aggregate.recovery_program_summary.total_active_plans} active plans across live flights`} />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SimpleKeyValueList
              rows={[
                { label: "Flights with active recovery", value: String(aggregate.recovery_program_summary.flights_with_active_recovery) },
                { label: "On-track flights", value: String(aggregate.recovery_program_summary.on_track_flight_count) },
                { label: "Flights meeting cohort minimum", value: String(aggregate.recovery_program_summary.flights_meeting_cohort_minimum) },
                { label: "OFT due soon", value: String(aggregate.oft_due_soon_count ?? 0) },
              ]}
            />
          </div>
          <div className="space-y-3 text-xs lg:col-span-7">
            {aggregate.recovery_program_summary.flights.map((flight) => (
              <div key={flight.flight_id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                <p className="font-semibold text-slate-900 dark:text-white">{flight.flight_name}</p>
                <p className="mt-1 text-[10px] text-slate-500">{flight.active_plan_count} active plans · {flight.overdue_review_count} overdue reviews</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

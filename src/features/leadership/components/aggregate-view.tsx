"use client";

import React from "react";
import Link from "next/link";
import { useLeadership } from "../context/leadership-context";

function formatScore(value: number | null | undefined) {
  if (typeof value !== "number") return "—";
  return value.toFixed(1);
}

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

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <MetricCard title="Hero cohort" value={aggregate.hero.cohort_size.toString()} subtext={aggregate.hero.score_band || "No band"} />
        <MetricCard title="Average OPS" value={formatScore(aggregate.hero.average_ops_score)} subtext={`Target ${formatScore(aggregate.hero.approximate_target_score)}`} accent="text-emerald-500" />
        <MetricCard title="MoM delta" value={formatScore(aggregate.hero.mom_delta)} subtext="Month-over-month" />
        <MetricCard title="PvP delta" value={formatScore(aggregate.hero.pvp_delta)} subtext="Period-over-period" />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader title="Driver trends" subtitle="Aggregate component averages and current bands" />
          <SimpleKeyValueList rows={aggregate.driver_trends.map((item) => ({ label: item.component, value: `${formatScore(item.average_score)} · ${item.score_band || "—"}` }))} />
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader title="Flight comparison" subtitle={`${aggregate.flight_comparison.flights_meeting_cohort_minimum} of ${aggregate.flight_comparison.total_flights} flights meet the cohort minimum`} />
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                  <th className="pb-3 font-semibold">Flight</th>
                  <th className="pb-3 font-semibold">Cohort</th>
                  <th className="pb-3 font-semibold">OPS</th>
                  <th className="pb-3 font-semibold">Band</th>
                  <th className="pb-3 font-semibold">MoM</th>
                  <th className="pb-3 font-semibold">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {aggregate.flight_comparison.flights.map((flight) => (
                  <tr key={flight.flight_id}>
                    <td className="py-3 font-semibold text-slate-800 dark:text-white">{flight.flight_name}</td>
                    <td className="py-3 text-slate-500">{flight.cohort_size}</td>
                    <td className="py-3 font-mono text-slate-500">{formatScore(flight.average_ops_score)}</td>
                    <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(flight.score_band)}`}>{flight.score_band || "—"}</span></td>
                    <td className="py-3 text-slate-500">{formatScore(flight.mom_delta)}</td>
                    <td className="py-3 text-slate-500">{flight.confidence || "—"}</td>
                  </tr>
                ))}
                {aggregate.flight_comparison.flights.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-slate-400">No flights met the aggregate comparison criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader title="Risk heatmap" subtitle="Driver severity and band values returned by the backend" />
          <div className="space-y-4">
            {aggregate.risk_heatmap.flights.map((flight) => (
              <div key={flight.flight_id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{flight.flight_name}</p>
                  <span className="text-[10px] text-slate-400">{flight.suppressed ? "Suppressed" : `k=${flight.cohort_size}`}</span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {Object.keys(flight.driver_bands).map((driver) => (
                    <div key={driver} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-white/5 dark:bg-[#0e1628]">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{driver}</span>
                      <span className="text-[10px] text-slate-500">{flight.driver_bands[driver] || "—"} · {flight.driver_severity[driver] || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader title="Recovery program summary" subtitle={`${aggregate.recovery_program_summary.total_active_plans} active plans across live flights`} />
          <SimpleKeyValueList
            rows={[
              { label: "Flights with active recovery", value: String(aggregate.recovery_program_summary.flights_with_active_recovery) },
              { label: "On-track flights", value: String(aggregate.recovery_program_summary.on_track_flight_count) },
              { label: "Flights meeting cohort minimum", value: String(aggregate.recovery_program_summary.flights_meeting_cohort_minimum) },
              { label: "OFT due soon", value: String(aggregate.oft_due_soon_count ?? 0) },
            ]}
          />
          <div className="mt-4 space-y-3 text-xs">
            {aggregate.recovery_program_summary.flights.map((flight) => (
              <div key={flight.flight_id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                <p className="font-semibold text-slate-900 dark:text-white">{flight.flight_name}</p>
                <p className="mt-1 text-[10px] text-slate-500">{flight.active_plan_count} active plans · {flight.overdue_review_count} overdue reviews</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

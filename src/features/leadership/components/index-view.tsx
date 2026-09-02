"use client";

import React from "react";
import Link from "next/link";
import { useLeadership } from "../context/leadership-context";
import { Activity } from "lucide-react";

function formatScore(value: number | null | undefined) {
  if (typeof value !== "number") return "—";
  return value.toFixed(1);
}

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: withTime ? "2-digit" : undefined,
    minute: withTime ? "2-digit" : undefined,
  });
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace(/_/g, " ");
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

export function IndexView() {
  const { loading, error, dashboard } = useLeadership();

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/5 dark:bg-[#0e1628]">Loading live leadership data...</div>;
  }

  if (error || !dashboard) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-300">{error || "No dashboard data"}</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#0e1628]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leadership · Index</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Command overview</h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Landing metrics, aggregate readiness, support routing, and recent exports from the live leadership API.</p>
          </div>
          <Link
            href="/dashboard/leadership/aggregate"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <Activity className="size-4" />
            Open aggregate
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <MetricCard title="Enrolled operators" value={dashboard.enrolled_operator_count.toString()} subtext="Live cohort count" />
        <MetricCard title="Average OPS" value={formatScore(dashboard.average_ops_score)} subtext="Aggregate only" accent="text-emerald-500" />
        <MetricCard title="Support requests" value={Object.values(dashboard.support_requests_by_pathway).reduce((sum, count) => sum + count, 0).toString()} subtext="Across all pathways" />
        <MetricCard title="Utilization 90d" value={dashboard.utilization_event_count_90d.toString()} subtext="Real event count" />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader title="Band distribution" subtitle="Current aggregate readiness bands" />
          <div className="grid grid-cols-2 gap-3 text-xs">
            {Object.entries(dashboard.band_distribution).map(([band, count]) => (
              <div key={band} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{band}</p>
                <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{count}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader title="Component averages" subtitle="Live backend aggregate component scores" />
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                  <th className="pb-3 font-semibold">Component</th>
                  <th className="pb-3 font-semibold text-right">Average score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {Object.entries(dashboard.component_averages).map(([component, value]) => (
                  <tr key={component}>
                    <td className="py-3 font-semibold text-slate-800 dark:text-white">{component}</td>
                    <td className="py-3 text-right font-mono text-slate-500">{formatScore(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-6">
          <CardHeader title="OFT status counts" subtitle="Current, exempt, scheduled, and not current" />
          <SimpleKeyValueList rows={Object.entries(dashboard.oft_status_counts).map(([key, value]) => ({ label: formatLabel(key), value: String(value) }))} />
        </Card>
        <Card className="lg:col-span-6">
          <CardHeader title="Recent report exports" subtitle="Latest leadership-visible exports" />
          <div className="space-y-3 text-xs">
            {dashboard.recent_report_exports.map((item, index) => (
              <div key={`${item.report_type}-${item.created_at}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                <p className="font-semibold text-slate-900 dark:text-white">{formatLabel(item.report_type)}</p>
                <p className="mt-1 text-[10px] text-slate-500">{item.date_range || "current"} · {formatDate(item.created_at, true)}</p>
              </div>
            ))}
            {dashboard.recent_report_exports.length === 0 && (
              <div className="py-6 text-center text-slate-400">No leadership exports have been generated yet.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

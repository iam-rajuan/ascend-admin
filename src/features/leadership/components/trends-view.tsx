"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useLeadership } from "../context/leadership-context";
import { getApiErrorMessage } from "@/lib/staff-api";
import { createLeadershipAnnotation, deleteLeadershipAnnotation, type LeadershipPeriod } from "@/lib/role-dashboards-api";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { Plus, XCircle } from "lucide-react";

const PERIOD_OPTIONS: LeadershipPeriod[] = ["7d", "30d", "3mo", "6mo", "12mo"];

function formatScore(value: number | null | undefined) {
  if (typeof value !== "number") return "—";
  return value.toFixed(1);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatMonth(value: string | null | undefined) {
  if (!value) return "—";
  const [year, month] = value.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
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

function CompositeTrendChart({
  months,
  annotationMonths,
}: {
  months: Array<{ month: string; average_ops_score: number | null }>;
  annotationMonths: Set<string>;
}) {
  const points = months.filter((m) => typeof m.average_ops_score === "number");
  if (points.length < 2) {
    return (
      <div className="flex h-[160px] items-center justify-center text-[10px] text-slate-400">
        Not enough scored months yet for a trend line - {points.length} recorded so far.
      </div>
    );
  }
  const scores = points.map((p) => p.average_ops_score as number);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 100);
  const w = 760;
  const h = 160;
  const coords = points.map((p, i) => {
    const x = points.length > 1 ? (i / (points.length - 1)) * w : 0;
    const y = h - (((p.average_ops_score as number) - min) / (max - min || 1)) * h;
    return [x, y] as const;
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h + 22}`} className="w-full" preserveAspectRatio="none">
      <path d={area} fill="var(--brand-color)" opacity="0.08" />
      {points.map((p, i) =>
        annotationMonths.has(p.month) ? (
          <line key={`ann-${p.month}`} x1={coords[i][0]} x2={coords[i][0]} y1={0} y2={h} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,3" />
        ) : null
      )}
      <path d={path} fill="none" stroke="var(--brand-color)" strokeWidth="2.5" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === coords.length - 1 ? 4.5 : 2.5} fill={annotationMonths.has(points[i].month) ? "#f59e0b" : "var(--brand-color)"} />
      ))}
      {points.map((p, i) => (
        <text key={p.month} x={coords[i][0]} y={h + 18} fontSize="11" textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} className="fill-slate-400">
          {formatMonth(p.month)}
        </text>
      ))}
    </svg>
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

export function TrendsView() {
  const { loading, error, period, setPeriod, trends, refreshData, isMutating, setIsMutating, triggerToast } = useLeadership();
  const accessToken = useAuthStore((state) => state.accessToken);

  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [annotationTitle, setAnnotationTitle] = useState("");
  const [annotationNarrative, setAnnotationNarrative] = useState("");
  const [annotationDate, setAnnotationDate] = useState(new Date().toISOString().slice(0, 10));
  const [compareMode, setCompareMode] = useState<"mom" | "pvp">("mom");

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/5 dark:bg-[#0e1628]">Loading live trends data...</div>;
  }

  if (error || !trends) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-300">{error || "No trends data"}</div>;
  }

  const scoredMonths = trends.trend.months.filter((m) => typeof m.average_ops_score === "number");
  const latestMonth = scoredMonths[scoredMonths.length - 1] ?? null;
  const earliestMonth = scoredMonths[0] ?? null;
  const scores = scoredMonths.map((m) => m.average_ops_score as number);
  const highScore = scores.length ? Math.max(...scores) : null;
  const lowScore = scores.length ? Math.min(...scores) : null;
  const activeDelta = compareMode === "mom" ? trends.trend.mom_delta : trends.trend.pvp_delta;
  const annotationMonths = new Set(trends.annotations.map((a) => a.event_date.slice(0, 7)));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leadership · Trends</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Aggregate trends</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Trend period {period} from the live backend. Annotations are cohort-level only.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setPeriod(option)}
                className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide cursor-pointer ${
                  option === period
                    ? "border-transparent bg-[var(--brand-color)] text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0e1628] dark:hover:bg-slate-800"
                }`}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-[#0e1628]">
            {(["mom", "pvp"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setCompareMode(mode)}
                className={`rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-wide cursor-pointer ${
                  compareMode === mode
                    ? "bg-[var(--brand-color)] text-white"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
                type="button"
              >
                {mode === "mom" ? "MoM" : "PvP"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAnnotationModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
            type="button"
          >
            <Plus className="size-4" /> Add annotation
          </button>
        </div>
      </div>

      <Card>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Composite OPS · {period.toUpperCase()}
        </p>
        <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Composite OPS trend</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Period: {period} · comparison: {compareMode === "mom" ? "month over month" : "period vs. period"} · cohort k = {latestMonth?.cohort_size ?? trends.trend.min_cohort_size} · Scope: Organization
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{formatScore(latestMonth?.average_ops_score)}</span>
              {typeof activeDelta === "number" && (
                <span className={`text-sm font-bold ${activeDelta >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {activeDelta >= 0 ? "+" : ""}
                  {activeDelta.toFixed(1)}
                </span>
              )}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-[10px]">
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-400">{formatMonth(earliestMonth?.month)}</p>
                <p className="mt-0.5 font-mono font-bold text-slate-700 dark:text-slate-200">{formatScore(earliestMonth?.average_ops_score)}</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-400">{formatMonth(latestMonth?.month)}</p>
                <p className="mt-0.5 font-mono font-bold text-slate-700 dark:text-slate-200">{formatScore(latestMonth?.average_ops_score)}</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-400">{period.toUpperCase()} High</p>
                <p className="mt-0.5 font-mono font-bold text-slate-700 dark:text-slate-200">{formatScore(highScore)}</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-400">{period.toUpperCase()} Low</p>
                <p className="mt-0.5 font-mono font-bold text-slate-700 dark:text-slate-200">{formatScore(lowScore)}</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-8">
            <CompositeTrendChart months={trends.trend.months} annotationMonths={annotationMonths} />
            {annotationMonths.size > 0 && (
              <p className="mt-1 text-[10px] text-amber-500">- - - marks a month with a leadership annotation</p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader title="Trend periods" subtitle="Average OPS and cohort size by returned period rows" />
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                  <th className="pb-3 font-semibold">Period</th>
                  <th className="pb-3 font-semibold">Cohort</th>
                  <th className="pb-3 font-semibold">Average OPS</th>
                  <th className="pb-3 font-semibold">Physical</th>
                  <th className="pb-3 font-semibold">Sleep</th>
                  <th className="pb-3 font-semibold">Mental</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {trends.trend.months.map((month) => (
                  <tr key={month.month}>
                    <td className="py-3 font-semibold text-slate-800 dark:text-white">{formatMonth(month.month)}</td>
                    <td className="py-3 text-slate-500">{month.cohort_size}</td>
                    <td className="py-3 font-mono text-slate-500">{formatScore(month.average_ops_score)}</td>
                    <td className="py-3 text-slate-500">{formatScore(month.component_averages["Physical Readiness"])}</td>
                    <td className="py-3 text-slate-500">{formatScore(month.component_averages["Sleep Readiness"])}</td>
                    <td className="py-3 text-slate-500">{formatScore(month.component_averages["Mental Readiness"])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader title="Current distribution" subtitle={`MoM ${formatScore(trends.trend.mom_delta)} · PvP ${formatScore(trends.trend.pvp_delta)}`} />
          <SimpleKeyValueList rows={trends.band_distribution.current_distribution.map((row) => ({ label: row.band, value: typeof row.delta === "number" ? `${row.count} (${row.delta >= 0 ? "+" : ""}${row.delta})` : `${row.count}` }))} />
        </Card>
      </div>

      <Card>
        <CardHeader title="Annotations" subtitle="Leadership-created aggregate context markers" />
        <div className="space-y-4">
          {trends.annotations.map((annotation) => (
            <div key={annotation.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{annotation.title}</p>
                <p className="mt-1 text-xs text-slate-500">{annotation.narrative}</p>
                <p className="mt-2 text-[10px] text-slate-400">{formatDate(annotation.event_date)} · {annotation.created_by_name || "Unknown author"}</p>
              </div>
              <button
                onClick={async () => {
                  if (!accessToken) return;
                  setIsMutating(true);
                  try {
                    await deleteLeadershipAnnotation(accessToken, annotation.id);
                    await refreshData("Annotation removed from live trends.");
                  } catch (nextError) {
                    triggerToast(getApiErrorMessage(nextError));
                  } finally {
                    setIsMutating(false);
                  }
                }}
                disabled={isMutating}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold text-rose-600 disabled:opacity-50 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-300 cursor-pointer"
                type="button"
              >
                <XCircle className="size-3.5" />
                Delete
              </button>
            </div>
          ))}
          {trends.annotations.length === 0 && (
            <div className="py-6 text-center text-slate-400">No aggregate annotations are stored yet.</div>
          )}
        </div>
      </Card>

      {/* ANNOTATION MODAL */}
      {showAnnotationModal && (
        <AccessibleDialog open={showAnnotationModal} onClose={() => setShowAnnotationModal(false)} titleId="add-annotation-title">
          <div className="space-y-4">
            <h3 id="add-annotation-title" className="text-base font-bold text-slate-900 dark:text-white">Add leadership annotation</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Title</label>
                <input
                  type="text"
                  value={annotationTitle}
                  onChange={(e) => setAnnotationTitle(e.target.value)}
                  placeholder="e.g. Exercise Ramp-up Phase"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</label>
                <input
                  type="date"
                  value={annotationDate}
                  onChange={(e) => setAnnotationDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Narrative</label>
                <textarea
                  rows={3}
                  value={annotationNarrative}
                  onChange={(e) => setAnnotationNarrative(e.target.value)}
                  placeholder="Context explanation..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAnnotationModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-slate-800 cursor-pointer" type="button">Cancel</button>
              <button
                onClick={async () => {
                  if (!accessToken || !annotationTitle.trim()) return;
                  setIsMutating(true);
                  try {
                    await createLeadershipAnnotation(accessToken, { title: annotationTitle.trim(), event_date: annotationDate, narrative: annotationNarrative.trim() || "" });
                    setShowAnnotationModal(false);
                    setAnnotationTitle("");
                    setAnnotationNarrative("");
                    await refreshData("Annotation created on live trends.");
                  } catch (err) {
                    triggerToast(getApiErrorMessage(err));
                  } finally {
                    setIsMutating(false);
                  }
                }}
                disabled={isMutating || !annotationTitle.trim()}
                className="flex-1 rounded-xl bg-[var(--brand-color)] py-2 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
                type="button"
              >
                Save annotation
              </button>
            </div>
          </div>
        </AccessibleDialog>
      )}
    </div>
  );
}

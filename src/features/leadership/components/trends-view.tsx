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
  const { loading, error, period, setPeriod, trends, refreshData, isMutating, setIsMutating } = useLeadership();
  const accessToken = useAuthStore((state) => state.accessToken);

  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [annotationTitle, setAnnotationTitle] = useState("");
  const [annotationNarrative, setAnnotationNarrative] = useState("");
  const [annotationDate, setAnnotationDate] = useState(new Date().toISOString().slice(0, 10));

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/5 dark:bg-[#0e1628]">Loading live trends data...</div>;
  }

  if (error || !trends) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-300">{error || "No trends data"}</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leadership · Trends</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Aggregate trends</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Trend period {period} from the live backend. Annotations are cohort-level only.</p>
        </div>
        <button
          onClick={() => setShowAnnotationModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
          type="button"
        >
          <Plus className="size-4" /> Add annotation
        </button>
      </div>

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
          <SimpleKeyValueList rows={trends.band_distribution.current_distribution.map((row) => ({ label: row.band, value: `${row.count} (${row.delta >= 0 ? "+" : ""}${row.delta})` }))} />
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
                    // handled
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
                    // handled
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

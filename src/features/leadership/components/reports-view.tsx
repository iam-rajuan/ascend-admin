"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useLeadership } from "../context/leadership-context";
import { useLeadershipReportTemplate } from "@/lib/role-dashboards-api";
import { getApiErrorMessage } from "@/lib/staff-api";

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

export function ReportsView() {
  const { loading, error, reports, reportTemplates, refreshData, isMutating, setIsMutating } = useLeadership();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [reportsFilter, setReportsFilter] = useState("All");

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/5 dark:bg-[#0e1628]">Loading live reports library...</div>;
  }

  if (error || !reports) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-300">{error || "No reports data"}</div>;
  }

  const filteredReports = (reports.recent_reports || []).filter((item: { export_format: string }) => {
    if (reportsFilter === "All") return true;
    return item.export_format.toLowerCase() === reportsFilter.toLowerCase();
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leadership · Reports</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Reports library</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Recent aggregate exports, recurring schedules, and template-backed schedule creation from the live backend.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["All", "CSV", "PDF"].map((filter) => (
          <button
            key={filter}
            onClick={() => setReportsFilter(filter)}
            className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide cursor-pointer ${
              reportsFilter === filter
                ? "border-transparent bg-[var(--brand-color)] text-white"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0e1628] dark:hover:bg-slate-800"
            }`}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader title="Recent reports" subtitle={`${filteredReports.length} live exports in the current filter`} />
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                  <th className="pb-3 font-semibold">Title</th>
                  <th className="pb-3 font-semibold">Format</th>
                  <th className="pb-3 font-semibold">Sensitivity</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredReports.map((report: { id: string; title: string | null; report_type: string; export_format: string; sensitivity_level: string; export_log_status: string; created_at: string }) => (
                  <tr key={report.id}>
                    <td className="py-3 font-semibold text-slate-800 dark:text-white">{report.title || formatLabel(report.report_type)}</td>
                    <td className="py-3 text-slate-500">{report.export_format.toUpperCase()}</td>
                    <td className="py-3 text-slate-500">{report.sensitivity_level}</td>
                    <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(report.export_log_status)}`}>{report.export_log_status}</span></td>
                    <td className="py-3 text-slate-500">{formatDate(report.created_at, true)}</td>
                  </tr>
                ))}
                {filteredReports.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-400">No reports match this live filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader title="Report templates" subtitle="Using a template creates a real recurring schedule" />
          <div className="space-y-3">
            {reportTemplates.map((template) => (
              <div key={template.key} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{template.title}</p>
                    <p className="mt-1 text-[10px] text-slate-500">{template.report_type} · {template.cadence} · {template.export_format.toUpperCase()}</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!accessToken) return;
                      setIsMutating(true);
                      try {
                        await useLeadershipReportTemplate(accessToken, template.key);
                        await refreshData(`${template.title} template created a live schedule.`);
                      } catch (nextError) {
                        // handled
                      } finally {
                        setIsMutating(false);
                      }
                    }}
                    disabled={isMutating}
                    className="rounded-lg bg-[var(--brand-color)] px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50 cursor-pointer"
                    type="button"
                  >
                    Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recurring schedules" subtitle={`${reports.schedules.length} live schedules returned for leadership`} />
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">Report type</th>
                <th className="pb-3 font-semibold">Cadence</th>
                <th className="pb-3 font-semibold">Recipient role</th>
                <th className="pb-3 font-semibold">Next run</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {reports.schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td className="py-3 font-semibold text-slate-800 dark:text-white">{schedule.name}</td>
                  <td className="py-3 text-slate-500">{schedule.report_type}</td>
                  <td className="py-3 text-slate-500">{schedule.cadence}</td>
                  <td className="py-3 text-slate-500">{schedule.recipient_role}</td>
                  <td className="py-3 text-slate-500">{formatDate(schedule.next_run_at, true)}</td>
                  <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(schedule.status)}`}>{schedule.status}</span></td>
                </tr>
              ))}
              {reports.schedules.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-slate-400">No leadership schedules are configured yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

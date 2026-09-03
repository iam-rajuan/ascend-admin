"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/staff-api";
import {
  getSpecialistDashboard,
  getMentalDriverScores,
  listUploadedRecords,
  getMessageThreads,
  type SpecialistDashboardData,
  type MentalDriverScoresResponse,
  type RecordUploadsResponse,
  type MessageThreadsResponse,
} from "@/lib/role-dashboards-api";

export type TabType = "dashboard" | "notes" | "records" | "messages";

// Real per-operator row shape from provider_dashboard_service._build_specialist_row.
type SpecialistOperatorRow = {
  user_id: string;
  user_name: string | null;
  relevant_component_score: number | null;
  assigned_action_title: string | null;
  latest_request_status: string | null;
};

// Real support-request row shape from get_specialist_dashboard's recent_requests.
type SupportRequestRow = {
  id: string;
  user_id: string;
  status: string;
  message: string;
  created_at: string;
};

// Real specialist-note row shape from SpecialistNoteService._serialize.
type SpecialistNoteRow = {
  id: string;
  user_id: string;
  specialist_name: string | null;
  note_date: string;
  note_type: string;
  escalated: boolean;
  user_concern: string;
  action_assigned: string | null;
  follow_up_needed: boolean;
  status: string;
  documentation_status: string;
  is_redacted: boolean;
  created_at: string;
};

// Real thread preview shape from messaging_service.list_threads.
type ThreadPreview = {
  thread_key: string;
  other_user_id: string;
  other_user_name: string | null;
  other_user_role: string;
  last_message_body: string;
  last_message_at: string;
  unread_count: number;
};

function formatNumber(value: unknown, fallback = "—") {
  return typeof value === "number" ? value.toLocaleString("en-US") : fallback;
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

function statusTone(status: string | null | undefined) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized.includes("signed") || normalized.includes("closed") || normalized.includes("completed")) {
    return "bg-emerald-500/10 text-emerald-500";
  }
  if (normalized.includes("open") || normalized.includes("draft") || normalized.includes("pending")) {
    return "bg-amber-500/10 text-amber-500";
  }
  return "bg-sky-500/10 text-sky-500";
}

function MetricCard({ title, value, subtext, accent }: { title: string; value: string; subtext: string; accent?: string }) {
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
      <h3 className="text-sm font-bold text-slate-800 dark:text-white">{title}</h3>
      {subtitle && <p className="mt-0.5 text-[10px] text-slate-400">{subtitle}</p>}
    </div>
  );
}

export function MpView({ activeTab = "dashboard" }: { activeTab?: TabType }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dashboard, setDashboard] = useState<SpecialistDashboardData | null>(null);
  const [drivers, setDrivers] = useState<MentalDriverScoresResponse | null>(null);
  const [records, setRecords] = useState<RecordUploadsResponse | null>(null);
  const [threads, setThreads] = useState<MessageThreadsResponse | null>(null);

  const refreshAll = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const [dash, driverScores, recs, th] = await Promise.all([
        getSpecialistDashboard(accessToken),
        getMentalDriverScores(accessToken),
        listUploadedRecords(accessToken),
        getMessageThreads(accessToken),
      ]);
      setDashboard(dash);
      setDrivers(driverScores);
      setRecords(recs);
      setThreads(th);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHydrated && isAuthenticated && accessToken) {
      void refreshAll();
    }
  }, [accessToken, isAuthenticated, isHydrated]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-32 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#0e1628]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-950/20">
        {error}
      </div>
    );
  }

  const operators = (dashboard?.operators as SpecialistOperatorRow[] | undefined) ?? [];
  const notes = (dashboard?.notes as SpecialistNoteRow[] | undefined) ?? [];
  const recentRequests = (dashboard?.recent_requests as SupportRequestRow[] | undefined) ?? [];
  const operatorNameById = new Map(operators.map((o) => [o.user_id, o.user_name]));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mental Performance</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Mental Performance Operations</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Clinical notes, behavioral health tracking, and confidential messaging.</p>
        </div>
        <button
          onClick={() => void refreshAll()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
          type="button"
        >
          Refresh
        </button>
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Assigned Count" value={formatNumber(dashboard?.assigned_count)} subtext="Currently assigned operators." />
            <MetricCard title="Open Support Requests" value={formatNumber(dashboard?.open_request_count)} subtext="Requests awaiting response." accent="text-amber-500" />
            <MetricCard title="Specialist Notes" value={formatNumber(notes.length)} subtext="Notes recorded for this caseload." />
            <MetricCard title="Message Threads" value={formatNumber(threads?.threads?.length)} subtext="Confidential message threads." accent="text-cyan-500" />
          </div>

          <Card>
            <CardHeader
              title="Mental Readiness Cohort Drivers"
              subtitle={
                drivers
                  ? `Cohort of ${drivers.cohort_size} over the last ${drivers.window_days} days · k-anonymity minimum ${drivers.cohort_k}`
                  : "Cohort-aggregate sub-driver scores."
              }
            />
            {drivers?.suppressed || !drivers?.drivers ? (
              <p className="text-xs text-slate-400">
                Suppressed - cohort size ({drivers?.cohort_size ?? 0}) is below the k-anonymity minimum ({drivers?.cohort_k ?? "—"}).
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {Object.entries(drivers.drivers).map(([driver, score]) => (
                  <div key={driver} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{driver}</p>
                    <p className="mt-1 text-xl font-extrabold text-slate-800 dark:text-white">{score === null ? "—" : score.toFixed(1)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Assigned Operators" subtitle={`${operators.length} operators on this caseload`} />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Operator</th>
                    <th className="pb-3 font-semibold">Mental readiness score</th>
                    <th className="pb-3 font-semibold">Assigned action</th>
                    <th className="pb-3 font-semibold">Latest request status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {operators.map((operator) => (
                    <tr key={operator.user_id}>
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{operator.user_name ?? "—"}</td>
                      <td className="py-3 text-slate-500">{formatNumber(operator.relevant_component_score)}</td>
                      <td className="py-3 text-slate-500">{operator.assigned_action_title ?? "—"}</td>
                      <td className="py-3">
                        {operator.latest_request_status ? (
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(operator.latest_request_status)}`}>
                            {formatLabel(operator.latest_request_status)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                  {operators.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-400">No assigned operators.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Recent Support Requests" subtitle="Most recent Mental Performance pathway requests." />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Operator</th>
                    <th className="pb-3 font-semibold">Message</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {recentRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{operatorNameById.get(request.user_id) ?? "—"}</td>
                      <td className="py-3 text-slate-500">{request.message}</td>
                      <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(request.status)}`}>{formatLabel(request.status)}</span></td>
                      <td className="py-3 text-slate-500">{formatDate(request.created_at, true)}</td>
                    </tr>
                  ))}
                  {recentRequests.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-400">No recent support requests.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Clinical Progress Notes" subtitle="Real specialist notes across this caseload - redacted for anyone but the authoring specialist." />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Operator</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Concern</th>
                    <th className="pb-3 font-semibold">Action assigned</th>
                    <th className="pb-3 font-semibold">Escalated</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Documentation</th>
                    <th className="pb-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {notes.map((note) => (
                    <tr key={note.id}>
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{operatorNameById.get(note.user_id) ?? "—"}</td>
                      <td className="py-3 text-slate-500">{formatLabel(note.note_type)}</td>
                      <td className="py-3 text-slate-500">{note.user_concern}</td>
                      <td className="py-3 text-slate-500">{note.action_assigned ?? "—"}</td>
                      <td className="py-3">
                        {note.escalated ? (
                          <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-500">Escalated</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(note.status)}`}>{formatLabel(note.status)}</span></td>
                      <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(note.documentation_status)}`}>{formatLabel(note.documentation_status)}</span></td>
                      <td className="py-3 text-slate-500">{formatDate(note.note_date)}</td>
                    </tr>
                  ))}
                  {notes.length === 0 && (
                    <tr><td colSpan={8} className="py-6 text-center text-slate-400">No specialist notes recorded for this caseload.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "records" && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Your Uploaded Documents"
              subtitle="Mental Performance does not have raw medical-record access (DOCX Section 8.8) - this is your own uploads only, not a caseload record queue."
            />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Document type</th>
                    <th className="pb-3 font-semibold">File name</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {records?.records.map((record) => {
                    const r = record as { id: string; document_type: string; file_name: string; status: string; uploaded_at: string };
                    return (
                      <tr key={r.id}>
                        <td className="py-3 font-semibold text-slate-800 dark:text-white">{formatLabel(r.document_type)}</td>
                        <td className="py-3 text-slate-500">{r.file_name}</td>
                        <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(r.status)}`}>{formatLabel(r.status)}</span></td>
                        <td className="py-3 text-slate-500">{formatDate(r.uploaded_at)}</td>
                      </tr>
                    );
                  })}
                  {(!records || records.records.length === 0) && (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-400">No documents uploaded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "messages" && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Confidential Messaging" subtitle="Encrypted communication threads." />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Operator</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Last message</th>
                    <th className="pb-3 font-semibold">Unread</th>
                    <th className="pb-3 font-semibold">Last activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {(threads?.threads as ThreadPreview[] | undefined)?.map((thread) => (
                    <tr key={thread.thread_key}>
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{thread.other_user_name ?? "—"}</td>
                      <td className="py-3 text-slate-500">{thread.other_user_role}</td>
                      <td className="py-3 text-slate-500">{thread.last_message_body}</td>
                      <td className="py-3">
                        {thread.unread_count > 0 ? (
                          <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-cyan-500/10 text-cyan-500">{thread.unread_count}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 text-slate-500">{formatDate(thread.last_message_at, true)}</td>
                    </tr>
                  ))}
                  {(!threads?.threads || threads.threads.length === 0) && (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-400">No message threads.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/staff-api";
import {
  getSpecialistDashboard,
  getMentalDriverScores,
  listUploadedRecords,
  getMessageThreads,
  getMpCaseload,
  getMpDashboardSummary,
  type SpecialistDashboardData,
  type MentalDriverScoresResponse,
  type RecordUploadsResponse,
  type MessageThreadsResponse,
  type MpCaseloadRow,
  type MpDashboardSummary,
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

const MP_QUEUE_FILTERS = [
  ["all", "All"],
  ["active", "Active"],
  ["scheduled", "Scheduled"],
  ["follow_up", "Follow-up"],
  ["new", "New"],
] as const;

export function MpView({ activeTab = "dashboard" }: { activeTab?: TabType }) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dashboard, setDashboard] = useState<SpecialistDashboardData | null>(null);
  const [drivers, setDrivers] = useState<MentalDriverScoresResponse | null>(null);
  const [records, setRecords] = useState<RecordUploadsResponse | null>(null);
  const [threads, setThreads] = useState<MessageThreadsResponse | null>(null);
  const [mpSummary, setMpSummary] = useState<MpDashboardSummary | null>(null);
  const [mpCaseload, setMpCaseload] = useState<MpCaseloadRow[]>([]);
  const [queueFilter, setQueueFilter] = useState<(typeof MP_QUEUE_FILTERS)[number][0]>("all");

  const refreshAll = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const [dash, driverScores, recs, th, mpSum, mpCase] = await Promise.all([
        getSpecialistDashboard(accessToken),
        getMentalDriverScores(accessToken),
        listUploadedRecords(accessToken),
        getMessageThreads(accessToken),
        getMpDashboardSummary(accessToken),
        getMpCaseload(accessToken),
      ]);
      setDashboard(dash);
      setDrivers(driverScores);
      setRecords(recs);
      setThreads(th);
      setMpSummary(mpSum);
      setMpCaseload(mpCase.caseload);
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
  const codeByUserId = new Map(mpCaseload.map((row) => [row.user_id, row.airman_code]));
  const codeFor = (userId: string) => codeByUserId.get(userId) ?? "A-????";
  const filteredQueue = queueFilter === "all" ? mpCaseload : mpCaseload.filter((row) => row.queue_status === queueFilter);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mental Performance · Today&apos;s Caseload</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Mental Performance caseload</h1>
          <p className="mt-1 max-w-3xl text-xs text-slate-500 dark:text-slate-400">
            {mpSummary?.active_caseload_count ?? 0} airmen on caseload · {mpSummary?.referrals_this_week_count ?? 0} new referrals this
            week · {mpSummary?.sessions_today_count ?? 0} sessions scheduled today. Calm, quiet, confidential.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/dashboard/mp/records")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
            type="button"
          >
            Records
          </button>
          <button
            onClick={() => router.push("/dashboard/mp/notes")}
            className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
            type="button"
          >
            + New session note
          </button>
          <button
            onClick={() => void refreshAll()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
            type="button"
          >
            Refresh
          </button>
        </div>
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-[10px] text-slate-500 dark:border-white/5 dark:bg-slate-900/40 dark:text-slate-400">
            Recommendations are issued as Mental-Performance Actions using only O7–O9, D3, W5–W6, M5–M6 - never medical
            controls, the unrestricted Performance Summary, or raw Level 4 metrics.
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Active Caseload"
              value={formatNumber(mpSummary?.active_caseload_count)}
              subtext={`${mpSummary?.individual_count ?? 0} individual · ${mpSummary?.group_count ?? 0} group`}
            />
            <MetricCard
              title="Referrals This Week"
              value={formatNumber(mpSummary?.referrals_this_week_count)}
              subtext={`${mpSummary?.self_referrals_this_week ?? 0} self · ${mpSummary?.scs_referrals_this_week ?? 0} SCS · ${mpSummary?.pt_im_referrals_this_week ?? 0} PT/IM`}
            />
            <MetricCard
              title="Sessions Today"
              value={formatNumber(mpSummary?.sessions_today_count)}
              subtext={
                mpSummary?.next_session_time
                  ? `next at ${mpSummary.next_session_time.slice(0, 2)}:${mpSummary.next_session_time.slice(2)} - ${mpSummary.next_session_airman_code ?? ""}`
                  : "None scheduled."
              }
              accent="text-cyan-500"
            />
            <MetricCard
              title="Follow-ups Due"
              value={formatNumber(mpSummary?.follow_ups_due_this_week_count)}
              subtext={`${mpSummary?.follow_ups_due_today_count ?? 0} due today · ${Math.max(0, (mpSummary?.follow_ups_due_this_week_count ?? 0) - (mpSummary?.follow_ups_due_today_count ?? 0))} this week`}
              accent="text-amber-500"
            />
          </div>

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Caseload queue</h3>
                <p className="mt-0.5 text-[10px] text-slate-400">Anonymized identifiers - case-level summary only.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {MP_QUEUE_FILTERS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setQueueFilter(value)}
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold cursor-pointer ${
                      queueFilter === value
                        ? "border-[var(--brand-color)] text-[var(--brand-color)]"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-slate-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Airman</th>
                    <th className="pb-3 font-semibold">Referral reason</th>
                    <th className="pb-3 font-semibold">Last session</th>
                    <th className="pb-3 font-semibold">Next session</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredQueue.map((row) => (
                    <tr key={row.user_id}>
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{row.airman_code}</td>
                      <td className="py-3 text-slate-500">{row.referral_reason ? formatLabel(row.referral_reason) : "—"}</td>
                      <td className="py-3 text-slate-500">{formatDate(row.last_session_date)}</td>
                      <td className="py-3 text-slate-500">{formatDate(row.next_session_date)}</td>
                      <td className="py-3">
                        <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                          {row.queue_status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredQueue.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-400">No cases match this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Mental driver scores</h3>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {drivers
                    ? `Cohort k≥${drivers.cohort_k} · last ${drivers.window_days} days`
                    : "Cohort-aggregate sub-driver scores."}
                </p>
              </div>
              <span className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Aggregate only
              </span>
            </div>
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
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{codeFor(operator.user_id)}</td>
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
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{codeFor(request.user_id)}</td>
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
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{codeFor(note.user_id)}</td>
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
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{codeFor(thread.other_user_id)}</td>
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

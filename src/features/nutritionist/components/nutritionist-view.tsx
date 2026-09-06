"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/staff-api";
import {
  getSpecialistDashboard,
  getMealConsistencyByFlight,
  listUploadedRecords,
  getMessageThreads,
  type SpecialistDashboardData,
  type MealConsistencyByFlightResponse,
  type RecordUploadsResponse,
  type MessageThreadsResponse,
} from "@/lib/role-dashboards-api";

export type TabType = "dashboard" | "consults" | "records" | "messages";

// Real per-operator row shape from provider_dashboard_service._build_specialist_row
// (nutrition_signals is Nutritionist-only, from _build_nutrition_signals).
type NutritionOperatorRow = {
  user_id: string;
  user_name: string | null;
  relevant_component_score: number | null;
  assigned_action_title: string | null;
  latest_request_status: string | null;
  nutrition_signals: {
    meal_consistency_trend: string | null;
    hydration_energy_trend: string | null;
    skipped_meals_or_low_hydration_flags_60d: number;
    checkins_logged_60d: number;
  } | null;
};

// Real support-request row shape from get_specialist_dashboard's recent_requests.
type SupportRequestRow = {
  id: string;
  user_id: string;
  status: string;
  message: string | null;
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
  if (normalized.includes("high") || normalized.includes("closed") || normalized.includes("improving")) {
    return "bg-emerald-500/10 text-emerald-500";
  }
  if (normalized.includes("mixed") || normalized.includes("open") || normalized.includes("pending")) {
    return "bg-amber-500/10 text-amber-500";
  }
  if (normalized.includes("lagging") || normalized.includes("declining")) {
    return "bg-rose-500/10 text-rose-500";
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

export function NutritionistView({ activeTab = "dashboard" }: { activeTab?: TabType }) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dashboard, setDashboard] = useState<SpecialistDashboardData | null>(null);
  const [mealConsistency, setMealConsistency] = useState<MealConsistencyByFlightResponse | null>(null);
  const [records, setRecords] = useState<RecordUploadsResponse | null>(null);
  const [threads, setThreads] = useState<MessageThreadsResponse | null>(null);

  const refreshAll = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const [dash, meals, recs, th] = await Promise.all([
        getSpecialistDashboard(accessToken),
        getMealConsistencyByFlight(accessToken),
        listUploadedRecords(accessToken),
        getMessageThreads(accessToken),
      ]);
      setDashboard(dash);
      setMealConsistency(meals);
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

  const operators = (dashboard?.operators as NutritionOperatorRow[] | undefined) ?? [];
  const recentRequests = (dashboard?.recent_requests as SupportRequestRow[] | undefined) ?? [];
  const operatorNameById = new Map(operators.map((o) => [o.user_id, o.user_name]));

  // Real "today" count derived from real request timestamps - not a
  // separate fabricated metric, just recentRequests filtered to today.
  const todayKey = new Date().toDateString();
  const consultsToday = recentRequests.filter((r) => new Date(r.created_at).toDateString() === todayKey).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nutrition · Today&apos;s Consult Queue</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Today&apos;s consult queue</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {consultsToday} consult{consultsToday === 1 ? "" : "s"} today · {formatNumber(dashboard?.assigned_count)} assigned operators · k≥5 cohort view.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void refreshAll()}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
            type="button"
          >
            Refresh
          </button>
          <button
            onClick={() => router.push("/dashboard/nutritionist/records")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
            type="button"
          >
            Open records
          </button>
          <button
            onClick={() => router.push("/dashboard/nutritionist/consults")}
            className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
            type="button"
          >
            Open consult queue
          </button>
        </div>
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Assigned Count" value={formatNumber(dashboard?.assigned_count)} subtext="Currently assigned operators." />
            <MetricCard title="Open Support Requests" value={formatNumber(dashboard?.open_request_count)} subtext="Requests awaiting response." accent="text-amber-500" />
            <MetricCard title="Low Consistency Operators" value={formatNumber(dashboard?.low_consistency_operator_count)} subtext="Skipped-meal or low-hydration flags in the last 60 days." accent="text-rose-500" />
            <MetricCard title="Message Threads" value={formatNumber(threads?.threads?.length)} subtext="Active message threads." />
          </div>

          <Card>
            <CardHeader
              title="Meal Consistency by Flight"
              subtitle={
                mealConsistency
                  ? `Last ${mealConsistency.window_days} days · ${mealConsistency.flights_meeting_cohort_minimum} of ${mealConsistency.total_flights} flights meet the k>=${mealConsistency.min_cohort_size} cohort minimum`
                  : "Real, k-gated per-flight rollup."
              }
            />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Flight</th>
                    <th className="pb-3 font-semibold">Cohort</th>
                    <th className="pb-3 font-semibold">Flagged members</th>
                    <th className="pb-3 font-semibold">Flagged rate</th>
                    <th className="pb-3 font-semibold">Consistency</th>
                    <th className="pb-3 font-semibold">Pending review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {mealConsistency?.flights.map((flight) => (
                    <tr key={flight.flight_id}>
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{flight.flight_name}</td>
                      <td className="py-3 text-slate-500">{flight.cohort_size}</td>
                      <td className="py-3 text-slate-500">{flight.flagged_members}</td>
                      <td className="py-3 text-slate-500">{flight.flagged_rate_pct.toFixed(1)}%</td>
                      <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(flight.consistency_level)}`}>{flight.consistency_level}</span></td>
                      <td className="py-3 text-slate-500">{flight.pending_review_count}</td>
                    </tr>
                  ))}
                  {(!mealConsistency || mealConsistency.flights.length === 0) && (
                    <tr><td colSpan={6} className="py-6 text-center text-slate-400">No flights meet the cohort minimum for this window.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Assigned Operators" subtitle={`${operators.length} operators on this caseload`} />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Operator</th>
                    <th className="pb-3 font-semibold">Nutritional readiness score</th>
                    <th className="pb-3 font-semibold">Meal consistency trend</th>
                    <th className="pb-3 font-semibold">Hydration/energy trend</th>
                    <th className="pb-3 font-semibold">Flags (60d)</th>
                    <th className="pb-3 font-semibold">Check-ins (60d)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {operators.map((operator) => (
                    <tr key={operator.user_id}>
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{operator.user_name ?? "—"}</td>
                      <td className="py-3 text-slate-500">{formatNumber(operator.relevant_component_score)}</td>
                      <td className="py-3">
                        {operator.nutrition_signals?.meal_consistency_trend ? (
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(operator.nutrition_signals.meal_consistency_trend)}`}>
                            {formatLabel(operator.nutrition_signals.meal_consistency_trend)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3">
                        {operator.nutrition_signals?.hydration_energy_trend ? (
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(operator.nutrition_signals.hydration_energy_trend)}`}>
                            {formatLabel(operator.nutrition_signals.hydration_energy_trend)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 text-slate-500">{operator.nutrition_signals?.skipped_meals_or_low_hydration_flags_60d ?? 0}</td>
                      <td className="py-3 text-slate-500">{operator.nutrition_signals?.checkins_logged_60d ?? 0}</td>
                    </tr>
                  ))}
                  {operators.length === 0 && (
                    <tr><td colSpan={6} className="py-6 text-center text-slate-400">No assigned operators.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "consults" && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Nutrition Consultation Requests" subtitle="Real Nutritionist pathway support requests." />
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
                      <td className="py-3 text-slate-500">{request.message ?? "—"}</td>
                      <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(request.status)}`}>{formatLabel(request.status)}</span></td>
                      <td className="py-3 text-slate-500">{formatDate(request.created_at, true)}</td>
                    </tr>
                  ))}
                  {recentRequests.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-400">No recent consultation requests.</td></tr>
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
              subtitle="Nutritionist does not have raw medical-record access (DOCX Section 8.8) - this is your own uploads only, not a caseload record queue."
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
            <CardHeader title="Direct Messages & Threads" subtitle="Communicate directly with operators." />
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

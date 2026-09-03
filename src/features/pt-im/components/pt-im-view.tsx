"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/staff-api";
import {
  getPtimDashboard,
  getInjuryReportByFlight,
  getInjuryReportQuarters,
  getInjuryTypeBreakdown,
  listIdmtHandoffs,
  type PtimDashboardData,
  type InjuryReportByFlightResponse,
  type InjuryReportQuartersResponse,
  type InjuryTypeBreakdownResponse,
  type IdmtHandoffsResponse,
} from "@/lib/role-dashboards-api";

export type TabType = "dashboard" | "injury" | "records" | "quarterly" | "scs" | "handoff";

// Real per-operator row shape from provider_dashboard_service._build_ptim_row.
type PtimOperatorRow = {
  user_id: string;
  user_name: string | null;
  reconditioning_phase: string | null;
  ptim_clearance_status: string | null;
  injury_flags: string[] | null;
  next_review_date: string | null;
  reported_limitation_recent: boolean;
  pending_medical_record_reviews: number;
  pending_records: Array<{
    id: string;
    document_type: string;
    file_name: string;
    status: string;
    access_reason: string;
    uploaded_at: string;
    reviewed_at: string | null;
  }>;
  scs_coordination_status: string | null;
  scs_coordination_label: string | null;
  severity_level: string | null;
  rehab_strategy_summary: string | null;
  sessions_completed: number | null;
  sessions_total: number | null;
};

type PtimFlightRow = {
  flight_id: string;
  flight_name: string;
  cohort_size: number;
  active_injury_count: number;
  active_injury_rate_pct: number;
  severity_breakdown: Record<string, number>;
  new_injury_incidence_count: number;
  person_months_at_risk: number;
  incidence_rate_per_100_person_months: number;
};

function formatNumber(value: unknown, fallback = "—") {
  return typeof value === "number" ? value.toLocaleString("en-US") : fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace(/_/g, " ");
}

function statusTone(status: string | null | undefined) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized.includes("full_duty") || normalized.includes("coordinated") || normalized.includes("acknowledged") || normalized.includes("completed")) {
    return "bg-emerald-500/10 text-emerald-500";
  }
  if (normalized.includes("pending") || normalized.includes("review") || normalized.includes("modified")) {
    return "bg-amber-500/10 text-amber-500";
  }
  if (normalized.includes("no_duty") || normalized.includes("quarantined") || normalized.includes("denied")) {
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

export function PtImView({ activeTab = "dashboard" }: { activeTab?: TabType }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dashboard, setDashboard] = useState<PtimDashboardData | null>(null);
  const [byFlight, setByFlight] = useState<InjuryReportByFlightResponse | null>(null);
  const [quarters, setQuarters] = useState<InjuryReportQuartersResponse | null>(null);
  const [types, setTypes] = useState<InjuryTypeBreakdownResponse | null>(null);
  const [handoffs, setHandoffs] = useState<IdmtHandoffsResponse | null>(null);

  const refreshAll = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const [dash, flightData, qtrData, typeData, handoffData] = await Promise.all([
        getPtimDashboard(accessToken),
        getInjuryReportByFlight(accessToken, { days: 30 }),
        getInjuryReportQuarters(accessToken, new Date().getFullYear()),
        getInjuryTypeBreakdown(accessToken, { fiscal_year: new Date().getFullYear(), quarter: 1 }),
        listIdmtHandoffs(accessToken),
      ]);

      setDashboard(dash);
      setByFlight(flightData);
      setQuarters(qtrData);
      setTypes(typeData);
      setHandoffs(handoffData);
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Physical Therapy / Injury Management</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">PT / IM Clinical Operations</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Clinical dashboard, injury surveillance, medical records, and IDMT handoffs.</p>
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
            <MetricCard title="Assigned Count" value={formatNumber(dashboard?.assigned_count)} subtext="Current PT/IM assigned operators." />
            <MetricCard title="Active Reconditioning" value={formatNumber(dashboard?.active_reconditioning_count)} subtext="Active reconditioning cases." />
            <MetricCard title="Pending Review" value={formatNumber(dashboard?.pending_review_total)} subtext="Records awaiting review." accent="text-amber-500" />
            <MetricCard title="Handoffs Count" value={formatNumber(handoffs?.handoffs?.length)} subtext="IDMT handoffs recorded." accent="text-cyan-500" />
          </div>
        </div>
      )}

      {activeTab === "injury" && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Injury Surveillance by Flight"
              subtitle={
                byFlight
                  ? `${formatDate(byFlight.window_start)} to ${formatDate(byFlight.window_end)} · ${byFlight.flights_meeting_cohort_minimum} of ${byFlight.total_flights} flights meet the k>=${byFlight.min_cohort_size} cohort minimum`
                  : "By flight, k-anonymity gated."
              }
            />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Flight</th>
                    <th className="pb-3 font-semibold">Cohort</th>
                    <th className="pb-3 font-semibold">Active injuries</th>
                    <th className="pb-3 font-semibold">Active rate</th>
                    <th className="pb-3 font-semibold">New incidents</th>
                    <th className="pb-3 font-semibold">Incidence / 100 person-mo</th>
                    <th className="pb-3 font-semibold">Severity breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {(byFlight?.flights as PtimFlightRow[] | undefined)?.map((flight) => (
                    <tr key={flight.flight_id}>
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{flight.flight_name}</td>
                      <td className="py-3 text-slate-500">{flight.cohort_size}</td>
                      <td className="py-3 text-slate-500">{flight.active_injury_count}</td>
                      <td className="py-3 text-slate-500">{flight.active_injury_rate_pct.toFixed(1)}%</td>
                      <td className="py-3 text-slate-500">{flight.new_injury_incidence_count}</td>
                      <td className="py-3 text-slate-500">{flight.incidence_rate_per_100_person_months.toFixed(1)}</td>
                      <td className="py-3 text-slate-500">
                        {Object.keys(flight.severity_breakdown).length === 0
                          ? "—"
                          : Object.entries(flight.severity_breakdown)
                              .map(([level, count]) => `${level}: ${count}`)
                              .join(", ")}
                      </td>
                    </tr>
                  ))}
                  {(!byFlight?.flights || byFlight.flights.length === 0) && (
                    <tr><td colSpan={7} className="py-6 text-center text-slate-400">No flights meet the cohort minimum for this window.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Injury Type Breakdown"
              subtitle={types ? `Counts below k=${types.min_cohort_size} are suppressed, not fabricated.` : "By injury type."}
            />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Injury type</th>
                    <th className="pb-3 font-semibold">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {types?.types.map((type) => (
                    <tr key={type.injury_type}>
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{formatLabel(type.injury_type)}</td>
                      <td className="py-3 text-slate-500">
                        {type.suppressed ? (
                          <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            Suppressed (k-min)
                          </span>
                        ) : (
                          formatNumber(type.count)
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!types || types.types.length === 0) && (
                    <tr><td colSpan={2} className="py-6 text-center text-slate-400">No injury types recorded for this window.</td></tr>
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
              title="Pending Medical Record Reviews"
              subtitle="Every pending upload across the caseload assigned to you, not just your own uploads."
            />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Operator</th>
                    <th className="pb-3 font-semibold">Document type</th>
                    <th className="pb-3 font-semibold">File name</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {((dashboard?.operators as PtimOperatorRow[] | undefined) ?? [])
                    .flatMap((operator) =>
                      operator.pending_records.map((record) => ({ operator, record }))
                    )
                    .map(({ operator, record }) => (
                      <tr key={record.id}>
                        <td className="py-3 font-semibold text-slate-800 dark:text-white">{operator.user_name ?? "—"}</td>
                        <td className="py-3 text-slate-500">{formatLabel(record.document_type)}</td>
                        <td className="py-3 text-slate-500">{record.file_name}</td>
                        <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(record.status)}`}>{formatLabel(record.status)}</span></td>
                        <td className="py-3 text-slate-500">{formatDate(record.uploaded_at)}</td>
                      </tr>
                    ))}
                  {((dashboard?.operators as PtimOperatorRow[] | undefined) ?? []).every(
                    (operator) => operator.pending_records.length === 0
                  ) && (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-400">No pending medical records for review.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "quarterly" && (
        <div className="space-y-6">
          {quarters?.quarters.map((quarter) => (
            <Card key={quarter.quarter}>
              <CardHeader
                title={`FY${quarters.fiscal_year} Q${quarter.quarter}`}
                subtitle={`${formatDate(quarter.window_start)} to ${formatDate(quarter.window_end)} · ${quarter.flights_meeting_cohort_minimum} of ${quarter.total_flights} flights meet the k>=${quarter.min_cohort_size} cohort minimum`}
              />
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                      <th className="pb-3 font-semibold">Flight</th>
                      <th className="pb-3 font-semibold">Cohort</th>
                      <th className="pb-3 font-semibold">Active injuries</th>
                      <th className="pb-3 font-semibold">Active rate</th>
                      <th className="pb-3 font-semibold">Incidence / 100 person-mo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {(quarter.flights as PtimFlightRow[]).map((flight) => (
                      <tr key={flight.flight_id}>
                        <td className="py-3 font-semibold text-slate-800 dark:text-white">{flight.flight_name}</td>
                        <td className="py-3 text-slate-500">{flight.cohort_size}</td>
                        <td className="py-3 text-slate-500">{flight.active_injury_count}</td>
                        <td className="py-3 text-slate-500">{flight.active_injury_rate_pct.toFixed(1)}%</td>
                        <td className="py-3 text-slate-500">{flight.incidence_rate_per_100_person_months.toFixed(1)}</td>
                      </tr>
                    ))}
                    {quarter.flights.length === 0 && (
                      <tr><td colSpan={5} className="py-6 text-center text-slate-400">No flights meet the cohort minimum for this quarter.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
          {(!quarters || quarters.quarters.length === 0) && (
            <Card><p className="text-xs text-slate-400">No quarterly data available.</p></Card>
          )}
        </div>
      )}

      {activeTab === "scs" && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="SCS Coordination Status"
              subtitle="Real per-operator reconditioning-plan coordination status, not this provider's own recommendation feed."
            />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Operator</th>
                    <th className="pb-3 font-semibold">Reconditioning phase</th>
                    <th className="pb-3 font-semibold">PT/IM clearance</th>
                    <th className="pb-3 font-semibold">SCS coordination</th>
                    <th className="pb-3 font-semibold">Severity</th>
                    <th className="pb-3 font-semibold">Sessions</th>
                    <th className="pb-3 font-semibold">Next review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {((dashboard?.operators as PtimOperatorRow[] | undefined) ?? []).map((operator) => (
                    <tr key={operator.user_id}>
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{operator.user_name ?? "—"}</td>
                      <td className="py-3 text-slate-500">{formatLabel(operator.reconditioning_phase)}</td>
                      <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(operator.ptim_clearance_status)}`}>{formatLabel(operator.ptim_clearance_status)}</span></td>
                      <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(operator.scs_coordination_status)}`}>{operator.scs_coordination_label ?? "—"}</span></td>
                      <td className="py-3 text-slate-500">{operator.severity_level ?? "—"}</td>
                      <td className="py-3 text-slate-500">{operator.sessions_completed ?? 0} / {operator.sessions_total ?? 0}</td>
                      <td className="py-3 text-slate-500">{formatDate(operator.next_review_date)}</td>
                    </tr>
                  ))}
                  {((dashboard?.operators as PtimOperatorRow[] | undefined) ?? []).length === 0 && (
                    <tr><td colSpan={7} className="py-6 text-center text-slate-400">No assigned operators.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "handoff" && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="IDMT Clinical Handoffs" subtitle="Prepared, transmitted, and acknowledged clinical handoffs." />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Operator</th>
                    <th className="pb-3 font-semibold">Export type</th>
                    <th className="pb-3 font-semibold">Format</th>
                    <th className="pb-3 font-semibold">Recipient</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Prepared</th>
                    <th className="pb-3 font-semibold">Transmitted</th>
                    <th className="pb-3 font-semibold">Acknowledgement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {handoffs?.handoffs.map((handoff) => {
                    const h = handoff as {
                      id: string;
                      user_name: string | null;
                      export_type: string;
                      export_format: string;
                      recipient_role: string;
                      status: string;
                      prepared_date: string;
                      transmitted_date: string | null;
                      acknowledgement_status: string;
                    };
                    return (
                      <tr key={h.id}>
                        <td className="py-3 font-semibold text-slate-800 dark:text-white">{h.user_name ?? "—"}</td>
                        <td className="py-3 text-slate-500">{formatLabel(h.export_type)}</td>
                        <td className="py-3 text-slate-500">{h.export_format.toUpperCase()}</td>
                        <td className="py-3 text-slate-500">{h.recipient_role}</td>
                        <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(h.status)}`}>{formatLabel(h.status)}</span></td>
                        <td className="py-3 text-slate-500">{formatDate(h.prepared_date)}</td>
                        <td className="py-3 text-slate-500">{formatDate(h.transmitted_date)}</td>
                        <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(h.acknowledgement_status)}`}>{formatLabel(h.acknowledgement_status)}</span></td>
                      </tr>
                    );
                  })}
                  {(!handoffs || handoffs.handoffs.length === 0) && (
                    <tr><td colSpan={8} className="py-6 text-center text-slate-400">No IDMT handoffs recorded.</td></tr>
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

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/staff-api";
import {
  getPtimDashboard,
  getInjuryReportByFlight,
  getInjuryReportQuarters,
  getInjuryTypeBreakdown,
  listIdmtHandoffs,
  createIdmtHandoff,
  listCoordinationItems,
  raiseCoordinationItem,
  acknowledgeCoordinationItem,
  closeCoordinationItem,
  listCaseloadMedicalRecords,
  requestMedicalRecordAccess,
  listPtimRecommendations,
  createPtimRecommendation,
  markPtimRecommendationDone,
  type PtimDashboardData,
  type InjuryReportByFlightResponse,
  type InjuryReportQuartersResponse,
  type InjuryTypeBreakdownResponse,
  type IdmtHandoffsResponse,
  type CoordinationItemsResponse,
  type CaseloadMedicalRecordsResponse,
  type PtimRecommendationsResponse,
} from "@/lib/role-dashboards-api";

const HANDOFF_EXPORT_TYPES = [
  ["injury_summary", "Injury summary"],
  ["reconditioning_summary", "Reconditioning summary"],
  ["medical_record_summary", "Medical record summary"],
] as const;

const HANDOFF_EXPORT_FORMATS = [
  ["pdf", "PDF"],
  ["csv", "CSV"],
  ["mfr_summary", "MFR summary"],
] as const;

export type TabType = "dashboard" | "queue" | "injury" | "records" | "quarterly" | "scs" | "handoff";

// Real per-operator row shape from provider_dashboard_service._build_ptim_row.
type PtimOftStatus = {
  current_status: string;
  next_scheduled_date: string | null;
  next_scheduled_relative: string | null;
};

// Real shape from coordination_item_service._serialize.
type CoordinationItemRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  rank_grade: string | null;
  title: string;
  trigger_label: string;
  trigger_detail: string | null;
  affects_label: string;
  raised_by_name: string | null;
  raised_by_role: string;
  pending_with_role: string;
  status: "awaiting_response" | "acknowledged" | "closed";
  acknowledged_by_name: string | null;
  acknowledged_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

const COORDINATION_TRIGGERS = [
  ["pain", "Pain"],
  ["limitation", "Limitation"],
  ["failed_oft", "Failed OFT"],
  ["recovery_decline", "Recovery decline"],
] as const;

const COORDINATION_AFFECTS = [
  ["training_load", "Training load"],
  ["session_plan", "Session plan"],
  ["assessment", "Assessment"],
  ["programming", "Programming"],
] as const;

function coordinationStatusLabel(item: CoordinationItemRow): { label: string; detail: string } {
  if (item.status === "closed") return { label: "CLOSED", detail: "Resolved" };
  if (item.status === "acknowledged") {
    return { label: "ASSIGNED", detail: `Acknowledged by ${item.acknowledged_by_name ?? item.pending_with_role}` };
  }
  return { label: "DUE", detail: `Awaiting ${item.pending_with_role} response` };
}

// Real shape from medical_record_service.list_for_caseload.
type CaseloadRecordRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  rank_grade: string | null;
  document_type: string;
  last_encounter: string;
  access_expires_at: string | null;
  privacy_state: "restricted" | "authorization_required" | "access_expired" | "consent_withdrawn";
};

const PRIVACY_STATE_LABELS: Record<CaseloadRecordRow["privacy_state"], { label: string; detail: string; tone: string }> = {
  restricted: {
    label: "RESTRICTED",
    detail: "Minimum-necessary access only - role-scoped view.",
    tone: "bg-sky-500/10 text-sky-500",
  },
  authorization_required: {
    label: "AUTHORIZATION REQUIRED",
    detail: "Your role is not on this record's approved access list.",
    tone: "bg-amber-500/10 text-amber-500",
  },
  access_expired: {
    label: "ACCESS EXPIRED",
    detail: "Prior authorization window closed - re-request required.",
    tone: "bg-rose-500/10 text-rose-500",
  },
  consent_withdrawn: {
    label: "CONSENT WITHDRAWN",
    detail: "Airman withdrew consent - record locked.",
    tone: "bg-rose-500/10 text-rose-500",
  },
};

// Real shape from ptim_recommendation_service._serialize.
type PtimRecommendationRow = {
  id: string;
  fiscal_year: number;
  quarter: number;
  title: string;
  body: string;
  subject: string;
  owners: string[];
  due_date: string | null;
  status: "open" | "done";
  created_by_name: string | null;
  created_at: string;
};

type PtimOperatorRow = {
  user_id: string;
  user_name: string | null;
  rank_grade: string | null;
  flight_name: string | null;
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
  limitation_flag: boolean | null;
  days_out: number | null;
  oft_status: PtimOftStatus | null;
};

// Derived, not stored - severity_level is the real tracked field; this is
// only a display mapping (L4 -> High ... L1 -> Low), same "derive a label
// from a real enum" pattern as statusTone below.
const PRIORITY_BY_SEVERITY: Record<string, string> = { L4: "High", L3: "Medium", L2: "Medium", L1: "Low" };

function priorityFromSeverity(severity: string | null): string {
  if (!severity) return "Unset";
  return PRIORITY_BY_SEVERITY[severity] ?? "Unset";
}

function priorityTone(priority: string) {
  if (priority === "High") return "text-rose-500";
  if (priority === "Medium") return "text-amber-500";
  if (priority === "Low") return "text-sky-500";
  return "text-slate-400";
}

// Derived, not stored - combines the real ptim_clearance_status enum with
// the real limitation_flag boolean into one readable phrase. Never a
// freeform clinical description, only ever these fixed combinations.
function functionalStatusLabel(clearance: string | null, limitationFlag: boolean | null): string {
  if (!clearance) return "Not assessed";
  const base =
    clearance === "no_duty"
      ? "Restricted - no duty"
      : clearance === "modified_duty"
        ? "Modified duty"
        : clearance === "full_duty"
          ? "Full duty"
          : "Pending review";
  return limitationFlag && clearance !== "no_duty" ? `${base} - limitation reported` : base;
}

// The most-advanced real state transition a handoff has actually reached -
// never "Sent to <person>"/"Read by <person>" (this backend tracks a
// recipient_role, not an individual reader, and has no "read" state at all).
function latestHandoffEvent(h: IdmtHandoffRow): { label: string; actor: string | null; at: string } {
  if (h.acknowledged_at) {
    return { label: "Acknowledged", actor: h.acknowledged_by_name, at: h.acknowledged_at };
  }
  if (h.transmitted_date) {
    return { label: `Transmitted to ${h.recipient_role}`, actor: null, at: h.transmitted_date };
  }
  return { label: "Drafted", actor: h.prepared_by_name, at: h.prepared_date };
}

function initials(name: string | null): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function oftStatusLabel(oft: PtimOftStatus | null): string {
  if (!oft) return "No OFT record";
  switch (oft.current_status) {
    case "no_record":
      return "No OFT record";
    case "scheduled":
      return oft.next_scheduled_date ? `Scheduled ${formatDate(oft.next_scheduled_date)}` : "Scheduled";
    case "current":
      return "Current";
    case "not_current":
      return "Not current";
    case "exempt":
      return "Exempt";
    default:
      return formatLabel(oft.current_status);
  }
}

// Real shape from idmt_handoff_service._serialize.
type IdmtHandoffRow = {
  id: string;
  user_name: string | null;
  export_type: string;
  export_format: string;
  prepared_by_name: string | null;
  recipient_role: string;
  status: string;
  prepared_date: string;
  transmitted_date: string | null;
  acknowledgement_status: string;
  acknowledged_by_name: string | null;
  acknowledged_at: string | null;
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
  days_lost: number;
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
  const router = useRouter();
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
  const [coordinationItems, setCoordinationItems] = useState<CoordinationItemsResponse | null>(null);
  const [caseloadRecords, setCaseloadRecords] = useState<CaseloadMedicalRecordsResponse | null>(null);
  const [recordsFilter, setRecordsFilter] = useState<"caseload" | "open_cases" | "expiring">("caseload");
  const [requestingAccessId, setRequestingAccessId] = useState<string | null>(null);

  const [recommendationsByQuarter, setRecommendationsByQuarter] = useState<Record<number, PtimRecommendationsResponse>>({});
  const [typesByQuarter, setTypesByQuarter] = useState<Record<number, InjuryTypeBreakdownResponse>>({});
  const [recommendationModalQuarter, setRecommendationModalQuarter] = useState<number | null>(null);
  const [recommendationForm, setRecommendationForm] = useState({ title: "", body: "", subject: "", owners: [] as string[], due_date: "" });
  const [recommendationSaving, setRecommendationSaving] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");

  const [coordinationFilter, setCoordinationFilter] = useState<"open" | "awaiting_scs" | "awaiting_ptim" | "closed">("open");
  const [coordinationModalOpen, setCoordinationModalOpen] = useState(false);
  const [coordinationForm, setCoordinationForm] = useState({
    user_id: "",
    title: "",
    trigger_category: "pain",
    trigger_detail: "",
    affects: "training_load",
  });
  const [coordinationSaving, setCoordinationSaving] = useState(false);
  const [coordinationError, setCoordinationError] = useState("");

  const [injuryQueueFilter, setInjuryQueueFilter] = useState<"all" | "high_priority" | "limited_duty" | "oft_pending">("all");
  const [injuryQueuePage, setInjuryQueuePage] = useState(1);
  const INJURY_QUEUE_PAGE_SIZE = 10;

  const [handoffModalOpen, setHandoffModalOpen] = useState(false);
  const [handoffForm, setHandoffForm] = useState({ user_id: "", export_type: "injury_summary", export_format: "pdf" });
  const [handoffSaving, setHandoffSaving] = useState(false);
  const [handoffError, setHandoffError] = useState("");
  const [handoffSuccess, setHandoffSuccess] = useState("");

  const refreshAll = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const [dash, flightData, qtrData, typeData, handoffData, coordinationData, caseloadRecordData] = await Promise.all([
        getPtimDashboard(accessToken),
        getInjuryReportByFlight(accessToken, { days: 30 }),
        getInjuryReportQuarters(accessToken, new Date().getFullYear()),
        getInjuryTypeBreakdown(accessToken, { fiscal_year: new Date().getFullYear(), quarter: 1 }),
        listIdmtHandoffs(accessToken),
        listCoordinationItems(accessToken),
        listCaseloadMedicalRecords(accessToken),
      ]);

      setDashboard(dash);
      setByFlight(flightData);
      setQuarters(qtrData);
      setTypes(typeData);
      setHandoffs(handoffData);
      setCoordinationItems(coordinationData);
      setCaseloadRecords(caseloadRecordData);

      const fiscalYear = new Date().getFullYear();
      const [recData, typeData4] = await Promise.all([
        Promise.all([1, 2, 3, 4].map((q) => listPtimRecommendations(accessToken, fiscalYear, q))),
        Promise.all([1, 2, 3, 4].map((q) => getInjuryTypeBreakdown(accessToken, { fiscal_year: fiscalYear, quarter: q }))),
      ]);
      setRecommendationsByQuarter({ 1: recData[0], 2: recData[1], 3: recData[2], 4: recData[3] });
      setTypesByQuarter({ 1: typeData4[0], 2: typeData4[1], 3: typeData4[2], 4: typeData4[3] });
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

  const submitNewHandoff = async () => {
    if (!accessToken) return;
    if (!handoffForm.user_id) {
      setHandoffError("Select an airman.");
      return;
    }
    setHandoffSaving(true);
    setHandoffError("");
    setHandoffSuccess("");
    try {
      await createIdmtHandoff(accessToken, handoffForm);
      // Real, DOCX-sourced two-person-rule queue - a prepared handoff is
      // never applied/transmitted immediately (see IdmtHandoffService),
      // so this is honestly "pending", not "created".
      setHandoffSuccess("Handoff prepared - pending second-reviewer approval.");
      const handoffData = await listIdmtHandoffs(accessToken);
      setHandoffs(handoffData);
      setHandoffForm({ user_id: "", export_type: "injury_summary", export_format: "pdf" });
    } catch (err) {
      setHandoffError(getApiErrorMessage(err));
    } finally {
      setHandoffSaving(false);
    }
  };

  const submitCoordinationItem = async () => {
    if (!accessToken) return;
    if (!coordinationForm.user_id || !coordinationForm.title.trim()) {
      setCoordinationError("Select an airman and enter a title.");
      return;
    }
    setCoordinationSaving(true);
    setCoordinationError("");
    try {
      await raiseCoordinationItem(accessToken, {
        ...coordinationForm,
        trigger_detail: coordinationForm.trigger_detail || undefined,
      });
      const data = await listCoordinationItems(accessToken);
      setCoordinationItems(data);
      setCoordinationForm({ user_id: "", title: "", trigger_category: "pain", trigger_detail: "", affects: "training_load" });
      setCoordinationModalOpen(false);
    } catch (err) {
      setCoordinationError(getApiErrorMessage(err));
    } finally {
      setCoordinationSaving(false);
    }
  };

  const acknowledgeItem = async (itemId: string) => {
    if (!accessToken) return;
    try {
      await acknowledgeCoordinationItem(accessToken, itemId);
      const data = await listCoordinationItems(accessToken);
      setCoordinationItems(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const submitRecommendation = async () => {
    if (!accessToken || recommendationModalQuarter === null) return;
    if (!recommendationForm.title.trim() || !recommendationForm.body.trim() || !recommendationForm.subject.trim()) {
      setRecommendationError("Title, subject, and body are required.");
      return;
    }
    setRecommendationSaving(true);
    setRecommendationError("");
    try {
      const fiscalYear = new Date().getFullYear();
      await createPtimRecommendation(accessToken, {
        fiscal_year: fiscalYear,
        quarter: recommendationModalQuarter,
        title: recommendationForm.title,
        body: recommendationForm.body,
        subject: recommendationForm.subject,
        owners: recommendationForm.owners,
        due_date: recommendationForm.due_date || undefined,
      });
      const data = await listPtimRecommendations(accessToken, fiscalYear, recommendationModalQuarter);
      setRecommendationsByQuarter((prev) => ({ ...prev, [recommendationModalQuarter]: data }));
      setRecommendationForm({ title: "", body: "", subject: "", owners: [], due_date: "" });
      setRecommendationModalQuarter(null);
    } catch (err) {
      setRecommendationError(getApiErrorMessage(err));
    } finally {
      setRecommendationSaving(false);
    }
  };

  const markRecommendationDone = async (quarter: number, recommendationId: string) => {
    if (!accessToken) return;
    try {
      await markPtimRecommendationDone(accessToken, recommendationId);
      const fiscalYear = new Date().getFullYear();
      const data = await listPtimRecommendations(accessToken, fiscalYear, quarter);
      setRecommendationsByQuarter((prev) => ({ ...prev, [quarter]: data }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const requestAccess = async (recordId: string) => {
    if (!accessToken) return;
    setRequestingAccessId(recordId);
    try {
      await requestMedicalRecordAccess(accessToken, recordId);
      const data = await listCaseloadMedicalRecords(accessToken);
      setCaseloadRecords(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setRequestingAccessId(null);
    }
  };

  const closeItem = async (itemId: string) => {
    if (!accessToken) return;
    try {
      await closeCoordinationItem(accessToken, itemId);
      const data = await listCoordinationItems(accessToken);
      setCoordinationItems(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => void refreshAll()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
            type="button"
          >
            Refresh
          </button>
          <button
            onClick={() => router.push("/dashboard/pt-im/records")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
            type="button"
          >
            Records
          </button>
          <button
            onClick={() => {
              setHandoffError("");
              setHandoffSuccess("");
              setHandoffModalOpen(true);
            }}
            className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
            type="button"
          >
            + New IDMT handoff
          </button>
        </div>
      </div>

      {(activeTab === "dashboard" || activeTab === "queue") && (() => {
        const operators = (dashboard?.operators as PtimOperatorRow[] | undefined) ?? [];
        const queueRows = operators.filter((o) => o.severity_level || o.ptim_clearance_status);
        const priorityRank: Record<string, number> = { High: 0, Medium: 1, Low: 2, Unset: 3 };
        const filtered = queueRows.filter((o) => {
          const priority = priorityFromSeverity(o.severity_level);
          if (injuryQueueFilter === "high_priority") return priority === "High";
          if (injuryQueueFilter === "limited_duty") return o.ptim_clearance_status === "modified_duty" || o.ptim_clearance_status === "no_duty";
          if (injuryQueueFilter === "oft_pending") return o.oft_status?.current_status === "scheduled" || o.oft_status?.current_status === "no_record";
          return true;
        });
        filtered.sort((a, b) => {
          const priorityDiff = priorityRank[priorityFromSeverity(a.severity_level)] - priorityRank[priorityFromSeverity(b.severity_level)];
          if (priorityDiff !== 0) return priorityDiff;
          return functionalStatusLabel(a.ptim_clearance_status, a.limitation_flag).localeCompare(
            functionalStatusLabel(b.ptim_clearance_status, b.limitation_flag)
          );
        });

        const oftDue = operators
          .filter((o) => o.oft_status?.current_status === "scheduled" && o.oft_status.next_scheduled_date)
          .sort((a, b) => (a.oft_status!.next_scheduled_date! < b.oft_status!.next_scheduled_date! ? -1 : 1));

        const highPriorityCount = queueRows.filter((o) => priorityFromSeverity(o.severity_level) === "High").length;
        const today = new Date();
        const reviewDueOperators = operators.filter((o) => o.next_review_date && new Date(o.next_review_date) <= today);
        const reviewDueL4Count = reviewDueOperators.filter((o) => o.severity_level === "L4").length;

        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Assigned Count" value={formatNumber(dashboard?.assigned_count)} subtext="Current PT/IM assigned operators." />
              <MetricCard title="Active Reconditioning" value={formatNumber(dashboard?.active_reconditioning_count)} subtext="Active reconditioning cases." />
              <MetricCard title="Pending Review" value={formatNumber(dashboard?.pending_review_total)} subtext="Records awaiting review." accent="text-amber-500" />
              <MetricCard title="Handoffs Count" value={formatNumber(handoffs?.handoffs?.length)} subtext="IDMT handoffs recorded." accent="text-cyan-500" />
            </div>

            <Card>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RTP + RTD - Separate paths</p>
              <div className="mt-3 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold text-[var(--brand-color)]">Return to Performance (RTP)</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Managed in Ascend: PT/IM + SCS coordinate reconditioning, training load, and progression.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-500">Return to Duty (RTD)</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Requires source-authority + decision date + verification + reevaluation/expiration. RTD is only
                    surfaced when all four fields are present, and is the only path that lifts duty restriction.
                  </p>
                </div>
              </div>
            </Card>

            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Action queues</p>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Active Patients" value={formatNumber(dashboard?.assigned_count)} subtext="Current PT/IM assigned caseload." />
                <MetricCard
                  title="Injury Queue"
                  value={formatNumber(queueRows.length)}
                  subtext={`${highPriorityCount} high-priority.`}
                  accent={highPriorityCount > 0 ? "text-rose-500" : undefined}
                />
                <MetricCard title="OFT Clearance Due" value={formatNumber(oftDue.length)} subtext="Real scheduled tests across caseload." accent="text-amber-500" />
                <MetricCard
                  title="Quarterly Review Items"
                  value={formatNumber(reviewDueOperators.length)}
                  subtext={`${reviewDueL4Count} L4+.`}
                  accent="text-cyan-500"
                />
              </div>
            </div>

            <Card>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/5">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    {activeTab === "queue" ? `All active cases · ${queueRows.length}` : "Injury queue"}
                  </h3>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {activeTab === "queue"
                      ? "Sorted by priority then functional status. Click a row to open the case."
                      : `${queueRows.length} active - sorted by priority then functional status.`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {([
                    ["all", "All"],
                    ["high_priority", "High priority"],
                    ["limited_duty", "Limited duty"],
                    ["oft_pending", "OFT pending"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setInjuryQueueFilter(value);
                        setInjuryQueuePage(1);
                      }}
                      className={`rounded-full border px-3 py-1 text-[10px] font-bold cursor-pointer ${
                        injuryQueueFilter === value
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
                      <th className="pb-3 font-semibold">Injury type</th>
                      <th className="pb-3 font-semibold">Priority</th>
                      <th className="pb-3 font-semibold">Functional status</th>
                      <th className="pb-3 font-semibold">Severity</th>
                      <th className="pb-3 font-semibold">Days out</th>
                      <th className="pb-3 font-semibold">OFT status</th>
                      <th className="pb-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filtered.slice((injuryQueuePage - 1) * INJURY_QUEUE_PAGE_SIZE, injuryQueuePage * INJURY_QUEUE_PAGE_SIZE).map((operator) => {
                      const priority = priorityFromSeverity(operator.severity_level);
                      return (
                        <tr key={operator.user_id}>
                          <td className="py-3">
                            <span className="font-semibold text-slate-800 dark:text-white">{operator.user_name ?? "—"}</span>
                            <p className="text-[10px] text-slate-400">
                              {[operator.rank_grade, operator.flight_name].filter(Boolean).join(" · ") || "—"}
                            </p>
                          </td>
                          <td className="py-3 text-slate-500">
                            {operator.injury_flags && operator.injury_flags.length > 0
                              ? operator.injury_flags.map((flag) => formatLabel(flag)).join(", ")
                              : "—"}
                          </td>
                          <td className={`py-3 font-bold ${priorityTone(priority)}`}>{priority}</td>
                          <td className="py-3 text-slate-500">{functionalStatusLabel(operator.ptim_clearance_status, operator.limitation_flag)}</td>
                          <td className="py-3 text-slate-500">{operator.severity_level ?? "—"}</td>
                          <td className="py-3 text-slate-500">{operator.days_out ?? "—"}</td>
                          <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(operator.oft_status?.current_status)}`}>{oftStatusLabel(operator.oft_status)}</span></td>
                          <td className="py-3">
                            <button
                              type="button"
                              onClick={() => router.push("/dashboard/pt-im/scs")}
                              className="rounded-lg border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={8} className="py-6 text-center text-slate-400">No cases match this filter.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {filtered.length > INJURY_QUEUE_PAGE_SIZE && (() => {
                const totalPages = Math.ceil(filtered.length / INJURY_QUEUE_PAGE_SIZE);
                const rangeStart = (injuryQueuePage - 1) * INJURY_QUEUE_PAGE_SIZE + 1;
                const rangeEnd = Math.min(injuryQueuePage * INJURY_QUEUE_PAGE_SIZE, filtered.length);
                return (
                  <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      {rangeStart}–{rangeEnd} of {filtered.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={injuryQueuePage === 1}
                        onClick={() => setInjuryQueuePage((p) => Math.max(1, p - 1))}
                        className="rounded-lg border border-slate-200 px-2 py-1 font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                      >
                        {"<"}
                      </button>
                      {Array.from({ length: totalPages }).map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setInjuryQueuePage(index + 1)}
                          className={`rounded-lg border px-2 py-1 font-bold cursor-pointer ${
                            injuryQueuePage === index + 1
                              ? "border-[var(--brand-color)] text-[var(--brand-color)]"
                              : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900"
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={injuryQueuePage === totalPages}
                        onClick={() => setInjuryQueuePage((p) => Math.min(totalPages, p + 1))}
                        className="rounded-lg border border-slate-200 px-2 py-1 font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                      >
                        {">"}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </Card>

            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Analytics</p>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader
                  title="Trending injury types"
                  subtitle={types ? `Counts below k=${types.min_cohort_size} are suppressed, not fabricated.` : "By injury type."}
                />
                <div className="space-y-2 text-xs">
                  {types?.types.slice(0, 6).map((type) => (
                    <div key={type.injury_type} className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">{formatLabel(type.injury_type)}</span>
                      {type.suppressed ? (
                        <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Suppressed (k-min)</span>
                      ) : (
                        <span className="font-bold text-slate-800 dark:text-white">{formatNumber(type.count)}</span>
                      )}
                    </div>
                  ))}
                  {(!types || types.types.length === 0) && <p className="text-slate-400">No injury types recorded for this window.</p>}
                </div>
              </Card>

              <Card>
                <CardHeader title="OFT clearance due" subtitle="Real scheduled OFT tests across your assigned caseload." />
                <div className="space-y-3 text-xs">
                  {oftDue.slice(0, 6).map((operator) => (
                    <div key={operator.user_id} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">{operator.user_name ?? "—"}</p>
                        <p className="text-[10px] text-slate-400">
                          OFT {formatDate(operator.oft_status!.next_scheduled_date)}
                          {operator.flight_name ? ` · ${operator.flight_name}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-500">
                          DUE {formatDate(operator.oft_status!.next_scheduled_date).toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => router.push("/dashboard/pt-im/scs")}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))}
                  {oftDue.length === 0 && <p className="text-slate-400">No OFT tests currently scheduled.</p>}
                </div>
              </Card>
            </div>

            <Card>
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent handoffs</h3>
                  <p className="mt-0.5 text-[10px] text-slate-400">Real IDMT documentation handoff activity - drafted, transmitted, acknowledged.</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/pt-im/handoff")}
                  className="text-[10px] font-bold text-[var(--brand-color)] hover:underline cursor-pointer"
                >
                  All →
                </button>
              </div>
              <div className="space-y-4 text-xs">
                {(handoffs?.handoffs as IdmtHandoffRow[] | undefined)
                  ?.map((h) => ({ h, event: latestHandoffEvent(h) }))
                  .sort((a, b) => (a.event.at < b.event.at ? 1 : -1))
                  .slice(0, 6)
                  .map(({ h, event }) => (
                    <div key={h.id} className="flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-color)]/10 text-[10px] font-bold text-[var(--brand-color)]">
                        {initials(event.actor ?? h.prepared_by_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {event.label}
                          {event.actor ? ` · ${event.actor}` : ""}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {h.user_name ?? "—"} - {formatLabel(h.export_type)}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {new Date(event.at).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                {(!handoffs || handoffs.handoffs.length === 0) && <p className="text-slate-400">No IDMT handoffs recorded.</p>}
              </div>
            </Card>
          </div>
        );
      })()}

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

      {activeTab === "records" && (() => {
        const records = (caseloadRecords?.records as CaseloadRecordRow[] | undefined) ?? [];
        const soon = Date.now() + 7 * 24 * 60 * 60 * 1000;
        const filteredRecords = records.filter((r) => {
          if (recordsFilter === "open_cases") return r.privacy_state === "restricted";
          if (recordsFilter === "expiring") return r.access_expires_at && new Date(r.access_expires_at).getTime() <= soon;
          return true;
        });

        return (
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Medical records</h3>
                <p className="mt-0.5 max-w-2xl text-[10px] text-slate-400">
                  Records you are authorized to open, scoped to your PT/IM caseload. Opening a record requires a
                  logged access reason and is minimum-necessary by default.
                </p>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {([
                ["caseload", `My caseload · ${records.length}`],
                ["open_cases", "Open cases"],
                ["expiring", "Expiring access"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRecordsFilter(value)}
                  className={`rounded-full border px-3 py-1 text-[10px] font-bold cursor-pointer ${
                    recordsFilter === value
                      ? "border-[var(--brand-color)] text-[var(--brand-color)]"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-slate-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Airman</th>
                    <th className="pb-3 font-semibold">Last encounter</th>
                    <th className="pb-3 font-semibold">Record type</th>
                    <th className="pb-3 font-semibold">Privacy state</th>
                    <th className="pb-3 font-semibold">Access expires</th>
                    <th className="pb-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredRecords.map((record) => {
                    const state = PRIVACY_STATE_LABELS[record.privacy_state];
                    return (
                      <tr key={record.id}>
                        <td className="py-3">
                          <span className="font-semibold text-slate-800 dark:text-white">{record.user_name ?? "—"}</span>
                          <p className="text-[10px] text-slate-400">{record.rank_grade ?? "—"}</p>
                        </td>
                        <td className="py-3 text-slate-500">{formatDate(record.last_encounter)}</td>
                        <td className="py-3 text-slate-500">{formatLabel(record.document_type)}</td>
                        <td className="py-3">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${state.tone}`}>{state.label}</span>
                          <p className="mt-0.5 max-w-[220px] text-[10px] text-slate-400">{state.detail}</p>
                        </td>
                        <td className="py-3 text-slate-500">{formatDate(record.access_expires_at)}</td>
                        <td className="py-3">
                          {record.privacy_state === "restricted" ? (
                            <button
                              type="button"
                              onClick={() => router.push("/dashboard/pt-im/records")}
                              className="rounded-lg border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                            >
                              Open
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={requestingAccessId === record.id}
                              onClick={() => void requestAccess(record.id)}
                              className="rounded-lg border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                            >
                              {requestingAccessId === record.id ? "Requesting..." : "Request access"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRecords.length === 0 && (
                    <tr><td colSpan={6} className="py-6 text-center text-slate-400">No records match this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

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
        );
      })()}

      {activeTab === "quarterly" && (
        <div className="space-y-6">
          {quarters?.quarters.map((quarter) => {
            const recs = (recommendationsByQuarter[quarter.quarter]?.recommendations as PtimRecommendationRow[] | undefined) ?? [];
            const types = typesByQuarter[quarter.quarter];
            const suppressedTypeCount = types?.types.filter((t) => t.suppressed).length ?? 0;
            const visibleTypes = types?.types.filter((t) => !t.suppressed) ?? [];
            const maxTypeCount = Math.max(1, ...visibleTypes.map((t) => t.count ?? 0));
            const deltaTone = (delta: number | null) =>
              delta === null ? "text-slate-400" : delta > 0 ? "text-rose-500" : delta < 0 ? "text-emerald-500" : "text-slate-400";
            const deltaText = (delta: number | null) => (delta === null ? null : `${delta > 0 ? "+" : ""}${delta} vs Q${quarter.quarter - 1}`);

            return (
            <Card key={quarter.quarter}>
              <CardHeader
                title={`FY${quarters.fiscal_year} Q${quarter.quarter}`}
                subtitle={`${formatDate(quarter.window_start)} to ${formatDate(quarter.window_end)} · ${quarter.flights_meeting_cohort_minimum} of ${quarter.total_flights} flights meet the k>=${quarter.min_cohort_size} cohort minimum`}
              />

              {suppressedTypeCount > 0 && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-white/5 dark:bg-slate-900/40">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mt-0.5 size-5 shrink-0 text-slate-500">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                  </svg>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                      k&gt;={quarter.min_cohort_size} enforced - {suppressedTypeCount} {suppressedTypeCount === 1 ? "type" : "types"} suppressed
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      Injury types below the minimum cohort size are suppressed below the minimum cohort size. Suppressed
                      values are not approximated or merged with adjacent categories.
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-100 p-4 dark:border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total injuries</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-800 dark:text-white">{quarter.total_injuries}</p>
                  {deltaText(quarter.total_injuries_delta) && (
                    <p className={`mt-0.5 text-[10px] font-bold ${deltaTone(quarter.total_injuries_delta)}`}>{deltaText(quarter.total_injuries_delta)}</p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-100 p-4 dark:border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Injury rate (per 100 airman-mo)</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-800 dark:text-white">{quarter.injury_rate_per_100_person_months ?? "—"}</p>
                  {deltaText(quarter.injury_rate_per_100_person_months_delta) && (
                    <p className={`mt-0.5 text-[10px] font-bold ${deltaTone(quarter.injury_rate_per_100_person_months_delta)}`}>{deltaText(quarter.injury_rate_per_100_person_months_delta)}</p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-100 p-4 dark:border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">L4+ count</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-800 dark:text-white">{quarter.l4_plus_count}</p>
                  {deltaText(quarter.l4_plus_count_delta) && (
                    <p className={`mt-0.5 text-[10px] font-bold ${deltaTone(quarter.l4_plus_count_delta)}`}>{deltaText(quarter.l4_plus_count_delta)}</p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-100 p-4 dark:border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Days lost</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-800 dark:text-white">{quarter.days_lost}</p>
                  {deltaText(quarter.days_lost_delta) && (
                    <p className={`mt-0.5 text-[10px] font-bold ${deltaTone(quarter.days_lost_delta)}`}>{deltaText(quarter.days_lost_delta)}</p>
                  )}
                </div>
              </div>

              {visibleTypes.length > 0 && (
                <div className="mb-6 border-t border-slate-100 pt-4 dark:border-white/5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Injuries by body region (k&gt;={quarter.min_cohort_size})</h4>
                  <p className="mb-4 text-[10px] text-slate-400">
                    {visibleTypes.length} {visibleTypes.length === 1 ? "category" : "categories"} {"≥"} {quarter.min_cohort_size}
                    {suppressedTypeCount > 0 ? ` - ${suppressedTypeCount} suppressed.` : "."}
                  </p>
                  <div className="flex items-end gap-4" style={{ height: 140 }}>
                    {visibleTypes.map((type) => (
                      <div key={type.injury_type} className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className="w-full max-w-10 rounded-t-md bg-[var(--brand-color)]/70"
                          style={{ height: `${Math.max(6, ((type.count ?? 0) / maxTypeCount) * 100)}px` }}
                          title={`${formatLabel(type.injury_type)}: ${type.count}`}
                        />
                        <span className="text-center text-[9px] font-semibold text-slate-500 dark:text-slate-400">{formatLabel(type.injury_type)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">By-flight comparison</h4>
                <p className="mb-3 text-[10px] text-slate-400">Rate per 100 airman-months - Q{quarter.quarter}.</p>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                        <th className="pb-3 font-semibold">Flight</th>
                        <th className="pb-3 font-semibold">Cohort</th>
                        <th className="pb-3 font-semibold">Active injuries</th>
                        <th className="pb-3 font-semibold">Active rate</th>
                        <th className="pb-3 font-semibold">Incidence / 100 person-mo</th>
                        <th className="pb-3 font-semibold">L4+</th>
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
                          <td className="py-3 text-slate-500">{(flight.severity_breakdown as Record<string, number>)?.L4 ?? 0}</td>
                        </tr>
                      ))}
                      {quarter.flights.length === 0 && (
                        <tr><td colSpan={6} className="py-6 text-center text-slate-400">No flights meet the cohort minimum for this quarter.</td></tr>
                      )}
                      {quarter.flights.length > 0 && (() => {
                        const flightRows = quarter.flights as PtimFlightRow[];
                        const totalCohort = flightRows.reduce((sum, f) => sum + f.cohort_size, 0);
                        const totalInjuries = flightRows.reduce((sum, f) => sum + f.active_injury_count, 0);
                        const totalL4 = flightRows.reduce((sum, f) => sum + ((f.severity_breakdown as Record<string, number>)?.L4 ?? 0), 0);
                        return (
                          <tr className="font-bold text-slate-800 dark:text-white">
                            <td className="py-3">Total</td>
                            <td className="py-3">{totalCohort}</td>
                            <td className="py-3">{totalInjuries}</td>
                            <td className="py-3">{totalCohort > 0 ? ((totalInjuries / totalCohort) * 100).toFixed(1) : "0.0"}%</td>
                            <td className="py-3">{quarter.injury_rate_per_100_person_months ?? "—"}</td>
                            <td className="py-3">{totalL4}</td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-[10px] text-slate-400">Comparison reflects live caseload data, not a batch sync.</p>
              </div>

              {types && types.types.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-white/5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Injury type breakdown</h4>
                  <p className="mb-3 text-[10px] text-slate-400">Count by type - Q{quarter.quarter}.</p>
                  <div className="space-y-2 text-xs">
                    {types.types.map((type) => (
                      <div key={type.injury_type} className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-300">{formatLabel(type.injury_type)}</span>
                        {type.suppressed ? (
                          <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Suppressed (k-min)</span>
                        ) : (
                          <span className="font-bold text-slate-800 dark:text-white">{formatNumber(type.count)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-white/5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">Recommendations</h4>
                    <p className="text-[10px] text-slate-400">Drafted by PT/IM - routed to SCS.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRecommendationError("");
                      setRecommendationForm({ title: "", body: "", subject: "", owners: [], due_date: "" });
                      setRecommendationModalQuarter(quarter.quarter);
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                  >
                    + Add recommendation
                  </button>
                </div>
                <div className="space-y-3">
                  {recs.map((rec) => (
                    <div key={rec.id} className="rounded-xl border border-slate-100 p-4 text-xs dark:border-white/5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{rec.title}</p>
                          <p className="text-[10px] text-slate-400">{rec.subject}</p>
                        </div>
                        {rec.status === "open" ? (
                          <button
                            type="button"
                            onClick={() => void markRecommendationDone(quarter.quarter, rec.id)}
                            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                          >
                            Mark done
                          </button>
                        ) : (
                          <span className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-500">DONE</span>
                        )}
                      </div>
                      <p className="mt-2 text-slate-500">{rec.body}</p>
                      <p className="mt-2 text-[10px] font-semibold text-slate-400">
                        Owners: {rec.owners.join(" + ") || "—"}
                        {rec.due_date ? ` · due ${formatDate(rec.due_date)}` : ""}
                      </p>
                    </div>
                  ))}
                  {recs.length === 0 && <p className="text-[10px] text-slate-400">No recommendations drafted for this quarter yet.</p>}
                </div>
              </div>
            </Card>
            );
          })}
          {(!quarters || quarters.quarters.length === 0) && (
            <Card><p className="text-xs text-slate-400">No quarterly data available.</p></Card>
          )}

          {recommendationModalQuarter !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRecommendationModalQuarter(null)}>
              <div
                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0e1628]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add recommendation - Q{recommendationModalQuarter}</h3>
                  <button type="button" onClick={() => setRecommendationModalQuarter(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                    ✕
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Title</label>
                    <input
                      type="text"
                      value={recommendationForm.title}
                      onChange={(e) => setRecommendationForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Strengthen lumbar pre-hab in PT block"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Subject (who/what this targets)</label>
                    <input
                      type="text"
                      value={recommendationForm.subject}
                      onChange={(e) => setRecommendationForm((f) => ({ ...f, subject: e.target.value }))}
                      placeholder="e.g. Reyes, Cho, Hayes"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Body</label>
                    <textarea
                      value={recommendationForm.body}
                      onChange={(e) => setRecommendationForm((f) => ({ ...f, body: e.target.value }))}
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Owners</label>
                      <div className="flex gap-2">
                        {["PT/IM", "SCS"].map((role) => (
                          <label key={role} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={recommendationForm.owners.includes(role)}
                              onChange={(e) =>
                                setRecommendationForm((f) => ({
                                  ...f,
                                  owners: e.target.checked ? [...f.owners, role] : f.owners.filter((o) => o !== role),
                                }))
                              }
                            />
                            {role}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Due date (optional)</label>
                      <input
                        type="date"
                        value={recommendationForm.due_date}
                        onChange={(e) => setRecommendationForm((f) => ({ ...f, due_date: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  {recommendationError && <p className="text-rose-500">{recommendationError}</p>}
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRecommendationModalQuarter(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={recommendationSaving}
                    onClick={() => void submitRecommendation()}
                    className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {recommendationSaving ? "Saving..." : "Add recommendation"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "scs" && (() => {
        const items = (coordinationItems?.items as CoordinationItemRow[] | undefined) ?? [];
        const filteredItems = items.filter((item) => {
          if (coordinationFilter === "open") return item.status !== "closed";
          if (coordinationFilter === "awaiting_scs") return item.status === "awaiting_response" && item.pending_with_role === "SCS";
          if (coordinationFilter === "awaiting_ptim") return item.status === "awaiting_response" && item.pending_with_role === "PT/IM";
          return item.status === "closed";
        });
        const openCount = items.filter((item) => item.status !== "closed").length;

        return (
          <div className="space-y-6">
            <Card>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/5">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">SCS coordination</h3>
                  <p className="mt-0.5 max-w-2xl text-[10px] text-slate-400">
                    Joint items where pain, a limitation, a failed OFT, or recovery decline affects a training-plan
                    decision - held as its own record, separate from operator messages and IDMT handoffs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCoordinationError("");
                    setCoordinationModalOpen(true);
                  }}
                  className="shrink-0 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
                >
                  + Raise item
                </button>
              </div>

              <div className="mb-4 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-white/5 dark:bg-slate-900/40">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mt-0.5 size-5 shrink-0 text-[var(--brand-color)]">
                  <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Separate record - training-decision scope only</p>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    These items carry the functional limitation and its training implication - not diagnosis, notes, or
                    raw medical history. Operator messages, mental-performance content, and IDMT handoffs each stay in
                    their own workflow.
                  </p>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {([
                  ["open", `Open · ${openCount}`],
                  ["awaiting_scs", "Awaiting SCS"],
                  ["awaiting_ptim", "Awaiting PT/IM"],
                  ["closed", "Closed"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCoordinationFilter(value)}
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold cursor-pointer ${
                      coordinationFilter === value
                        ? "border-[var(--brand-color)] text-[var(--brand-color)]"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-slate-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                      <th className="pb-3 font-semibold">Airman</th>
                      <th className="pb-3 font-semibold">Coordination item</th>
                      <th className="pb-3 font-semibold">Trigger</th>
                      <th className="pb-3 font-semibold">Affects</th>
                      <th className="pb-3 font-semibold">Owner</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Updated</th>
                      <th className="pb-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredItems.map((item) => {
                      const { label, detail } = coordinationStatusLabel(item);
                      const canAcknowledge = item.status === "awaiting_response" && item.pending_with_role === "PT/IM";
                      return (
                        <tr key={item.id}>
                          <td className="py-3">
                            <span className="font-semibold text-slate-800 dark:text-white">{item.user_name ?? "—"}</span>
                            <p className="text-[10px] text-slate-400">{item.rank_grade ?? "—"}</p>
                          </td>
                          <td className="py-3 text-slate-500">{item.title}</td>
                          <td className="py-3 text-slate-500">
                            {item.trigger_label}
                            {item.trigger_detail ? ` · ${item.trigger_detail}` : ""}
                          </td>
                          <td className="py-3 text-slate-500">{item.affects_label}</td>
                          <td className="py-3 text-slate-500">{item.raised_by_role}</td>
                          <td className="py-3">
                            <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(item.status)}`}>{label}</span>
                            <p className="mt-0.5 text-[10px] text-slate-400">{detail}</p>
                          </td>
                          <td className="py-3 text-slate-500">{formatDate(item.updated_at)}</td>
                          <td className="py-3">
                            <div className="flex gap-1.5">
                              {canAcknowledge && (
                                <button
                                  type="button"
                                  onClick={() => void acknowledgeItem(item.id)}
                                  className="rounded-lg border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                                >
                                  Acknowledge
                                </button>
                              )}
                              {item.status !== "closed" && (
                                <button
                                  type="button"
                                  onClick={() => void closeItem(item.id)}
                                  className="rounded-lg border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                                >
                                  Close
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredItems.length === 0 && (
                      <tr><td colSpan={8} className="py-6 text-center text-slate-400">No coordination items match this filter.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {coordinationModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCoordinationModalOpen(false)}>
                <div
                  className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0e1628]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Raise coordination item</h3>
                    <button type="button" onClick={() => setCoordinationModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                      ✕
                    </button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Airman</label>
                      <select
                        value={coordinationForm.user_id}
                        onChange={(e) => setCoordinationForm((f) => ({ ...f, user_id: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="">Select an airman</option>
                        {((dashboard?.operators as PtimOperatorRow[] | undefined) ?? []).map((operator) => (
                          <option key={operator.user_id} value={operator.user_id}>
                            {operator.user_name ?? operator.user_id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Title</label>
                      <input
                        type="text"
                        value={coordinationForm.title}
                        onChange={(e) => setCoordinationForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Load cap for Rehab Block 2"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Trigger</label>
                        <select
                          value={coordinationForm.trigger_category}
                          onChange={(e) => setCoordinationForm((f) => ({ ...f, trigger_category: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                        >
                          {COORDINATION_TRIGGERS.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Affects</label>
                        <select
                          value={coordinationForm.affects}
                          onChange={(e) => setCoordinationForm((f) => ({ ...f, affects: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                        >
                          {COORDINATION_AFFECTS.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Trigger detail (optional)</label>
                      <input
                        type="text"
                        value={coordinationForm.trigger_detail}
                        onChange={(e) => setCoordinationForm((f) => ({ ...f, trigger_detail: e.target.value }))}
                        placeholder="e.g. lower back"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    {coordinationError && <p className="text-rose-500">{coordinationError}</p>}
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCoordinationModalOpen(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={coordinationSaving}
                      onClick={() => void submitCoordinationItem()}
                      className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      {coordinationSaving ? "Raising..." : "Raise item"}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
        );
      })()}

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
                    const h = handoff as IdmtHandoffRow;
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

      {handoffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setHandoffModalOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0e1628]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">New IDMT handoff</h3>
                <p className="mt-0.5 text-[10px] text-slate-400">Real, second-reviewer-approved documentation handoff - never transmitted immediately.</p>
              </div>
              <button type="button" onClick={() => setHandoffModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            {handoffSuccess ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                {handoffSuccess}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Recipient role
                  <input
                    type="text"
                    disabled
                    value="IDMT"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400"
                  />
                </label>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Airman <span className="text-rose-500">*</span>
                  <select
                    value={handoffForm.user_id}
                    onChange={(e) => setHandoffForm((f) => ({ ...f, user_id: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="">Select…</option>
                    {((dashboard?.operators as PtimOperatorRow[] | undefined) ?? []).map((op) => (
                      <option key={op.user_id} value={op.user_id}>{op.user_name ?? op.user_id}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Scope <span className="text-rose-500">*</span>
                  <select
                    value={handoffForm.export_type}
                    onChange={(e) => setHandoffForm((f) => ({ ...f, export_type: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  >
                    {HANDOFF_EXPORT_TYPES.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Format <span className="text-rose-500">*</span>
                  <select
                    value={handoffForm.export_format}
                    onChange={(e) => setHandoffForm((f) => ({ ...f, export_format: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  >
                    {HANDOFF_EXPORT_FORMATS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                {handoffError && <p className="text-[11px] font-semibold text-rose-500">{handoffError}</p>}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setHandoffModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
              >
                {handoffSuccess ? "Close" : "Cancel"}
              </button>
              {!handoffSuccess && (
                <button
                  type="button"
                  disabled={handoffSaving}
                  onClick={() => void submitNewHandoff()}
                  className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {handoffSaving ? "Preparing…" : "Generate handoff"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

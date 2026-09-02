"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AscendLogo } from "@/components/ascend-logo";
import { IconButton } from "@/components/ui/icon-button";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { getApiErrorMessage } from "@/lib/staff-api";
import {
  createIdmtHandoff,
  createIdmtHandoffsBatch,
  createPerformanceSummary,
  downloadIdmtHandoffSummary,
  getActiveRecommendations,
  getInjuryReportByFlight,
  getInjuryReportQuarters,
  getInjuryTypeBreakdown,
  getOftRecord,
  getPerformanceSummaries,
  getPtimDashboard,
  getReconditioningTimeline,
  getRomMeasurements,
  getUploadedRecordDetail,
  getUploadedRecordFile,
  listIdmtHandoffs,
  listUploadedRecords,
  markIdmtHandoffTransmitted,
  reviewUploadedRecord,
  revealRecordField,
  sendRecommendationForSignoff,
  setPerformanceSummaryVisibility,
  signOffRecommendation,
  updateRecordAccessLevel,
  upsertReconditioningPlan,
  addRomMeasurement,
  type ActiveRecommendationsResponse,
  type InjuryReportByFlightResponse,
  type InjuryReportQuartersResponse,
  type InjuryTypeBreakdownResponse,
  type OftRecordResponse,
  type PerformanceSummariesResponse,
  type PtimDashboardData,
  type RecordUploadsResponse,
  type ReconditioningTimelineResponse,
  type RomMeasurementsResponse,
  type IdmtHandoffsResponse,
} from "@/lib/role-dashboards-api";
import {
  Activity,
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle,
  ClipboardList,
  Download,
  FileText,
  LogOut,
  MessageSquare,
  Moon,
  Plus,
  Send,
  Shield,
  Stethoscope,
  Sun,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";

type TabType = "dashboard" | "injury" | "records" | "quarterly" | "scs" | "handoff";

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: withTime ? "2-digit" : undefined,
    minute: withTime ? "2-digit" : undefined,
  });
}

function formatNumber(value: unknown, fallback = "—") {
  return typeof value === "number" ? value.toLocaleString("en-US") : fallback;
}

function formatPercent(value: unknown) {
  return typeof value === "number" ? `${value.toFixed(1)}%` : "—";
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return value.replace(/_/g, " ");
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => stringifyValue(item)).join(", ");
  }
  return JSON.stringify(value);
}

function getRecordValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return null;
}

function getRecordId(record: Record<string, unknown>) {
  const value = getRecordValue(record, ["id", "user_id", "operator_user_id", "summary_id"]);
  return typeof value === "string" ? value : null;
}

function getRecordTitle(record: Record<string, unknown>) {
  const value = getRecordValue(record, ["full_name", "name", "title", "file_name", "flight_name", "operator_name"]);
  return stringifyValue(value);
}

function statusTone(status: string | null | undefined) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized.includes("approved") || normalized.includes("completed") || normalized.includes("active")) {
    return "bg-emerald-500/10 text-emerald-500";
  }
  if (normalized.includes("pending") || normalized.includes("review") || normalized.includes("draft")) {
    return "bg-amber-500/10 text-amber-500";
  }
  if (normalized.includes("deny") || normalized.includes("restricted") || normalized.includes("hold")) {
    return "bg-rose-500/10 text-rose-500";
  }
  return "bg-sky-500/10 text-sky-500";
}

function sanitizeDisplayData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDisplayData(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !/(^id$|_id$|^id_|^user_id$|^provider_id$|^recipient_id$|^participant_ids?$|^summary_id$)/i.test(key))
        .map(([key, nestedValue]) => [key, sanitizeDisplayData(nestedValue)]),
    );
  }

  return value;
}

export default function PtImDashboardPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useCurrentUser();
  const { theme, mounted: hasMounted, toggleTheme } = useTheme();
  const { show: showToast, message: toastMessage, triggerToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMutating, setIsMutating] = useState(false);

  const [dashboard, setDashboard] = useState<PtimDashboardData | null>(null);
  const [recommendations, setRecommendations] = useState<ActiveRecommendationsResponse>(null);
  const [records, setRecords] = useState<RecordUploadsResponse | null>(null);
  const [quarterlyFlightReport, setQuarterlyFlightReport] = useState<InjuryReportByFlightResponse | null>(null);
  const [quarterlyHistory, setQuarterlyHistory] = useState<InjuryReportQuartersResponse | null>(null);
  const [injuryTypes, setInjuryTypes] = useState<InjuryTypeBreakdownResponse | null>(null);
  const [handoffs, setHandoffs] = useState<IdmtHandoffsResponse | null>(null);
  const [handoffError, setHandoffError] = useState("");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [recordDetail, setRecordDetail] = useState<Record<string, unknown> | null>(null);
  const [romMeasurements, setRomMeasurements] = useState<RomMeasurementsResponse | null>(null);
  const [timeline, setTimeline] = useState<ReconditioningTimelineResponse | null>(null);
  const [performanceSummaries, setPerformanceSummaries] = useState<PerformanceSummariesResponse | null>(null);
  const [oftRecord, setOftRecord] = useState<OftRecordResponse | null>(null);

  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(4);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(2026);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showRomModal, setShowRomModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [showBatchHandoffModal, setShowBatchHandoffModal] = useState(false);
  const [showRecordReviewModal, setShowRecordReviewModal] = useState(false);

  const [planForm, setPlanForm] = useState({
    userId: "",
    phase: "active",
    sessionsCompleted: "0",
    sessionsTotal: "1",
    cadenceNote: "",
    injuryFlags: "",
    ptimClearanceStatus: "modified_duty",
    nextReviewDate: "2026-09-01",
    limitationFlag: true,
    rehabStrategySummary: "",
    scsCoordinationStatus: "pending",
    severityLevel: "L2",
    injuryReportedOn: "2026-08-01",
    rtdSourceAuthority: "PT/IM Clinic",
    rtdDecisionDate: "",
    rtdVerified: false,
    rtdReevaluationDate: "",
  });
  const [romForm, setRomForm] = useState({
    userId: "",
    movement: "knee_flexion",
    valueDegrees: "110",
    measuredDate: "2026-08-20",
    note: "",
  });
  const [summaryForm, setSummaryForm] = useState({
    userId: "",
    injuryHistorySummary: "",
    limitationsSummary: "",
    returnToPerformanceConsiderations: "",
    nutritionConsiderations: "",
    sleepRecoveryConsiderations: "",
    medicationAllergyConsiderationsIfAuthorized: "",
    specialistNotesLink: "",
  });
  const [recordReviewForm, setRecordReviewForm] = useState({
    recordId: "",
    note: "",
    approve: true,
    approvedAccessLevel: "SCS,PT/IM",
    fieldName: "file_name",
    reason: "",
    reasonCategory: "escalation",
  });
  const [summaryVisibilityForm, setSummaryVisibilityForm] = useState({
    summaryId: "",
    approvedVisibilityLevel: "approved" as "draft" | "approved" | "approved_with_medical",
  });
  const [handoffForm, setHandoffForm] = useState({
    userId: "",
    exportType: "reconditioning_summary",
    exportFormat: "pdf",
  });
  const [batchHandoffForm, setBatchHandoffForm] = useState({
    userIds: "",
    exportType: "reconditioning_summary",
    exportFormat: "pdf",
  });
  const [recommendationActionId, setRecommendationActionId] = useState("");
  const [handoffActionId, setHandoffActionId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const saved = window.localStorage.getItem("ascend_ptim_active_tab");
    if (saved && ["dashboard", "injury", "records", "quarterly", "scs", "handoff"].includes(saved)) {
      setActiveTab(saved as TabType);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ascend_ptim_active_tab", activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (hasMounted && isHydrated && !isAuthenticated) {
      router.push("/");
    }
  }, [hasMounted, isAuthenticated, isHydrated, router]);

  const operatorOptions = useMemo(() => {
    const rows = dashboard?.operators ?? [];
    return rows
      .map((row) => {
        const id = getRecordId(row);
        if (!id) {
          return null;
        }
        return {
          id,
          name: getRecordTitle(row),
          subtitle: stringifyValue(getRecordValue(row, ["flight_name", "unit_name", "status"])),
        };
      })
      .filter((row): row is { id: string; name: string; subtitle: string } => Boolean(row));
  }, [dashboard?.operators]);

  useEffect(() => {
    if (!selectedUserId) {
      const defaultId = operatorOptions[0]?.id ?? currentUser?.id ?? "";
      if (defaultId) {
        setSelectedUserId(defaultId);
        setPlanForm((prev) => ({ ...prev, userId: defaultId }));
        setRomForm((prev) => ({ ...prev, userId: defaultId }));
        setSummaryForm((prev) => ({ ...prev, userId: defaultId }));
        setHandoffForm((prev) => ({ ...prev, userId: defaultId }));
      }
    }
  }, [currentUser?.id, operatorOptions, selectedUserId]);

  useEffect(() => {
    if (!selectedRecordId) {
      const firstRecordId = (records?.records ?? [])
        .map((row) => getRecordId(row))
        .find((value): value is string => Boolean(value));
      if (firstRecordId) {
        setSelectedRecordId(firstRecordId);
        setRecordReviewForm((prev) => ({ ...prev, recordId: firstRecordId }));
      }
    }
  }, [records?.records, selectedRecordId]);

  const selectedOperator = operatorOptions.find((option) => option.id === selectedUserId) ?? null;
  const selectedRecord = (records?.records ?? []).find((row) => getRecordId(row) === selectedRecordId) ?? null;
  const selectedRecommendation = (recommendations?.recommendations ?? []).find((row) => getRecordId(row) === recommendationActionId) ?? null;
  const selectedHandoff = (handoffs?.handoffs ?? []).find((row) => getRecordId(row) === handoffActionId) ?? null;
  const summaryOptions = (performanceSummaries?.summaries ?? [])
    .map((summary, index) => {
      const summaryRecord = summary as Record<string, unknown>;
      const id = getRecordId(summaryRecord);
      if (!id) {
        return null;
      }

      return {
        id,
        label: `${getRecordTitle(summaryRecord)} • ${formatDate(String(getRecordValue(summaryRecord, ["created_at", "updated_at", "summary_date"])))}`,
        index,
      };
    })
    .filter((option): option is { id: string; label: string; index: number } => Boolean(option));

  const loadDashboard = async () => {
    if (!accessToken) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [
        dashboardData,
        recommendationsData,
        recordsData,
        flightReportData,
        quarterlyHistoryData,
        injuryTypeData,
      ] = await Promise.all([
        getPtimDashboard(accessToken),
        getActiveRecommendations(accessToken),
        listUploadedRecords(accessToken),
        getInjuryReportByFlight(accessToken, { fiscal_year: selectedFiscalYear, quarter: selectedQuarter }),
        getInjuryReportQuarters(accessToken, selectedFiscalYear),
        getInjuryTypeBreakdown(accessToken, { fiscal_year: selectedFiscalYear, quarter: selectedQuarter }),
      ]);

      setDashboard(dashboardData);
      setRecommendations(recommendationsData);
      setRecords(recordsData);
      setQuarterlyFlightReport(flightReportData);
      setQuarterlyHistory(quarterlyHistoryData);
      setInjuryTypes(injuryTypeData);

      try {
        const handoffsData = await listIdmtHandoffs(accessToken);
        setHandoffs(handoffsData);
        setHandoffError("");
      } catch (handoffLoadError) {
        setHandoffs(null);
        setHandoffError(getApiErrorMessage(handoffLoadError));
      }
    } catch (nextError) {
      setError(getApiErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedUser = async (userId: string) => {
    if (!accessToken || !userId) {
      setRomMeasurements(null);
      setTimeline(null);
      setPerformanceSummaries(null);
      setOftRecord(null);
      return;
    }

    try {
      const [romData, timelineData, summariesData, oftData] = await Promise.all([
        getRomMeasurements(accessToken, userId),
        getReconditioningTimeline(accessToken, userId),
        getPerformanceSummaries(accessToken, userId),
        getOftRecord(accessToken, userId),
      ]);
      setRomMeasurements(romData);
      setTimeline(timelineData);
      setPerformanceSummaries(summariesData);
      setOftRecord(oftData);
    } catch (nextError) {
      triggerToast(getApiErrorMessage(nextError));
    }
  };

  const loadSelectedRecord = async (recordId: string) => {
    if (!accessToken || !recordId) {
      setRecordDetail(null);
      return;
    }

    try {
      const detail = await getUploadedRecordDetail(accessToken, recordId);
      setRecordDetail(detail);
    } catch (nextError) {
      triggerToast(getApiErrorMessage(nextError));
      setRecordDetail(null);
    }
  };

  useEffect(() => {
    if (!hasMounted || !isHydrated || !accessToken) {
      return;
    }

    void loadDashboard();
  }, [accessToken, hasMounted, isHydrated, selectedFiscalYear, selectedQuarter]);

  useEffect(() => {
    if (!hasMounted || !isHydrated || !accessToken || !selectedUserId) {
      return;
    }

    void loadSelectedUser(selectedUserId);
  }, [accessToken, hasMounted, isHydrated, selectedUserId]);

  useEffect(() => {
    if (!hasMounted || !isHydrated || !accessToken || !selectedRecordId) {
      return;
    }

    void loadSelectedRecord(selectedRecordId);
  }, [accessToken, hasMounted, isHydrated, selectedRecordId]);

  const refreshAll = async () => {
    await loadDashboard();
    if (selectedUserId) {
      await loadSelectedUser(selectedUserId);
    }
    if (selectedRecordId) {
      await loadSelectedRecord(selectedRecordId);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!hasMounted || !isHydrated || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f4f9] font-sans text-slate-800 transition-colors duration-200 dark:bg-[#070a13] dark:text-slate-100">
      <aside className="z-30 flex w-64 flex-shrink-0 flex-col justify-between border-r border-slate-200 bg-white dark:border-white/5 dark:bg-[#0e1628]">
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[var(--brand-color)]" />
              <span className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">PT/IM</span>
            </div>
          </div>

          <div className="px-5 pb-2 pt-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Clinical Workspace</div>

          <nav className="space-y-1 px-3">
            {[
              { id: "dashboard", label: "Dashboard", icon: TrendingUp },
              { id: "injury", label: "Injury Queue", icon: Activity },
              { id: "records", label: "Medical Records", icon: FileText },
              { id: "quarterly", label: "Quarterly", icon: Calendar },
              { id: "scs", label: "SCS Coordination", icon: MessageSquare },
              { id: "handoff", label: "IDMT Handoff", icon: Send },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all duration-150 ${
                    activeTab === item.id
                      ? "bg-[var(--brand-color)]/10 text-[var(--brand-color)]"
                      : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-800 dark:hover:bg-slate-900/60 dark:hover:text-white"
                  }`}
                  type="button"
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-slate-200 p-4 dark:border-white/5">
          <button onClick={() => router.push("/dashboard/profile")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white" type="button">
            <ArrowLeft className="size-4" />
            My profile
          </button>
          <button onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50/50 hover:text-red-600 dark:hover:bg-red-950/20" type="button">
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="z-20 flex h-14 w-full flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-white/5 dark:bg-[#0e1628] md:px-8">
          <div className="flex items-center gap-2">
            <AscendLogo width={20} height={20} showDetails={false} />
            <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">Ascend</span>
            <span className="select-none text-xs font-light text-slate-400 dark:text-slate-500">/</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">PT/IM clinical workspace</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-slate-200 pr-6 dark:border-white/5">
              <IconButton
                icon={Bell}
                aria-label="Notifications"
                className="relative p-1.5 text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
                iconClassName="size-4.5"
              >
                <span className="absolute right-1 top-1 size-2 rounded-full bg-[var(--brand-color)] ring-2 ring-white dark:ring-[#0e1628]" />
              </IconButton>
              <IconButton
                icon={theme === "light" ? Moon : Sun}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                onClick={toggleTheme}
                className="p-1.5 text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
                iconClassName="size-4.5"
              />
            </div>

            <button onClick={() => router.push("/dashboard/profile")} className="flex items-center gap-3" type="button">
              <div className="flex flex-col items-end text-right">
                <span className="block text-xs font-bold text-slate-800 dark:text-white">{currentUser?.name}</span>
                <span className="block text-[10px] leading-tight text-slate-400 dark:text-slate-500">{currentUser?.unit}</span>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-cyan-500 text-xs font-black text-white dark:border-white/5">
                {currentUser?.initials}
              </div>
            </button>
          </div>
        </header>

        <div className="z-10 flex h-6 w-full flex-shrink-0 items-center justify-center border-b border-slate-800 bg-slate-900 px-6 text-[9px] font-mono tracking-wider text-slate-500 select-none">
          <span className="mr-2 text-[var(--brand-color)]">•</span>
          CUI // OPSEC · Live PT/IM data only · Record access, review, and handoffs are audit-logged
        </div>

        <main className="flex-1 space-y-8 overflow-y-auto bg-[#f8fafc] px-6 py-8 dark:bg-[#070a13] md:px-8">
          <SectionTitle
            kicker="Clinical Support"
            title="PT/IM Operations"
            description="The PT/IM role now uses live dashboard, record, quarterly, SCS coordination, and handoff APIs instead of frontend mock data."
            actions={
              <>
                <button onClick={() => void refreshAll()} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" type="button">
                  Refresh
                </button>
                <button onClick={() => setShowPlanModal(true)} className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white" type="button">
                  Update operator
                </button>
              </>
            }
          />

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-950/20">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#0e1628]" />
              ))}
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard title="Assigned Count" value={formatNumber(dashboard?.assigned_count)} subtext="Operators assigned to this PT/IM login." />
                    <MetricCard title="Active Reconditioning" value={formatNumber(dashboard?.active_reconditioning_count)} subtext="Real count from `/dashboard/ptim`." />
                    <MetricCard title="Pending Reviews" value={formatNumber(dashboard?.pending_review_total)} subtext="Pending record review total from backend." accent="text-amber-500" />
                    <MetricCard title="Uploaded Records" value={formatNumber(records?.records.length)} subtext="Current uploaded record rows available to PT/IM." />
                  </div>

                  <div className="grid gap-6 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                      <CardHeader title="Operator Queue" subtitle="Live PT/IM operator rows from `/dashboard/ptim`." />
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead className="text-slate-400">
                          <tr>
                            <th className="pb-3 font-semibold">Operator</th>
                            <th className="pb-3 font-semibold">Assignment</th>
                            <th className="pb-3 font-semibold">Phase</th>
                            <th className="pb-3 font-semibold">Clearance</th>
                            <th className="pb-3 font-semibold">Severity</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {(dashboard?.operators ?? []).map((row, index) => (
                              <tr key={String(getRecordId(row) ?? index)}>
                                <td className="py-3 font-semibold text-slate-900 dark:text-white">{getRecordTitle(row)}</td>
                                <td className="py-3 text-slate-500">{stringifyValue(getRecordValue(row, ["flight_name", "unit_name", "role"]))}</td>
                                <td className="py-3 text-slate-500">{stringifyValue(getRecordValue(row, ["phase", "reconditioning_phase"]))}</td>
                                <td className="py-3 text-slate-500">{stringifyValue(getRecordValue(row, ["ptim_clearance_status", "clearance_status"]))}</td>
                                <td className="py-3 text-slate-500">{stringifyValue(getRecordValue(row, ["severity_level", "injury_severity"]))}</td>
                              </tr>
                            ))}
                            {(dashboard?.operators ?? []).length === 0 && <EmptyRow colSpan={5} label="No PT/IM operator rows are returned for this account right now." />}
                          </tbody>
                        </table>
                      </div>
                    </Card>

                    <Card>
                      <CardHeader title="Selected User Scope" subtitle="The live scoped endpoints below run against the selected operator." />
                      <SimpleKeyValueList
                        rows={[
                          { label: "Selected operator", value: selectedOperator?.name ?? currentUser?.name ?? "—" },
                          { label: "Flight / unit", value: selectedOperator?.subtitle ?? currentUser?.unit ?? "—" },
                          { label: "OFT status", value: oftRecord?.current_status ?? "—" },
                          { label: "Latest result", value: oftRecord?.latest_pass_fail ?? "—" },
                          { label: "Next review", value: formatDate(String(getRecordValue((timeline?.events?.[0] as Record<string, unknown>) ?? {}, ["date", "created_at", "event_date"]))) },
                          { label: "ROM rows", value: formatNumber(romMeasurements?.measurements.length) },
                          { label: "Summary rows", value: formatNumber(performanceSummaries?.summaries.length) },
                        ]}
                      />
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "injury" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader title="Injury Queue" subtitle="Same PT/IM operator row data, surfaced as the injury queue view." />
                    <div className="flex gap-3">
                      <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-900">
                        {operatorOptions.length === 0 && <option value="">No operators returned</option>}
                        {operatorOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name} • {option.subtitle}
                          </option>
                        ))}
                        {currentUser?.id && !operatorOptions.some((option) => option.id === currentUser.id) && <option value={currentUser.id}>{currentUser.name} • {currentUser.unit}</option>}
                      </select>
                      <button onClick={() => setShowPlanModal(true)} className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white" type="button">
                        Update injury fields
                      </button>
                    </div>
                  </Card>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                      <CardHeader title="Reconditioning Timeline" subtitle="Live treatment timeline from the backend." />
                      {(timeline?.events ?? []).length === 0 ? (
                        <EmptyState label="No timeline events are currently available for the selected user." />
                      ) : (
                        <div className="space-y-3">
                          {(timeline?.events ?? []).map((event, index) => (
                            <div key={String(getRecordId(event) ?? index)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{getRecordTitle(event)}</p>
                                <span className="font-mono text-[11px] text-slate-500">{formatDate(String(getRecordValue(event, ["date", "created_at", "event_date"])), true)}</span>
                              </div>
                              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{stringifyValue(getRecordValue(event, ["description", "summary", "note", "details"]))}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    <Card>
                      <CardHeader title="OFT + RTD Snapshot" subtitle="Live OFT record plus current plan fields controlled by PT/IM." />
                      <SimpleKeyValueList
                        rows={[
                          { label: "Current status", value: oftRecord?.current_status ?? "—" },
                          { label: "Latest pass/fail", value: oftRecord?.latest_pass_fail ?? "—" },
                          { label: "Latest test", value: formatDate(oftRecord?.latest_test_date) },
                          { label: "Next scheduled", value: formatDate(oftRecord?.next_scheduled_date) },
                          { label: "Annual tests", value: formatNumber(oftRecord?.annual_test_count) },
                          { label: "RTD gate", value: "Use Update operator to set RTD fields" },
                        ]}
                      />
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "records" && (
                <div className="space-y-6">
                  <div className="grid gap-6 xl:grid-cols-3">
                    <Card>
                      <CardHeader title="Record Actions" subtitle="Review, widen access, reveal fields, ROM, and performance summary authoring." />
                      <div className="space-y-3">
                        <button onClick={() => setShowRecordReviewModal(true)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" type="button">
                          <span>Review / reveal record</span>
                          <Shield className="size-4" />
                        </button>
                        <button onClick={() => setShowRomModal(true)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" type="button">
                          <span>Add ROM measurement</span>
                          <Activity className="size-4" />
                        </button>
                        <button onClick={() => setShowSummaryModal(true)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" type="button">
                          <span>Author performance summary</span>
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </Card>

                    <Card className="xl:col-span-2">
                      <CardHeader title="Uploaded Records" subtitle="Real records returned by `/records/uploads?document_type=all`." />
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead className="text-slate-400">
                            <tr>
                              <th className="pb-3 font-semibold">Record</th>
                              <th className="pb-3 font-semibold">Type / Date</th>
                              <th className="pb-3 font-semibold">Status</th>
                              <th className="pb-3 font-semibold">Open</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {(records?.records ?? []).map((row, index) => {
                              const id = getRecordId(row);
                              return (
                                <tr key={String(id ?? index)}>
                                  <td className="py-3 font-semibold text-slate-900 dark:text-white">{getRecordTitle(row)}</td>
                                  <td className="py-3 text-slate-500">
                                    {stringifyValue(getRecordValue(row, ["document_type", "content_type", "record_type"]))}
                                    {" · "}
                                    {formatDate(String(getRecordValue(row, ["created_at", "uploaded_at", "encounter_date"])))}
                                  </td>
                                  <td className="py-3">
                                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone(String(getRecordValue(row, ["status", "approved_visibility_level", "review_status"])))}`}>
                                      {stringifyValue(getRecordValue(row, ["status", "approved_visibility_level", "review_status"]))}
                                    </span>
                                  </td>
                                  <td className="py-3">
                                    <button
                                      onClick={() => {
                                        if (id) {
                                          setSelectedRecordId(id);
                                          setRecordReviewForm((prev) => ({ ...prev, recordId: id }));
                                        }
                                      }}
                                      className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200"
                                      disabled={!id}
                                      type="button"
                                    >
                                      Select
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {(records?.records ?? []).length === 0 && <EmptyRow colSpan={4} label="No uploaded records are available for this PT/IM login right now." />}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                      <CardHeader title="Record Detail" subtitle="Live record detail for the selected medical record." />
                      <div className="space-y-4">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-white/5 dark:bg-slate-900/50 dark:text-slate-300">
                          Selected record: <span className="font-semibold text-slate-700 dark:text-slate-100">{selectedRecord ? getRecordTitle(selectedRecord) : "No record selected"}</span>
                        </div>
                        <select value={selectedRecordId} onChange={(event) => setSelectedRecordId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-900">
                          {(records?.records ?? []).length === 0 && <option value="">No records returned</option>}
                          {(records?.records ?? []).map((row, index) => {
                            const id = getRecordId(row);
                            return (
                              <option key={String(id ?? index)} value={id ?? ""}>
                                {getRecordTitle(row)} • {stringifyValue(getRecordValue(row, ["document_type", "content_type", "record_type"]))}
                              </option>
                            );
                          })}
                        </select>
                        <div className="flex gap-3">
                          <button onClick={() => void loadSelectedRecord(selectedRecordId)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200" type="button">Reload detail</button>
                          <button
                            onClick={async () => {
                              if (!accessToken || !selectedRecordId) return;
                              setIsMutating(true);
                              try {
                                const file = await getUploadedRecordFile(accessToken, selectedRecordId);
                                const bytes = Uint8Array.from(atob(file.content_base64), (char) => char.charCodeAt(0));
                                const blob = new Blob([bytes], { type: file.content_type });
                                const url = URL.createObjectURL(blob);
                                const anchor = document.createElement("a");
                                anchor.href = url;
                                anchor.download = file.file_name;
                                anchor.click();
                                URL.revokeObjectURL(url);
                                triggerToast("Medical record file downloaded from the backend.");
                              } catch (nextError) {
                                triggerToast(getApiErrorMessage(nextError));
                              } finally {
                                setIsMutating(false);
                              }
                            }}
                            disabled={!selectedRecordId || isMutating}
                            className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                            type="button"
                          >
                            Download file
                          </button>
                        </div>
                        <JsonPreview data={recordDetail} emptyLabel="No record detail has been loaded yet." />
                      </div>
                    </Card>

                    <Card>
                      <CardHeader title="ROM + Summary Scope" subtitle="Live ROM and performance summary data for the selected operator." />
                      <div className="space-y-4">
                        <SimpleKeyValueList
                          rows={[
                            { label: "ROM rows", value: formatNumber(romMeasurements?.measurements.length) },
                            { label: "Summary rows", value: formatNumber(performanceSummaries?.summaries.length) },
                            { label: "Selected operator", value: selectedOperator?.name ?? currentUser?.name ?? "—" },
                            { label: "Summary visibility target", value: summaryVisibilityForm.approvedVisibilityLevel },
                          ]}
                        />
                        <JsonPreview data={romMeasurements} emptyLabel="No ROM measurements loaded." />
                        <JsonPreview data={performanceSummaries} emptyLabel="No performance summaries loaded." />
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
                          <select value={summaryVisibilityForm.summaryId} onChange={(event) => setSummaryVisibilityForm((prev) => ({ ...prev, summaryId: event.target.value.trim() }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-900">
                            {summaryOptions.length === 0 && <option value="">No summaries returned</option>}
                            {summaryOptions.map((option) => (
                              <option key={`${option.id}-${option.index}`} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <select value={summaryVisibilityForm.approvedVisibilityLevel} onChange={(event) => setSummaryVisibilityForm((prev) => ({ ...prev, approvedVisibilityLevel: event.target.value as "draft" | "approved" | "approved_with_medical" }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-900">
                            <option value="draft">draft</option>
                            <option value="approved">approved</option>
                            <option value="approved_with_medical">approved_with_medical</option>
                          </select>
                          <button
                            onClick={async () => {
                              if (!accessToken || !summaryVisibilityForm.summaryId) return;
                              setIsMutating(true);
                              try {
                                await setPerformanceSummaryVisibility(accessToken, summaryVisibilityForm.summaryId, summaryVisibilityForm.approvedVisibilityLevel);
                                triggerToast("Performance summary visibility updated.");
                                await refreshAll();
                              } catch (nextError) {
                                triggerToast(getApiErrorMessage(nextError));
                              } finally {
                                setIsMutating(false);
                              }
                            }}
                            disabled={!summaryVisibilityForm.summaryId || isMutating}
                            className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                            type="button"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "quarterly" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader title="Quarter Filters" subtitle="Real DoD fiscal quarter views from the PT/IM quarterly endpoints." />
                    <div className="grid gap-4 md:grid-cols-[200px_200px_auto]">
                      <input value={String(selectedFiscalYear)} onChange={(event) => setSelectedFiscalYear(Number(event.target.value) || 2026)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-900" />
                      <select value={selectedQuarter} onChange={(event) => setSelectedQuarter(Number(event.target.value) as 1 | 2 | 3 | 4)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-900">
                        <option value={1}>Q1</option>
                        <option value={2}>Q2</option>
                        <option value={3}>Q3</option>
                        <option value={4}>Q4</option>
                      </select>
                      <button onClick={() => void loadDashboard()} className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white" type="button">
                        Reload quarter
                      </button>
                    </div>
                  </Card>

                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard title="Window Start" value={formatDate(quarterlyFlightReport?.window_start)} subtext="Closed fiscal quarter start." />
                    <MetricCard title="Window End" value={formatDate(quarterlyFlightReport?.window_end)} subtext="Closed fiscal quarter end." />
                    <MetricCard title="Flights Returned" value={formatNumber(quarterlyFlightReport?.flights.length)} subtext="Real by-flight rows for this quarter." />
                    <MetricCard title="Min Cohort Size" value={formatNumber(quarterlyFlightReport?.min_cohort_size)} subtext="Applied k-gating threshold." />
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                      <CardHeader title="By Flight" subtitle="Real per-flight injury rates and active injury counts." />
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead className="text-slate-400">
                            <tr>
                              <th className="pb-3 font-semibold">Flight</th>
                              <th className="pb-3 font-semibold">Cohort</th>
                              <th className="pb-3 font-semibold">Active injuries</th>
                              <th className="pb-3 font-semibold">Active rate</th>
                              <th className="pb-3 font-semibold">Incidence / 100 PM</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {(quarterlyFlightReport?.flights ?? []).map((row, index) => (
                              <tr key={String(getRecordId(row) ?? index)}>
                                <td className="py-3 font-semibold text-slate-900 dark:text-white">{getRecordTitle(row)}</td>
                                <td className="py-3 text-slate-500">{formatNumber(getRecordValue(row, ["cohort_size"]))}</td>
                                <td className="py-3 text-slate-500">{formatNumber(getRecordValue(row, ["active_injury_count"]))}</td>
                                <td className="py-3 text-slate-500">{formatPercent(getRecordValue(row, ["active_injury_rate_pct"]))}</td>
                                <td className="py-3 text-slate-500">{formatNumber(getRecordValue(row, ["incidence_rate_per_100_person_months"]))}</td>
                              </tr>
                            ))}
                            {(quarterlyFlightReport?.flights ?? []).length === 0 && <EmptyRow colSpan={5} label="No by-flight quarterly data is returned for this selection." />}
                          </tbody>
                        </table>
                      </div>
                    </Card>

                    <Card>
                      <CardHeader title="Injury Types" subtitle="Real k-gated type breakdown with suppression preserved." />
                      {(injuryTypes?.types ?? []).length === 0 ? (
                        <EmptyState label="No injury-type rows are returned for this quarter." />
                      ) : (
                        <div className="space-y-3">
                          {(injuryTypes?.types ?? []).map((type) => (
                            <div key={type.injury_type} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/5 dark:bg-slate-900/50">
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{formatLabel(type.injury_type)}</p>
                                <p className="mt-1 text-[11px] text-slate-500">{type.suppressed ? "Suppressed by real cohort-k gating" : "Visible from live backend"}</p>
                              </div>
                              <span className="font-mono text-slate-500">{type.count === null ? "suppressed" : type.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>

                  <Card>
                    <CardHeader title="All Fiscal Quarters" subtitle="Quarter history returned by the quarterly aggregate endpoint." />
                    {(quarterlyHistory?.quarters ?? []).length === 0 ? (
                      <EmptyState label="No quarterly history was returned." />
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {quarterlyHistory?.quarters.map((quarter) => (
                          <div key={quarter.quarter} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Q{quarter.quarter}</p>
                            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{formatNumber(quarter.flights.length)}</p>
                            <p className="mt-1 text-xs text-slate-500">flight rows · {formatDate(quarter.window_start)} to {formatDate(quarter.window_end)}</p>
                            <p className="mt-3 text-[11px] text-slate-500">Flights meeting threshold: {formatNumber(quarter.flights_meeting_cohort_minimum)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {activeTab === "scs" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader title="Joint Coordination" subtitle="Uses the live recommendation list plus PT/IM signoff actions from the role collection." />
                    {recommendations?.recommendations?.length ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead className="text-slate-400">
                            <tr>
                              <th className="pb-3 font-semibold">Recommendation</th>
                              <th className="pb-3 font-semibold">Component</th>
                              <th className="pb-3 font-semibold">Joint</th>
                              <th className="pb-3 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {recommendations.recommendations.map((row, index) => (
                              <tr key={String(getRecordId(row) ?? index)}>
                                <td className="py-3 font-semibold text-slate-900 dark:text-white">{getRecordTitle(row)}</td>
                                <td className="py-3 text-slate-500">{stringifyValue(getRecordValue(row, ["readiness_component"]))}</td>
                                <td className="py-3 text-slate-500">{stringifyValue(getRecordValue(row, ["is_joint_coordination"]))}</td>
                                <td className="py-3">
                                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone(String(getRecordValue(row, ["status", "state"])))}`}>
                                    {stringifyValue(getRecordValue(row, ["status", "state"]))}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState label="No active recommendation rows are currently returned for PT/IM." />
                    )}
                  </Card>

                  <Card>
                    <CardHeader title="Recommendation Actions" subtitle="Use the selected recommendation’s live backend action buttons." />
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                      <select value={recommendationActionId} onChange={(event) => setRecommendationActionId(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-900">
                        <option value="">Select recommendation</option>
                        {(recommendations?.recommendations ?? []).map((row, index) => {
                          const id = getRecordId(row);
                          return (
                            <option key={String(id ?? index)} value={id ?? ""}>
                              {getRecordTitle(row)} • {stringifyValue(getRecordValue(row, ["status", "readiness_component"]))}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        onClick={async () => {
                          if (!accessToken || !recommendationActionId) return;
                          setIsMutating(true);
                          try {
                            await sendRecommendationForSignoff(accessToken, recommendationActionId);
                            triggerToast("Recommendation sent for signoff.");
                            await refreshAll();
                          } catch (nextError) {
                            triggerToast(getApiErrorMessage(nextError));
                          } finally {
                            setIsMutating(false);
                          }
                        }}
                        disabled={!recommendationActionId || isMutating}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 dark:border-white/10 dark:text-slate-200"
                        type="button"
                      >
                        Send for signoff
                      </button>
                      <button
                        onClick={async () => {
                          if (!accessToken || !recommendationActionId) return;
                          setIsMutating(true);
                          try {
                            await signOffRecommendation(accessToken, recommendationActionId);
                            triggerToast("Recommendation signed off by PT/IM.");
                            await refreshAll();
                          } catch (nextError) {
                            triggerToast(getApiErrorMessage(nextError));
                          } finally {
                            setIsMutating(false);
                          }
                        }}
                        disabled={!recommendationActionId || isMutating}
                        className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        type="button"
                      >
                        Sign off
                      </button>
                    </div>
                    {selectedRecommendation && (
                      <p className="mt-3 text-xs text-slate-500">Selected: {getRecordTitle(selectedRecommendation)} • {stringifyValue(getRecordValue(selectedRecommendation, ["status", "readiness_component"]))}</p>
                    )}
                  </Card>
                </div>
              )}

              {activeTab === "handoff" && (
                <div className="space-y-6">
                  <div className="grid gap-6 xl:grid-cols-3">
                    <Card>
                      <CardHeader title="Handoff Actions" subtitle="Single-user and cohort handoff creation against the real IDMT API." />
                      <div className="space-y-3">
                        <button onClick={() => setShowHandoffModal(true)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" type="button">
                          <span>Create handoff</span>
                          <Send className="size-4" />
                        </button>
                        <button onClick={() => setShowBatchHandoffModal(true)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" type="button">
                          <span>Create batch handoffs</span>
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </Card>

                    <Card className="xl:col-span-2">
                      <CardHeader title="Transmission Actions" subtitle="Use a selected handoff row for transmit or download actions." />
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                        <select value={handoffActionId} onChange={(event) => setHandoffActionId(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-900">
                          <option value="">Select handoff</option>
                          {(handoffs?.handoffs ?? []).map((row, index) => {
                            const id = getRecordId(row);
                            return (
                              <option key={String(id ?? index)} value={id ?? ""}>
                                {getRecordTitle(row)} • {stringifyValue(getRecordValue(row, ["status", "export_type"]))}
                              </option>
                            );
                          })}
                        </select>
                        <button
                          onClick={async () => {
                            if (!accessToken || !handoffActionId) return;
                            setIsMutating(true);
                            try {
                              await markIdmtHandoffTransmitted(accessToken, handoffActionId);
                              triggerToast("Handoff marked transmitted.");
                              await refreshAll();
                            } catch (nextError) {
                              triggerToast(getApiErrorMessage(nextError));
                            } finally {
                              setIsMutating(false);
                            }
                          }}
                          disabled={!handoffActionId || isMutating}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 dark:border-white/10 dark:text-slate-200"
                          type="button"
                        >
                          Mark transmitted
                        </button>
                        <button
                          onClick={async () => {
                            if (!accessToken || !handoffActionId) return;
                            setIsMutating(true);
                            try {
                              const blob = await downloadIdmtHandoffSummary(accessToken, handoffActionId);
                              const url = URL.createObjectURL(blob);
                              const anchor = document.createElement("a");
                              anchor.href = url;
                              anchor.download = `${selectedHandoff ? getRecordTitle(selectedHandoff).replace(/\s+/g, "-").toLowerCase() : "idmt-handoff"}.pdf`;
                              anchor.click();
                              URL.revokeObjectURL(url);
                              triggerToast("Handoff summary downloaded.");
                            } catch (nextError) {
                              triggerToast(getApiErrorMessage(nextError));
                            } finally {
                              setIsMutating(false);
                            }
                          }}
                          disabled={!handoffActionId || isMutating}
                          className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          type="button"
                        >
                          Download summary
                        </button>
                      </div>
                      {selectedHandoff && (
                        <p className="mt-3 text-xs text-slate-500">Selected: {getRecordTitle(selectedHandoff)} • {stringifyValue(getRecordValue(selectedHandoff, ["status", "export_type"]))}</p>
                      )}
                    </Card>
                  </div>

                  {handoffError && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-950/20">
                      IDMT handoff list access currently returns: {handoffError}
                    </div>
                  )}

                  <Card>
                    <CardHeader title="Handoff List" subtitle="Shows real handoff rows when the backend permits this PT/IM account." />
                    {handoffs?.handoffs?.length ? (
                      <div className="space-y-3">
                        {handoffs.handoffs.map((row, index) => (
                          <div key={String(getRecordId(row) ?? index)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{getRecordTitle(row)}</p>
                              <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone(String(getRecordValue(row, ["status"])))}`}>
                                {stringifyValue(getRecordValue(row, ["status"]))}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                              Export type: {stringifyValue(getRecordValue(row, ["export_type"]))} · Format: {stringifyValue(getRecordValue(row, ["export_format"]))}
                            </p>
                            <p className="mt-2 text-[11px] text-slate-400">
                              Created: {formatDate(String(getRecordValue(row, ["created_at", "requested_at", "updated_at"])), true)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState label={handoffError ? "The handoff endpoint is not currently accessible to this PT/IM login." : "No handoff rows are currently returned."} />
                    )}
                  </Card>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <AccessibleDialog open={showPlanModal} onClose={() => setShowPlanModal(false)} className="w-full max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0e1628]">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Update Injury / Reconditioning Fields</h2>
          <p className="mt-1 text-xs text-slate-500">Writes to the PT/IM reconditioning endpoint, including the RTD gate fields added in the latest backend.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <select value={planForm.userId} onChange={(event) => setPlanForm((prev) => ({ ...prev, userId: event.target.value.trim() }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            {operatorOptions.length === 0 && <option value="">No operators returned</option>}
            {operatorOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} • {option.subtitle}
              </option>
            ))}
          </select>
          <input value={planForm.phase} onChange={(event) => setPlanForm((prev) => ({ ...prev, phase: event.target.value }))} placeholder="Phase" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input value={planForm.sessionsCompleted} onChange={(event) => setPlanForm((prev) => ({ ...prev, sessionsCompleted: event.target.value }))} placeholder="Sessions completed" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input value={planForm.sessionsTotal} onChange={(event) => setPlanForm((prev) => ({ ...prev, sessionsTotal: event.target.value }))} placeholder="Sessions total" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input value={planForm.cadenceNote} onChange={(event) => setPlanForm((prev) => ({ ...prev, cadenceNote: event.target.value }))} placeholder="Cadence note" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input value={planForm.ptimClearanceStatus} onChange={(event) => setPlanForm((prev) => ({ ...prev, ptimClearanceStatus: event.target.value }))} placeholder="PT/IM clearance status" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input type="date" value={planForm.nextReviewDate} onChange={(event) => setPlanForm((prev) => ({ ...prev, nextReviewDate: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input value={planForm.scsCoordinationStatus} onChange={(event) => setPlanForm((prev) => ({ ...prev, scsCoordinationStatus: event.target.value }))} placeholder="SCS coordination status" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input value={planForm.severityLevel} onChange={(event) => setPlanForm((prev) => ({ ...prev, severityLevel: event.target.value }))} placeholder="Severity level" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input type="date" value={planForm.injuryReportedOn} onChange={(event) => setPlanForm((prev) => ({ ...prev, injuryReportedOn: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input value={planForm.rtdSourceAuthority} onChange={(event) => setPlanForm((prev) => ({ ...prev, rtdSourceAuthority: event.target.value }))} placeholder="RTD source authority" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input type="date" value={planForm.rtdDecisionDate} onChange={(event) => setPlanForm((prev) => ({ ...prev, rtdDecisionDate: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input type="date" value={planForm.rtdReevaluationDate} onChange={(event) => setPlanForm((prev) => ({ ...prev, rtdReevaluationDate: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        </div>
        <textarea value={planForm.injuryFlags} onChange={(event) => setPlanForm((prev) => ({ ...prev, injuryFlags: event.target.value }))} placeholder="Injury flags, comma separated" rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        <textarea value={planForm.rehabStrategySummary} onChange={(event) => setPlanForm((prev) => ({ ...prev, rehabStrategySummary: event.target.value }))} placeholder="Rehab strategy summary" rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={planForm.limitationFlag} onChange={(event) => setPlanForm((prev) => ({ ...prev, limitationFlag: event.target.checked }))} />
            Limitation flag enabled
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={planForm.rtdVerified} onChange={(event) => setPlanForm((prev) => ({ ...prev, rtdVerified: event.target.checked }))} />
            RTD verified
          </label>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowPlanModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-white/10" type="button">Cancel</button>
          <button
            onClick={async () => {
              if (!accessToken || !planForm.userId || !planForm.phase.trim()) return;
              setIsMutating(true);
              try {
                await upsertReconditioningPlan(accessToken, planForm.userId, {
                  phase: planForm.phase.trim(),
                  sessions_completed: Number(planForm.sessionsCompleted) || 0,
                  sessions_total: Number(planForm.sessionsTotal) || 0,
                  cadence_note: planForm.cadenceNote.trim(),
                  injury_flags: planForm.injuryFlags.split(",").map((value) => value.trim()).filter(Boolean),
                  ptim_clearance_status: planForm.ptimClearanceStatus.trim(),
                  next_review_date: planForm.nextReviewDate,
                  limitation_flag: planForm.limitationFlag,
                  rehab_strategy_summary: planForm.rehabStrategySummary.trim(),
                  scs_coordination_status: planForm.scsCoordinationStatus.trim(),
                  severity_level: planForm.severityLevel.trim(),
                  injury_reported_on: planForm.injuryReportedOn,
                  rtd_source_authority: planForm.rtdSourceAuthority.trim() || undefined,
                  rtd_decision_date: planForm.rtdDecisionDate || undefined,
                  rtd_verified: planForm.rtdVerified,
                  rtd_reevaluation_date: planForm.rtdReevaluationDate || undefined,
                });
                triggerToast("PT/IM reconditioning fields saved in the backend.");
                setShowPlanModal(false);
                await refreshAll();
              } catch (nextError) {
                triggerToast(getApiErrorMessage(nextError));
              } finally {
                setIsMutating(false);
              }
            }}
            disabled={!planForm.userId || !planForm.phase.trim() || isMutating}
            className="flex-1 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            type="button"
          >
            Save
          </button>
        </div>
      </AccessibleDialog>

      <AccessibleDialog open={showRomModal} onClose={() => setShowRomModal(false)}>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add ROM Measurement</h2>
          <p className="mt-1 text-xs text-slate-500">Adds a real ROM measurement for the selected operator.</p>
        </div>
        <div className="space-y-4">
          <select value={romForm.userId} onChange={(event) => setRomForm((prev) => ({ ...prev, userId: event.target.value.trim() }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            {operatorOptions.length === 0 && <option value="">No operators returned</option>}
            {operatorOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} • {option.subtitle}
              </option>
            ))}
          </select>
          <select value={romForm.movement} onChange={(event) => setRomForm((prev) => ({ ...prev, movement: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            <option value="shoulder_flexion">shoulder_flexion</option>
            <option value="shoulder_abduction">shoulder_abduction</option>
            <option value="knee_flexion">knee_flexion</option>
            <option value="hip_flexion">hip_flexion</option>
            <option value="straight_leg_raise">straight_leg_raise</option>
            <option value="other">other</option>
          </select>
          <input value={romForm.valueDegrees} onChange={(event) => setRomForm((prev) => ({ ...prev, valueDegrees: event.target.value }))} placeholder="Degrees" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input type="date" value={romForm.measuredDate} onChange={(event) => setRomForm((prev) => ({ ...prev, measuredDate: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <textarea value={romForm.note} onChange={(event) => setRomForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="Note" rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowRomModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-white/10" type="button">Cancel</button>
          <button
            onClick={async () => {
              if (!accessToken || !romForm.userId || !romForm.movement) return;
              setIsMutating(true);
              try {
                await addRomMeasurement(accessToken, romForm.userId, {
                  movement: romForm.movement,
                  value_degrees: Number(romForm.valueDegrees) || 0,
                  measured_date: romForm.measuredDate,
                  note: romForm.note.trim() || undefined,
                });
                triggerToast("ROM measurement saved in the backend.");
                setShowRomModal(false);
                await refreshAll();
              } catch (nextError) {
                triggerToast(getApiErrorMessage(nextError));
              } finally {
                setIsMutating(false);
              }
            }}
            disabled={!romForm.userId || isMutating}
            className="flex-1 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            type="button"
          >
            Save
          </button>
        </div>
      </AccessibleDialog>

      <AccessibleDialog open={showSummaryModal} onClose={() => setShowSummaryModal(false)} className="w-full max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0e1628]">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Author Performance Summary</h2>
          <p className="mt-1 text-xs text-slate-500">Creates a role-scoped performance summary from PT/IM.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <select value={summaryForm.userId} onChange={(event) => setSummaryForm((prev) => ({ ...prev, userId: event.target.value.trim() }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            {operatorOptions.length === 0 && <option value="">No operators returned</option>}
            {operatorOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} • {option.subtitle}
              </option>
            ))}
          </select>
          <input value={summaryForm.specialistNotesLink} onChange={(event) => setSummaryForm((prev) => ({ ...prev, specialistNotesLink: event.target.value }))} placeholder="Specialist note IDs, comma separated" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        </div>
        <textarea value={summaryForm.injuryHistorySummary} onChange={(event) => setSummaryForm((prev) => ({ ...prev, injuryHistorySummary: event.target.value }))} placeholder="Injury history summary" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        <textarea value={summaryForm.limitationsSummary} onChange={(event) => setSummaryForm((prev) => ({ ...prev, limitationsSummary: event.target.value }))} placeholder="Limitations summary" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        <textarea value={summaryForm.returnToPerformanceConsiderations} onChange={(event) => setSummaryForm((prev) => ({ ...prev, returnToPerformanceConsiderations: event.target.value }))} placeholder="Return-to-performance considerations" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        <textarea value={summaryForm.nutritionConsiderations} onChange={(event) => setSummaryForm((prev) => ({ ...prev, nutritionConsiderations: event.target.value }))} placeholder="Nutrition considerations" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        <textarea value={summaryForm.sleepRecoveryConsiderations} onChange={(event) => setSummaryForm((prev) => ({ ...prev, sleepRecoveryConsiderations: event.target.value }))} placeholder="Sleep recovery considerations" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        <textarea value={summaryForm.medicationAllergyConsiderationsIfAuthorized} onChange={(event) => setSummaryForm((prev) => ({ ...prev, medicationAllergyConsiderationsIfAuthorized: event.target.value }))} placeholder="Medication / allergy considerations if authorized" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        <div className="flex gap-3">
          <button onClick={() => setShowSummaryModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-white/10" type="button">Cancel</button>
          <button
            onClick={async () => {
              if (!accessToken || !summaryForm.userId || !summaryForm.limitationsSummary.trim()) return;
              setIsMutating(true);
              try {
                await createPerformanceSummary(accessToken, summaryForm.userId, {
                  injury_history_summary: summaryForm.injuryHistorySummary.trim(),
                  limitations_summary: summaryForm.limitationsSummary.trim(),
                  return_to_performance_considerations: summaryForm.returnToPerformanceConsiderations.trim(),
                  nutrition_considerations: summaryForm.nutritionConsiderations.trim(),
                  sleep_recovery_considerations: summaryForm.sleepRecoveryConsiderations.trim(),
                  medication_allergy_considerations_if_authorized: summaryForm.medicationAllergyConsiderationsIfAuthorized.trim(),
                  specialist_notes_link: summaryForm.specialistNotesLink.split(",").map((value) => value.trim()).filter(Boolean),
                });
                triggerToast("Performance summary created in the backend.");
                setShowSummaryModal(false);
                await refreshAll();
              } catch (nextError) {
                triggerToast(getApiErrorMessage(nextError));
              } finally {
                setIsMutating(false);
              }
            }}
            disabled={!summaryForm.userId || !summaryForm.limitationsSummary.trim() || isMutating}
            className="flex-1 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            type="button"
          >
            Save
          </button>
        </div>
      </AccessibleDialog>

      <AccessibleDialog open={showRecordReviewModal} onClose={() => setShowRecordReviewModal(false)} className="w-full max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0e1628]">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Review / Reveal Record</h2>
          <p className="mt-1 text-xs text-slate-500">Handles record review, access widening, and field reveal using the selected record.</p>
        </div>
        <div className="space-y-4">
          <select value={recordReviewForm.recordId} onChange={(event) => setRecordReviewForm((prev) => ({ ...prev, recordId: event.target.value.trim() }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            {(records?.records ?? []).length === 0 && <option value="">No records returned</option>}
            {(records?.records ?? []).map((row, index) => {
              const id = getRecordId(row);
              return (
                <option key={String(id ?? index)} value={id ?? ""}>
                  {getRecordTitle(row)} • {stringifyValue(getRecordValue(row, ["document_type", "content_type", "record_type"]))}
                </option>
              );
            })}
          </select>
          <textarea value={recordReviewForm.note} onChange={(event) => setRecordReviewForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="Review note" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={recordReviewForm.approve} onChange={(event) => setRecordReviewForm((prev) => ({ ...prev, approve: event.target.checked }))} />
            Approve review
          </label>
          <input value={recordReviewForm.approvedAccessLevel} onChange={(event) => setRecordReviewForm((prev) => ({ ...prev, approvedAccessLevel: event.target.value }))} placeholder="Approved access levels, comma separated" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input value={recordReviewForm.fieldName} onChange={(event) => setRecordReviewForm((prev) => ({ ...prev, fieldName: event.target.value }))} placeholder="Field name to reveal" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input value={recordReviewForm.reasonCategory} onChange={(event) => setRecordReviewForm((prev) => ({ ...prev, reasonCategory: event.target.value }))} placeholder="Reason category" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <textarea value={recordReviewForm.reason} onChange={(event) => setRecordReviewForm((prev) => ({ ...prev, reason: event.target.value }))} placeholder="Reveal reason" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <button
            onClick={async () => {
              if (!accessToken || !recordReviewForm.recordId) return;
              setIsMutating(true);
              try {
                await reviewUploadedRecord(accessToken, recordReviewForm.recordId, {
                  note: recordReviewForm.note.trim(),
                  approve: recordReviewForm.approve,
                });
                triggerToast("Record review submitted.");
                await refreshAll();
              } catch (nextError) {
                triggerToast(getApiErrorMessage(nextError));
              } finally {
                setIsMutating(false);
              }
            }}
            disabled={!recordReviewForm.recordId || isMutating}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 dark:border-white/10 dark:text-slate-200"
            type="button"
          >
            Review
          </button>
          <button
            onClick={async () => {
              if (!accessToken || !recordReviewForm.recordId) return;
              setIsMutating(true);
              try {
                await updateRecordAccessLevel(accessToken, recordReviewForm.recordId, recordReviewForm.approvedAccessLevel.split(",").map((value) => value.trim()).filter(Boolean));
                triggerToast("Record access level updated.");
                await refreshAll();
              } catch (nextError) {
                triggerToast(getApiErrorMessage(nextError));
              } finally {
                setIsMutating(false);
              }
            }}
            disabled={!recordReviewForm.recordId || isMutating}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 dark:border-white/10 dark:text-slate-200"
            type="button"
          >
            Update access
          </button>
          <button
            onClick={async () => {
              if (!accessToken || !recordReviewForm.recordId || !recordReviewForm.reason.trim()) return;
              setIsMutating(true);
              try {
                await revealRecordField(accessToken, recordReviewForm.recordId, {
                  field_name: recordReviewForm.fieldName.trim(),
                  reason: recordReviewForm.reason.trim(),
                  reason_category: recordReviewForm.reasonCategory.trim(),
                });
                triggerToast("Record field reveal requested.");
                await refreshAll();
              } catch (nextError) {
                triggerToast(getApiErrorMessage(nextError));
              } finally {
                setIsMutating(false);
              }
            }}
            disabled={!recordReviewForm.recordId || !recordReviewForm.reason.trim() || isMutating}
            className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            type="button"
          >
            Reveal field
          </button>
        </div>
      </AccessibleDialog>

      <AccessibleDialog open={showHandoffModal} onClose={() => setShowHandoffModal(false)}>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create IDMT Handoff</h2>
          <p className="mt-1 text-xs text-slate-500">Creates a real handoff request for one user.</p>
        </div>
        <div className="space-y-4">
          <select value={handoffForm.userId} onChange={(event) => setHandoffForm((prev) => ({ ...prev, userId: event.target.value.trim() }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            {operatorOptions.length === 0 && <option value="">No operators returned</option>}
            {operatorOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} • {option.subtitle}
              </option>
            ))}
          </select>
          <select value={handoffForm.exportType} onChange={(event) => setHandoffForm((prev) => ({ ...prev, exportType: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            <option value="injury_summary">injury_summary</option>
            <option value="reconditioning_summary">reconditioning_summary</option>
            <option value="medical_record_summary">medical_record_summary</option>
          </select>
          <select value={handoffForm.exportFormat} onChange={(event) => setHandoffForm((prev) => ({ ...prev, exportFormat: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            <option value="pdf">pdf</option>
            <option value="csv">csv</option>
            <option value="mfr_summary">mfr_summary</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowHandoffModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-white/10" type="button">Cancel</button>
          <button
            onClick={async () => {
              if (!accessToken || !handoffForm.userId) return;
              setIsMutating(true);
              try {
                await createIdmtHandoff(accessToken, {
                  user_id: handoffForm.userId,
                  export_type: handoffForm.exportType,
                  export_format: handoffForm.exportFormat,
                });
                triggerToast("IDMT handoff created in the backend.");
                setShowHandoffModal(false);
                await refreshAll();
              } catch (nextError) {
                triggerToast(getApiErrorMessage(nextError));
              } finally {
                setIsMutating(false);
              }
            }}
            disabled={!handoffForm.userId || isMutating}
            className="flex-1 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            type="button"
          >
            Save
          </button>
        </div>
      </AccessibleDialog>

      <AccessibleDialog open={showBatchHandoffModal} onClose={() => setShowBatchHandoffModal(false)}>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Batch IDMT Handoffs</h2>
          <p className="mt-1 text-xs text-slate-500">Creates real handoffs for each user ID in the list, one by one server-side.</p>
        </div>
        <div className="space-y-4">
          <textarea value={batchHandoffForm.userIds} onChange={(event) => setBatchHandoffForm((prev) => ({ ...prev, userIds: event.target.value }))} placeholder="User IDs, comma separated" rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <select value={batchHandoffForm.exportType} onChange={(event) => setBatchHandoffForm((prev) => ({ ...prev, exportType: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            <option value="injury_summary">injury_summary</option>
            <option value="reconditioning_summary">reconditioning_summary</option>
            <option value="medical_record_summary">medical_record_summary</option>
          </select>
          <select value={batchHandoffForm.exportFormat} onChange={(event) => setBatchHandoffForm((prev) => ({ ...prev, exportFormat: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            <option value="pdf">pdf</option>
            <option value="csv">csv</option>
            <option value="mfr_summary">mfr_summary</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowBatchHandoffModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-white/10" type="button">Cancel</button>
          <button
            onClick={async () => {
              if (!accessToken || !batchHandoffForm.userIds.trim()) return;
              setIsMutating(true);
              try {
                await createIdmtHandoffsBatch(accessToken, {
                  user_ids: batchHandoffForm.userIds.split(",").map((value) => value.trim()).filter(Boolean),
                  export_type: batchHandoffForm.exportType,
                  export_format: batchHandoffForm.exportFormat,
                });
                triggerToast("Batch IDMT handoffs created in the backend.");
                setShowBatchHandoffModal(false);
                await refreshAll();
              } catch (nextError) {
                triggerToast(getApiErrorMessage(nextError));
              } finally {
                setIsMutating(false);
              }
            }}
            disabled={!batchHandoffForm.userIds.trim() || isMutating}
            className="flex-1 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            type="button"
          >
            Save
          </button>
        </div>
      </AccessibleDialog>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white shadow-2xl">
          <CheckCircle className="size-4 text-[var(--brand-color)]" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{kicker}</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
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
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <p className={`mt-1 text-2xl font-black text-slate-900 dark:text-white ${accent ?? ""}`}>{value}</p>
      <p className="mt-1 text-[10px] text-slate-400">{subtext}</p>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#0e1628] ${className}`}>{children}</div>;
}

function CardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4 border-b border-slate-100 pb-3 dark:border-white/5">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-[10px] text-slate-500">{subtitle}</p>
    </div>
  );
}

function SimpleKeyValueList({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <div className="space-y-3 text-xs">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/5 dark:bg-slate-900/50">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{row.label}</span>
          <span className="font-mono text-right text-slate-500">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function JsonPreview({ data, emptyLabel }: { data: unknown; emptyLabel: string }) {
  if (!data) {
    return <EmptyState label={emptyLabel} />;
  }

  return (
    <pre className="max-h-96 overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[11px] text-slate-600 dark:border-white/5 dark:bg-slate-900/50 dark:text-slate-300">
      {JSON.stringify(sanitizeDisplayData(data), null, 2)}
    </pre>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400 dark:border-white/10 dark:bg-slate-900/40">{label}</div>;
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-6 text-center text-slate-400">
        {label}
      </td>
    </tr>
  );
}

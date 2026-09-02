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
  addReconditioningRestriction,
  assignRecommendation,
  createCoverageLog,
  createLeaveRecord,
  createGroupThread,
  createPtSession,
  deleteLeaveRecord,
  downloadMessageAttachment,
  enrollPtSessionAttendee,
  getActiveRecommendations,
  getCoverageLoadByFlight,
  getCoverageLog,
  getGroupThread,
  getGroupThreads,
  getLeaveHistory,
  getLeaveOverlap,
  getMessageThread,
  getMessageTrace,
  getMessageThreads,
  getOftRecord,
  getPerformanceSummaries,
  getReconditioningRestrictions,
  getReconditioningTimeline,
  getRoutingLevels,
  getScsDashboard,
  getScopedWorkoutSummary,
  getScopedWorkouts,
  getUpcomingPtSessions,
  removePtSessionAttendee,
  releaseReconditioningRestriction,
  scanMessage,
  sendGroupMessage,
  sendMessage,
  updatePtSession,
  upsertReconditioningPlan,
  type ActiveRecommendationsResponse,
  type CoverageLoadByFlightResponse,
  type MessageThreadsResponse,
  type LeaveHistoryResponse,
  type LeaveOverlapResponse,
  type OftRecordResponse,
  type PerformanceSummariesResponse,
  type ReconditioningRestrictionsResponse,
  type ReconditioningTimelineResponse,
  type RoutingLevelsResponse,
  type ScsDashboardData,
  type UpcomingPtSessionsResponse,
  type WorkoutListResponse,
  type WorkoutSummaryResponse,
} from "@/lib/role-dashboards-api";
import {
  Activity,
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle,
  ClipboardList,
  FileText,
  Info,
  Landmark,
  LogOut,
  MessageSquare,
  Moon,
  Plus,
  Search,
  Send,
  Sun,
  TrendingUp,
  User,
  Users,
  XCircle,
} from "lucide-react";

type TabType = "overview" | "dashboard" | "people" | "plans" | "coverage" | "messages";

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
  const value = getRecordValue(record, [
    "user_id",
    "operator_user_id",
    "participant_id",
    "other_user_id",
    "recipient_id",
    "id",
  ]);
  return typeof value === "string" ? value : null;
}

function getRecordTitle(record: Record<string, unknown>) {
  const value = getRecordValue(record, [
    "full_name",
    "name",
    "title",
    "operator_name",
    "recipient_name",
    "flight_name",
  ]);
  return stringifyValue(value);
}

function getRecordSubtitle(record: Record<string, unknown>) {
  const value = getRecordValue(record, [
    "flight_name",
    "unit_name",
    "role",
    "status",
    "preview",
    "readiness_component",
  ]);
  return stringifyValue(value);
}

function statusTone(status: string | null | undefined) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized.includes("active") || normalized.includes("ready") || normalized.includes("completed") || normalized.includes("current")) {
    return "bg-emerald-500/10 text-emerald-500";
  }
  if (normalized.includes("pending") || normalized.includes("review") || normalized.includes("scheduled") || normalized.includes("draft")) {
    return "bg-amber-500/10 text-amber-500";
  }
  if (normalized.includes("restrict") || normalized.includes("missed") || normalized.includes("low") || normalized.includes("blocked")) {
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
        .filter(([key]) => !/(^id$|_id$|^id_|^user_id$|^provider_id$|^recipient_id$|^participant_ids?$)/i.test(key))
        .map(([key, nestedValue]) => [key, sanitizeDisplayData(nestedValue)]),
    );
  }

  return value;
}

export default function ScsDashboardPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useCurrentUser();
  const { theme, mounted: hasMounted, toggleTheme } = useTheme();
  const { show: showToast, message: toastMessage, triggerToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMutating, setIsMutating] = useState(false);

  const [dashboard, setDashboard] = useState<ScsDashboardData | null>(null);
  const [recommendations, setRecommendations] = useState<ActiveRecommendationsResponse>(null);
  const [workouts, setWorkouts] = useState<WorkoutListResponse | null>(null);
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummaryResponse | null>(null);
  const [coverageLoad, setCoverageLoad] = useState<CoverageLoadByFlightResponse | null>(null);
  const [routingLevels, setRoutingLevels] = useState<RoutingLevelsResponse | null>(null);
  const [threads, setThreads] = useState<MessageThreadsResponse | null>(null);
  const [groupThreads, setGroupThreads] = useState<MessageThreadsResponse | null>(null);
  const [coverageLogs, setCoverageLogs] = useState<Array<Record<string, unknown>>>([]);
  const [ptSessions, setPtSessions] = useState<UpcomingPtSessionsResponse | null>(null);
  const [leaveOverlap, setLeaveOverlap] = useState<LeaveOverlapResponse | null>(null);
  const [leaveHistory, setLeaveHistory] = useState<LeaveHistoryResponse | null>(null);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [oftRecord, setOftRecord] = useState<OftRecordResponse | null>(null);
  const [timeline, setTimeline] = useState<ReconditioningTimelineResponse | null>(null);
  const [restrictions, setRestrictions] = useState<ReconditioningRestrictionsResponse | null>(null);
  const [performanceSummaries, setPerformanceSummaries] = useState<PerformanceSummariesResponse | null>(null);

  const [selectedThreadUserId, setSelectedThreadUserId] = useState("");
  const [threadDetail, setThreadDetail] = useState<Record<string, unknown> | null>(null);
  const [selectedGroupThreadId, setSelectedGroupThreadId] = useState("");
  const [groupThreadDetail, setGroupThreadDetail] = useState<Record<string, unknown> | null>(null);
  const [messageTraceId, setMessageTraceId] = useState("");
  const [messageTrace, setMessageTrace] = useState<Record<string, unknown> | null>(null);

  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [showCoverageModal, setShowCoverageModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showPtSessionModal, setShowPtSessionModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [recommendationForm, setRecommendationForm] = useState({
    userId: "",
    readinessComponent: "Physical Readiness",
    title: "",
    instructions: "",
    followUpTimeline: "7 days",
    steps: '[{"title":"Step 1","description":"Describe the action"}]',
    jointCoordination: false,
  });
  const [planForm, setPlanForm] = useState({
    userId: "",
    phase: "Active reconditioning",
    sessionsCompleted: "0",
    sessionsTotal: "1",
    cadenceNote: "",
    injuryFlags: "",
    ptimClearanceStatus: "pending",
    nextReviewDate: new Date().toISOString().slice(0, 10),
    limitationFlag: true,
    rehabStrategySummary: "",
    scsCoordinationStatus: "active",
    severityLevel: "moderate",
    injuryReportedOn: new Date().toISOString().slice(0, 10),
  });
  const [restrictionForm, setRestrictionForm] = useState({
    userId: "",
    description: "",
    requiredPhase: "Active reconditioning",
  });
  const [coverageForm, setCoverageForm] = useState({
    providerId: "",
    role: currentUser?.roleName || "SCS",
    hours: "1",
    coverageDate: new Date().toISOString().slice(0, 10),
    weekendRsd: false,
  });
  const [scanBody, setScanBody] = useState("");
  const [scanResult, setScanResult] = useState<{ blocked_terms?: string[]; severity?: number | null } | null>(null);
  const [directMessageForm, setDirectMessageForm] = useState({
    recipientId: "",
    body: "",
    relatedRecommendationId: "",
  });
  const [groupForm, setGroupForm] = useState({
    title: "",
    participantIds: "",
  });
  const [groupMessageForm, setGroupMessageForm] = useState({
    threadId: "",
    body: "",
  });
  const [messageFile, setMessageFile] = useState<File | null>(null);
  const [attachmentMessageId, setAttachmentMessageId] = useState("");
  const [ptSessionForm, setPtSessionForm] = useState({
    sessionDate: new Date().toISOString().slice(0, 10),
    startTime: "0700",
    groupLabel: "",
    focus: "conditioning",
    capacity: "15",
    leadProviderId: "",
  });
  const [sessionActionForm, setSessionActionForm] = useState({
    sessionId: "",
    status: "scheduled",
    capacity: "",
    attendeeUserId: "",
  });
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "leave",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    note: "",
    userId: "",
  });
  const [leaveDeleteId, setLeaveDeleteId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const saved = window.localStorage.getItem("ascend_scs_active_tab");
    if (saved && ["overview", "dashboard", "people", "plans", "coverage", "messages"].includes(saved)) {
      setActiveTab(saved as TabType);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ascend_scs_active_tab", activeTab);
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
          subtitle: getRecordSubtitle(row),
        };
      })
      .filter((row): row is { id: string; name: string; subtitle: string } => Boolean(row));
  }, [dashboard?.operators]);

  useEffect(() => {
    if (!selectedUserId) {
      const defaultId = operatorOptions[0]?.id ?? currentUser?.id ?? "";
      if (defaultId) {
        setSelectedUserId(defaultId);
        setRecommendationForm((prev) => ({ ...prev, userId: defaultId }));
        setPlanForm((prev) => ({ ...prev, userId: defaultId }));
        setRestrictionForm((prev) => ({ ...prev, userId: defaultId }));
        setDirectMessageForm((prev) => ({ ...prev, recipientId: prev.recipientId || defaultId }));
      }
    }
  }, [currentUser?.id, operatorOptions, selectedUserId]);

  useEffect(() => {
    if (!coverageForm.providerId && currentUser?.id) {
      setCoverageForm((prev) => ({ ...prev, providerId: currentUser.id, role: currentUser.roleName || prev.role }));
    }
  }, [coverageForm.providerId, currentUser?.id, currentUser?.roleName]);

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
        workoutsData,
        workoutSummaryData,
        coverageLoadData,
        routingLevelsData,
        threadsData,
        groupThreadsData,
        ptSessionsData,
        leaveOverlapData,
      ] = await Promise.all([
        getScsDashboard(accessToken),
        getActiveRecommendations(accessToken),
        getScopedWorkouts(accessToken),
        getScopedWorkoutSummary(accessToken),
        getCoverageLoadByFlight(accessToken),
        getRoutingLevels(accessToken),
        getMessageThreads(accessToken),
        getGroupThreads(accessToken),
        getUpcomingPtSessions(accessToken),
        getLeaveOverlap(accessToken),
      ]);

      setDashboard(dashboardData);
      setRecommendations(recommendationsData);
      setWorkouts(workoutsData);
      setWorkoutSummary(workoutSummaryData);
      setCoverageLoad(coverageLoadData);
      setRoutingLevels(routingLevelsData);
      setThreads(threadsData);
      setGroupThreads(groupThreadsData);
      setPtSessions(ptSessionsData);
      setLeaveOverlap(leaveOverlapData);

      if (currentUser?.id) {
        const [coverageData, leaveHistoryData] = await Promise.all([
          getCoverageLog(accessToken, currentUser.id),
          getLeaveHistory(accessToken, currentUser.id),
        ]);
        setCoverageLogs(coverageData.logs);
        setLeaveHistory(leaveHistoryData);
      } else {
        setCoverageLogs([]);
        setLeaveHistory(null);
      }
    } catch (nextError) {
      setError(getApiErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedUser = async (userId: string) => {
    if (!accessToken || !userId) {
      setOftRecord(null);
      setTimeline(null);
      setRestrictions(null);
      setPerformanceSummaries(null);
      return;
    }

    try {
      const [oftData, timelineData, restrictionsData, performanceData] = await Promise.all([
        getOftRecord(accessToken, userId),
        getReconditioningTimeline(accessToken, userId),
        getReconditioningRestrictions(accessToken, userId),
        getPerformanceSummaries(accessToken, userId),
      ]);
      setOftRecord(oftData);
      setTimeline(timelineData);
      setRestrictions(restrictionsData);
      setPerformanceSummaries(performanceData);
    } catch (nextError) {
      triggerToast(getApiErrorMessage(nextError));
    }
  };

  const loadThread = async (otherUserId: string) => {
    if (!accessToken || !otherUserId) {
      setThreadDetail(null);
      return;
    }

    try {
      const detail = await getMessageThread(accessToken, otherUserId);
      setThreadDetail(detail);
    } catch (nextError) {
      triggerToast(getApiErrorMessage(nextError));
      setThreadDetail(null);
    }
  };

  const loadGroupThreadDetail = async (threadId: string) => {
    if (!accessToken || !threadId) {
      setGroupThreadDetail(null);
      return;
    }

    try {
      const detail = await getGroupThread(accessToken, threadId);
      setGroupThreadDetail(detail);
    } catch (nextError) {
      triggerToast(getApiErrorMessage(nextError));
      setGroupThreadDetail(null);
    }
  };

  useEffect(() => {
    if (!hasMounted || !isHydrated || !accessToken) {
      return;
    }

    void loadDashboard();
  }, [accessToken, hasMounted, isHydrated, currentUser?.id]);

  useEffect(() => {
    if (!hasMounted || !isHydrated || !accessToken || !selectedUserId) {
      return;
    }

    void loadSelectedUser(selectedUserId);
  }, [accessToken, hasMounted, isHydrated, selectedUserId]);

  useEffect(() => {
    if (!selectedThreadUserId) {
      const firstThreadUserId = (threads?.threads ?? [])
        .map((row) => getRecordId(row))
        .find((value): value is string => Boolean(value));
      if (firstThreadUserId) {
        setSelectedThreadUserId(firstThreadUserId);
      }
    }
  }, [selectedThreadUserId, threads?.threads]);

  useEffect(() => {
    if (!selectedGroupThreadId) {
      const firstGroupThreadId = (groupThreads?.threads ?? [])
        .map((row) => getRecordId(row))
        .find((value): value is string => Boolean(value));
      if (firstGroupThreadId) {
        setSelectedGroupThreadId(firstGroupThreadId);
        setGroupMessageForm((prev) => ({ ...prev, threadId: firstGroupThreadId }));
      }
    }
  }, [groupThreads?.threads, selectedGroupThreadId]);

  useEffect(() => {
    if (!hasMounted || !isHydrated || !accessToken || !selectedThreadUserId) {
      return;
    }

    void loadThread(selectedThreadUserId);
  }, [accessToken, hasMounted, isHydrated, selectedThreadUserId]);

  useEffect(() => {
    if (!hasMounted || !isHydrated || !accessToken || !selectedGroupThreadId) {
      return;
    }

    void loadGroupThreadDetail(selectedGroupThreadId);
  }, [accessToken, hasMounted, isHydrated, selectedGroupThreadId]);

  const recommendationRows = recommendations?.recommendations ?? [];
  const workoutRows = workouts?.workouts ?? [];
  const threadRows = threads?.threads ?? [];
  const groupThreadRows = groupThreads?.threads ?? [];
  const selectedOperator = operatorOptions.find((option) => option.id === selectedUserId) ?? null;
  const selectedThread = threadRows.find((row) => getRecordId(row) === selectedThreadUserId) ?? null;
  const selectedGroupThread = groupThreadRows.find((row) => getRecordId(row) === selectedGroupThreadId) ?? null;

  const refreshAll = async () => {
    await loadDashboard();
    if (selectedUserId) {
      await loadSelectedUser(selectedUserId);
    }
    if (selectedThreadUserId) {
      await loadThread(selectedThreadUserId);
    }
    if (selectedGroupThreadId) {
      await loadGroupThreadDetail(selectedGroupThreadId);
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
              <span className="font-sans text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                SCS
              </span>
            </div>
          </div>

          <div className="px-5 pb-2 pt-6 font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Workspace
          </div>

          <nav className="space-y-1 px-3">
            {[
              { id: "overview", label: "Overview", icon: Users },
              { id: "dashboard", label: "Dashboard", icon: TrendingUp },
              { id: "people", label: "People", icon: User },
              { id: "plans", label: "Plans", icon: ClipboardList },
              { id: "coverage", label: "Coverage", icon: FileText },
              { id: "messages", label: "Messages", icon: MessageSquare },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all duration-150 ${
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
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            type="button"
          >
            <ArrowLeft className="size-4" />
            My profile
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50/50 hover:text-red-600 dark:hover:bg-red-950/20"
            type="button"
          >
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
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">SCS performance workspace</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-slate-200 pr-6 dark:border-white/5">
              <IconButton
                icon={Bell}
                aria-label="Notifications"
                className="relative cursor-pointer p-1.5 text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
                iconClassName="size-4.5"
              >
                <span className="absolute right-1 top-1 size-2 rounded-full bg-[var(--brand-color)] ring-2 ring-white dark:ring-[#0e1628]" />
              </IconButton>
              <IconButton
                icon={theme === "light" ? Moon : Sun}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                onClick={toggleTheme}
                className="cursor-pointer p-1.5 text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
                iconClassName="size-4.5"
              />
            </div>

            <button onClick={() => router.push("/dashboard/profile")} className="flex items-center gap-3" type="button">
              <div className="flex flex-col items-end text-right">
                <span className="block text-xs font-bold text-slate-800 dark:text-white">{currentUser?.name}</span>
                <span className="block font-sans text-[10px] leading-tight text-slate-400 dark:text-slate-500">{currentUser?.unit}</span>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-cyan-500 font-sans text-xs font-black text-white dark:border-white/5">
                {currentUser?.initials}
              </div>
            </button>
          </div>
        </header>

        <div className="z-10 flex h-6 w-full flex-shrink-0 items-center justify-center border-b border-slate-800 bg-slate-900 px-6 font-sans text-[9px] font-mono tracking-wider text-slate-500 select-none">
          <span className="mr-2 text-[var(--brand-color)]">•</span>
          CUI // OPSEC · Live SCS data only · Messages and coverage actions are audit-logged
        </div>

        <main className="flex-1 space-y-8 overflow-y-auto bg-[#f8fafc] px-6 py-8 dark:bg-[#070a13] md:px-8">
          <SectionTitle
            kicker="Human Performance"
            title="SCS Operations"
            description="Leadership-safe visuals stay intact, while every panel now reads and writes against the real SCS backend."
            actions={
              <>
                <button
                  onClick={() => void refreshAll()}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                  type="button"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setShowCoverageModal(true)}
                  className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white"
                  type="button"
                >
                  Log coverage
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
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#0e1628]"
                />
              ))}
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard title="Assigned Count" value={formatNumber(dashboard?.assigned_count)} subtext="Current SCS-assigned operators from `/dashboard/scs`." />
                    <MetricCard title="Checked In Today" value={formatNumber(dashboard?.checked_in_today_count)} subtext="Today’s completed check-ins." />
                    <MetricCard title="Missed Check-ins" value={formatNumber(dashboard?.missed_checkin_today_count)} subtext="Missed today according to the backend." accent="text-rose-500" />
                    <MetricCard title="Low Ops Count" value={formatNumber(dashboard?.low_ops_count)} subtext="Operators currently flagged low readiness." accent="text-amber-500" />
                  </div>

                  <div className="grid gap-6 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                      <CardHeader title="Workout Summary" subtitle="Read-only live summary for the scoped SCS role." />
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <MetricCard title="Sessions" value={formatNumber(workoutSummary?.total_sessions)} subtext={`${formatNumber(workoutSummary?.range_days)} day range`} />
                        <MetricCard title="Completed" value={formatNumber(workoutSummary?.completed_sessions)} subtext="Logged completed sessions." />
                        <MetricCard title="Missed" value={formatNumber(workoutSummary?.missed_sessions)} subtext="Sessions missed in range." accent="text-rose-500" />
                        <MetricCard title="Minutes" value={formatNumber(workoutSummary?.total_duration_minutes)} subtext={workoutSummary?.recent_adherence_label ?? "No adherence label returned."} />
                      </div>
                      <div className="mt-5 space-y-3 text-xs">
                        {Object.entries(workoutSummary?.by_activity_type ?? {}).length === 0 ? (
                          <EmptyState label="No workout activity breakdown is currently available from the backend." />
                        ) : (
                          Object.entries(workoutSummary?.by_activity_type ?? {}).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/5 dark:bg-slate-900/50">
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{key}</span>
                              <span className="font-mono text-slate-500">{formatNumber(value)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>

                    <Card>
                      <CardHeader title="Selected Operator" subtitle="User-scoped records for the currently selected operator." />
                      <SimpleKeyValueList
                        rows={[
                          { label: "Operator", value: selectedOperator?.name ?? currentUser?.name ?? "—" },
                          { label: "Assignment", value: selectedOperator?.subtitle ?? currentUser?.unit ?? "—" },
                          { label: "OFT status", value: oftRecord?.current_status ?? "—" },
                          { label: "Latest result", value: oftRecord?.latest_pass_fail ?? "—" },
                          { label: "Latest test", value: formatDate(oftRecord?.latest_test_date) },
                          { label: "Next scheduled", value: formatDate(oftRecord?.next_scheduled_date) },
                          { label: "Annual tests", value: formatNumber(oftRecord?.annual_test_count) },
                        ]}
                      />
                    </Card>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                      <CardHeader title="Active Recommendations" subtitle="Assignments returned by `/recommendations/active`." />
                      {recommendationRows.length === 0 ? (
                        <EmptyState label="No active recommendations are returned for this SCS login right now." />
                      ) : (
                        <div className="space-y-3">
                          {recommendationRows.slice(0, 6).map((row, index) => (
                            <div key={String(getRecordId(row) ?? index)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">{getRecordTitle(row)}</p>
                                  <p className="mt-1 text-xs text-slate-500">{getRecordSubtitle(row)}</p>
                                </div>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone(String(getRecordValue(row, ["status", "state"])))}`}>
                                  {stringifyValue(getRecordValue(row, ["status", "state"]))}
                                </span>
                              </div>
                              <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                {stringifyValue(getRecordValue(row, ["instructions", "summary", "body", "description"]))}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    <Card>
                      <CardHeader title="Coverage Snapshot" subtitle="Real coverage load by flight; no mock heatmap or capacity columns." />
                      <SimpleKeyValueList
                        rows={[
                          { label: "Min cohort size", value: formatNumber(coverageLoad?.min_cohort_size) },
                          { label: "Total flights", value: formatNumber(coverageLoad?.total_flights) },
                          { label: "Flights meeting minimum", value: formatNumber(coverageLoad?.flights_meeting_cohort_minimum) },
                          { label: "Flights returned", value: formatNumber(coverageLoad?.flights.length) },
                        ]}
                      />
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader title="Operator Queue" subtitle="Exactly what `/dashboard/scs` returns for operators in scope." />
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead className="text-slate-400">
                          <tr>
                            <th className="pb-3 font-semibold">Operator</th>
                            <th className="pb-3 font-semibold">Assignment</th>
                            <th className="pb-3 font-semibold">Status</th>
                            <th className="pb-3 font-semibold">Flight / Unit</th>
                            <th className="pb-3 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {(dashboard?.operators ?? []).map((row, index) => {
                            const id = getRecordId(row);
                            return (
                              <tr key={String(id ?? index)}>
                                <td className="py-3 font-semibold text-slate-900 dark:text-white">{getRecordTitle(row)}</td>
                                <td className="py-3 text-slate-500">{stringifyValue(getRecordValue(row, ["role", "rank_grade", "readiness_component", "pathway_name"]))}</td>
                                <td className="py-3">
                                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone(String(getRecordValue(row, ["status", "current_status", "queue_status"])))}`}>
                                    {stringifyValue(getRecordValue(row, ["status", "current_status", "queue_status"]))}
                                  </span>
                                </td>
                                <td className="py-3 text-slate-500">{stringifyValue(getRecordValue(row, ["flight_name", "unit_name", "unit"]))}</td>
                                <td className="py-3">
                                  <button
                                    onClick={() => {
                                      if (id) {
                                        setSelectedUserId(id);
                                        setActiveTab("people");
                                      }
                                    }}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200"
                                    disabled={!id}
                                    type="button"
                                  >
                                    Open
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {(dashboard?.operators ?? []).length === 0 && <EmptyRow colSpan={5} label="No live operators are currently returned for this SCS login." />}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                      <CardHeader title="Scoped Workouts" subtitle="Live workouts from `/workouts` for this role." />
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead className="text-slate-400">
                            <tr>
                              <th className="pb-3 font-semibold">Title</th>
                              <th className="pb-3 font-semibold">Date</th>
                              <th className="pb-3 font-semibold">Status</th>
                              <th className="pb-3 font-semibold">Type</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {workoutRows.slice(0, 12).map((row, index) => (
                              <tr key={String(getRecordId(row) ?? index)}>
                                <td className="py-3 font-semibold text-slate-900 dark:text-white">{getRecordTitle(row)}</td>
                                <td className="py-3 text-slate-500">{formatDate(String(getRecordValue(row, ["date", "completed_at", "scheduled_for"])))}</td>
                                <td className="py-3">
                                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone(String(getRecordValue(row, ["status"])))}`}>
                                    {stringifyValue(getRecordValue(row, ["status"]))}
                                  </span>
                                </td>
                                <td className="py-3 text-slate-500">{stringifyValue(getRecordValue(row, ["activity_type", "type"]))}</td>
                              </tr>
                            ))}
                            {workoutRows.length === 0 && <EmptyRow colSpan={4} label="No scoped workouts are currently returned." />}
                          </tbody>
                        </table>
                      </div>
                    </Card>

                    <Card>
                      <CardHeader title="Performance Summaries" subtitle="User-scoped summaries for the selected operator." />
                      {performanceSummaries?.summaries.length ? (
                        <div className="space-y-3">
                          {performanceSummaries.summaries.map((summary, index) => (
                            <div key={String(getRecordId(summary) ?? index)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{getRecordTitle(summary)}</p>
                              <p className="mt-1 text-xs text-slate-500">{getRecordSubtitle(summary)}</p>
                              <div className="mt-3 grid gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                                {Object.entries(summary).slice(0, 6).map(([key, value]) => (
                                  <div key={key} className="flex items-center justify-between gap-3">
                                    <span className="font-semibold text-slate-500">{formatLabel(key)}</span>
                                    <span className="text-right font-mono">{stringifyValue(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState label="No performance summaries are returned for the selected operator." />
                      )}
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "people" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader title="Operator Scope" subtitle="Pick a real operator from the backend roster for scoped SCS records." />
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                      <select
                        value={selectedUserId}
                        onChange={(event) => setSelectedUserId(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                      >
                        {operatorOptions.length === 0 && <option value="">No operators returned</option>}
                        {operatorOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name} • {option.subtitle}
                          </option>
                        ))}
                        {currentUser?.id && !operatorOptions.some((option) => option.id === currentUser.id) && (
                          <option value={currentUser.id}>
                            {currentUser.name} • {currentUser.unit}
                          </option>
                        )}
                      </select>
                      <button
                        onClick={() => void loadSelectedUser(selectedUserId)}
                        className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white"
                        type="button"
                      >
                        Reload
                      </button>
                    </div>
                  </Card>

                  <div className="grid gap-6 xl:grid-cols-3">
                    <Card>
                      <CardHeader title="OFT Record" subtitle="Direct response from `/oft/{user_id}`." />
                      <SimpleKeyValueList
                        rows={[
                          { label: "Current status", value: oftRecord?.current_status ?? "—" },
                          { label: "Latest pass/fail", value: oftRecord?.latest_pass_fail ?? "—" },
                          { label: "Latest test date", value: formatDate(oftRecord?.latest_test_date) },
                          { label: "Items passed", value: formatNumber(oftRecord?.items_passed) },
                          { label: "Items total", value: formatNumber(oftRecord?.items_total) },
                          { label: "Next scheduled", value: formatDate(oftRecord?.next_scheduled_date) },
                          { label: "Relative", value: oftRecord?.next_scheduled_relative ?? "—" },
                        ]}
                      />
                    </Card>

                    <Card className="xl:col-span-2">
                      <CardHeader title="Restrictions" subtitle="Live restriction list and release actions." />
                      {(restrictions?.restrictions ?? []).length === 0 ? (
                        <EmptyState label="No active restrictions are returned for this user." />
                      ) : (
                        <div className="space-y-3">
                          {(restrictions?.restrictions ?? []).map((row, index) => {
                            const restrictionId = getRecordId(row);
                            return (
                              <div key={String(restrictionId ?? index)} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">{stringifyValue(getRecordValue(row, ["description", "title", "status"]))}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {formatLabel(String(getRecordValue(row, ["required_phase", "phase"])))}
                                  </p>
                                </div>
                                <button
                                  onClick={async () => {
                                    if (!accessToken || !restrictionId) {
                                      return;
                                    }
                                    setIsMutating(true);
                                    try {
                                      await releaseReconditioningRestriction(accessToken, restrictionId);
                                      triggerToast("Restriction released from the live backend.");
                                      await loadSelectedUser(selectedUserId);
                                    } catch (nextError) {
                                      triggerToast(getApiErrorMessage(nextError));
                                    } finally {
                                      setIsMutating(false);
                                    }
                                  }}
                                  disabled={!restrictionId || isMutating}
                                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 dark:border-white/10 dark:text-slate-200"
                                  type="button"
                                >
                                  Release
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </div>

                  <Card>
                    <CardHeader title="Reconditioning Timeline" subtitle="Event stream returned by `/records/reconditioning-plan/{user_id}/timeline`." />
                    {(timeline?.events ?? []).length === 0 ? (
                      <EmptyState label="No timeline events are available for the selected user." />
                    ) : (
                      <div className="space-y-3">
                        {(timeline?.events ?? []).map((event, index) => (
                          <div key={String(getRecordId(event) ?? index)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{getRecordTitle(event)}</p>
                              <span className="text-[11px] font-mono text-slate-500">{formatDate(String(getRecordValue(event, ["date", "created_at", "event_date"])), true)}</span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                              {stringifyValue(getRecordValue(event, ["description", "summary", "note", "details"]))}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {activeTab === "plans" && (
                <div className="space-y-6">
                  <div className="grid gap-6 xl:grid-cols-3">
                    <Card>
                      <CardHeader title="Actions" subtitle="Write-path integration for recommendations, reconditioning plans, and restrictions." />
                      <div className="space-y-3">
                        <button onClick={() => setShowRecommendationModal(true)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" type="button">
                          <span>Assign recommendation</span>
                          <Plus className="size-4" />
                        </button>
                        <button onClick={() => setShowPlanModal(true)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" type="button">
                          <span>Upsert reconditioning plan</span>
                          <ClipboardList className="size-4" />
                        </button>
                        <button onClick={() => setShowRestrictionModal(true)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" type="button">
                          <span>Add restriction</span>
                          <Activity className="size-4" />
                        </button>
                      </div>
                    </Card>

                    <Card className="xl:col-span-2">
                      <CardHeader title="Current User Scope" subtitle="The selected operator drives plan, summary, OFT, and restriction endpoints." />
                      <SimpleKeyValueList
                        rows={[
                          { label: "Selected operator", value: selectedOperator?.name ?? currentUser?.name ?? "—" },
                          { label: "Flight / unit", value: selectedOperator?.subtitle ?? currentUser?.unit ?? "—" },
                          { label: "Active recommendations", value: formatNumber(recommendationRows.length) },
                          { label: "Restrictions", value: formatNumber(restrictions?.restrictions.length) },
                          { label: "Timeline events", value: formatNumber(timeline?.events.length) },
                          { label: "Performance summaries", value: formatNumber(performanceSummaries?.summaries.length) },
                        ]}
                      />
                    </Card>
                  </div>

                  <Card>
                    <CardHeader title="Live Recommendation Feed" subtitle="No frontend seed rows remain here; this is the backend list only." />
                    {recommendationRows.length === 0 ? (
                      <EmptyState label="No recommendation rows are currently available." />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead className="text-slate-400">
                            <tr>
                              <th className="pb-3 font-semibold">Title</th>
                              <th className="pb-3 font-semibold">Component</th>
                              <th className="pb-3 font-semibold">Provider</th>
                              <th className="pb-3 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {recommendationRows.map((row, index) => (
                              <tr key={String(getRecordId(row) ?? index)}>
                                <td className="py-3 font-semibold text-slate-900 dark:text-white">{getRecordTitle(row)}</td>
                                <td className="py-3 text-slate-500">{stringifyValue(getRecordValue(row, ["readiness_component"]))}</td>
                                <td className="py-3 text-slate-500">{stringifyValue(getRecordValue(row, ["assigned_provider_name", "provider_name"]))}</td>
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
                    )}
                  </Card>
                </div>
              )}

              {activeTab === "coverage" && (
                <div className="space-y-6">
                  <div className="grid gap-6 xl:grid-cols-3">
                    <MetricCard title="Coverage Logs" value={formatNumber(coverageLogs.length)} subtext="Current provider log count from the backend." />
                    <MetricCard title="Flights in Load" value={formatNumber(coverageLoad?.flights.length)} subtext="Real flight rows returned." />
                    <MetricCard title="Flights At Threshold" value={formatPercent(coverageLoad && coverageLoad.total_flights > 0 ? (coverageLoad.flights_meeting_cohort_minimum / coverageLoad.total_flights) * 100 : null)} subtext="Based on backend minimum cohort rules." />
                  </div>

                  <div className="grid gap-6 xl:grid-cols-3">
                    <Card>
                      <CardHeader title="Coverage Actions" subtitle="Real PT sessions and leave tracking from the coverage backend." />
                      <div className="space-y-3">
                        <button onClick={() => setShowPtSessionModal(true)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" type="button">
                          <span>Schedule PT session</span>
                          <Calendar className="size-4" />
                        </button>
                        <button onClick={() => setShowLeaveModal(true)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" type="button">
                          <span>Log leave / TDY</span>
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </Card>

                    <Card>
                      <CardHeader title="Upcoming PT Sessions" subtitle={`Live sessions for the next ${formatNumber(ptSessions?.window_days)} days.`} />
                      <SimpleKeyValueList
                        rows={[
                          { label: "Session rows", value: formatNumber(ptSessions?.sessions.length) },
                          { label: "Window days", value: formatNumber(ptSessions?.window_days) },
                          { label: "My leave rows", value: formatNumber(leaveHistory?.records?.length ?? leaveHistory?.leave?.length ?? 0) },
                          { label: "Overlap pairs", value: formatNumber(leaveOverlap?.overlapping_pairs?.length ?? leaveOverlap?.overlaps?.length ?? 0) },
                        ]}
                      />
                    </Card>

                    <Card>
                      <CardHeader title="Session Actions" subtitle="Update session status, enroll an attendee, or remove one using live IDs." />
                      <div className="space-y-3 text-xs">
                        <input value={sessionActionForm.sessionId} onChange={(event) => setSessionActionForm((prev) => ({ ...prev, sessionId: event.target.value.trim() }))} placeholder="Session ID" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-900" />
                        <select value={sessionActionForm.status} onChange={(event) => setSessionActionForm((prev) => ({ ...prev, status: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-900">
                          <option value="scheduled">scheduled</option>
                          <option value="completed">completed</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                        <input value={sessionActionForm.capacity} onChange={(event) => setSessionActionForm((prev) => ({ ...prev, capacity: event.target.value }))} placeholder="Capacity override (optional)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-900" />
                        <input value={sessionActionForm.attendeeUserId} onChange={(event) => setSessionActionForm((prev) => ({ ...prev, attendeeUserId: event.target.value.trim() }))} placeholder="Attendee user ID" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-900" />
                        <div className="flex gap-3">
                          <button
                            onClick={async () => {
                              if (!accessToken || !sessionActionForm.sessionId) return;
                              setIsMutating(true);
                              try {
                                await updatePtSession(accessToken, sessionActionForm.sessionId, {
                                  status: sessionActionForm.status,
                                  capacity: sessionActionForm.capacity ? Number(sessionActionForm.capacity) : undefined,
                                });
                                triggerToast("PT session updated in the backend.");
                                await refreshAll();
                              } catch (nextError) {
                                triggerToast(getApiErrorMessage(nextError));
                              } finally {
                                setIsMutating(false);
                              }
                            }}
                            disabled={!sessionActionForm.sessionId || isMutating}
                            className="flex-1 rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 disabled:opacity-50 dark:border-white/10 dark:text-slate-200"
                            type="button"
                          >
                            Update
                          </button>
                          <button
                            onClick={async () => {
                              if (!accessToken || !sessionActionForm.sessionId || !sessionActionForm.attendeeUserId) return;
                              setIsMutating(true);
                              try {
                                await enrollPtSessionAttendee(accessToken, sessionActionForm.sessionId, sessionActionForm.attendeeUserId);
                                triggerToast("Attendee enrolled in the backend.");
                                await refreshAll();
                              } catch (nextError) {
                                triggerToast(getApiErrorMessage(nextError));
                              } finally {
                                setIsMutating(false);
                              }
                            }}
                            disabled={!sessionActionForm.sessionId || !sessionActionForm.attendeeUserId || isMutating}
                            className="flex-1 rounded-xl bg-[var(--brand-color)] px-4 py-2 font-semibold text-white disabled:opacity-50"
                            type="button"
                          >
                            Enroll
                          </button>
                          <button
                            onClick={async () => {
                              if (!accessToken || !sessionActionForm.sessionId || !sessionActionForm.attendeeUserId) return;
                              setIsMutating(true);
                              try {
                                await removePtSessionAttendee(accessToken, sessionActionForm.sessionId, sessionActionForm.attendeeUserId);
                                triggerToast("Attendee removed in the backend.");
                                await refreshAll();
                              } catch (nextError) {
                                triggerToast(getApiErrorMessage(nextError));
                              } finally {
                                setIsMutating(false);
                              }
                            }}
                            disabled={!sessionActionForm.sessionId || !sessionActionForm.attendeeUserId || isMutating}
                            className="flex-1 rounded-xl border border-rose-200 px-4 py-2 font-semibold text-rose-600 disabled:opacity-50 dark:border-rose-500/30"
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader title="Reconditioning Load By Flight" subtitle="Real backend coverage load. Removed all placeholder columns not supported by the API." />
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead className="text-slate-400">
                          <tr>
                            <th className="pb-3 font-semibold">Flight</th>
                            <th className="pb-3 font-semibold">Cohort</th>
                            <th className="pb-3 font-semibold">Active Plans</th>
                            <th className="pb-3 font-semibold">On Track</th>
                            <th className="pb-3 font-semibold">Overdue Reviews</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {(coverageLoad?.flights ?? []).map((row, index) => (
                            <tr key={String(getRecordId(row) ?? index)}>
                              <td className="py-3 font-semibold text-slate-900 dark:text-white">{getRecordTitle(row)}</td>
                              <td className="py-3 text-slate-500">{formatNumber(getRecordValue(row, ["cohort_size"]))}</td>
                              <td className="py-3 text-slate-500">{formatNumber(getRecordValue(row, ["active_plan_count"]))}</td>
                              <td className="py-3 text-slate-500">{stringifyValue(getRecordValue(row, ["on_track"]))}</td>
                              <td className="py-3 text-slate-500">{formatNumber(getRecordValue(row, ["overdue_review_count"]))}</td>
                            </tr>
                          ))}
                          {(coverageLoad?.flights ?? []).length === 0 && <EmptyRow colSpan={5} label="No coverage load rows are returned for this tenant yet." />}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <Card>
                    <CardHeader title="My Coverage Logs" subtitle="Provider log history for the current SCS user ID." />
                    {coverageLogs.length === 0 ? (
                      <EmptyState label="No coverage logs are currently recorded for this provider." />
                    ) : (
                      <div className="space-y-3">
                        {coverageLogs.map((row, index) => (
                          <div key={String(getRecordId(row) ?? index)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{stringifyValue(getRecordValue(row, ["role", "title", "status"]))}</p>
                              <span className="font-mono text-[11px] text-slate-500">{formatDate(String(getRecordValue(row, ["coverage_date", "created_at"])), true)}</span>
                            </div>
                            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                              Hours: {formatNumber(getRecordValue(row, ["hours"]))} · Weekend RSD: {stringifyValue(getRecordValue(row, ["is_weekend_rsd"]))}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                      <CardHeader title="PT Session List" subtitle="Real upcoming sessions with enrollment and capacity values." />
                      {(ptSessions?.sessions ?? []).length === 0 ? (
                        <EmptyState label="No upcoming PT sessions are returned right now." />
                      ) : (
                        <div className="space-y-3">
                          {(ptSessions?.sessions ?? []).map((row, index) => (
                            <div key={String(getRecordId(row) ?? index)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">{stringifyValue(getRecordValue(row, ["group_label", "title", "name"]))}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {formatDate(String(getRecordValue(row, ["session_date"])))}
                                    {" · "}
                                    {stringifyValue(getRecordValue(row, ["start_time"]))}
                                    {" · "}
                                    {stringifyValue(getRecordValue(row, ["focus_label", "focus"]))}
                                  </p>
                                </div>
                                <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone(String(getRecordValue(row, ["status"])))}`}>
                                  {stringifyValue(getRecordValue(row, ["status"]))}
                                </span>
                              </div>
                              <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                                Provider: {stringifyValue(getRecordValue(row, ["lead_provider_name"]))} · Enrolled: {formatNumber(getRecordValue(row, ["enrolled_count"]))} / {formatNumber(getRecordValue(row, ["capacity"]))} · Capacity: {formatPercent(getRecordValue(row, ["capacity_pct"]))}
                              </p>
                              <p className="mt-2 text-[11px] text-slate-400">Lead role: {stringifyValue(getRecordValue(row, ["lead_provider_role"]))}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    <Card>
                      <CardHeader title="Leave Overlap" subtitle="Real overlap window and the current provider’s leave history." />
                      <div className="space-y-4">
                        <SimpleKeyValueList
                          rows={[
                            { label: "Window days", value: formatNumber(getRecordValue(leaveOverlap as Record<string, unknown>, ["window_days", "days"])) },
                            { label: "Overlap pairs", value: formatNumber(leaveOverlap?.overlapping_pairs?.length ?? leaveOverlap?.overlaps?.length ?? 0) },
                            { label: "Window records", value: formatNumber((leaveOverlap as { records?: Array<Record<string, unknown>> } | null)?.records?.length ?? 0) },
                            { label: "My leave records", value: formatNumber(leaveHistory?.records?.length ?? leaveHistory?.leave?.length ?? 0) },
                          ]}
                        />
                        <JsonPreview data={leaveOverlap} emptyLabel="No leave overlap payload loaded." />
                        <div className="flex flex-col gap-3 md:flex-row">
                          <input
                            value={leaveDeleteId}
                            onChange={(event) => setLeaveDeleteId(event.target.value.trim())}
                            placeholder="Leave record ID to delete"
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                          />
                          <button
                            onClick={async () => {
                              if (!accessToken || !leaveDeleteId) return;
                              setIsMutating(true);
                              try {
                                await deleteLeaveRecord(accessToken, leaveDeleteId);
                                triggerToast("Leave record deleted from the backend.");
                                setLeaveDeleteId("");
                                await refreshAll();
                              } catch (nextError) {
                                triggerToast(getApiErrorMessage(nextError));
                              } finally {
                                setIsMutating(false);
                              }
                            }}
                            disabled={!leaveDeleteId || isMutating}
                            className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 disabled:opacity-50 dark:border-rose-500/30"
                            type="button"
                          >
                            Delete leave
                          </button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "messages" && (
                <div className="space-y-6">
                  <div className="grid gap-6 xl:grid-cols-3">
                    <Card>
                      <CardHeader title="Message Actions" subtitle="Content scan and send flow uses the real messaging endpoints." />
                      <div className="space-y-3">
                        <button onClick={() => setShowGroupModal(true)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" type="button">
                          <span>Create group thread</span>
                          <Plus className="size-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!accessToken || !scanBody.trim()) {
                              return;
                            }
                            setIsMutating(true);
                            try {
                              const result = await scanMessage(accessToken, scanBody.trim());
                              setScanResult(result);
                              triggerToast("Message scanned against the live routing rules.");
                            } catch (nextError) {
                              triggerToast(getApiErrorMessage(nextError));
                            } finally {
                              setIsMutating(false);
                            }
                          }}
                          disabled={!scanBody.trim() || isMutating}
                          className="flex w-full items-center justify-between rounded-xl bg-[var(--brand-color)] px-4 py-3 text-left text-xs font-semibold text-white disabled:opacity-50"
                          type="button"
                        >
                          <span>Scan draft</span>
                          <Search className="size-4" />
                        </button>
                      </div>
                    </Card>

                    <Card className="xl:col-span-2">
                      <CardHeader title="Routing Levels" subtitle="Backend-defined escalation logic from `/messaging/routing-levels`." />
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead className="text-slate-400">
                            <tr>
                              <th className="pb-3 font-semibold">Level</th>
                              <th className="pb-3 font-semibold">Name</th>
                              <th className="pb-3 font-semibold">Trigger</th>
                              <th className="pb-3 font-semibold">Routing</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {(routingLevels?.levels ?? []).map((level) => (
                              <tr key={level.level}>
                                <td className="py-3 font-bold text-slate-900 dark:text-white">{level.level}</td>
                                <td className="py-3 text-slate-500">{level.name}</td>
                                <td className="py-3 text-slate-500">{level.trigger}</td>
                                <td className="py-3 text-slate-500">{level.specialist_routing}</td>
                              </tr>
                            ))}
                            {(routingLevels?.levels ?? []).length === 0 && <EmptyRow colSpan={4} label="No routing levels were returned." />}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                      <CardHeader title="Direct Threads" subtitle="Live thread list with on-demand thread detail fetch." />
                      <div className="space-y-3">
                        {(threadRows ?? []).map((row, index) => {
                          const otherUserId = getRecordId(row);
                          const active = otherUserId === selectedThreadUserId;
                          return (
                            <button
                              key={String(otherUserId ?? index)}
                              onClick={() => {
                                if (otherUserId) {
                                  setSelectedThreadUserId(otherUserId);
                                  setDirectMessageForm((prev) => ({ ...prev, recipientId: otherUserId }));
                                }
                              }}
                              className={`w-full rounded-2xl border p-4 text-left transition ${
                                active
                                  ? "border-[var(--brand-color)] bg-[var(--brand-color)]/5"
                                  : "border-slate-100 bg-slate-50 hover:border-slate-200 dark:border-white/5 dark:bg-slate-900/50"
                              }`}
                              disabled={!otherUserId}
                              type="button"
                            >
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{getRecordTitle(row)}</p>
                              <p className="mt-1 text-xs text-slate-500">{getRecordSubtitle(row)}</p>
                              <p className="mt-2 text-[11px] text-slate-400">{stringifyValue(getRecordValue(row, ["preview", "last_message", "body"]))}</p>
                            </button>
                          );
                        })}
                        {threadRows.length === 0 && <EmptyState label="No direct threads are currently available for this SCS role." />}
                      </div>
                    </Card>

                    <Card>
                      <CardHeader title="Direct Thread Detail" subtitle="Fetched from `/messaging/thread/{other_user_id}`." />
                      <div className="space-y-4">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-white/5 dark:bg-slate-900/50 dark:text-slate-300">
                          Conversation: <span className="font-semibold text-slate-700 dark:text-slate-100">{selectedThread ? getRecordTitle(selectedThread) : "No thread selected"}</span>
                        </div>
                        <input
                          value={directMessageForm.recipientId}
                          onChange={(event) => setDirectMessageForm((prev) => ({ ...prev, recipientId: event.target.value.trim() }))}
                          placeholder="Recipient ID for send action"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                        />
                        <textarea
                          value={directMessageForm.body}
                          onChange={(event) => setDirectMessageForm((prev) => ({ ...prev, body: event.target.value }))}
                          placeholder="Write a direct message"
                          rows={5}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                        />
                        <input
                          value={directMessageForm.relatedRecommendationId}
                          onChange={(event) => setDirectMessageForm((prev) => ({ ...prev, relatedRecommendationId: event.target.value.trim() }))}
                          placeholder="Related recommendation ID (optional)"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={async () => {
                              if (!accessToken || !directMessageForm.recipientId || !directMessageForm.body.trim()) {
                                return;
                              }
                              setIsMutating(true);
                              try {
                                await sendMessage(accessToken, {
                                  recipient_id: directMessageForm.recipientId,
                                  body: directMessageForm.body.trim(),
                                  related_recommendation_id: directMessageForm.relatedRecommendationId || undefined,
                                  file: messageFile ?? undefined,
                                });
                                setDirectMessageForm((prev) => ({ ...prev, body: "", relatedRecommendationId: "" }));
                                setMessageFile(null);
                                triggerToast("Direct message sent through the backend.");
                                await loadDashboard();
                                await loadThread(directMessageForm.recipientId);
                              } catch (nextError) {
                                triggerToast(getApiErrorMessage(nextError));
                              } finally {
                                setIsMutating(false);
                              }
                            }}
                            disabled={!directMessageForm.recipientId || !directMessageForm.body.trim() || isMutating}
                            className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                            type="button"
                          >
                            Send direct message
                          </button>
                          <button
                            onClick={() => void loadThread(directMessageForm.recipientId)}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200"
                            type="button"
                          >
                            Reload thread
                          </button>
                        </div>
                        <JsonPreview data={threadDetail} emptyLabel="No direct thread detail has been loaded yet." />
                      </div>
                    </Card>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                      <CardHeader title="Group Threads" subtitle="Live group thread list from the messaging backend." />
                      <div className="space-y-3">
                        {groupThreadRows.map((row, index) => {
                          const threadId = getRecordId(row);
                          const active = threadId === selectedGroupThreadId;
                          return (
                            <button
                              key={String(threadId ?? index)}
                              onClick={() => {
                                if (threadId) {
                                  setSelectedGroupThreadId(threadId);
                                  setGroupMessageForm((prev) => ({ ...prev, threadId }));
                                }
                              }}
                              className={`w-full rounded-2xl border p-4 text-left transition ${
                                active
                                  ? "border-[var(--brand-color)] bg-[var(--brand-color)]/5"
                                  : "border-slate-100 bg-slate-50 hover:border-slate-200 dark:border-white/5 dark:bg-slate-900/50"
                              }`}
                              disabled={!threadId}
                              type="button"
                            >
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{getRecordTitle(row)}</p>
                              <p className="mt-1 text-xs text-slate-500">{getRecordSubtitle(row)}</p>
                            </button>
                          );
                        })}
                        {groupThreadRows.length === 0 && <EmptyState label="No group threads exist for this SCS login." />}
                      </div>
                    </Card>

                    <Card>
                      <CardHeader title="Group Thread Detail" subtitle="Read and send into a selected group thread." />
                      <div className="space-y-4">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-white/5 dark:bg-slate-900/50 dark:text-slate-300">
                          Group: <span className="font-semibold text-slate-700 dark:text-slate-100">{selectedGroupThread ? getRecordTitle(selectedGroupThread) : "No group selected"}</span>
                        </div>
                        <input
                          value={groupMessageForm.threadId}
                          onChange={(event) => setGroupMessageForm((prev) => ({ ...prev, threadId: event.target.value.trim() }))}
                          placeholder="Group thread ID for send action"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                        />
                        <textarea
                          value={groupMessageForm.body}
                          onChange={(event) => setGroupMessageForm((prev) => ({ ...prev, body: event.target.value }))}
                          placeholder="Write a group message"
                          rows={4}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                          />
                        <input
                          type="file"
                          onChange={(event) => setMessageFile(event.target.files?.[0] ?? null)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={async () => {
                              if (!accessToken || !groupMessageForm.threadId || !groupMessageForm.body.trim()) {
                                return;
                              }
                              setIsMutating(true);
                              try {
                                await sendGroupMessage(accessToken, groupMessageForm.threadId, groupMessageForm.body.trim());
                                setGroupMessageForm((prev) => ({ ...prev, body: "" }));
                                triggerToast("Group message sent through the backend.");
                                await loadDashboard();
                                await loadGroupThreadDetail(groupMessageForm.threadId);
                              } catch (nextError) {
                                triggerToast(getApiErrorMessage(nextError));
                              } finally {
                                setIsMutating(false);
                              }
                            }}
                            disabled={!groupMessageForm.threadId || !groupMessageForm.body.trim() || isMutating}
                            className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                            type="button"
                          >
                            Send group message
                          </button>
                          <button
                            onClick={() => void loadGroupThreadDetail(groupMessageForm.threadId)}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200"
                            type="button"
                          >
                            Reload group
                          </button>
                        </div>
                        <JsonPreview data={groupThreadDetail} emptyLabel="No group thread detail has been loaded yet." />
                      </div>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader title="Draft Scan" subtitle="Live `/messaging/scan` result for the text below." />
                    <textarea
                      value={scanBody}
                      onChange={(event) => setScanBody(event.target.value)}
                      placeholder="Paste or draft a message to run it through the messaging scan endpoint."
                      rows={4}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <div className="mt-4">
                      <JsonPreview data={scanResult} emptyLabel="No scan has been run yet." />
                    </div>
                  </Card>

                  <Card>
                    <CardHeader title="Message Trace" subtitle="Fetch a delivery trace from `/messaging/message/{message_id}/trace`." />
                    <div className="flex flex-col gap-3 md:flex-row">
                      <input
                        value={messageTraceId}
                        onChange={(event) => setMessageTraceId(event.target.value.trim())}
                        placeholder="Message ID"
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <button
                        onClick={async () => {
                          if (!accessToken || !messageTraceId) {
                            return;
                          }
                          setIsMutating(true);
                          try {
                            const trace = await getMessageTrace(accessToken, messageTraceId);
                            setMessageTrace(trace);
                            triggerToast("Message trace loaded from the backend.");
                          } catch (nextError) {
                            triggerToast(getApiErrorMessage(nextError));
                          } finally {
                            setIsMutating(false);
                          }
                        }}
                        disabled={!messageTraceId || isMutating}
                        className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        type="button"
                      >
                        Load trace
                      </button>
                    </div>
                    <div className="mt-4">
                      <JsonPreview data={messageTrace} emptyLabel="No message trace has been requested yet." />
                    </div>
                  </Card>

                  <Card>
                    <CardHeader title="Attachment Download" subtitle="Download a message attachment by message ID." />
                    <div className="flex flex-col gap-3 md:flex-row">
                      <input
                        value={attachmentMessageId}
                        onChange={(event) => setAttachmentMessageId(event.target.value.trim())}
                        placeholder="Message ID"
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <button
                        onClick={async () => {
                          if (!accessToken || !attachmentMessageId) {
                            return;
                          }
                          setIsMutating(true);
                          try {
                            const file = await downloadMessageAttachment(accessToken, attachmentMessageId);
                            const bytes = Uint8Array.from(atob(file.content_base64), (char) => char.charCodeAt(0));
                            const blob = new Blob([bytes], { type: file.content_type });
                            const url = URL.createObjectURL(blob);
                            const anchor = document.createElement("a");
                            anchor.href = url;
                            anchor.download = file.file_name;
                            anchor.click();
                            URL.revokeObjectURL(url);
                            triggerToast("Attachment downloaded from the backend.");
                          } catch (nextError) {
                            triggerToast(getApiErrorMessage(nextError));
                          } finally {
                            setIsMutating(false);
                          }
                        }}
                        disabled={!attachmentMessageId || isMutating}
                        className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        type="button"
                      >
                        Download
                      </button>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <AccessibleDialog open={showRecommendationModal} onClose={() => setShowRecommendationModal(false)} className="w-full max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0e1628]">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assign Recommendation</h2>
          <p className="mt-1 text-xs text-slate-500">Creates a real recommendation assignment for the selected operator.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <select value={recommendationForm.userId} onChange={(event) => setRecommendationForm((prev) => ({ ...prev, userId: event.target.value.trim() }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            {operatorOptions.length === 0 && <option value="">No operators returned</option>}
            {operatorOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} • {option.subtitle}
              </option>
            ))}
          </select>
          <input value={recommendationForm.readinessComponent} onChange={(event) => setRecommendationForm((prev) => ({ ...prev, readinessComponent: event.target.value }))} placeholder="Readiness component" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input value={recommendationForm.title} onChange={(event) => setRecommendationForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Title" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input value={recommendationForm.followUpTimeline} onChange={(event) => setRecommendationForm((prev) => ({ ...prev, followUpTimeline: event.target.value }))} placeholder="Follow-up timeline" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        </div>
        <textarea value={recommendationForm.instructions} onChange={(event) => setRecommendationForm((prev) => ({ ...prev, instructions: event.target.value }))} placeholder="Instructions" rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        <textarea value={recommendationForm.steps} onChange={(event) => setRecommendationForm((prev) => ({ ...prev, steps: event.target.value }))} placeholder='JSON array, e.g. [{"title":"Step 1","description":"..."}]' rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono dark:border-white/10 dark:bg-slate-900" />
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={recommendationForm.jointCoordination} onChange={(event) => setRecommendationForm((prev) => ({ ...prev, jointCoordination: event.target.checked }))} />
          Joint coordination
        </label>
        <div className="flex gap-3">
          <button onClick={() => setShowRecommendationModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-white/10" type="button">Cancel</button>
          <button
            onClick={async () => {
              if (!accessToken || !recommendationForm.userId || !recommendationForm.title.trim() || !recommendationForm.instructions.trim()) {
                return;
              }
              setIsMutating(true);
              try {
                const steps = JSON.parse(recommendationForm.steps) as Array<{ title: string; description: string }>;
                await assignRecommendation(accessToken, recommendationForm.userId, {
                  readiness_component: recommendationForm.readinessComponent,
                  assigned_provider_name: currentUser?.name ?? "SCS",
                  assigned_provider_role: currentUser?.roleName ?? "SCS",
                  title: recommendationForm.title.trim(),
                  instructions: recommendationForm.instructions.trim(),
                  steps,
                  follow_up_timeline: recommendationForm.followUpTimeline,
                  is_joint_coordination: recommendationForm.jointCoordination,
                });
                triggerToast("Recommendation assigned in the live backend.");
                setShowRecommendationModal(false);
                await refreshAll();
              } catch (nextError) {
                triggerToast(getApiErrorMessage(nextError));
              } finally {
                setIsMutating(false);
              }
            }}
            disabled={!recommendationForm.userId || !recommendationForm.title.trim() || !recommendationForm.instructions.trim() || isMutating}
            className="flex-1 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            type="button"
          >
            Save
          </button>
        </div>
      </AccessibleDialog>

      <AccessibleDialog open={showPlanModal} onClose={() => setShowPlanModal(false)} className="w-full max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0e1628]">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upsert Reconditioning Plan</h2>
          <p className="mt-1 text-xs text-slate-500">Writes directly to `/records/reconditioning-plan/{'{'}user_id{'}'}`.</p>
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
        </div>
        <textarea value={planForm.injuryFlags} onChange={(event) => setPlanForm((prev) => ({ ...prev, injuryFlags: event.target.value }))} placeholder="Injury flags, comma separated" rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        <textarea value={planForm.rehabStrategySummary} onChange={(event) => setPlanForm((prev) => ({ ...prev, rehabStrategySummary: event.target.value }))} placeholder="Rehab strategy summary" rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={planForm.limitationFlag} onChange={(event) => setPlanForm((prev) => ({ ...prev, limitationFlag: event.target.checked }))} />
          Limitation flag enabled
        </label>
        <div className="flex gap-3">
          <button onClick={() => setShowPlanModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-white/10" type="button">Cancel</button>
          <button
            onClick={async () => {
              if (!accessToken || !planForm.userId || !planForm.phase.trim()) {
                return;
              }
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
                });
                triggerToast("Reconditioning plan saved in the live backend.");
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

      <AccessibleDialog open={showRestrictionModal} onClose={() => setShowRestrictionModal(false)}>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Restriction</h2>
          <p className="mt-1 text-xs text-slate-500">Posts a new restriction for the selected operator.</p>
        </div>
        <div className="space-y-4">
          <select value={restrictionForm.userId} onChange={(event) => setRestrictionForm((prev) => ({ ...prev, userId: event.target.value.trim() }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            {operatorOptions.length === 0 && <option value="">No operators returned</option>}
            {operatorOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} • {option.subtitle}
              </option>
            ))}
          </select>
          <input value={restrictionForm.requiredPhase} onChange={(event) => setRestrictionForm((prev) => ({ ...prev, requiredPhase: event.target.value }))} placeholder="Required phase" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <textarea value={restrictionForm.description} onChange={(event) => setRestrictionForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Restriction description" rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowRestrictionModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-white/10" type="button">Cancel</button>
          <button
            onClick={async () => {
              if (!accessToken || !restrictionForm.userId || !restrictionForm.description.trim()) {
                return;
              }
              setIsMutating(true);
              try {
                await addReconditioningRestriction(accessToken, restrictionForm.userId, {
                  description: restrictionForm.description.trim(),
                  required_phase: restrictionForm.requiredPhase.trim(),
                });
                triggerToast("Restriction added in the live backend.");
                setShowRestrictionModal(false);
                await refreshAll();
              } catch (nextError) {
                triggerToast(getApiErrorMessage(nextError));
              } finally {
                setIsMutating(false);
              }
            }}
            disabled={!restrictionForm.userId || !restrictionForm.description.trim() || isMutating}
            className="flex-1 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            type="button"
          >
            Save
          </button>
        </div>
      </AccessibleDialog>

      <AccessibleDialog open={showCoverageModal} onClose={() => setShowCoverageModal(false)}>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Log Coverage</h2>
          <p className="mt-1 text-xs text-slate-500">Writes a provider coverage log through the backend admin coverage endpoint.</p>
        </div>
        <div className="space-y-4">
          <select value={coverageForm.providerId} onChange={(event) => setCoverageForm((prev) => ({ ...prev, providerId: event.target.value.trim() }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            {currentUser?.id && <option value={currentUser.id}>{currentUser.name} • {currentUser.roleName ?? "SCS"}</option>}
            {operatorOptions.filter((option) => option.id !== currentUser?.id).map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} • {option.subtitle}
              </option>
            ))}
          </select>
          <input value={coverageForm.role} onChange={(event) => setCoverageForm((prev) => ({ ...prev, role: event.target.value }))} placeholder="Role" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input value={coverageForm.hours} onChange={(event) => setCoverageForm((prev) => ({ ...prev, hours: event.target.value }))} placeholder="Hours" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input type="date" value={coverageForm.coverageDate} onChange={(event) => setCoverageForm((prev) => ({ ...prev, coverageDate: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={coverageForm.weekendRsd} onChange={(event) => setCoverageForm((prev) => ({ ...prev, weekendRsd: event.target.checked }))} />
            Weekend RSD coverage
          </label>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCoverageModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-white/10" type="button">Cancel</button>
          <button
            onClick={async () => {
              if (!accessToken || !coverageForm.providerId || !coverageForm.role.trim()) {
                return;
              }
              setIsMutating(true);
              try {
                await createCoverageLog(accessToken, {
                  provider_id: coverageForm.providerId,
                  role: coverageForm.role.trim(),
                  hours: Number(coverageForm.hours) || 0,
                  coverage_date: coverageForm.coverageDate,
                  is_weekend_rsd: coverageForm.weekendRsd,
                });
                triggerToast("Coverage log saved in the live backend.");
                setShowCoverageModal(false);
                await refreshAll();
              } catch (nextError) {
                triggerToast(getApiErrorMessage(nextError));
              } finally {
                setIsMutating(false);
              }
            }}
            disabled={!coverageForm.providerId || !coverageForm.role.trim() || isMutating}
            className="flex-1 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            type="button"
          >
            Save
          </button>
        </div>
      </AccessibleDialog>

      <AccessibleDialog open={showGroupModal} onClose={() => setShowGroupModal(false)}>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Group Thread</h2>
          <p className="mt-1 text-xs text-slate-500">Creates a real messaging group thread with participant user IDs.</p>
        </div>
        <div className="space-y-4">
          <input value={groupForm.title} onChange={(event) => setGroupForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Group thread title" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <textarea value={groupForm.participantIds} onChange={(event) => setGroupForm((prev) => ({ ...prev, participantIds: event.target.value }))} placeholder="Participant user IDs, comma separated" rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowGroupModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-white/10" type="button">Cancel</button>
          <button
            onClick={async () => {
              if (!accessToken || !groupForm.title.trim() || !groupForm.participantIds.trim()) {
                return;
              }
              setIsMutating(true);
              try {
                await createGroupThread(accessToken, {
                  title: groupForm.title.trim(),
                  participant_ids: groupForm.participantIds.split(",").map((value) => value.trim()).filter(Boolean),
                });
                triggerToast("Group thread created in the live backend.");
                setShowGroupModal(false);
                setGroupForm({ title: "", participantIds: "" });
                await refreshAll();
              } catch (nextError) {
                triggerToast(getApiErrorMessage(nextError));
              } finally {
                setIsMutating(false);
              }
            }}
            disabled={!groupForm.title.trim() || !groupForm.participantIds.trim() || isMutating}
            className="flex-1 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            type="button"
          >
            Save
          </button>
        </div>
      </AccessibleDialog>

      <AccessibleDialog open={showPtSessionModal} onClose={() => setShowPtSessionModal(false)}>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Schedule PT Session</h2>
          <p className="mt-1 text-xs text-slate-500">Creates a real PT session in the coverage workspace.</p>
        </div>
        <div className="space-y-4">
          <input type="date" value={ptSessionForm.sessionDate} onChange={(event) => setPtSessionForm((prev) => ({ ...prev, sessionDate: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input value={ptSessionForm.startTime} onChange={(event) => setPtSessionForm((prev) => ({ ...prev, startTime: event.target.value }))} placeholder="0700" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input value={ptSessionForm.groupLabel} onChange={(event) => setPtSessionForm((prev) => ({ ...prev, groupLabel: event.target.value }))} placeholder="Group label" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <select value={ptSessionForm.focus} onChange={(event) => setPtSessionForm((prev) => ({ ...prev, focus: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            <option value="strength">strength</option>
            <option value="conditioning">conditioning</option>
            <option value="mobility">mobility</option>
            <option value="recovery">recovery</option>
            <option value="assessment">assessment</option>
          </select>
          <input value={ptSessionForm.capacity} onChange={(event) => setPtSessionForm((prev) => ({ ...prev, capacity: event.target.value }))} placeholder="Capacity" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <select value={ptSessionForm.leadProviderId} onChange={(event) => setPtSessionForm((prev) => ({ ...prev, leadProviderId: event.target.value.trim() }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            <option value="">No explicit lead provider</option>
            {currentUser?.id && <option value={currentUser.id}>{currentUser.name} • {currentUser.roleName ?? "SCS"}</option>}
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowPtSessionModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-white/10" type="button">Cancel</button>
          <button
            onClick={async () => {
              if (!accessToken || !ptSessionForm.groupLabel.trim() || !ptSessionForm.startTime.trim()) return;
              setIsMutating(true);
              try {
                await createPtSession(accessToken, {
                  session_date: ptSessionForm.sessionDate,
                  start_time: ptSessionForm.startTime.trim(),
                  group_label: ptSessionForm.groupLabel.trim(),
                  focus: ptSessionForm.focus,
                  capacity: Number(ptSessionForm.capacity) || 0,
                  lead_provider_id: ptSessionForm.leadProviderId || undefined,
                });
                triggerToast("PT session created in the live backend.");
                setShowPtSessionModal(false);
                await refreshAll();
              } catch (nextError) {
                triggerToast(getApiErrorMessage(nextError));
              } finally {
                setIsMutating(false);
              }
            }}
            disabled={!ptSessionForm.groupLabel.trim() || !ptSessionForm.startTime.trim() || isMutating}
            className="flex-1 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            type="button"
          >
            Save
          </button>
        </div>
      </AccessibleDialog>

      <AccessibleDialog open={showLeaveModal} onClose={() => setShowLeaveModal(false)}>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Log Leave / TDY / Training</h2>
          <p className="mt-1 text-xs text-slate-500">Creates a real provider leave record for the overlap tracker.</p>
        </div>
        <div className="space-y-4">
          <select value={leaveForm.leaveType} onChange={(event) => setLeaveForm((prev) => ({ ...prev, leaveType: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            <option value="leave">leave</option>
            <option value="tdy">tdy</option>
            <option value="training">training</option>
            <option value="medical">medical</option>
          </select>
          <input type="date" value={leaveForm.startDate} onChange={(event) => setLeaveForm((prev) => ({ ...prev, startDate: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <input type="date" value={leaveForm.endDate} onChange={(event) => setLeaveForm((prev) => ({ ...prev, endDate: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          <select value={leaveForm.userId} onChange={(event) => setLeaveForm((prev) => ({ ...prev, userId: event.target.value.trim() }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
            <option value="">Current logged-in provider</option>
            {currentUser?.id && <option value={currentUser.id}>{currentUser.name} • {currentUser.roleName ?? "SCS"}</option>}
          </select>
          <textarea value={leaveForm.note} onChange={(event) => setLeaveForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="Note" rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowLeaveModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-white/10" type="button">Cancel</button>
          <button
            onClick={async () => {
              if (!accessToken) return;
              setIsMutating(true);
              try {
                await createLeaveRecord(accessToken, {
                  leave_type: leaveForm.leaveType,
                  start_date: leaveForm.startDate,
                  end_date: leaveForm.endDate,
                  note: leaveForm.note.trim() || undefined,
                  user_id: leaveForm.userId || undefined,
                });
                triggerToast("Leave record created in the live backend.");
                setShowLeaveModal(false);
                await refreshAll();
              } catch (nextError) {
                triggerToast(getApiErrorMessage(nextError));
              } finally {
                setIsMutating(false);
              }
            }}
            disabled={isMutating}
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

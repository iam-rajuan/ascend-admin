"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/staff-api";
import {
  getSpecialistDashboard,
  getMealConsistencyByFlight,
  listUploadedRecords,
  getMessageThreads,
  getMealLogs,
  updateMealLogFlag,
  getCohortMacroDistribution,
  getMacroTarget,
  getMacroTargetHistory,
  setMacroTarget,
  createSpecialistSession,
  updateSpecialistSession,
  getUpcomingSpecialistSessions,
  getSpecialistSessionQueueSummary,
  startSpecialistSession,
  toggleSpecialistSessionChecklistItem,
  getHydrationAlerts,
  sendMessage,
  getMessageThread,
  buildWsUrl,
  listSpecialistNotes,
  createSpecialistNote,
  getMyAuditLog,
  getPerformanceSummaries,
  type SpecialistDashboardData,
  type MealConsistencyByFlightResponse,
  type RecordUploadsResponse,
  type MessageThreadsResponse,
  type MessageThreadDetailResponse,
  type MealLogEntry,
  type CohortMacroDistribution,
  type MacroTarget,
  type SpecialistSessionSummary,
  type SpecialistSessionQueueSummary,
  type HydrationAlert,
  type SpecialistNoteEntry,
  type MyAuditLogEntry,
  type PerformanceSummaryEntry,
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
  // Real, self-reported biometric fields - null until the operator fills
  // them in via their own Profile screen (see MOBILE_APP_INTEGRATION.md).
  age: number | null;
  sex: string | null;
  height_in: number | null;
  weight_lb: number | null;
  bmi: number | null;
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
  if (normalized.includes("mixed") || normalized.includes("open") || normalized.includes("pending") || normalized.includes("in_progress")) {
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

const MACRO_COLORS = { carbs: "#0da2b3", protein: "#f59e0b", fat: "#8b5cf6" };

function MacroDonut({ carbsPct, proteinPct, fatPct }: { carbsPct: number; proteinPct: number; fatPct: number }) {
  const carbsEnd = carbsPct;
  const proteinEnd = carbsEnd + proteinPct;
  const gradient = `conic-gradient(${MACRO_COLORS.carbs} 0% ${carbsEnd}%, ${MACRO_COLORS.protein} ${carbsEnd}% ${proteinEnd}%, ${MACRO_COLORS.fat} ${proteinEnd}% 100%)`;
  return (
    <div className="relative mx-auto size-44">
      <div className="size-full rounded-full" style={{ background: gradient }} />
      <div className="absolute inset-[14%] flex flex-col items-center justify-center rounded-full bg-white text-center dark:bg-[#0e1628]">
        <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
          {Math.round(carbsPct)}/{Math.round(proteinPct)}/{Math.round(fatPct)}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">C / P / F</span>
      </div>
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
  const [foodLogOperatorId, setFoodLogOperatorId] = useState<string | null>(null);
  const [foodLog, setFoodLog] = useState<MealLogEntry[]>([]);
  const [foodLogLoading, setFoodLogLoading] = useState(false);
  const [flagBusyId, setFlagBusyId] = useState<string | null>(null);
  const [cohortMacro, setCohortMacro] = useState<CohortMacroDistribution | null>(null);
  const [macroTarget, setMacroTargetState] = useState<MacroTarget | null>(null);
  const [targetForm, setTargetForm] = useState({ title: "", carbs_pct: "50", protein_pct: "25", fat_pct: "25" });
  const [targetSaving, setTargetSaving] = useState(false);
  const [targetError, setTargetError] = useState("");
  const [sessions, setSessions] = useState<SpecialistSessionSummary[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ user_id: "", topic: "", session_date: "", start_time: "", prep_items: "" });
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [sessionActionBusyId, setSessionActionBusyId] = useState<string | null>(null);
  const [queueSummary, setQueueSummary] = useState<SpecialistSessionQueueSummary | null>(null);
  const [queueFilter, setQueueFilter] = useState<"today" | "week" | "pending_prep" | "all">("today");
  const [queueSearch, setQueueSearch] = useState("");
  const [hydrationAlerts, setHydrationAlerts] = useState<HydrationAlert[]>([]);
  const [composeAlert, setComposeAlert] = useState<HydrationAlert | null>(null);
  const [composeBody, setComposeBody] = useState("");
  const [composeSelectedIds, setComposeSelectedIds] = useState<Set<string>>(new Set());
  const [composeSending, setComposeSending] = useState(false);
  const [composeError, setComposeError] = useState("");
  const [composeSentCount, setComposeSentCount] = useState<number | null>(null);
  const [selectedThreadUserId, setSelectedThreadUserId] = useState<string | null>(null);
  const selectedThreadUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedThreadUserIdRef.current = selectedThreadUserId;
  }, [selectedThreadUserId]);
  const [threadDetail, setThreadDetail] = useState<MessageThreadDetailResponse | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [messagesSearch, setMessagesSearch] = useState("");

  const [recordsSearch, setRecordsSearch] = useState("");
  const [recordsSubTab, setRecordsSubTab] = useState<"food_log" | "action_history" | "assessments" | "access_log">("food_log");
  const [macroTargetHistory, setMacroTargetHistory] = useState<MacroTarget[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [myAuditLog, setMyAuditLog] = useState<MyAuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummaryEntry | null>(null);
  const [specialistNotes, setSpecialistNotes] = useState<SpecialistNoteEntry[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [recordsSummaryOpen, setRecordsSummaryOpen] = useState(false);
  const [newNoteForm, setNewNoteForm] = useState({ title: "", user_concern: "", note_type: "intake" });
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState("");

  const refreshAll = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const [dash, meals, recs, th, macro, sess, summary, hydration] = await Promise.all([
        getSpecialistDashboard(accessToken),
        getMealConsistencyByFlight(accessToken),
        listUploadedRecords(accessToken),
        getMessageThreads(accessToken),
        getCohortMacroDistribution(accessToken),
        getUpcomingSpecialistSessions(accessToken, 14),
        getSpecialistSessionQueueSummary(accessToken),
        getHydrationAlerts(accessToken),
      ]);
      setDashboard(dash);
      setMealConsistency(meals);
      setRecords(recs);
      setThreads(th);
      setCohortMacro(macro);
      setSessions(sess?.sessions ?? []);
      setQueueSummary(summary);
      setHydrationAlerts(hydration?.alerts ?? []);
      const operators = (dash?.operators as NutritionOperatorRow[] | undefined) ?? [];
      setFoodLogOperatorId((current) => current ?? operators[0]?.user_id ?? null);
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

  const refreshFoodLog = async (userId: string) => {
    if (!accessToken) return;
    setFoodLogLoading(true);
    try {
      const res = await getMealLogs(accessToken, userId, 1);
      setFoodLog(res?.meal_logs ?? []);
    } catch {
      setFoodLog([]);
    } finally {
      setFoodLogLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && foodLogOperatorId) {
      void refreshFoodLog(foodLogOperatorId);
    }
  }, [accessToken, foodLogOperatorId]);

  useEffect(() => {
    if (!accessToken || !foodLogOperatorId) return;
    setTargetError("");
    getMacroTarget(accessToken, foodLogOperatorId)
      .then((t) => {
        setMacroTargetState(t);
        // Title always starts blank - setting a target creates a new real
        // history entry (see MacroTargetService.set_target), not an edit
        // of the current one, so it needs its own label.
        setTargetForm({
          title: "",
          carbs_pct: t ? String(t.carbs_pct) : "50",
          protein_pct: t ? String(t.protein_pct) : "25",
          fat_pct: t ? String(t.fat_pct) : "25",
        });
      })
      .catch(() => setMacroTargetState(null));
  }, [accessToken, foodLogOperatorId]);

  const refreshSpecialistNotes = async (userId: string) => {
    if (!accessToken) return;
    setNotesLoading(true);
    try {
      const res = await listSpecialistNotes(accessToken, userId);
      setSpecialistNotes(res?.notes ?? []);
    } catch {
      setSpecialistNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && foodLogOperatorId) {
      void refreshSpecialistNotes(foodLogOperatorId);
    }
  }, [accessToken, foodLogOperatorId]);

  useEffect(() => {
    if (!accessToken || !foodLogOperatorId) {
      setPerformanceSummary(null);
      return;
    }
    getPerformanceSummaries(accessToken, foodLogOperatorId)
      .then((res) => {
        // Most recent summary that actually released real content to this role
        // (nutrition_considerations/sleep_recovery_considerations, per DOCX
        // Table 23) - a draft or one with everything withheld shows nothing,
        // never a fabricated fallback.
        const withContent = (res?.summaries ?? []).find(
          (s) => s.nutrition_considerations || s.sleep_recovery_considerations,
        );
        setPerformanceSummary(withContent ?? null);
      })
      .catch(() => setPerformanceSummary(null));
  }, [accessToken, foodLogOperatorId]);

  useEffect(() => {
    if (!accessToken || !foodLogOperatorId || activeTab !== "records" || recordsSubTab !== "action_history") return;
    setHistoryLoading(true);
    getMacroTargetHistory(accessToken, foodLogOperatorId)
      .then((res) => setMacroTargetHistory(res?.targets ?? []))
      .catch(() => setMacroTargetHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [accessToken, foodLogOperatorId, activeTab, recordsSubTab]);

  useEffect(() => {
    if (!accessToken || activeTab !== "records" || recordsSubTab !== "access_log") return;
    setAuditLoading(true);
    getMyAuditLog(accessToken)
      .then((res) => setMyAuditLog(res?.entries ?? []))
      .catch(() => setMyAuditLog([]))
      .finally(() => setAuditLoading(false));
  }, [accessToken, activeTab, recordsSubTab]);

  const submitNewNote = async () => {
    if (!accessToken || !foodLogOperatorId) return;
    if (!newNoteForm.title.trim()) {
      setNoteError("Title is required.");
      return;
    }
    if (!newNoteForm.user_concern.trim()) {
      setNoteError("Body can't be empty.");
      return;
    }
    setNoteSaving(true);
    setNoteError("");
    try {
      await createSpecialistNote(accessToken, foodLogOperatorId, {
        title: newNoteForm.title.trim(),
        user_concern: newNoteForm.user_concern.trim(),
        note_type: newNoteForm.note_type,
      });
      await refreshSpecialistNotes(foodLogOperatorId);
      setNewNoteOpen(false);
      setNewNoteForm({ title: "", user_concern: "", note_type: "intake" });
    } catch (err) {
      setNoteError(getApiErrorMessage(err));
    } finally {
      setNoteSaving(false);
    }
  };

  const openThread = async (otherUserId: string) => {
    if (!accessToken) return;
    setSelectedThreadUserId(otherUserId);
    setThreadLoading(true);
    setChatError("");
    try {
      const detail = await getMessageThread(accessToken, otherUserId);
      setThreadDetail(detail);
    } catch (err) {
      setChatError(getApiErrorMessage(err));
    } finally {
      setThreadLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!accessToken || !selectedThreadUserId || !chatInput.trim()) return;
    setChatSending(true);
    setChatError("");
    try {
      await sendMessage(accessToken, { recipient_id: selectedThreadUserId, body: chatInput.trim() });
      setChatInput("");
      const [detail, threadsRes] = await Promise.all([
        getMessageThread(accessToken, selectedThreadUserId),
        getMessageThreads(accessToken),
      ]);
      setThreadDetail(detail);
      setThreads(threadsRes);
    } catch (err) {
      setChatError(getApiErrorMessage(err));
    } finally {
      setChatSending(false);
    }
  };

  // Real-time message delivery - connects to the real `/messaging/live`
  // MongoDB change-stream socket instead of leaving Messages on a manual-
  // refresh-only flow. Reconnects with a fixed 3s backoff on drop, and
  // reads `selectedThreadUserIdRef` (not the `selectedThreadUserId` state
  // directly) so a live-arriving message is matched against whichever
  // thread is open right now, not whichever was open when this socket
  // connected.
  useEffect(() => {
    if (!accessToken) return;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      socket = new WebSocket(buildWsUrl("/messaging/live", accessToken));

      socket.onmessage = (event) => {
        let msg: { sender_id: string; recipient_id: string | null } | null = null;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        if (!msg) return;
        void getMessageThreads(accessToken).then(setThreads).catch(() => {});
        const openThreadId = selectedThreadUserIdRef.current;
        if (openThreadId && (msg.sender_id === openThreadId || msg.recipient_id === openThreadId)) {
          void getMessageThread(accessToken, openThreadId).then(setThreadDetail).catch(() => {});
        }
      };
      socket.onclose = () => {
        if (!cancelled) reconnectTimer = setTimeout(connect, 3000);
      };
      socket.onerror = () => {
        socket?.close();
      };
    };
    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [accessToken]);

  const saveMacroTarget = async () => {
    if (!accessToken || !foodLogOperatorId) return;
    if (!targetForm.title.trim()) {
      setTargetError("Title is required.");
      return;
    }
    const carbs = Number(targetForm.carbs_pct);
    const protein = Number(targetForm.protein_pct);
    const fat = Number(targetForm.fat_pct);
    if ([carbs, protein, fat].some((v) => Number.isNaN(v) || v < 0 || v > 100)) {
      setTargetError("Each percentage must be a number between 0 and 100.");
      return;
    }
    if (Math.abs(carbs + protein + fat - 100) > 0.5) {
      setTargetError(`Percentages must sum to 100 (currently ${(carbs + protein + fat).toFixed(1)}).`);
      return;
    }
    setTargetSaving(true);
    setTargetError("");
    try {
      const saved = await setMacroTarget(accessToken, foodLogOperatorId, {
        title: targetForm.title.trim(),
        carbs_pct: carbs,
        protein_pct: protein,
        fat_pct: fat,
      });
      setMacroTargetState(saved);
      setTargetForm((f) => ({ ...f, title: "" }));
      const [macro, history] = await Promise.all([
        getCohortMacroDistribution(accessToken),
        getMacroTargetHistory(accessToken, foodLogOperatorId),
      ]);
      setCohortMacro(macro);
      setMacroTargetHistory(history?.targets ?? []);
    } catch (err) {
      setTargetError(getApiErrorMessage(err));
    } finally {
      setTargetSaving(false);
    }
  };

  const refreshSessions = async () => {
    if (!accessToken) return;
    const [res, summary] = await Promise.all([
      getUpcomingSpecialistSessions(accessToken, 14),
      getSpecialistSessionQueueSummary(accessToken),
    ]);
    setSessions(res?.sessions ?? []);
    setQueueSummary(summary);
  };

  const submitScheduleConsult = async () => {
    if (!accessToken) return;
    if (!scheduleForm.user_id) {
      setScheduleError("Select an operator.");
      return;
    }
    if (!scheduleForm.session_date || !scheduleForm.start_time) {
      setScheduleError("Pick a date and time.");
      return;
    }
    setScheduleSaving(true);
    setScheduleError("");
    try {
      const prepItems = scheduleForm.prep_items
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      await createSpecialistSession(accessToken, {
        session_date: scheduleForm.session_date,
        start_time: scheduleForm.start_time.replace(":", ""),
        session_type: "individual",
        attendee_user_ids: [scheduleForm.user_id],
        topic: scheduleForm.topic || undefined,
        prep_checklist_items: prepItems,
      });
      await refreshSessions();
      setScheduleOpen(false);
      setScheduleForm({ user_id: "", topic: "", session_date: "", start_time: "", prep_items: "" });
    } catch (err) {
      setScheduleError(getApiErrorMessage(err));
    } finally {
      setScheduleSaving(false);
    }
  };

  const updateSessionStatus = async (sessionId: string, status: string) => {
    if (!accessToken) return;
    setSessionActionBusyId(sessionId);
    try {
      await updateSpecialistSession(accessToken, sessionId, { status });
      await refreshSessions();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSessionActionBusyId(null);
    }
  };

  const startSession = async (sessionId: string) => {
    if (!accessToken) return;
    setSessionActionBusyId(sessionId);
    try {
      await startSpecialistSession(accessToken, sessionId);
      await refreshSessions();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSessionActionBusyId(null);
    }
  };

  const toggleChecklistItem = async (sessionId: string, label: string, done: boolean) => {
    if (!accessToken) return;
    try {
      await toggleSpecialistSessionChecklistItem(accessToken, sessionId, { label, done });
      await refreshSessions();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const openComposeForAlert = (alert: HydrationAlert) => {
    setComposeAlert(alert);
    setComposeBody(
      `Hi - your flight (${alert.flight_name}) has shown low hydration adherence for ${alert.streak_days}+ days in a row. Let's get ahead of this before it affects performance - reach out if you need support.`,
    );
    setComposeSelectedIds(new Set(alert.members.filter((m) => m.messageable).map((m) => m.id)));
    setComposeError("");
    setComposeSentCount(null);
  };

  const sendComposeMessages = async () => {
    if (!accessToken || !composeAlert) return;
    if (composeSelectedIds.size === 0) {
      setComposeError("Select at least one recipient.");
      return;
    }
    if (!composeBody.trim()) {
      setComposeError("Message body can't be empty.");
      return;
    }
    setComposeSending(true);
    setComposeError("");
    try {
      let sent = 0;
      for (const recipientId of composeSelectedIds) {
        await sendMessage(accessToken, { recipient_id: recipientId, body: composeBody.trim() });
        sent += 1;
      }
      setComposeSentCount(sent);
    } catch (err) {
      setComposeError(getApiErrorMessage(err));
    } finally {
      setComposeSending(false);
    }
  };

  const toggleFlag = async (entry: MealLogEntry) => {
    if (!accessToken) return;
    setFlagBusyId(entry.id);
    try {
      const nextFlagged = !entry.flagged;
      await updateMealLogFlag(accessToken, entry.id, {
        flagged: nextFlagged,
        flag_reason: nextFlagged ? "Flagged for review" : null,
      });
      if (foodLogOperatorId) await refreshFoodLog(foodLogOperatorId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setFlagBusyId(null);
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

  const operators = (dashboard?.operators as NutritionOperatorRow[] | undefined) ?? [];
  const recentRequests = (dashboard?.recent_requests as SupportRequestRow[] | undefined) ?? [];
  const operatorNameById = new Map(operators.map((o) => [o.user_id, o.user_name]));

  // Real "today" count derived from real request timestamps - not a
  // separate fabricated metric, just recentRequests filtered to today.
  const todayKey = new Date().toDateString();
  const consultsToday = recentRequests.filter((r) => new Date(r.created_at).toDateString() === todayKey).length;

  // Real client-side filter/search over the already-fetched real sessions -
  // no separate backend call per tab.
  const todayIso = new Date().toISOString().slice(0, 10);
  const searchTerm = queueSearch.trim().toLowerCase();
  const filteredSessions = sessions
    .filter((s) => {
      if (queueFilter === "today") return s.session_date === todayIso;
      if (queueFilter === "week" && queueSummary) return s.session_date >= queueSummary.week_start && s.session_date <= queueSummary.week_end;
      if (queueFilter === "pending_prep") return !s.prep_ready && s.status !== "cancelled";
      return true;
    })
    .filter((s) => {
      if (!searchTerm) return true;
      const airmanNames = s.attendee_user_ids.map((id) => operatorNameById.get(id) ?? id).join(" ");
      return airmanNames.toLowerCase().includes(searchTerm) || (s.topic ?? "").toLowerCase().includes(searchTerm);
    });

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
            <CardHeader title="Assigned Operators" subtitle={`${operators.length} operators on this caseload · click a row to view their food log below`} />
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
                    <tr
                      key={operator.user_id}
                      onClick={() => setFoodLogOperatorId(operator.user_id)}
                      className={`cursor-pointer transition ${
                        foodLogOperatorId === operator.user_id
                          ? "bg-[var(--brand-color)]/5"
                          : "hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
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

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Macro Distribution · Cohort"
                subtitle={
                  cohortMacro?.meets_cohort_minimum
                    ? `Real logged macros · ${cohortMacro.cohort_size} operators · last ${cohortMacro.window_days} days`
                    : cohortMacro
                      ? `Cohort of ${cohortMacro.cohort_size} below the k>=${cohortMacro.min_cohort_size} minimum for this view`
                      : "Real, k-gated cohort macro rollup."
                }
              />
              {cohortMacro?.meets_cohort_minimum && cohortMacro.carbs_pct != null ? (
                <div className="space-y-4">
                  <MacroDonut carbsPct={cohortMacro.carbs_pct} proteinPct={cohortMacro.protein_pct!} fatPct={cohortMacro.fat_pct!} />
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-500"><span className="size-2 rounded-full" style={{ background: MACRO_COLORS.carbs }} />Carbohydrates</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">{cohortMacro.carbs_pct}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-500"><span className="size-2 rounded-full" style={{ background: MACRO_COLORS.protein }} />Protein</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">{cohortMacro.protein_pct}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-500"><span className="size-2 rounded-full" style={{ background: MACRO_COLORS.fat }} />Fat</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">{cohortMacro.fat_pct}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400 dark:border-white/5">
                    <span>On-target band ({cohortMacro.entries_with_target} entries with a target set)</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                      {cohortMacro.on_target_band_pct != null ? `${cohortMacro.on_target_band_pct}%` : "—"}
                    </span>
                  </div>
                </div>
              ) : cohortMacro?.meets_cohort_minimum ? (
                <p className="py-6 text-center text-xs text-slate-400">No macro-complete meals logged in the caseload in the last {cohortMacro.window_days} days.</p>
              ) : (
                <p className="py-6 text-center text-xs text-slate-400">Cohort too small to display without risking individual identification.</p>
              )}

              {foodLogOperatorId && (
                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Macro target &middot; {operatorNameById.get(foodLogOperatorId) ?? "selected operator"}
                  </p>
                  <input
                    type="text"
                    value={targetForm.title}
                    onChange={(e) => setTargetForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Target label (e.g. Weight mgmt phase 1)"
                    className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                  <div className="flex flex-wrap items-end gap-2">
                    {(["carbs_pct", "protein_pct", "fat_pct"] as const).map((key) => (
                      <label key={key} className="flex flex-col gap-1 text-[10px] font-semibold text-slate-500">
                        {key === "carbs_pct" ? "Carbs %" : key === "protein_pct" ? "Protein %" : "Fat %"}
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={targetForm[key]}
                          onChange={(e) => setTargetForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                        />
                      </label>
                    ))}
                    <button
                      type="button"
                      disabled={targetSaving}
                      onClick={() => void saveMacroTarget()}
                      className="rounded-lg bg-[var(--brand-color)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      {targetSaving ? "Saving…" : "Start new target"}
                    </button>
                  </div>
                  {targetError && <p className="mt-2 text-[10px] font-semibold text-rose-500">{targetError}</p>}
                  {macroTarget && !targetError && (
                    <p className="mt-2 text-[10px] text-slate-400">Current: "{macroTarget.title}" &middot; {macroTarget.carbs_pct}/{macroTarget.protein_pct}/{macroTarget.fat_pct} &middot; started {formatDate(macroTarget.started_at)}</p>
                  )}
                </div>
              )}
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent Consults</h3>
                  <p className="mt-0.5 text-[10px] text-slate-400">Real Nutritionist pathway support requests, most recent first.</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/nutritionist/consults")}
                  className="text-xs font-bold text-[var(--brand-color)] hover:underline cursor-pointer"
                >
                  View all
                </button>
              </div>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                      <th className="pb-3 font-semibold">Operator</th>
                      <th className="pb-3 font-semibold">Message</th>
                      <th className="pb-3 font-semibold">Time</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {recentRequests.slice(0, 5).map((request) => (
                      <tr key={request.id}>
                        <td className="py-3 font-semibold text-slate-800 dark:text-white">{operatorNameById.get(request.user_id) ?? "—"}</td>
                        <td className="max-w-[180px] truncate py-3 text-slate-500">{request.message ?? "—"}</td>
                        <td className="py-3 text-slate-500">{formatDate(request.created_at, true)}</td>
                        <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(request.status)}`}>{formatLabel(request.status)}</span></td>
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

          <Card>
            <div className="mb-4 flex flex-col gap-4 border-b border-slate-100 pb-3 dark:border-white/5 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Food log &middot; {operatorNameById.get(foodLogOperatorId ?? "") ?? "select an operator"}
                </span>
                <h3 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">Meal consistency & logs</h3>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Real operator-logged meals, last 24 hours &middot; {foodLog.length} entr{foodLog.length === 1 ? "y" : "ies"}
                  {foodLog.some((f) => f.flagged) ? " · flagged entries need review" : ""}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:border-white/5">
                    <th className="pb-3 w-12">Time</th>
                    <th className="pb-3 w-1/3">Entry</th>
                    <th className="pb-3">Kcal</th>
                    <th className="pb-3">Carbs</th>
                    <th className="pb-3">Protein</th>
                    <th className="pb-3">Fat</th>
                    <th className="pb-3 text-right">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono dark:divide-white/5">
                  {foodLog.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5">
                      <td className="py-3 text-[10px] text-slate-500">
                        {new Date(entry.meal_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </td>
                      <td className="py-3 font-sans text-xs font-bold text-slate-800 dark:text-white">
                        {formatLabel(entry.meal_type)}: {entry.description}
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300">{entry.calories != null ? `${entry.calories}kcal` : "—"}</td>
                      <td className="py-3 text-slate-500">{entry.carbs_g != null ? `${entry.carbs_g} gc` : "—"}</td>
                      <td className="py-3 text-slate-500">{entry.protein_g != null ? `${entry.protein_g} gp` : "—"}</td>
                      <td className="py-3 text-slate-500">{entry.fat_g != null ? `${entry.fat_g} gf` : "—"}</td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          disabled={flagBusyId === entry.id}
                          onClick={() => void toggleFlag(entry)}
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-0.5 font-sans text-[8px] font-bold uppercase disabled:opacity-50 ${
                            entry.flagged ? "bg-amber-500/15 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                          }`}
                          title={entry.flag_reason ?? undefined}
                        >
                          <span className={`size-1 rounded-full ${entry.flagged ? "bg-amber-500" : "bg-emerald-500"}`} />
                          {entry.flagged ? "Flagged" : "OK"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!foodLogLoading && foodLog.length === 0 && (
                    <tr><td colSpan={7} className="py-6 text-center text-slate-400">
                      {foodLogOperatorId ? "No meals logged for this operator in the last 24 hours." : "Select an operator to view their food log."}
                    </td></tr>
                  )}
                  {foodLogLoading && (
                    <tr><td colSpan={7} className="py-6 text-center text-slate-400">Loading food log&hellip;</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "consults" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Today"
              value={formatNumber(queueSummary?.today_count)}
              subtext={
                queueSummary
                  ? `${queueSummary.today_follow_up_count} follow-up${queueSummary.today_follow_up_count === 1 ? "" : "s"} · ${queueSummary.today_new_count} new`
                  : "Real scheduled sessions today."
              }
            />
            <MetricCard
              title="This Week"
              value={formatNumber(queueSummary?.week_count)}
              subtext={queueSummary ? `${queueSummary.week_start} → ${queueSummary.week_end}` : "Real scheduled sessions, Mon–Fri."}
            />
            <MetricCard
              title="Prep Ready"
              value={queueSummary ? `${queueSummary.today_prep_ready_count}` : "—"}
              subtext={queueSummary ? `of ${queueSummary.today_count} today` : "Sessions with every checklist item done."}
            />
            <MetricCard
              title="Avg Duration"
              value={queueSummary?.avg_duration_minutes != null ? `${queueSummary.avg_duration_minutes}m` : "—"}
              subtext={
                queueSummary?.avg_duration_minutes != null
                  ? `last ${queueSummary.duration_window_days} days · ${queueSummary.duration_sample_size} tracked`
                  : "No started+completed sessions tracked yet."
              }
            />
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Scheduled Consults</h3>
                <p className="mt-0.5 text-[10px] text-slate-400">Real, provider-scheduled specialist sessions &middot; next 14 days.</p>
              </div>
              <button
                type="button"
                onClick={() => setScheduleOpen(true)}
                className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
              >
                + Schedule consult
              </button>
            </div>

            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["today", "Today"],
                    ["week", "This week"],
                    ["pending_prep", "Pending prep"],
                    ["all", "All"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setQueueFilter(key)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                      queueFilter === key
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                placeholder="Search airman or reason…"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-white md:w-64"
              />
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Airman</th>
                    <th className="pb-3 font-semibold">Reason</th>
                    <th className="pb-3 font-semibold">Prep checklist</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Time</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredSessions.map((session) => (
                    <tr key={session.id}>
                      <td className="py-3 font-semibold text-slate-800 dark:text-white align-top">
                        {session.attendee_user_ids.map((id) => operatorNameById.get(id) ?? id).join(", ") || session.group_label || "—"}
                      </td>
                      <td className="py-3 text-slate-500 align-top">{session.topic ?? "—"}</td>
                      <td className="py-3 align-top">
                        {session.prep_checklist.length > 0 ? (
                          <div className="space-y-1">
                            {session.prep_checklist.map((item) => (
                              <label key={item.label} className="flex cursor-pointer items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={item.done}
                                  onChange={(e) => void toggleChecklistItem(session.id, item.label, e.target.checked)}
                                  className="size-3 rounded border-slate-300"
                                />
                                <span className={item.done ? "line-through text-slate-400" : ""}>{item.label}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 text-slate-500 align-top">{session.session_date}</td>
                      <td className="py-3 font-mono text-slate-500 align-top">{session.start_time.slice(0, 2)}:{session.start_time.slice(2)}</td>
                      <td className="py-3 align-top">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(session.status)}`}>{formatLabel(session.status)}</span>
                        {session.duration_minutes != null && (
                          <span className="mt-1 block text-[9px] text-slate-400">{session.duration_minutes}m</span>
                        )}
                      </td>
                      <td className="py-3 text-right align-top">
                        {session.status === "scheduled" && (
                          <div className="inline-flex gap-1.5">
                            <button
                              type="button"
                              disabled={sessionActionBusyId === session.id}
                              onClick={() => void startSession(session.id)}
                              className="rounded-lg bg-[var(--brand-color)] px-2 py-1 text-[10px] font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
                            >
                              Start
                            </button>
                            <button
                              type="button"
                              disabled={sessionActionBusyId === session.id}
                              onClick={() => void updateSessionStatus(session.id, "cancelled")}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-rose-500 hover:bg-rose-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-rose-950/20 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {session.status === "in_progress" && (
                          <div className="inline-flex gap-1.5">
                            <button
                              type="button"
                              disabled={sessionActionBusyId === session.id}
                              onClick={() => void updateSessionStatus(session.id, "completed")}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 cursor-pointer"
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              disabled={sessionActionBusyId === session.id}
                              onClick={() => void updateSessionStatus(session.id, "cancelled")}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-rose-500 hover:bg-rose-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-rose-950/20 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredSessions.length === 0 && (
                    <tr><td colSpan={7} className="py-6 text-center text-slate-400">No consults match this view.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {hydrationAlerts.map((alert) => (
            <div
              key={alert.flight_id}
              className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs dark:border-amber-500/20 dark:bg-amber-950/20"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-bold text-amber-800 dark:text-amber-300">
                    Hydration reminder &middot; {alert.flight_name}
                  </p>
                  <p className="mt-1 text-amber-700 dark:text-amber-400">
                    Real hydration adherence below {alert.threshold_pct}% for {alert.streak_days}+ consecutive days
                    {alert.latest_adherence_pct != null ? ` (latest: ${alert.latest_adherence_pct}%)` : ""} &middot; {alert.members.length} members.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openComposeForAlert(alert)}
                  className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
                >
                  Message flight
                </button>
              </div>
            </div>
          ))}

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
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setRecordsSummaryOpen(true)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
            >
              Records
            </button>
            <button
              type="button"
              disabled={!foodLogOperatorId}
              onClick={() => setNewNoteOpen(true)}
              className="rounded-xl bg-[var(--brand-color)] px-3.5 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              + New note
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-4">
              <div className="mb-3 border-b border-slate-100 pb-3 dark:border-white/5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Caseload &middot; {operators.length}</h3>
                <p className="mt-0.5 text-[10px] text-slate-400">Assigned operators with nutrition context.</p>
              </div>
              <input
                type="text"
                value={recordsSearch}
                onChange={(e) => setRecordsSearch(e.target.value)}
                placeholder="Search airman…"
                className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              />
              <div className="max-h-[560px] space-y-1 overflow-y-auto">
                {operators
                  .filter((o) => (o.user_name ?? "").toLowerCase().includes(recordsSearch.trim().toLowerCase()))
                  .map((operator) => (
                    <div
                      key={operator.user_id}
                      onClick={() => setFoodLogOperatorId(operator.user_id)}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl p-3 text-xs transition ${
                        foodLogOperatorId === operator.user_id
                          ? "border border-[var(--brand-color)]/30 bg-[var(--brand-color)]/10"
                          : "border border-transparent hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div>
                        <span className="block font-bold text-slate-800 dark:text-white">{operator.user_name ?? "—"}</span>
                        <span className="block text-[10px] text-slate-400">{operator.assigned_action_title ?? "No active action"}</span>
                      </div>
                      {operator.nutrition_signals?.meal_consistency_trend && (
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${statusTone(operator.nutrition_signals.meal_consistency_trend)}`}>
                          {formatLabel(operator.nutrition_signals.meal_consistency_trend)}
                        </span>
                      )}
                    </div>
                  ))}
                {operators.length === 0 && <p className="py-6 text-center text-xs text-slate-400">No assigned operators.</p>}
              </div>
            </Card>

            <div className="space-y-6 lg:col-span-8">
              <Card>
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 dark:border-white/5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white">
                      {operatorNameById.get(foodLogOperatorId ?? "") ?? "Select an operator"}
                    </h2>
                    {foodLogOperatorId && (
                      <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                        {(() => {
                          const op = operators.find((o) => o.user_id === foodLogOperatorId);
                          return op?.latest_request_status
                            ? `Latest request: ${formatLabel(op.latest_request_status)}`
                            : "No open requests";
                        })()}
                      </p>
                    )}
                  </div>
                  {foodLogOperatorId && (
                    <div className="text-right text-xs">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Nutritional readiness</span>
                      <span className="font-mono text-lg font-bold text-slate-800 dark:text-white">
                        {formatNumber(operators.find((o) => o.user_id === foodLogOperatorId)?.relevant_component_score)}
                      </span>
                    </div>
                  )}
                </div>
                {foodLogOperatorId &&
                  (() => {
                    const op = operators.find((o) => o.user_id === foodLogOperatorId);
                    if (!op) return null;
                    return (
                      <div className="mt-3 grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
                        <div className="space-y-0.5">
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Age / Sex</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {op.age != null ? op.age : "—"} &middot; {op.sex ?? "—"}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Height / Weight</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {op.height_in != null ? `${op.height_in} in` : "—"} &middot; {op.weight_lb != null ? `${op.weight_lb} lb` : "—"}
                            {op.bmi != null ? ` / BMI ${op.bmi}` : ""}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Allergies</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {performanceSummary?.medication_allergy_considerations_if_authorized ?? "Not authorized/released"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                {performanceSummary ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5 text-xs dark:border-white/5 dark:bg-slate-900/60 md:grid-cols-2">
                    {performanceSummary.nutrition_considerations && (
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Nutrition considerations</span>
                        <p className="mt-0.5 text-slate-700 dark:text-slate-200">{performanceSummary.nutrition_considerations}</p>
                      </div>
                    )}
                    {performanceSummary.sleep_recovery_considerations && (
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Sleep/recovery considerations</span>
                        <p className="mt-0.5 text-slate-700 dark:text-slate-200">{performanceSummary.sleep_recovery_considerations}</p>
                      </div>
                    )}
                    <p className="col-span-full text-[9px] text-slate-400">
                      Real, PT/IM-authored performance summary &middot; DOCX Table 23 &middot; approved {performanceSummary.review_date}. No raw medical records.
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-[10px] text-slate-400">
                    Nutritionist has access to minimum relevant health-history context only (DOCX Section 8.8) - no raw medical records, and no approved performance summary released to this pathway yet.
                  </p>
                )}
                <div className="mt-3 flex gap-4 border-t border-slate-100 pt-3 text-xs font-bold dark:border-white/5">
                  {(
                    [
                      ["food_log", "Food log"],
                      ["action_history", "Nutrition Action history"],
                      ["assessments", "Assessments"],
                      ["access_log", "Access log"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRecordsSubTab(key)}
                      className={`cursor-pointer border-b-2 pb-1 transition ${
                        recordsSubTab === key
                          ? "border-[var(--brand-color)] text-[var(--brand-color)]"
                          : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Card>

              {recordsSubTab === "food_log" && (
                <Card>
                  <CardHeader title="Food Log" subtitle="Real operator-logged meals, last 24 hours." />
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:border-white/5">
                          <th className="pb-2 w-12">Time</th>
                          <th className="pb-2 w-1/3">Entry</th>
                          <th className="pb-2">Kcal</th>
                          <th className="pb-2 text-right">Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono dark:divide-white/5">
                        {foodLog.map((entry) => (
                          <tr key={entry.id}>
                            <td className="py-2.5 text-[10px] text-slate-500">
                              {new Date(entry.meal_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                            </td>
                            <td className="py-2.5 font-sans text-xs font-bold text-slate-800 dark:text-white">
                              {formatLabel(entry.meal_type)}: {entry.description}
                            </td>
                            <td className="py-2.5 text-slate-600 dark:text-slate-300">{entry.calories != null ? `${entry.calories}kcal` : "—"}</td>
                            <td className="py-2.5 text-right">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-sans text-[8px] font-bold uppercase ${entry.flagged ? "bg-amber-500/15 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                                {entry.flagged ? "Flagged" : "OK"}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {!foodLogLoading && foodLog.length === 0 && (
                          <tr><td colSpan={4} className="py-6 text-center text-slate-400">{foodLogOperatorId ? "No meals logged in the last 24 hours." : "Select an operator."}</td></tr>
                        )}
                        {foodLogLoading && <tr><td colSpan={4} className="py-6 text-center text-slate-400">Loading…</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {recordsSubTab === "action_history" && (
                <Card>
                  <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Nutrition Action history</h3>
                      <p className="mt-0.5 text-[10px] text-slate-400">Real, dated macro targets &middot; adherence computed from real logged meals.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/nutritionist/consults")}
                      className="text-xs font-bold text-[var(--brand-color)] hover:underline cursor-pointer"
                    >
                      Schedule consult →
                    </button>
                  </div>

                  {foodLogOperatorId && (
                    <div className="mb-4 space-y-2.5 rounded-xl border border-slate-200 p-3.5 dark:border-white/10">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Set new target</p>
                      <input
                        type="text"
                        value={targetForm.title}
                        onChange={(e) => setTargetForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Rehab · protein 1.5 g/kg target post-op recovery"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                      />
                      <div className="flex flex-wrap items-end gap-2">
                        {(["carbs_pct", "protein_pct", "fat_pct"] as const).map((key) => (
                          <label key={key} className="flex flex-col gap-1 text-[10px] font-semibold text-slate-500">
                            {key === "carbs_pct" ? "Carbs %" : key === "protein_pct" ? "Protein %" : "Fat %"}
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={targetForm[key]}
                              onChange={(e) => setTargetForm((f) => ({ ...f, [key]: e.target.value }))}
                              className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                            />
                          </label>
                        ))}
                        <button
                          type="button"
                          disabled={targetSaving}
                          onClick={() => void saveMacroTarget()}
                          className="ml-auto rounded-lg bg-[var(--brand-color)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
                        >
                          {targetSaving ? "Saving…" : "Start new target"}
                        </button>
                      </div>
                      {targetError && <p className="text-[10px] font-semibold text-rose-500">{targetError}</p>}
                    </div>
                  )}

                  <div className="space-y-4 text-xs">
                    {macroTargetHistory.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5 dark:border-white/5 dark:bg-slate-900/60">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-400">
                              {formatDate(item.started_at)} — {item.ended_at ? formatDate(item.ended_at) : "Present"}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase ${item.status === "active" ? "text-emerald-500" : "text-slate-400"}`}>
                              <span className={`size-1 rounded-full ${item.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                              {item.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white">{item.title}</h4>
                          <p className="font-mono text-[10px] text-slate-500">
                            Target: {item.carbs_pct}/{item.protein_pct}/{item.fat_pct}
                          </p>
                        </div>
                        <div className="flex flex-col items-center justify-center font-mono">
                          <span className="text-[9px] font-bold uppercase text-slate-400">Adherence</span>
                          <span
                            className={`mt-0.5 text-sm font-black ${
                              item.adherence_pct == null ? "text-slate-400" : item.adherence_pct >= 80 ? "text-emerald-500" : "text-amber-500"
                            }`}
                          >
                            {item.adherence_pct != null ? `${item.adherence_pct}%` : "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {!historyLoading && macroTargetHistory.length === 0 && (
                      <p className="py-6 text-center text-slate-400">{foodLogOperatorId ? "No macro targets set yet." : "Select an operator."}</p>
                    )}
                    {historyLoading && <p className="py-6 text-center text-slate-400">Loading…</p>}
                  </div>
                </Card>
              )}

              {recordsSubTab === "assessments" && (
                <Card>
                  <div className="mb-4 border-b border-slate-100 pb-3 dark:border-white/5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Assessments</h3>
                    <p className="mt-0.5 text-[10px] text-slate-400">Real, pathway-siloed specialist notes &middot; visible only to you and Admin.</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    {specialistNotes.map((note) => (
                      <div key={note.id} className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5 dark:border-white/5 dark:bg-slate-900/60">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-slate-800 dark:text-white">{note.title}</span>
                          <div className="flex items-center gap-1.5">
                            {note.escalated && <span className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase bg-rose-500/10 text-rose-500">Escalated</span>}
                            <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${note.documentation_status === "signed" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                              {note.documentation_status}
                            </span>
                          </div>
                        </div>
                        <span className="mt-0.5 block text-[9px] font-mono text-slate-400">{note.note_date} &middot; {formatLabel(note.note_type)}</span>
                        <p className="mt-1.5 text-slate-700 dark:text-slate-200">{note.user_concern}</p>
                        {note.action_assigned && <p className="mt-1 text-[10px] text-slate-500">Action: {note.action_assigned}</p>}
                      </div>
                    ))}
                    {!notesLoading && specialistNotes.length === 0 && (
                      <p className="py-6 text-center text-slate-400">{foodLogOperatorId ? "No specialist notes yet." : "Select an operator."}</p>
                    )}
                    {notesLoading && <p className="py-6 text-center text-slate-400">Loading…</p>}
                  </div>
                </Card>
              )}

              {recordsSubTab === "access_log" && (
                <Card>
                  <div className="mb-4 border-b border-slate-100 pb-3 dark:border-white/5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Access Log</h3>
                    <p className="mt-0.5 text-[10px] text-slate-400">Your real recent actions &middot; not filtered to one operator (no per-record view-tracking exists yet).</p>
                  </div>
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:border-white/5">
                          <th className="pb-2">When</th>
                          <th className="pb-2">Action</th>
                          <th className="pb-2 text-right">Outcome</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono dark:divide-white/5">
                        {myAuditLog.map((entry) => (
                          <tr key={entry.id}>
                            <td className="py-2.5 text-[10px] text-slate-500">{formatDate(entry.created_at, true)}</td>
                            <td className="py-2.5 font-sans text-xs font-bold text-slate-800 dark:text-white">{entry.summary_message}</td>
                            <td className="py-2.5 text-right text-[10px] text-slate-500">{entry.outcome_status}</td>
                          </tr>
                        ))}
                        {!auditLoading && myAuditLog.length === 0 && (
                          <tr><td colSpan={3} className="py-6 text-center text-slate-400">No recent actions.</td></tr>
                        )}
                        {auditLoading && <tr><td colSpan={3} className="py-6 text-center text-slate-400">Loading…</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          </div>

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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
          <Card className="lg:col-span-4 flex flex-col">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Inbox</h3>
              <span className="rounded-full bg-[var(--brand-color)]/15 px-2.5 py-0.5 text-[9px] font-bold uppercase text-[var(--brand-color)]">
                {(threads?.threads as ThreadPreview[] | undefined)?.reduce((sum, t) => sum + t.unread_count, 0) ?? 0} unread
              </span>
            </div>
            <input
              type="text"
              value={messagesSearch}
              onChange={(e) => setMessagesSearch(e.target.value)}
              placeholder="Search messages"
              className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            />
            <div className="max-h-[520px] flex-1 space-y-1 overflow-y-auto">
              {(threads?.threads as ThreadPreview[] | undefined)
                ?.filter(
                  (t) =>
                    !messagesSearch.trim() ||
                    (t.other_user_name ?? "").toLowerCase().includes(messagesSearch.trim().toLowerCase()) ||
                    t.last_message_body.toLowerCase().includes(messagesSearch.trim().toLowerCase()),
                )
                .map((thread) => (
                  <div
                    key={thread.thread_key}
                    onClick={() => void openThread(thread.other_user_id)}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-3 text-xs transition ${
                      selectedThreadUserId === thread.other_user_id ? "bg-[var(--brand-color)]/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="block truncate font-bold text-slate-800 dark:text-white">{thread.other_user_name ?? "—"}</span>
                      <span className="block truncate text-[10px] text-slate-500">{thread.last_message_body}</span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[9px] font-mono text-slate-400">{formatDate(thread.last_message_at)}</span>
                      {thread.unread_count > 0 && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-[var(--brand-color)] text-[9px] font-bold text-white">
                          {thread.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              {(!threads?.threads || threads.threads.length === 0) && (
                <p className="py-6 text-center text-xs text-slate-400">No message threads.</p>
              )}
            </div>
          </Card>

          <Card className="lg:col-span-8 flex min-h-[500px] flex-col">
            {!selectedThreadUserId ? (
              <div className="flex flex-1 items-center justify-center text-xs text-slate-400">Select a thread to view messages.</div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
                  <div>
                    <span className="block text-sm font-bold text-slate-800 dark:text-white">{threadDetail?.other_user_name ?? "—"}</span>
                    <span className="block text-[10px] text-slate-400">{threadDetail?.other_user_role}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto py-4">
                  {threadLoading && <p className="text-center text-xs text-slate-400">Loading…</p>}
                  {!threadLoading &&
                    threadDetail?.messages.map((msg) => {
                      const isMine = msg.sender_id !== selectedThreadUserId;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-md rounded-2xl p-3 text-xs shadow-sm ${
                              isMine
                                ? "rounded-br-none bg-[var(--brand-color)] text-white"
                                : "rounded-bl-none border border-slate-200 bg-white text-slate-800 dark:border-white/5 dark:bg-[#0e1628] dark:text-slate-200"
                            }`}
                          >
                            <p className="leading-relaxed">{msg.body}</p>
                            <span className={`mt-1 block text-right text-[9px] ${isMine ? "text-white/70" : "text-slate-400"}`}>
                              {formatDate(msg.created_at, true)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  {!threadLoading && (!threadDetail || threadDetail.messages.length === 0) && (
                    <p className="text-center text-xs text-slate-400">No messages yet.</p>
                  )}
                </div>
                {chatError && <p className="mb-2 text-[10px] font-semibold text-rose-500">{chatError}</p>}
                <div className="flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void sendChatMessage()}
                    placeholder={`Message ${threadDetail?.other_user_name ?? ""}`}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    disabled={chatSending || !chatInput.trim()}
                    onClick={() => void sendChatMessage()}
                    className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {scheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setScheduleOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0e1628]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Schedule consult</h3>
                <p className="mt-0.5 text-[10px] text-slate-400">Real, provider-scheduled session &middot; assigned caseload only.</p>
              </div>
              <button type="button" onClick={() => setScheduleOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Airman <span className="text-rose-500">*</span>
                <select
                  value={scheduleForm.user_id}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, user_id: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">Select…</option>
                  {operators.map((op) => (
                    <option key={op.user_id} value={op.user_id}>{op.user_name ?? op.user_id}</option>
                  ))}
                </select>
              </label>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Reason
                <input
                  type="text"
                  value={scheduleForm.topic}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, topic: e.target.value }))}
                  placeholder="e.g. Weight mgmt, Recovery nutrition"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Date <span className="text-rose-500">*</span>
                  <input
                    type="date"
                    value={scheduleForm.session_date}
                    onChange={(e) => setScheduleForm((f) => ({ ...f, session_date: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                </label>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Time <span className="text-rose-500">*</span>
                  <input
                    type="time"
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm((f) => ({ ...f, start_time: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                </label>
              </div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Prep checklist (one item per line, optional)
                <textarea
                  value={scheduleForm.prep_items}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, prep_items: e.target.value }))}
                  placeholder={"Pull 7-day food logs\nReview intake form"}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </label>
              {scheduleError && <p className="text-[11px] font-semibold text-rose-500">{scheduleError}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setScheduleOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={scheduleSaving}
                onClick={() => void submitScheduleConsult()}
                className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {scheduleSaving ? "Scheduling…" : "Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {newNoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setNewNoteOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0e1628]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">New assessment note</h3>
                <p className="mt-0.5 text-[10px] text-slate-400">Bound to nutrition scope &middot; audit-logged.</p>
              </div>
              <button type="button" onClick={() => setNewNoteOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Title <span className="text-rose-500">*</span>
                <input
                  type="text"
                  value={newNoteForm.title}
                  onChange={(e) => setNewNoteForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </label>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Airman
                <input
                  type="text"
                  disabled
                  value={operatorNameById.get(foodLogOperatorId ?? "") ?? ""}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400"
                />
              </label>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Type <span className="text-rose-500">*</span>
                <select
                  value={newNoteForm.note_type}
                  onChange={(e) => setNewNoteForm((f) => ({ ...f, note_type: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                >
                  <option value="intake">Initial</option>
                  <option value="follow_up">Follow-up</option>
                </select>
              </label>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Body <span className="text-rose-500">*</span>
                <textarea
                  value={newNoteForm.user_concern}
                  onChange={(e) => setNewNoteForm((f) => ({ ...f, user_concern: e.target.value }))}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </label>
              {noteError && <p className="text-[11px] font-semibold text-rose-500">{noteError}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewNoteOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={noteSaving}
                onClick={() => void submitNewNote()}
                className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {noteSaving ? "Saving…" : "Save note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {recordsSummaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRecordsSummaryOpen(false)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0e1628]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Caseload records summary</h3>
                <p className="mt-0.5 text-[10px] text-slate-400">Real, live aggregate &middot; nutrition scope only.</p>
              </div>
              <button type="button" onClick={() => setRecordsSummaryOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              {[
                ["Scope", "Caseload"],
                ["Airmen", String(operators.length)],
                ["Open support requests", formatNumber(dashboard?.open_request_count)],
                ["Consults today", String(consultsToday)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-white/5">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {composeAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setComposeAlert(null)}>
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0e1628]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Message {composeAlert.flight_name}</h3>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Sends a real, individual message to each selected member via the messaging system.
                </p>
              </div>
              <button type="button" onClick={() => setComposeAlert(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            {composeSentCount != null ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                Sent to {composeSentCount} recipient{composeSentCount === 1 ? "" : "s"}.
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Recipients</p>
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-white/10">
                    {composeAlert.members.map((member) => (
                      <label
                        key={member.id}
                        className={`flex items-center gap-2 rounded px-1.5 py-1 text-xs ${
                          member.messageable ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5" : "cursor-not-allowed opacity-50"
                        }`}
                        title={member.messageable ? undefined : "Not in your caseload - no real messaging relationship"}
                      >
                        <input
                          type="checkbox"
                          disabled={!member.messageable}
                          checked={composeSelectedIds.has(member.id)}
                          onChange={(e) =>
                            setComposeSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(member.id);
                              else next.delete(member.id);
                              return next;
                            })
                          }
                          className="size-3.5 rounded border-slate-300"
                        />
                        <span className="text-slate-700 dark:text-slate-200">
                          {member.name ?? member.id}
                          {!member.messageable && <span className="ml-1 text-[9px] text-slate-400">(not in caseload)</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Message
                  <textarea
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                </label>
                {composeError && <p className="text-[11px] font-semibold text-rose-500">{composeError}</p>}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setComposeAlert(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={composeSending}
                    onClick={() => void sendComposeMessages()}
                    className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {composeSending ? "Sending…" : `Send to ${composeSelectedIds.size}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

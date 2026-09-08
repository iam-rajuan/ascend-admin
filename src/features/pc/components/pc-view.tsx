"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/staff-api";
import {
  getChaplainCaseload,
  getChaplainDashboardSummary,
  getChaplainOptInAudit,
  getCaseloadReflections,
  getReflectionThemeBreakdown,
  getChaplainPastoralCareToday,
  listSpecialistNotes,
  createSpecialistNote,
  signSpecialistNote,
  getMyAuditLog,
  getMessageThreads,
  getMessageThread,
  sendMessage,
  buildWsUrl,
  type ChaplainCaseloadRow,
  type ChaplainDashboardSummary,
  type ChaplainOptInAuditEntry,
  type CaseloadReflectionEntry,
  type ReflectionThemeBreakdownResponse,
  type ChaplainPastoralCareSession,
  type SpecialistNoteEntry,
  type MyAuditLogEntry,
  type MessageThreadDetailResponse,
} from "@/lib/role-dashboards-api";

export type TabType = "caseload" | "reflections" | "messages";

const REFLECTION_THEMES = ["Purpose", "Values", "Transition", "Gratitude", "Grief", "Other"] as const;

function formatNumber(value: unknown, fallback = "—") {
  return typeof value === "number" ? value.toLocaleString("en-US") : fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "numeric", minute: "2-digit" });
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace(/_/g, " ");
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

function ConsentBanner({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-[10px] text-slate-500 dark:border-white/5 dark:bg-slate-900/40 dark:text-slate-400">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mt-0.5 size-4 shrink-0 text-[var(--brand-color)]">
        <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p>{text}</p>
    </div>
  );
}

export function PcView({ activeTab = "caseload" }: { activeTab?: TabType }) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState<ChaplainDashboardSummary | null>(null);
  const [caseload, setCaseload] = useState<ChaplainCaseloadRow[]>([]);
  const [optInAudit, setOptInAudit] = useState<ChaplainOptInAuditEntry[]>([]);
  const [themeBreakdown, setThemeBreakdown] = useState<ReflectionThemeBreakdownResponse | null>(null);
  const [sessionsToday, setSessionsToday] = useState<ChaplainPastoralCareSession[]>([]);
  const [auditLog, setAuditLog] = useState<MyAuditLogEntry[]>([]);

  const codeByUserId = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of caseload) map[row.user_id] = row.airman_code;
    return map;
  }, [caseload]);

  const refreshAll = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const [summaryData, caseloadData, auditData, themesData, todayData, myAuditData] = await Promise.all([
        getChaplainDashboardSummary(accessToken),
        getChaplainCaseload(accessToken),
        getChaplainOptInAudit(accessToken),
        getReflectionThemeBreakdown(accessToken, 30),
        getChaplainPastoralCareToday(accessToken),
        getMyAuditLog(accessToken, 1, 20),
      ]);
      setSummary(summaryData);
      setCaseload(caseloadData.caseload);
      setOptInAudit(auditData.entries);
      setThemeBreakdown(themesData);
      setSessionsToday(todayData.sessions);
      setAuditLog(myAuditData.entries);
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

  // ---- Reflections tab: filterable caseload-wide reflection list ----
  const [reflections, setReflections] = useState<CaseloadReflectionEntry[]>([]);
  const [reflectionsLoading, setReflectionsLoading] = useState(false);
  const [themeFilter, setThemeFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadReflections = async () => {
    if (!accessToken) return;
    setReflectionsLoading(true);
    try {
      const data = await getCaseloadReflections(accessToken, {
        theme: themeFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setReflections(data.reflections);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setReflectionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reflections" && accessToken) {
      void loadReflections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, accessToken, themeFilter, dateFrom, dateTo]);

  // ---- Pastoral note composer ----
  const [noteTargetUserId, setNoteTargetUserId] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [noteSuccess, setNoteSuccess] = useState("");
  const [targetNotes, setTargetNotes] = useState<SpecialistNoteEntry[]>([]);

  useEffect(() => {
    if (!accessToken || !noteTargetUserId) {
      setTargetNotes([]);
      return;
    }
    void listSpecialistNotes(accessToken, noteTargetUserId)
      .then((data) => setTargetNotes(data.notes))
      .catch(() => setTargetNotes([]));
  }, [accessToken, noteTargetUserId]);

  const saveDraftNote = async () => {
    if (!accessToken || !noteTargetUserId || !noteTitle.trim() || !noteBody.trim()) {
      setNoteError("Select an airman and fill in title + note.");
      return;
    }
    setNoteSaving(true);
    setNoteError("");
    setNoteSuccess("");
    try {
      await createSpecialistNote(accessToken, noteTargetUserId, {
        title: noteTitle.trim(),
        user_concern: noteBody.trim(),
        note_type: "follow_up",
      });
      setNoteSuccess("Pastoral note saved as draft.");
      const data = await listSpecialistNotes(accessToken, noteTargetUserId);
      setTargetNotes(data.notes);
      setNoteTitle("");
      setNoteBody("");
    } catch (err) {
      setNoteError(getApiErrorMessage(err));
    } finally {
      setNoteSaving(false);
    }
  };

  const signNote = async (noteId: string) => {
    if (!accessToken) return;
    try {
      await signSpecialistNote(accessToken, noteId);
      const data = await listSpecialistNotes(accessToken, noteTargetUserId);
      setTargetNotes(data.notes);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  // ---- Reach out (initial chaplain-authored outreach message) ----
  const [reachOutOpen, setReachOutOpen] = useState(false);
  const [reachOutCode, setReachOutCode] = useState("");
  const [reachOutTopic, setReachOutTopic] = useState("");
  const [reachOutPreview, setReachOutPreview] = useState("");
  const [reachOutSaving, setReachOutSaving] = useState(false);
  const [reachOutError, setReachOutError] = useState("");

  const submitReachOut = async () => {
    if (!accessToken) return;
    const normalizedCode = reachOutCode.trim().toUpperCase();
    const target = caseload.find((row) => row.airman_code === normalizedCode);
    if (!normalizedCode || !target) {
      setReachOutError("Enter a valid airman code from your opted-in caseload.");
      return;
    }
    if (!reachOutTopic || !reachOutPreview.trim()) {
      setReachOutError("Select a topic and write an opening message.");
      return;
    }
    setReachOutSaving(true);
    setReachOutError("");
    try {
      await sendMessage(accessToken, {
        recipient_id: target.user_id,
        body: `[${reachOutTopic}] ${reachOutPreview.trim()}`,
      });
      setReachOutOpen(false);
      router.push("/dashboard/pc/messages");
    } catch (err) {
      setReachOutError(getApiErrorMessage(err));
    } finally {
      setReachOutSaving(false);
    }
  };

  // ---- Messages tab ----
  const [threads, setThreads] = useState<Array<{ other_user_id: string; other_user_name: string | null; last_message_preview?: string; last_message_at?: string; unread_count?: number }>>([]);
  const [threadSearch, setThreadSearch] = useState("");
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

  const loadThreads = async () => {
    if (!accessToken) return;
    try {
      const data = await getMessageThreads(accessToken);
      setThreads(data.threads as typeof threads);
    } catch (err) {
      setChatError(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    if (activeTab === "messages" && accessToken) {
      void loadThreads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, accessToken]);

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
      setThreads(threadsRes.threads as typeof threads);
    } catch (err) {
      setChatError(getApiErrorMessage(err));
    } finally {
      setChatSending(false);
    }
  };

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
        void loadThreads();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const codeFor = (userId: string) => codeByUserId[userId] ?? "A-????";
  const avatarInitials = (userId: string) => {
    const digits = codeFor(userId).replace(/\D/g, "");
    return `A${digits.charAt(0) || "?"}`;
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

  const headerTitle =
    activeTab === "reflections" ? "Reflections & records" : activeTab === "messages" ? "Messages" : "Today's Caseload";
  const headerSubtitle =
    activeTab === "reflections"
      ? "Opt-in confirmations, reflection entries, and confidential notes for airmen who consented to the Purpose pathway."
      : activeTab === "messages"
        ? "One thread per airman - private to the airman, not visible to leadership."
        : "Anonymized caseload, opt-in reflections, and privileged pastoral messages.";

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Purpose · Chaplain Pathway</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{headerTitle}</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{headerSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "reflections" && (
            <>
              <button
                onClick={() => router.push("/dashboard/pc/caseload")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
                type="button"
              >
                Caseload
              </button>
              <button
                onClick={() => {
                  setReachOutError("");
                  setReachOutCode("");
                  setReachOutTopic("");
                  setReachOutPreview("");
                  setReachOutOpen(true);
                }}
                className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
                type="button"
              >
                + Reach out
              </button>
            </>
          )}
          <button
            onClick={() => void refreshAll()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
            type="button"
          >
            Refresh
          </button>
        </div>
      </div>

      {activeTab === "caseload" && (
        <div className="space-y-6">
          <ConsentBanner text="Active opt-in consent required. Every row below represents an explicit consent - revoked consent removes the record from view within one minute. Airmen appear by anonymized code only - no rank, no PII." />

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Opted-In"
              value={formatNumber(summary?.opted_in_count)}
              subtext={`+${summary?.opted_in_count_delta_this_month ?? 0} this month`}
            />
            <MetricCard title="Active Reflections" value={formatNumber(summary?.active_reflections_count)} subtext="This month." />
            <MetricCard title="Consults Today" value={formatNumber(summary?.consults_today_count)} subtext="Scheduled." accent="text-cyan-500" />
            <MetricCard
              title="First-Time Engagements"
              value={formatNumber(summary?.first_time_engagement_count)}
              subtext="Welcome &amp; consent."
              accent="text-amber-500"
            />
          </div>

          <Card>
            <CardHeader title="Caseload - opted-in" subtitle="Anonymized codes only. No rank, no PII." />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Airman code</th>
                    <th className="pb-3 font-semibold">Opt-in date</th>
                    <th className="pb-3 font-semibold">Reflection cadence</th>
                    <th className="pb-3 font-semibold">Last contact</th>
                    <th className="pb-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {caseload.map((row) => (
                    <tr key={row.user_id}>
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">
                        {row.airman_code}
                        {row.is_new && <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-500">NEW</span>}
                      </td>
                      <td className="py-3 text-slate-500">{formatDate(row.opt_in_date)}</td>
                      <td className="py-3 text-slate-500">{row.reflection_cadence ? formatLabel(row.reflection_cadence) : "Not set"}</td>
                      <td className="py-3 text-slate-500">
                        {row.last_contact_at ? `${formatDate(row.last_contact_at)} · ${row.last_contact_type}` : "—"}
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => router.push(row.suggested_action === "welcome" ? "/dashboard/pc/reflections" : "/dashboard/pc/messages")}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                        >
                          {row.suggested_action === "welcome" ? "Welcome" : "Message"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {caseload.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-400">No airmen currently opted in.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Reflection themes - this month"
              subtitle={`Aggregated across ${themeBreakdown?.total_entries ?? 0} entries. Identifies only themes, never authorship.`}
            />
            <div className="space-y-4 text-xs">
              {(() => {
                const themes = themeBreakdown?.themes ?? [];
                const maxCount = Math.max(1, ...themes.map((t) => t.count));
                return themes.map((t) => (
                  <div key={t.theme}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{t.theme}</span>
                      <span className="text-slate-400">{t.count} {t.count === 1 ? "entry" : "entries"}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-slate-400 dark:bg-slate-500"
                        style={{ width: `${Math.max(4, (t.count / maxCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ));
              })()}
              {(!themeBreakdown || themeBreakdown.themes.length === 0) && <p className="text-slate-400">No reflections logged this window.</p>}
            </div>
            {themeBreakdown && themeBreakdown.themes.length > 0 && (
              <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] text-slate-400 dark:border-white/5">
                Theme-count · Of {themeBreakdown.total_entries} active reflections
              </p>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Pastoral care - today"
              subtitle={
                sessionsToday.length > 0
                  ? `${sessionsToday.length} consult${sessionsToday.length === 1 ? "" : "s"} on the schedule.`
                  : "Real scheduled sessions from your caseload."
              }
            />
            <div className="space-y-4 text-xs">
              {sessionsToday.map((s) => {
                const categoryMeta: Record<ChaplainPastoralCareSession["category"], { label: string; tone: string; desc: string }> = {
                  first_time: { label: "WELCOME", tone: "bg-cyan-500/10 text-cyan-500", desc: "Welcome, consent, listening" },
                  returning: {
                    label: "RETURNING",
                    tone: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                    desc: "Continuation - cadence holds steady",
                  },
                  brief: { label: "BRIEF", tone: "bg-amber-500/10 text-amber-500", desc: "Light pastoral touch" },
                  group: { label: "GROUP", tone: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300", desc: "Group session" },
                };
                const meta = categoryMeta[s.category];
                return (
                  <div key={s.id} className="flex items-start gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--brand-color)]" />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {s.start_time.slice(0, 2)}:{s.start_time.slice(2)}
                        {s.planned_duration_minutes ? ` - ${s.planned_duration_minutes} MIN` : ""}
                      </p>
                      <p className="mt-0.5 font-semibold text-slate-800 dark:text-white">
                        {s.airman_code ?? s.group_label ?? "Group"} · {meta.label === "WELCOME" ? "First-time engagement" : meta.label === "BRIEF" ? "Brief check-in" : "Returning"}
                      </p>
                      <p className="text-slate-400">{s.topic ? `${meta.desc} · ${s.topic}` : meta.desc}</p>
                    </div>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${meta.tone}`}>{meta.label}</span>
                  </div>
                );
              })}
              {sessionsToday.length === 0 && <p className="text-slate-400">No pastoral sessions scheduled today.</p>}
            </div>
          </Card>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-[10px] text-slate-500 dark:border-white/5 dark:bg-slate-900/40 dark:text-slate-400">
            <p className="font-bold text-slate-700 dark:text-slate-300">Purpose Action - opt-in only - limited question scope</p>
            <p className="mt-1">
              Purpose Actions are suggested only for airmen with active consent on this surface, and never route through
              medical controls, the unrestricted Performance Summary, or Level 4 metrics. Revoked consent immediately
              removes a record from view and from any in-flight action.
            </p>
          </div>
        </div>
      )}

      {activeTab === "reflections" && (
        <div className="space-y-6">
          <ConsentBanner text="Records below reflect explicit consent only. Revocation removes the record from view within one minute. This surface is privileged communication - access is logged, and sharing outside this workspace is a policy violation." />

          <Card>
            <CardHeader title="Opt-in confirmation audit" subtitle="Every opt-in and opt-out, timestamped. Trail visible only to Purpose pathway roles." />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">Airman code</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Recorded</th>
                    <th className="pb-3 font-semibold">Method</th>
                    <th className="pb-3 font-semibold">Witness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {optInAudit.map((entry, index) => (
                    <tr key={`${entry.user_id}-${index}`}>
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{entry.airman_code}</td>
                      <td className="py-3">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${entry.status === "disabled" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                          {entry.status_label}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{formatDateTime(entry.recorded_at)}</td>
                      <td className="py-3 text-slate-500">{entry.method_label ?? "—"}</td>
                      <td className="py-3 text-slate-500">{entry.witness_name ?? "—"}</td>
                    </tr>
                  ))}
                  {optInAudit.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-400">No opt-in records yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Spiritual reflection entries</h3>
                <p className="mt-0.5 text-[10px] text-slate-400">Entries are private to the consenting airman and to you.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {([["", "All themes"], ...REFLECTION_THEMES.map((t) => [t, t] as [string, string])] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setThemeFilter(value)}
                      className={`rounded-full border px-3 py-1 text-[10px] font-bold cursor-pointer ${
                        themeFilter === value
                          ? "border-[var(--brand-color)] text-[var(--brand-color)]"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-slate-900"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
            <p className="mb-3 text-[10px] text-slate-400">{reflectionsLoading ? "Loading..." : `Showing ${reflections.length} entries`}</p>
            <div className="space-y-3 text-xs">
              {reflections.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-100 p-4 dark:border-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">
                        {formatDate(r.created_at)} · {r.airman_code} · <span className="uppercase">{r.theme}</span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{r.word_count} words</p>
                    </div>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${r.flag === "tender" ? "bg-amber-500/10 text-amber-500" : "bg-sky-500/10 text-sky-500"}`}>
                      {r.flag.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-2 italic text-slate-500 dark:text-slate-400">&quot;{r.body}&quot;</p>
                </div>
              ))}
              {!reflectionsLoading && reflections.length === 0 && <p className="text-slate-400">No reflections match this filter.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Pastoral note" subtitle="Privileged - visible only to you. Not for leadership review." />
            <div className="space-y-3 text-xs">
              <select
                value={noteTargetUserId}
                onChange={(e) => setNoteTargetUserId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Select an airman</option>
                {caseload.map((row) => (
                  <option key={row.user_id} value={row.user_id}>{row.airman_code}</option>
                ))}
              </select>
              {noteTargetUserId && (
                <>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                  <textarea
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    rows={3}
                    placeholder="Note"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                  {noteError && <p className="text-rose-500">{noteError}</p>}
                  {noteSuccess && <p className="text-emerald-500">{noteSuccess}</p>}
                  <button
                    type="button"
                    disabled={noteSaving}
                    onClick={() => void saveDraftNote()}
                    className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {noteSaving ? "Saving..." : "Save pastoral note"}
                  </button>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-white/5">
                    {targetNotes.map((n) => (
                      <div key={n.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-white/5">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{n.title}</p>
                          <p className="text-[10px] text-slate-400">{formatDateTime(n.created_at)} · {n.documentation_status}</p>
                        </div>
                        {n.documentation_status === "draft" && (
                          <button
                            type="button"
                            onClick={() => void signNote(n.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                          >
                            Sign
                          </button>
                        )}
                      </div>
                    ))}
                    {targetNotes.length === 0 && <p className="text-slate-400">No pastoral notes for this airman yet.</p>}
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Records access log" subtitle="Every read, write, and export is recorded. Audit only - never surfaced to leadership." />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                    <th className="pb-3 font-semibold">When</th>
                    <th className="pb-3 font-semibold">Action</th>
                    <th className="pb-3 font-semibold">Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {auditLog.map((entry) => (
                    <tr key={entry.id}>
                      <td className="py-3 text-slate-500">{formatDateTime(entry.created_at)}</td>
                      <td className="py-3 text-slate-800 dark:text-white">{formatLabel(entry.event_type)}</td>
                      <td className="py-3 text-slate-500">{formatLabel(entry.target_entity_type)}</td>
                    </tr>
                  ))}
                  {auditLog.length === 0 && (
                    <tr><td colSpan={3} className="py-6 text-center text-slate-400">No recorded actions yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "messages" && (() => {
        const totalUnread = threads.reduce((sum, t) => sum + (t.unread_count ?? 0), 0);
        const filteredThreads = threadSearch.trim()
          ? threads.filter((t) => codeFor(t.other_user_id).toLowerCase().includes(threadSearch.trim().toLowerCase()))
          : threads;
        return (
        <div className="space-y-4">
          <ConsentBanner text="Active opt-in consent required - revoked consent = immediate access removal. Threads below are reachable only to airmen who explicitly opted in. If consent is revoked, the thread is removed from this surface within one minute." />
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]" style={{ height: "70vh" }}>
          <Card className="flex flex-col overflow-hidden p-0">
            <div className="border-b border-slate-100 p-4 dark:border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Threads</h3>
                {totalUnread > 0 && (
                  <span className="text-[10px] font-bold text-[var(--brand-color)]">{totalUnread} UNREAD</span>
                )}
              </div>
              <input
                type="text"
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                placeholder="Search by code"
                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] dark:border-white/10 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredThreads.map((thread) => (
                <div
                  key={thread.other_user_id}
                  onClick={() => void openThread(thread.other_user_id)}
                  className={`flex cursor-pointer items-start gap-3 border-b border-slate-100 p-4 text-xs dark:border-white/5 ${
                    selectedThreadUserId === thread.other_user_id ? "bg-[var(--brand-color)]/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-color)]/10 text-[10px] font-bold text-[var(--brand-color)]">
                    {avatarInitials(thread.other_user_id)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-white">{codeFor(thread.other_user_id)}</span>
                      {!!thread.unread_count && (
                        <span className="rounded-full bg-[var(--brand-color)] px-1.5 py-0.5 text-[9px] font-bold text-white">{thread.unread_count}</span>
                      )}
                    </div>
                    {thread.last_message_preview && <p className="mt-1 truncate text-slate-400">{thread.last_message_preview}</p>}
                  </div>
                </div>
              ))}
              {filteredThreads.length === 0 && <p className="p-4 text-xs text-slate-400">No message threads match.</p>}
            </div>
          </Card>

          <Card className="flex flex-col overflow-hidden p-0">
            {!selectedThreadUserId ? (
              <div className="flex flex-1 items-center justify-center text-xs text-slate-400">Select a thread to view messages.</div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-color)]/10 text-[10px] font-bold text-[var(--brand-color)]">
                      {avatarInitials(selectedThreadUserId)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{codeFor(selectedThreadUserId)}</p>
                      <p className="text-[10px] text-slate-400">Opted in · private to the airman</p>
                    </div>
                  </div>
                  <span className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Confidential</span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
                  {threadLoading && <p className="text-slate-400">Loading...</p>}
                  {threadDetail?.messages.map((msg) => {
                    const isMine = msg.sender_id !== selectedThreadUserId;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-2xl px-3 py-2 ${
                            isMine ? "bg-[var(--brand-color)] text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                        >
                          <p>{msg.body}</p>
                          <p className={`mt-1 text-[9px] ${isMine ? "text-white/70" : "text-slate-400"}`}>{formatDateTime(msg.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {chatError && <p className="px-4 text-[10px] text-rose-500">{chatError}</p>}
                <div className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-white/5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void sendChatMessage();
                    }}
                    placeholder={`Message ${codeFor(selectedThreadUserId)}`}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    disabled={chatSending}
                    onClick={() => void sendChatMessage()}
                    className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    Send
                  </button>
                </div>
                <p className="border-t border-slate-100 px-4 py-2 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:border-white/5">
                  End-to-end · private to {codeFor(selectedThreadUserId)} · not visible to leadership
                </p>
              </>
            )}
          </Card>
          </div>
        </div>
        );
      })()}

      {reachOutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setReachOutOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0e1628]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reach out</h3>
                <p className="mt-0.5 text-[10px] text-slate-400">Compose an initial chaplain outreach. Private channel.</p>
              </div>
              <button type="button" onClick={() => setReachOutOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Airman code</label>
                <input
                  type="text"
                  value={reachOutCode}
                  onChange={(e) => setReachOutCode(e.target.value)}
                  placeholder="e.g. A-1503"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Topic</label>
                <select
                  value={reachOutTopic}
                  onChange={(e) => setReachOutTopic(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">Select...</option>
                  {REFLECTION_THEMES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Preview</label>
                <textarea
                  value={reachOutPreview}
                  onChange={(e) => setReachOutPreview(e.target.value)}
                  rows={3}
                  placeholder="Brief opening · intent · timing"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </div>
              {reachOutError && <p className="text-rose-500">{reachOutError}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReachOutOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reachOutSaving}
                onClick={() => void submitReachOut()}
                className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {reachOutSaving ? "Sending..." : "Start outreach"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  assignRecommendation,
  sendRecommendationForSignoff,
  upsertReconditioningPlan,
  getMessageThreads,
  getMessageThread,
  sendMessage,
  getLeaveOverlap,
  type LeaveOverlapResponse,
  getTodayPtSessions,
  type TodayPtSessionsResponse,
  getCoverageLoadByFlight,
  type CoverageLoadByFlightResponse,
  getScsDashboard,
  type ScsDashboardData,
  getScsWeeklyAvailability,
  type ScsWeeklyAvailabilityResponse,
} from "@/lib/role-dashboards-api";
import { getApiErrorMessage } from "@/lib/staff-api";
import { useAuthStore } from "@/store/auth-store";
import { AscendLogo } from "@/components/ascend-logo";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { useCurrentUser } from "@/hooks/use-current-user";
import { IconButton } from "@/components/ui/icon-button";
import { RecordDetailDialog } from "@/components/ui/record-detail-dialog";
import { CreateRecordModal } from "@/components/ui/create-record-modal";
import { MockItemBadge } from "@/components/ui/mock-item-badge";
import {
  POPULATION_LEVELS,
  PRIVACY_STATES,
  ALERT_TYPES,
  PLAN_STATUSES,
  REVIEW_STATUS,
} from "@/lib/terminology";
import {
  Landmark,
  Bell,
  Sun,
  Moon,
  Shield,
  Activity,
  ArrowLeft,
  LogOut,
  Info,
  CheckCircle,
  AlertTriangle,
  Download,
  Calendar,
  Plus,
  Send,
  Search,
  ClipboardList,
  User,
  Users,
  Lock,
  MessageSquare,
  Sparkles,
  TrendingUp,
  FileText,
  ArrowLeftRight,
  TrendingDown,
  XCircle,
  ChevronRight,
  UserCheck,
} from "lucide-react";

type TabType = "overview" | "dashboard" | "people" | "plans" | "coverage" | "messages";

interface MessageRow {
  sender: "scs" | "airman";
  text: string;
  time: string;
}

// Real /messaging/threads preview shape (messaging_service.list_threads).
type ThreadPreview = {
  thread_key: string;
  other_user_id: string;
  other_user_name: string | null;
  other_user_role: string;
  last_message_body: string;
  last_message_at: string;
  unread_count: number;
};

// Real /messaging/thread/{other_user_id} message shape (messaging_service._serialize).
type RealMessage = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

function formatRelativeShort(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

type WorkoutRecord = {
  status: string;
  date: string;
  type: string;
  dur: string;
  rpe: string;
  plan: string;
  lim: string;
  rev: string;
  col: string;
};

type TemplateRecord = {
  title: string;
  badge: string;
  star: boolean;
  desc: string;
  details: string;
  cad: string;
  win: string;
  owner: string;
};

type AssignmentRecord = {
  status: string;
  plan: string;
  air: string;
  airUnit: string;
  win: string;
  owner: string;
  comp: string;
  col: string;
  sign: string;
  signBold?: boolean;
};

type QueueRecord = {
  name: string;
  status: string;
  details: string;
};

const WORKOUT_LOG: WorkoutRecord[] = [
  { status: "Done", date: "28 Jul", type: "Rehab · McGill Big 3", dur: "32 min", rpe: "6", plan: "Rehab Block 2", lim: "Sub-80% 1RM deadlift", rev: "Reviewed", col: "green" },
  { status: "Done", date: "27 Jul", type: "Mobility reset", dur: "12 min", rpe: "3", plan: "Rehab Block 2", lim: "—", rev: "Reviewed", col: "green" },
  { status: "Done", date: "25 Jul", type: "Strength · back squat", dur: "45 min", rpe: "7", plan: "Cycle 4 Perf.", lim: "—", rev: "Reviewed", col: "green" },
  { status: "Modified", date: "24 Jul", type: "Tempo run", dur: "24 min", rpe: "5", plan: "OFT Tempo Prep", lim: "HR cap: 165", rev: "Pending", col: "orange" },
  { status: "Skipped", date: "22 Jul", type: "Loaded carry", dur: "—", rpe: "—", plan: "Rehab Block 2", lim: "L4 lower back", rev: REVIEW_STATUS.PENDING, col: "blue" },
  { status: "Done", date: "20 Jul", type: "Endurance · intervals", dur: "36 min", rpe: "7", plan: "Cycle 4 Perf.", lim: "—", rev: "Reviewed", col: "green" },
  { status: "Done", date: "18 Jul", type: "Strength · deadlift", dur: "45 min", rpe: "6", plan: "Rehab Block 2", lim: "Sub-80% 1RM", rev: "Reviewed", col: "green" },
];

const PLAN_TEMPLATES: TemplateRecord[] = [
  { title: "4-week reconditioning", badge: `Reconditioning · ${PLAN_STATUSES.ACTIVE}`, star: true, desc: "Lower back, post-OFT mobility focus · 12 sessions", details: "BLOCK 1 - WEEKS 1-2: Daily mobility reset - 12 min · Sub-60% 1RM deadlift x 3 · Mobility 3 x 4 sets · Loaded carry progression. BLOCK 2 - WEEKS 3-4: Tempo runs x 4 · Box squat progression · Mobility work - 8 min.", cad: "3x/wk · 45 min", win: "28 days · 3 blocks", owner: "SCS + PT/IM · Sign-off: Capt Shah" },
  { title: "Cycle 4 performance", badge: "Performance · Active", star: false, desc: "Strength + endurance · 16 sessions", details: "3+5 back squat progression · 4x8 bench press · Tempo intervals: 4x 5 min · Mobility cooldown: 8 min.", cad: "4x/wk · 60 min", win: "28 days · 4 blocks", owner: "SCS · Plan design" },
  { title: "Sleep reset - 7 day", badge: "Recovery · Draft", star: false, desc: "Anchor sleep + evening cell phone cutoff", details: "Lights-out anchor - 22:30 · Caffeine cutoff - 14:00 · Dim-evening - 21:00 · Morning light - 10 min.", cad: "Daily · ~10 min", win: "7 days · 1 block", owner: "SCS · Self-reported" },
  { title: "Mobility reset - 12 min", badge: "Mobility · Active", star: false, desc: "Hip, T-spine, ankle · daily routine", details: "90/90 hip - 4 min · T-spine rotations - 3 min · Calf stretches - 35 s/side · Ankle/dorsi - 90 s/side.", cad: "Daily · 12 min", win: "14 days · Daily", owner: "SCS · Self-reported" },
  { title: "OFT tempo prep", badge: "OFT prep · Active", star: false, desc: "High-intensity prep · 8 sessions", details: "400m repeats: 6x · Performance pace x 6 · Box jump complex · Sled push: 4x 30m.", cad: "2x/wk · 75 min", win: "28 days · Lane signoff", owner: "SCS + OFT lead · Lane signoff" },
  { title: "PT/IM handoff packet", badge: "Handoff · Draft", star: false, desc: "Scoped medical record for PT/IM and IDMT recipients", details: "OFT clearance + reviews · Clearance status · Open session compliance · Coordination notes.", cad: "Per visit · Scoped", win: "14 days · IDMT share", owner: "SCS + PT/IM · IDMT share" },
];

const SEEDED_ASSIGNMENTS: AssignmentRecord[] = [
  { status: PLAN_STATUSES.PENDING_REVIEW, plan: "Rehab Block 2 · Lower back focus", air: "J. Reyes", airUnit: "SrA · Alpha", win: "22 Jul - 8 Aug", owner: "SCS + PT/IM", comp: "71%", col: "orange", sign: "Capt Shah", signBold: true },
  { status: PLAN_STATUSES.ACTIVE, plan: "Cycle 4 Performance · Strength", air: "T. Cho", airUnit: "SSgt · Alpha", win: "14 Jul - 10 Aug", owner: "SCS", comp: "88%", col: "green", sign: "SCS lead" },
  { status: PLAN_STATUSES.DRAFT, plan: "Sleep Reset · Sleep focus", air: "D. Mendez", airUnit: "SSgt · Alpha", win: "30 Jul - 6 Aug", owner: "SCS", comp: "0%", col: "slate", sign: "—" },
  { status: PLAN_STATUSES.PENDING_REVIEW, plan: "Reconditioning · Chest/T-block", air: "B. Ndiaye", airUnit: "A1C · Bravo", win: "1 Aug - 22 Aug", owner: "SCS + PT/IM", comp: "—", col: "orange", sign: "PT/IM lead" },
  { status: PLAN_STATUSES.ACTIVE, plan: "OFT Tempo Prep · High intensity", air: "K. Patel", airUnit: "A1C · Charlie", win: "20 Jul - 12 Aug", owner: "SCS + OFT", comp: "52%", col: "green", sign: "OFT Lead" },
];

const SEEDED_QUEUE: QueueRecord[] = [
  { name: "B. Ndiaye", status: PLAN_STATUSES.PENDING_REVIEW, details: "Reconditioning · 1 Aug - 22 Aug · SCS + Plan" },
  { name: "D. Okafor", status: PLAN_STATUSES.PENDING_REVIEW, details: "Hip reconditioning · 30 Jul - 27 Aug · SCS + PT/IM" },
];

function getTemplateByTitle(title: string) {
  return PLAN_TEMPLATES.find((template) => template.title === title) ?? PLAN_TEMPLATES[0];
}

// Shared matcher for the "Needs review / OFT / Reconditioning / L4+" queue filter
// pills used on both the Dashboard tab queue and the People roster table.
// "Needs review" = rows with an active concern driver (red/orange coloring),
// distinct from neutral/positive drivers (badge-teal, badge-slate).
function matchesQueuePill(pill: string, row: { dr: string; drCol: string; plan?: string }): boolean {
  switch (pill) {
    case "All 112":
      return true;
    case "OFT":
      return row.dr.includes("OFT") || !!row.plan?.includes("OFT");
    case "Reconditioning":
      return !!row.plan?.includes("Recond");
    case "L4+": {
      const match = row.dr.match(/^L(\d+)/);
      return !!match && Number(match[1]) >= 4;
    }
    case "Needs review":
    default:
      return row.drCol === "red" || row.drCol === "orange" || row.drCol === "badge-orange";
  }
}

// Matcher for the "Active / Rehab / Performance / Reconditioning / Draft"
// filter pills above the Active Assignments table on the Plans tab.
function matchesAssignmentPill(pill: string, row: { status: string; plan: string }): boolean {
  switch (pill) {
    case PLAN_STATUSES.DRAFT:
      return row.status === PLAN_STATUSES.DRAFT;
    case "Rehab":
      return row.plan.startsWith("Rehab");
    case "Performance":
      return row.plan.includes("Performance");
    case "Reconditioning":
      return row.plan.includes("Reconditioning");
    case PLAN_STATUSES.ACTIVE:
    default:
      return row.status === PLAN_STATUSES.ACTIVE;
  }
}

function SectionMismatchNote({ note }: { note: string }) {
  return (
    <div className="rounded-xl border border-rose-500 bg-rose-100 px-4 py-3 text-[11px] font-semibold text-rose-700 shadow-sm dark:border-rose-400 dark:bg-rose-950/40 dark:text-rose-200">
      {note}
    </div>
  );
}

export function ScsView({ activeTab = "overview" }: { activeTab?: TabType }) {
  const router = useRouter();
  const { isAuthenticated, logout, accessToken } = useAuthStore();
  const currentUser = useCurrentUser();
  const plansFormRef = useRef<HTMLDivElement | null>(null);
  
  const { theme, mounted: hasMounted, toggleTheme } = useTheme();
  const { show: showConfirmToast, message: toastMessage, triggerToast } = useToast();

  // Roster tracking
  const [reviewingAirmanId, setReviewingAirmanId] = useState<string | null>(null);

  // Detail dialogs for stub actions
  const [viewingSummary, setViewingSummary] = useState(false);
  const [viewingAuditLog, setViewingAuditLog] = useState(false);
  const [viewingAllWorkouts, setViewingAllWorkouts] = useState(false);
  const [viewingPlanRefs, setViewingPlanRefs] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<TemplateRecord | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<AssignmentRecord | null>(null);
  const [viewingQueueItem, setViewingQueueItem] = useState<QueueRecord | null>(null);

  // Create-record modal open flags + owned state arrays (Phase 4)
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPerfNoteModal, setShowPerfNoteModal] = useState(false);
  const [showAssignPlanModal, setShowAssignPlanModal] = useState(false);
  const [showRecondPlanModal, setShowRecondPlanModal] = useState(false);
  const [showNewDmModal, setShowNewDmModal] = useState(false);
  const [recondPlanError, setRecondPlanError] = useState("");
  const [recondPlanSuccess, setRecondPlanSuccess] = useState("");
  const [isSavingRecondPlan, setIsSavingRecondPlan] = useState(false);
  const [assignAirmanUserId, setAssignAirmanUserId] = useState("");
  const [assignApiError, setAssignApiError] = useState("");
  const [assignApiSuccess, setAssignApiSuccess] = useState("");
  const [isAssigningPlan, setIsAssigningPlan] = useState(false);
  const [queueRecommendationId, setQueueRecommendationId] = useState("");
  const [queueReviewError, setQueueReviewError] = useState("");
  const [queueReviewSuccess, setQueueReviewSuccess] = useState("");
  const [isSendingQueueReview, setIsSendingQueueReview] = useState(false);

  type PerformancePlan = { title: string; badge: string; desc: string; details: string; cad: string; win: string; owner: string };
  const [performancePlans, setPerformancePlans] = useState<PerformancePlan[]>([]);

  type PerformanceNote = { id: string; date: string; text: string; author: string };
  const [performanceNotes, setPerformanceNotes] = useState<PerformanceNote[]>([
    {
      id: "pn-seed-1",
      date: "28 Jul",
      text: "Deadlift session went well today, mobility reset held through warm-up.",
      author: "TSgt Lee",
    },
  ]);

  type AssignedPlanRow = { id: string; status: string; plan: string; air: string; airUnit: string; win: string; owner: string; comp: string; col: string; sign: string; signBold?: boolean };
  const [assignedPlans, setAssignedPlans] = useState<AssignedPlanRow[]>([]);

  type ReconditioningPlan = { id: string; title: string; badge: string; desc: string; cad: string; win: string; owner: string };
  const [reconditioningPlans, setReconditioningPlans] = useState<ReconditioningPlan[]>([]);

  // Phase 6 — Workflow action wiring
  // ① Edit plan wizard (Rehab Block 2) — inline editing panel
  const [editingPlanBlock, setEditingPlanBlock] = useState(false);
  const [editingPlanDraft, setEditingPlanDraft] = useState<PerformancePlan | null>(null);

  // ② Assignment form "Save draft" — draft assignments
  type AssignmentDraft = { id: string; airman: string; plan: string; window: string; coOwner: string; status: string; savedAt: string };
  const [assignmentDrafts, setAssignmentDrafts] = useState<AssignmentDraft[]>([]);

  // ④ Queue item modal "Save changes" — pending edits to queue items
  type QueueItemEdit = { id: string; queueItemId: string; airman: string; fields: { status: string; notes: string }; editedAt: string };
  const [queueItemEdits, setQueueItemEdits] = useState<QueueItemEdit[]>([]);

  // ⑤ Queue item modal "Send to PT/IM" — sent-for-sign-off audit log
  type SentForSignOff = { id: string; airman: string; sentAt: string; by: string };
  const [sentForSignOff, setSentForSignOff] = useState<SentForSignOff[]>([]);

  // Phase 5: J. Reyes profile drill-in sub-tabs (Overview / Trends / Plans / Records / Notes)
  const [personTab, setPersonTab] = useState<"Overview" | "Trends" | "Plans" | "Records" | "Notes">("Overview");

  type DmThread = { initials: string; name: string; time: string; txt: string; unread: boolean; active: boolean };
  const [dmThreads, setDmThreads] = useState<DmThread[]>([]);

  // Chat/Messages states - real, backed by GET /messaging/threads,
  // GET /messaging/thread/{other_user_id}, POST /messaging/send.
  const [threads, setThreads] = useState<ThreadPreview[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadSearch, setThreadSearch] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [activeThreadMessages, setActiveThreadMessages] = useState<RealMessage[]>([]);
  const [activeThreadLoading, setActiveThreadLoading] = useState(false);
  const [typedMessage, setTypedMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const selectedThread = threads.find((t) => t.other_user_id === selectedChatId);

  // Leave overlap (Coverage tab) - real, GET /admin/leave/overlap?days=30.
  const [leaveOverlap, setLeaveOverlap] = useState<LeaveOverlapResponse | null>(null);
  const [leaveOverlapLoading, setLeaveOverlapLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLeaveOverlapLoading(true);
    getLeaveOverlap(accessToken, 30)
      .then(setLeaveOverlap)
      .catch((err) => triggerToast(getApiErrorMessage(err)))
      .finally(() => setLeaveOverlapLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Agenda Timeline (Overview tab) - real, GET /admin/pt-sessions/today.
  const [todaySessions, setTodaySessions] = useState<TodayPtSessionsResponse | null>(null);
  const [todaySessionsLoading, setTodaySessionsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setTodaySessionsLoading(true);
    getTodayPtSessions(accessToken)
      .then(setTodaySessions)
      .catch((err) => triggerToast(getApiErrorMessage(err)))
      .finally(() => setTodaySessionsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Workload by flight (Plans tab) - real, GET /admin/coverage/reconditioning-load-by-flight.
  const [flightLoad, setFlightLoad] = useState<CoverageLoadByFlightResponse | null>(null);
  const [flightLoadLoading, setFlightLoadLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setFlightLoadLoading(true);
    getCoverageLoadByFlight(accessToken)
      .then(setFlightLoad)
      .catch((err) => triggerToast(getApiErrorMessage(err)))
      .finally(() => setFlightLoadLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // SCS dashboard operators - real, GET /dashboard/scs. Shared source for
  // the Overview "Work Queue" and (later) Dashboard/People tab sections -
  // real per-operator flags, not a fabricated aggregate queue.
  const [scsDashboard, setScsDashboard] = useState<ScsDashboardData | null>(null);
  const [scsDashboardLoading, setScsDashboardLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setScsDashboardLoading(true);
    getScsDashboard(accessToken)
      .then(setScsDashboard)
      .catch((err) => triggerToast(getApiErrorMessage(err)))
      .finally(() => setScsDashboardLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // SCS Availability Matrix (Coverage tab) - real, GET /admin/coverage/scs-weekly-availability.
  const [weeklyAvailability, setWeeklyAvailability] = useState<ScsWeeklyAvailabilityResponse | null>(null);
  const [weeklyAvailabilityLoading, setWeeklyAvailabilityLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setWeeklyAvailabilityLoading(true);
    getScsWeeklyAvailability(accessToken)
      .then(setWeeklyAvailability)
      .catch((err) => triggerToast(getApiErrorMessage(err)))
      .finally(() => setWeeklyAvailabilityLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Assign plan forms
  const [assignAirman, setAssignAirman] = useState("J. Reyes");
  const [assignPlan, setAssignPlan] = useState("Rehab Block 2");
  const [assignWindow, setAssignWindow] = useState("28 Jul - 25 Aug");
  const [assignCoOwner, setAssignCoOwner] = useState("SCS + PT/IM");

  // Filter pill states (scope which records show in nearby tables/queues)
  const [dashboardDateRange, setDashboardDateRange] = useState("Today");
  const [dashboardQueueFilter, setDashboardQueueFilter] = useState("Needs review");
  const [peopleQueueFilter, setPeopleQueueFilter] = useState("Needs review");
  const [plansView, setPlansView] = useState("Templates");
  const [assignmentsFilter, setAssignmentsFilter] = useState<string>(PLAN_STATUSES.ACTIVE);
  const [coverageWeek, setCoverageWeek] = useState("This week");

  const refreshThreads = async () => {
    if (!accessToken) return;
    setThreadsLoading(true);
    try {
      const data = await getMessageThreads(accessToken);
      const list = (data.threads as unknown as ThreadPreview[]) || [];
      setThreads(list);
      if (!selectedChatId && list.length > 0) {
        setSelectedChatId(list[0].other_user_id);
      }
    } catch (err) {
      triggerToast(getApiErrorMessage(err));
    } finally {
      setThreadsLoading(false);
    }
  };

  const openThread = async (otherUserId: string) => {
    if (!accessToken || !otherUserId) return;
    setSelectedChatId(otherUserId);
    setActiveThreadLoading(true);
    try {
      const data = await getMessageThread(accessToken, otherUserId);
      setActiveThreadMessages((data.messages as unknown as RealMessage[]) || []);
    } catch (err) {
      triggerToast(getApiErrorMessage(err));
    } finally {
      setActiveThreadLoading(false);
    }
  };

  useEffect(() => {
    void refreshThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (activeTab === "messages" && selectedChatId) {
      void openThread(selectedChatId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedChatId]);

  const handleSendMessage = async () => {
    if (!typedMessage.trim() || !selectedChatId || !accessToken || sendingMessage) return;
    setSendingMessage(true);
    try {
      await sendMessage(accessToken, { recipient_id: selectedChatId, body: typedMessage });
      setTypedMessage("");
      triggerToast("Message sent and audit-logged");
      await Promise.all([openThread(selectedChatId), refreshThreads()]);
    } catch (err) {
      triggerToast(getApiErrorMessage(err));
    } finally {
      setSendingMessage(false);
    }
  };

  const focusPlanForm = () => {
    setPlansView("Templates");
    window.setTimeout(() => {
      plansFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const selectTemplateForAssignment = (template: TemplateRecord) => {
    setAssignPlan(template.title);
    setAssignWindow(template.win);
    setAssignCoOwner(template.owner.split(" · ")[0]);
    setAssignApiError("");
    setAssignApiSuccess("");
    focusPlanForm();
    triggerToast(`Selected plan template: ${template.title}`);
  };

  const handleAssignPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setAssignApiError("You are signed out. Please sign in again.");
      return;
    }

    if (!assignAirmanUserId.trim()) {
      setAssignApiError("Backend user ID is required for Push to airman.");
      return;
    }

    const template = getTemplateByTitle(assignPlan);
    const detailsSteps = template.details
      .split("·")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5)
      .map((item, index) => ({
        title: `Step ${index + 1}`,
        description: item,
      }));

    setIsAssigningPlan(true);
    setAssignApiError("");
    setAssignApiSuccess("");

    try {
      await assignRecommendation(accessToken, assignAirmanUserId.trim(), {
        readiness_component: "physical",
        assigned_provider_name: currentUser?.name || "SCS User",
        assigned_provider_role: "SCS",
        title: template.title,
        instructions: template.desc,
        steps: detailsSteps.length > 0 ? detailsSteps : [{ title: "Step 1", description: template.details }],
        follow_up_timeline: assignWindow,
        is_joint_coordination: assignCoOwner.toLowerCase().includes("pt/im") || assignCoOwner.includes("+"),
      });

      const newAssignment: AssignedPlanRow = {
        id: `ap-form-${Date.now()}`,
        status: PLAN_STATUSES.PENDING_REVIEW,
        plan: `${template.title} · ${template.desc.split(" · ")[0]}`,
        air: assignAirman,
        airUnit: assignAirman.includes("J. Reyes") ? "SrA · Alpha flight" : assignAirman.includes("T. Cho") ? "A1C · Alpha flight" : "SSgt · Bravo flight",
        win: assignWindow,
        owner: assignCoOwner,
        comp: "0%",
        col: "orange",
        sign: "PT/IM",
        signBold: false,
      };
      setAssignedPlans((prev) => [newAssignment, ...prev]);
      setAssignApiSuccess(`Assigned "${template.title}" to ${assignAirman}.`);
      triggerToast(`Plan "${template.title}" assigned to ${assignAirman}`);
      setPlansView("Active");
    } catch (error) {
      setAssignApiError(getApiErrorMessage(error));
    } finally {
      setIsAssigningPlan(false);
    }
  };

  const handleSaveAssignmentDraft = () => {
    const draft: AssignmentDraft = {
      id: `d-${Date.now()}`,
      airman: assignAirman,
      plan: assignPlan,
      window: assignWindow,
      coOwner: assignCoOwner,
      status: "Draft",
      savedAt: new Date().toISOString(),
    };
    setAssignmentDrafts((prev) => [draft, ...prev]);
    triggerToast("Plan assignment saved as draft");
  };

  const handleQueueSendForSignoff = async () => {
    if (!accessToken) {
      setQueueReviewError("You are signed out. Please sign in again.");
      return;
    }

    if (!queueRecommendationId.trim()) {
      setQueueReviewError("Recommendation ID is required for send-for-signoff.");
      return;
    }

    setIsSendingQueueReview(true);
    setQueueReviewError("");
    setQueueReviewSuccess("");

    try {
      await sendRecommendationForSignoff(accessToken, queueRecommendationId.trim());
      setQueueReviewSuccess("Recommendation sent for sign-off.");
      triggerToast("Recommendation sent for sign-off");
    } catch (error) {
      setQueueReviewError(getApiErrorMessage(error));
    } finally {
      setIsSendingQueueReview(false);
    }
  };

  const handleReconditioningPlanSubmit = async (values: Record<string, string>) => {
    if (!accessToken) {
      setRecondPlanError("You are signed out. Please sign in again.");
      return;
    }

    const userId = values.user_id.trim();
    if (!userId) {
      setRecondPlanError("Target user ID is required.");
      return;
    }

    setIsSavingRecondPlan(true);
    setRecondPlanError("");
    setRecondPlanSuccess("");

    try {
      await upsertReconditioningPlan(accessToken, userId, {
        phase: values.phase.trim(),
        sessions_completed: Number(values.sessions_completed),
        sessions_total: Number(values.sessions_total),
        cadence_note: values.cadence_note.trim(),
        injury_flags: values.injury_flags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        ptim_clearance_status: values.ptim_clearance_status.trim(),
        next_review_date: values.next_review_date,
        limitation_flag: values.limitation_flag === "true",
        rehab_strategy_summary: values.rehab_strategy_summary.trim(),
        scs_coordination_status: values.scs_coordination_status.trim(),
        severity_level: values.severity_level.trim(),
        injury_reported_on: values.injury_reported_on,
      });

      setReconditioningPlans((prev) => [
        {
          id: `recond-${userId}-${Date.now()}`,
          title: values.phase === "active" ? "Reconditioning plan" : `${values.phase} reconditioning plan`,
          badge: `Reconditioning · ${values.phase}`,
          desc: values.rehab_strategy_summary.trim(),
          cad: values.cadence_note.trim(),
          win: values.next_review_date,
          owner: currentUser?.name || "SCS",
        },
        ...prev,
      ]);
      setRecondPlanSuccess(`Reconditioning plan saved for ${userId}.`);
      triggerToast(`Reconditioning plan saved for ${userId}`);
      setShowRecondPlanModal(false);
    } catch (error) {
      setRecondPlanError(getApiErrorMessage(error));
    } finally {
      setIsSavingRecondPlan(false);
    }
  };

  const setActiveTab = (tab: TabType) => {
    setReviewingAirmanId(null);
    router.push('/dashboard/scs/' + tab);
  };

  

  // Sync saved active tab
  useEffect(() => {
    const savedTab = localStorage.getItem("ascend_scs_active_tab") as TabType | null;
    if (savedTab && ["overview", "dashboard", "people", "plans", "coverage", "messages"].includes(savedTab)) {
      router.push('/dashboard/scs/' + savedTab);
    }
  }, []);

  // Sync auth check (mount state now comes from useTheme())
  useEffect(() => {
    if (hasMounted && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, hasMounted, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Auth verified in layout

    return (
    <div className="space-y-8 animate-fade-in pb-16">

          
          {/* Active Profile detail (J. Reyes drill-in detail) */}
          {reviewingAirmanId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Back navigation */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4">
                <button 
                  onClick={() => setReviewingAirmanId(null)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="size-4" /> Back to People roster
                </button>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setActiveTab("messages"); setSelectedChatId("J. Reyes"); setReviewingAirmanId(null); }}
                    className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Message
                  </button>
                  <button 
                    onClick={() => { setActiveTab("coverage"); setReviewingAirmanId(null); }}
                    className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Coverage
                  </button>
                  <button 
                    onClick={() => { setActiveTab("plans"); setReviewingAirmanId(null); }}
                    className="px-3.5 py-1.5 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Assign plan
                  </button>
                </div>
              </div>

              {/* Patient header context banner */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">J. Reyes</h2>
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[9px] font-bold rounded">
                        L4
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                      SrA &middot; L4 lower back pain &middot; PT/IM duty restriction: limited duty &middot; 4 yr TIS &middot; k=1 view &middot; {POPULATION_LEVELS.INDIVIDUAL} (not cohort eligible)
                    </p>
                  </div>
                </div>

                {/* Circular OFE gauge and detail summary block */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 items-center">
                  
                  {/* Gauge */}
                  <div className="flex items-center gap-4">
                    <div className="relative size-20 flex items-center justify-center">
                      <svg className="size-full" viewBox="0 0 36 36">
                        <path className="text-slate-100 dark:text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-[var(--brand-color)]" strokeWidth="3" strokeDasharray="77, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-black text-slate-800 dark:text-white">54</span>
                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">OFE &middot; 70</span>
                      </div>
                    </div>
                    <div className="text-left font-sans text-xs">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">28 day OFE trend</span>
                      <span className="font-bold text-rose-500 block leading-tight mt-0.5 inline-flex items-center gap-1">
                        <span aria-hidden="true" className="inline-block border-l-4 border-r-4 border-t-[6px] border-l-transparent border-r-transparent border-t-rose-500"></span>
                        Declining &mdash; vs 7d
                      </span>
                      <span className="text-[10px] text-rose-500 block">&mdash; vs 30d</span>
                    </div>
                  </div>

                  {/* Summary notes */}
                  <div className="text-left space-y-1 font-sans text-xs col-span-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Confidence &middot; Plan details</span>
                    <p className="text-slate-700 dark:text-slate-300">
                      Confidence score: <span className="font-bold text-emerald-500">High</span> (11 of last 14 days). PT/IM clinical visits: last 30d: 2.
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Reconditioning: <span className="font-bold text-[var(--brand-color)]">Rehab Block 2</span> &middot; ends 8 Aug. Functional limitation: lower-back, load-bearing (PT/IM-owned).
                    </p>
                  </div>

                </div>
              </div>

              {/* Navigation tabs inside J Reyes details */}
              <div className="flex gap-4 border-b border-slate-100 dark:border-white/5 pb-2 text-xs font-bold text-left select-none">
                {(["Overview", "Trends", "Plans", "Records", "Notes"] as const).map((tabName, i) => (
                  <span
                    key={i}
                    onClick={() => setPersonTab(tabName)}
                    className={`cursor-pointer pb-1 border-b-2 transition ${
                      personTab === tabName
                        ? "border-[var(--brand-color)] text-[var(--brand-color)]"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {tabName}
                  </span>
                ))}
              </div>

              {/* Split layout parameters - rendered per active sub-tab */}
              {personTab === "Overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Left Side: Drivers and Recommendations */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Drivers bar values */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="text-left">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Drivers - 14d</h3>
                      <p className="text-[9px] text-slate-500">OFE metrics domains &middot; k=1 scope</p>
                    </div>

                    <div className="space-y-4 font-sans text-xs text-left">
                      {[
                        { label: "Physical", val: "63.6", fill: "65%", col: "bg-cyan-500" },
                        { label: "Sleep", val: "55.2", fill: "55%", col: "bg-cyan-500" },
                        { label: "Mental", val: "52.1", fill: "50%", col: "bg-blue-500", gated: PRIVACY_STATES.AUTH_REQUIRED },
                        { label: "Nutritional", val: "69.2", fill: "70%", col: "bg-amber-500" },
                        { label: "Spiritual", val: "74.0", fill: "75%", col: "bg-yellow-500", gated: PRIVACY_STATES.CONSENT_REQUIRED }
                      ].map((dr, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-baseline font-mono text-[10px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300 font-sans">{dr.label}</span>
                            {dr.gated ? (
                              <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[8px] font-bold rounded uppercase tracking-wider">
                                {dr.gated}
                              </span>
                            ) : (
                              <span>{dr.val}</span>
                            )}
                          </div>
                          {dr.gated ? (
                            <p className="text-[9px] text-slate-500 leading-relaxed font-sans">
                              MP/PC authorized-pathway data &mdash; not visible to SCS until authorized.
                            </p>
                          ) : (
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${dr.col}`} style={{ width: dr.fill }}></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">Recommendations</h3>
                        <p className="text-[9px] text-slate-500">Coordinated with PT/IM &middot; next sync 14:00</p>
                      </div>
                      <button
                        onClick={() => setShowPlanModal(true)}
                        className="px-2 py-0.5 bg-[var(--brand-color)] text-white rounded text-[10px] font-bold transition hover:bg-[var(--brand-color-hover)] cursor-pointer"
                      >
                        + Plan
                      </button>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "L4 REDUCE LOAD", body: "Sub-80% 1RM lifts; mobility focus daily. Coordinated with PT/IM.", link: "View plan \u2192", col: "red" },
                        { title: "Sleep anchor", body: "Target 7h within 30 min of anchor time for 7 days. Check-in Friday AM.", col: "orange" },
                        { title: "Mental readiness \u2014 training implication", body: "Check load tolerance before tempo sessions. Not a mental health flag \u2014 refers to readiness for high-tempo work.", col: "blue" }
                      ].map((rec, i) => (
                        <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl text-left space-y-1">
                          <h4 className={`text-xs font-bold inline-flex items-center gap-1.5 ${
                            rec.col === "red" ? "text-rose-500" :
                            rec.col === "orange" ? "text-amber-500" : "text-sky-500"
                          }`}>
                            {rec.title}
                          </h4>
                          <p className="text-[11px] text-slate-700 dark:text-slate-400 leading-relaxed font-sans">{rec.body}</p>
                          {rec.link && <span className="text-[var(--brand-color)] font-bold block mt-1 hover:underline cursor-pointer">{rec.link}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Side: Assigned Plan & Events history */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Assigned plan card */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                      <div className="text-left">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">Assigned plan &mdash; Rehab Block 2</h3>
                        <p className="text-[9px] text-slate-500">SCS + PT/IM &middot; 22 Jul - 8 Aug &middot; week 1 of 3</p>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-bold rounded-full uppercase">
                        {PLAN_STATUSES.PENDING_REVIEW}
                      </span>
                    </div>

                    <div className="space-y-3 font-sans text-xs text-left">
                      <span className="text-[8px] font-bold text-slate-500 block uppercase tracking-widest font-mono">Block 1 - Lower back reconditioning</span>
                      <div className="space-y-2">
                        {[
                          { txt: "Daily mobility reset - 12 min", col: "green" },
                          { txt: "Sub-60% 1RM deadlift x 3", col: "green" },
                          { txt: "Mobility 3 x 4 sets", col: "orange" },
                          { txt: "Loaded carry progression", col: "blue" }
                        ].map((planTask, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className={`size-1.5 rounded-full ${
                              planTask.col === "green" ? "bg-emerald-500" :
                              planTask.col === "orange" ? "bg-amber-500" : "bg-sky-500"
                            }`}></span>
                            <span className="text-slate-700 dark:text-slate-300">{planTask.txt}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Compliance</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-white text-xs">71%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                      <button
                        onClick={() => {
                          setEditingPlanBlock(true);
                          setEditingPlanDraft({
                            title: "Rehab Block 2",
                            badge: "Rehab · Active",
                            desc: "Lower back reconditioning block 1 (week 1 of 3).",
                            details: "Daily mobility reset - 12 min · Sub-60% 1RM deadlift x 3 · Mobility 3 x 4 sets · Loaded carry progression.",
                            cad: "3x/wk · 45 min",
                            win: "22 Jul - 8 Aug · 3 blocks",
                            owner: "SCS + PT/IM",
                          });
                          triggerToast("Edit Rehab Block 2 wizard opened");
                        }}
                        className="py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:bg-slate-50 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      >
                        Edit plan
                      </button>
                      <button onClick={() => setShowPerfNoteModal(true)} className="py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:bg-slate-50 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer">
                        Add performance note
                      </button>
                    </div>

                    {editingPlanBlock && editingPlanDraft && (
                      <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl text-left space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">Edit inline · Rehab Block 2</span>
                          <button
                            onClick={() => { setEditingPlanBlock(false); setEditingPlanDraft(null); }}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                            aria-label="Close edit panel"
                          >
                            Close
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="block space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans block">Title</span>
                            <input
                              type="text"
                              value={editingPlanDraft.title}
                              onChange={(e) => setEditingPlanDraft({ ...editingPlanDraft, title: e.target.value })}
                              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-[var(--brand-color)] text-slate-800 dark:text-white"
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans block">Description</span>
                            <textarea
                              rows={2}
                              value={editingPlanDraft.desc}
                              onChange={(e) => setEditingPlanDraft({ ...editingPlanDraft, desc: e.target.value })}
                              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-[var(--brand-color)] text-slate-800 dark:text-white resize-none"
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans block">Cadence</span>
                            <input
                              type="text"
                              value={editingPlanDraft.cad}
                              onChange={(e) => setEditingPlanDraft({ ...editingPlanDraft, cad: e.target.value })}
                              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-[var(--brand-color)] text-slate-800 dark:text-white font-mono"
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans block">Owner</span>
                            <input
                              type="text"
                              value={editingPlanDraft.owner}
                              onChange={(e) => setEditingPlanDraft({ ...editingPlanDraft, owner: e.target.value })}
                              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-[var(--brand-color)] text-slate-800 dark:text-white"
                            />
                          </label>
                        </div>
                        <button
                          onClick={() => {
                            if (editingPlanDraft) {
                              setPerformancePlans((prev) => [editingPlanDraft, ...prev]);
                            }
                            setEditingPlanBlock(false);
                            setEditingPlanDraft(null);
                            triggerToast("Plan changes saved");
                          }}
                          className="w-full py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Save changes
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Recent Activity logs */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Recent activity - 7 events</h3>
                      <p className="text-[9px] text-slate-500">Audit logged &middot; last 7 days</p>
                    </div>

                    <div className="overflow-x-auto text-[10px] text-left">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-white/5 text-[8px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                            <th className="pb-2">Time</th>
                            <th className="pb-2">Actor</th>
                            <th className="pb-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5 font-mono text-[9px]">
                          {[
                            { time: "28 Jul - 06:42", actor: "TSgt Lee", act: "Reviewed OFE data" },
                            { time: "27 Jul - 14:11", actor: "TSgt Lee", act: "Sent msg - mobility reset" },
                            { time: "26 Jul - 09:20", actor: "System", act: "Routed to PT/IM - L4 pain" },
                            { time: "24 Jul - 17:08", actor: "Capt Shah", act: "Cleared limited duty" },
                            { time: "22 Jul - 10:00", actor: "TSgt Lee", act: "Updated plan" },
                            { time: "20 Jul - 08:30", actor: "System", act: "OFE completed - 54" },
                            { time: "18 Jul - 16:30", actor: "A. Mendez", act: "Peer-acknowledged" }
                          ].map((actRow, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/20 transition">
                              <td className="py-2 text-slate-500">{actRow.time}</td>
                              <td className="py-2 text-slate-700 dark:text-slate-300 font-sans font-bold">{actRow.actor}</td>
                              <td className="py-2 text-right text-slate-500 font-sans">{actRow.act}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>
              )}

              {personTab === "Trends" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">OFE trend · 14d / 28d</h3>
                      <p className="text-[9px] text-slate-500">Drivers · OFE composite · sleep duration (h)</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">OFE composite · 14d</span>
                        <div className="flex items-end justify-between h-24 px-1 gap-1">
                          {[48, 50, 52, 49, 54, 51, 53, 55, 52, 54, 56, 53, 54, 54].map((h, idx) => (
                            <div key={idx} style={{ height: `${h}%` }} className="flex-1 bg-cyan-500/80 rounded-t"></div>
                          ))}
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 block">7d avg: 54.0 · 14d avg: 52.9</span>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">OFE composite · 28d</span>
                        <div className="flex items-end justify-between h-24 px-1 gap-1">
                          {[56, 55, 54, 52, 53, 51, 50, 52, 49, 54, 51, 53, 55, 52, 54, 56, 53, 54, 54, 52, 50, 49, 51, 53, 55, 52, 54, 54].map((h, idx) => (
                            <div key={idx} style={{ height: `${h}%` }} className="flex-1 bg-cyan-500/60 rounded-t"></div>
                          ))}
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 block">28d avg: 52.6 · declining</span>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Sleep duration (h) · 14d</span>
                        <div className="flex items-end justify-between h-24 px-1 gap-1">
                          {[7.5, 7.0, 6.5, 7.2, 6.8, 7.5, 7.3, 7.0, 6.5, 7.2, 6.8, 7.5, 7.3, 7.0].map((h, idx) => (
                            <div key={idx} style={{ height: `${(h / 9) * 100}%` }} className="flex-1 bg-blue-500/70 rounded-t"></div>
                          ))}
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 block">avg: 7.07 h · anchor 22:30</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {personTab === "Plans" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                      <div className="text-left">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">Assigned plan &mdash; Rehab Block 2</h3>
                        <p className="text-[9px] text-slate-500">SCS + PT/IM &middot; 22 Jul - 8 Aug &middot; week 1 of 3</p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded-full uppercase tracking-wider font-mono">
                        71% compliance
                      </span>
                    </div>
                    <div className="space-y-2 font-sans text-xs">
                      {[
                        { txt: "Daily mobility reset - 12 min", col: "green" },
                        { txt: "Sub-60% 1RM deadlift x 3", col: "green" },
                        { txt: "Mobility 3 x 4 sets", col: "orange" },
                        { txt: "Loaded carry progression", col: "blue" }
                      ].map((planTask, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className={`size-1.5 rounded-full ${
                            planTask.col === "green" ? "bg-emerald-500" :
                            planTask.col === "orange" ? "bg-amber-500" : "bg-sky-500"
                          }`}></span>
                          <span className="text-slate-700 dark:text-slate-300">{planTask.txt}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                      <button
                        onClick={() => {
                          setEditingPlanBlock(true);
                          setEditingPlanDraft({
                            title: "Rehab Block 2",
                            badge: "Rehab · Active",
                            desc: "Lower back reconditioning block 1 (week 1 of 3).",
                            details: "Daily mobility reset - 12 min · Sub-60% 1RM deadlift x 3 · Mobility 3 x 4 sets · Loaded carry progression.",
                            cad: "3x/wk · 45 min",
                            win: "22 Jul - 8 Aug · 3 blocks",
                            owner: "SCS + PT/IM",
                          });
                          triggerToast("Edit Rehab Block 2 wizard opened");
                        }}
                        className="py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:bg-slate-50 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      >
                        Edit plan
                      </button>
                      <button onClick={() => setShowPerfNoteModal(true)} className="py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:bg-slate-50 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer">
                        Add performance note
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {personTab === "Records" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-2 text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">OFT clearance</span>
                    <span className="font-bold text-rose-500 block text-sm">NC - Not Cleared</span>
                    <span className="text-[10px] text-slate-500 block">15 Jul · score 71/100 · next due 22 Jul</span>
                  </div>
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-2 text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Visit log</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block text-sm">3 visits · last 30d</span>
                    <span className="text-[10px] text-slate-500 block">27 Jul Capt Chen · 22 Jul Capt Chen · 14 Jul SSgt Lin</span>
                  </div>
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-2 text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Performance summary</span>
                    <span className="font-bold text-emerald-500 block text-sm">Authorized · versioned</span>
                    <span className="text-[10px] text-slate-500 block">PT/IM approved · minimum-necessary</span>
                  </div>
                </div>
              )}

              {personTab === "Notes" && (
                <div className="space-y-3">
                  {[
                    { title: "Wind-down anchor", body: "Dim-evening routine holding. Lights low by 21:30, anchor at 22:30.", tag: "Sleep" },
                    { title: "Sleep diary", body: "7.5 h average. Daytime alertness improved per self-report.", tag: "Sleep" },
                    { title: "Mobility reset adherence", body: "Completed 5 of last 7 days. Lower back reports easier mornings.", tag: "Compliance" }
                  ].map((noteRow, i) => (
                    <div key={i} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm text-left space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white">{noteRow.title}</h4>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 text-[8px] font-bold rounded uppercase">{noteRow.tag}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">{noteRow.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* OFT clearance complete record banner */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">OFT clearance &middot; complete record</h3>
                    <p className="text-[9px] text-slate-500">Test date · status · score · exemption · next due · reconditioning · linked plan</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-bold rounded-full uppercase tracking-wider font-mono">
                    NC &middot; Reconditioning
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-xs font-sans">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block font-sans">Test Date</span>
                    <span className="font-bold text-slate-800 dark:text-white">15 Jul</span>
                    <span className="text-[10px] text-slate-500 block leading-tight font-mono">Lane 2 - tempo</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block font-sans">Status</span>
                    <span className="font-bold text-rose-500 block">NC - Not Cleared</span>
                    <span className="text-[10px] text-slate-500 block font-mono">Pass/Fail: Fail</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block font-sans">Score</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">71 / 100</span>
                    <span className="text-[10px] text-slate-500 block font-mono">Score-entry logged</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block font-sans">Exemption Reason</span>
                    <span className="font-bold text-slate-500 block">N/A</span>
                    <span className="text-[10px] text-slate-500 block font-mono">&mdash;</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block font-sans">Next Due</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">22 Jul</span>
                    <span className="text-[10px] text-slate-500 block font-mono">Reconditioning window</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block font-sans">Reconditioning</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">Block 1 - week 1</span>
                    <span className="text-[10px] text-slate-500 block font-mono">Sub-60% 1RM</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block font-sans">Sign-Off</span>
                    <span className="font-bold text-amber-500 block">Capt Shah</span>
                    <span className="text-[10px] text-slate-500 block font-mono">Pending review</span>
                  </div>
                </div>
              </div>

              {/* Operational facts card split with RTD paths card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-left font-sans items-stretch">
                
                {/* Facts */}
                <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Operational facts</h3>
                    <p className="text-[9px] text-slate-500">Single airman &middot; k=1 &middot; read-only</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Next PT session</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">Today - 11:00</span>
                      <span className="text-[10px] text-slate-500 block">Rehab &middot; TSgt Lee</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Last PT visit</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">27 Jul &middot; Capt Shah</span>
                      <span className="text-[10px] text-[var(--brand-color)] block">PT/IM visit note</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Leave next 30d</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">None scheduled</span>
                      <span className="text-[10px] text-slate-500 block">All-clear &middot; 0 conflicts</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Authorized</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">Performance Summary</span>
                      <span className="text-[10px] text-slate-500 block">PT/IM-approved</span>
                    </div>
                  </div>
                </div>

                {/* RTP + RTD guide guidelines */}
                <div className="bg-[#f8fafc] dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 text-left text-xs space-y-3 font-sans">
                  <span className="font-bold text-slate-800 dark:text-white block uppercase tracking-wider text-[9px]">RTP + RTD &mdash; separate paths</span>
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[var(--brand-color)] block">RTP (Return to Performance)</span>
                      <p className="text-slate-500 leading-normal font-normal">
                        Managed in Ascend: SCS adjusts training load + reconditioning only.
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-bold text-amber-500 block">RTD (Return to Duty)</span>
                      <p className="text-slate-500 leading-normal font-normal font-sans">
                        Requires source-authority + decision date + verification + reevaluation/expiration. SCS never edits it.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Workouts log table */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Recent workouts &middot; 7 events</h3>
                  <p className="text-[9px] text-slate-500">Status &middot; date &middot; type &middot; duration &middot; RPE &middot; linked plan &middot; applied limitation &middot; review</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3 text-right">Duration</th>
                        <th className="pb-3 text-right">RPE</th>
                        <th className="pb-3">Linked Plan</th>
                        <th className="pb-3 w-1/4">Applied Limitation</th>
                        <th className="pb-3 text-right">Review</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                      {[
                        { status: "Done", date: "28 Jul", type: "Rehab - McGill Big 3", dur: "32 min", rpe: "6", plan: "Rehab Block 2", lim: "Sub-80% 1RM deadlift", rev: "Reviewed", col: "green" },
                        { status: "Done", date: "27 Jul", type: "Mobility reset", dur: "10 min", rpe: "3", plan: "Rehab Block 2", lim: "\u2014", rev: "Reviewed", col: "green" },
                        { status: "Modified", date: "25 Jul", type: "Tempo run", dur: "24 min", rpe: "5", plan: "OFT Tempo Prep", lim: "HR cap: 165", rev: "Pending", col: "orange" },
                        { status: "Skipped", date: "24 Jul", type: "Loaded carry", dur: "\u2014", rpe: "\u2014", plan: "Rehab Block 2", lim: "L4 lower back", rev: REVIEW_STATUS.PENDING, col: "blue" },
                        { status: "Done", date: "22 Jul", type: "Deadlift", dur: "45 min", rpe: "8", plan: "Rehab Block 2", lim: "Sub-80% 1RM", rev: "Reviewed", col: "green" },
                        { status: "Done", date: "20 Jul", type: "Mobility reset", dur: "10 min", rpe: "2", plan: "Rehab Block 2", lim: "\u2014", rev: "Reviewed", col: "green" },
                        { status: "Done", date: "18 Jul", type: "McGill Big 3", dur: "25 min", rpe: "5", plan: "Rehab Block 2", lim: "\u2014", rev: "Reviewed", col: "green" }
                      ].map((workRow, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 transition">
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              workRow.col === "green" ? "bg-emerald-500/10 text-emerald-500" :
                              workRow.col === "orange" ? "bg-amber-500/10 text-amber-500" : "bg-sky-500/10 text-sky-500"
                            }`}>
                              {workRow.status}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-slate-500">{workRow.date}</td>
                          <td className="py-2.5 font-bold text-slate-700 dark:text-slate-300">{workRow.type}</td>
                          <td className="py-2.5 text-right font-mono text-slate-500">{workRow.dur}</td>
                          <td className="py-2.5 text-right font-mono text-slate-500">{workRow.rpe}</td>
                          <td className="py-2.5 text-slate-700 dark:text-slate-300">{workRow.plan}</td>
                          <td className="py-2.5 text-slate-500 leading-normal">{workRow.lim}</td>
                          <td className="py-2.5 text-right text-slate-500 font-medium">{workRow.rev}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* View Authorized performance summary block */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans text-xs">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                    View Authorized Performance Summary
                    <span className="px-2 py-0.2 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold rounded">
                      Summary: Authorized access
                    </span>
                    <span className="px-2 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[8px] font-bold rounded">
                      Raw record: {PRIVACY_STATES.RESTRICTED}
                    </span>
                  </h4>
                  <p className="text-slate-500 leading-normal">
                    PT/IM approved &middot; versioned &middot; minimum-necessary &middot; time-limited &middot; named audiences.
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Open the read-only Performance Summary to view scoping, drivers, and current recommendations. SCS does not open raw medical files.
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setViewingSummary(true)} className="px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl font-bold transition">
                    View Summary
                  </button>
                  <button onClick={() => setViewingAuditLog(true)} className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 font-bold transition hover:bg-slate-50">
                    Audit log
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-2">
                Ascend &middot; SCS Workspace prototype
              </div>

            </div>
          )}

           {/* Tab 1: OVERVIEW TAB */}
          {activeTab === "overview" && !reviewingAirmanId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase font-mono">SCS · Workspace</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">Strength & Conditioning</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Queue, drill-in, plans, coverage, and messages for the flight. Calm under load &mdash; decision-support, not dashboard noise.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono">
                    Population: {POPULATION_LEVELS.CASELOAD}
                  </span>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="inline-flex items-center gap-1 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Open queue &rarr;
                  </button>
                </div>
              </div>

              {/* ACTIONABLE WORK QUEUE - real, GET /dashboard/scs.
                  "New Assignment" and "Follow-up Due" from the old mock had
                  no real backing signal (no assignment-created-date or
                  follow-up-due tracking exists) and are dropped rather than
                  approximated; the remaining 3 cards use real per-operator
                  flags already computed by the backend, plus real unread
                  message counts (already wired above). */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Work Queue &middot; requires your action</h3>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">{POPULATION_LEVELS.CASELOAD}</span>
                </div>
                {scsDashboardLoading ? (
                  <p className="text-[10px] text-slate-400 py-6 text-center">Loading work queue&hellip;</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        name: "Low OPS",
                        count: String(scsDashboard?.low_ops_count ?? 0),
                        desc: "Below 55 OPS score",
                        tab: "people" as TabType,
                        col: "red",
                      },
                      {
                        name: ALERT_TYPES.OVERDUE_ACTION,
                        count: String((scsDashboard?.operators ?? []).filter((o) => o.active_risk_flag).length),
                        desc: "Active risk flag on caseload",
                        tab: "people" as TabType,
                        col: "red",
                      },
                      {
                        name: ALERT_TYPES.UNREAD_MESSAGE,
                        count: String(threads.reduce((sum, t) => sum + t.unread_count, 0)),
                        desc: "Unread in Messages",
                        tab: "messages" as TabType,
                        col: "teal",
                      },
                      {
                        name: ALERT_TYPES.PLAN_REVIEW,
                        count: String((scsDashboard?.operators ?? []).filter((o) => o.ptim_referral_status === "pending").length),
                        desc: "Awaiting PT/IM referral",
                        tab: "plans" as TabType,
                        col: "orange",
                      },
                    ].map((card, i) => (
                      <button
                        key={i}
                        onClick={() => { setActiveTab(card.tab); triggerToast(`Opening ${card.name.toLowerCase()} queue`); }}
                        className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 rounded-2xl p-5 shadow-sm space-y-3 text-left transition cursor-pointer"
                      >
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider font-sans">{card.name}</span>
                        <div className="flex items-baseline gap-2">
                          <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{card.count}</h2>
                          <span className={`text-[10px] font-bold ${
                            card.col === "red" ? "text-rose-500" :
                            card.col === "orange" ? "text-amber-500" : "text-[var(--brand-color)]"
                          }`}>
                            &rarr; open
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">{card.desc}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Flight snapshot - real, from GET /dashboard/scs (already
                  fetched above). "+N this month"/"+N since Mon" trend
                  deltas from the old mock had no real historical snapshot
                  to diff against and are dropped rather than fabricated. */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase font-mono block">Flight snapshot · caseload</span>
                </div>
                {scsDashboardLoading ? (
                  <p className="text-[10px] text-slate-400 py-6 text-center">Loading snapshot…</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                      {
                        name: "Active airmen",
                        count: String(scsDashboard?.assigned_count ?? 0),
                        desc: "Assigned to SCS",
                        col: "green",
                      },
                      {
                        name: "Needs review",
                        count: String((scsDashboard?.operators ?? []).filter((o) => o.active_risk_flag).length),
                        desc: "Active risk flag",
                        col: "orange",
                      },
                      {
                        name: "OFT clearance queue",
                        count: String(
                          (scsDashboard?.operators ?? []).filter((o) =>
                            ["scheduled", "no_record", "not_current"].includes(o.oft_status)
                          ).length
                        ),
                        desc: `${scsDashboard?.oft_cleared_today_count ?? 0} cleared today`,
                        col: "teal",
                      },
                      {
                        name: "Reconditioning",
                        count: String((scsDashboard?.operators ?? []).filter((o) => o.reconditioning_active).length),
                        desc: `${scsDashboard?.reconditioning_awaiting_review_count ?? 0} awaiting review`,
                        col: "slate",
                      },
                    ].map((card, i) => (
                      <div key={i} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider font-sans">{card.name}</span>
                        <div className="flex items-baseline gap-2">
                          <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{card.count}</h2>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">{card.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Surfaces section header */}
              <div className="text-left space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase font-mono block">Surfaces</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">5 surfaces</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Last sync 06:42 &middot; all surfaces share one design system.
                </p>
              </div>

              {/* 5 Surface directory cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {[
                  { id: "dashboard", title: "Dashboard", sub: "Today's queue · KPI tiles · 14-day trend", body: "Queue-first view of 14 airmen needing attention, with the flight readiness curve and a recommendations strip." },
                  { id: "people", title: "Person detail", sub: "J. Reyes · drill-in · trend · plans", body: "Airman drill-in: OPS ring, driver sparklines, recent activity, assigned plan, audit log." },
                  { id: "plans", title: "Plans", sub: "Templates · assign · assignment queue", body: "Browse templates, draft 4-week reconditioning plans, push assignments to the flight." },
                  { id: "coverage", title: "Coverage", sub: "PT sessions · OFT lanes · heatmap", body: "Workload by flight, SCS availability heatmap, OFT clearance status, upcoming PT sessions." },
                  { id: "messages", title: "Messages", sub: "Thread list · composer · role-aware", body: "Secure thread list with role-aware filters, message detail pane, and an inline composer." }
                ].map((sfc, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      if (sfc.id === "people") {
                        setReviewingAirmanId("J. Reyes");
                      } else {
                        setActiveTab(sfc.id as TabType);
                      }
                      triggerToast(`Navigating to ${sfc.title} surface`);
                    }}
                    className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 rounded-2xl p-5 shadow-sm space-y-3 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-[var(--brand-color)]"></span>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white leading-none">{sfc.title}</h4>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>
                    <span className="text-[10px] text-[var(--brand-color)] font-bold block leading-tight font-mono">{sfc.sub}</span>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">{sfc.body}</p>
                  </div>
                ))}
              </div>

              {/* Timeline and k>=5 Notes split layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Timeline agenda - real, GET /admin/pt-sessions/today.
                    Only PT sessions are a real, tracked event type here;
                    "OFT clearance run"/"Rehab review"/"Plan sync" from the
                    old mock had no real backing source and are dropped
                    rather than approximated. */}
                <div className="lg:col-span-8 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase font-mono">
                      Today · {todaySessions?.date ?? ""}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Agenda Timeline</h3>
                    </div>
                  </div>

                  {todaySessionsLoading ? (
                    <p className="text-[10px] text-slate-400 py-6 text-center">Loading today’s sessions…</p>
                  ) : !todaySessions || todaySessions.sessions.length === 0 ? (
                    <p className="text-[10px] text-slate-400 py-6 text-center">No PT sessions scheduled today.</p>
                  ) : (
                    <div className="relative border-l border-slate-100 dark:border-white/5 pl-6 ml-2 space-y-6 text-xs font-sans">
                      {todaySessions.sessions.map((s) => (
                        <div key={s.id} className="relative">
                          <span className="absolute -left-[30px] top-1 size-3 rounded-full bg-[var(--brand-color)] border-2 border-white dark:border-[#0e1628]"></span>
                          <span className="font-mono text-slate-400 text-[10px] block">{s.start_time}</span>
                          <span className="font-bold text-slate-800 dark:text-white block mt-0.5">
                            {s.group_label} · {s.focus_label}
                          </span>
                          <span className="text-[10px] text-slate-500 block leading-tight font-mono">
                            {s.enrolled_count}/{s.capacity} enrolled ({s.capacity_pct}%) · {s.lead_provider_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* k>=5 Guidelines notes */}
                <div className="lg:col-span-4 bg-[#f8fafc] dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 text-left text-xs space-y-3 font-sans flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block uppercase tracking-wider text-[9px] font-mono">K&ge;5 Notes</span>
                    <p className="text-slate-500 leading-relaxed font-normal mt-2">
                      Cohort views with k &ge; 5 airmen: 14-day flight readiness, role-color SCS green. Below k = 1, individual values only.
                    </p>
                  </div>
                  <div className="text-[9px] text-slate-500 select-none font-mono">
                    Ascend &middot; SCS Workspace prototype
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Tab 2: DASHBOARD VIEW */}
          {activeTab === "dashboard" && !reviewingAirmanId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase font-mono">SCS · Input</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">Today's queue</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-sans">
                    Showing 7 of 11 &mdash; 7 require attention today &middot; k&ge;5 on cohort trend &middot; Tuesday 28 Jul.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono">
                    Population: {POPULATION_LEVELS.CASELOAD}
                  </span>
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/5 p-1 bg-white dark:bg-slate-900 text-[10px] font-bold font-mono">
                    {["Today", "Week", "Month"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setDashboardDateRange(opt); triggerToast(`Filtering dashboard queue by: ${opt}`); }}
                        className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                          opt === dashboardDateRange
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => { setActiveTab("plans"); setShowAssignPlanModal(true); }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    + New plan
                  </button>
                </div>
              </div>

              {/* 4 Cards Grid - real, same GET /dashboard/scs data as Overview's
                  Flight snapshot. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {
                    name: "Active airmen",
                    count: String(scsDashboard?.assigned_count ?? 0),
                    desc: "Assigned to SCS",
                    col: "green",
                  },
                  {
                    name: "Needs review",
                    count: String((scsDashboard?.operators ?? []).filter((o) => o.active_risk_flag).length),
                    desc: "Active risk flag",
                    col: "orange",
                  },
                  {
                    name: "OFT clearance queue",
                    count: String(
                      (scsDashboard?.operators ?? []).filter((o) =>
                        ["scheduled", "no_record", "not_current"].includes(o.oft_status)
                      ).length
                    ),
                    desc: `${scsDashboard?.oft_cleared_today_count ?? 0} cleared today`,
                    col: "teal",
                  },
                  {
                    name: "Reconditioning",
                    count: String((scsDashboard?.operators ?? []).filter((o) => o.reconditioning_active).length),
                    desc: `${scsDashboard?.reconditioning_awaiting_review_count ?? 0} awaiting review`,
                    col: "slate",
                  },
                ].map((card, i) => (
                  <div key={i} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider font-sans">{card.name}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{card.count}</h2>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">{card.desc}</p>
                  </div>
                ))}
              </div>

              {/* Flagged airmen warning banner */}
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl p-4 text-left flex items-start gap-3 text-xs font-sans">
                <AlertTriangle className="size-4.5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-rose-600">2 airmen flagged L4+ &mdash; review before 11:00</h4>
                  <p className="text-[11px] text-rose-500 font-medium leading-relaxed font-sans">
                    J. Reyes (Rehab Block 2), T. Cho (OFT), D. Mendez (Sleep), B. Ndiaye (Mobility). Confidence: High across all views.
                  </p>
                </div>
              </div>

              {/* Main splits layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Left Column (8/12): Queue roster table & Driver Breakdown */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Queue table card - real, GET /dashboard/scs operators.
                      "Confidence" from the old mock had no real per-operator
                      source and is dropped; OPS trend arrows are dropped too
                      (no historical snapshot to diff against here). */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Queue · {(scsDashboard?.operators ?? []).filter((o) => o.active_risk_flag).length}
                        </h3>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">Sorted by OPS score, lowest first</p>

                      <div className="flex gap-2">
                        {["Needs review", "OFT", "Reconditioning", "L4+"].map((fPill, idx) => (
                          <button
                            key={idx}
                            onClick={() => { setDashboardQueueFilter(fPill); triggerToast(`Filtering queue by: ${fPill}`); }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                              fPill === dashboardQueueFilter
                                ? "bg-[var(--brand-color)]/10 border-[var(--brand-color)]/30 text-[var(--brand-color)]"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-900"
                            }`}
                          >
                            {fPill}
                          </button>
                        ))}
                      </div>
                    </div>

                    {scsDashboardLoading ? (
                      <p className="text-[10px] text-slate-400 py-6 text-center">Loading queue…</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              <th className="pb-3">Airman</th>
                              <th className="pb-3">Driver</th>
                              <th className="pb-3 text-right">OPS</th>
                              <th className="pb-3">Checked in</th>
                              <th className="pb-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {(scsDashboard?.operators ?? [])
                              .filter((row) => {
                                switch (dashboardQueueFilter) {
                                  case "OFT":
                                    return ["scheduled", "no_record", "not_current"].includes(row.oft_status);
                                  case "Reconditioning":
                                    return row.reconditioning_active;
                                  case "L4+":
                                    return row.driver_flag === "L4" || row.driver_flag === "L5";
                                  case "Needs review":
                                  default:
                                    return !!row.active_risk_flag;
                                }
                              })
                              .sort((a, b) => (a.current_ops_score ?? 999) - (b.current_ops_score ?? 999))
                              .map((row) => (
                                <tr key={row.user_id} className="hover:bg-slate-50/20 transition">
                                  <td className="py-2.5">
                                    <span className="font-bold text-slate-800 dark:text-white block">{row.user_name}</span>
                                  </td>
                                  <td className="py-2.5">
                                    {row.active_risk_flag ? (
                                      <span className="font-bold text-rose-500">
                                        {row.driver_flag ? `${row.driver_flag} · ` : ""}{row.active_risk_flag}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </td>
                                  <td className={`py-2.5 text-right font-mono font-bold ${
                                    row.current_ops_score !== null && row.current_ops_score < 55 ? "text-rose-500" : "text-slate-500"
                                  }`}>
                                    {row.current_ops_score ?? "—"}
                                  </td>
                                  <td className="py-2.5">
                                    <span className={`inline-flex items-center gap-1.5 font-bold ${row.checked_in_today ? "text-emerald-500" : "text-slate-400"}`}>
                                      <span className={`size-1.5 rounded-full ${row.checked_in_today ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                                      {row.checked_in_today ? "Yes" : "No"}
                                    </span>
                                  </td>
                                  <td className="py-2.5 text-right">
                                  <button
                                      onClick={() => { setReviewingAirmanId(row.user_name); triggerToast(`Opened chart view context: ${row.user_name}`); }}
                                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                    >
                                      Open
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400">Showing {(scsDashboard?.operators ?? []).filter((o) => o.active_risk_flag).length} of {scsDashboard?.assigned_count ?? 0} airmen</span>
                      <button type="button" onClick={() => setActiveTab("people")} className="text-[var(--brand-color)] font-bold cursor-pointer hover:underline">
                        View all &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Driver breakdown widget - real, averaged from GET
                      /dashboard/scs operators. Mental/Nutritional/Spiritual
                      from the old mock are dropped - the SCS dashboard's
                      real per-operator payload only carries
                      physical_readiness and sleep_readiness. */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Driver Breakdown</h3>
                    </div>
                    <p className="text-[9px] text-slate-500 font-mono">Cohort average, current scores</p>

                    {scsDashboardLoading ? (
                      <p className="text-[10px] text-slate-400 py-6 text-center">Loading&hellip;</p>
                    ) : (
                      <div className="space-y-4 font-sans text-xs">
                        {[
                          {
                            label: "Physical",
                            scores: (scsDashboard?.operators ?? [])
                              .map((o) => o.physical_readiness)
                              .filter((v): v is number => v !== null),
                            col: "bg-cyan-500",
                          },
                          {
                            label: "Sleep",
                            scores: (scsDashboard?.operators ?? [])
                              .map((o) => o.sleep_readiness)
                              .filter((v): v is number => v !== null),
                            col: "bg-cyan-500",
                          },
                        ].map((bar, idx) => {
                          const val = bar.scores.length
                            ? Math.round(bar.scores.reduce((sum, v) => sum + v, 0) / bar.scores.length)
                            : null;
                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex justify-between items-baseline font-mono text-[10px]">
                                <span className="font-bold text-slate-700 dark:text-slate-300 font-sans">{bar.label}</span>
                                <span>{val ?? "—"}</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${bar.col}`} style={{ width: `${val ?? 0}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Column (4/12): Trend curve chart, Recommendations, and PT agenda */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Line Chart card */}
                  <div className="bg-white dark:bg-[#0e1628] border border-rose-300 dark:border-rose-500/30 rounded-2xl p-5 shadow-sm space-y-4 text-left">
                    <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">Flight readiness &middot; 14 days</h3>
                        <p className="text-[9px] text-slate-500">Cohort: S-3 &middot; Tue 15 Jul &ndash; Mon 28 Jul</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold rounded uppercase tracking-wider font-mono">
                          k&ge;5
                        </span>
                        <MockItemBadge />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white font-mono leading-none">77</h2>
                      <span className="text-[10px] text-emerald-500 block leading-tight font-medium">
                        today &middot; +1.2 vs start
                      </span>
                    </div>

                    {/* SVG Line Graph */}
                    <div className="h-32 w-full pt-2">
                      <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1="0" y1="20" x2="200" y2="20" stroke="currentColor" className="text-slate-100 dark:text-slate-400" strokeWidth="0.5" />
                        <line x1="0" y1="50" x2="200" y2="50" stroke="currentColor" className="text-slate-100 dark:text-slate-400" strokeWidth="0.5" />
                        <line x1="0" y1="80" x2="200" y2="80" stroke="currentColor" className="text-slate-100 dark:text-slate-400" strokeWidth="0.5" />

                        {/* Trend path */}
                        <path 
                          d="M 0,85 C 20,80 30,70 50,60 C 70,50 80,55 100,45 C 120,35 130,42 150,30 C 170,18 180,22 200,10" 
                          fill="none" 
                          stroke="var(--brand-color)" 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                        {/* Dots markers */}
                        <circle cx="100" cy="45" r="3" fill="var(--brand-color)" />
                        <circle cx="200" cy="10" r="3.5" fill="var(--brand-color)" />
                      </svg>
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 border-t border-slate-55 dark:border-white/5 pt-2 select-none">
                      <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-500"></span> Flight readiness</span>
                      <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-blue-500"></span> Physical</span>
                      <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-cyan-500"></span> Sleep</span>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">Recommendations</h3>
                        <p className="text-[9px] text-slate-500">3 actions &middot; 1 due before 11:00</p>
                      </div>
                      <span className="px-2 py-0.5 bg-[var(--brand-color)]/15 text-[var(--brand-color)] text-[8px] font-bold rounded uppercase tracking-wider font-mono">
                        3 due
                      </span>
                    </div>

                    <div className="space-y-3 font-sans text-xs">
                      {[
                        { title: "L4 Reyes - reduce load", body: "Sub-60% 1RM lifts; daily mobility reset. Coordinated with PT/IM.", col: "red" },
                        { title: "OFT T. Cho - clear for high-tempo lane", body: "Open 4-week 2-block OFT prep roster · sign-off with flight lead.", col: "teal" },
                        { title: "Sleep A. Mendez - 8 nights monitor", body: "Lights-out 22:30 for 8 nights. Monitor findings log.", col: "orange" }
                      ].map((rec, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl space-y-1">
                          <h4 className={`text-[11px] font-extrabold inline-flex items-center gap-1.5 ${
                            rec.col === "red" ? "text-rose-500" :
                            rec.col === "teal" ? "text-cyan-500" : "text-amber-500"
                          }`}>
                            {rec.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 leading-normal font-sans font-medium">{rec.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Today's PT line-up */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Today's PT line-up</h3>
                      <p className="text-[9px] text-slate-500">5 sessions &middot; 28 Jul</p>
                    </div>

                    <div className="overflow-x-auto text-[10px] text-left">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-white/5 text-[8px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                            <th className="pb-2">Time</th>
                            <th className="pb-2">Group</th>
                            <th className="pb-2">Focus</th>
                            <th className="pb-2 text-right">Lead</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-55 dark:divide-white/5 font-sans">
                          {[
                            { time: "07:00", grp: "Alpha - 12", fcs: "Strength", lead: "TSgt Lee" },
                            { time: "09:00", grp: "Bravo - 16", fcs: "Endurance", lead: "SSgt Park" },
                            { time: "11:00", grp: "Rehab - 4", fcs: "Reconditioning", lead: "TSgt Lee" },
                            { time: "14:00", grp: "OFT prep - 5", fcs: "Tempo", lead: "SSgt Park" },
                            { time: "16:00", grp: "Mobility - 8", fcs: "Recovery", lead: "TSgt Lee" }
                          ].map((lineRow, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/20 transition">
                              <td className="py-2 font-mono text-slate-500 font-bold">{lineRow.time}</td>
                              <td className="py-2 text-slate-800 dark:text-white font-bold">{lineRow.grp}</td>
                              <td className="py-2 text-slate-500 font-medium">{lineRow.fcs}</td>
                              <td className="py-2 text-right text-slate-500">{lineRow.lead}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>

              {/* OFT clearance status table takes up full width */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">OFT clearance status</h3>
                  <p className="text-[9px] text-slate-500">Test date · score/exemption · Pass/Fail · status · next due · linked plan</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 w-1/4">Airman</th>
                        <th className="pb-3">Test Date</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Score</th>
                        <th className="pb-3">Next Due</th>
                        <th className="pb-3 text-right">Linked Plan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {[
                        { name: "T. Cho", date: "28 Jul", stat: "C - Pass", code: "green-dot", score: "92", due: "15 Jan", plan: "Cycle 4 Perf." },
                        { name: "K. Patel", date: "20 Jul", stat: "C - Pass", code: "green-dot", score: "88", due: "20 Oct", plan: "OFT Tempo Prep" },
                        { name: "M. Hayes", date: "25 Jul", stat: "C - Pass", code: "green-dot", score: "90", due: "25 Jan", plan: "Cycle 4 Perf." },
                        { name: "B. Ndiaye", date: "18 Jul", stat: "NC - Recond.", code: "badge-orange", score: "71", due: "22 Jul", plan: "Reconditioning" },
                        { name: "D. Okafor", date: "12 Jul", stat: "NC - Recond.", code: "badge-orange", score: "68", due: "19 Jul", plan: "Hip Recond." },
                        { name: "R. Singh", date: "20 Jul", stat: "Exempt · profile", code: "badge-slate", score: "\u2014", due: "20 Oct", plan: "Mobility Reset" },
                        { name: "S. Bauer", date: "25 Jul", stat: "Exempt · profile", code: "badge-slate", score: "\u2014", due: "25 Oct", plan: "Sleep Reset" }
                      ].map((clRow, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 transition">
                          <td className="py-2.5 font-bold text-slate-800 dark:text-white">{clRow.name}</td>
                          <td className="py-2.5 font-mono text-slate-500">{clRow.date}</td>
                          <td className="py-2.5">
                            {clRow.code === "green-dot" ? (
                              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-500">
                                <span className="size-1.5 rounded-full bg-emerald-500"></span>
                                {clRow.stat}
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                clRow.code === "badge-orange" ? "bg-amber-500/10 text-amber-600" : "bg-slate-100 dark:bg-slate-900 text-slate-400"
                              }`}>
                                {clRow.stat}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-right font-mono text-slate-600">{clRow.score}</td>
                          <td className="py-2.5 font-mono text-slate-500">{clRow.due}</td>
                          <td className="py-2.5 text-right text-slate-700 dark:text-slate-300">{clRow.plan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 flex justify-between items-center text-[9px] font-mono text-slate-400">
                  <span>Exemption reason recordable audit log &middot; Score entry via OFT lead</span>
                  <button type="button" onClick={() => setActiveTab("coverage")} className="text-[var(--brand-color)] font-bold cursor-pointer hover:underline">Coverage &rarr;</button>
                </div>
              </div>

              {/* Hours coverage and RTP splits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-left font-sans items-stretch">
                
                {/* Hours coverage stats */}
                <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">SCS hours coverage</h3>
                      <p className="text-[9px] text-slate-500 font-mono">Scheduled + worked &middot; progress toward 2,080 annual</p>
                    </div>
                    <span className="px-2 py-0.2 bg-[var(--brand-color)]/15 text-[var(--brand-color)] text-[8px] font-bold rounded uppercase font-mono">
                      95% target
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <span className="text-[8px] text-slate-400 block uppercase font-mono">Scheduled</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">160</span>
                      <span className="text-[9px] text-slate-500 block">Cap 200</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block uppercase font-mono">Worked</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">152</span>
                      <span className="text-[9px] text-emerald-500 block">95% of scheduled</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block uppercase font-mono">YTD Annual</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block font-mono">1,128 / 2,080</span>
                      <span className="text-[9px] text-slate-500 block">54% on pace</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block uppercase font-mono">Missed</span>
                      <span className="font-bold text-rose-500 block">8</span>
                      <span className="text-[9px] text-slate-500 block">2 due to leave</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[9px] font-mono">
                    <span className="text-slate-500">RSD coverage (separate)</span>
                    <span className="font-bold text-amber-500 font-sans">36 / 20</span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed font-sans mt-1">
                    Restricted-status duty sessions &mdash; tracked separate from regular SCS hours.
                  </p>
                </div>

                {/* RTP + RTD guide guidelines */}
                <div className="bg-[#f8fafc] dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 text-left text-xs space-y-3 font-sans">
                  <span className="font-bold text-slate-800 dark:text-white block uppercase tracking-wider text-[9px] font-mono">RTP + RTD &mdash; they are not the same</span>
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[var(--brand-color)] block">RTP (Return to Performance)</span>
                      <p className="text-slate-600 leading-normal font-normal font-sans">
                        is managed in Ascend: SCS + PT/IM coordinate reconditioning, training load, and progression.
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-bold text-amber-600 block">RTD (Return to Duty)</span>
                      <p className="text-slate-600 leading-normal font-normal font-sans">
                        requires source-authority + decision date + verification + reevaluation/expiration. RTD is only surfaced when all four fields are present.
                      </p>
                      <p className="text-[10px] text-slate-400 font-sans italic leading-normal">
                        SCS does not edit restriction profiles, adjust temporary clinical clearings, or edit RTD thresholds. We plan re-load.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Workout log last 14 days table */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Recent workouts &middot; 7 events</h3>
                    <p className="text-[9px] text-slate-500 font-mono">Status · date · type · duration · RPE · linked plan · applied limitation · review</p>
                  </div>
                  <button type="button" onClick={() => setViewingAllWorkouts(true)} className="text-[10px] text-[var(--brand-color)] font-bold cursor-pointer hover:underline font-mono">
                    All workouts &rarr;
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3 text-right">Duration</th>
                        <th className="pb-3 text-right">RPE</th>
                        <th className="pb-3">Linked Plan</th>
                        <th className="pb-3 w-1/4">Applied Limitation</th>
                        <th className="pb-3 text-right">Review</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {WORKOUT_LOG.map((workRow, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 transition">
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              workRow.col === "green" ? "bg-emerald-500/10 text-emerald-500" :
                              workRow.col === "orange" ? "bg-amber-500/10 text-amber-500" : "bg-sky-500/10 text-sky-500"
                            }`}>
                              {workRow.status}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-slate-500">{workRow.date}</td>
                          <td className="py-2.5 font-bold text-slate-700 dark:text-slate-300">{workRow.type}</td>
                          <td className="py-2.5 text-right font-mono text-slate-500">{workRow.dur}</td>
                          <td className="py-2.5 text-right font-mono text-slate-500">{workRow.rpe}</td>
                          <td className="py-2.5 text-slate-700 dark:text-slate-300">{workRow.plan}</td>
                          <td className="py-2.5 text-slate-500 leading-normal">{workRow.lim}</td>
                          <td className="py-2.5 text-right text-slate-500 font-medium">{workRow.rev}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* View Authorized performance summary block */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans text-xs">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                    View Authorized Performance Summary
                    <span className="px-2 py-0.2 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold rounded">
                      Summary: Authorized access
                    </span>
                    <span className="px-2 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[8px] font-bold rounded">
                      Raw record: {PRIVACY_STATES.RESTRICTED}
                    </span>
                  </h4>
                  <p className="text-slate-600 leading-normal font-sans">
                    PT/IM approved &middot; versioned &middot; minimum-necessary &middot; named audiences.
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Open the read-only Performance Summary for any airman on an active plan. Medical records remain in PT/IM control &mdash; SCS never opens raw medical files.
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setReviewingAirmanId("J. Reyes"); triggerToast("Displaying J. Reyes Performance summary record"); }} className="px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl font-bold transition">
                    View J. Reyes Summary
                  </button>
                  <button onClick={() => setViewingPlanRefs(true)} className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 font-bold transition hover:bg-slate-50">
                    Plan references
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-2">
                Ascend &middot; SCS Workspace prototype
              </div>

            </div>
          )}

          {/* Tab 3: PEOPLE ROSTER VIEW */}
          {activeTab === "people" && !reviewingAirmanId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">SCS - PEOPLE</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">People</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    112 airmen &middot; {POPULATION_LEVELS.CASELOAD}. Sorted by severity then confidence. Opening a row is a {POPULATION_LEVELS.INDIVIDUAL} (k=1) drill-in and is audit logged.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono">
                    Population: {POPULATION_LEVELS.CASELOAD}
                  </span>
                  <button
                    onClick={() => setActiveTab("coverage")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-55 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Coverage
                  </button>
                  <button
                    onClick={() => setActiveTab("plans")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Assign plan
                  </button>
                </div>
              </div>

              {/* 4 Cards Grid - real, same GET /dashboard/scs data. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {
                    name: "Active airmen",
                    count: String(scsDashboard?.assigned_count ?? 0),
                    desc: "Assigned to SCS",
                    icon: "green",
                  },
                  {
                    name: "Needs review",
                    count: String((scsDashboard?.operators ?? []).filter((o) => o.active_risk_flag).length),
                    desc: "Active risk flag",
                    icon: "orange",
                  },
                  {
                    name: "L4+ flagged",
                    count: String(
                      (scsDashboard?.operators ?? []).filter((o) => o.driver_flag === "L4" || o.driver_flag === "L5").length
                    ),
                    desc: "Highest escalation level",
                    icon: "red",
                  },
                  {
                    name: "Reconditioning",
                    count: String((scsDashboard?.operators ?? []).filter((o) => o.reconditioning_active).length),
                    desc: `${scsDashboard?.reconditioning_awaiting_review_count ?? 0} awaiting review`,
                    icon: "slate",
                  },
                ].map((card, i) => (
                  <div key={i} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider font-sans">{card.name}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{card.count}</h2>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">{card.desc}</p>
                  </div>
                ))}
              </div>

              {/* People Table - real, GET /dashboard/scs operators.
                  "Confidence", "Plan", and "Last Contact" from the old mock
                  have no real per-operator source in this payload and are
                  dropped rather than fabricated. */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Roster · {scsDashboard?.assigned_count ?? 0}
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-500">Sorted by OPS score, lowest first</p>

                  <div className="flex gap-2">
                    {["Needs review", "OFT", "Reconditioning", "L4+", "All"].map((fPill, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setPeopleQueueFilter(fPill); triggerToast(`Filtering roster by: ${fPill}`); }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          fPill === peopleQueueFilter
                            ? "bg-[var(--brand-color)]/10 border-[var(--brand-color)]/30 text-[var(--brand-color)]"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {fPill}
                      </button>
                    ))}
                  </div>
                </div>

                {scsDashboardLoading ? (
                  <p className="text-[10px] text-slate-400 py-6 text-center">Loading roster…</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-3 w-1/4">Airman</th>
                          <th className="pb-3">Driver</th>
                          <th className="pb-3 text-right">OPS</th>
                          <th className="pb-3">OFT status</th>
                          <th className="pb-3">Checked in</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {(scsDashboard?.operators ?? [])
                          .filter((row) => {
                            switch (peopleQueueFilter) {
                              case "OFT":
                                return ["scheduled", "no_record", "not_current"].includes(row.oft_status);
                              case "Reconditioning":
                                return row.reconditioning_active;
                              case "L4+":
                                return row.driver_flag === "L4" || row.driver_flag === "L5";
                              case "All":
                                return true;
                              case "Needs review":
                              default:
                                return !!row.active_risk_flag;
                            }
                          })
                          .sort((a, b) => (a.current_ops_score ?? 999) - (b.current_ops_score ?? 999))
                          .map((row) => (
                            <tr key={row.user_id} className="hover:bg-slate-50/20 transition">
                              <td className="py-3">
                                <span className="font-bold text-slate-800 dark:text-white block">{row.user_name}</span>
                              </td>
                              <td className="py-3">
                                {row.active_risk_flag ? (
                                  <span className="font-bold text-rose-500">
                                    {row.driver_flag ? `${row.driver_flag} · ` : ""}{row.active_risk_flag}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className={`py-3 text-right font-mono font-bold ${
                                row.current_ops_score !== null && row.current_ops_score < 55 ? "text-rose-500" : "text-slate-500"
                              }`}>
                                {row.current_ops_score ?? "—"}
                              </td>
                              <td className="py-3 text-slate-700 dark:text-slate-300">{row.oft_status.replace("_", " ")}</td>
                              <td className="py-3">
                                <span className={`inline-flex items-center gap-1.5 font-bold ${row.checked_in_today ? "text-emerald-500" : "text-slate-400"}`}>
                                  <span className={`size-1.5 rounded-full ${row.checked_in_today ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                                  {row.checked_in_today ? "Yes" : "No"}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => {
                                    setReviewingAirmanId(row.user_name);
                                    triggerToast(`Opening roster file context for ${row.user_name}`);
                                  }}
                                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  Open
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
              {/* Footer */}
              <div className="pt-2 flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>
                  {(scsDashboard?.operators ?? []).filter((o) => o.active_risk_flag).length} flagged of{" "}
                  {scsDashboard?.assigned_count ?? 0} assigned &middot; k=1 drill-in is audit logged
                </span>
                <button type="button" className="text-[var(--brand-color)] font-bold cursor-pointer hover:underline" onClick={() => setActiveTab("coverage")}>Coverage &rarr;</button>
              </div>

            </div>
          )}

          {/* Tab 4: PLANS LIST AND ASSIGNMENTS */}
          {activeTab === "plans" && !reviewingAirmanId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">SCS - PLANS</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">Plan assignment</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Browse templates, assign to airmen, push to the flight queue. Plans sync with PT/IM and Plan role.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono">
                    Population: {POPULATION_LEVELS.CASELOAD}
                  </span>
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/5 p-1 bg-white dark:bg-slate-900 text-[10px] font-bold font-mono">
                    {["Templates", "Active", "History"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setPlansView(opt); triggerToast(`Filtering plans by: ${opt}`); }}
                        className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                          opt === plansView
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowRecondPlanModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    + New plan
                  </button>
                </div>
              </div>

              {/* 6 Plan Template Cards Grid */}
              {plansView === "Templates" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-left font-sans">
                {PLAN_TEMPLATES.map((tpl, i) => (
                  <div key={i} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-bold rounded-full uppercase tracking-wider">
                          {tpl.badge}
                        </span>
                        {tpl.star && <span className="text-amber-500 font-bold font-mono select-none">&#9733;</span>}
                      </div>

                      <h4 className="text-sm font-black text-slate-800 dark:text-white leading-tight">{tpl.title}</h4>
                      <p className="text-slate-500 font-medium leading-relaxed">{tpl.desc}</p>
                      
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[10px]">
                        <div>
                          <span className="text-[8px] text-slate-400 block uppercase font-mono">Cadence</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{tpl.cad}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 block uppercase font-mono">Window</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{tpl.win}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 block uppercase font-mono">Owner</span>
                          <span className="font-bold text-[var(--brand-color)] truncate block">{tpl.owner.split(" · ")[0]}</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-500 font-mono leading-normal pt-2 border-t border-slate-55 dark:border-white/5 truncate max-w-xs">{tpl.details}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                      <button
                        onClick={() => {
                          selectTemplateForAssignment(tpl);
                        }}
                        className="py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                      >
                        Use template
                      </button>
                      <button
                        onClick={() => setViewingTemplate(tpl)}
                        className="py-1.5 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[10px] font-bold rounded-lg text-rose-700 dark:text-rose-200 transition"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )}

              {/* Active Plan Assignments */}
              {plansView === "Active" && (
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Assignments</h3>
                    <p className="text-[10px] text-slate-500">8 active &middot; 2 awaiting sign-off</p>
                  </div>

                  <div className="flex gap-2">
                    {[PLAN_STATUSES.ACTIVE, "Rehab", "Performance", "Reconditioning", PLAN_STATUSES.DRAFT].map((pill, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setAssignmentsFilter(pill); triggerToast(`Filtering assignments by: ${pill}`); }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          pill === assignmentsFilter
                            ? "bg-[var(--brand-color)]/10 border-[var(--brand-color)]/30 text-[var(--brand-color)]"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3">Status</th>
                        <th className="pb-3 w-1/3">Plan</th>
                        <th className="pb-3">Airman</th>
                        <th className="pb-3">Window</th>
                        <th className="pb-3">Owner</th>
                        <th className="pb-3">Compliance</th>
                        <th className="pb-3">Sign-off</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {[...assignedPlans, ...SEEDED_ASSIGNMENTS].filter((row) => matchesAssignmentPill(assignmentsFilter, row)).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 transition">
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              row.col === "green" ? "bg-emerald-500/10 text-emerald-500" :
                              row.col === "orange" ? "bg-amber-500/10 text-amber-500" : "bg-slate-100 dark:bg-slate-900 text-slate-400"
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block">{row.plan.split(" · ")[0]}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{row.plan.split(" · ")[1]}</span>
                          </td>
                          <td className="py-2.5">
                            <span className="font-bold text-slate-800 dark:text-white block">{row.air}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{row.airUnit}</span>
                          </td>
                          <td className="py-2.5 font-mono text-slate-500">{row.win}</td>
                          <td className="py-2.5 text-slate-500">{row.owner}</td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2 font-mono text-[10px]">
                              <span>{row.comp}</span>
                              {row.comp !== "\u2014" && (
                                <div className="w-12 h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-[var(--brand-color)]" style={{ width: row.comp }}></div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={`py-2.5 ${row.signBold ? "font-bold text-slate-800 dark:text-white" : "text-slate-500"}`}>{row.sign}</td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => setViewingAssignment(row)}
                              className="px-3 py-1 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-500/30 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              )}

              {/* Workout log last 14 days table */}
              {plansView === "History" && (
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Workout log &middot; last 14 days</h3>
                  <p className="text-[9px] text-slate-500 font-mono">Audit logged &middot; SCS daily training + reconditioning only</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3 text-right">Duration</th>
                        <th className="pb-3 text-right">RPE</th>
                        <th className="pb-3">Linked Plan</th>
                        <th className="pb-3 w-1/4">Applied Limitation</th>
                        <th className="pb-3 text-right">Review</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {[
                        { status: "Done", date: "28 Jul", type: "Rehab · McGill Big 3", dur: "32 min", rpe: "6", plan: "Rehab Block 2", lim: "Sub-80% 1RM deadlift", rev: "Reviewed", col: "green" },
                        { status: "Done", date: "27 Jul", type: "Mobility reset", dur: "12 min", rpe: "3", plan: "Rehab Block 2", lim: "\u2014", rev: "Reviewed", col: "green" },
                        { status: "Modified", date: "25 Jul", type: "Tempo run", dur: "24 min", rpe: "8", plan: "OFT Tempo Prep", lim: "HR cap: 165", rev: "Pending", col: "orange" },
                        { status: "Skipped", date: "24 Jul", type: "Loaded carry", dur: "\u2014", rpe: "\u2014", plan: "Rehab Block 2", lim: "L4 lower back", rev: REVIEW_STATUS.PENDING, col: "blue" },
                        { status: "Done", date: "22 Jul", type: "Strength · back squat", dur: "45 min", rpe: "7", plan: "Cycle 4 Perf.", lim: "\u2014", rev: "Reviewed", col: "green" },
                        { status: "Done", date: "20 Jul", type: "Mobility reset", dur: "12 min", rpe: "2", plan: "Rehab Block 2", lim: "\u2014", rev: "Reviewed", col: "green" },
                        { status: "Done", date: "18 Jul", type: "Deadlift", dur: "45 min", rpe: "6", plan: "Rehab Block 2", lim: "Sub-80% 1RM", rev: "Reviewed", col: "green" }
                      ].map((workRow, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 transition">
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              workRow.col === "green" ? "bg-emerald-500/10 text-emerald-500" :
                              workRow.col === "orange" ? "bg-amber-500/10 text-amber-500" : "bg-sky-500/10 text-sky-500"
                            }`}>
                              {workRow.status}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-slate-500">{workRow.date}</td>
                          <td className="py-2.5 font-bold text-slate-700 dark:text-slate-300">{workRow.type}</td>
                          <td className="py-2.5 text-right font-mono text-slate-500">{workRow.dur}</td>
                          <td className="py-2.5 text-right font-mono text-slate-500">{workRow.rpe}</td>
                          <td className="py-2.5 text-slate-700 dark:text-slate-300">{workRow.plan}</td>
                          <td className="py-2.5 text-slate-500 leading-normal">{workRow.lim}</td>
                          <td className="py-2.5 text-right text-slate-500 font-medium">{workRow.rev}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              )}

              {/* View Authorized performance summary block */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans text-xs">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                    View Authorized Performance Summary
                    <span className="px-2 py-0.2 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold rounded">
                      Summary: Authorized access
                    </span>
                    <span className="px-2 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[8px] font-bold rounded">
                      Raw record: {PRIVACY_STATES.RESTRICTED}
                    </span>
                  </h4>
                  <p className="text-slate-600 leading-normal">
                    PT/IM approved &middot; versioned &middot; minimum-necessary &middot; time-limited &middot; named audiences.
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Open the read-only Performance Summary to view scoping, drivers, and current recommendations. SCS does not open raw medical files.
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setViewingSummary(true)} className="px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl font-bold transition">
                    View Summary
                  </button>
                  <button onClick={() => setViewingAuditLog(true)} className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 font-bold transition hover:bg-slate-50">
                    Audit log
                  </button>
                </div>
              </div>

              {/* Assign Plan Form split queue */}
              <div ref={plansFormRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Form */}
                <div className="lg:col-span-8 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Assign to one airman</h3>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-bold rounded uppercase">
                      Population: {POPULATION_LEVELS.INDIVIDUAL}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl">
                    Single airman scope &middot; SCS assigns one operator at a time. Flight template plan triggers in Plan &middot; Assignment and require sign-off by Plan role + PT/IM where applicable.
                  </p>

                  <form onSubmit={handleAssignPlanSubmit} className="space-y-4 font-sans text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="scs-assign-airman" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Airman</label>
                        <select
                          id="scs-assign-airman"
                          value={assignAirman}
                          onChange={(e) => setAssignAirman(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-[var(--brand-color)] text-slate-800 dark:text-white"
                        >
                          <option value="J. Reyes">J. Reyes (SrA · Alpha flight)</option>
                          <option value="D. Mendez">D. Mendez (SSgt · Bravo flight)</option>
                          <option value="T. Cho">T. Cho (A1C · Alpha flight)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="scs-assign-airman-userid" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Backend user ID</label>
                        <input
                          id="scs-assign-airman-userid"
                          type="text"
                          value={assignAirmanUserId}
                          onChange={(e) => setAssignAirmanUserId(e.target.value)}
                          placeholder="Required for live API submit"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-[var(--brand-color)] text-slate-800 dark:text-white font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="scs-assign-plan" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plan template</label>
                        <select
                          id="scs-assign-plan"
                          value={assignPlan}
                          onChange={(e) => setAssignPlan(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-[var(--brand-color)] text-slate-800 dark:text-white"
                        >
                          <option value="Rehab Block 2">Rehab Block 2</option>
                          <option value="Cycle 4 performance">Cycle 4 performance</option>
                          <option value="Sleep reset - 7 day">Sleep reset - 7 day</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="scs-assign-window" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Window</label>
                        <input
                          id="scs-assign-window"
                          type="text"
                          value={assignWindow}
                          onChange={(e) => setAssignWindow(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-[var(--brand-color)] text-slate-800 dark:text-white font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="scs-assign-coowner" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Co-owner</label>
                        <input
                          id="scs-assign-coowner"
                          type="text"
                          value={assignCoOwner}
                          onChange={(e) => setAssignCoOwner(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-[var(--brand-color)] text-slate-800 dark:text-white font-sans"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-white/5">
                      <button
                        type="button"
                        onClick={handleSaveAssignmentDraft}
                        className="px-4 py-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-500/30 rounded-xl font-bold text-rose-700 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                      >
                        Save draft
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition cursor-pointer"
                      >
                        {isAssigningPlan ? "Pushing..." : "Push to airman"}
                      </button>
                    </div>
                    {assignApiError ? <p className="text-[11px] font-semibold text-rose-600">{assignApiError}</p> : null}
                    {assignApiSuccess ? <p className="text-[11px] font-semibold text-emerald-600">{assignApiSuccess}</p> : null}
                  </form>
                </div>

                {/* Queue */}
                <div className="lg:col-span-4 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Assignment queue</h3>
                    <p className="text-[9px] text-slate-500">Awaiting PT/IM sign-off &middot; 2</p>
                  </div>

                  <div className="space-y-3">
                    {[...assignedPlans.filter((row) => row.status === PLAN_STATUSES.PENDING_REVIEW).map((row) => ({
                      name: row.air,
                      status: row.status,
                      details: `${row.plan.split(" · ")[0]} · ${row.win} · ${row.owner}`,
                    })), ...SEEDED_QUEUE].map((queItem, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl space-y-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-800 dark:text-white">{queItem.name}</span>
                          <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-500 text-[8px] font-bold rounded uppercase">
                            {queItem.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">{queItem.details}</p>
                        <button
                          onClick={() => setViewingQueueItem(queItem)}
                          className="w-full text-center py-1 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[10px] font-bold text-rose-700 dark:text-rose-200 rounded-lg transition"
                        >
                          Review
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="text-[8px] text-slate-400 font-mono leading-normal pt-2 border-t border-slate-100 dark:border-white/5">
                    PT/IM sync: 14:00 today. Check for reviewing packets, sign-off window 30 min, tracking.
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* Tab 5: WORKLOAD COVERAGE VIEW */}
          {activeTab === "coverage" && !reviewingAirmanId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">SCS - COVERAGE</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">Workload coverage</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    PT session capacity, OFT lane coverage, leave overlap, and SCS availability for the flight.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono">
                    Population: {POPULATION_LEVELS.UNIT}
                  </span>
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/5 p-1 bg-white dark:bg-slate-900 text-[10px] font-bold font-mono">
                    {["This week", "Next week", "Month"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setCoverageWeek(opt); triggerToast(`Displaying coverage for: ${opt}`); }}
                        className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                          opt === coverageWeek
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { name: "PT sessions / wk", count: "28", desc: "Cap 32 · 88% used", icon: "green" },
                  { name: "OFT lanes covered", count: "5/7", desc: "-2 uncovered lanes", icon: "red" },
                  { name: "Reconditioning load", count: "5", desc: "2 awaiting review", icon: "slate" },
                  { name: "Leave overlap", count: "1", desc: "27 Jul - 29 Jul", icon: "orange" }
                ].map((card, i) => (
                  <div key={i} className="bg-white dark:bg-[#0e1628] border border-rose-300 dark:border-rose-500/30 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider font-sans">{card.name}</span>
                      <MockItemBadge />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{card.count}</h2>
                      <span className={`text-[10px] font-bold ${
                        card.icon === "green" ? "text-emerald-500" :
                        card.icon === "teal" ? "text-[var(--brand-color)]" :
                        card.icon === "red" ? "text-rose-500" : "text-amber-500"
                      }`}>
                        {card.desc.split(" · ")[0]}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">{card.desc}</p>
                  </div>
                ))}
              </div>

              {/* Workload by Flight - real, GET /admin/coverage/reconditioning-load-by-flight.
                  Only real reconditioning-load columns are shown; "PT/Wk",
                  "OFT Lanes", and "Capacity" from the old mock have no real
                  data source anywhere in the backend (see the service
                  method's own docstring) and are not approximated. */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Workload by flight</h3>
                  </div>
                  <p className="text-[10px] text-slate-500">Active reconditioning caseload by flight</p>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold rounded uppercase">
                    k&ge;{flightLoad?.min_cohort_size ?? "—"}
                  </span>
                </div>

                {flightLoadLoading ? (
                  <p className="text-[10px] text-slate-400 py-6 text-center">Loading flight workload…</p>
                ) : !flightLoad || flightLoad.flights.length === 0 ? (
                  <p className="text-[10px] text-slate-400 py-6 text-center">
                    No flights currently meet the cohort minimum (k≥{flightLoad?.min_cohort_size ?? 5}) for this view.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-3">Flight</th>
                          <th className="pb-3 text-right">Airmen</th>
                          <th className="pb-3 text-right">Active Reconditioning</th>
                          <th className="pb-3 w-1/3 text-right">Load</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {flightLoad.flights.map((row) => (
                          <tr key={row.flight_id} className="hover:bg-slate-50/20 transition">
                            <td className="py-3 font-bold">{row.flight_name}</td>
                            <td className="py-3 text-right font-mono text-slate-500">{row.cohort_size}</td>
                            <td className="py-3 text-right font-mono text-slate-500">{row.active_reconditioning_count}</td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2 font-mono text-[10px]">
                                <span>{row.load_pct}%</span>
                                <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${row.load_pct >= 75 ? "bg-amber-500" : "bg-emerald-500"}`}
                                    style={{ width: `${row.load_pct}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SCS Availability Matrix - real, GET /admin/coverage/scs-weekly-availability.
                  Cell values are real hours logged via CoverageLog for that
                  day - a 0 means no coverage was logged, not "unavailable"
                  (there is no separate schedule/off-duty tracking to tell
                  the two apart). */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">SCS availability · this week</h3>
                  </div>
                  <p className="text-[10px] text-slate-500">Hours logged per day · {weeklyAvailability?.week_start} to {weeklyAvailability?.week_end}</p>
                </div>

                {weeklyAvailabilityLoading ? (
                  <p className="text-[10px] text-slate-400 py-6 text-center">Loading availability…</p>
                ) : !weeklyAvailability || weeklyAvailability.providers.length === 0 ? (
                  <p className="text-[10px] text-slate-400 py-6 text-center">No active SCS providers found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-3 w-1/4">SCS</th>
                          {weeklyAvailability.day_keys.map((day) => (
                            <th key={day} className="pb-3 text-center">
                              {new Date(day).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-center font-mono">
                        {weeklyAvailability.providers.map((row) => (
                          <tr key={row.provider_id} className="hover:bg-slate-50/20 transition">
                            <td className="py-3 text-left font-bold font-sans">
                              <span className="text-slate-800 dark:text-white block leading-tight">{row.provider_name}</span>
                              <span className="text-[10px] text-slate-400 block font-normal mt-0.5">{row.week_total_hours}h total</span>
                            </td>
                            {weeklyAvailability!.day_keys.map((day) => {
                              const hours = row.days[day] ?? 0;
                              const bg =
                                hours >= 8 ? "bg-rose-500/15 text-rose-500 border border-rose-500/25" :
                                hours >= 4 ? "bg-amber-500/15 text-amber-500 border border-amber-500/25" :
                                hours > 0 ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/25" :
                                "bg-slate-100 dark:bg-slate-800 text-slate-400";
                              return (
                                <td key={day} className="py-3 text-center">
                                  <span className={`inline-block min-w-6 px-1 rounded-md font-bold text-xs flex items-center justify-center mx-auto ${bg}`}>
                                    {hours}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Bottom splits roster table & leave widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* OFT clearance status */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left">
                  <div className="border-b border-slate-100 dark:border-white/5 pb-2.5">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">OFT clearance status - 7</h3>
                    <p className="text-[9px] text-slate-500">By airman &middot; grouped by flight</p>
                  </div>

                  <div className="overflow-x-auto my-3">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-2">Airman</th>
                          <th className="pb-2">Flight</th>
                          <th className="pb-2">Ops</th>
                          <th className="pb-2">Lane</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {[
                          { name: "T. Cho", fl: "Bravo", ops: "68", lane: "Tempo", status: "Cleared", col: "green" },
                          { name: "K. Patel", fl: "Charlie", ops: "66", lane: "Standard", status: "Cleared", col: "green" },
                          { name: "M. Hayes", fl: "Alpha", ops: "74", lane: "Tempo", status: "Cleared", col: "green" },
                          { name: "B. Ndiaye", fl: "Bravo", ops: "71", lane: "Standard", status: PLAN_STATUSES.PENDING_REVIEW, col: "orange" },
                          { name: "D. Okafor", fl: "Alpha", ops: "58", lane: "Standard", status: PLAN_STATUSES.PENDING_REVIEW, col: "orange" },
                          { name: "R. Singh", fl: "Charlie", ops: "70", lane: "Tempo", status: PLAN_STATUSES.DRAFT, col: "blue" },
                          { name: "S. Bauer", fl: "Alpha", ops: "64", lane: "Standard", status: PLAN_STATUSES.DRAFT, col: "blue" }
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/20 transition">
                            <td className="py-2.5 font-bold">{row.name}</td>
                            <td className="py-2.5 text-slate-500">{row.fl}</td>
                            <td className="py-2.5 font-mono text-slate-500">{row.ops}</td>
                            <td className="py-2.5 text-slate-500 font-medium">{row.lane}</td>
                            <td className="py-2.5 text-right">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                row.col === "green" ? "bg-emerald-500/10 text-emerald-500" :
                                row.col === "orange" ? "bg-amber-500/10 text-amber-500" : "bg-sky-500/10 text-sky-500"
                              }`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Upcoming PT sessions */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left">
                  <div className="border-b border-slate-100 dark:border-white/5 pb-2.5">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Upcoming PT sessions</h3>
                    <p className="text-[9px] text-slate-500">Next 7 days &middot; 5 SCS staff</p>
                  </div>

                  <div className="overflow-x-auto my-3">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Time</th>
                          <th className="pb-2">Group</th>
                          <th className="pb-2">Lead</th>
                          <th className="pb-2 w-1/4 text-right">Capacity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {[
                          { date: "Mon 27 Jul", time: "07:00", grp: "Alpha - Strength", lead: "TSgt Lee", pct: "80%", col: "bg-emerald-500", week: "this" },
                          { date: "Mon 27 Jul", time: "14:00", grp: "OFT prep - Tempo", lead: "SSgt Park", pct: "60%", col: "bg-[var(--brand-color)]", week: "this" },
                          { date: "Tue 28 Jul", time: "07:00", grp: "Alpha - Strength", lead: "TSgt Lee", pct: "80%", col: "bg-emerald-500", week: "this" },
                          { date: "Tue 28 Jul", time: "11:00", grp: "Rehab - 4", lead: "TSgt Lee", pct: "40%", col: "bg-amber-500", week: "this" },
                          { date: "Wed 29 Jul", time: "09:00", grp: "Bravo - Endurance", lead: "SSgt Park", pct: "40%", col: "bg-amber-500", week: "this" },
                          { date: "Wed 29 Jul", time: "16:00", grp: "Mobility - 8", lead: "SrA Diaz", pct: "60%", col: "bg-[var(--brand-color)]", week: "this" },
                          { date: "Thu 30 Jul", time: "07:00", grp: "Alpha - Strength", lead: "TSgt Lee", pct: "80%", col: "bg-emerald-500", week: "this" },
                          { date: "Mon 3 Aug", time: "07:00", grp: "Alpha - Strength", lead: "TSgt Lee", pct: "70%", col: "bg-emerald-500", week: "next" },
                          { date: "Tue 4 Aug", time: "14:00", grp: "OFT prep - Tempo", lead: "SSgt Park", pct: "50%", col: "bg-amber-500", week: "next" }
                        ].filter((row) => coverageWeek === "Month" || (coverageWeek === "This week" ? row.week === "this" : row.week === "next")).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/20 transition">
                            <td className="py-2 font-bold">{row.date}</td>
                            <td className="py-2 font-mono text-slate-500">{row.time}</td>
                            <td className="py-2 text-slate-700 dark:text-slate-300 font-medium">{row.grp}</td>
                            <td className="py-2 text-slate-500">{row.lead}</td>
                            <td className="py-2 text-right">
                              <div className="flex items-center justify-end gap-2 font-mono text-[9px]">
                                <span>{row.pct}</span>
                                <div className="w-12 h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${row.col}`} style={{ width: row.pct }}></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Leave overlap, Hours coverage grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs text-left font-sans items-stretch">
                
                {/* Leave Overlap - real, GET /admin/leave/overlap. */}
                <div className="lg:col-span-8 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Leave overlap - next 30 days</h3>
                  </div>
                  <p className="text-[9px] text-slate-500">Real leave records, window_days={leaveOverlap?.window_days ?? 30}</p>

                  {leaveOverlapLoading ? (
                    <p className="text-[10px] text-slate-400 py-6 text-center">Loading leave records…</p>
                  ) : !leaveOverlap || leaveOverlap.records.length === 0 ? (
                    <p className="text-[10px] text-slate-400 py-6 text-center">No leave scheduled in this window.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      {leaveOverlap.records.map((rec) => {
                        const overlapping = leaveOverlap.overlapping_pairs.filter(
                          (p) => p.record_id_a === rec.id || p.record_id_b === rec.id
                        );
                        const isOverlapping = overlapping.length > 0;
                        return (
                          <div
                            key={rec.id}
                            className={
                              isOverlapping
                                ? "bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-1 text-center"
                                : "bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl space-y-1"
                            }
                          >
                            <span className={`font-extrabold block ${isOverlapping ? "text-amber-600" : "text-slate-800 dark:text-white"}`}>
                              {rec.user_name || "Unknown"}
                            </span>
                            <span className={`text-[10px] block font-mono ${isOverlapping ? "text-amber-500" : "text-slate-500"}`}>
                              {rec.leave_type_label} · {rec.start_date} - {rec.end_date}
                            </span>
                            {isOverlapping && (
                              <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-500 text-[8px] font-bold rounded uppercase">
                                overlap · {overlapping[0].overlap_days}d
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Hours Coverage stats */}
                <div className="lg:col-span-4 bg-white dark:bg-[#0e1628] border border-rose-300 dark:border-rose-500/30 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <div className="text-left flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">SCS hours coverage</h3>
                      <MockItemBadge />
                    </div>
                    <p className="text-[9px] text-slate-500 leading-none mt-0.5">Scheduled + worked</p>
                    <span className="px-2 py-0.2 bg-[var(--brand-color)]/15 text-[var(--brand-color)] text-[8px] font-bold rounded uppercase font-mono">
                      95% target
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-sans text-left">
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-400 block uppercase font-mono">Scheduled</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">160</span>
                      <span className="text-[9px] text-slate-500 block">Cap 200</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-400 block uppercase font-mono">Worked</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">152</span>
                      <span className="text-[9px] text-emerald-500 block">95% of scheduled</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-400 block uppercase font-mono">YTD Annual</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">1,128 / 2,080</span>
                      <span className="text-[9px] text-slate-500 block">54% on pace</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-400 block uppercase font-mono">Missed</span>
                      <span className="font-bold text-rose-500 block">8</span>
                      <span className="text-[9px] text-slate-500 block">2 due to leave</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* RSD Coverage block split with RTP+RTD box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-left font-sans items-stretch">
                
                {/* RSD coverage */}
                <div className="bg-white dark:bg-[#0e1628] border border-rose-300 dark:border-rose-500/30 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">RSD coverage (separate)</h3>
                      <MockItemBadge />
                    </div>
                    <p className="text-[9px] text-slate-500">Restricted-status duty sessions tracked separately</p>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-bold rounded font-mono">
                      36 / 20
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-normal pt-4">
                    Restricted-status duty sessions are logged under compliance guidelines to assure zero training overlap for active reconditioning profiles.
                  </p>
                </div>

                {/* RTP + RTD Guide box */}
                <div className="bg-[#f8fafc] dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 text-left text-xs space-y-3 font-sans">
                  <span className="font-bold text-slate-800 dark:text-white block uppercase tracking-wider text-[9px]">RTP + RTD &mdash; separate paths</span>
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[var(--brand-color)] block">RTP (Return to Performance)</span>
                      <p className="text-slate-500 leading-normal font-normal">
                        is managed in Ascend: SCS + PT/IM coordinate reconditioning, training load, and progression.
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-bold text-amber-500 block">RTD (Return to Duty)</span>
                      <p className="text-slate-500 leading-normal font-normal">
                        requires source-authority + decision date + verification + reevaluation/expiration. RTD is only surfaced when all four fields are present, and SCS never edits it.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Refresh Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-4">
                Coverage &middot; last refresh 28 Jul 06:42 &middot; CUI // OPSEC
              </div>

            </div>
          )}

          {/* Tab 6: MESSAGES CHAT THREAD VIEW */}
          {activeTab === "messages" && !reviewingAirmanId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">SCS - MESSAGES</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">Messages</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Direct messages with your airmen. Every send is audit-logged.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono">
                    Population: {POPULATION_LEVELS.INDIVIDUAL}
                  </span>
                  <button
                    onClick={() => setShowNewDmModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    + New message
                  </button>
                </div>
              </div>

              {/* Chat View splits grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left font-sans text-xs">
                
                {/* Left Side: Inbox search list - real, GET /messaging/threads. */}
                <div className="lg:col-span-4 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Inbox</h3>
                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-600 text-[8.5px] font-bold rounded-full uppercase tracking-wider font-mono">
                      {threads.reduce((sum, t) => sum + t.unread_count, 0)} unread
                    </span>
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <input
                      type="text"
                      aria-label="Search messages"
                      placeholder="Search messages"
                      value={threadSearch}
                      onChange={(e) => setThreadSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-[var(--brand-color)] text-slate-800 dark:text-white placeholder-slate-400"
                    />
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  </div>

                  {/* Chats list */}
                  <div className="space-y-2">
                    {threadsLoading ? (
                      <p className="text-[10px] text-slate-400 py-6 text-center">Loading threads…</p>
                    ) : threads.length === 0 ? (
                      <p className="text-[10px] text-slate-400 py-6 text-center">No messages yet.</p>
                    ) : (
                      threads
                        .filter((t) => {
                          const q = threadSearch.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            (t.other_user_name || "").toLowerCase().includes(q) ||
                            t.last_message_body.toLowerCase().includes(q)
                          );
                        })
                        .map((chat) => (
                          <div
                            key={chat.other_user_id}
                            onClick={() => void openThread(chat.other_user_id)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                              selectedChatId === chat.other_user_id
                                ? "bg-[var(--brand-color)]/10 border-[var(--brand-color)]/30 text-[var(--brand-color)]"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between font-mono text-[9px] gap-2">
                              <span className="font-bold text-slate-800 dark:text-white font-sans text-xs">
                                {chat.other_user_name || "Unknown"}
                              </span>
                              <span className="text-slate-500">{formatRelativeShort(chat.last_message_at)}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block leading-tight mt-0.5 font-sans font-medium">
                              {chat.other_user_role}
                            </span>
                            <div className="flex items-center justify-between gap-4 mt-2">
                              <p className="text-[10px] text-slate-500 truncate w-48 font-sans">{chat.last_message_body}</p>
                              {chat.unread_count > 0 && (
                                <span className="size-4 bg-[var(--brand-color)] text-white text-[8px] font-bold rounded-full flex items-center justify-center font-mono">
                                  {chat.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                    )}
                  </div>

                </div>

                {/* Right Side: Active Chat dialog thread - real. */}
                <div className="lg:col-span-8 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm flex flex-col justify-between h-[650px] overflow-hidden">
                  
                  {/* Chat Header - real. */}
                  <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-[#f8fafc] dark:bg-slate-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-cyan-500/10 text-[var(--brand-color)] font-bold text-xs flex items-center justify-center select-none font-mono">
                        {(selectedThread?.other_user_name || "?").charAt(0)}
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-slate-800 dark:text-white block text-sm">
                          {selectedThread?.other_user_name || "Select a thread"}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {selectedThread?.other_user_role || "—"}
                        </span>
                      </div>
                    </div>

                    {selectedThread && (
                      <button
                        onClick={() => {
                          setReviewingAirmanId(selectedThread.other_user_name || selectedThread.other_user_id);
                          triggerToast(`Opening full profile for ${selectedThread.other_user_name}`);
                        }}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold rounded-lg text-slate-700 dark:text-slate-200 transition cursor-pointer"
                      >
                        View profile
                      </button>
                    )}
                  </div>

                  {/* Chat bubbles list - real. */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 dark:bg-[#0e1628]">
                    {activeThreadLoading ? (
                      <p className="text-[10px] text-slate-400 text-center py-6">Loading messages…</p>
                    ) : !selectedChatId ? (
                      <p className="text-[10px] text-slate-400 text-center py-6">Select a thread on the left to view messages.</p>
                    ) : activeThreadMessages.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-6">No messages yet. Say hello below.</p>
                    ) : (
                      activeThreadMessages.map((msg) => {
                        const mine = msg.sender_id === currentUser?.id;
                        return (
                          <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`p-4 rounded-2xl max-w-sm text-xs leading-relaxed space-y-1.5 ${
                              mine
                                ? "bg-[#008094] text-white rounded-tr-none text-left"
                                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 rounded-tl-none text-left"
                            }`}>
                              <p className="font-sans font-medium">{msg.body}</p>
                              <span className={`text-[8px] font-mono block text-right leading-none ${
                                mine ? "text-cyan-200" : "text-slate-400"
                              }`}>{formatRelativeShort(msg.created_at)}</span>
                            </div>
                          </div>
                        );
                      })
                    )}

                  </div>

                  {/* Message Input Box */}
                  <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-[#f8fafc] dark:bg-slate-900/60 space-y-3">
                    
                    <div className="text-center text-[9px] text-slate-400 font-mono select-none">
                      Messages in this thread are audit-logged
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        aria-label={`Message ${selectedThread?.other_user_name || ""}`}
                        placeholder={selectedThread ? `Message ${selectedThread.other_user_name}` : "Select a thread first"}
                        value={typedMessage}
                        disabled={!selectedChatId || sendingMessage}
                        onChange={(e) => setTypedMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && void handleSendMessage()}
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-[var(--brand-color)] text-slate-800 dark:text-white placeholder-slate-400 disabled:opacity-60"
                      />
                      <button
                        onClick={() => void handleSendMessage()}
                        disabled={!selectedChatId || sendingMessage || !typedMessage.trim()}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {sendingMessage ? "Sending…" : "Send"}
                      </button>
                    </div>

                  </div>

                </div>

              </div>

              {/* Prototype notice footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-4">
                Ascend &middot; SCS Workspace prototype &middot; v0.1
              </div>

            </div>
          )}

          <CreateRecordModal
            open={showRecondPlanModal}
            onClose={() => {
              setShowRecondPlanModal(false);
              setRecondPlanError("");
              setRecondPlanSuccess("");
            }}
            title="Create reconditioning plan"
            subtitle="Live SCS API: PUT /records/reconditioning-plan/:userId"
            submitLabel={isSavingRecondPlan ? "Saving..." : "Save plan"}
            onSubmit={(values) => {
              void handleReconditioningPlanSubmit(values);
            }}
            fields={[
              {
                name: "user_id",
                label: "Target user ID",
                required: true,
                placeholder: "Paste the backend user ID",
              },
              {
                name: "phase",
                label: "Phase",
                type: "select",
                required: true,
                defaultValue: "active",
                options: ["active", "draft", "completed"],
              },
              {
                name: "sessions_completed",
                label: "Sessions completed",
                required: true,
                defaultValue: "2",
              },
              {
                name: "sessions_total",
                label: "Sessions total",
                required: true,
                defaultValue: "12",
              },
              {
                name: "cadence_note",
                label: "Cadence note",
                required: true,
                defaultValue: "2x/week",
              },
              {
                name: "injury_flags",
                label: "Injury flags",
                required: true,
                defaultValue: "knee",
                placeholder: "Comma-separated values",
              },
              {
                name: "ptim_clearance_status",
                label: "PT/IM clearance status",
                type: "select",
                required: true,
                defaultValue: "modified_duty",
                options: ["modified_duty", "cleared", "restricted", "pending"],
              },
              {
                name: "next_review_date",
                label: "Next review date",
                type: "date",
                required: true,
                defaultValue: "2026-09-01",
              },
              {
                name: "limitation_flag",
                label: "Limitation flag",
                type: "select",
                required: true,
                defaultValue: "true",
                options: ["true", "false"],
              },
              {
                name: "rehab_strategy_summary",
                label: "Rehab strategy summary",
                type: "textarea",
                required: true,
                defaultValue: "Progressive loading, avoid deep flexion.",
              },
              {
                name: "scs_coordination_status",
                label: "SCS coordination status",
                type: "select",
                required: true,
                defaultValue: "pending",
                options: ["pending", "in_progress", "complete"],
              },
              {
                name: "severity_level",
                label: "Severity level",
                type: "select",
                required: true,
                defaultValue: "L2",
                options: ["L1", "L2", "L3", "L4", "L5"],
              },
              {
                name: "injury_reported_on",
                label: "Injury reported on",
                type: "date",
                required: true,
                defaultValue: "2026-08-01",
              },
            ]}
          >
            <div className="space-y-2 rounded-xl bg-slate-50 px-3 py-3 text-left text-[11px] text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
              <p>Use the real backend user ID for the airman whose reconditioning plan you want to create or update.</p>
              {recondPlanError ? <p className="font-semibold text-rose-600 dark:text-rose-300">{recondPlanError}</p> : null}
              {recondPlanSuccess ? <p className="font-semibold text-emerald-600 dark:text-emerald-300">{recondPlanSuccess}</p> : null}
            </div>
          </CreateRecordModal>
          <RecordDetailDialog
            open={!!viewingTemplate}
            onClose={() => setViewingTemplate(null)}
            title={viewingTemplate?.title ?? "Plan template"}
            subtitle={viewingTemplate?.desc}
            badge={
              viewingTemplate ? (
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                  {viewingTemplate.badge}
                </span>
              ) : null
            }
            fields={
              viewingTemplate
                ? [
                    { label: "Cadence", value: viewingTemplate.cad },
                    { label: "Window", value: viewingTemplate.win },
                    { label: "Owner", value: viewingTemplate.owner },
                  ]
                : []
            }
            actions={
              viewingTemplate ? (
                <>
                  <button
                    onClick={() => setViewingTemplate(null)}
                    type="button"
                    className="flex-1 py-2 px-4 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      selectTemplateForAssignment(viewingTemplate);
                      setViewingTemplate(null);
                    }}
                    type="button"
                    className="flex-1 py-2 px-4 bg-[var(--brand-color)] hover:opacity-90 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Use template
                  </button>
                </>
              ) : undefined
            }
          >
            {viewingTemplate ? (
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600 dark:border-white/5 dark:bg-slate-900/60 dark:text-slate-300">
                <p className="font-semibold text-slate-800 dark:text-white">Plan details</p>
                <p className="leading-relaxed">{viewingTemplate.details}</p>
              </div>
            ) : null}
          </RecordDetailDialog>

          <RecordDetailDialog
            open={!!viewingQueueItem}
            onClose={() => {
              setViewingQueueItem(null);
              setQueueRecommendationId("");
              setQueueReviewError("");
              setQueueReviewSuccess("");
            }}
            title={viewingQueueItem?.name ?? "Assignment queue item"}
            subtitle="Queue review and sign-off routing"
            fields={
              viewingQueueItem
                ? [
                    { label: "Status", value: viewingQueueItem.status },
                    { label: "Details", value: viewingQueueItem.details },
                  ]
                : []
            }
            actions={
              viewingQueueItem ? (
                <>
                  <button
                    onClick={() => setViewingQueueItem(null)}
                    type="button"
                    className="flex-1 py-2 px-4 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      void handleQueueSendForSignoff();
                    }}
                    type="button"
                    className="flex-1 py-2 px-4 bg-[var(--brand-color)] hover:opacity-90 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {isSendingQueueReview ? "Sending..." : "Send for sign-off"}
                  </button>
                </>
              ) : undefined
            }
          >
            {viewingQueueItem ? (
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600 dark:border-white/5 dark:bg-slate-900/60 dark:text-slate-300">
                <div className="space-y-1.5">
                  <label htmlFor="scs-queue-recommendation-id" className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Recommendation ID
                  </label>
                  <input
                    id="scs-queue-recommendation-id"
                    type="text"
                    value={queueRecommendationId}
                    onChange={(e) => setQueueRecommendationId(e.target.value)}
                    placeholder="Required for live send-for-signoff API"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                  />
                </div>
                {queueReviewError ? <p className="font-semibold text-rose-600 dark:text-rose-300">{queueReviewError}</p> : null}
                {queueReviewSuccess ? <p className="font-semibold text-emerald-600 dark:text-emerald-300">{queueReviewSuccess}</p> : null}
              </div>
            ) : null}
          </RecordDetailDialog>

    </div>
  );
}

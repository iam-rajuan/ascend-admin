"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { AscendLogo } from "@/components/ascend-logo";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { useCurrentUser } from "@/hooks/use-current-user";
import { IconButton } from "@/components/ui/icon-button";
import { RecordDetailDialog } from "@/components/ui/record-detail-dialog";
import { CreateRecordModal } from "@/components/ui/create-record-modal";
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

export default function ScsDashboard() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const currentUser = useCurrentUser();
  const [activeTabInternal, setActiveTabInternal] = useState<TabType>("overview");
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

  // Chat/Messages states
  const [selectedChatId, setSelectedChatId] = useState<string>("J. Reyes");
  const [typedMessage, setTypedMessage] = useState("");
  
  // Custom mock chat threads matching Figma data
  const [chatThreads, setChatThreads] = useState<Record<string, MessageRow[]>>({
    "J. Reyes": [
      { sender: "scs", text: "Take today lighter. Start the 12-min reset before duty, and keep deadlifts sub-80% this week.", time: "06:35" },
      { sender: "airman", text: "Got it. Started the mobility reset \u2014 felt pretty good today.", time: "06:42" },
      { sender: "airman", text: "Ready for mobility. Are we good to move into block 2 on Monday?", time: "06:14" },
      { sender: "airman", text: "Also \u2014 slept 7.5h last night, anchored at 22:30. The dim-evening routine is helping.", time: "06:18" }
    ],
    "A. Mendez": [
      { sender: "airman", text: "Sleep timing past 3 nights has been inconsistent due to night shifts. Can we adjust my loading block?", time: "Yesterday" },
      { sender: "scs", text: "Understood. Keep intensity around RPE 6-7. Focus on hydration and the dim-light sleep routine.", time: "Yesterday" }
    ],
    "T. Cho": [
      { sender: "airman", text: "OFT cleared \u2014 thanks TSgt Lee! Deadlift felt stable throughout.", time: "Yesterday" },
      { sender: "scs", text: "Excellent news, Cho. Transitioning you back to Cycle 4 performance. Keep up the pre-hab.", time: "Yesterday" }
    ],
    "D. Okafor": [
      { sender: "airman", text: "Hip \u2014 still tight after rehab sessions. Felt a pinch during squats.", time: "23 Jul" },
      { sender: "scs", text: "Okay, hold squats for now. We will swap them with hip-hinge glute bridges on block 1.", time: "23 Jul" }
    ]
  });

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

  const handleSendMessage = () => {
    if (!typedMessage.trim()) return;
    const currentThread = chatThreads[selectedChatId] || [];
    setChatThreads({
      ...chatThreads,
      [selectedChatId]: [
        ...currentThread,
        { sender: "scs", text: typedMessage, time: "Just now" }
      ]
    });
    setTypedMessage("");
    triggerToast("Message sent and audit-logged");
  };

  const handleAssignPlanSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    // Push to existing assignedPlans (Phase 4) with PENDING_REVIEW status
    const newAssignment: AssignedPlanRow = {
      id: `ap-form-${Date.now()}`,
      status: PLAN_STATUSES.PENDING_REVIEW,
      plan: assignPlan,
      air: assignAirman,
      airUnit: "",
      win: assignWindow,
      owner: assignCoOwner,
      comp: "0%",
      col: "orange",
      sign: "PT/IM",
      signBold: false,
    };
    setAssignedPlans((prev) => [newAssignment, ...prev]);
    triggerToast(`Plan "${assignPlan}" assigned successfully to ${assignAirman}`);
    // Clear form
    setAssignAirman("J. Reyes");
    setAssignPlan("Rehab Block 2");
    setAssignWindow("28 Jul - 25 Aug");
    setAssignCoOwner("SCS + PT/IM");
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

  const setActiveTab = (tab: TabType) => {
    setActiveTabInternal(tab);
    setReviewingAirmanId(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("ascend_scs_active_tab", tab);
    }
  };

  const activeTab = activeTabInternal;

  // Sync saved active tab
  useEffect(() => {
    const savedTab = localStorage.getItem("ascend_scs_active_tab") as TabType | null;
    if (savedTab && ["overview", "dashboard", "people", "plans", "coverage", "messages"].includes(savedTab)) {
      setActiveTabInternal(savedTab);
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

  if (!hasMounted || !isAuthenticated) return null;

  return (
    <div className="flex h-screen w-screen bg-[#f0f4f9] dark:bg-[#070a13] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-[#0e1628] flex flex-col justify-between border-r border-slate-200 dark:border-white/5 flex-shrink-0 z-30">
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[var(--brand-color)]"></span>
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase font-sans">
                SCS
              </span>
            </div>
          </div>

          {/* Navigation Category 1 */}
          <div className="px-5 pt-6 pb-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase font-sans">
            Workspace
          </div>

          <nav className="px-3 space-y-1">
            {[
              { id: "overview", label: "Overview", icon: Users },
              { id: "dashboard", label: "Dashboard", icon: TrendingUp },
              { id: "people", label: "People", icon: User },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                    activeTab === item.id && !reviewingAirmanId
                      ? "bg-[var(--brand-color)]/10 text-[var(--brand-color)]"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Navigation Category 2 */}
          <div className="px-5 pt-6 pb-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase font-sans">
            Plans & Coverage
          </div>

          <nav className="px-3 space-y-1">
            {[
              { id: "plans", label: "Plans", icon: ClipboardList },
              { id: "coverage", label: "Coverage", icon: FileText },
              { id: "messages", label: "Messages", icon: MessageSquare },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                    (activeTab === item.id || (item.id === "people" && reviewingAirmanId))
                      ? "bg-[var(--brand-color)]/10 text-[var(--brand-color)]"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Session control buttons */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 space-y-2">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-55 dark:hover:bg-slate-900 transition cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            My profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-55/20 dark:hover:bg-red-950/20 transition cursor-pointer"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* WORKSPACE CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="flex h-14 w-full items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0e1628] px-6 md:px-8 flex-shrink-0 z-20">
          <div className="flex items-center gap-2">
            <AscendLogo width={20} height={20} showDetails={false} />
            <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">Ascend</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-light select-none">/</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">SCS performance workspace</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-slate-200 dark:border-white/5 pr-6">
              <IconButton
                icon={Bell}
                aria-label="Notifications"
                className="relative p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                iconClassName="size-4.5"
              >
                <span className="absolute top-1 right-1 size-2 rounded-full bg-[var(--brand-color)] ring-2 ring-white dark:ring-[#0e1628]"></span>
              </IconButton>
              <IconButton
                icon={theme === "light" ? Moon : Sun}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                onClick={toggleTheme}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                iconClassName="size-4.5"
              />
            </div>

            {/* Profile Context */}
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="flex items-center gap-3 cursor-pointer"
              type="button"
            >
              <div className="text-right flex flex-col items-end">
                <span className="text-xs font-bold text-slate-800 dark:text-white block">{currentUser?.name}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight font-sans">{currentUser?.unit}</span>
              </div>
              <div className="size-8 rounded-full bg-cyan-500 text-white font-sans font-black text-xs flex items-center justify-center select-none border border-slate-200 dark:border-white/5">
                {currentUser?.initials}
              </div>
            </button>
          </div>
        </header>

        {/* CUI BANNER */}
        <div className="h-6 w-full bg-slate-900 border-b border-slate-800 flex items-center justify-center px-6 text-[9px] font-mono tracking-wider text-slate-500 flex-shrink-0 select-none z-10 font-sans">
          <span className="text-[var(--brand-color)] mr-2 font-black">•</span>
          {reviewingAirmanId ? `CUI // OPSEC · Roster view · J. Reyes drill-in · audit logged` : `CUI // OPSEC · Messages are audit-logged · SCS flight`}
        </div>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#070a13] px-6 py-8 md:px-8 space-y-8">
          
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

              {/* ACTIONABLE WORK QUEUE — priority items first, clickable, opens filtered records (Req 3) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Work Queue &middot; requires your action</h3>
                  <span className="text-[9px] text-slate-500 font-mono">{POPULATION_LEVELS.CASELOAD}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { name: ALERT_TYPES.NEW_ASSIGNMENT, count: "4", desc: "New to your caseload this week", tab: "people" as TabType, col: "teal" },
                    { name: ALERT_TYPES.FOLLOW_UP_DUE, count: "6", desc: "Follow-up check due within 48h", tab: "people" as TabType, col: "orange" },
                    { name: ALERT_TYPES.OVERDUE_ACTION, count: "3", desc: "Past due &mdash; review before 11:00", tab: "people" as TabType, col: "red" },
                    { name: ALERT_TYPES.UNREAD_MESSAGE, count: "7", desc: "Unread in Messages", tab: "messages" as TabType, col: "teal" },
                    { name: ALERT_TYPES.PLAN_REVIEW, count: "2", desc: "Awaiting PT/IM sign-off", tab: "plans" as TabType, col: "orange" }
                  ].map((card, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveTab(card.tab); triggerToast(`Opening ${card.name.toLowerCase()} queue`); }}
                      className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 rounded-2xl p-5 shadow-sm space-y-3 text-left transition cursor-pointer"
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
              </div>

              {/* Flight snapshot — analytics, secondary to the work queue above */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase font-mono block">Flight snapshot &middot; analytics</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { name: "Active airmen", count: "112", desc: "+4 this month", col: "green" },
                    { name: "Needs review", count: "14", desc: "+3 since Mon", col: "orange" },
                    { name: "OFT clearance queue", count: "7", desc: "3 cleared today", col: "teal" },
                    { name: "Reconditioning", count: "5", desc: "2 awaiting review", col: "slate" }
                  ].map((card, i) => (
                    <div key={i} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider font-sans">{card.name}</span>
                      <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{card.count}</h2>
                        <span className={`text-[10px] font-bold ${
                          card.col === "green" ? "text-emerald-500" :
                          card.col === "orange" ? "text-amber-500" :
                          card.col === "teal" ? "text-[var(--brand-color)]" : "text-slate-500"
                        }`}>
                          {card.desc.split(" since ")[0].split(" this ")[0].split(" cleared ")[0].split(" awaiting ")[0]}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">{card.desc}</p>
                    </div>
                  ))}
                </div>
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
                
                {/* Timeline agenda */}
                <div className="lg:col-span-8 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase font-mono">Today &middot; 28 Jul</span>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Agenda Timeline</h3>
                  </div>

                  <div className="relative border-l border-slate-100 dark:border-white/5 pl-6 ml-2 space-y-6 text-xs font-sans">
                    
                    {/* Item 1 */}
                    <div className="relative">
                      <span className="absolute -left-[30px] top-1 size-3 rounded-full bg-[var(--brand-color)] border-2 border-white dark:border-[#0e1628]"></span>
                      <span className="font-mono text-slate-400 text-[10px] block">06:42</span>
                      <span className="font-bold text-slate-800 dark:text-white block mt-0.5">OFT clearance run</span>
                      <span className="text-[10px] text-emerald-500 block leading-tight font-mono">3 cleared</span>
                    </div>

                    {/* Item 2 */}
                    <div className="relative">
                      <span className="absolute -left-[30px] top-1 size-3 rounded-full bg-[var(--brand-color)] border-2 border-white dark:border-[#0e1628]"></span>
                      <span className="font-mono text-slate-400 text-[10px] block">07:00</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mt-0.5">PT session &middot; Alpha flight</span>
                    </div>

                    {/* Item 3 */}
                    <div className="relative">
                      <span className="absolute -left-[30px] top-1 size-3 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-[#0e1628]"></span>
                      <span className="font-mono text-slate-400 text-[10px] block">11:00</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mt-0.5">Rehab review &middot; J. Reyes</span>
                    </div>

                    {/* Item 4 */}
                    <div className="relative">
                      <span className="absolute -left-[30px] top-1 size-3 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-[#0e1628]"></span>
                      <span className="font-mono text-slate-400 text-[10px] block">14:00</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mt-0.5">Plan sync with PT/IM</span>
                    </div>

                  </div>
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

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { name: "Active airmen", count: "112", desc: "+4 this month", col: "green" },
                  { name: "Needs review", count: "14", desc: "+3 since Mon", col: "orange" },
                  { name: "OFT clearance queue", count: "7", desc: "3 cleared today", col: "teal" },
                  { name: "Reconditioning", count: "5", desc: "2 awaiting review", col: "slate" }
                ].map((card, i) => (
                  <div key={i} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider font-sans">{card.name}</span>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{card.count}</h2>
                      <span className={`text-[10px] font-bold ${
                        card.col === "green" ? "text-emerald-500" :
                        card.col === "orange" ? "text-amber-500" :
                        card.col === "teal" ? "text-[var(--brand-color)]" : "text-slate-500"
                      }`}>
                        {card.desc.split(" since ")[0].split(" this ")[0].split(" cleared ")[0].split(" awaiting ")[0]}
                      </span>
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
                  
                  {/* Queue table card */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Queue &middot; 14</h3>
                        <p className="text-[10px] text-slate-500 font-mono">Sorted by severity then confidence</p>
                      </div>

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

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="pb-3">Airman</th>
                            <th className="pb-3">Driver</th>
                            <th className="pb-3 text-right">Last Ops</th>
                            <th className="pb-3">Confidence</th>
                            <th className="pb-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {[
                            { code: "J. Reyes", details: "SrA", dr: "L4 · Pain - lower back", drCol: "red", ops: "54 \u25bc 8", opsCol: "red", conf: "High", plan: "Rehab Block 2", date: "28 Jul" },
                            { code: "A. Mendez", details: "A1C", dr: "Sleep · 5 nights", drCol: "badge-orange", ops: "62 \u25bc 3", opsCol: "red", conf: "Medium", plan: "Sleep Reset", date: "27 Jul" },
                            { code: "T. Cho", details: "SSgt", dr: "OFT · clearance", drCol: "badge-teal", ops: "68 \u25b2 2", opsCol: "green", conf: "High", plan: "Cycle 4 Perf.", date: "28 Jul" },
                            { code: "B. Ndiaye", details: "A1C", dr: "Mobility", drCol: "badge-teal", ops: "71 \u25b2 4", opsCol: "green", conf: "High", plan: "Reconditioning", date: "26 Jul" },
                            { code: "K. Patel", details: "A1C", dr: "Load mgmt", drCol: "badge-orange", ops: "66 \u2014 0", opsCol: "slate", conf: "High", plan: "OFT Tempo Prep", date: "28 Jul" },
                            { code: "M. Hayes", details: "SrA", dr: "Cycle 4", drCol: "badge-teal", ops: "74 \u25b2 1", opsCol: "green", conf: "High", plan: "Cycle 4 Perf.", date: "28 Jul" },
                            { code: "D. Okafor", details: "SSgt", dr: "L3 · hip", drCol: "orange", ops: "58 \u25bc 5", opsCol: "red", conf: "Medium", plan: "Hip Recond.", date: "25 Jul" }
                          ].filter((row) => matchesQueuePill(dashboardQueueFilter, row) && (dashboardDateRange !== "Today" || row.date === "28 Jul")).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/20 transition">
                              <td className="py-2.5">
                                <span className="font-bold text-slate-800 dark:text-white block">{row.code}</span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">{row.details}</span>
                              </td>
                              <td className="py-2.5">
                                {row.drCol === "red" && <span className="font-bold text-rose-500">{row.dr}</span>}
                                {row.drCol === "orange" && <span className="font-bold text-amber-500">{row.dr}</span>}
                                {row.drCol.startsWith("badge-") && (
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                    row.drCol === "badge-teal" ? "bg-cyan-500/10 text-cyan-600" : "bg-amber-500/10 text-amber-600"
                                  }`}>
                                    {row.dr}
                                  </span>
                                )}
                              </td>
                              <td className={`py-2.5 text-right font-mono font-bold ${
                                row.opsCol === "red" ? "text-rose-500" :
                                row.opsCol === "green" ? "text-emerald-500" : "text-slate-500"
                              }`}>{row.ops}</td>
                              <td className="py-2.5">
                                <span className="inline-flex items-center gap-1.5 font-bold">
                                  <span className={`size-1.5 rounded-full ${
                                    row.conf === "High" ? "bg-emerald-500" : "bg-amber-500"
                                  }`}></span>
                                  {row.conf}
                                </span>
                              </td>
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() => { setReviewingAirmanId(row.code); triggerToast(`Opened chart view context: ${row.code}`); }}
                                  className="px-3 py-1 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  Open
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400">Showing 7 of 14 airmen</span>
                      <button type="button" onClick={() => setActiveTab("people")} className="text-[var(--brand-color)] font-bold cursor-pointer hover:underline">
                        View all &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Driver breakdown widget */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Driver Breakdown</h3>
                      <p className="text-[9px] text-slate-500 font-mono">Cohort &middot; last 7 days</p>
                    </div>

                    <div className="space-y-4 font-sans text-xs">
                      {[
                        { label: "Physical", val: 72, col: "bg-cyan-500" },
                        { label: "Sleep", val: 59, col: "bg-cyan-500" },
                        { label: "Mental (training implication)", val: 65, col: "bg-blue-500" },
                        { label: "Nutritional", val: 71, col: "bg-amber-500" },
                        { label: "Spiritual", val: 70, col: "bg-yellow-500" }
                      ].map((bar, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-baseline font-mono text-[10px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300 font-sans">{bar.label}</span>
                            <span>{bar.val}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${bar.col}`} style={{ width: `${bar.val}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Column (4/12): Trend curve chart, Recommendations, and PT agenda */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Line Chart card */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4 text-left">
                    <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">Flight readiness &middot; 14 days</h3>
                        <p className="text-[9px] text-slate-500">Cohort: S-3 &middot; Tue 15 Jul &ndash; Mon 28 Jul</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold rounded uppercase tracking-wider font-mono">
                        k&ge;5
                      </span>
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

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { name: "Active airmen", count: "112", desc: "+4 this month", icon: "green" },
                  { name: "Needs review", count: "14", desc: "+3 since Mon", icon: "orange" },
                  { name: "L4+ flagged", count: "3", desc: "Review before 11:00", icon: "red" },
                  { name: "Reconditioning", count: "5", desc: "2 awaiting review", icon: "slate" }
                ].map((card, i) => (
                  <div key={i} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider font-sans">{card.name}</span>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{card.count}</h2>
                      <span className={`text-[10px] font-bold ${
                        card.icon === "green" ? "text-emerald-500" :
                        card.icon === "orange" ? "text-amber-500" :
                        card.icon === "red" ? "text-rose-500" : "text-[var(--brand-color)]"
                      }`}>
                        {card.desc.split(" since ")[0].split(" this ")[0].split(" before ")[0].split(" awaiting ")[0]}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">{card.desc}</p>
                  </div>
                ))}
              </div>

              {/* People Table */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Queue &middot; 14</h3>
                    <p className="text-[10px] text-slate-500">Sorted by severity then confidence</p>
                  </div>

                  <div className="flex gap-2">
                    {["Needs review", "OFT", "Reconditioning", "L4+", "All 112"].map((fPill, idx) => (
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

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 w-1/4">Airman</th>
                        <th className="pb-3">Driver</th>
                        <th className="pb-3 text-right">Last Ops</th>
                        <th className="pb-3">Confidence</th>
                        <th className="pb-3">Plan</th>
                        <th className="pb-3">Last Contact</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {[
                        { code: "J. Reyes", details: "SrA · Alpha", dr: "L4 · Pain - lower back", drCol: "red", ops: "54 \u25bc 8", opsCol: "red", conf: "High", plan: "Rehab Block 2", date: "28 Jul" },
                        { code: "A. Mendez", details: "A1C · Bravo", dr: "Sleep · 5 nights", drCol: "badge-orange", ops: "62 \u25bc 3", opsCol: "red", conf: "Medium", plan: "Sleep Reset", date: "27 Jul" },
                        { code: "T. Cho", details: "SSgt · Alpha", dr: "OFT · clearance", drCol: "badge-teal", ops: "68 \u25b2 2", opsCol: "green", conf: "High", plan: "Cycle 4 Perf.", date: "28 Jul" },
                        { code: "B. Ndiaye", details: "A1C · Charlie", dr: "Mobility", drCol: "badge-teal", ops: "71 \u25b2 4", opsCol: "green", conf: "High", plan: "Reconditioning", date: "26 Jul" },
                        { code: "K. Patel", details: "A1C · Bravo", dr: "Load mgmt", drCol: "badge-orange", ops: "66 \u2014 0", opsCol: "slate", conf: "High", plan: "OFT Tempo Prep", date: "28 Jul" },
                        { code: "M. Hayes", details: "SrA · Alpha", dr: "Cycle 4", drCol: "badge-teal", ops: "74 \u25b2 1", opsCol: "green", conf: "High", plan: "Cycle 4 Perf.", date: "28 Jul" },
                        { code: "D. Okafor", details: "SSgt · Charlie", dr: "L3 · hip", drCol: "orange", ops: "58 \u25bc 5", opsCol: "red", conf: "Medium", plan: "Hip Recond.", date: "25 Jul" },
                        { code: "R. Singh", details: "SrA · Bravo", dr: "Profile · exempt", drCol: "badge-slate", ops: "70 \u2014 1", opsCol: "slate", conf: "Medium", plan: "Mobility Reset", date: "24 Jul" },
                        { code: "S. Bauer", details: "A1C · Alpha", dr: "Sleep · 3 nights", drCol: "badge-orange", ops: "64 \u25bc 2", opsCol: "red", conf: "Medium", plan: "Sleep Reset", date: "27 Jul" },
                        { code: "L. Soto", details: "SSgt · Charlie", dr: "L2 · shoulder", drCol: "orange", ops: "69 \u25b2 3", opsCol: "green", conf: "High", plan: "Upper Recond.", date: "26 Jul" }
                      ].filter((row) => matchesQueuePill(peopleQueueFilter, row)).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 transition">
                          <td className="py-3">
                            <span className="font-bold text-slate-800 dark:text-white block">{row.code}</span>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{row.details}</span>
                          </td>
                          <td className="py-3">
                            {row.drCol === "red" && <span className="font-bold text-rose-500">{row.dr}</span>}
                            {row.drCol === "orange" && <span className="font-bold text-amber-500">{row.dr}</span>}
                            {row.drCol.startsWith("badge-") && (
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                row.drCol === "badge-teal" ? "bg-cyan-500/10 text-cyan-600" :
                                row.drCol === "badge-orange" ? "bg-amber-500/10 text-amber-600" : "bg-slate-100 text-slate-500"
                              }`}>
                                {row.dr}
                              </span>
                            )}
                          </td>
                          <td className={`py-3 text-right font-mono font-bold ${
                            row.opsCol === "red" ? "text-rose-500" :
                            row.opsCol === "green" ? "text-emerald-500" : "text-slate-500"
                          }`}>{row.ops}</td>
                          <td className="py-3">
                            <span className="inline-flex items-center gap-1.5 font-bold">
                              <span className={`size-1.5 rounded-full ${
                                row.conf === "High" ? "bg-emerald-500" : "bg-amber-500"
                              }`}></span>
                              {row.conf}
                            </span>
                          </td>
                          <td className="py-3 text-slate-700 dark:text-slate-300">{row.plan}</td>
                          <td className="py-3 text-slate-500 font-mono">{row.date}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setReviewingAirmanId(row.code);
                                triggerToast(`Opening roster file context for ${row.code}`);
                              }}
                              className="px-3.5 py-1.5 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                  <span className="text-[10px] text-slate-500 font-mono">1&mdash;10 of 14</span>
                  <div className="flex items-center gap-1">
                    <button aria-label="Previous page" type="button" className="p-1 px-2 border border-slate-200 dark:border-white/5 text-[10px] text-slate-400 rounded hover:bg-slate-50">&lt;</button>
                    <button aria-label="Page 1" aria-current="page" type="button" className="p-1 px-2 border border-slate-200 dark:border-white/10 text-[10px] text-[var(--brand-color)] font-bold rounded bg-[var(--brand-color)]/10">1</button>
                    <button aria-label="Page 2" type="button" className="p-1 px-2 border border-slate-200 dark:border-white/5 text-[10px] text-slate-500 rounded hover:bg-slate-50">2</button>
                    <button aria-label="Next page" type="button" className="p-1 px-2 border border-slate-200 dark:border-white/5 text-[10px] text-slate-500 rounded hover:bg-slate-50">&gt;</button>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="pt-2 flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>14 flagged of 112 assigned &middot; k=1 drill-in is audit logged</span>
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    + New plan
                  </button>
                </div>
              </div>

              {/* 6 Plan Template Cards Grid */}
              {plansView === "Templates" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-left font-sans">
                {[
                  { title: "4-week reconditioning", badge: `Reconditioning · ${PLAN_STATUSES.ACTIVE}`, star: true, desc: "Lower back, post-OFT mobility focus · 12 sessions", details: "BLOCK 1 - WEEKS 1-2: Daily mobility reset - 12 min · Sub-60% 1RM deadlift x 3 · Mobility 3 x 4 sets · Loaded carry progression. BLOCK 2 - WEEKS 3-4: Tempo runs x 4 · Box squat progression · Mobility work - 8 min.", cad: "3x/wk · 45 min", win: "28 days · 3 blocks", owner: "SCS + PT/IM · Sign-off: Capt Shah" },
                  { title: "Cycle 4 performance", badge: "Performance · Active", star: false, desc: "Strength + endurance · 16 sessions", details: "3+5 back squat progression · 4x8 bench press · Tempo intervals: 4x 5 min · Mobility cooldown: 8 min.", cad: "4x/wk · 60 min", win: "28 days · 4 blocks", owner: "SCS · Plan design" },
                  { title: "Sleep reset - 7 day", badge: "Recovery · Draft", star: false, desc: "Anchor sleep + evening cell phone cutoff", details: "Lights-out anchor - 22:30 · Caffeine cutoff - 14:00 · Dim-evening - 21:00 · Morning light - 10 min.", cad: "Daily · ~10 min", win: "7 days · 1 block", owner: "SCS · Self-reported" },
                  { title: "Mobility reset - 12 min", badge: "Mobility · Active", star: false, desc: "Hip, T-spine, ankle · daily routine", details: "90/90 hip - 4 min · T-spine rotations - 3 min · Calf stretches - 35 s/side · Ankle/dorsi - 90 s/side.", cad: "Daily · 12 min", win: "14 days · Daily", owner: "SCS · Self-reported" },
                  { title: "OFT tempo prep", badge: "OFT prep · Active", star: false, desc: "High-intensity prep · 8 sessions", details: "400m repeats: 6x · Performance pace x 6 · Box jump complex · Sled push: 4x 30m.", cad: "2x/wk · 75 min", win: "28 days · Lane signoff", owner: "SCS + OFT lead · Lane signoff" },
                  { title: "PT/IM handoff packet", badge: "Handoff · Draft", star: false, desc: "Scoped medical record for PT/IM and IDMT recipients", details: "OFT clearance + reviews · Clearance status · Open session compliance · Coordination notes.", cad: "Per visit · Scoped", win: "14 days · IDMT share", owner: "SCS + PT/IM · IDMT share" }
                ].map((tpl, i) => (
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
                          // Pre-fill the assign-plan form with the template's title and open the assign modal
                          setAssignPlan(tpl.title);
                          setShowAssignPlanModal(true);
                          triggerToast(`Selected plan template: ${tpl.title}`);
                        }}
                        className="py-1.5 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                      >
                        Use template
                      </button>
                      <button
                        onClick={() => setViewingTemplate(tpl)}
                        className="py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-50 text-[10px] font-bold rounded-lg text-slate-700 dark:text-slate-300 transition"
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
                      {[
                        { status: PLAN_STATUSES.PENDING_REVIEW, plan: "Rehab Block 2 · Lower back focus", air: "J. Reyes", airUnit: "SrA · Alpha", win: "22 Jul - 8 Aug", owner: "SCS + PT/IM", comp: "71%", col: "orange", sign: "Capt Shah", signBold: true },
                        { status: PLAN_STATUSES.ACTIVE, plan: "Cycle 4 Performance · Strength", air: "T. Cho", airUnit: "SSgt · Alpha", win: "14 Jul - 10 Aug", owner: "SCS", comp: "88%", col: "green", sign: "SCS lead" },
                        { status: PLAN_STATUSES.DRAFT, plan: "Sleep Reset · Sleep focus", air: "D. Mendez", airUnit: "SSgt · Alpha", win: "30 Jul - 6 Aug", owner: "SCS", comp: "0%", col: "slate", sign: "\u2014" },
                        { status: PLAN_STATUSES.PENDING_REVIEW, plan: "Reconditioning · Chest/T-block", air: "B. Ndiaye", airUnit: "A1C · Bravo", win: "1 Aug - 22 Aug", owner: "SCS + PT/IM", comp: "\u2014", col: "orange", sign: "PT/IM lead" },
                        { status: PLAN_STATUSES.ACTIVE, plan: "OFT Tempo Prep · High intensity", air: "K. Patel", airUnit: "A1C · Charlie", win: "20 Jul - 12 Aug", owner: "SCS + OFT", comp: "52%", col: "green", sign: "OFT Lead" }
                      ].filter((row) => matchesAssignmentPill(assignmentsFilter, row)).map((row, idx) => (
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
                              className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
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
                        className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
                      >
                        Save draft
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl font-bold transition cursor-pointer"
                      >
                        Push to airman
                      </button>
                    </div>
                  </form>
                </div>

                {/* Queue */}
                <div className="lg:col-span-4 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Assignment queue</h3>
                    <p className="text-[9px] text-slate-500">Awaiting PT/IM sign-off &middot; 2</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: "B. Ndiaye", status: PLAN_STATUSES.PENDING_REVIEW, details: "Reconditioning · 1 Aug - 22 Aug · SCS + Plan" },
                      { name: "D. Okafor", status: PLAN_STATUSES.PENDING_REVIEW, details: "Hip reconditioning · 30 Jul - 27 Aug · SCS + PT/IM" }
                    ].map((queItem, idx) => (
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
                          className="w-full text-center py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-50 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-lg transition"
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
                  <div key={i} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider font-sans">{card.name}</span>
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

              {/* Workload by Flight */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Workload by flight</h3>
                    <p className="text-[10px] text-slate-500">PT sessions, OFT lanes, reconditioning count &middot; week of 27 Jul</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold rounded uppercase">
                    k&ge;5
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3">Flight</th>
                        <th className="pb-3 text-right">Airmen</th>
                        <th className="pb-3 text-right">PT / Wk</th>
                        <th className="pb-3 text-right">OFT Lanes</th>
                        <th className="pb-3 text-right">Rehab</th>
                        <th className="pb-3 text-right">Reconditioning</th>
                        <th className="pb-3 text-right">Capacity</th>
                        <th className="pb-3 w-1/4 text-right">Load</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {[
                        { fl: "Alpha", air: "38", pt: "10", oft: "2/3", rehab: "3", cond: "2", cap: "12", pct: "80%", col: "bg-emerald-500" },
                        { fl: "Bravo", air: "42", pt: "11", oft: "2/3", rehab: "2", cond: "2", cap: "12", pct: "75%", col: "bg-amber-500" },
                        { fl: "Charlie", air: "32", pt: "7", oft: "1/1", rehab: "1", cond: "1", cap: "8", pct: "60%", col: "bg-emerald-500" },
                        { fl: "Total", air: "112", pt: "28", oft: "5/7", rehab: "6", cond: "5", cap: "32", pct: "70%", col: "bg-[var(--brand-color)]", bold: true }
                      ].map((row, idx) => (
                        <tr key={idx} className={`hover:bg-slate-50/20 transition ${row.bold ? "font-bold text-slate-800 dark:text-white" : ""}`}>
                          <td className="py-3 font-bold">{row.fl}</td>
                          <td className="py-3 text-right font-mono text-slate-500">{row.air}</td>
                          <td className="py-3 text-right font-mono text-slate-500">{row.pt}</td>
                          <td className="py-3 text-right font-mono text-slate-500">{row.oft}</td>
                          <td className="py-3 text-right font-mono text-slate-500">{row.rehab}</td>
                          <td className="py-3 text-right font-mono text-slate-500">{row.cond}</td>
                          <td className="py-3 text-right font-mono text-slate-500">{row.cap}</td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2 font-mono text-[10px]">
                              <span>{row.pct}</span>
                              <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
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

              {/* SCS Availability Matrix */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">SCS availability &middot; this week</h3>
                    <p className="text-[10px] text-slate-500">Capacity 0-5 &middot; higher = busier</p>
                  </div>
                  <div className="flex gap-2 text-[9px] font-bold text-slate-500 items-center select-none font-mono">
                    <span className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">0</span>
                    <span className="px-1 py-0.2 bg-emerald-100 text-emerald-700 rounded">1</span>
                    <span className="px-1 py-0.2 bg-cyan-100 text-cyan-700 rounded">2</span>
                    <span className="px-1 py-0.2 bg-amber-100 text-amber-700 rounded">3</span>
                    <span className="px-1 py-0.2 bg-orange-100 text-orange-700 rounded">4</span>
                    <span className="px-1 py-0.2 bg-rose-100 text-rose-700 rounded">5</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 w-1/4">SCS</th>
                        <th className="pb-3 text-center">Mon 27</th>
                        <th className="pb-3 text-center">Tue 28</th>
                        <th className="pb-3 text-center">Wed 29</th>
                        <th className="pb-3 text-center">Thu 30</th>
                        <th className="pb-3 text-center">Fri 31</th>
                        <th className="pb-3 text-center">Sat 1</th>
                        <th className="pb-3 text-center">Sun 2</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-center font-mono">
                      {[
                        { scs: "TSgt Lee", title: "Senior SCS", mon: 4, tue: 4, wed: 2, thu: 3, fri: 3, sat: 1, sun: 0 },
                        { scs: "SSgt Park", title: "SCS - Bravo", mon: 3, tue: 3, wed: 5, thu: 3, fri: 3, sat: 2, sun: 0 },
                        { scs: "SrA Diaz", title: "SCS - assist", mon: 2, tue: 2, wed: 1, thu: 2, fri: 2, sat: 2, sun: 0 },
                        { scs: "Capt Shah", title: "PT/IM", mon: 3, tue: 4, wed: 3, thu: 3, fri: 2, sat: 0, sun: 0 },
                        { scs: "CPT Lead", title: "OFT - tempo", mon: 2, tue: 3, wed: 3, thu: 2, fri: 2, sat: 4, sun: 0 }
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 transition">
                          <td className="py-3 text-left font-bold font-sans">
                            <span className="text-slate-800 dark:text-white block leading-tight">{row.scs}</span>
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">{row.title}</span>
                          </td>
                          {[row.mon, row.tue, row.wed, row.thu, row.fri, row.sat, row.sun].map((val, i) => {
                            const bg = 
                              val === 5 ? "bg-rose-500/15 text-rose-500 border border-rose-500/25" :
                              val === 4 ? "bg-orange-500/15 text-orange-500 border border-orange-500/25" :
                              val === 3 ? "bg-amber-500/15 text-amber-500 border border-amber-500/25" :
                              val === 2 ? "bg-cyan-500/15 text-cyan-500 border border-cyan-500/25" :
                              val === 1 ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/25" :
                              "bg-slate-100 dark:bg-slate-800 text-slate-400";
                            return (
                              <td key={i} className="py-3 text-center">
                                <span className={`inline-block size-6 rounded-md font-bold text-xs flex items-center justify-center mx-auto ${bg}`}>
                                  {val}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[9px] text-slate-500 font-mono text-left pt-2 border-t border-slate-100 dark:border-white/5">
                  Peak Wednesday - SSgt Park at 5/5. Recommend splitting Wed OFT prep between two leads.
                </p>
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
                
                {/* Leave Overlap */}
                <div className="lg:col-span-8 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Leave overlap - next 30 days</h3>
                    <p className="text-[9px] text-slate-500">SCS, PT/IM, OFT staff</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl space-y-1">
                      <span className="font-extrabold text-slate-800 dark:text-white block">TSgt Lee</span>
                      <span className="text-[10px] text-slate-500 block font-mono">No leave</span>
                    </div>
                    
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-1 text-center">
                      <span className="font-extrabold text-amber-600 block">SSgt Park</span>
                      <span className="text-[10px] text-amber-500 block font-mono">27 Jul - 29 Jul · 3 days</span>
                      <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-500 text-[8px] font-bold rounded uppercase">
                        overlap Med
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl space-y-1">
                      <span className="font-extrabold text-slate-800 dark:text-white block">SrA Diaz</span>
                      <span className="text-[10px] text-slate-500 block font-mono">No leave</span>
                    </div>
                  </div>
                </div>

                {/* Hours Coverage stats */}
                <div className="lg:col-span-4 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <div className="text-left">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">SCS hours coverage</h3>
                      <p className="text-[9px] text-slate-500 leading-none mt-0.5">Scheduled + worked</p>
                    </div>
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
                <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">RSD coverage (separate)</h3>
                      <p className="text-[9px] text-slate-500">Restricted-status duty sessions tracked separately</p>
                    </div>
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    + New message
                  </button>
                </div>
              </div>

              {/* Chat View splits grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left font-sans text-xs">
                
                {/* Left Side: Inbox search list */}
                <div className="lg:col-span-4 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Inbox</h3>
                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-600 text-[8.5px] font-bold rounded-full uppercase tracking-wider font-mono">
                      7 unread
                    </span>
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <input
                      type="text"
                      aria-label="Search messages"
                      placeholder="Search messages"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-[var(--brand-color)] text-slate-800 dark:text-white placeholder-slate-400"
                    />
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  </div>

                  {/* Chats list */}
                  <div className="space-y-2">
                    {[
                      { name: "J. Reyes", role: "SrA · Alpha flight", preview: "Ready for mobility \u2014 good to move to bloc...", time: "06:18", unread: 2 },
                      { name: "A. Mendez", role: "SSgt · Bravo flight", preview: "Sleep timing past 3 nights", time: "Yest", unread: 1 },
                      { name: "T. Cho", role: "A1C · Alpha flight", preview: "OFT cleared \u2014 thanks TSgt", time: "Yest", unread: 1 },
                      { name: "D. Okafor", role: "SSgt · Alpha flight", preview: "Hip \u2014 still tight after rehab", time: "23 Jul", unread: 3 },
                      { name: "B. Ndiaye", role: "A1C · Charlie flight", preview: "Mobility reset \u2014 what level?", time: "25 Jul" },
                      { name: "K. Patel", role: "A1C · Bravo flight", preview: "OFT tempo prep · week 2", time: "24 Jul" },
                      { name: "M. Hayes", role: "SrA · Alpha flight", preview: "Cycle 4 \u2014 red-line felt good", time: "20 Jul" },
                      { name: "Capt Shah · PT/IM", role: "Clinician co-owner", preview: "Coordination checklist response", time: "19 Jul" }
                    ].map((chat, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedChatId(chat.name);
                          triggerToast(`Switched thread: ${chat.name}`);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                          selectedChatId === chat.name 
                            ? "bg-[var(--brand-color)]/10 border-[var(--brand-color)]/30 text-[var(--brand-color)]" 
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[9px] gap-2">
                          <span className="font-bold text-slate-800 dark:text-white font-sans text-xs">{chat.name}</span>
                          <span className="text-slate-500">{chat.time}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block leading-tight mt-0.5 font-sans font-medium">{chat.role}</span>
                        <div className="flex items-center justify-between gap-4 mt-2">
                          <p className="text-[10px] text-slate-500 truncate w-48 font-sans">{chat.preview}</p>
                          {chat.unread && (
                            <span className="size-4 bg-[var(--brand-color)] text-white text-[8px] font-bold rounded-full flex items-center justify-center font-mono">
                              {chat.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Right Side: Active Chat dialog thread */}
                <div className="lg:col-span-8 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm flex flex-col justify-between h-[650px] overflow-hidden">
                  
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-[#f8fafc] dark:bg-slate-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-cyan-500/10 text-[var(--brand-color)] font-bold text-xs flex items-center justify-center select-none font-mono">
                        {selectedChatId.charAt(0)}
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-slate-800 dark:text-white block text-sm">{selectedChatId}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {selectedChatId === "J. Reyes" ? "SrA · Alpha flight · Rehab Block 2" : "Active chat recipient"}
                        </span>
                      </div>
                    </div>

                    {selectedChatId === "J. Reyes" && (
                      <button 
                        onClick={() => { setReviewingAirmanId("J. Reyes"); triggerToast("Opening full profile for J. Reyes"); }}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-50 text-[10px] font-bold rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      >
                        View profile
                      </button>
                    )}
                  </div>

                  {/* Chat bubbles list */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 dark:bg-[#0e1628]">
                    
                    {/* Timestamp separator */}
                    <div className="text-center font-mono text-[9px] text-slate-400 select-none uppercase tracking-wider">
                      27 July
                    </div>

                    {(chatThreads[selectedChatId] || []).map((msg, i) => (
                      <div key={i} className={`flex ${msg.sender === "scs" ? "justify-end" : "justify-start"}`}>
                        <div className={`p-4 rounded-2xl max-w-sm text-xs leading-relaxed space-y-1.5 ${
                          msg.sender === "scs" 
                            ? "bg-[#008094] text-white rounded-tr-none text-left" 
                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 rounded-tl-none text-left"
                        }`}>
                          <p className="font-sans font-medium">{msg.text}</p>
                          <span className={`text-[8px] font-mono block text-right leading-none ${
                            msg.sender === "scs" ? "text-cyan-200" : "text-slate-400"
                          }`}>{msg.time}</span>
                        </div>
                      </div>
                    ))}

                  </div>

                  {/* Message Input Box */}
                  <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-[#f8fafc] dark:bg-slate-900/60 space-y-3">
                    
                    <div className="text-center text-[9px] text-slate-400 font-mono select-none">
                      Messages in this thread are audit-logged
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        aria-label={`Message ${selectedChatId}`}
                        placeholder={`Message ${selectedChatId}`}
                        value={typedMessage}
                        onChange={(e) => setTypedMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-[var(--brand-color)] text-slate-800 dark:text-white placeholder-slate-400"
                      />
                      <button 
                        onClick={handleSendMessage}
                        className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Send
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

        </main>
      </div>

      {viewingSummary && (
        <RecordDetailDialog
          open={viewingSummary}
          onClose={() => setViewingSummary(false)}
          title="Authorized Performance Summary"
          subtitle="PT/IM approved · versioned · minimum-necessary · time-limited · named audiences"
          fields={[
            { label: "Airman", value: "J. Reyes" },
            { label: "Access level", value: "Summary: Authorized access" },
            { label: "Raw record", value: PRIVACY_STATES.RESTRICTED },
            { label: "Confidence", value: "High (11 of last 14 days)" },
            { label: "PT/IM visits (30d)", value: "2" },
            { label: "Reconditioning", value: "Rehab Block 2 · ends 8 Aug" },
            { label: "Functional limitation", value: "Lower-back, load-bearing (PT/IM-owned)" },
          ]}
        />
      )}

      {viewingAuditLog && (
        <RecordDetailDialog
          open={viewingAuditLog}
          onClose={() => setViewingAuditLog(false)}
          title="Compliance audit log"
          subtitle="SCS access to Authorized Performance Summary records"
          fields={[]}
        >
          <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden font-mono text-[10px]">
            {[
              { who: "Capt Shah (SCS)", action: "Viewed Authorized Performance Summary — J. Reyes", when: "Today · 09:14" },
              { who: "Capt Shah (SCS)", action: "Assigned Rehab Block 2", when: "22 Jul · 14:02" },
              { who: "SCS lead", action: "Viewed Authorized Performance Summary — T. Cho", when: "21 Jul · 11:30" },
              { who: "PT/IM (auto)", action: "Approved summary refresh — J. Reyes", when: "20 Jul · 07:45" },
            ].map((entry, idx) => (
              <div key={idx} className="px-3 py-2 flex items-center justify-between gap-3">
                <span className="text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-white">{entry.who}</span> — {entry.action}
                </span>
                <span className="text-slate-400 flex-shrink-0">{entry.when}</span>
              </div>
            ))}
          </div>
        </RecordDetailDialog>
      )}

      {viewingAllWorkouts && (
        <RecordDetailDialog
          open={viewingAllWorkouts}
          onClose={() => setViewingAllWorkouts(false)}
          title="All workouts"
          subtitle="J. Reyes · trailing log"
          fields={[]}
        >
          <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden">
            {WORKOUT_LOG.map((w, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2.5 text-left">
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-slate-800 dark:text-white truncate">{w.type}</span>
                  <span className="block text-[10px] text-slate-500 truncate">{w.date} · {w.plan} · {w.dur}</span>
                </span>
                <span className={`flex-shrink-0 text-[9px] font-bold uppercase ${
                  w.col === "green" ? "text-emerald-500" : w.col === "orange" ? "text-amber-500" : "text-sky-500"
                }`}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </RecordDetailDialog>
      )}

      {viewingPlanRefs && (
        <RecordDetailDialog
          open={viewingPlanRefs}
          onClose={() => setViewingPlanRefs(false)}
          title="Plan references"
          subtitle="Reconditioning & performance planning guidelines"
          fields={[
            { label: "RTP", value: "SCS + PT/IM coordinate reconditioning, training load, and progression" },
            { label: "RTD", value: "Requires source-authority + decision date + verification + reevaluation" },
            { label: "SCS scope", value: "Does not edit restriction profiles or clinical clearings" },
          ]}
        />
      )}

      {viewingTemplate && (
        <RecordDetailDialog
          open={!!viewingTemplate}
          onClose={() => setViewingTemplate(null)}
          title={viewingTemplate.title}
          subtitle={viewingTemplate.desc}
          badge={
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-bold rounded-full uppercase tracking-wider inline-block">
              {viewingTemplate.badge}
            </span>
          }
          fields={[
            { label: "Cadence", value: viewingTemplate.cad },
            { label: "Window", value: viewingTemplate.win },
            { label: "Owner", value: viewingTemplate.owner },
          ]}
          actions={
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
                  setAssignPlan(viewingTemplate.title);
                  setShowAssignPlanModal(true);
                  triggerToast(`Selected plan template: ${viewingTemplate.title}`);
                  setViewingTemplate(null);
                }}
                type="button"
                className="flex-1 py-2 px-4 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Use template
              </button>
            </>
          }
        >
          <p className="text-[10px] text-slate-500 font-mono leading-normal">{viewingTemplate.details}</p>
        </RecordDetailDialog>
      )}

      {viewingAssignment && (
        <RecordDetailDialog
          open={!!viewingAssignment}
          onClose={() => setViewingAssignment(null)}
          title={viewingAssignment.plan}
          subtitle={`${viewingAssignment.air} · ${viewingAssignment.airUnit}`}
          fields={[
            { label: "Status", value: viewingAssignment.status },
            { label: "Window", value: viewingAssignment.win },
            { label: "Owner", value: viewingAssignment.owner },
            { label: "Compliance", value: viewingAssignment.comp },
            { label: "Sign-off", value: viewingAssignment.sign },
          ]}
          actions={
            <>
              <button
                onClick={() => setViewingAssignment(null)}
                type="button"
                className="flex-1 py-2 px-4 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  triggerToast(`Assignment updated for ${viewingAssignment.air}`);
                  setViewingAssignment(null);
                }}
                type="button"
                className="flex-1 py-2 px-4 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Save changes
              </button>
            </>
          }
        />
      )}

      {viewingQueueItem && (
        <RecordDetailDialog
          open={!!viewingQueueItem}
          onClose={() => setViewingQueueItem(null)}
          title={viewingQueueItem.name}
          subtitle={viewingQueueItem.details}
          fields={[{ label: "Status", value: viewingQueueItem.status }]}
          actions={
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
                  // Save changes: record edit and mutate the matched assignedPlans row
                  const matched = assignedPlans.find((p) => p.air === viewingQueueItem.name);
                  const editEntry: QueueItemEdit = {
                    id: `qe-${Date.now()}`,
                    queueItemId: matched?.id ?? `qi-${viewingQueueItem.name}`,
                    airman: viewingQueueItem.name,
                    fields: { status: viewingQueueItem.status, notes: viewingQueueItem.details },
                    editedAt: new Date().toISOString(),
                  };
                  setQueueItemEdits((prev) => [editEntry, ...prev]);
                  if (matched) {
                    setAssignedPlans((prev) =>
                      prev.map((p) =>
                        p.id === matched.id ? { ...p, plan: viewingQueueItem.details } : p
                      )
                    );
                  }
                  triggerToast("Changes saved");
                  setViewingQueueItem(null);
                }}
                type="button"
                className="flex-1 py-2 px-4 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Save changes
              </button>
              <button
                onClick={() => {
                  // Update or insert the assignedPlans row with PENDING_REVIEW
                  const matched = assignedPlans.find((p) => p.air === viewingQueueItem.name);
                  if (matched) {
                    setAssignedPlans((prev) =>
                      prev.map((p) =>
                        p.id === matched.id ? { ...p, status: PLAN_STATUSES.PENDING_REVIEW } : p
                      )
                    );
                  } else {
                    const newAssignment: AssignedPlanRow = {
                      id: `ap-qi-${Date.now()}`,
                      status: PLAN_STATUSES.PENDING_REVIEW,
                      plan: viewingQueueItem.details,
                      air: viewingQueueItem.name,
                      airUnit: "",
                      win: "TBD",
                      owner: "SCS + PT/IM",
                      comp: "0%",
                      col: "orange",
                      sign: "PT/IM",
                      signBold: false,
                    };
                    setAssignedPlans((prev) => [newAssignment, ...prev]);
                  }
                  // Push sent-for-sign-off audit
                  const sentEntry: SentForSignOff = {
                    id: `so-${Date.now()}`,
                    airman: viewingQueueItem.name,
                    sentAt: new Date().toISOString(),
                    by: "SCS",
                  };
                  setSentForSignOff((prev) => [sentEntry, ...prev]);
                  triggerToast(`Sign-off request sent for ${viewingQueueItem.name}`);
                  setViewingQueueItem(null);
                }}
                type="button"
                className="flex-1 py-2 px-4 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Send to PT/IM
              </button>
            </>
          }
        />
      )}

      {/* TOAST */}
      {showConfirmToast && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-slide-up border border-slate-800 dark:border-white/5 font-sans">
          <CheckCircle className="size-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Create-record modals (Phase 4 wiring) */}
      <CreateRecordModal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title="Add performance plan"
        subtitle="Add a new recommendation to J. Reyes' plan stack."
        submitLabel="Add plan"
        fields={[
          { name: "title", label: "Plan title", type: "text", required: true },
          {
            name: "discipline",
            label: "Discipline",
            type: "select",
            required: true,
            defaultValue: "Strength",
            options: ["Strength", "Mobility", "Endurance", "Reconditioning"],
          },
          { name: "desc", label: "Description", type: "textarea", required: true },
          { name: "owner", label: "Owner", type: "text", placeholder: "e.g. PT" },
        ]}
        onSubmit={(values) => {
          const discipline = values.discipline || "Strength";
          const badge = `${discipline} - Active`;
          const cad = discipline === "Mobility" ? "Daily - 12 min" : discipline === "Endurance" ? "3x/wk - 45 min" : "3x/wk - 60 min";
          const win = "28 days - 3 blocks";
          setPerformancePlans((prev) => [
            { title: values.title, badge, desc: values.desc, details: values.desc, cad, win, owner: values.owner || "SCS" },
            ...prev,
          ]);
          triggerToast(`Created: ${values.title}`);
          setShowPlanModal(false);
        }}
      />

      <CreateRecordModal
        open={showPerfNoteModal}
        onClose={() => setShowPerfNoteModal(false)}
        title="Add performance note"
        subtitle="Log a quick observation against J. Reyes' active plan."
        submitLabel="Add note"
        fields={[
          { name: "date", label: "Date", type: "date", required: true },
          { name: "author", label: "Author", type: "text", placeholder: "e.g. SCS Reeves", required: true },
          { name: "text", label: "Note", type: "textarea", required: true },
        ]}
        onSubmit={(values) => {
          const entry: PerformanceNote = {
            id: `pn-${Date.now()}`,
            date: values.date,
            text: values.text,
            author: values.author,
          };
          setPerformanceNotes((prev) => [entry, ...prev]);
          triggerToast(`Created: note by ${values.author}`);
          setShowPerfNoteModal(false);
        }}
      />

      <CreateRecordModal
        open={showAssignPlanModal}
        onClose={() => setShowAssignPlanModal(false)}
        title="Assign new plan"
        subtitle="Push a template to a single airman - routed through PT/IM sign-off."
        submitLabel="Assign plan"
        fields={[
          { name: "plan", label: "Plan title", type: "text", required: true },
          { name: "air", label: "Airman code", type: "text", placeholder: "e.g. A-1042", required: true },
          { name: "airUnit", label: "Airman unit", type: "text", placeholder: "e.g. 4th FLT" },
          { name: "owner", label: "Owner", type: "text", placeholder: "e.g. SCS" },
        ]}
        onSubmit={(values) => {
          const entry: AssignedPlanRow = {
            id: `ap-${Date.now()}`,
            status: "Pending Review",
            plan: values.plan,
            air: values.air,
            airUnit: values.airUnit || "",
            win: "TBD",
            owner: values.owner || "SCS",
            comp: "0%",
            col: "slate",
            sign: "-",
            signBold: false,
          };
          setAssignedPlans((prev) => [entry, ...prev]);
          triggerToast(`Created: ${values.plan}`);
          setShowAssignPlanModal(false);
        }}
      />

      <CreateRecordModal
        open={showRecondPlanModal}
        onClose={() => setShowRecondPlanModal(false)}
        title="Create reconditioning plan"
        subtitle="Draft a new template and add it to the Templates gallery."
        submitLabel="Create plan"
        fields={[
          { name: "title", label: "Plan title", type: "text", required: true },
          {
            name: "cad",
            label: "Cadence",
            type: "select",
            required: true,
            defaultValue: "Weekly",
            options: ["Daily", "Weekly", "Bi-weekly", "Ad-hoc"],
          },
          { name: "desc", label: "Description", type: "textarea", required: true },
          { name: "owner", label: "Owner", type: "text", placeholder: "e.g. SCS" },
        ]}
        onSubmit={(values) => {
          const cadMap: Record<string, string> = {
            Daily: "Daily - 30 min",
            Weekly: "3x/wk - 45 min",
            "Bi-weekly": "Every 2 weeks - 60 min",
            "Ad-hoc": "As needed - 30 min",
          };
          const entry: ReconditioningPlan = {
            id: `rp-${Date.now()}`,
            title: values.title,
            badge: "Reconditioning - Draft",
            desc: values.desc,
            cad: cadMap[values.cad] || values.cad,
            win: "28 days - 3 blocks",
            owner: values.owner || "SCS",
          };
          setReconditioningPlans((prev) => [entry, ...prev]);
          triggerToast(`Created: ${values.title}`);
          setShowRecondPlanModal(false);
        }}
      />

      <CreateRecordModal
        open={showNewDmModal}
        onClose={() => setShowNewDmModal(false)}
        title="New direct message"
        subtitle="Open a thread with a new recipient - audit-logged on send."
        submitLabel="Start thread"
        fields={[
          { name: "name", label: "Recipient name", type: "text", placeholder: "e.g. Capt Reyes", required: true },
          { name: "code", label: "Recipient code", type: "text", placeholder: "e.g. A-1042" },
          { name: "text", label: "First message", type: "textarea", required: true },
        ]}
        onSubmit={(values) => {
          const initials = values.name
            .split(/\s+/)
            .map((p) => p[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase() || "?";
          const entry: DmThread = {
            initials,
            name: values.name,
            time: "Just now",
            txt: values.text,
            unread: false,
            active: true,
          };
          setDmThreads((prev) => [entry, ...prev]);
          setSelectedChatId(values.name);
          triggerToast(`Created: ${values.name}`);
          setShowNewDmModal(false);
        }}
      />

    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { useCurrentUser } from "@/hooks/use-current-user";
import { POPULATION_LEVELS, PRIVACY_STATES, PERSON_TERM } from "@/lib/terminology";
import { PopulationScopeBadge } from "@/components/privacy/population-scope-badge";
import { IconButton } from "@/components/ui/icon-button";
import { RecordDetailDialog } from "@/components/ui/record-detail-dialog";
import { CreateRecordModal } from "@/components/ui/create-record-modal";
import { AscendLogo } from "@/components/ascend-logo";
import {
  ChevronDown,
  Bell,
  Sun,
  Moon,
  ArrowLeft,
  LogOut,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Plus,
  Search,
  Lock,
  MessageSquare,
  TrendingUp,
  FileText,
} from "lucide-react";

type TabType = "dashboard" | "consults" | "records" | "messages";

type ConsultRecord = {
  initials: string;
  name: string;
  reason: string;
  time: string;
  status: string;
  col: string;
  out: string;
};

const RECENT_CONSULTS: ConsultRecord[] = [
  { initials: "AM", name: "A. Mendez", reason: "Sleep nutrition", time: "13:30", status: "Completed", col: "green", out: "Notes" },
  { initials: "JR", name: "J. Reyes", reason: "Protein target", time: "12:20", status: "In Progress", col: "orange", out: "Open" },
  { initials: "TC", name: "T. Cho", reason: "Carb checkup", time: "09:30", status: "Completed", col: "green", out: "Notes" },
  { initials: "KN", name: "K. Ndoye", reason: "Weight mgmt", time: "12:30", status: "Scheduled", col: "teal", out: "Prep" },
  { initials: "RP", name: "R. Patel", reason: "Recovery nutrition", time: "15:00", status: "Scheduled", col: "teal", out: "Prep" }
];

type FoodLogEntry = {
  time: string;
  entry: string;
  kcal: string;
  carb: string;
  prot: string;
  fat: string;
  flag: string;
  col: string;
};

const FOOD_LOG_TODAY: FoodLogEntry[] = [
  { time: "06:45", entry: "Breakfast: 2oz + banana + whey + black coffee", kcal: "520kcal", carb: "65 gc", prot: "32 gp", fat: "10 gf", flag: "OK", col: "green" },
  { time: "10:15", entry: "Snack: Apple + almonds (28g)", kcal: "240kcal", carb: "30 gc", prot: "6 gp", fat: "12 gf", flag: "OK", col: "green" },
  { time: "12:55", entry: "Lunch: MRE + sports drink + high sodium", kcal: "980kcal", carb: "140 gc", prot: "28 gp", fat: "22 gf", flag: "Sodium ++", col: "orange" },
  { time: "16:20", entry: "Pre-training: Rice + chicken + veg", kcal: "610kcal", carb: "75 gc", prot: "40 gp", fat: "10 gf", flag: "OK", col: "green" },
  { time: "19:30", entry: "Dinner: Pending entry", kcal: "—", carb: "—", prot: "—", fat: "—", flag: "Past", col: "gray" }
];

type ChecklistItem = {
  txt: string;
  sub?: string;
  sub2?: string;
  done: boolean;
  review?: boolean;
};

type QueueRecord = {
  initials: string;
  name: string;
  desc: string;
  reason: string;
  time: string;
  checklist: ChecklistItem[];
  status: string;
  statusCol: string;
  act: string;
  actCol: string;
};

const CONSULT_QUEUE: QueueRecord[] = [
  {
    initials: "SN",
    name: "S. Ndoye",
    desc: "New referral · Echo flight",
    reason: "Weight mgmt",
    time: "10:30",
    checklist: [
      { txt: "Pull 7-day food logs", sub: "ready", done: true },
      { txt: "Review intake form", sub: "submitted", sub2: "ready", done: true },
      { txt: "Flag baseline weight + BMI", sub: "PT/IM sync", sub2: "ready", done: true }
    ],
    status: "Ready · 3/3",
    statusCol: "orange",
    act: "Start →",
    actCol: "teal"
  },
  {
    initials: "AM",
    name: "A. Mendez",
    desc: "Sleep nutrition · Bravo",
    reason: "Recovery",
    time: "13:30",
    checklist: [
      { txt: "Caffeine taper log", sub: "day 3", sub2: "ready", done: true },
      { txt: "Sleep nutrition notes", sub: "prior consult", sub2: "ready", done: true },
      { txt: "Hydration adherence", sub: "67% - flag", sub2: "review", done: false, review: true }
    ],
    status: "In Progress · 2/3",
    statusCol: "orange",
    act: "Open",
    actCol: "white"
  },
  {
    initials: "JR",
    name: "J. Reyes",
    desc: "Rehab - protein target",
    reason: "Performance",
    time: "15:00",
    checklist: [
      { txt: "Protein adherence", sub: "1.6 g/kg target", sub2: "ready", done: true },
      { txt: "Recovery macro split", sub: "C/P/F", sub2: "review", done: false, review: true }
    ],
    status: "In Progress",
    statusCol: "teal",
    act: "Resume",
    actCol: "white"
  },
  {
    initials: "RP",
    name: "R. Patel",
    desc: "Recovery - post-op",
    reason: "Recovery",
    time: "16:00",
    checklist: [
      { txt: "Surgical Nutrition Action", sub: "v2 · 22 Jul", sub2: "ready", done: true },
      { txt: "Wound-healing macros", sub: "Vit C", sub2: "ready", done: true },
      { txt: "Confirm with PT/IM", sub: "load status", sub2: "ready", done: true }
    ],
    status: "Ready · 3/3",
    statusCol: "green",
    act: "Start →",
    actCol: "teal"
  },
  {
    initials: "TC",
    name: "T. Cho",
    desc: "Performance · Charlie",
    reason: "Hydration",
    time: "09:00 · 28 Jul",
    checklist: [
      { txt: "Ruck hydration database", sub: "3 events", sub2: "pending", done: false },
      { txt: "Carb tolerance review", sub: "GI symptoms", sub2: "pending", done: false }
    ],
    status: "Not started",
    statusCol: "slate",
    act: "Prep",
    actCol: "white"
  },
  {
    initials: "CH",
    name: "C. Hayes",
    desc: "New referral · Bravo",
    reason: "Macro adj.",
    time: "11:00 · 28 Jul",
    checklist: [
      { txt: "Dietitian intake form", sub: "received", sub2: "ready", done: true },
      { txt: "Body comp baseline", sub: "PT/IM sync", sub2: "ready", done: true }
    ],
    status: "Ready · 2/2",
    statusCol: "green",
    act: "Start →",
    actCol: "teal"
  },
  {
    initials: "MB",
    name: "M. Brooks",
    desc: "Performance · Foxtrot",
    reason: "Performance",
    time: "14:30 · 29 Jul",
    checklist: [
      { txt: "PRT Nutrition Action", sub: "carb load", sub2: "pending", done: false }
    ],
    status: "Not started",
    statusCol: "slate",
    act: "Prep",
    actCol: "white"
  },
  {
    initials: "DV",
    name: "D. Vega",
    desc: "Hydration · Alpha",
    reason: "Hydration",
    time: "10:00 · 30 Jul",
    checklist: [
      { txt: "Heat acclimation plan", sub: "flag", sub2: "ready", done: true }
    ],
    status: "Ready · 1/1",
    statusCol: "green",
    act: "Start →",
    actCol: "teal"
  }
];

type PatientRecord = {
  initials: string;
  name: string;
  desc: string;
  date: string;
  col: string;
  active: boolean;
};

const CASELOAD_PATIENTS: PatientRecord[] = [
  { initials: "JR", name: "J. Reyes", desc: "Rehab - protein target", date: "22 Jul", col: "bg-indigo-500", active: false },
  { initials: "AM", name: "A. Mendez", desc: "Sleep nutrition · Bravo", date: "26 Jul", col: "bg-[var(--brand-color)]", active: false },
  { initials: "TC", name: "T. Cho", desc: "Performance · Charlie", date: "15 Jul", col: "bg-indigo-500", active: false },
  { initials: "SN", name: "S. Ndoye", desc: "New referral · weight mgmt", date: "10:30 today", col: "bg-[var(--brand-color)]", active: true },
  { initials: "RP", name: "R. Patel", desc: "Recovery - post-op", date: "22 Jul", col: "bg-indigo-500", active: false },
  { initials: "CH", name: "C. Hayes", desc: "New referral · macro adj.", date: "—", col: "bg-emerald-500", active: false },
  { initials: "MB", name: "M. Brooks", desc: "Performance · Foxtrot", date: "19 Jul", col: "bg-indigo-500", active: false },
  { initials: "DV", name: "D. Vega", desc: "Hydration · Alpha", date: "20 Jul", col: "bg-[var(--brand-color)]", active: false }
];

type AssessmentNote = {
  title: string;
  meta: string;
  text: string;
  badge: string;
  badgeCol: string;
};

const NUTRITION_ASSESSMENTS: AssessmentNote[] = [
  {
    title: "Initial nutrition intake",
    meta: "22 Jul baseline · completed by Capt Patel",
    text: `${PERSON_TERM} reports 3-4 eating events per day with late-evening snacking. No supplement use. Goals: -15kg over 8 weeks, improve PRT run time, increase protein to 1.6 g/kg.`,
    badge: "Intake",
    badgeCol: "bg-[var(--brand-color)]/10 text-[var(--brand-color)]"
  },
  {
    title: "Consult note - 22 Jul",
    meta: "A. Mendez (Student) · follow-up scheduled 5 Aug",
    text: `Started balanced macro plan. Discussed hydration timing around PT blocks (pre/intra/post). ${PERSON_TERM} agreed to daily log syncs by 22:00.`,
    badge: "Scheduled",
    badgeCol: "bg-emerald-500/10 text-emerald-500"
  },
  {
    title: "Body comp baseline",
    meta: "22 Jul · k=8",
    text: "BF 22.4% (DXA). Lean mass: 71.4 kg. Waist: 84 cm. Within healthy range for height; weight mgmt goal appropriate.",
    badge: "Synced",
    badgeCol: "bg-[var(--brand-color)]/10 text-[var(--brand-color)]"
  },
  {
    title: "Open concern - late-night intake",
    meta: "Auto-flagged · 27 Jul 21:45 entry",
    text: "Pattern detected: 4 of last 7 evenings logged caloric intake after 21:30 (avg 550 kcal). Suggest behavioral plan and check-in at next consult.",
    badge: "Active",
    badgeCol: "bg-amber-500/10 text-amber-500"
  }
];

const ASSESSMENT_BADGE_COLORS: Record<string, string> = {
  Intake: "bg-[var(--brand-color)]/10 text-[var(--brand-color)]",
  Scheduled: "bg-emerald-500/10 text-emerald-500",
  Synced: "bg-[var(--brand-color)]/10 text-[var(--brand-color)]",
  Active: "bg-amber-500/10 text-amber-500"
};

type InboxThread = {
  initials: string;
  name: string;
  time: string;
  txt: string;
  unread: number;
  active: boolean;
};

const CASELOAD_INBOX: InboxThread[] = [
  { initials: "AM", name: "A. Mendez", time: "06:42", txt: "Caffeine taper, day 3 — slept 6h 12m", unread: 2, active: true },
  { initials: "TC", name: "T. Cho", time: "25 Jul", txt: "Carb top-up during last ruck — felt strong", unread: 1, active: false },
  { initials: "SN", name: "S. Ndiaye", time: "27 Jul", txt: "Quick question on the log app", unread: 0, active: false },
  { initials: "JR", name: "J. Reyes", time: "24 Jul", txt: "Protein at lunch — chicken bowl worked", unread: 0, active: false },
  { initials: "RP", name: "R. Patel", time: "22 Jul", txt: "Pre-ruck fuelling plan received", unread: 0, active: false }
];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function NutritionistDashboard() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const currentUser = useCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const { show: showConfirmToast, message: toastMessage, triggerToast } = useToast(3500);
  const [activeTabInternal, setActiveTabInternal] = useState<TabType>("dashboard");
  const [hasMounted, setHasMounted] = useState(false);

  const [viewingNutritionRecords, setViewingNutritionRecords] = useState(false);
  const [viewingActiveQueue, setViewingActiveQueue] = useState(false);
  const [viewingAllConsults, setViewingAllConsults] = useState(false);
  const [viewingConsultOutcome, setViewingConsultOutcome] = useState<ConsultRecord | null>(null);
  const [viewingFoodLogs, setViewingFoodLogs] = useState(false);
  const [viewingConsultRecord, setViewingConsultRecord] = useState<QueueRecord | null>(null);
  const [viewingAllRecords, setViewingAllRecords] = useState(false);
  const [viewingPatientRecord, setViewingPatientRecord] = useState<PatientRecord | null>(null);

  // Phase 6: Active consult session state
  const [activeConsultId, setActiveConsultId] = useState<string | null>(null);

  const [consultQueueFilter, setConsultQueueFilter] = useState("Today");
  const [consultQueue, setConsultQueue] = useState<QueueRecord[]>(CONSULT_QUEUE);
  const [creatingConsult, setCreatingConsult] = useState(false);
  const [consultDefaultName, setConsultDefaultName] = useState("");

  const [assessmentNotes, setAssessmentNotes] = useState<AssessmentNote[]>(NUTRITION_ASSESSMENTS);
  const [creatingNote, setCreatingNote] = useState(false);

  const [caseloadInbox, setCaseloadInbox] = useState<InboxThread[]>(CASELOAD_INBOX);
  const [creatingMessage, setCreatingMessage] = useState(false);

  const [nutritionChatMessage, setNutritionChatMessage] = useState("");
  const [nutritionMessagesList, setNutritionMessagesList] = useState([
    { sender: "coach", text: "Quick check-in \u2014 how's the caffeine taper going? Cap coffee at 12:00 today and log sleep tonight.", time: "17:14", date: "25 JULY" },
    { sender: "airman", text: "Cap held. One small cup at 11:30, no issues. Slept ok \u2014 about 6h.", time: "26 Jul · 06:50", date: "25 JULY" },
    { sender: "coach", text: "Hydration note: you're at 57% adherence, below the 70% target. Try 500 mL at each meal and sip every 30 min during the block.", time: "09:02", date: "27 JULY" },
    { sender: "airman", text: "Caffeine taper, day 3 \u2014 slept 6h 12m. Logged morning hydration.", time: "28 Jul · 06:42", date: "27 JULY" }
  ]);

  const handleSendNutritionMessage = () => {
    if (!nutritionChatMessage.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    setNutritionMessagesList([
      ...nutritionMessagesList,
      { sender: "coach", text: nutritionChatMessage, time: `${timeStr}`, date: "TODAY" }
    ]);
    setNutritionChatMessage("");
    setTimeout(() => {
      triggerToast("Nutrition message dispatched securely");
    }, 100);
  };

  const setActiveTab = (tab: TabType) => {
    setActiveTabInternal(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem("ascend_nutritionist_active_tab", tab);
    }
  };

  const activeTab = activeTabInternal;

  // Load persistent active tab on client mount
  useEffect(() => {
    const savedTab = localStorage.getItem("ascend_nutritionist_active_tab") as TabType | null;
    if (savedTab && ["dashboard", "consults", "records", "messages"].includes(savedTab)) {
      setActiveTabInternal(savedTab);
    }
  }, []);

  // Protect route & check mount
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Protect the route: if not authenticated, redirect to /
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
          {/* Brand logo wrapper */}
          <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[var(--brand-color)]"></span>
              <span className="text-sm font-black tracking-tight text-slate-800 dark:text-white uppercase font-sans">
                Nutritionist
              </span>
            </div>
          </div>

          {/* Navigation Title */}
          <div className="px-5 pt-6 pb-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase font-sans">
            {POPULATION_LEVELS.CASELOAD}
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "dashboard"
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <TrendingUp className="size-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("consults")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "consults"
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <Calendar className="size-4" />
              Consults
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "records"
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <FileText className="size-4" />
              Records
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "messages"
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <MessageSquare className="size-4" />
              Messages
            </button>
          </nav>
        </div>

        {/* User Session Controls */}
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
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50/20 dark:hover:bg-red-950/20 transition cursor-pointer"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* RIGHT WORKSPACE WRAPPER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* 1. TOP HEADER BAR */}
        <header className="flex h-14 w-full items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0e1628] px-6 md:px-8 flex-shrink-0 z-20">
          <div className="flex items-center gap-2">
            <AscendLogo width={20} height={20} showDetails={false} />
            <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">Ascend</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-light select-none">/</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Nutritionist Workspace</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-slate-200 dark:border-white/5 pr-6">
              <IconButton
                icon={Bell}
                aria-label="Notifications"
                className="relative p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                iconClassName="size-4.5"
              >
                <span className="absolute top-1 right-1 size-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0e1628]"></span>
              </IconButton>
              <IconButton
                icon={theme === "light" ? Moon : Sun}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                onClick={toggleTheme}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                iconClassName="size-4.5"
              />
            </div>

            {/* Profile context */}
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="flex items-center gap-3 cursor-pointer"
              type="button"
            >
              <div className="text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-white block">{currentUser?.name}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight">{currentUser?.unit}</span>
              </div>
              <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-sans font-black text-xs flex items-center justify-center select-none border border-slate-200 dark:border-white/5">
                {currentUser?.initials}
              </div>
            </button>
          </div>
        </header>

        {/* 2. CUI ALERT STRIP */}
        <div className="h-6 w-full bg-slate-900 border-b border-slate-800 flex items-center justify-center px-6 text-[9px] font-mono tracking-wider text-slate-400 flex-shrink-0 select-none z-10 font-sans">
          <span className="text-amber-500 mr-2 font-black">•</span>
          {activeTab === "dashboard" && "CUI // OPSEC · Nutrition Actions · caseload · k \u2265 5"}
          {activeTab === "consults" && "CUI // OPSEC · Consult queue · prep checklists scoped per airman"}
          {activeTab !== "dashboard" && activeTab !== "consults" && "CUI // OPSEC · Nutrition database · confidential"}
        </div>

        {/* 3. WORKSPACE CONTAINER */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#070a13] px-6 py-8 md:px-8 space-y-8">
          
          {/* Tab 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">NUTRITION · TODAY&apos;S CONSULT QUEUE</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Today&apos;s consult queue</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    6 consults today &middot; 38 active Nutrition Actions across 24 airmen &middot; k &ge; 5 cohort view.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setViewingNutritionRecords(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-55 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Open records
                  </button>
                  <button
                    onClick={() => setViewingActiveQueue(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Open consult queue
                  </button>
                </div>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { name: "Active Nutrition Actions", count: "38", desc: "even this week", arrow: "▲ +2" },
                  { name: "Consults today", count: "6", desc: "2 follow-ups · 4 new", arrow: null },
                  { name: "Acknowledged actions", count: "82", desc: "k \u2265 5 · last 30 days", arrow: null },
                  { name: "New referrals", count: "3", desc: "Repas · N-Scyc · T-Apex", arrow: null }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider">{kpi.name}</span>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{kpi.count}</h2>
                      {kpi.arrow && (
                        <span className="text-[10px] font-bold text-emerald-500">
                          {kpi.arrow}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">{kpi.desc}</p>
                  </div>
                ))}
              </div>

              {/* Section 2: Meal consistency */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                  <div>
                    <PopulationScopeBadge level={POPULATION_LEVELS.COHORT} detail="k≥5" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">Meal consistency by flight</h3>
                    <p className="text-[10px] text-slate-500">Acknowledge and completion metrics only &mdash; no quantitative targets. Adherence is observed, not measured.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 w-1/4">Flight</th>
                        <th className="pb-3">Acknowledged</th>
                        <th className="pb-3">Completed</th>
                        <th className="pb-3">Pending review</th>
                        <th className="pb-3">NS Signal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {[
                        { flight: "Alpha", ack: "High", comp: "High", pending: "1", sig: "—", colA: "green", colC: "green" },
                        { flight: "Bravo", ack: "High", comp: "Mixed", pending: "2", sig: "—", colA: "green", colC: "orange" },
                        { flight: "Charlie", ack: "Mixed", comp: "Mixed", pending: "4", sig: "2", colA: "orange", colC: "orange", isSigAlert: true },
                        { flight: "Delta", ack: "High", comp: "High", pending: "—", sig: "—", colA: "green", colC: "green" },
                        { flight: "Echo", ack: "Mixed", comp: "Lagging", pending: "3", sig: "1", colA: "orange", colC: "red" },
                        { flight: "Foxtrot", ack: "High", comp: "Mixed", pending: "—", sig: "—", colA: "green", colC: "orange" }
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-55/20 transition">
                          <td className="py-3 font-bold text-slate-800 dark:text-white">Flight {row.flight}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              row.colA === "green" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                            }`}>
                              <span className={`size-1.5 rounded-full ${row.colA === "green" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                              {row.ack}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              row.colC === "green" ? "bg-emerald-500/10 text-emerald-500" :
                              row.colC === "orange" ? "bg-amber-500/10 text-amber-500" :
                              "bg-red-500/10 text-red-500"
                            }`}>
                              <span className={`size-1.5 rounded-full ${
                                row.colC === "green" ? "bg-emerald-500" :
                                row.colC === "orange" ? "bg-amber-500" : "bg-red-500"
                              }`}></span>
                              {row.comp}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-slate-700 dark:text-slate-300 font-bold">{row.pending}</td>
                          <td className="py-3 font-mono text-slate-500">
                            <span className={row.isSigAlert ? "text-rose-500 font-black" : ""}>
                              {row.sig}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-white/5">
                  Cohort signal &mdash; ramp validation targets · k &ge; 5 · non-individual
                </div>
              </div>

              {/* Split columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                
                {/* Macro distribution */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Macro distribution · cohort</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Lagged macros vs. prescribed targets · 24 airmen · last 7 days</p>
                    </div>
                    <span className="px-2 py-0.5 bg-[var(--brand-color)/15] text-[#0c8a99] text-[9px] font-bold rounded">
                      7d
                    </span>
                  </div>

                  {/* Circular Pie/Donut Chart */}
                  <div className="flex flex-col items-center justify-center py-6 space-y-4">
                    <div className="relative size-40">
                      {/* SVG Conic/Segment Donut */}
                      <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                        {/* Segment 1: Carbohydrates (50%) - Orange/Teal */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="transparent"
                          stroke="var(--brand-color)"
                          strokeWidth="3.5"
                          strokeDasharray="50 100"
                          strokeDashoffset="0"
                        />
                        {/* Segment 2: Protein (25%) - Lavender */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="transparent"
                          stroke="#6366f1"
                          strokeWidth="3.5"
                          strokeDasharray="25 100"
                          strokeDashoffset="-50"
                        />
                        {/* Segment 3: Fat (25%) - Slate */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="transparent"
                          stroke="#f59e0b"
                          strokeWidth="3.5"
                          strokeDasharray="25 100"
                          strokeDashoffset="-75"
                        />
                      </svg>
                      {/* Center labels */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-800 dark:text-white">
                        <span className="text-xs font-mono font-extrabold">50/25/25</span>
                        <span className="text-[9px] uppercase text-slate-400 font-bold tracking-widest mt-0.5">C / P / F</span>
                      </div>
                    </div>

                    {/* Macro splits layout */}
                    <div className="w-full space-y-2.5 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-1">
                        <span className="text-slate-500 font-medium">Carbohydrates</span>
                        <span className="font-bold text-slate-800 dark:text-white">50%</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-1">
                        <span className="text-slate-500 font-medium">Protein</span>
                        <span className="font-bold text-slate-800 dark:text-white">25%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Fat</span>
                        <span className="font-bold text-slate-800 dark:text-white">25%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-white/5 pt-3 font-sans">
                    <span>On-target band</span>
                    <span className="text-emerald-500 font-bold">97%</span>
                  </div>
                </div>

                {/* Recent consults */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent consults</h3>
                      <p className="text-[10px] text-slate-500">Completed and in-progress · last 5 entries.</p>
                    </div>
                    <button
                      onClick={() => setViewingAllConsults(true)}
                      className="text-[var(--brand-color)] hover:text-[#0c8a99] text-xs font-bold cursor-pointer"
                    >
                      View all
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-2">Airman</th>
                          <th className="pb-2">Reason</th>
                          <th className="pb-2">Time</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 text-right">Outcome</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {RECENT_CONSULTS.map((c, i) => (
                          <tr key={i} className="hover:bg-slate-55/20 transition">
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <div className={`size-6 rounded-full font-bold text-[9px] flex items-center justify-center text-white ${
                                  c.col === "green" ? "bg-[var(--brand-color)]" :
                                  c.col === "orange" ? "bg-amber-500" : "bg-indigo-500"
                                }`}>
                                  {c.initials}
                                </div>
                                <span className="font-bold text-slate-800 dark:text-white">{c.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-slate-700 dark:text-slate-300">{c.reason}</td>
                            <td className="py-2.5 font-mono text-[10px] text-slate-500">{c.time}</td>
                            <td className="py-2.5">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                c.col === "green" ? "bg-emerald-500/10 text-emerald-500" :
                                c.col === "orange" ? "bg-amber-500/10 text-amber-500" :
                                "bg-[var(--brand-color)]/15 text-[var(--brand-color)]"
                              }`}>
                                <span className={`size-1 rounded-full ${
                                  c.col === "green" ? "bg-emerald-500" :
                                  c.col === "orange" ? "bg-amber-500" : "bg-[var(--brand-color)]"
                                }`}></span>
                                {c.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-sans">
                              <button
                                onClick={() => setViewingConsultOutcome(c)}
                                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-0.5 ml-auto border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                              >
                                {c.out}
                                <ChevronDown className="size-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Today's food log - A. Mendez */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm text-left space-y-4 pt-4 border-t border-slate-200 dark:border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100/60 dark:border-white/5 pb-4">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">TODAY&apos;S FOOD LOG &middot; A. MENDEZ</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Meal consistency & logs</h3>
                    <p className="text-[10px] text-slate-500">Auto-ingested from operator capture · 5 entries · needs review. Flag on lunch.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 text-amber-500 text-[9px] font-bold rounded-full uppercase">
                      7 trends archive
                    </span>
                    <button
                      onClick={() => setViewingFoodLogs(true)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Full record &rarr;
                    </button>
                  </div>
                </div>

                {/* Table list */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 w-12">Time</th>
                        <th className="pb-3 w-1/3">Entry</th>
                        <th className="pb-3">Kcal</th>
                        <th className="pb-3">Carbs</th>
                        <th className="pb-3">Protein</th>
                        <th className="pb-3">Fat</th>
                        <th className="pb-3 text-right">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                      {FOOD_LOG_TODAY.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-55/20 transition">
                          <td className="py-3 text-slate-500 text-[10px]">{item.time}</td>
                          <td className="py-3 font-bold text-slate-800 dark:text-white font-sans text-xs">{item.entry}</td>
                          <td className="py-3 text-slate-700 dark:text-slate-300">{item.kcal}</td>
                          <td className="py-3 text-slate-500">{item.carb}</td>
                          <td className="py-3 text-slate-500">{item.prot}</td>
                          <td className="py-3 text-slate-500">{item.fat}</td>
                          <td className="py-3 text-right">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase font-sans ${
                              item.col === "green" ? "bg-emerald-500/10 text-emerald-500" :
                              item.col === "orange" ? "bg-amber-500/15 text-amber-500" :
                              "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}>
                              <span className={`size-1 rounded-full ${
                                item.col === "green" ? "bg-emerald-500" :
                                item.col === "orange" ? "bg-amber-500" : "bg-slate-400"
                              }`}></span>
                              {item.flag}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left">
                Ascend · Nutrition Workspace · k&ge;5 cohort · Last sync 12:04
              </div>

              {/* Security limits disclaimer footer */}
              <div className="bg-[#e0f2fe]/30 dark:bg-[#0e1628]/40 border border-[#bae6fd]/30 dark:border-white/5 rounded-2xl p-5 text-left text-xs leading-relaxed text-slate-600 dark:text-slate-400 space-y-2">
                <span className="font-bold text-slate-700 dark:text-white block uppercase tracking-wider text-[8px]">Authorized Nutrition Content only</span>
                <p className="text-[10px]">
                  This view shows read-only Authorized Nutrition Context (14-O12, D4, W7-W8, M7-M8) only. Adherence is from acknowledgements / completion events / approved logs only — no quantitative goals. No raw medical access, no Performance Summary, no attachments, no dehydration labels, no broad cohort labels in comments.
                </p>
              </div>

            </div>
          )}

          {/* Tab 2: CONSULTS */}
          {activeTab === "consults" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">NUTRITION · CONSULT QUEUE</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Consult queue</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    6 today &middot; 3 follow-ups this week &middot; 2 prep checklists pending.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("dashboard")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-55 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => { setConsultDefaultName(""); setCreatingConsult(true); }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> Schedule consult
                  </button>
                </div>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { name: "Today", count: "6", desc: "2 follow-ups · 4 new" },
                  { name: "This week", count: "17", desc: "Mon → Fri" },
                  { name: "Prep ready", count: "4", desc: "of 6 today" },
                  { name: "Avg duration", count: "28m", desc: "last 30 days" }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider">{kpi.name}</span>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{kpi.count}</h2>
                    <p className="text-[10px] text-slate-500 font-mono">{kpi.desc}</p>
                  </div>
                ))}
              </div>

              {/* Toolbar and list */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                
                {/* Table Filter row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {["Today", "This week", "Pending prep", "All"].map((fTab, idx) => (
                      <button
                        key={idx}
                        onClick={() => setConsultQueueFilter(fTab)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          fTab === consultQueueFilter
                            ? "bg-slate-900 text-white dark:bg-slate-800"
                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {fTab}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 h-8 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200/50 dark:border-white/5"></div>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
                      <input
                        type="text"
                        aria-label="Search airman or notes"
                        placeholder="Search airman or notes..."
                        className="pl-9 pr-4 py-1.5 w-60 rounded-xl bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-xs text-slate-800 dark:text-white focus:outline-none placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Consult Queue Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 w-1/4">{PERSON_TERM}</th>
                        <th className="pb-3">Reason</th>
                        <th className="pb-3">Time</th>
                        <th className="pb-3 w-1/3">Prep checklist</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {consultQueue.filter((c) => {
                        if (consultQueueFilter === "Today") return !c.time.includes("·");
                        if (consultQueueFilter === "This week") return c.time.includes("·");
                        if (consultQueueFilter === "Pending prep") return c.checklist.some((item) => !item.done);
                        return true;
                      }).map((c, i) => (
                        <tr key={i} className="hover:bg-slate-55/20 transition items-start">
                          
                          {/* Patient */}
                          <td className="py-4 align-top">
                            <div className="flex items-center gap-2.5">
                              <div className={`size-6 rounded-full font-bold text-[9px] flex items-center justify-center text-white ${
                                c.statusCol === "green" ? "bg-[var(--brand-color)]" :
                                c.statusCol === "orange" ? "bg-amber-500" : "bg-indigo-500"
                              }`}>
                                {c.initials}
                              </div>
                              <div className="text-left">
                                <span className="font-bold text-slate-800 dark:text-white block">{c.name}</span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">{c.desc}</span>
                                {activeConsultId === c.name && (
                                  <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-[var(--brand-color)]/15 text-[var(--brand-color)] rounded text-[8px] font-bold uppercase">
                                    <span className="size-1 rounded-full bg-[var(--brand-color)] animate-pulse"></span>
                                    In session
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Reason */}
                          <td className="py-4 align-top">
                            <span className="px-2 py-0.5 bg-[var(--brand-color)]/10 text-[#0c8a99] font-bold rounded text-[9px] uppercase">
                              {c.reason}
                            </span>
                          </td>

                          {/* Time */}
                          <td className="py-4 align-top font-mono text-[10px] text-slate-500 leading-normal">
                            {c.time}
                          </td>

                          {/* Checklist nested view */}
                          <td className="py-4 align-top space-y-2">
                            {c.checklist.map((item, chIdx) => (
                              <div key={chIdx} className="flex items-start gap-2.5">
                                <input 
                                  type="checkbox" 
                                  checked={item.done} 
                                  readOnly
                                  className="mt-0.5 rounded border-slate-200 text-[var(--brand-color)] focus:ring-[var(--brand-color)]/40"
                                />
                                <div className="text-left text-[11px] leading-snug">
                                  <span className={item.done ? "text-slate-500 line-through decoration-slate-300 dark:decoration-slate-800" : "text-slate-700 dark:text-slate-300"}>
                                    {item.txt}
                                  </span>
                                  {item.sub && (
                                    <span className={`inline-flex items-center gap-1 ml-1.5 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase font-mono ${
                                      ("review" in item && item.review) ? "bg-purple-500/10 text-purple-600" :
                                      item.done ? "bg-[var(--brand-color)]/10 text-[var(--brand-color)]" : "bg-slate-100 dark:bg-slate-900 text-slate-400"
                                    }`}>
                                      {item.sub}
                                    </span>
                                  )}
                                  {item.sub2 && (
                                    <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.2 bg-[var(--brand-color)]/10 text-[var(--brand-color)] rounded text-[8px] font-bold uppercase font-mono">
                                      {item.sub2}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </td>

                          {/* Status */}
                          <td className="py-4 align-top">
                            <span className={`inline-flex items-center gap-1.5 font-bold text-[9px] uppercase ${
                              c.statusCol === "green" ? "text-emerald-500" :
                              c.statusCol === "orange" ? "text-amber-500" :
                              c.statusCol === "teal" ? "text-[var(--brand-color)]" : "text-slate-500"
                            }`}>
                              <span className={`size-1.5 rounded-full ${
                                c.statusCol === "green" ? "bg-emerald-500" :
                                c.statusCol === "orange" ? "bg-amber-500" :
                                c.statusCol === "teal" ? "bg-[var(--brand-color)]" : "bg-slate-400"
                              }`}></span>
                              {c.status}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-4 align-top text-right">
                            {c.actCol === "teal" ? (
                              <button
                                onClick={() => {
                                  setActiveConsultId(c.name);
                                  triggerToast(`Starting consult session for: ${c.name}`);
                                }}
                                className="px-3.5 py-1.5 bg-[var(--brand-color)] hover:bg-[#0c8a99] text-white text-xs font-bold rounded-lg transition cursor-pointer"
                              >
                                {c.act}
                              </button>
                            ) : (
                              <button
                                onClick={() => setViewingConsultRecord(c)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                              >
                                {c.act}
                                <ChevronDown className="size-3" />
                              </button>
                            )}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Active consult inline panel */}
              {activeConsultId && (
                <div className="bg-[var(--brand-color)]/10 border border-[var(--brand-color)]/30 rounded-2xl p-5 shadow-sm text-left space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--brand-color)]/20 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        In session · {activeConsultId}
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveConsultId(null)}
                      className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Consult session live. Mark checklist items, append notes, and seal when complete.
                  </p>
                </div>
              )}

              {/* Bottom Warning Alert banner */}
              <div className="bg-[#fffbeb] dark:bg-amber-950/10 text-slate-800 dark:text-slate-200 p-5 rounded-2xl border border-amber-200 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-left">
                <AlertTriangle className="size-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">Hydration reminder - Bravo + Charlie flights</span>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400 font-normal">
                    Both flights below 60% adherence for 5+ days. Consider a hydration huddle during Friday PT block. Auto-message drafted &rarr; open in messages.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left">
                Ascend &middot; Nutrition Workspace &middot; queue last sync 12:04
              </div>

            </div>
          )}

          {/* Tab 3: RECORDS */}
          {activeTab === "records" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">RECORDS · NUTRITION · ACCESS</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">S. Ndiaye · nutrition record</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {POPULATION_LEVELS.CASELOAD} scoped to nutrition driver · access logged.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                      {POPULATION_LEVELS.INDIVIDUAL}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Lock className="size-2.5" />
                      {PRIVACY_STATES.CONSENT_REQUIRED}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setViewingAllRecords(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-55 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Records
                  </button>
                  <button
                    onClick={() => setCreatingNote(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> New note
                  </button>
                </div>
              </div>

              {/* Caseload list & details split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
                
                {/* Left panel: Caseload */}
                <div className="lg:col-span-4 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{POPULATION_LEVELS.CASELOAD} · 8</h3>
                    <p className="text-[10px] text-slate-500">Active plans with targets</p>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
                    <input
                      type="text"
                      aria-label="Search airman"
                      placeholder="Search airman..."
                      className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-xs text-slate-800 dark:text-white focus:outline-none placeholder-slate-400"
                    />
                  </div>

                  {/* List of patients */}
                  <div className="space-y-1">
                    {CASELOAD_PATIENTS.map((p, idx) => (
                      <div
                        key={idx}
                        onClick={() => setViewingPatientRecord(p)}
                        className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                          p.active 
                            ? "bg-[var(--brand-color)]/10 border border-[var(--brand-color)]/30" 
                            : "hover:bg-slate-50 dark:hover:bg-slate-900/60 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`size-6 rounded-full font-bold text-[9px] flex items-center justify-center text-white ${p.col}`}>
                            {p.initials}
                          </div>
                          <div className="text-left">
                            <span className="font-bold text-slate-800 dark:text-white block text-xs">{p.name}</span>
                            <span className="text-[9px] text-slate-500 block leading-normal">{p.desc}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400">{p.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right panel: Record details */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Active Patient context summary card */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-5">
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-[var(--brand-color)] text-white font-bold text-sm flex items-center justify-center font-mono select-none">
                          SN
                        </div>
                        <div className="text-left space-y-0.5">
                          <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">S. Ndoye - Echo flight</h2>
                          <p className="text-[10px] text-slate-500 font-medium">New referral &middot; weight management &middot; consult today 10:30</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 px-2.5 py-1 rounded-xl">
                        <div className="size-5 rounded-full bg-slate-200 text-slate-500 font-bold text-[8px] flex items-center justify-center">
                          MP
                        </div>
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400">Capt Maya Patel · Nutritionist</span>
                      </div>
                    </div>

                    {/* Info grid items */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Age / Sex</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">26 · M</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Height / Weight</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">69 in · 190 lb / BMI 28.1</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Activity/Flight</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">opt-in · Wing / 74%</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Allergies</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">None on file &mdash;</span>
                      </div>
                    </div>

                    {/* Nav indicators */}
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 dark:border-white/5 text-xs font-bold">
                      {[
                        { label: "Food log", active: true },
                        { label: "Nutrition Action history", active: false },
                        { label: "Assessments", active: false },
                        { label: "Access log", active: false }
                      ].map((subTab, idx) => (
                        <span 
                          key={idx}
                          onClick={() => triggerToast(`Navigating to ${subTab.label} registry section below`)}
                          className={`cursor-pointer pb-1 border-b-2 transition ${
                            subTab.active 
                              ? "border-[var(--brand-color)] text-[var(--brand-color)]" 
                              : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-white"
                          }`}
                        >
                          {subTab.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Section 1: Food log last 3 days */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3.5">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Food log - last 3 days</h3>
                        <p className="text-[10px] text-slate-500">Auto-ingested from operator capture · 18 entries · 2 flags</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[9px] font-bold uppercase tracking-wider font-mono">
                          Review
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded text-[9px] font-bold uppercase tracking-wider font-mono">
                          k&ge;5 matches
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-white/5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="pb-2">Day</th>
                            <th className="pb-2">Time</th>
                            <th className="pb-2 w-1/3">Meal</th>
                            <th className="pb-2">Kcal</th>
                            <th className="pb-2">Carbs</th>
                            <th className="pb-2">Protein</th>
                            <th className="pb-2">Fat</th>
                            <th className="pb-2 text-right">Flag</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
                          {[
                            { day: "Mon 26", time: "08:15", meal: "Breakfast: 2oz + whey + banana", kcal: "542", carb: "62 g", prot: "38 g", fat: "12 g", flag: "OK", col: "green" },
                            { day: "Mon 26", time: "12:40", meal: "Lunch: Chicken bowl · rice", kcal: "680", carb: "70 g", prot: "48 g", fat: "14 g", flag: "OK", col: "green" },
                            { day: "Mon 26", time: "19:10", meal: "Dinner: Pizza · 3 slices + soda", kcal: "1,240", carb: "142 g", prot: "42 g", fat: "37 g", flag: "Sodium ++", col: "orange" },
                            { day: "Tue 27", time: "08:00", meal: "Breakfast: Eggs · toast · OJ", kcal: "510", carb: "48 g", prot: "28 g", fat: "23 g", flag: "OK", col: "green" },
                            { day: "Tue 27", time: "13:05", meal: "Lunch: Burrito bowl · chicken", kcal: "720", carb: "82 g", prot: "46 g", fat: "22 g", flag: "OK", col: "green" },
                            { day: "Tue 27", time: "21:45", meal: "Late snack: Ice cream + cookies", kcal: "640", carb: "100 g", prot: "10 g", fat: "24 g", flag: "Late sugar *", col: "orange" }
                          ].map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-55/20 transition">
                              <td className="py-2.5 text-slate-400">{row.day}</td>
                              <td className="py-2.5 text-slate-500">{row.time}</td>
                              <td className="py-2.5 font-bold text-slate-800 dark:text-white font-sans text-xs">{row.meal}</td>
                              <td className="py-2.5 font-bold text-slate-700 dark:text-slate-300">{row.kcal}</td>
                              <td className="py-2.5 text-slate-500">{row.carb}</td>
                              <td className="py-2.5 text-slate-500">{row.prot}</td>
                              <td className="py-2.5 text-slate-500">{row.fat}</td>
                              <td className="py-2.5 text-right">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase font-sans ${
                                  row.col === "green" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/15 text-amber-500"
                                }`}>
                                  <span className={`size-1 rounded-full ${row.col === "green" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                                  {row.flag}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 2: Nutrition Action history */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Nutrition Action history</h3>
                        <p className="text-[10px] text-slate-500">Active / closed Nutrition Actions lists</p>
                      </div>
                      <button
                        onClick={() => {
                          setConsultDefaultName("S. Ndoye");
                          setCreatingConsult(true);
                          triggerToast("Schedule consult wizard initialized");
                        }}
                        className="text-[var(--brand-color)] hover:text-[#0c8a99] text-xs font-bold cursor-pointer"
                      >
                        Schedule consult &rarr;
                      </button>
                    </div>

                    <div className="space-y-4 pt-1 font-sans text-xs">
                      {[
                        {
                          time: "22 Jul \u2014 12 Aug",
                          target: "0.45 / P 3.0 / F 2.5",
                          action: "Rehab · protein 1.5 g/kg target post-op recovery",
                          adh: "88%",
                          col: "green",
                          active: true
                        },
                        {
                          time: "5 Jul \u2014 19 Jul",
                          target: "0.50 / P 2.5 / F 2.5",
                          action: "Baseline · balanced intake + nutrition assessment",
                          adh: "72%",
                          col: "orange",
                          active: false
                        },
                        {
                          time: "12 May \u2014 30 May",
                          target: "\u2014 · 3.5 L / day",
                          action: "Hydration only \u2014 Pre-PRT plan",
                          adh: "94%",
                          col: "green",
                          active: false
                        }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-4 p-3.5 bg-[#f8fafc] dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl">
                          <div className="space-y-1.5 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-400">{item.time}</span>
                              <span className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase ${
                                item.active ? "text-emerald-500" : "text-slate-400"
                              }`}>
                                <span className={`size-1 rounded-full ${item.active ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                                {item.active ? "Active" : "Closed"}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-white">{item.action}</h4>
                            <p className="text-[10px] text-slate-500 font-mono">Target: {item.target}</p>
                          </div>

                          <div className="flex flex-col items-center justify-center font-mono">
                            <span className="text-[9px] text-slate-400 uppercase font-bold">Adherence</span>
                            <span className={`text-sm font-black mt-0.5 ${
                              item.col === "green" ? "text-emerald-500" : "text-amber-500"
                            }`}>
                              {item.adh}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Nutrition assessments */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Nutrition assessments</h3>
                      <p className="text-[10px] text-slate-500">Initial + follow-up notes · 4 entries.</p>
                    </div>

                    <div className="space-y-4 pt-1 font-sans text-xs">
                      {[
                        {
                          title: "Initial nutrition intake",
                          meta: "22 Jul baseline · completed by Capt Patel",
                          text: `${PERSON_TERM} reports 3-4 eating events per day with late-evening snacking. No supplement use. Goals: -15kg over 8 weeks, improve PRT run time, increase protein to 1.6 g/kg.`,
                          badge: "Intake",
                          badgeCol: "bg-[var(--brand-color)]/10 text-[var(--brand-color)]"
                        },
                        {
                          title: "Consult note - 22 Jul",
                          meta: "A. Mendez (Student) · follow-up scheduled 5 Aug",
                          text: `Started balanced macro plan. Discussed hydration timing around PT blocks (pre/intra/post). ${PERSON_TERM} agreed to daily log syncs by 22:00.`,
                          badge: "Scheduled",
                          badgeCol: "bg-emerald-500/10 text-emerald-500"
                        },
                        {
                          title: "Body comp baseline",
                          meta: "22 Jul · k=8",
                          text: "BF 22.4% (DXA). Lean mass: 71.4 kg. Waist: 84 cm. Within healthy range for height; weight mgmt goal appropriate.",
                          badge: "Synced",
                          badgeCol: "bg-[var(--brand-color)]/10 text-[var(--brand-color)]"
                        },
                        {
                          title: "Open concern - late-night intake",
                          meta: "Auto-flagged · 27 Jul 21:45 entry",
                          text: "Pattern detected: 4 of last 7 evenings logged caloric intake after 21:30 (avg 550 kcal). Suggest behavioral plan and check-in at next consult.",
                          badge: "Active",
                          badgeCol: "bg-amber-500/10 text-amber-500"
                        }
                      ].map((note, idx) => (
                        <div key={idx} className="p-4 bg-[#f8fafc] dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl space-y-1.5 text-left">
                          <div className="flex items-center justify-between gap-4">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight font-sans">{note.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${note.badgeCol}`}>
                              {note.badge}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-medium block">{note.meta}</span>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1 font-normal font-sans">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 4: Access log */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Access log</h3>
                      <p className="text-[10px] text-slate-500">Who accessed this record · last 30 days · audit trail</p>
                    </div>

                    <div className="overflow-x-auto pt-1">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-white/5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="pb-2">When</th>
                            <th className="pb-2">Action</th>
                            <th className="pb-2 text-right">Actor / Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
                          {[
                            { time: "28 Jul · 10:14", act: "Opened food log review", actor: "You · Dietitian", dur: "4m 12s" },
                            { time: "27 Jul · 16:02", act: "Added assessment note (5 Aug)", actor: "You · Dietitian", dur: "1m 30s" },
                            { time: "26 Jul · 09:11", act: "Synced body comp baseline", actor: "PT/IM [auto]", dur: "0m 05s" },
                            { time: "22 Jul · 11:08", act: "Created initial nutrition intake", actor: "You · Dietitian", dur: "22m 04s" },
                            { time: "22 Jul · 10:48", act: "Granted opt-in scope: nutrition", actor: PERSON_TERM, dur: "\u2014" }
                          ].map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-55/20 transition">
                              <td className="py-3 text-slate-500">{log.time}</td>
                              <td className="py-3 text-slate-800 dark:text-slate-200 font-sans font-bold">{log.act}</td>
                              <td className="py-3 text-right">
                                <div className="space-y-0.5">
                                  <span className="text-slate-600 dark:text-slate-400 font-bold block">{log.actor}</span>
                                  <span className="text-[10px] text-slate-400 block">{log.dur}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>

              {/* Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left">
                Ascend · Nutrition Workspace · records last sync 12:04
              </div>

            </div>
          )}

          {/* Tab 4: MESSAGES */}
          {activeTab === "messages" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">NUTRITION · MESSAGES</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">Messages</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Direct messages with your caseload. CUI &middot; opt-in enforced &middot; every send is audit-logged.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCreatingMessage(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> New message
                  </button>
                </div>
              </div>

              {/* Chat pane split layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Inbox Sidebar List */}
                <div className="lg:col-span-4 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Inbox</h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[var(--brand-color)]/15 text-[var(--brand-color)] rounded-full text-[9px] font-bold uppercase font-mono">
                      <span className="size-1 bg-[var(--brand-color)] rounded-full"></span>
                      3 unread
                    </span>
                  </div>

                  <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                      type="text"
                      aria-label="Search messages"
                      placeholder="Search messages"
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#f8fafc] dark:bg-[#070a13] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  {/* List of chat items */}
                  <div className="divide-y divide-slate-150/40 dark:divide-white/5 overflow-y-auto max-h-96 pr-1 space-y-1">
                    {[
                      { initials: "AM", name: "A. Mendez", time: "06:42", txt: "Caffeine taper, day 3 \u2014 slept 6h 12m", unread: 2, active: true },
                      { initials: "TC", name: "T. Cho", time: "25 Jul", txt: "Carb top-up during last ruck \u2014 felt strong", unread: 1, active: false },
                      { initials: "SN", name: "S. Ndiaye", time: "27 Jul", txt: "Quick question on the log app", unread: 0, active: false },
                      { initials: "JR", name: "J. Reyes", time: "24 Jul", txt: "Protein at lunch \u2014 chicken bowl worked", unread: 0, active: false },
                      { initials: "RP", name: "R. Patel", time: "22 Jul", txt: "Pre-ruck fuelling plan received", unread: 0, active: false }
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => triggerToast(`Opened message history with: ${item.name}`)}
                        className={`py-3.5 px-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                          item.active 
                            ? "bg-[var(--brand-color)]/10" 
                            : "hover:bg-[#f8fafc] dark:hover:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-[var(--brand-color)]/10 text-[var(--brand-color)] font-bold text-xs flex items-center justify-center font-mono select-none">
                            {item.initials}
                          </div>
                          <div className="space-y-0.5 text-left font-sans">
                            <span className="text-xs font-bold text-slate-800 dark:text-white block">{item.name}</span>
                            <p className="text-[10px] text-slate-500 truncate w-36">{item.txt}</p>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span className="text-[9px] font-mono text-slate-400">{item.time}</span>
                          {item.unread > 0 && (
                            <span className="size-4.5 rounded-full bg-[var(--brand-color)] text-white text-[9px] font-bold font-mono flex items-center justify-center">
                              {item.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main chat log pane */}
                <div className="lg:col-span-8 bg-[#f8fafc] dark:bg-[#0b0f19] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[500px]">
                  
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 pb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-[var(--brand-color)]/10 text-[var(--brand-color)] font-bold text-xs flex items-center justify-center font-mono select-none">
                        AM
                      </div>
                      <div className="text-left space-y-0.5 font-sans">
                        <span className="text-sm font-bold text-slate-800 dark:text-white block">A. Mendez</span>
                        <span className="text-[10px] text-slate-400 block font-medium">Bravo flight &middot; Sleep nutrition</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded-full uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span>
                      Opt-in
                    </span>
                  </div>

                  {/* Messaging records */}
                  <div className="flex-1 overflow-y-auto py-6 space-y-6 max-h-[350px] pr-2">
                    {nutritionMessagesList.map((msg, idx) => {
                      const showDateHeader = idx === 0 || nutritionMessagesList[idx - 1].date !== msg.date;
                      return (
                        <div key={idx} className="space-y-4 text-left">
                          {showDateHeader && (
                            <div className="w-full flex items-center justify-center select-none">
                              <span className="px-3 py-0.5 bg-slate-200/50 dark:bg-slate-900 border border-slate-300/40 dark:border-white/5 rounded-full text-[8px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                                {msg.date}
                              </span>
                            </div>
                          )}

                          <div className={`flex w-full ${msg.sender === "coach" ? "justify-end" : "justify-start"} text-left`}>
                            <div className={`max-w-md p-3.5 rounded-2xl relative shadow-sm ${
                              msg.sender === "coach" 
                                ? "bg-[var(--brand-color)] text-white rounded-br-none" 
                                : "bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-bl-none"
                            }`}>
                              <p className="text-xs leading-relaxed font-sans">{msg.text}</p>
                              <span className={`text-[8px] block text-right mt-1.5 font-mono ${
                                msg.sender === "coach" ? "text-slate-200" : "text-slate-400"
                              }`}>
                                {msg.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="w-full flex items-center justify-center select-none pt-4">
                      <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wide">
                        Opt-in active · messages in this thread are audit-logged
                      </span>
                    </div>
                  </div>

                  {/* Message inputs */}
                  <div className="border-t border-slate-200/60 dark:border-white/5 pt-4 flex-shrink-0 flex items-center gap-3">
                    <input
                      type="text"
                      aria-label="Message A. Mendez"
                      placeholder="Message A. Mendez"
                      value={nutritionChatMessage}
                      onChange={(e) => setNutritionChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendNutritionMessage()}
                      className="flex-1 px-4 py-2 text-xs rounded-xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none placeholder-slate-400"
                    />
                    <button 
                      onClick={handleSendNutritionMessage}
                      className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[#0c8a99] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      Send
                    </button>
                  </div>

                </div>

              </div>

              {/* Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left">
                Ascend &middot; Nutrition Workspace &middot; encrypted messages &middot; opt-in audit
              </div>

            </div>
          )}

        </main>
      </div>

      {viewingNutritionRecords && (
        <RecordDetailDialog
          open={viewingNutritionRecords}
          onClose={() => setViewingNutritionRecords(false)}
          title="Historical nutrition logs"
          subtitle="Full caseload · nutrition logs database"
          fields={[
            { label: "Scope", value: POPULATION_LEVELS.CASELOAD },
            { label: "Airmen", value: "24" },
            { label: "Active Nutrition Actions", value: "38" },
            { label: "Consults today", value: "6" },
          ]}
        />
      )}

      {viewingActiveQueue && (
        <RecordDetailDialog
          open={viewingActiveQueue}
          onClose={() => setViewingActiveQueue(false)}
          title="Active queue"
          subtitle="Today's consult queue snapshot"
          fields={[
            { label: "Today", value: "6 consults" },
            { label: "Follow-ups", value: "2" },
            { label: "New", value: "4" },
            { label: "Acknowledged actions", value: "82" },
          ]}
        />
      )}

      {viewingAllConsults && (
        <RecordDetailDialog
          open={viewingAllConsults}
          onClose={() => setViewingAllConsults(false)}
          title="All recent consults"
          subtitle={`${RECENT_CONSULTS.length} entries · completed & in-progress`}
          fields={[]}
        >
          <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden">
            {RECENT_CONSULTS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setViewingAllConsults(false);
                  setViewingConsultOutcome(item);
                }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900/60 transition cursor-pointer"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-slate-800 dark:text-white truncate">{item.name}</span>
                  <span className="block text-[10px] text-slate-500 truncate">{item.reason} &middot; {item.time}</span>
                </span>
                <span className={`flex-shrink-0 text-[9px] font-bold uppercase ${
                  item.col === "green" ? "text-emerald-500" : item.col === "orange" ? "text-amber-500" : "text-[var(--brand-color)]"
                }`}>
                  {item.status}
                </span>
              </button>
            ))}
          </div>
        </RecordDetailDialog>
      )}

      {viewingConsultOutcome && (
        <RecordDetailDialog
          open={!!viewingConsultOutcome}
          onClose={() => setViewingConsultOutcome(null)}
          title={viewingConsultOutcome.name}
          subtitle={viewingConsultOutcome.reason}
          fields={[
            { label: "Time", value: viewingConsultOutcome.time },
            { label: "Status", value: viewingConsultOutcome.status },
            { label: "Outcome", value: viewingConsultOutcome.out },
          ]}
        />
      )}

      {viewingFoodLogs && (
        <RecordDetailDialog
          open={viewingFoodLogs}
          onClose={() => setViewingFoodLogs(false)}
          title="Full historical food logs"
          subtitle="A. Mendez · auto-ingested from operator capture"
          fields={[]}
        >
          <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden font-mono text-[10px]">
            {FOOD_LOG_TODAY.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2.5 text-left">
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-slate-800 dark:text-white truncate font-sans">{item.entry}</span>
                  <span className="block text-[10px] text-slate-500 truncate">{item.time} &middot; {item.kcal} &middot; C {item.carb} / P {item.prot} / F {item.fat}</span>
                </span>
                <span className={`flex-shrink-0 text-[9px] font-bold uppercase ${
                  item.col === "green" ? "text-emerald-500" : item.col === "orange" ? "text-amber-500" : "text-slate-400"
                }`}>
                  {item.flag}
                </span>
              </div>
            ))}
          </div>
        </RecordDetailDialog>
      )}

      {viewingConsultRecord && (
        <RecordDetailDialog
          open={!!viewingConsultRecord}
          onClose={() => setViewingConsultRecord(null)}
          title={viewingConsultRecord.name}
          subtitle={viewingConsultRecord.desc}
          fields={[
            { label: "Reason", value: viewingConsultRecord.reason },
            { label: "Time", value: viewingConsultRecord.time },
            { label: "Status", value: viewingConsultRecord.status },
          ]}
        >
          <div className="space-y-2">
            {viewingConsultRecord.checklist.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-left text-[11px]">
                <input type="checkbox" checked={item.done} readOnly className="mt-0.5 rounded border-slate-200 text-[var(--brand-color)] focus:ring-[var(--brand-color)]/40" />
                <span className={item.done ? "text-slate-500 line-through decoration-slate-300 dark:decoration-slate-800" : "text-slate-700 dark:text-slate-300"}>
                  {item.txt}
                </span>
              </div>
            ))}
          </div>
        </RecordDetailDialog>
      )}

      {viewingAllRecords && (
        <RecordDetailDialog
          open={viewingAllRecords}
          onClose={() => setViewingAllRecords(false)}
          title="All historical record directories"
          subtitle={`${POPULATION_LEVELS.CASELOAD} · ${CASELOAD_PATIENTS.length} airmen`}
          fields={[]}
        >
          <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden">
            {CASELOAD_PATIENTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setViewingAllRecords(false);
                  setViewingPatientRecord(p);
                }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900/60 transition cursor-pointer"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-slate-800 dark:text-white truncate">{p.name}</span>
                  <span className="block text-[10px] text-slate-500 truncate">{p.desc}</span>
                </span>
                <span className="flex-shrink-0 text-[9px] font-mono text-slate-400">{p.date}</span>
              </button>
            ))}
          </div>
        </RecordDetailDialog>
      )}

      {viewingPatientRecord && (
        <RecordDetailDialog
          open={!!viewingPatientRecord}
          onClose={() => setViewingPatientRecord(null)}
          title={viewingPatientRecord.name}
          subtitle={viewingPatientRecord.desc}
          fields={[
            { label: "Last update", value: viewingPatientRecord.date },
            { label: "Status", value: viewingPatientRecord.active ? "Active" : "On file" },
          ]}
        />
      )}

      <CreateRecordModal
        open={creatingConsult}
        onClose={() => setCreatingConsult(false)}
        title="Schedule consult"
        subtitle="Bound to caseload scope · access logged"
        fields={[
          {
            name: "name",
            label: "Airman name",
            type: "text",
            required: true,
            defaultValue: consultDefaultName
          },
          {
            name: "reason",
            label: "Reason",
            type: "select",
            options: ["Initial assessment", "Follow-up", "Re-check", "Specialty referral"],
            required: true
          },
          {
            name: "time",
            label: "Scheduled time",
            type: "text",
            placeholder: "e.g. Tomorrow 0900"
          }
        ]}
        submitLabel="Schedule"
        onSubmit={(values) => {
          const parts = values.name.trim().split(/\s+/).filter(Boolean);
          const initials = parts.length === 0
            ? "NA"
            : parts.length === 1
              ? parts[0].slice(0, 2).toUpperCase()
              : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
          setConsultQueue([
            {
              initials,
              name: values.name,
              desc: `${values.reason} · new consult`,
              reason: values.reason,
              time: values.time || "TBD",
              checklist: [
                { txt: "Initial intake form", sub: "pending", done: false }
              ],
              status: "Scheduled",
              statusCol: "teal",
              act: "Prep",
              actCol: "white"
            },
            ...consultQueue
          ]);
          setConsultDefaultName("");
          setCreatingConsult(false);
          triggerToast(`Created: consult for ${values.name}`);
        }}
      />

      <CreateRecordModal
        open={creatingNote}
        onClose={() => setCreatingNote(false)}
        title="New assessment note"
        subtitle="Bound to nutrition scope · audit-logged"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "airman", label: "Airman", type: "text", placeholder: "e.g. TSgt Bennett" },
          {
            name: "type",
            label: "Type",
            type: "select",
            options: ["Initial", "Follow-up", "Discharge"],
            defaultValue: "Initial",
            required: true
          },
          { name: "body", label: "Body", type: "textarea", required: true }
        ]}
        submitLabel="Save note"
        onSubmit={(values) => {
          const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
          const meta = values.airman
            ? `${values.airman} · ${today}`
            : `${today} · created by Nutritionist`;
          const badge = values.type === "Initial" ? "Intake" : values.type === "Follow-up" ? "Scheduled" : "Synced";
          const badgeCol =
            values.type === "Initial"
              ? "bg-[var(--brand-color)]/10 text-[var(--brand-color)]"
              : values.type === "Follow-up"
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-amber-500/10 text-amber-500";
          setAssessmentNotes([
            {
              title: values.title,
              meta,
              text: values.body,
              badge,
              badgeCol
            },
            ...assessmentNotes
          ]);
          setCreatingNote(false);
          triggerToast(`Created: assessment note "${values.title}"`);
        }}
      />

      <CreateRecordModal
        open={creatingMessage}
        onClose={() => setCreatingMessage(false)}
        title="Start new outreach thread"
        subtitle="Opt-in enforced · every send is audit-logged"
        fields={[
          { name: "name", label: "Airman name", type: "text", required: true },
          {
            name: "channel",
            label: "Channel",
            type: "select",
            options: ["Message", "Email", "Phone task"],
            defaultValue: "Message"
          },
          { name: "firstMessage", label: "First message", type: "textarea", required: true }
        ]}
        submitLabel="Start thread"
        onSubmit={(values) => {
          const parts = values.name.trim().split(/\s+/).filter(Boolean);
          const initials = parts.length === 0
            ? "NA"
            : parts.length === 1
              ? parts[0].slice(0, 2).toUpperCase()
              : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
          setCaseloadInbox([
            {
              initials,
              name: values.name,
              time: "now",
              txt: values.firstMessage,
              unread: 0,
              active: false
            },
            ...caseloadInbox
          ]);
          setCreatingMessage(false);
          triggerToast(`Created: thread with ${values.name}`);
        }}
      />

      {/* TOAST NOTIFICATION */}
      {showConfirmToast && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-slide-up border border-slate-800 dark:border-white/5 font-sans">
          <CheckCircle className="size-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

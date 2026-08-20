"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { initBrandColor } from "@/lib/constants";
import { POPULATION_LEVELS, PRIVACY_STATES, PLAN_STATUSES, PLAN_HEALTH } from "@/lib/terminology";
import { PrivacyStateBadge } from "@/components/privacy/privacy-state-badge";
import { IconButton } from "@/components/ui/icon-button";
import { AscendLogo } from "@/components/ascend-logo";
import { RecordDetailDialog } from "@/components/ui/record-detail-dialog";
import { CreateRecordModal } from "@/components/ui/create-record-modal";
import {
  Home,
  Sliders,
  TrendingUp,
  FileText,
  Layers,
  ChevronDown,
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
} from "lucide-react";

type TabType = "dashboard" | "assignment" | "reconditioning";

type RecentPlan = {
  title: string;
  desc: string;
  owners: string;
  k: string;
  status: string;
  col: string;
  time: string;
};

const INITIAL_RECENT_PLANS: RecentPlan[] = [
  { title: "4-week recovery · Bravo", desc: "Recovery · strength", owners: "SCS · PT/IM", k: "k=24", status: PLAN_STATUSES.ACTIVE, col: "green", time: "28 Jul · 06:00" },
  { title: "Stress & sleep reset", desc: "Mental · 4-week", owners: "MP · SCS", k: "k=12", status: "Opt-in", col: "teal", time: "27 Jul · 22:18" },
  { title: "Hydration ramp · Foxtrot", desc: "Nutrition · 4-week", owners: "Nutritionist · SCS", k: "k=18", status: PLAN_STATUSES.ACTIVE, col: "green", time: "27 Jul · 14:55" },
  { title: "Pre-deployment purpose", desc: "Purpose · one-off", owners: "Purpose Coach · SCS", k: "k=10", status: PLAN_STATUSES.ACTIVE, col: "green", time: "26 Jul · 11:03" },
  { title: "Mission purpose cohort", desc: "Purpose · 6-week", owners: "Purpose Coach · SCS", k: "k=10", status: "Opt-in", col: "teal", time: "25 Jul · 09:14" },
  { title: "OFT prep · Alpha", desc: "Strength · 6-week", owners: "SCS · PT/IM", k: "k=22", status: PLAN_STATUSES.ACTIVE, col: "green", time: "24 Jul · 07:00" },
];

type AssignmentQueueItem = {
  title: string;
  desc: string;
  badge: string;
  col: string;
};

const ASSIGNMENT_QUEUE: AssignmentQueueItem[] = [
  { title: "Recovery block · Charlie", desc: "Authored · needs SCS + PT/IM owner · 6d", badge: "6d", col: "orange" },
  { title: "Sleep reset · Bravo", desc: "Authored · needs MP · 3d", badge: "3d", col: "orange" },
  { title: "Nutrition prep · OFT", desc: "Authored · needs Nutritionist + SCS · 2d", badge: "2d", col: "teal" },
  { title: "Pre-deployment brief", desc: "Authored · needs Purpose Coach + SCS · 1d", badge: "1d", col: "teal" },
];

export default function PlanDashboard() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const currentUser = useCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const { show: showConfirmToast, message: toastMessage, triggerToast } = useToast();
  const [activeTabInternal, setActiveTabInternal] = useState<TabType>("dashboard");
  const [hasMounted, setHasMounted] = useState(false);
  const [viewingAllPlans, setViewingAllPlans] = useState(false);
  const [viewingAssignmentQueue, setViewingAssignmentQueue] = useState(false);
  const [recentPlans, setRecentPlans] = useState<RecentPlan[]>(INITIAL_RECENT_PLANS);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);

  // Phase 6: Dashboard overview panel toggle
  const [showOverview, setShowOverview] = useState<boolean>(false);

  // Phase 6: Sent plans (pending review) + active template + switch-template panel
  const [sentPlans, setSentPlans] = useState<Array<{ id: string; title: string; recipients: string[]; status: string; sentAt: string }>>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [showSwitchTemplate, setShowSwitchTemplate] = useState<boolean>(false);

  // Phase 6: Plan composer drafts
  type PlanDraftEntry = { id: string; title: string; desc: string; cadence: string; status: string; savedAt: string; queuedFor?: string[] };
  const [planDrafts, setPlanDrafts] = useState<PlanDraftEntry[]>([]);

  type PlanBlock = { title: string; desc: string; badge: string; k: string };
  const [showNewBlockModal, setShowNewBlockModal] = useState(false);
  const [reconditioningBlocks, setReconditioningBlocks] = useState<PlanBlock[]>([
    { title: "4-week recovery · Bravo", desc: "Recovery · wk 2 of 4", badge: "Strength", k: "k=24" }
  ]);

  const setActiveTab = (tab: TabType) => {
    setActiveTabInternal(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem("ascend_plan_active_tab", tab);
    }
  };

  const activeTab = activeTabInternal;

  // Load persistent active tab on client mount
  useEffect(() => {
    const savedTab = localStorage.getItem("ascend_plan_active_tab") as TabType | null;
    if (savedTab && ["dashboard", "assignment", "reconditioning"].includes(savedTab)) {
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

  // Inject brand color CSS variables on mount
  useEffect(() => {
    initBrandColor();
  }, []);

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
                Plan · Wing
              </span>
            </div>
          </div>

          {/* Navigation Title */}
          <div className="px-5 pt-6 pb-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase font-sans">
            Plans
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "dashboard"
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)] dark:text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <ClipboardList className="size-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("assignment")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "assignment"
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)] dark:text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <Layers className="size-4" />
              Assignment
            </button>
            <button
              onClick={() => setActiveTab("reconditioning")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "reconditioning"
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)] dark:text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <Activity className="size-4" />
              Reconditioning
            </button>
          </nav>
        </div>

        {/* User Session Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 space-y-2">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
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
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Plan</span>
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
              <div className="size-8 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 font-sans font-black text-xs flex items-center justify-center select-none">
                {currentUser?.initials}
              </div>
            </button>
          </div>
        </header>

        {/* 2. CUI ALERT STRIP */}
        <div className="h-6 w-full bg-slate-900 border-b border-slate-800 flex items-center justify-center px-6 text-[9px] font-mono tracking-wider text-slate-400 flex-shrink-0 select-none z-10">
          <span className="text-amber-500 mr-2 font-black">•</span>
          CUI // OPSEC · Plan dashboard · cross-persona coordination
        </div>

        {/* 3. WORKSPACE CONTAINER */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#070a13] px-6 py-8 md:px-8 space-y-8">
          
          {/* Tab 1: MAIN DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Heading Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">PLAN · DASHBOARD</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Plan dashboard</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    KPIs, recent plans, assignment queue, and coordination activity across all linked workspaces.
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <Users className="size-3" />
                    {POPULATION_LEVELS.COHORT}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowOverview((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setShowNewPlanModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> New plan
                  </button>
                </div>
              </div>

              {/* Overview inline panel */}
              {showOverview && (
                <section className="bg-[var(--brand-color)]/10 border border-[var(--brand-color)]/30 rounded-2xl p-5 shadow-sm text-left space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--brand-color)]/20 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Scheduling overview</h3>
                    <button
                      onClick={() => setShowOverview(false)}
                      className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                    <li><strong>24 active plans</strong> across 3 flights — 6 awaiting assignment, 8 in reconditioning.</li>
                    <li><strong>4 drafts in pipeline</strong> — author pending, queued for owner routing.</li>
                    <li><strong>12 cross-persona plans</strong> touching ≥ 2 roles (SCS, PT/IM, MP, Nutritionist, Purpose Coach).</li>
                    <li><strong>Reconditioning velocity:</strong> 82% avg adherence over the last 30 days, up ▲4.1.</li>
                  </ul>
                </section>
              )}

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { name: "Active plans", count: "24", desc: "across 3 flights" },
                  { name: "Awaiting assignment", count: "6", desc: "drafted, not routed" },
                  { name: "In reconditioning", count: "8", desc: "multi-specialist" },
                  { name: "Cross-persona", count: "12", desc: "touching \u2265 2 roles" }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider">{kpi.name}</span>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{kpi.count}</h2>
                    <p className="text-[10px] text-slate-500 font-mono">{kpi.desc}</p>
                  </div>
                ))}
              </div>

              {/* Cross-Persona Routing columns */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">CROSS-PERSONA ROUTING</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active plans by owner</h3>
                    <p className="text-xs text-slate-500">Each plan is owned by at least one role &middot; moves through the linked workspaces</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full text-[9px] font-bold text-slate-500 uppercase">
                      <span className="size-1.5 rounded-full bg-slate-900 dark:bg-white"></span>
                      5 workspaces
                    </span>
                    <button
                      onClick={() => setViewingAssignmentQueue(true)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Open assignment
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 items-start">

                  {/* SCS Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">SCS</span>
                      <span className="text-[10px] text-slate-400 font-mono">12</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "4-week recovery · Bravo", desc: "Recovery · wk 2 of 4", badge: "Strength", k: "k=24" },
                        { title: "OFT prep · Alpha", desc: "Strength · wk 3 of 6", badge: "Strength", k: "k=22" },
                        { title: "Mobility block · Charlie", desc: "Active · wk 1 of 4", badge: "Mobility", k: "k=20" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 block">{item.desc}</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">{item.badge}</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 font-mono uppercase">{item.k}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PT/IM Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">PT/IM</span>
                      <span className="text-[10px] text-slate-400 font-mono">6</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Lower-back return-to-duty", desc: "Caseload · wk 3 of 6", badge: "Rehab", k: "k=8" },
                        { title: "Pre-OFT clearance", desc: "Active · wk 1", badge: "Clearance", k: "k=14" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 block">{item.desc}</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">{item.badge}</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 font-mono uppercase">{item.k}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MP Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">MP</span>
                      <span className="text-[10px] text-slate-400 font-mono">4</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Stress & sleep reset", desc: "Opt-in · wk 2 of 4", badge: "Mental", k: "k=12" },
                        { title: "Pre-deployment briefing", desc: "One-off · complete", badge: "Brief", k: null }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 block">{item.desc}</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">{item.badge}</span>
                            {item.k && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 font-mono uppercase">{item.k}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nutritionist Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">Nutritionist</span>
                      <span className="text-[10px] text-slate-400 font-mono">3</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Hydration ramp", desc: "Caseload · wk 1 of 4", badge: "Hydration", k: "k=18" },
                        { title: "Nutrition prep · OFT", desc: "Active · wk 2", badge: "Nutrition", k: null }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 block">{item.desc}</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">{item.badge}</span>
                            {item.k && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 font-mono uppercase">{item.k}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Purpose Coach Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">Purpose Coach</span>
                      <span className="text-[10px] text-slate-400 font-mono">2</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Mission purpose cohort", desc: "Opt-in · wk 3", badge: "Purpose", k: "k=10" },
                        { title: "Pre-deployment purpose", desc: "Active · wk 1", badge: "Purpose", k: null }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 block">{item.desc}</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">{item.badge}</span>
                            {item.k && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 font-mono uppercase">{item.k}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Columns: Recent plans & Assignment queue */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                
                {/* Recent plans list */}
                <div className="lg:col-span-7 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Recent plans</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Last 6 &middot; any status</p>
                    </div>
                    <button
                      onClick={() => setViewingAllPlans(true)}
                      className="px-3 py-1 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
                    >
                      View all
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-3 w-1/3">Plan</th>
                          <th className="pb-3">Owners</th>
                          <th className="pb-3">Cohort</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {recentPlans.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/20 transition">
                            <td className="py-3.5">
                              <span className="font-bold text-slate-800 dark:text-white block">{p.title}</span>
                              <span className="text-[10px] text-slate-500 mt-0.5 block font-sans">{p.desc}</span>
                            </td>
                            <td className="py-3.5 text-slate-700 dark:text-slate-300 font-bold font-sans">{p.owners}</td>
                            <td className="py-3.5 text-slate-500 font-mono">{p.k}</td>
                            <td className="py-3.5">
                              <span className={`inline-flex items-center gap-1.5 font-bold text-[9px] uppercase ${
                                p.col === "green" ? "text-emerald-500" : "text-[var(--brand-color)]"
                              }`}>
                                <span className={`size-1.5 rounded-full ${p.col === "green" ? "bg-emerald-500" : "bg-[var(--brand-color)]"}`}></span>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-slate-500 font-mono text-[10px]">{p.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Assignment queue */}
                <div className="lg:col-span-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Assignment queue</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Plans drafted, awaiting routing</p>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full uppercase">
                      6 open
                    </span>
                  </div>

                  <div className="space-y-4">
                    {ASSIGNMENT_QUEUE.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 p-3.5 bg-[#f8fafc] dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl hover:shadow-sm transition cursor-pointer">
                        <div className="space-y-0.5 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white font-sans">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{item.desc}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                          item.col === "orange" ? "bg-amber-500/15 text-amber-600" : "bg-[var(--brand-color)/15] text-[var(--brand-color-hover)]"
                        }`}>
                          {item.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Sub footnote */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left">
                PR-W · Plan dashboard · governance 3/3 PASS
              </div>

            </div>
          )}

          {/* Tab 2: ASSIGNMENT */}
          {activeTab === "assignment" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">PLAN · AUTHORING</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">New plan · 4-week recovery · Bravo</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Author a structured plan from a template. Route to roles. Assign cohort.
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <Users className="size-3" />
                    {POPULATION_LEVELS.COHORT}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => {
                      const newDraft: PlanDraftEntry = {
                        id: `DRAFT-${Date.now()}`,
                        title: "4-week recovery · Bravo",
                        desc: "Recovery · strength",
                        cadence: "Daily",
                        status: "draft",
                        savedAt: new Date().toISOString(),
                      };
                      setPlanDrafts([newDraft, ...planDrafts]);
                      triggerToast("Authoring draft saved to local database");
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Save draft
                  </button>
                  <button
                    onClick={() => {
                      const recipients = ["SCS", "PT/IM"];
                      const sentId = `PLAN-${Date.now()}`;
                      const sentAt = new Date().toISOString();
                      setSentPlans([
                        {
                          id: sentId,
                          title: "4-week recovery · Bravo",
                          recipients,
                          status: "pending_review",
                          sentAt,
                        },
                        ...sentPlans,
                      ]);
                      setPlanDrafts([
                        {
                          id: sentId,
                          title: "4-week recovery · Bravo",
                          desc: "Recovery · strength",
                          cadence: "Daily",
                          status: "pending_review",
                          savedAt: sentAt,
                        },
                        ...planDrafts,
                      ]);
                      triggerToast("Readiness plan sent to owner specialists for approval");
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Send className="size-3.5" /> Send to owners
                  </button>
                  {planDrafts[0] && planDrafts[0].status === "draft" && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Last saved: {new Date(planDrafts[0].savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>

              {/* Draft Info Banner */}
              <div className="bg-[#e0f2fe]/40 dark:bg-sky-950/5 border border-[#bae6fd]/40 dark:border-white/5 rounded-2xl p-5 md:p-6 text-left space-y-4">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-900 text-white dark:bg-slate-800 rounded px-2.5 py-0.5 text-[9px] font-mono inline-block">
                    DRAFT
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Auto-saved</span>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white">Plan authoring &mdash; structured doc</h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Author a plan like a doc with structured sections and clear routing metadata, not a form. Seven sections, every one routed.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {[
                    "k \u2265 5 enforced",
                    "5 linked workspaces",
                    "template - 4-week reconditioning"
                  ].map((ind, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-[9px] font-bold text-slate-500 dark:text-slate-400 leading-normal uppercase">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span>
                      {ind}
                    </span>
                  ))}
                </div>
              </div>

              {/* Outline and Document editor */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                
                {/* Left Outline panel */}
                <div className="lg:col-span-4 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left h-fit space-y-3">
                  <div className="border-b border-slate-100 dark:border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Outline</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Drag to reorder · click to edit</p>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { num: "01", name: "Plan metadata", active: true },
                      { num: "02", name: "Goal & rationale", active: false },
                      { num: "03", name: "Cadence & schedule", active: false },
                      { num: "04", name: "Owner routing", active: false },
                      { num: "05", name: "Cohort & scope", active: false },
                      { num: "06", name: "Recommendations", active: false },
                      { num: "07", name: "Review & sign-off", active: false }
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          item.active 
                            ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]" 
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60"
                        }`}
                      >
                        <span>{item.num} &middot; {item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Document form cards */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Section 01 */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 text-left">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">SECTION 01</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Plan metadata</h3>
                      <p className="text-[10px] text-slate-500">Name the plan, pick a template, and define the lifecycle.</p>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <label htmlFor="plan-name" className="text-[10px] font-bold text-slate-400 block uppercase">Plan name</label>
                        <input
                          id="plan-name"
                          type="text"
                          defaultValue="4-week recovery · Bravo"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:border-[var(--brand-color)/50] font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label id="plan-template-label" className="text-[10px] font-bold text-slate-400 block uppercase">Template</label>
                          <button
                            type="button"
                            aria-labelledby="plan-template-label"
                            onClick={() => triggerToast("Template picker opened")}
                            className="w-full h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 flex items-center justify-between px-3 text-xs text-slate-500 select-none cursor-pointer"
                          >
                            <span>Select template</span>
                            <ChevronDown className="size-4 text-slate-400" />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <label id="plan-window-label" className="text-[10px] font-bold text-slate-400 block uppercase">Window</label>
                          <button
                            type="button"
                            aria-labelledby="plan-window-label"
                            onClick={() => triggerToast("Date range picker opened")}
                            className="w-full h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-between px-3 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            <span className="font-bold">20 Jul &mdash; 15 Aug 2025 · 4 weeks</span>
                            <ChevronDown className="size-4 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 02 */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 text-left">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">SECTION 02</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Goal & rationale</h3>
                      <p className="text-[10px] text-slate-500">Author the cohort-level rationale. Members may reference aggregate trends; identifiers are not allowed here.</p>
                    </div>

                    <div className="pt-2">
                      <textarea 
                        rows={4}
                        defaultValue="Recovery protocol rollout in response to the +1.2 MoM lift in wing OPS. Sleep watch on Delta flight is the cohort-level driver."
                        className="w-full p-3.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--brand-color)/50] leading-relaxed font-sans"
                      />
                    </div>
                  </div>

                  {/* Section 03 */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 text-left">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">SECTION 03</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Cadence & schedule</h3>
                      <p className="text-[10px] text-slate-500">Define the schedule. Daily capture is encouraged but never mandatory; weekly aggregate is the minimum cadence for k &ge; 5 reporting.</p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 pt-2">
                      <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-[var(--brand-color)] text-white cursor-pointer transition">
                        Daily
                      </button>
                      {["Weekly", "Bi-weekly", "Ad-hoc"].map((c, i) => (
                        <button key={i} className="px-4 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 04 */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 text-left">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">SECTION 04</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Owner routing</h3>
                      <p className="text-[10px] text-slate-500">Route the plan to one or more owners across linked workspaces. Each owner inherits a role-keyed scope.</p>
                    </div>

                    <div className="overflow-x-auto pt-2">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="pb-3 w-1/3">Owner Role</th>
                            <th className="pb-3">Requests</th>
                            <th className="pb-3">Read</th>
                            <th className="pb-3">Write</th>
                            <th className="pb-3">Notify</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                          {[
                            { role: "SCS", req: "Primary", col: "teal", r: true, w: true, n: true },
                            { role: "PT/IM", req: "Secondary", col: "indigo", r: true, w: true, n: true },
                            { role: "MP", req: "Advisory", col: "orange", r: false, w: false, n: true },
                            { role: "NUTRITIONIST", req: null, col: null, r: false, w: false, n: false },
                            { role: "PURPOSE COACH", req: null, col: null, r: "lock", w: "lock", n: "lock" }
                          ].map((row, idx) => {
                            const renderGrant = (value: boolean | string) =>
                              value === "lock" ? (
                                <PrivacyStateBadge state={PRIVACY_STATES.AUTH_REQUIRED} />
                              ) : value ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-500">
                                  <span className="size-1.5 rounded-full bg-emerald-500 inline-block"></span>
                                  Granted
                                </span>
                              ) : (
                                "—"
                              );
                            return (
                              <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                                <td className="py-3 font-bold text-slate-700 dark:text-slate-300 font-sans">{row.role}</td>
                                <td className="py-3">
                                  {row.req ? (
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                      row.col === "teal" ? "bg-[var(--brand-color)/15] text-[var(--brand-color-hover)]" :
                                      row.col === "indigo" ? "bg-indigo-500/15 text-indigo-500" :
                                      "bg-amber-500/15 text-amber-500"
                                    }`}>
                                      {row.req}
                                    </span>
                                  ) : "—"}
                                </td>
                                <td className="py-3">{renderGrant(row.r)}</td>
                                <td className="py-3">{renderGrant(row.w)}</td>
                                <td className="py-3">{renderGrant(row.n)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 05 */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 text-left">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">SECTION 05</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Cohort & scope</h3>
                      <p className="text-[10px] text-slate-500">Cohort minimum (k) is enforced at every data point. Select the cohort scope or import an existing one.</p>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <label id="plan-cohort-label" className="text-[10px] font-bold text-slate-400 block uppercase">Cohort</label>
                        <button
                          type="button"
                          aria-labelledby="plan-cohort-label"
                          onClick={() => triggerToast("Cohort scope picker opened")}
                          className="w-full h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 flex items-center justify-between px-3 text-xs text-slate-500 select-none cursor-pointer"
                        >
                          <span>Select cohort scope</span>
                          <ChevronDown className="size-4 text-slate-400" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 pt-2 flex-wrap">
                        <button
                          onClick={() => {
                            const newDraft: PlanDraftEntry = {
                              id: `DRAFT-${Date.now()}`,
                              title: "4-week recovery · Bravo",
                              desc: "Recovery · strength",
                              cadence: "Daily",
                              status: "draft",
                              savedAt: new Date().toISOString(),
                              queuedFor: ["MP", "Nutritionist", "SCS"],
                            };
                            setPlanDrafts([newDraft, ...planDrafts]);
                            triggerToast("Authoring draft saved for routing later");
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          Save & route later
                        </button>
                        <button
                          onClick={() => {
                            const recipients = ["MP", "Nutritionist", "SCS"];
                            const sentId = `PLAN-${Date.now()}`;
                            const sentAt = new Date().toISOString();
                            setSentPlans([
                              {
                                id: sentId,
                                title: "4-week recovery · Bravo",
                                recipients,
                                status: "pending_review",
                                sentAt,
                              },
                              ...sentPlans,
                            ]);
                            setPlanDrafts([
                              {
                                id: sentId,
                                title: "4-week recovery · Bravo",
                                desc: "Recovery · strength",
                                cadence: "Daily",
                                status: "pending_review",
                                savedAt: sentAt,
                                queuedFor: recipients,
                              },
                              ...planDrafts,
                            ]);
                            triggerToast("Readiness plan sent to owners for review");
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          <Send className="size-3.5" /> Send to owners
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Templates Switching grid */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">TEMPLATES</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Switch template</h3>
                  <p className="text-xs text-slate-500">Pre-defined cadences &middot; cross-persona by default</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[
                    { cat: "Recovery", title: "4-week reconditioning", desc: "Daily capture · weekly review · aggregate progress at k \u2265 5", b1: "4 weeks", b2: "k \u2265 5" },
                    { cat: "Strength", title: "6-week strength block", desc: "SCS-led · strength + mobility · OFT prep cadence", b1: "6 weeks", b2: "SCS-led" },
                    { cat: "Mental", title: "Sleep reset", desc: "MP-led · opt-in cohort · 4 weeks", b1: "4 weeks", b2: "Opt-in" },
                    { cat: "Nutrition", title: "Hydration ramp", desc: "Nutritionist-led · 4 weeks · daily intake check-in", b1: "4 weeks", b2: "Caseload" },
                    { cat: "Pre-deployment", title: "Nutrition prep", desc: "Nutritionist + SCS · pre-deployment · 3 weeks", b1: "3 weeks", b2: "Cross-persona" },
                    { cat: "Purpose", title: "Purpose cohort", desc: "Purpose Coach-led · opt-in · 6 weeks", b1: "6 weeks", b2: "Opt-in" }
                  ].map((tpl, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveTemplateId(tpl.title);
                        triggerToast(`Switched active template to: ${tpl.title}`);
                      }}
                      className={`bg-white dark:bg-[#0e1628] border ${
                        activeTemplateId === tpl.title
                          ? "border-[var(--brand-color)] shadow-md ring-1 ring-[var(--brand-color)]/40"
                          : "border-slate-200 dark:border-white/5 hover:border-[var(--brand-color)/55]"
                      } rounded-2xl p-5 shadow-sm hover:shadow flex flex-col justify-between h-44 cursor-pointer text-left transition`}
                    >
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">{tpl.cat}</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{tpl.title}</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-2">{tpl.desc}</p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2">
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded text-[8px] font-bold uppercase">{tpl.b1}</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded text-[8px] font-bold uppercase font-mono">{tpl.b2}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub footnote */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left">
                PR-W · Plan assignment · drafting · auto-save on
              </div>

            </div>
          )}

          {/* Tab 3: RECONDITIONING */}
          {activeTab === "reconditioning" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">PLAN · RECONDITIONING</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Reconditioning program</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    4 / 6-week blocks. Daily / weekly schedule. Aggregate progress by flight (k &ge; 5). Cross-persona coordination.
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <Users className="size-3" />
                    {POPULATION_LEVELS.COHORT}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("dashboard")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Plan dashboard
                  </button>
                  <button
                    onClick={() => setShowNewBlockModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> New block
                  </button>
                </div>
              </div>

              {/* Warnings Banner */}
              <div className="bg-[#fcf8e3] dark:bg-amber-950/10 text-slate-800 dark:text-slate-200 p-5 rounded-2xl border border-[#faf2cc]/50 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-left">
                <AlertTriangle className="size-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">Cohort gate · k &ge; 5 enforced</span>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400 font-normal">
                    Every aggregate view is rendered at flight-cohort level. Individual names never surface in any plan or reconditioning view.
                  </p>
                </div>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { name: "Active reconditioning", count: "8", desc: "across 3 flights", arrow: null },
                  { name: "Avg adherence · 30d", count: "82%", desc: "vs prior 30d", arrow: "▲ +4.1" },
                  { name: "Wk-of-program distribution", count: "W2 → W4", desc: "3 blocks in W2-W3", arrow: null },
                  { name: "Cross-persona actions", count: "12", desc: "5 owners", arrow: null }
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

              {/* Reconditioning Templates */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">TEMPLATES</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Reconditioning templates</h3>
                    <p className="text-xs text-slate-500">Pre-defined cadences · cross-persona by default · k &ge; 5 at every aggregate view</p>
                  </div>
                  <button
                    onClick={() => setShowSwitchTemplate((prev) => !prev)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Switch template
                  </button>
                </div>

                {showSwitchTemplate && (
                  <div className="bg-[var(--brand-color)]/10 border border-[var(--brand-color)]/30 rounded-2xl p-5 shadow-sm text-left space-y-3">
                    <div className="flex items-center justify-between border-b border-[var(--brand-color)]/20 pb-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Choose a template</h4>
                      <button
                        onClick={() => setShowSwitchTemplate(false)}
                        className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {[
                        { cat: "Recovery", title: "4-week reconditioning" },
                        { cat: "Strength", title: "6-week strength block" },
                        { cat: "Mental", title: "Sleep reset" },
                        { cat: "Nutrition", title: "Hydration ramp" },
                        { cat: "Pre-deployment", title: "Nutrition prep" },
                        { cat: "Purpose", title: "Purpose cohort" }
                      ].map((tpl, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveTemplateId(tpl.title);
                            setShowSwitchTemplate(false);
                            triggerToast(`Switched active template to: ${tpl.title}`);
                          }}
                          className={`text-left px-3 py-2 rounded-lg border transition cursor-pointer ${
                            activeTemplateId === tpl.title
                              ? "border-[var(--brand-color)] bg-[var(--brand-color)]/15"
                              : "border-slate-200 dark:border-white/10 hover:border-[var(--brand-color)]/50"
                          }`}
                        >
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">{tpl.cat}</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-white">{tpl.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                  {[
                    { cat: "Recovery", title: "4-week reconditioning", desc: "Daily capture · weekly review · aggregate progress at k \u2265 5", b1: "4 weeks", b2: "k \u2265 5" },
                    { cat: "Strength", title: "6-week strength block", desc: "SCS-led · strength + mobility · OFT prep cadence", b1: "6 weeks", b2: "SCS-led" },
                    { cat: "Mental", title: "Sleep reset", desc: "MP-led · opt-in cohort · 4 weeks", b1: "4 weeks", b2: "Opt-in" },
                    { cat: "Nutrition", title: "Hydration ramp", desc: "Nutritionist-led · 4 weeks · daily intake check-in", b1: "4 weeks", b2: "Caseload" },
                    { cat: "Pre-deployment", title: "Nutrition prep", desc: "Nutritionist + SCS · pre-deployment · 3 weeks", b1: "3 weeks", b2: "Cross-persona" }
                  ].map((tpl, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveTemplateId(tpl.title);
                        triggerToast(`Switched active template to: ${tpl.title}`);
                      }}
                      className={`bg-white dark:bg-[#0e1628] border ${
                        activeTemplateId === tpl.title
                          ? "border-[var(--brand-color)] shadow-md ring-1 ring-[var(--brand-color)]/40"
                          : "border-slate-200 dark:border-white/5 hover:border-[var(--brand-color)/55]"
                      } rounded-2xl p-5 shadow-sm hover:shadow flex flex-col justify-between h-44 cursor-pointer text-left transition`}
                    >
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">{tpl.cat}</span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 leading-tight">{tpl.title}</h4>
                        <p className="text-[9px] text-slate-500 leading-relaxed mt-2">{tpl.desc}</p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2">
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded text-[8px] font-bold uppercase">{tpl.b1}</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded text-[8px] font-bold uppercase font-mono">{tpl.b2}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cohort Progress table */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">COHORT PROGRESS</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Aggregate progress by cohort - k &ge; 5</h3>
                    <p className="text-xs text-slate-500">Each row is a flight cohort · k is enforced · progress shown as cohort mean</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-full text-[9px] font-bold text-slate-500 uppercase">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span>
                      Block A - wk 2
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-full text-[9px] font-bold text-slate-500 uppercase">
                      <span className="size-1.5 rounded-full bg-slate-900 dark:bg-white"></span>
                      8 cohorts
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-3 w-1/4">Cohort</th>
                          <th className="pb-3">Block</th>
                          <th className="pb-3">Wk</th>
                          <th className="pb-3">Adherence</th>
                          <th className="pb-3 w-1/6">Progress</th>
                          <th className="pb-3">Owners</th>
                          <th className="pb-3">Health</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                        {[
                          { name: "Flight Alpha - aggregate", details: "k=22 · OFT prep", block: "6-week strength", wk: "2 of 6", adh: "88%", pct: 88, owners: ["SCS", "PT/IM"], status: PLAN_HEALTH.ON_TRACK, col: "green" },
                          { name: "Flight Bravo - aggregate", details: "k=24 · recovery", block: "4-week recovery", wk: "2 of 4", adh: "81%", pct: 81, owners: ["SCS", "PT/IM"], status: PLAN_HEALTH.ON_TRACK, col: "green" },
                          { name: "Flight Charlie - aggregate", details: "k=20 · mobility", block: "4-week mobility", wk: "1 of 4", adh: "76%", pct: 76, owners: ["SCS"], status: PLAN_HEALTH.RAMPING, col: "teal" },
                          { name: "Foxtrot - aggregate", details: "k=18 · hydration ramp", block: "4-week nutrition", wk: "1 of 4", adh: "74%", pct: 74, owners: ["Nutritionist"], status: PLAN_HEALTH.RAMPING, col: "teal" },
                          { name: "Opt-in: Sleep reset", details: "k=12 · MP", block: "4-week sleep", wk: "2 of 4", adh: "65%", pct: 65, owners: ["MP"], status: PLAN_HEALTH.WATCH, col: "orange" },
                          { name: "Opt-in: Mission purpose", details: "k=10 · Purpose Coach", block: "6-week purpose", wk: "2 of 6", adh: "91%", pct: 91, owners: ["Purpose Coach"], status: PLAN_HEALTH.ON_TRACK, col: "green" },
                          { name: "Caseload: Lower-back RTD", details: "k=8 · PT/IM", block: "6-week rehab", wk: "3 of 6", adh: "85%", pct: 85, owners: ["PT/IM"], status: PLAN_HEALTH.ON_TRACK, col: "green" },
                          { name: "Caseload: Pre-OFT clearance", details: "k=14 · PT/IM", block: "1-week clearance", wk: "1 of 1", adh: "92%", pct: 100, owners: ["PT/IM"], status: PLAN_HEALTH.CLEARED, col: "green" }
                        ].map((c, i) => (
                          <tr key={i} className="hover:bg-slate-50/20 transition">
                            <td className="py-3">
                              <span className="font-bold text-slate-800 dark:text-white block">{c.name}</span>
                              <span className="text-[10px] text-slate-500 mt-0.5 block font-sans">{c.details}</span>
                            </td>
                            <td className="py-3 text-slate-700 dark:text-slate-300 font-bold">{c.block}</td>
                            <td className="py-3 font-mono text-[10px]">{c.wk}</td>
                            <td className="py-3 font-mono font-bold text-slate-800 dark:text-white">{c.adh}</td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                  <div className={`h-full ${c.status === PLAN_HEALTH.CLEARED ? "bg-emerald-500" : "bg-[var(--brand-color)]"} rounded-full`} style={{ width: `${c.pct}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-1">
                                {c.owners.map((owner, oIdx) => (
                                  <span key={oIdx} className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                    owner === "SCS" ? "bg-[var(--brand-color)/15] text-[var(--brand-color-hover)]" :
                                    owner === "PT/IM" ? "bg-indigo-500/15 text-indigo-500" :
                                    owner === "Nutritionist" ? "bg-amber-500/15 text-amber-500" :
                                    owner === "MP" ? "bg-indigo-500/15 text-indigo-500" :
                                    "bg-emerald-500/15 text-emerald-500"
                                  }`}>
                                    {owner}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center gap-1.5 font-bold text-[9px] uppercase ${
                                c.col === "green" ? "text-emerald-500" :
                                c.col === "teal" ? "text-[var(--brand-color)]" : "text-amber-500"
                              }`}>
                                <span className={`size-1.5 rounded-full ${
                                  c.col === "green" ? "bg-emerald-500" :
                                  c.col === "teal" ? "bg-[var(--brand-color)]" : "bg-amber-500"
                                }`}></span>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Active blocks by owner columns */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">CROSS-PERSONA COORDINATION</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active blocks by owner</h3>
                    <p className="text-xs text-slate-500">Each block is owned by at least one role &middot; moves through the linked workspaces</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-full text-[9px] font-bold text-slate-500 uppercase">
                      <span className="size-1.5 rounded-full bg-slate-900 dark:bg-white"></span>
                      5 workspaces
                    </span>
                    <button
                      onClick={() => setViewingAssignmentQueue(true)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Open assignment
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 items-start">

                  {/* SCS Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">SCS</span>
                      <span className="text-[10px] text-slate-400 font-mono">4</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "4-week recovery · Bravo", desc: "Recovery · wk 2 of 4", badge: "Strength", k: "k=24" },
                        { title: "OFT prep · Alpha", desc: "Strength · wk 3 of 6", badge: "Strength", k: "k=22" },
                        { title: "Mobility block · Charlie", desc: "Active · wk 1 of 4", badge: "Mobility", k: "k=20" },
                        { title: "Block A · week 2 sign-off", desc: "Due Fri · 3 signers pending", badge: "Sign-off", k: null, badgeCol: "indigo" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 block">{item.desc}</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              item.badgeCol === "indigo" ? "bg-indigo-500/15 text-indigo-500" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            }`}>{item.badge}</span>
                            {item.k && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 font-mono uppercase">{item.k}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PT/IM Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">PT/IM</span>
                      <span className="text-[10px] text-slate-400 font-mono">3</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Lower-back return-to-duty", desc: "Caseload · wk 3 of 6", badge: "Rehab", k: "k=8" },
                        { title: "Pre-OFT clearance", desc: "Active · wk 1", badge: "Clearance", k: "k=14" },
                        { title: "L4 mobility v2 review", desc: "Caseload · in review", badge: "Review", k: null, badgeCol: "indigo" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 block">{item.desc}</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              item.badgeCol === "indigo" ? "bg-indigo-500/15 text-indigo-500" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            }`}>{item.badge}</span>
                            {item.k && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 font-mono uppercase">{item.k}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MP Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">MP</span>
                      <span className="text-[10px] text-slate-400 font-mono">2</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Stress & sleep reset", desc: "Opt-in · wk 2 of 4", badge: "Mental", k: "k=12" },
                        { title: "Week close reflection", desc: "Scheduled · wk 4", badge: "Reflect", k: null, badgeCol: "indigo" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 block">{item.desc}</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              item.badgeCol === "indigo" ? "bg-indigo-500/15 text-indigo-500" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            }`}>{item.badge}</span>
                            {item.k && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 font-mono uppercase">{item.k}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nutritionist Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">Nutritionist</span>
                      <span className="text-[10px] text-slate-400 font-mono">2</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Hydration ramp", desc: "Caseload · wk 1 of 4", badge: "Hydration", k: "k=18" },
                        { title: "Nutrition prep · OFT", desc: "Active · wk 2", badge: "Nutrition", k: null }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 block">{item.desc}</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[8px] font-bold uppercase">{item.badge}</span>
                            {item.k && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 font-mono uppercase">{item.k}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Purpose Coach Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">Purpose Coach</span>
                      <span className="text-[10px] text-slate-400 font-mono">1</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Mission purpose cohort", desc: "Opt-in · wk 3", badge: "Purpose", k: "k=10" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 block">{item.desc}</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[8px] font-bold uppercase">{item.badge}</span>
                            {item.k && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 font-mono uppercase">{item.k}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Sub footnote */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left">
                PR-W · Reconditioning program · k &ge; 5 enforced · 8 active cohorts
              </div>

            </div>
          )}

        </main>
      </div>

      {viewingAllPlans && (
        <RecordDetailDialog
          open={viewingAllPlans}
          onClose={() => setViewingAllPlans(false)}
          title="All readiness plans"
          subtitle={`${recentPlans.length} plans · last 6 · any status`}
          fields={[]}
        >
          <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden">
            {recentPlans.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-slate-800 dark:text-white truncate">{p.title}</span>
                  <span className="block text-[10px] text-slate-500 truncate">{p.owners} · {p.k} · {p.time}</span>
                </span>
                <span className={`flex-shrink-0 text-[9px] font-bold uppercase ${
                  p.col === "green" ? "text-emerald-500" : "text-[var(--brand-color)]"
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </RecordDetailDialog>
      )}

      {viewingAssignmentQueue && (
        <RecordDetailDialog
          open={viewingAssignmentQueue}
          onClose={() => setViewingAssignmentQueue(false)}
          title="Assignment queue"
          subtitle={`${ASSIGNMENT_QUEUE.length} plans awaiting routing`}
          fields={[]}
        >
          <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden">
            {ASSIGNMENT_QUEUE.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-slate-800 dark:text-white truncate">{item.title}</span>
                  <span className="block text-[10px] text-slate-500 truncate">{item.desc}</span>
                </span>
                <span className={`flex-shrink-0 px-2 py-0.5 text-[9px] font-bold rounded ${
                  item.col === "orange" ? "bg-amber-500/15 text-amber-600" : "bg-[var(--brand-color)/15] text-[var(--brand-color-hover)]"
                }`}>
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </RecordDetailDialog>
      )}

      {/* TOAST NOTIFICATION */}
      {showConfirmToast && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-slide-up border border-slate-800 dark:border-white/5 font-sans">
          <CheckCircle className="size-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <CreateRecordModal
        open={showNewPlanModal}
        onClose={() => setShowNewPlanModal(false)}
        title="New plan"
        subtitle="Create a custom readiness plan. k \u2265 5 is enforced on every aggregate view."
        submitLabel="Create plan"
        fields={[
          { name: "Title", label: "Plan title", type: "text", required: true, placeholder: "e.g. 6-week strength · Alpha" },
          { name: "Description", label: "Description", type: "textarea", required: true, placeholder: "Brief summary · cohort scope · intent" },
          { name: "Owner", label: "Owner", type: "text", required: true, placeholder: "e.g. PT, Chaplain" },
          { name: "Status", label: "Status", type: "select", required: true, options: ["Draft", "Active", "Review"], defaultValue: "Draft" }
        ]}
        onSubmit={(values) => {
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
          const dayStr = now.toLocaleDateString([], { day: "2-digit", month: "short" });
          const status = values.Status || "Draft";
          const isActive = status === "Active";
          const newPlan: RecentPlan = {
            title: values.Title || "Untitled plan",
            desc: values.Description || "Custom plan · just created",
            owners: values.Owner || "SCS",
            k: "k=0",
            status: status,
            col: isActive ? "green" : "teal",
            time: `${dayStr} · ${timeStr}`,
          };
          setRecentPlans([newPlan, ...recentPlans]);
          setShowNewPlanModal(false);
          triggerToast(`Created: ${newPlan.title}`);
        }}
      />

      <CreateRecordModal
        open={showNewBlockModal}
        onClose={() => setShowNewBlockModal(false)}
        title="New reconditioning block"
        subtitle="Initialize a new block. Cross-persona coordination by default."
        submitLabel="Add block"
        fields={[
          { name: "Title", label: "Block title", type: "text", required: true, placeholder: "e.g. Mobility reset · Charlie" },
          { name: "Description", label: "Description", type: "textarea", required: true, placeholder: "Cadence · cohort · focus" },
          { name: "Badge", label: "Badge label", type: "text", placeholder: "e.g. Strength, Mobility" },
          { name: "KeyMetric", label: "Key metric", type: "text", placeholder: "e.g. 12 sessions" }
        ]}
        onSubmit={(values) => {
          const newBlock: PlanBlock = {
            title: values.Title || "Untitled block",
            desc: values.Description || "New block · just created",
            badge: values.Badge || "General",
            k: values.KeyMetric || "",
          };
          setReconditioningBlocks([...reconditioningBlocks, newBlock]);
          setShowNewBlockModal(false);
          triggerToast(`Created: ${newBlock.title}`);
        }}
      />

    </div>
  );
}

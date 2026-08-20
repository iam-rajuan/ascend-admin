"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AscendLogo } from "@/components/ascend-logo";
import { POPULATION_LEVELS, BRIEFING_STATUSES } from "@/lib/terminology";
import { IconButton } from "@/components/ui/icon-button";
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
} from "lucide-react";

type TabType = "index" | "aggregate" | "trends" | "reports" | "briefings";

type ReportRecord = {
  title: string;
  subtext: string;
  type: string;
  scope: string;
  period: string;
  gen: string;
  status: string;
  color: string;
};

type TemplateRecord = {
  cat: string;
  title: string;
  desc: string;
  per: string;
  sub: string;
};

const INITIAL_RECENT_REPORTS: ReportRecord[] = [
  {
    title: "Wing Weekly OPS",
    subtext: "Composite + 5 drivers · 6 flights",
    type: "Weekly",
    scope: POPULATION_LEVELS.ORGANIZATION,
    period: "21 – 27 Jul 2025",
    gen: "28 Jul · 06:00",
    status: BRIEFING_STATUSES.READY,
    color: "green",
  },
  {
    title: "Monthly Cohort Review",
    subtext: "High / mid / watch bands",
    type: "Monthly",
    scope: POPULATION_LEVELS.COHORT,
    period: "Jun 2025",
    gen: "01 Jul · 09:14",
    status: BRIEFING_STATUSES.SENT,
    color: "green",
  },
  {
    title: "Q2 OFT Aggregate",
    subtext: "Pass rate · by-flight · k=125",
    type: "Quarterly",
    scope: POPULATION_LEVELS.ORGANIZATION,
    period: "Apr – Jun 2025",
    gen: "05 Jul · 12:02",
    status: BRIEFING_STATUSES.ARCHIVED,
    color: "green",
  },
  {
    title: "Annual Wing Readiness",
    subtext: "FY 24 → FY 25 comparison",
    type: "Annual",
    scope: POPULATION_LEVELS.ORGANIZATION,
    period: "Aug 2024 – Jul 2025",
    gen: "14 Jul · 16:30",
    status: BRIEFING_STATUSES.PENDING_REVIEW,
    color: "orange",
  },
  {
    title: "Recovery Program Progress",
    subtext: "3 flights · 12-week blocks",
    type: "Ad-hoc",
    scope: POPULATION_LEVELS.UNIT,
    period: "Mar – Jun 2025",
    gen: "02 Jul · 10:00",
    status: BRIEFING_STATUSES.SENT,
    color: "green",
  },
  {
    title: "Sleep Watch Brief",
    subtext: "Delta flight · driver context",
    type: "Ad-hoc",
    scope: POPULATION_LEVELS.UNIT,
    period: "Week of 14 Jul",
    gen: "21 Jul · 07:55",
    status: BRIEFING_STATUSES.DRAFT,
    color: "orange",
  },
];

export default function LeadershipDashboard() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const currentUser = useCurrentUser();
  const [activeTabInternal, setActiveTabInternal] = useState<TabType>("index");
  const [viewingReport, setViewingReport] = useState<ReportRecord | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<TemplateRecord | null>(null);
  const [viewingAllReports, setViewingAllReports] = useState(false);
  const [reportsTypeFilter, setReportsTypeFilter] = useState("All");
  const [recentReports, setRecentReports] = useState<ReportRecord[]>(INITIAL_RECENT_REPORTS);
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [showNewSectionModal, setShowNewSectionModal] = useState(false);

  // Phase 6: Drafts, sent history, and recent exports state for briefing builder
  const [draftsList, setDraftsList] = useState<{ id: string; title: string; status: string; savedAt: string }[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [sentHistory, setSentHistory] = useState<{ id: string; reportId: string; sentAt: string; recipients: string[] }[]>([]);
  const [recentExports, setRecentExports] = useState<{ id: string; sourceId: string; sourceTitle: string; format: string; at: string }[]>([]);
  const [newReportPrefillTitle, setNewReportPrefillTitle] = useState<string>("");
  const [outlineSections, setOutlineSections] = useState<{ num: number; name: string; desc: string; active: boolean }[]>([
    { num: 1, name: "Mission context", desc: "Window · cohort · confidence", active: true },
    { num: 2, name: "Composite OPS trend", desc: "12-mo · k=125 · +3.4 PvP", active: false },
    { num: 3, name: "Driver snapshot", desc: "5 drivers · watch · momentum", active: false },
    { num: 4, name: "By-flight comparison", desc: "6 flights · k \u2265 5 · MoM", active: false },
    { num: 5, name: "Risk & recommendations", desc: "Sleep watch · 1 advisory open", active: false }
  ]);

  // Phase 5: Briefing-builder outline active index (Set A) — drives preview panel below
  const [activeOutlineIdx, setActiveOutlineIdx] = useState<number>(0);

  // Phase 5: Briefing template cards (Set B) — selecting a template swaps the outline
  type BriefingTemplate = {
    title: string;
    desc: string;
    sections: { num: number; name: string; desc: string; preview: string }[];
  };
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number>(0);
  const TEMPLATES: BriefingTemplate[] = [
    {
      title: "Mission Readiness",
      desc: "Composite trend · driver snapshot · OFT pass rate · top risk",
      sections: [
        { num: 1, name: "Mission context", desc: "12-mo window · cohort k=125 · high confidence", preview: "Window covers Aug 2024 \u2013 Jul 2025. Cohort n=125 across 6 flights. Confidence high (k \u2265 5 across all cells)." },
        { num: 2, name: "Composite OPS trend", desc: "Composite +3.4 PvP · Aug 73 \u2192 Jul 76", preview: "Composite OPS lifted 3.4 points to 76 (Aug 73 \u2192 Jul 76). Recovery program rollout in March is the dominant signal." },
        { num: 3, name: "Driver snapshot", desc: "5 drivers · watch: Sleep (-1)", preview: "Physical 78 (+2), Mental 73 (+3), Purpose 75 (+2). Sleep 71 (-1, watch). Emotion 70 (flat)." },
        { num: 4, name: "By-flight comparison", desc: "6 flights · k \u2265 5 · MoM", preview: "Alpha, Bravo, Charlie, Echo, Foxtrot all high confidence. Delta flight flagged at cohort level (sleep watch)." },
        { num: 5, name: "Risk & recommendations", desc: "Sleep watch · 1 advisory open", preview: "Sleep watch open, L2 advisory. No L4+ at the cohort level. Continue recovery program · sleep intervention in Delta." }
      ]
    },
    {
      title: "Recovery Rollout",
      desc: "Multi-flight progress · adherence · recovery signal · open risks",
      sections: [
        { num: 1, name: "Mission context", desc: "Q2-Q3 rollout · 4 flights · adherence window", preview: "Rollout spans 4 flights (Alpha, Bravo, Charlie, Echo) over Q2-Q3 2025. Adherence measured weekly; current avg 78%." },
        { num: 2, name: "Composite OPS trend", desc: "Recovery cohort +5.1 PvP · control +1.4", preview: "Recovery cohort Composite OPS climbed 5.1 points vs control +1.4 over the rollout window. Effect concentrated in weeks 6-12." },
        { num: 3, name: "Driver snapshot", desc: "Sleep +6 · Stress -4 · Purpose +3", preview: "Sleep +6 (recovery cohort), Stress mgmt -4 (sustained), Purpose +3. All other drivers flat. No L4+ triggers." },
        { num: 4, name: "By-flight comparison", desc: "4 active flights · adherence k \u2265 5", preview: "Alpha 81% adherence, Bravo 76%, Charlie 80%, Echo 74%. All k \u2265 5 in outcome cells. No flight flagged at L4+." },
        { num: 5, name: "Risk & recommendations", desc: "Adherence dip Echo · 1 advisory", preview: "Echo flight adherence dip in week 7; L2 advisory only. Recommend weekly check-in continuation. No operational gate changes." }
      ]
    },
    {
      title: "Quarterly Wing Review",
      desc: "FY-quarter comparison · cohort bands · recommendations · next quarter",
      sections: [
        { num: 1, name: "Mission context", desc: "FY-quarter · 3 quarters · k \u2265 5", preview: "Covers Q2-Q4 FY25. Cohort k \u2265 5 across all sections. Includes prior-year (FY24) comparison where data exists." },
        { num: 2, name: "Composite OPS trend", desc: "Q2 71 \u2192 Q3 74 \u2192 Q4 76", preview: "Composite OPS Q2 71 \u2192 Q3 74 \u2192 Q4 76. Recovery program lift concentrated in Q3. Sustained gain into Q4." },
        { num: 3, name: "Driver snapshot", desc: "Bands · high 28 / mid 64 / watch 33", preview: "Cohort bands Q4: high 28%, mid 51%, watch 21%. Sleep watch band down 4 pts from Q3. Purpose flat across bands." },
        { num: 4, name: "By-flight comparison", desc: "6 flights · YoY · MoM", preview: "Year-over-year: 4 of 6 flights up vs FY24. Month-over-month: 5 of 6 stable, Delta flagged (sleep watch)." },
        { num: 5, name: "Risk & recommendations", desc: "Sleep watch · 2 advisories · next Q plan", preview: "2 L2 advisories open (Sleep watch, Echo adherence). Q1 FY26 plan: continue recovery, open sleep intervention, close 1 advisory by end of Q1." }
      ]
    }
  ];
  const { theme, mounted: hasMounted, toggleTheme } = useTheme();
  const { show: showConfirmToast, message: toastMessage, triggerToast } = useToast();

  const setActiveTab = (tab: TabType) => {
    setActiveTabInternal(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem("ascend_leadership_active_tab", tab);
    }
  };

  const activeTab = activeTabInternal;

  // Load persistent active tab on client mount
  useEffect(() => {
    const savedTab = localStorage.getItem("ascend_leadership_active_tab") as TabType | null;
    if (savedTab && ["index", "aggregate", "trends", "reports", "briefings"].includes(savedTab)) {
      setActiveTabInternal(savedTab);
    }
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
      <aside className="w-64 bg-white dark:bg-[#0e1628] text-slate-600 dark:text-slate-300 flex flex-col justify-between border-r border-slate-200 dark:border-white/5 flex-shrink-0 z-30">
        <div>
          {/* Top Sidebar Header */}
          <div className="p-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200">
              <span className="size-2 rounded-full bg-[var(--brand-color)]"></span>
              <span className="text-xs font-bold font-sans">Leadership</span>
            </div>
          </div>

          {/* Navigation links */}
          <div className="p-4 space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block px-3">
                WORKSPACE
              </span>
              <nav className="space-y-1 mt-2">
                <button
                  onClick={() => setActiveTab("index")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer ${
                    activeTab === "index"
                      ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Home className="size-4" />
                  Index
                </button>
                <button
                  onClick={() => setActiveTab("aggregate")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer ${
                    activeTab === "aggregate"
                      ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Sliders className="size-4" />
                  Aggregate
                </button>
                <button
                  onClick={() => setActiveTab("trends")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer ${
                    activeTab === "trends"
                      ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <TrendingUp className="size-4" />
                  Trends
                </button>
                <button
                  onClick={() => setActiveTab("reports")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer ${
                    activeTab === "reports"
                      ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <FileText className="size-4" />
                  Reports
                </button>
                <button
                  onClick={() => setActiveTab("briefings")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer ${
                    activeTab === "briefings"
                      ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Layers className="size-4" />
                  Briefings
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Sidebar Footer / Controls */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 space-y-2">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            My profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition cursor-pointer"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* RIGHT WORKSPACE WRAPPER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* 1. TOP HEADER BAR */}
        <header className="flex h-14 w-full items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0e1628] px-6 md:px-8 flex-shrink-0 z-20">
          {/* Brand/Shield Logo */}
          <div className="flex items-center gap-2">
            <AscendLogo width={20} height={20} showDetails={false} />
            <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">Ascend</span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            
            {/* Active Role Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <span className="size-1.5 rounded-full bg-slate-300"></span>
              <span>Leadership</span>
            </div>

            {/* Profile Dropdown */}
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="flex items-center gap-2.5 pl-2 border-l border-slate-100 dark:border-white/5 text-slate-800 dark:text-white cursor-pointer"
              type="button"
            >
              <div className="size-7 rounded-full bg-slate-200 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs">
                {currentUser?.initials}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-[11px] font-bold leading-none">
                  {currentUser?.name}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 leading-none">
                  {currentUser?.unit}
                </span>
              </div>
              <ChevronDown className="size-3.5 text-slate-400" />
            </button>

            {/* Notification Bell */}
            <IconButton
              icon={Bell}
              aria-label="Notifications"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            />

            {/* Theme Toggle */}
            <IconButton
              icon={theme === "light" ? Moon : Sun}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              onClick={toggleTheme}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            />

          </div>
        </header>

        {/* 2. CUI BANNER */}
        <section className="flex h-9 w-full items-center justify-center bg-[#101b22] px-6 text-center text-[10px] font-semibold tracking-wider text-slate-400 select-none flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[var(--brand-color)]"></span>
            <span>CUI // OPSEC · Not a Government System of Record</span>
          </div>
        </section>

        {/* 3. MAIN SCROLLABLE VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#f8fafc] dark:bg-[#070a13] space-y-8">
          
          {activeTab === "index" && (
            <div className="space-y-8 animate-fade-in">
              {/* Privacy/Aggregate warning box */}
              <div className="bg-slate-900 text-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-800 dark:border-white/5 flex gap-3 text-xs leading-relaxed">
                <Shield className="size-5 text-[var(--brand-color)] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Aggregate views enforce k &ge; 5 &mdash; no group smaller than 5 is shown</span>
                  <p className="mt-0.5 text-slate-400 dark:text-slate-400">
                    Individual identifiers are never exposed. By design, leadership surfaces show flights, cohorts, and periods only &mdash; never operators.
                  </p>
                </div>
              </div>

              {/* Title Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">LEADERSHIP · WORKSPACE</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Leadership</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Five aggregate surfaces. Composite OPS leads, drivers support, by-flight is utility. Every figure represents cohorts where k &ge; 5.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("aggregate")}
                  className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer self-start md:self-center transition"
                >
                  <Activity className="size-3.5" /> Open Aggregate
                </button>
              </div>

              {/* Actionable — leads the page per Req 3: pending work first,
                  decorative surface tiles below. */}
              <button
                onClick={() => setActiveTab("briefings")}
                type="button"
                className="w-full flex items-center justify-between gap-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-left hover:bg-amber-500/15 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-500 font-black text-sm">1</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">1 briefing pending review</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Annual Wing Readiness &middot; {BRIEFING_STATUSES.PENDING_REVIEW}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Review &rarr;</span>
              </button>

              {/* Surfaces section */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider">SURFACES</p>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Leadership workspace</h2>
                    <p className="text-xs text-slate-500">Five surfaces · aggregate only · k &ge; 5 enforced on every figure</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-white/5 rounded text-[10px] font-bold font-mono text-slate-500">
                    CUI · k &ge; 5
                  </span>
                </div>

                {/* 4 Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Card 1: Aggregate */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("aggregate")}
                    className="group w-full bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-250 cursor-pointer space-y-4 text-left"
                  >
                    <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-[var(--brand-color)] transition-colors">01</span>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-[var(--brand-color)] transition-colors">Aggregate</h3>
                      <p className="text-xs text-slate-500 leading-normal">Hero trend · driver tiles · by-flight comparison</p>
                    </div>
                  </button>

                  {/* Card 2: Trends */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("trends")}
                    className="group w-full bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-250 cursor-pointer space-y-4 text-left"
                  >
                    <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-[var(--brand-color)] transition-colors">02</span>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-[var(--brand-color)] transition-colors">Trends</h3>
                      <p className="text-xs text-slate-500 leading-normal">7d / 30d / 3&ndash;12 mo · MoM · PvP comparison</p>
                    </div>
                  </button>

                  {/* Card 3: Reports */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("reports")}
                    className="group w-full bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-250 cursor-pointer space-y-4 text-left"
                  >
                    <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-[var(--brand-color)] transition-colors">03</span>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-[var(--brand-color)] transition-colors">Reports</h3>
                      <p className="text-xs text-slate-500 leading-normal">Weekly · Monthly · Quarterly · Annual aggregate</p>
                    </div>
                  </button>

                  {/* Card 4: Briefings */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("briefings")}
                    className="group w-full bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-250 cursor-pointer space-y-4 text-left"
                  >
                    <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-[var(--brand-color)] transition-colors">04</span>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-[var(--brand-color)] transition-colors">Briefings</h3>
                      <p className="text-xs text-slate-500 leading-normal">Mission · readiness · risk · recommendations</p>
                    </div>
                  </button>

                </div>
              </div>
            </div>
          )}

          {/* Tab 2: AGGREGATE VIEW */}
          {activeTab === "aggregate" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Title Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">LEADERSHIP · AGGREGATE</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Aggregate readiness</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Composite OPS trend leads the view. Drivers support, by-flight is utility &mdash; every figure represents cohorts where k &ge; 5
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400">
                    <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-bold">MoM</button>
                    <button className="px-3 py-1 font-medium">PvP</button>
                  </div>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="px-3 py-2 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 transition text-slate-700 dark:text-slate-300"
                  >
                    <FileText className="size-3.5" /> Reports library
                  </button>
                  <button
                    onClick={() => setActiveTab("trends")}
                    className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <TrendingUp className="size-3.5" /> Open trends
                  </button>
                </div>
              </div>

              {/* 12-Month Readiness Hero Card with soft cyan outer container */}
              <div className="bg-[#e0f2fe]/50 dark:bg-sky-950/10 border border-[#bae6fd]/50 dark:border-white/5 rounded-[32px] p-2 shadow-sm text-left">
                <div className="bg-white dark:bg-[#0e1628] rounded-[28px] p-6 md:p-8 space-y-6">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">COMPOSITE OPS · WING</span>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-1">12-month readiness, lifted by recovery rollout</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">Cohort k = 125 · last 12 months</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-[9px] font-bold text-slate-500 uppercase">
                        {POPULATION_LEVELS.ORGANIZATION}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        <span className="size-1.5 rounded-full bg-emerald-500"></span>
                        High
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                    
                    {/* Left Big stats stack */}
                    <div className="lg:col-span-4 space-y-6 text-left">
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-7xl font-black tracking-tight text-slate-800 dark:text-white leading-none">76</span>
                          <span className="text-lg font-bold text-[#94a3b8] dark:text-slate-400 leading-none">+1.2</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 border-t border-slate-100 dark:border-white/5 pt-4 text-left">
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 block uppercase leading-tight">Period start</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 block">Aug 2024 - 68</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 block uppercase leading-tight">Period end</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 block">Jul 2025 - 76</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 block uppercase leading-tight">MoM delta</span>
                          <span className="text-[10px] font-bold text-emerald-500 mt-1 block">+3.4</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 block uppercase leading-tight">Target</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 block">75</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Trend Chart */}
                    <div className="lg:col-span-8 h-60 w-full relative">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none select-none">
                        <div className="w-full border-t border-dashed border-slate-100 dark:border-white/5"></div>
                        <div className="w-full border-t border-dashed border-slate-100 dark:border-white/5"></div>
                        <div className="w-full border-t border-dashed border-slate-100 dark:border-white/5"></div>
                        <div className="w-full border-t border-dashed border-slate-100 dark:border-white/5"></div>
                      </div>
                      
                      <svg className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path
                          d="M 0 65 L 9 60 L 18 55 L 27 50 L 36 53 L 45 48 L 54 44 L 63 42 L 72 38 L 81 33 L 90 28 L 100 24 L 100 100 L 0 100 Z"
                          fill="url(#hero-gradient)"
                          opacity="0.08"
                        />
                        <path
                          d="M 0 65 L 9 60 L 18 55 L 27 50 L 36 53 L 45 48 L 54 44 L 63 42 L 72 38 L 81 33 L 90 28 L 100 24"
                          fill="none"
                          stroke="var(--brand-color)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <defs>
                          <linearGradient id="hero-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--brand-color)" />
                            <stop offset="100%" stopColor="var(--brand-color)" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>

                      {/* X-Axis labels */}
                      <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[9px] font-bold text-slate-400 font-mono">
                        <span>Aug</span>
                        <span>Sep</span>
                        <span>Oct</span>
                        <span>Nov</span>
                        <span>Dec</span>
                        <span>Jan</span>
                        <span>Feb</span>
                        <span>Mar</span>
                        <span>Apr</span>
                        <span>May</span>
                        <span>Jun</span>
                        <span>Jul</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* 4 Cards Grid metrics overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-2 text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Flight readiness</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">76</span>
                    <span className="text-xs font-bold text-slate-400 leading-none">k=125</span>
                  </div>
                  <div>
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 leading-none">+1.2 MoM</span>
                  </div>
                </div>
                <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-2 text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">OFT pass rate</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">92</span>
                    <span className="text-xs font-bold text-slate-400 leading-none">%</span>
                  </div>
                  <div>
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 leading-none">+1.0 MoM</span>
                  </div>
                </div>
                <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-2 text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Sleep driver</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">71</span>
                  </div>
                  <div>
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-500 leading-none">-1 MoM · watch</span>
                  </div>
                </div>
                <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-2 text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Recovery program</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">3</span>
                    <span className="text-xs font-bold text-slate-500 leading-none">flights</span>
                  </div>
                  <div>
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 leading-none">on track</span>
                  </div>
                </div>
              </div>

              {/* SUPPORTING SIGNAL · Driver trends */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">SUPPORTING SIGNAL</span>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Driver trends</h3>
                    <p className="text-xs text-slate-500">5 drivers · sparkline + delta · month-over-month</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5">Physical 78</span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5">Sleep 71</span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5">Mental 72</span>
                  </div>
                </div>

                {/* 5 Driver cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                  {[
                    { name: "Physical", val: 78, chg: "+2", color: "green", status: "High", path: "M0,15 L15,12 L30,18 L45,8 L60,10 L75,4" },
                    { name: "Sleep", val: 71, chg: "-1", color: "orange", status: "Watch", path: "M0,6 L15,10 L30,5 L45,15 L60,18 L75,14" },
                    { name: "Mental", val: 73, chg: "+2", color: "green", status: "High", path: "M0,18 L15,15 L30,12 L45,10 L60,8 L75,5" },
                    { name: "Nutrition", val: 72, chg: "+1", color: "green", status: "Stable", path: "M0,12 L15,12 L30,14 L45,8 L60,6 L75,6" },
                    { name: "Purpose", val: 75, chg: "+2", color: "green", status: "High", path: "M0,15 L15,16 L30,12 L45,10 L60,8 L75,4" },
                  ].map((drv, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{drv.name}</span>
                        <span className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase rounded-full ${
                          drv.color === "green" ? "text-emerald-500" : "text-amber-500"
                        }`}>
                          <span className={`size-1.5 rounded-full ${drv.color === "green" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                          {drv.status}
                        </span>
                      </div>
                      
                      <div className="flex items-end justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{drv.val}</span>
                          <span className={`text-[10px] font-bold ${drv.chg.includes("+") ? "text-emerald-500" : "text-red-500"}`}>
                            {drv.chg}
                          </span>
                        </div>
                        <svg className={`h-6 w-16 ${drv.color === "green" ? "text-emerald-500" : "text-amber-500"}`} viewBox="0 0 75 20" fill="none">
                          <path d={drv.path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>

                      <div className="text-[9px] text-slate-400 font-mono">12 mo · k=125</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By-flight comparison & Risk Heatmap split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                
                {/* By-flight comparison */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[var(--brand-color)]"></span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">By-flight comparison</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 text-[9px] font-bold rounded">
                      6 flights · k &ge; 5
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 -mt-2">Scope: {POPULATION_LEVELS.UNIT} &middot; Readiness, MoM delta, confidence. Aggregate only &mdash; never individuals.</p>

                  <div className="overflow-x-auto text-[11px]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5 uppercase text-[9px] font-semibold">
                          <th className="pb-2">FLIGHT</th>
                          <th className="pb-2">READINESS</th>
                          <th className="pb-2 text-center">MOM</th>
                          <th className="pb-2">CONFIDENCE</th>
                          <th className="pb-2 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                        {[
                          { name: "Alpha", read: 76, mom: "+2.0", conf: "High", color: "green" },
                          { name: "Bravo", read: 74, mom: "+1.1", conf: "High", color: "green" },
                          { name: "Charlie", read: 77, mom: "+2.8", conf: "High", color: "green" },
                          { name: "Delta", read: 73, mom: "-0.4", conf: "Medium", color: "orange" },
                          { name: "Echo", read: 75, mom: "+1.4", conf: "High", color: "green" },
                          { name: "Foxtrot", read: 76, mom: "+1.2", conf: "High", color: "green" },
                        ].map((row, idx) => (
                          <tr key={idx} className="align-middle">
                            <td className="py-2.5 font-bold text-slate-800 dark:text-white">{row.name}</td>
                            <td className="py-2.5 w-1/3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold font-mono">{row.read}</span>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-[var(--brand-color)] rounded-full" style={{ width: `${row.read}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className={`py-2.5 text-center font-mono font-bold ${row.mom.includes("-") ? "text-red-500" : "text-emerald-500"}`}>
                              {row.mom}
                            </td>
                            <td className="py-2.5">
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${
                                row.color === "green" ? "text-emerald-500" : "text-amber-500"
                              }`}>
                                <span className={`size-1.5 rounded-full ${row.color === "green" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                                {row.conf}
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => {
                                  setActiveTab("trends");
                                  triggerToast(`Viewing trend analysis for ${row.name} Flight.`);
                                }}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-850 hover:bg-[var(--brand-color)] hover:text-white dark:hover:bg-[var(--brand-color)] rounded-lg text-[9px] font-bold cursor-pointer transition text-slate-600 dark:text-slate-400"
                              >
                                Trend
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Risk Heatmap matrix grid */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[var(--brand-color)]"></span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Risk heatmap</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 text-[9px] font-bold rounded">
                      No cells below k=5
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 -mt-2">Scope: {POPULATION_LEVELS.UNIT} &middot; Flight + driver signal &mdash; cohort-level only</p>

                  {/* Heatmap table */}
                  <div className="overflow-x-auto text-[10px] font-sans">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5 uppercase text-[8px] font-bold">
                          <th className="pb-2 text-left font-bold w-16"></th>
                          <th className="pb-2">A</th>
                          <th className="pb-2">B</th>
                          <th className="pb-2">C</th>
                          <th className="pb-2">D</th>
                          <th className="pb-2">E</th>
                          <th className="pb-2">F</th>
                          <th className="pb-2 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {[
                          { name: "Physical", cells: ["L1", "L2", "L1", "L3", "L2", "L1"] },
                          { name: "Sleep", cells: ["L2", "L3", "L2", "L4", "L2", "L3"] },
                          { name: "Mental", cells: ["L1", "L2", "L2", "L3", "L1", "L2"] },
                          { name: "Nutrition", cells: ["L2", "L1", "L2", "L3", "L2", "L1"] },
                          { name: "Purpose", cells: ["L1", "L2", "L1", "L2", "L1", "L2"] },
                        ].map((row, idx) => (
                          <tr key={idx} className="align-middle">
                            <td className="py-2.5 font-bold text-slate-400 uppercase text-[9px] text-left">{row.name}</td>
                            {row.cells.map((cell, cIdx) => (
                              <td key={cIdx} className="py-2.5">
                                <span className={`inline-flex size-2.5 rounded-full ${
                                  cell === "L1" ? "bg-[#3b82f6]" :
                                  cell === "L2" ? "bg-[#10b981]" :
                                  cell === "L3" ? "bg-[#f59e0b]" :
                                  cell === "L4" ? "bg-[#f97316]" : "bg-[#ef4444]"
                                }`}></span>
                              </td>
                            ))}
                            <td className="py-2.5 font-semibold text-slate-800 dark:text-white text-right">{row.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Heatmap Legend */}
                  <div className="flex items-center gap-4 text-[9px] pt-3 border-t border-slate-100 dark:border-white/5 justify-start">
                    <span className="font-bold text-slate-500 uppercase">Legend:</span>
                    <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-[#3b82f6]"></span> L1</span>
                    <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-[#10b981]"></span> L2</span>
                    <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-[#f59e0b]"></span> L3</span>
                    <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-[#f97316]"></span> L4</span>
                    <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-[#ef4444]"></span> L5</span>
                  </div>
                </div>

              </div>

              {/* Footnote */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left">
                Leadership · Aggregate · k &ge; 5 · CUI
              </div>

              {/* Bottom 3 Cards Target Registry */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                
                {/* Card 1: 6 Mo target */}
                <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Assessment · 6 mo target</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-800 dark:text-white">50%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-sans">
                    <span className="text-slate-400">Actual</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">52%</span>
                    <span className="font-bold text-emerald-500">on track</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal pt-2 border-t border-slate-100 dark:border-white/5">
                    Period: rolling 6 mo &middot; Owner: PT/IM &middot; Action: continue weekly cadence
                  </p>
                </div>

                {/* Card 2: 12 Mo target */}
                <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Assessment · 12 mo target</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-800 dark:text-white">90%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-sans">
                    <span className="text-slate-400">Projected</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">88%</span>
                    <span className="font-bold text-amber-500">watch</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal pt-2 border-t border-slate-100 dark:border-white/5">
                    Period: rolling 12 mo &middot; Owner: SCS &middot; Action: re-engage 4 deferred
                  </p>
                </div>

                {/* Card 3: Feedback sessions */}
                <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Feedback sessions</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-800 dark:text-white">38 / 125</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-sans">
                    <span className="font-bold text-slate-500">30% completed this quarter</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal pt-2 border-t border-slate-100 dark:border-white/5">
                    Period: Q3 &middot; Owner: PT/IM &middot; Action: schedule 12 by 15 Aug
                  </p>
                </div>
              </div>

              {/* Bottom 2 Cards section hours coverage & OFT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                
                {/* SCS + PT/IM hours coverage */}
                <div className="lg:col-span-7 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">SCS + PT/IM hours coverage</h3>
                      <p className="text-[10px] text-slate-500">Scheduled + worked · 95% target · progress toward contract</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded uppercase">
                      95% target
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 block">SCS SCHEDULED (WK)</span>
                      <p className="text-lg font-bold text-slate-800 dark:text-white">160</p>
                      <p className="text-[10px] text-slate-400 font-mono">YTD 1,120 / 2,800</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 block">SCS WORKED (WK)</span>
                      <p className="text-lg font-bold text-slate-800 dark:text-white">152</p>
                      <p className="text-[10px] text-slate-400 font-mono">95% of scheduled</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 block">PT/IM SCHEDULED (WK)</span>
                      <p className="text-lg font-bold text-slate-800 dark:text-white">42</p>
                      <p className="text-[10px] text-slate-400 font-mono">YTD 248 / 512</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 block">MISSED COVERAGE</span>
                      <p className="text-lg font-bold text-slate-800 dark:text-white">8</p>
                      <p className="text-[10px] text-slate-400 font-mono">2 due to leave</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">RSD coverage (separate)</span>
                      <p className="text-[10px] text-slate-500 leading-normal">Restricted-status duty sessions tracked separately from regular hours.</p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded uppercase">
                      24 / 28
                    </span>
                  </div>
                </div>

                {/* Monthly OFT reporting */}
                <div className="lg:col-span-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Monthly OFT reporting</h3>
                      <p className="text-[10px] text-slate-500">Status · pass rate · reconditioning · next due</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded">
                      k = 125
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-sans">
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 block">CURRENT</span>
                      <p className="text-lg font-bold text-slate-800 dark:text-white">104</p>
                      <span className="text-[9px] text-slate-500 block font-bold leading-normal uppercase">TESTS CONDUCTED</span>
                      <p className="text-lg font-bold text-slate-800 dark:text-white mt-2">22</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 block">NOT CURRENT</span>
                      <p className="text-lg font-bold text-slate-800 dark:text-white">17</p>
                      <span className="text-[9px] text-[var(--brand-color)] block font-bold leading-normal uppercase">PASS RATE</span>
                      <p className="text-lg font-bold text-slate-800 dark:text-white mt-2">92%</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 block">EXEMPT</span>
                      <p className="text-lg font-bold text-slate-800 dark:text-white">4</p>
                      <span className="text-[9px] text-slate-500 block font-bold leading-normal uppercase">IN RECOND.</span>
                      <p className="text-lg font-bold text-slate-800 dark:text-white mt-2">9</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Next due (rolling 30d)</span>
                      <p className="text-[10px] text-slate-500 leading-normal">Score-entry via OFT lead &mdash; exemption reason captured in audit log.</p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded uppercase">
                      23 entries
                    </span>
                  </div>
                </div>

              </div>

              <div className="space-y-1 border-t border-slate-200 dark:border-white/5 pt-4 text-[10px] text-slate-400 leading-relaxed font-sans">
                <p>Privacy & cohort suppression · This view shows flights and cohorts only. No individual identifiers appear. Cells where k = 5 are suppressed and shown as "—". Exports inherit the same suppression.</p>
                <p>Aggregate-only · no individual drill-down · no individual reports · UI gate &sect;7.5</p>
              </div>

            </div>
          )}

          {/* Tab 3: TRENDS VIEW */}
          {activeTab === "trends" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Title Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">LEADERSHIP · TRENDS</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Trends</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Period selector, MoM / PvP comparison, and annotated events. Composite trend leads; drivers and cohorts support the read.
                  </p>
                </div>
                
                {/* Period & Comparison Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400">
                    <button className="px-2.5 py-1 font-medium">7d</button>
                    <button className="px-2.5 py-1 font-medium">30d</button>
                    <button className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-bold text-slate-800 dark:text-white">3 mo</button>
                    <button className="px-2.5 py-1 font-medium">6 mo</button>
                    <button className="px-2.5 py-1 font-medium">12 mo</button>
                  </div>
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400">
                    <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-bold text-slate-800 dark:text-white">MoM</button>
                    <button className="px-3 py-1 font-medium">PvP</button>
                  </div>
                </div>
              </div>

              {/* Trends Compare Cohorts Warning Box */}
              <div className="bg-slate-900 text-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-800 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-left">
                <Shield className="size-5 text-[var(--brand-color)] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Trends compare cohorts &mdash; never individuals</span>
                  <p className="mt-0.5 text-slate-400 dark:text-slate-400 font-normal">
                    Driver trends and period deltas are computed against cohorts where k &ge; 5 is satisfied at every data point in the window.
                  </p>
                </div>
              </div>

              {/* Main Chart Hero Panel with nested cyan frame */}
              <div className="bg-[#e0f2fe]/50 dark:bg-sky-950/10 border border-[#bae6fd]/50 dark:border-white/5 rounded-[32px] p-2 shadow-sm text-left">
                <div className="bg-white dark:bg-[#0e1628] rounded-[28px] p-6 md:p-8 space-y-6">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">COMPOSITE OPS · 12 MONTH</span>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-1">Composite OPS, with annotated material events</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Period: 12 months &middot; comparison: month over month &middot; cohort k = 125 &middot; Scope: {POPULATION_LEVELS.ORGANIZATION}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                    
                    {/* Left Big stats stack */}
                    <div className="lg:col-span-4 space-y-6 text-left">
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-7xl font-black tracking-tight text-slate-800 dark:text-white leading-none">76</span>
                          <span className="text-lg font-bold text-emerald-500 leading-none">+3.4</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 border-t border-slate-100 dark:border-white/5 pt-4 text-left">
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 block uppercase leading-tight">Aug 2024</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 block">68</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 block uppercase leading-tight">Jul 2025</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 block">76</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 block uppercase leading-tight">12-mo high</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 block">76</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 block uppercase leading-tight">12-mo low</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 block">60</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Trend Chart */}
                    <div className="lg:col-span-8 h-60 w-full relative">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none select-none">
                        <div className="w-full border-t border-dashed border-slate-100 dark:border-white/5"></div>
                        <div className="w-full border-t border-dashed border-slate-100 dark:border-white/5"></div>
                        <div className="w-full border-t border-dashed border-slate-100 dark:border-white/5"></div>
                        <div className="w-full border-t border-dashed border-slate-100 dark:border-white/5"></div>
                      </div>
                      
                      <svg className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path
                          d="M 0 65 L 9 60 L 18 55 L 27 50 L 36 53 L 45 48 L 54 44 L 63 42 L 72 38 L 81 33 L 90 28 L 100 24 L 100 100 L 0 100 Z"
                          fill="url(#trends-gradient)"
                          opacity="0.08"
                        />
                        <path
                          d="M 0 65 L 9 60 L 18 55 L 27 50 L 36 53 L 45 48 L 54 44 L 63 42 L 72 38 L 81 33 L 90 28 L 100 24"
                          fill="none"
                          stroke="var(--brand-color)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <defs>
                          <linearGradient id="trends-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--brand-color)" />
                            <stop offset="100%" stopColor="var(--brand-color)" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>

                      {/* X-Axis labels */}
                      <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[9px] font-bold text-slate-400 font-mono">
                        <span>Aug</span>
                        <span>Sep</span>
                        <span>Oct</span>
                        <span>Nov</span>
                        <span>Dec</span>
                        <span>Jan</span>
                        <span>Feb</span>
                        <span>Mar</span>
                        <span>Apr</span>
                        <span>May</span>
                        <span>Jun</span>
                        <span>Jul</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Drivers Section */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">DRIVERS</span>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Driver trends</h3>
                    <p className="text-xs text-slate-500">5 drivers &middot; sparkline + delta &middot; month over month</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5">Physical</span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5">Sleep</span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5">Mental</span>
                  </div>
                </div>

                {/* 5 Driver cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                  {[
                    { name: "Physical", val: 78, chg: "+2", color: "green", status: "High", path: "M0,15 L15,12 L30,18 L45,8 L60,10 L75,4" },
                    { name: "Sleep", val: 71, chg: "-1", color: "orange", status: "Watch", path: "M0,6 L15,10 L30,5 L45,15 L60,18 L75,14" },
                    { name: "Mental", val: 73, chg: "+2", color: "green", status: "High", path: "M0,18 L15,15 L30,12 L45,10 L60,8 L75,5" },
                    { name: "Nutrition", val: 72, chg: "+1", color: "green", status: "Stable", path: "M0,12 L15,12 L30,14 L45,8 L60,6 L75,6" },
                    { name: "Purpose", val: 75, chg: "+2", color: "green", status: "High", path: "M0,15 L15,16 L30,12 L45,10 L60,8 L75,4" },
                  ].map((drv, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{drv.name}</span>
                        <span className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase rounded-full ${
                          drv.color === "green" ? "text-emerald-500" : "text-amber-500"
                        }`}>
                          <span className={`size-1.5 rounded-full ${drv.color === "green" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                          {drv.status}
                        </span>
                      </div>
                      
                      <div className="flex items-end justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{drv.val}</span>
                          <span className={`text-[10px] font-bold ${drv.chg.includes("+") ? "text-emerald-500" : "text-red-500"}`}>
                            {drv.chg}
                          </span>
                        </div>
                        <svg className={`h-6 w-16 ${drv.color === "green" ? "text-emerald-500" : "text-amber-500"}`} viewBox="0 0 75 20" fill="none">
                          <path d={drv.path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>

                      <div className="text-[9px] text-slate-400 font-mono">12 mo &middot; k=125</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Columns Breakdown & Annotated events */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                
                {/* Cohort trend breakdown */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[var(--brand-color)]"></span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cohort trend breakdown</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 text-[9px] font-bold rounded">
                      3 cohorts · k &ge; 5
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 -mt-2">Scope: {POPULATION_LEVELS.COHORT} &middot; By readiness band · cohort-level deltas</p>

                  <div className="space-y-4 pt-2 font-sans text-xs">
                    {[
                      { label: "High readiness", pct: 70, val: "+2.6", color: "bg-[var(--brand-color)]", textCol: "text-emerald-500" },
                      { label: "Mid readiness", pct: 60, val: "+3.8", color: "bg-[var(--brand-color)]", textCol: "text-emerald-500" },
                      { label: "Watch band", pct: 25, val: "-1.2", color: "bg-amber-500", textCol: "text-red-500" },
                    ].map((band, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200 w-28 flex-shrink-0">{band.label}</span>
                        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                          <div className={`h-full ${band.color} rounded-full`} style={{ width: `${band.pct}%` }}></div>
                        </div>
                        <span className={`w-10 text-right font-mono font-bold ${band.textCol}`}>{band.val}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[9px] text-slate-400 leading-normal pt-4 border-t border-slate-100 dark:border-white/5">
                    All cohorts meet k &ge; 5. Numbers are aggregate and may not be summed across bands.
                  </p>
                </div>

                {/* Annotated events */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[var(--brand-color)]"></span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Annotated events</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 text-[9px] font-bold rounded uppercase">
                      Editorial
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 -mt-2">Material context for period deltas</p>

                  {/* Vertical Timeline registry */}
                  <div className="relative pl-6 border-l-2 border-slate-100 dark:border-white/5 space-y-6 ml-2 text-xs font-sans">
                    {[
                      {
                        date: "JAN 2025",
                        title: "Winter surge · L4 injuries",
                        desc: "Spike in L4 overuse injuries across flights Bravo and Delta. Sleep and recovery drivers dropped concurrently.",
                        dotCol: "bg-emerald-500"
                      },
                      {
                        date: "MAR 2025",
                        title: "Recovery program rollout",
                        desc: "SCS-led recovery protocol activated; physical and mental driver curves inflected upward.",
                        dotCol: "bg-emerald-500"
                      },
                      {
                        date: "MAY 2025",
                        title: "OFT cycle Q2",
                        desc: "Pass rate held at 92% cohort-wide; OFT pass-rate now part of executive summary header.",
                        dotCol: "bg-[#3b82f6]"
                      },
                      {
                        date: "JUL 2025",
                        title: "Sleep watch",
                        desc: "Sleep driver trended -1 MoM &mdash; Delta flight flagged at cohort level. Routing Level 2 advisory opened.",
                        dotCol: "bg-slate-400"
                      }
                    ].map((evt, idx) => (
                      <div key={idx} className="relative space-y-1">
                        {/* Timeline Bullet circle */}
                        <span className={`absolute -left-[31px] top-1.5 size-2.5 rounded-full border-2 border-white dark:border-[#0e1628] ${evt.dotCol}`}></span>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-bold text-[var(--brand-color)] tracking-wide block uppercase">{evt.date}</span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white">{evt.title}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{evt.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Footnote */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left">
                Leadership · Trends · k &ge; 5 · CUI
              </div>

              {/* Privacy Caption text */}
              <div className="space-y-1 border-t border-slate-200 dark:border-white/5 pt-4 text-[10px] text-slate-400 leading-relaxed font-sans">
                <p>Privacy & cohort suppression · Trends show cohort + period only. Cells where k &lt; 5 are suppressed and shown as "—". Exports inherit the same suppression.</p>
                <p>Aggregate-only · no individual drill-down · no individual exports · UI gate &sect;7.5</p>
              </div>

            </div>
          )}

          {/* Tab 4: REPORTS VIEW */}
          {activeTab === "reports" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">LEADERSHIP · REPORTS LIBRARY</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Reports</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Weekly, monthly, quarterly, and annual aggregate reports. Every export carries the k &ge; 5 statement and is CUI-labelled.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => triggerToast("Opening export registry library")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Download className="size-4" /> Export library
                  </button>
                  <button
                    onClick={() => setShowNewReportModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> New report
                  </button>
                </div>
              </div>

              {/* Warning Banner */}
              <div className="bg-slate-900 text-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-800 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-left">
                <Shield className="size-5 text-[var(--brand-color)] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Reports are aggregate only &middot; k &ge; 5 enforced</span>
                  <p className="mt-0.5 text-slate-400 dark:text-slate-400 font-normal">
                    Any report containing fewer than 5 individuals is suppressed. Schedule exports or generate one-off aggregate reports from this library.
                  </p>
                </div>
              </div>

              {/* Tabs and Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {["All", "Weekly", "Monthly", "Quarterly", "Annual", "Ad-hoc"].map((pill, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReportsTypeFilter(pill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                        pill === reportsTypeFilter
                          ? "bg-[var(--brand-color)/10] border-[var(--brand-color)/30] text-[var(--brand-color)]"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      {pill}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    aria-label="Search by title, flight, or cohort"
                    placeholder="Search by title, flight, or cohort"
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--brand-color)/50] transition"
                  />
                </div>
              </div>

              {/* Recent reports list card container */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent reports</h3>
                    <p className="text-[10px] text-slate-500">Last 6 &middot; aggregate &middot; k &ge; 5</p>
                  </div>
                  <button
                    onClick={() => setViewingAllReports(true)}
                    className="px-3 py-1 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
                  >
                    View all
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                        <th className="pb-3 w-1/3">Title</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Scope</th>
                        <th className="pb-3">Period</th>
                        <th className="pb-3">Generated</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                      {recentReports.filter((item) => reportsTypeFilter === "All" || item.type === reportsTypeFilter).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                          <td className="py-4">
                            <span className="font-bold text-slate-800 dark:text-white block">{item.title}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">{item.subtext}</span>
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded text-slate-500 dark:text-slate-400">
                              {item.type}
                            </span>
                          </td>
                          <td className="py-4 text-slate-700 dark:text-slate-400 text-[10px] font-bold uppercase">{item.scope}</td>
                          <td className="py-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">{item.period}</td>
                          <td className="py-4 text-slate-700 dark:text-slate-400 font-mono text-[11px]">{item.gen}</td>
                          <td className="py-4">
                            <span className={`inline-flex items-center gap-1.5 font-bold uppercase text-[9px] ${
                              item.color === "green" ? "text-emerald-500" : "text-amber-500"
                            }`}>
                              <span className={`size-1.5 rounded-full ${item.color === "green" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => setViewingReport(item)}
                              className="px-3 py-1 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                      {recentReports.filter((item) => reportsTypeFilter === "All" || item.type === reportsTypeFilter).length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                            No {reportsTypeFilter.toLowerCase()} reports found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Templates Section */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">TEMPLATES</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Report templates</h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase rounded-full text-slate-500">
                    <span className="size-1.5 rounded-full bg-slate-900 dark:bg-white"></span>
                    Aggregate only
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    {
                      cat: "WING WEEKLY",
                      title: "Wing Weekly",
                      desc: "Composite OPS + 5 drivers · 6 flights · MoM",
                      per: "Period 7d",
                      sub: "Flights 6"
                    },
                    {
                      cat: "MONTHLY",
                      title: "Monthly Cohort",
                      desc: "High / mid / watch bands · cohort breakdown",
                      per: "Period 1 mo",
                      sub: "Bands 3"
                    },
                    {
                      cat: "QUARTERLY",
                      title: "Quarterly OFT",
                      desc: "Pass rate · by-flight aggregate · target ≥ 90%",
                      per: "Period 3 mo",
                      sub: "Scope OFT"
                    },
                    {
                      cat: "ANNUAL",
                      title: "Annual Wing",
                      desc: "FY-over-FY comparison · editorial summary",
                      per: "Period 12 mo",
                      sub: "Pages 12"
                    }
                  ].map((tpl, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-48">
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider">{tpl.cat}</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{tpl.title}</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-2">{tpl.desc}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-3 mt-3">
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                          <span className="font-bold">{tpl.per}</span> <span className="text-slate-400">&middot;</span> {tpl.sub}
                        </div>
                        <button
                          onClick={() => setViewingTemplate(tpl)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-white cursor-pointer transition"
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footnote */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left">
                Leadership · Reports · k &ge; 5 · CUI
              </div>

              {/* Privacy Caption text */}
              <div className="space-y-1 border-t border-slate-200 dark:border-white/5 pt-4 text-[10px] text-slate-400 leading-relaxed font-sans">
                <p>Privacy & cohort suppression · Reports show cohort + period only. Cells where k &lt; 5 are suppressed and shown as "—". Exports inherit the same suppression.</p>
                <p>Aggregate-only · no individual drill-down · no individual exports · UI gate &sect;7.5</p>
              </div>

            </div>
          )}

          {/* Tab 5: BRIEFINGS VIEW */}
          {activeTab === "briefings" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">LEADERSHIP · BRIEFINGS BUILDER</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Briefings</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Compose the executive briefing from a structured outline. Every section pulls from aggregate data only. Scope: {POPULATION_LEVELS.ORGANIZATION}.
                  </p>
                  {lastSavedAt && (
                    <p className="text-[10px] text-emerald-500 font-bold mt-1 font-mono">
                      Last saved: {new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const templateTitle = TEMPLATES[selectedTemplateIdx]?.title ?? "Briefing";
                      const now = new Date();
                      const iso = now.toISOString();
                      const draftId = `draft-${Date.now()}`;
                      setDraftsList((prev) => [
                        { id: draftId, title: `${templateTitle} draft`, status: "draft", savedAt: iso },
                        ...prev,
                      ]);
                      setLastSavedAt(iso);
                      triggerToast("Briefing draft saved to local registry");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Save draft
                  </button>
                  <button
                    onClick={() => {
                      const templateTitle = TEMPLATES[selectedTemplateIdx]?.title ?? "Briefing";
                      const now = new Date();
                      const iso = now.toISOString();
                      const reportId = `brief-${Date.now()}`;
                      const recipients = ["CC", "SEL", "Squadron Command"];
                      setSentHistory((prev) => [
                        { id: `sent-${Date.now()}`, reportId, sentAt: iso, recipients },
                        ...prev,
                      ]);
                      setRecentReports((prev) => [
                        {
                          title: `${templateTitle} briefing`,
                          subtext: `Aggregate · k ≥ 5 · ${recipients.length} recipients`,
                          type: "Ad-hoc",
                          scope: POPULATION_LEVELS.ORGANIZATION,
                          period: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + " " + now.getFullYear(),
                          gen: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + " · " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
                          status: BRIEFING_STATUSES.SENT,
                          color: "green",
                        },
                        ...prev,
                      ]);
                      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
                      triggerToast(`Sent to ${recipients.length} recipients · ${timeStr}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Send className="size-3.5" /> Send briefing
                  </button>
                </div>
              </div>

              {/* Warning Banner */}
              <div className="bg-slate-900 text-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-800 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-left">
                <Shield className="size-5 text-[var(--brand-color)] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Briefing content is aggregate only &middot; k &ge; 5 enforced</span>
                  <p className="mt-0.5 text-slate-400 dark:text-slate-400 font-normal">
                    Briefings are generated from cohorts and never embed operator identifiers. Sections pull from aggregate trend, drivers, risk, and recommendations only.
                  </p>
                </div>
              </div>

              {/* Templates Section */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">TEMPLATES</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Start from a template</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {TEMPLATES.map((tpl, idx) => (
                    <div
                      key={tpl.title}
                      onClick={() => {
                        setSelectedTemplateIdx(idx);
                        setOutlineSections(
                          tpl.sections.map((s) => ({
                            num: s.num,
                            name: s.name,
                            desc: s.desc,
                            active: s.num === 1
                          }))
                        );
                        setActiveOutlineIdx(0);
                      }}
                      className={`bg-white dark:bg-[#0e1628] rounded-2xl p-5 shadow-sm hover:shadow transition cursor-pointer text-left border ${
                        selectedTemplateIdx === idx
                          ? "border-[var(--brand-color)] ring-2 ring-[var(--brand-color)/30]"
                          : "border-slate-200 dark:border-white/5 hover:border-[var(--brand-color)/50]"
                      }`}
                    >
                      <h4 className="text-xs font-black text-[var(--brand-color)] uppercase tracking-wider">{tpl.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-2">{tpl.desc}</p>
                      {selectedTemplateIdx === idx && (
                        <span className="inline-block mt-3 px-2 py-0.5 bg-[var(--brand-color)]/10 text-[var(--brand-color)] text-[9px] font-bold rounded uppercase">
                          Selected
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Outline and Preview Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                
                {/* Outline Left Panel */}
                <div className="lg:col-span-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Outline</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Drag to reorder · click to edit</p>
                      </div>
                      <button
                        onClick={() => setShowNewSectionModal(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
                      >
                        <Plus className="size-3 text-[var(--brand-color)]" /> Add section
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                      {outlineSections.map((sec, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveOutlineIdx(idx)}
                          className={`py-3.5 flex items-center justify-between gap-4 transition cursor-pointer px-2 -mx-2 rounded-lg ${
                            activeOutlineIdx === idx
                              ? "bg-[var(--brand-color)]/10 ring-1 ring-[var(--brand-color)]/40"
                              : "hover:bg-slate-50/20"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className={`text-xs font-bold block ${
                              activeOutlineIdx === idx ? "text-[var(--brand-color)]" : "text-slate-800 dark:text-white"
                            }`}>
                              {sec.num} &middot; {sec.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block font-mono">{sec.desc}</span>
                          </div>
                          <span className={`text-[9px] font-bold font-mono ${
                            activeOutlineIdx === idx ? "text-[var(--brand-color)]" : "text-slate-400"
                          }`}>
                            {activeOutlineIdx === idx ? "Active" : "Section"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview Right Panel */}
                <div className="lg:col-span-7 bg-[#f8fafc] dark:bg-[#0b0f19] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Preview</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Live · k &ge; 5 · CUI-labelled</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full text-[9px] font-bold text-slate-500 uppercase">
                        <span className="size-1.5 rounded-full bg-slate-900 dark:bg-white"></span>
                        Draft
                      </span>
                      <button
                        onClick={() => {
                          const now = new Date();
                          const iso = now.toISOString();
                          const templateTitle = TEMPLATES[selectedTemplateIdx]?.title ?? "Briefing";
                          setRecentExports((prev) => [
                            {
                              id: `exp-${Date.now()}`,
                              sourceId: `briefing-${selectedTemplateIdx}`,
                              sourceTitle: templateTitle,
                              format: "PDF",
                              at: iso,
                            },
                            ...prev,
                          ]);
                          const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
                          triggerToast(`PDF generated · ${timeStr}`);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Download className="size-3" /> PDF
                      </button>
                    </div>
                  </div>

                  {/* Rendered Live Briefing Text */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-5 md:p-6 shadow-sm text-xs font-sans text-slate-700 dark:text-slate-300 space-y-4 text-left leading-relaxed">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{TEMPLATES[selectedTemplateIdx].title} &middot; 28 Jul 2025</h4>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Section {outlineSections[activeOutlineIdx]?.num ?? 1} of {outlineSections.length} &middot; {outlineSections[activeOutlineIdx]?.name ?? "Section"} &middot; aggregate view &middot; cohort k = 125
                      </p>
                    </div>

                    <ul className="space-y-3 pl-2 text-[11px] list-none">
                      <li className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-1.5 before:size-1.5 before:bg-[var(--brand-color)] before:rounded-full">
                        {TEMPLATES[selectedTemplateIdx].sections[activeOutlineIdx]?.preview ?? "No section selected."}
                      </li>
                    </ul>

                    <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                      <p className="text-[9px] font-mono text-slate-400">
                        Click any outline item on the left to preview its content here. Template: {TEMPLATES[selectedTemplateIdx].title}.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Activity panel — drafts, sent, exports */}
              {(draftsList.length > 0 || sentHistory.length > 0 || recentExports.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                  {draftsList.length > 0 && (
                    <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-white">Drafts</h3>
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold rounded uppercase">
                          {draftsList.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {draftsList.slice(0, 4).map((d) => (
                          <div key={d.id} className="text-[10px] space-y-0.5">
                            <p className="font-bold text-slate-700 dark:text-slate-200 truncate">{d.title}</p>
                            <p className="text-slate-400 font-mono">
                              {new Date(d.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {sentHistory.length > 0 && (
                    <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-white">Sent history</h3>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded uppercase">
                          {sentHistory.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {sentHistory.slice(0, 4).map((s) => (
                          <div key={s.id} className="text-[10px] space-y-0.5">
                            <p className="font-bold text-slate-700 dark:text-slate-200 truncate">{s.reportId}</p>
                            <p className="text-slate-400 font-mono">
                              {new Date(s.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                              {" · "}{s.recipients.length} recipients
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {recentExports.length > 0 && (
                    <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-white">Recent exports</h3>
                        <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 text-[9px] font-bold rounded uppercase">
                          {recentExports.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {recentExports.slice(0, 4).map((e) => (
                          <div key={e.id} className="text-[10px] space-y-0.5">
                            <p className="font-bold text-slate-700 dark:text-slate-200 truncate">
                              {e.sourceTitle} · {e.format}
                            </p>
                            <p className="text-slate-400 font-mono">
                              Generated {new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footnote */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left">
                Leadership · Briefings · k &ge; 5 · CUI
              </div>

              {/* Privacy Caption text */}
              <div className="space-y-1 border-t border-slate-200 dark:border-white/5 pt-4 text-[10px] text-slate-400 leading-relaxed font-sans">
                <p>Privacy & cohort suppression · Briefings show cohort + period only. Cells where k &lt; 5 are suppressed and shown as "—". Exports inherit the same suppression.</p>
                <p>Aggregate-only · no individual drill-down · no individual exports · UI gate &sect;7.5</p>
              </div>

            </div>
          )}

          {/* FOOTER */}
          <footer className="flex items-center justify-between text-[10px] text-slate-400 pt-4 border-t border-slate-200 dark:border-white/5 select-none font-mono mt-8">
            <span>Leadership · k &ge; 5 · CUI</span>
          </footer>

        </main>
      </div>

      {viewingReport && (
        <RecordDetailDialog
          open={!!viewingReport}
          onClose={() => setViewingReport(null)}
          title={viewingReport.title}
          subtitle={viewingReport.subtext}
          fields={[
            { label: "Type", value: viewingReport.type },
            { label: "Scope", value: viewingReport.scope },
            { label: "Period", value: viewingReport.period },
            { label: "Generated", value: viewingReport.gen },
            { label: "Status", value: viewingReport.status },
          ]}
          actions={
            <>
              <button
                onClick={() => setViewingReport(null)}
                type="button"
                className="flex-1 py-2 px-4 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  const iso = now.toISOString();
                  if (viewingReport) {
                    setRecentExports((prev) => [
                      {
                        id: `exp-${Date.now()}`,
                        sourceId: viewingReport.title,
                        sourceTitle: viewingReport.title,
                        format: "PDF",
                        at: iso,
                      },
                      ...prev,
                    ]);
                    setRecentReports((prev) =>
                      prev.map((r) =>
                        r === viewingReport ? { ...r, status: BRIEFING_STATUSES.SENT, color: "green" } : r
                      )
                    );
                  }
                  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
                  triggerToast(`Exported ${viewingReport?.title} · ${timeStr}`);
                  setViewingReport(null);
                }}
                type="button"
                className="flex-1 py-2 px-4 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Export PDF
              </button>
            </>
          }
        />
      )}

      {viewingTemplate && (
        <RecordDetailDialog
          open={!!viewingTemplate}
          onClose={() => setViewingTemplate(null)}
          title={viewingTemplate.title}
          subtitle={viewingTemplate.desc}
          fields={[
            { label: "Category", value: viewingTemplate.cat },
            { label: "Period", value: viewingTemplate.per },
            { label: "Detail", value: viewingTemplate.sub },
          ]}
          actions={
            <>
              <button
                onClick={() => setViewingTemplate(null)}
                type="button"
                className="flex-1 py-2 px-4 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const title = viewingTemplate?.title ?? "Template";
                  setViewingTemplate(null);
                  setShowNewReportModal(true);
                  setNewReportPrefillTitle(`${title} (Draft)`);
                  triggerToast(`New draft report started from template: ${title}`);
                }}
                type="button"
                className="flex-1 py-2 px-4 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Use template
              </button>
            </>
          }
        />
      )}

      {viewingAllReports && (
        <RecordDetailDialog
          open={viewingAllReports}
          onClose={() => setViewingAllReports(false)}
          title="All recent reports"
          subtitle={`${recentReports.length} reports · aggregate · k ≥ 5`}
          fields={[]}
        >
          <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden">
            {recentReports.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setViewingAllReports(false);
                  setViewingReport(item);
                }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900/60 transition cursor-pointer"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-slate-800 dark:text-white truncate">{item.title}</span>
                  <span className="block text-[10px] text-slate-500 truncate">{item.period}</span>
                </span>
                <span className={`flex-shrink-0 text-[9px] font-bold uppercase ${
                  item.color === "green" ? "text-emerald-500" : "text-amber-500"
                }`}>
                  {item.status}
                </span>
              </button>
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
        open={showNewReportModal}
        onClose={() => {
          setShowNewReportModal(false);
          setNewReportPrefillTitle("");
        }}
        title="New report"
        subtitle="Configure an aggregate export. k \u2265 5 is enforced."
        submitLabel="Create report"
        fields={[
          { name: "Title", label: "Title", type: "text", required: true, placeholder: "e.g. Wing Weekly OPS", defaultValue: newReportPrefillTitle },
          { name: "Type", label: "Type", type: "select", required: true, options: ["Weekly", "Monthly", "Quarterly", "Annual", "Ad-hoc"] },
          { name: "Scope", label: "Scope", type: "text", placeholder: "e.g. All wings" },
          { name: "Period", label: "Period", type: "text", placeholder: "e.g. Week 32, 2026" }
        ]}
        onSubmit={(values) => {
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
          const dayStr = now.toLocaleDateString([], { day: "2-digit", month: "short" });
          const newReport: ReportRecord = {
            title: values.Title || "Untitled report",
            subtext: `${values.Type || "Ad-hoc"} report · just now`,
            type: values.Type || "Ad-hoc",
            scope: values.Scope || POPULATION_LEVELS.ORGANIZATION,
            period: values.Period || `${dayStr} ${now.getFullYear()}`,
            gen: `${dayStr} · ${timeStr}`,
            status: BRIEFING_STATUSES.DRAFT,
            color: "orange",
          };
          setRecentReports([newReport, ...recentReports]);
          setShowNewReportModal(false);
          setNewReportPrefillTitle("");
          triggerToast(`Created: ${newReport.title}`);
        }}
      />

      <CreateRecordModal
        open={showNewSectionModal}
        onClose={() => setShowNewSectionModal(false)}
        title="Add outline section"
        subtitle="Append a new section to this briefing outline."
        submitLabel="Add section"
        fields={[
          { name: "Name", label: "Section name", type: "text", required: true, placeholder: "e.g. Risk & mitigations" },
          { name: "Number", label: "Section number", type: "text", defaultValue: String(outlineSections.length + 1) }
        ]}
        onSubmit={(values) => {
          const nextNum = values.Number ? parseInt(values.Number, 10) : outlineSections.length + 1;
          const safeNum = Number.isFinite(nextNum) ? nextNum : outlineSections.length + 1;
          const newSection = {
            num: safeNum,
            name: values.Name || `Section ${safeNum}`,
            desc: "New section · drag to reorder",
            active: false,
          };
          setOutlineSections([...outlineSections, newSection]);
          setShowNewSectionModal(false);
          triggerToast(`Created: ${newSection.name}`);
        }}
      />

    </div>
  );
}

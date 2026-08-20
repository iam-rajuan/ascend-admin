"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { initBrandColor } from "@/lib/constants";
import { POPULATION_LEVELS, PRIVACY_STATES } from "@/lib/terminology";
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
  Lock,
  MessageSquare,
  Sparkles,
} from "lucide-react";

type TabType = "caseload" | "reflections" | "messages";

type MessageThread = {
  code: string;
  time: string;
  txt: string;
  unread: number;
  active: boolean;
};

export default function PcDashboard() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const currentUser = useCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const { show: showConfirmToast, message: toastMessage, triggerToast } = useToast();
  const [activeTabInternal, setActiveTabInternal] = useState<TabType>("caseload");
  const [hasMounted, setHasMounted] = useState(false);

  // Caseload · opted-in filter pill state
  const [caseloadActionFilter, setCaseloadActionFilter] = useState<string>("All");

  // Spiritual reflection entries theme filter pill state
  const [reflectionThemeFilter, setReflectionThemeFilter] = useState<string>("All themes");
  const [reflectionSearch, setReflectionSearch] = useState("");

  // Phase 5: Date-range filter state for reflection entries (Set B)
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [filterApplied, setFilterApplied] = useState<boolean>(false);

  // Phase 5: Seeded reflection entries (Set A) — varied themes so each pill filter shows multiple rows
  type ReflectionEntry = { date: string; code: string; theme: string; len: string; preview: string; flag: string; col: string };
  const [reflectionEntries, setReflectionEntries] = useState<ReflectionEntry[]>([
    { date: "27 Jul", code: "A-1042", theme: "Purpose", len: "312 words", preview: "\u201CFinally sat with the question long enough to hear my own answer.\u201D", flag: "Pastoral", col: "green" },
    { date: "26 Jul", code: "A-1356", theme: "Values", len: "184 words", preview: "\u201CWrote down the three things I won't trade. They held up.\u201D", flag: "Pastoral", col: "green" },
    { date: "24 Jul", code: "A-1218", theme: "Grief", len: "421 words", preview: "\u201CNot ready to talk about it. But I want a place to put the words.\u201D", flag: "Tender", col: "green" },
    { date: "22 Jul", code: "A-1087", theme: "Transition", len: "256 words", preview: "\u201CPCS in nine weeks. Trying to be present here, now.\u201D", flag: "Pastoral", col: "green" },
    { date: "21 Jul", code: "A-1421", theme: "Purpose", len: "298 words", preview: "\u201CThe quiet still finds me, even on the good days.\u201D", flag: "Pastoral", col: "green" },
    { date: "19 Jul", code: "A-1042", theme: "Gratitude", len: "147 words", preview: "\u201CA long walk. Cold air. The first star I noticed all month.\u201D", flag: "Pastoral", col: "green" },
    { date: "17 Jul", code: "A-1218", theme: "Grief", len: "262 words", preview: "\u201CThe anniversary came and went. Quieter than last year.\u201D", flag: "Tender", col: "green" },
    { date: "15 Jul", code: "A-1503", theme: "Transition", len: "204 words", preview: "\u201CNew chapel. Same questions. Smaller room.\u201D", flag: "Pastoral", col: "green" },
    { date: "12 Jul", code: "A-1356", theme: "Values", len: "189 words", preview: "\u201CTwo of the three things I wrote down survived a bad day. The third needs revising.\u201D", flag: "Pastoral", col: "green" },
    { date: "10 Jul", code: "A-1087", theme: "Gratitude", len: "152 words", preview: "\u201CCoffee on the porch. The dog stayed close.\u201D", flag: "Pastoral", col: "green" },
    { date: "08 Jul", code: "A-1421", theme: "Purpose", len: "277 words", preview: "\u201CFelt the old pull again. Did not follow it. Sat with it instead.\u201D", flag: "Pastoral", col: "green" },
    { date: "05 Jul", code: "A-1503", theme: "Transition", len: "318 words", preview: "\u201CForward motion. Not fast. But present.\u201D", flag: "Pastoral", col: "green" }
  ]);

  // Chat messaging state
  const [chatMessage, setChatMessage] = useState("");
  const [viewingThread, setViewingThread] = useState<MessageThread | null>(null);
  const [messagesList, setMessagesList] = useState([
    { sender: "coach", text: "Try the 5-minute gratitude block tonight — no writing needed, just the sitting.", time: "18:40", date: "26 JULY" },
    { sender: "airman", text: "Did it two nights running. Quieter than I expected.", time: "21:05", date: "26 JULY" },
    { sender: "coach", text: "Wednesday's reflection arrived. \"Finally sat with the question long enough to hear my own answer.\" I read it three times. Want to sit with that one next week?", time: "09:14", date: "27 JULY" },
    { sender: "airman", text: "Yes. Wednesday works. Same time?", time: "09:31", date: "27 JULY" }
  ]);

  // New pastoral note state
  type PastoralNote = { airmanCode: string; date: string; body: string };
  const [showNewPastoralNoteModal, setShowNewPastoralNoteModal] = useState(false);
  const [pastoralNotes, setPastoralNotes] = useState<PastoralNote[]>([
    {
      airmanCode: "A-1503",
      date: "28 Jul",
      body: "First-time engagement. Airman arrived quiet, attentive. Asked about cadence (weekly) -"
    }
  ]);

  // Phase 6: Pastoral composer state (controlled textarea + drafts + privileged flag)
  const [pastoralNoteBody, setPastoralNoteBody] = useState<string>(
    "First-time engagement. Airman arrived quiet, attentive. Asked about cadence (weekly) —"
  );
  const [pastoralDrafts, setPastoralDrafts] = useState<{ body: string; savedAt: string }>({
    body: "First-time engagement. Airman arrived quiet, attentive. Asked about cadence (weekly) —",
    savedAt: new Date().toISOString()
  });

  // Reach out state
  type ReachOut = { airmanCode: string; topic: string; preview: string };
  const [showReachOutModal, setShowReachOutModal] = useState(false);
  const [reachOuts, setReachOuts] = useState<ReachOut[]>([]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    setMessagesList([
      ...messagesList,
      { sender: "coach", text: chatMessage, time: timeStr, date: "TODAY" }
    ]);
    setChatMessage("");
    setTimeout(() => {
      triggerToast("Message dispatched securely");
    }, 100);
  };

  const setActiveTab = (tab: TabType) => {
    setActiveTabInternal(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem("ascend_pc_active_tab", tab);
    }
  };

  const activeTab = activeTabInternal;

  // Load persistent active tab on client mount
  useEffect(() => {
    const savedTab = localStorage.getItem("ascend_pc_active_tab") as TabType | null;
    if (savedTab && ["caseload", "reflections", "messages"].includes(savedTab)) {
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

  // Phase 5: Helper to apply theme + search + date range filters to reflection entries
  const filterReflections = (entries: ReflectionEntry[]): ReflectionEntry[] => {
    const parseDate = (s: string): Date | null => {
      const trimmed = s.trim();
      if (!trimmed) return null;
      const parts = trimmed.split(/\s+/);
      const day = parseInt(parts[0], 10);
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const monthIdx = months.indexOf(parts[1] ?? "");
      if (isNaN(day) && monthIdx < 0) return null;
      return new Date(2026, monthIdx >= 0 ? monthIdx : 0, isNaN(day) ? 1 : day);
    };
    const fromD = parseDate(fromDate);
    const toD = parseDate(toDate);
    const dateFilterActive = filterApplied && (fromD || toD);
    const query = reflectionSearch.trim().toLowerCase();
    return entries.filter((p) => {
      const matchesTheme = reflectionThemeFilter === "All themes" || p.theme === reflectionThemeFilter;
      const matchesSearch = query === "" || p.code.toLowerCase().includes(query) || p.theme.toLowerCase().includes(query);
      if (!matchesTheme || !matchesSearch) return false;
      if (!dateFilterActive) return true;
      const entryDate = parseDate(p.date);
      if (!entryDate) return true;
      if (fromD && entryDate < fromD) return false;
      if (toD && entryDate > toD) return false;
      return true;
    });
  };

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
                Purpose Coach
              </span>
            </div>
          </div>

          {/* Navigation Title */}
          <div className="px-5 pt-6 pb-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase font-sans">
            Caseload
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1">
            <button
              onClick={() => setActiveTab("caseload")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "caseload"
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)] dark:text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <Home className="size-4" />
              Caseload
            </button>
            <button
              onClick={() => setActiveTab("reflections")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "reflections"
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)] dark:text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <FileText className="size-4" />
              Reflections
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "messages"
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)] dark:text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50/40 dark:hover:bg-slate-900/60"
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
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Purpose Coach</span>
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
              <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-sans font-black text-xs flex items-center justify-center select-none border border-slate-200 dark:border-white/5">
                {currentUser?.initials}
              </div>
            </button>
          </div>
        </header>

        {/* 2. CUI ALERT STRIP */}
        <div className="h-6 w-full bg-slate-900 border-b border-slate-800 flex items-center justify-center px-6 text-[9px] font-mono tracking-wider text-slate-400 flex-shrink-0 select-none z-10">
          <span className="text-amber-500 mr-2 font-black">•</span>
          {activeTab === "caseload" && "CUI // OPSEC · Purpose pathway · opt-in only"}
          {activeTab === "reflections" && "CUI // OPSEC · Opt-in records · confidential"}
          {activeTab === "messages" && "CUI // OPSEC · Purpose messages · private channel"}
        </div>

        {/* 3. WORKSPACE CONTAINER */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#070a13] px-6 py-8 md:px-8 space-y-8">
          
          {/* Active opt-in consent required warning banner */}
          <div className="bg-[#fffbeb] dark:bg-amber-950/10 text-slate-800 dark:text-slate-200 p-5 rounded-2xl border border-amber-200 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-left">
            <Shield className="size-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold">Active opt-in consent required &middot; revoked consent = immediate access removal.</span>
              <p className="mt-0.5 text-slate-600 dark:text-slate-400 font-normal">
                {activeTab === "reflections" ? 
                  "Records below reflect explicit consent only. Each airman may revoke at any time — revocation removes the record from view within one minute and from any in-flight Purpose Action! Question scope limited to O1D—O12, D4, W7—W8, M7—M8. No medical controls, no Performance Summary, no Level 4 metrics. No row above the audit line exits this surface." :
                  activeTab === "messages" ?
                  "Threads below are reachable only to airmen who explicitly opted in. If consent is revoked, the thread is removed from this surface within one minute." :
                  "14 airmen have opted in. Every row below represents an explicit consent. Revoked consent = immediate access removal (record vanishes from this view within one minute). Recommendations are issued as Purpose Actions using only O1D—O12, D4, W7—W8, M7—M8 — no medical controls, no Performance Summary, no Level 4 metrics, no broad cohort labels, no direct IDMT workflow. Minimum-necessary safety routing is separated."
                }
              </p>
            </div>
          </div>

          {/* Tab 1: CASELOAD VIEW */}
          {activeTab === "caseload" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">PURPOSE · CHAPLAIN PATHWAY</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Today's caseload</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Tuesday, 28 July · A quiet day ahead. Three pastoral consults, twenty-two active reflections, and one first-time engagement to welcome. Take what's here.
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <Users className="size-3" />
                    {POPULATION_LEVELS.CASELOAD}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("reflections")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Reflection log
                  </button>
                  <button
                    onClick={() => setShowNewPastoralNoteModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> New pastoral note
                  </button>
                </div>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { name: "Opted-in", count: "14", desc: "this month", arrow: "▲ +2" },
                  { name: "Active reflections", count: "22", desc: "vs prior period", arrow: "►" },
                  { name: "Consults today", count: "3", desc: "scheduled", arrow: null },
                  { name: "First-time engagements", count: "1", desc: "welcome & consent", arrow: null }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider">{kpi.name}</span>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{kpi.count}</h2>
                      {kpi.arrow && (
                        <span className={`text-[10px] font-bold ${kpi.arrow.includes("▲") ? "text-emerald-500" : "text-slate-400"}`}>
                          {kpi.arrow}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">{kpi.desc}</p>
                  </div>
                ))}
              </div>

              {/* Caseload list */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Caseload · opted-in</h3>
                    <p className="text-[10px] text-slate-500">Anonymized codes only. No rank, no PII. Use codes when messaging or referencing in pastoral notes.</p>
                  </div>
                  <div className="flex gap-2">
                    {["All", "Message", "Open notes", "Reach out", "Welcome"].map((pill, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCaseloadActionFilter(pill)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          pill === caseloadActionFilter
                            ? "bg-[var(--brand-color)/10] border-[var(--brand-color)/30] text-[var(--brand-color)]"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white"
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
                        <th className="pb-3 w-1/4">Airman Code</th>
                        <th className="pb-3">Opt in date</th>
                        <th className="pb-3">Reflection cadence</th>
                        <th className="pb-3">Last contact</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {[
                        { code: "A-1042", date: "14 Mar", cad: "Weekly", contact: "26 Jul · Reflection", act: "Message", actTab: "messages" },
                        { code: "A-1087", date: "02 Apr", cad: "Bi-weekly", contact: "24 Jul · Consult", act: "Open notes", actTab: "reflections" },
                        { code: "A-1218", date: "19 May", cad: "Monthly", contact: "11 Jul · Reflection", act: "Reach out", actTab: "reflections" },
                        { code: "A-1356", date: "06 Jun", cad: "Weekly", contact: "27 Jul · Reflection", act: "Message", actTab: "messages" },
                        { code: "A-1421", date: "22 Jun", cad: "Paused", contact: "02 Jul · Consult", act: "Open notes", actTab: "reflections" },
                        { code: "A-1503", date: "28 Jul", badge: "New", cad: "First-time", contact: "—", act: "Welcome", actTab: "reflections" }
                      ].filter((row) => caseloadActionFilter === "All" || row.act === caseloadActionFilter).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 transition">
                          <td className="py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-white font-mono">{row.code}</span>
                              {row.badge && (
                                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold rounded">
                                  {row.badge}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 text-slate-700 dark:text-slate-300">{row.date}</td>
                          <td className="py-3.5 text-slate-500">{row.cad}</td>
                          <td className="py-3.5 text-slate-500 font-mono text-[11px]">{row.contact}</td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => {
                                triggerToast(`Opening pastoral context for: ${row.code}`);
                                setActiveTab(row.actTab as TabType);
                              }}
                              className="px-3 py-1 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                            >
                              {row.act}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Split layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                
                {/* Reflection themes */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reflection themes · this month</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Aggregated across 22 entries. Identifies only themes, never authorship.</p>
                  </div>

                  <div className="space-y-4 pt-2 font-sans text-xs">
                    {[
                      { label: "Purpose", val: 6, pct: 60 },
                      { label: "Values", val: 5, pct: 50 },
                      { label: "Transition", val: 4, pct: 40 },
                      { label: "Gratitude", val: 3, pct: 30 },
                      { label: "Grief", val: 2, pct: 20 },
                    ].map((themeRow, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200 w-20 flex-shrink-0">{themeRow.label}</span>
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-400 dark:bg-slate-600 rounded-full" style={{ width: `${themeRow.pct}%` }}></div>
                        </div>
                        <span className="w-12 text-right font-mono text-slate-500">{themeRow.val} entries</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[9px] text-slate-400 leading-normal pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 font-mono">
                    <span aria-hidden="true" className="size-2 rounded-full bg-amber-500"></span>
                    Theme-count &middot; Of 22 active reflections
                  </p>
                </div>

                {/* Pastoral care today */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pastoral care · today</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Three consults on the schedule. Two are returning, one is a welcome.</p>
                  </div>

                  {/* Vertical Timeline registry */}
                  <div className="relative pl-6 border-l-2 border-slate-100 dark:border-white/5 space-y-6 ml-2 text-xs font-sans pt-2">
                    {[
                      {
                        time: "09:30 - 45 min",
                        title: "A-1042 · Returning",
                        desc: "Continuation - cadence holds steady",
                        badge: "Returning",
                        badgeCol: "bg-slate-100 dark:bg-slate-800 text-slate-700"
                      },
                      {
                        time: "11:15 - 60 min",
                        title: "A-1503 · First-time engagement",
                        desc: "Welcome, consent, listening",
                        badge: "Welcome",
                        badgeCol: "bg-[var(--brand-color)/15] text-[var(--brand-color)]"
                      },
                      {
                        time: "14:00 - 30 min",
                        title: "A-1087 · Brief check-in",
                        desc: "Light pastoral touch · grief, paused",
                        badge: "Brief",
                        badgeCol: "bg-slate-100 dark:bg-slate-800 text-slate-700"
                      }
                    ].map((evt, idx) => (
                      <div key={idx} className="relative space-y-1">
                        {/* Timeline Bullet circle */}
                        <span className="absolute -left-[30px] top-1.5 size-2 rounded-full bg-slate-300 dark:bg-slate-600 border border-white dark:border-[#0e1628]"></span>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-bold text-slate-400 tracking-wide block uppercase">{evt.time}</span>
                          <div className="flex items-center justify-between gap-4">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-white font-mono">{evt.title}</h4>
                            <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full uppercase ${evt.badgeCol}`}>
                              {evt.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">{evt.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Bottom Action strip disclaimer footnote */}
              <div className="bg-[#f1f5f9] dark:bg-[#0e1628]/60 p-5 rounded-2xl border border-slate-200 dark:border-white/5 text-left text-[10px] text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed font-sans">
                <span className="font-bold text-slate-700 dark:text-white block uppercase tracking-wider text-[8px]">Purpose Action - opt-in only - limited question scope</span>
                <p>
                  Purpose Action is suggested only for airmen with active consent on this surface. Each action routes through the minimum-necessary question panel &mdash; O1D&mdash;O12, D4, W7&mdash;W8, M7&mdash;M8 &mdash; only &mdash; never through medical controls, never through the unrestricted Performance Summary, never through Level 4 metrics. Revoked consent immediately removes this record from view and from any in-flight action. Safety signals route through a separate, minimum-necessary pathway; no broad cohort labels appear here.
                </p>
              </div>

              {/* Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-4">
                Ascend · Purpose pathway prototype
              </div>

            </div>
          )}

          {/* Tab 2: REFLECTIONS VIEW */}
          {activeTab === "reflections" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Confidentials Warning Banner */}
              <div className="bg-[#e0f2fe]/40 dark:bg-sky-950/5 border border-[#bae6fd]/40 dark:border-white/5 rounded-2xl p-5 text-left flex gap-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <Lock className="size-5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">Spiritual reflections &middot; confidential</span>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400 font-normal">
                    This surface is privileged communication. Access is logged. Sharing outside this workspace &mdash; including with leadership or operational reporting &mdash; is a policy violation.
                  </p>
                </div>
              </div>

              {/* Title Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">SPIRITUAL REFLECTIONS · PASTORAL LOG</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Reflections & records</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Opt-in confirmations, reflection entries, and confidential notes for airmen who consented to the Purpose pathway.
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <Users className="size-3" />
                    {POPULATION_LEVELS.CASELOAD}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("caseload")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Caseload
                  </button>
                  <button
                    onClick={() => setShowReachOutModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> Reach out
                  </button>
                </div>
              </div>

              {/* Opt-in confirmation audit */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Opt-in confirmation audit</h3>
                  <p className="text-[10px] text-slate-500">Every opt-in and opt-out is timestamped and immutable. Trail visible only to Purpose pathway roles.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 w-1/4">Airman Code</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Recorded</th>
                        <th className="pb-3">Method</th>
                        <th className="pb-3">Witness</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                      {[
                        { code: "A-1042", status: PRIVACY_STATES.CONSENT_GRANTED, recorded: "14 Mar · 14:02", method: "Secure form - signed", witness: "Chaplain (Capt. R. Owens)", col: "blue" },
                        { code: "A-1087", status: PRIVACY_STATES.CONSENT_GRANTED, recorded: "02 Apr · 09:30", method: "In-person - verbal confirmation", witness: "Chaplain (Capt. R. Owens)", col: "blue" },
                        { code: "A-1218", status: PRIVACY_STATES.CONSENT_WITHDRAWN, recorded: "19 May · 11:11", method: "Casual contact - on request", witness: "—", col: "purple" },
                        { code: "A-1503", status: PRIVACY_STATES.CONSENT_GRANTED, recorded: "28 Jul · 08:55", badge: "Today", method: "In-person - verbal confirmation", witness: "Chaplain (Capt. R. Owens)", col: "blue" }
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 transition">
                          <td className="py-3.5 font-bold text-slate-900 dark:text-white font-mono">{row.code}</td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              row.col === "blue" ? "bg-sky-500/10 text-sky-600" : "bg-purple-500/10 text-purple-600"
                            }`}>
                              <span className={`size-1.5 rounded-full ${row.col === "blue" ? "bg-sky-500" : "bg-purple-500"}`}></span>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-700 dark:text-slate-300 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span>{row.recorded}</span>
                              {row.badge && (
                                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold rounded">
                                  {row.badge}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 text-slate-500 dark:text-slate-400">{row.method}</td>
                          <td className="py-3.5 text-slate-500 dark:text-slate-400 font-bold">{row.witness}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Spiritual reflections entries */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Spiritual reflection entries</h3>
                    <p className="text-[10px] text-slate-500">22 active reflections this month. Entries are private to the consenting airman and to you.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["All themes", "Purpose", "Grief", "Transition"].map((themeFilter, idx) => (
                      <button
                        key={idx}
                        onClick={() => setReflectionThemeFilter(themeFilter)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          themeFilter === reflectionThemeFilter
                            ? "bg-[var(--brand-color)/10] border-[var(--brand-color)/30] text-[var(--brand-color)]"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {themeFilter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-[#f8fafc] dark:bg-slate-900/40 p-4 rounded-xl">
                  <div className="md:col-span-4 space-y-1">
                    <label htmlFor="pc-reflections-search" className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Search</label>
                    <input
                      id="pc-reflections-search"
                      type="text"
                      value={reflectionSearch}
                      onChange={(e) => setReflectionSearch(e.target.value)}
                      placeholder="Search by code or theme"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <label htmlFor="pc-reflections-from" className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">From</label>
                    <input
                      id="pc-reflections-from"
                      type="text"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      placeholder="01 Jul 2026"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <label htmlFor="pc-reflections-to" className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">To</label>
                    <input
                      id="pc-reflections-to"
                      type="text"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      placeholder="28 Jul 2026"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      onClick={() => setFilterApplied(true)}
                      className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-[var(--brand-color)] hover:text-white text-slate-700 dark:text-white text-xs font-bold rounded-lg cursor-pointer transition"
                    >
                      Filter
                    </button>
                  </div>
                </div>

                {/* Filter status indicator */}
                <div className="text-[10px] text-slate-500 font-mono pt-1">
                  {(() => {
                    const dateFiltered = filterApplied && (fromDate || toDate);
                    const fromStr = fromDate || "\u2014";
                    const toStr = toDate || "\u2014";
                    const filtered = filterReflections(reflectionEntries);
                    return `Showing ${filtered.length} entries${dateFiltered ? ` (filtered: ${fromStr} \u2192 ${toStr})` : ""}`;
                  })()}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Airman</th>
                        <th className="pb-3">Theme</th>
                        <th className="pb-3">Length</th>
                        <th className="pb-3 w-1/3">Preview</th>
                        <th className="pb-3 text-right">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filterReflections(reflectionEntries).map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 transition">
                          <td className="py-3 text-slate-500 font-mono">{p.date}</td>
                          <td className="py-3 font-bold text-slate-800 dark:text-white font-mono">{p.code}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              p.theme === "Grief" ? "bg-sky-500/10 text-sky-600" : "bg-purple-500/10 text-purple-600"
                            }`}>
                              {p.theme}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500 font-mono text-[10px]">{p.len}</td>
                          <td className="py-3 text-slate-700 dark:text-slate-300 italic font-serif leading-relaxed text-[11px]">{p.preview}</td>
                          <td className="py-3 text-right">
                            <span className="inline-flex items-center gap-1 font-bold text-[9px] text-[var(--brand-color)] uppercase font-sans">
                              <span className="size-1.5 rounded-full bg-[var(--brand-color)]"></span>
                              {p.flag}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Split layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                
                {/* Pastoral note - A-1503 */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Pastoral note - A-1503</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Privileged - visible only to you</p>
                  </div>

                  <div className="pt-2 space-y-3">
                    <textarea
                      rows={4}
                      value={pastoralNoteBody}
                      onChange={(e) => setPastoralNoteBody(e.target.value)}
                      className="w-full p-3.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--brand-color)/50] leading-relaxed font-sans"
                    />
                    <div className="text-[9px] text-slate-400 font-medium">This note is privileged communication. Not for leadership review.</div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 flex-wrap">
                    <button
                      onClick={() => {
                        setPastoralDrafts({ body: pastoralNoteBody, savedAt: new Date().toISOString() });
                        triggerToast("Note draft saved");
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Save draft
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
                        setPastoralNotes([
                          {
                            airmanCode: "A-1503",
                            date: today,
                            body: pastoralNoteBody,
                          },
                          ...pastoralNotes,
                        ]);
                        setPastoralNoteBody("");
                        triggerToast("Confidential pastoral note saved to ledger");
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Save pastoral note
                    </button>
                    {pastoralDrafts && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Last saved: {new Date(pastoralDrafts.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Records access log */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Records access log</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Every read, write, and export is recorded. Audit only — never surfaced to leadership.</p>
                  </div>

                  <div className="overflow-x-auto pt-1">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-3">When</th>
                          <th className="pb-3">Action</th>
                          <th className="pb-3">Record</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
                        {[
                          { time: "28 Jul · 09:14", act: "Read · reflection", rec: "A-1042" },
                          { time: "28 Jul · 09:11", act: "Write · pastoral note", rec: "A-1503" },
                          { time: "28 Jul · 08:58", act: "Confirmed · opt-in", rec: "A-1503" },
                          { time: "27 Jul · 19:42", act: "Read · reflection", rec: "A-1218" }
                        ].map((logRow, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/20 transition">
                            <td className="py-3 text-slate-500">{logRow.time}</td>
                            <td className="py-3 text-slate-700 dark:text-slate-300">{logRow.act}</td>
                            <td className="py-3 font-bold text-slate-800 dark:text-white">{logRow.rec}</td>
                          </tr>
                        ))}
                        {/* Export row */}
                        <tr className="hover:bg-slate-50/20 transition">
                          <td className="py-3 text-slate-500">27 Jul · 11:20</td>
                          <td className="py-3 text-slate-700 dark:text-slate-300">Exported</td>
                          <td className="py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">never</span>
                              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold rounded">
                                No export
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-4">
                Ascend · Purpose pathway prototype
              </div>

            </div>
          )}

          {/* Tab 3: MESSAGES VIEW */}
          {activeTab === "messages" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">PURPOSE COACH · MESSAGES</p>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">Messages</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  One thread per airman. Private to the airman &mdash; not visible to leadership.
                </p>
                <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  <Users className="size-3" />
                  {POPULATION_LEVELS.CASELOAD}
                </span>
              </div>

              {/* Chat pane grid split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Threads Sidebar Panel */}
                <div className="lg:col-span-4 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Threads</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--brand-color)/15] text-[var(--brand-color)] rounded-full text-[9px] font-bold uppercase font-mono">
                      <span className="size-1 bg-[var(--brand-color)] rounded-full"></span>
                      3 unread
                    </span>
                  </div>

                  <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                      type="text"
                      aria-label="Search by code"
                      placeholder="Search by code"
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#f8fafc] dark:bg-[#070a13] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  {/* Threads list */}
                  <div className="divide-y divide-slate-100/40 dark:divide-white/5 overflow-y-auto max-h-96 pr-1 space-y-1">
                    {[
                      { code: "A-1042", time: "26 Jul", txt: "Yes. Wednesday works. Same time?", unread: 2, active: true },
                      { code: "A-1087", time: "24 Jul", txt: "Booked Wed 14:00. I'll be there.", unread: 0, active: false },
                      { code: "A-1218", time: "22 Jul", txt: "Reading the passage you shared. Thank you.", unread: 1, active: false },
                      { code: "A-1356", time: "20 Jul", txt: "Weekly reflections sent &mdash; thank you.", unread: 0, active: false }
                    ].map((thread, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setViewingThread(thread)}
                        className={`w-full py-3.5 px-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                          thread.active
                            ? "bg-[var(--brand-color)/10]"
                            : "hover:bg-[#f8fafc] dark:hover:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-[var(--brand-color)/10] text-[var(--brand-color)] font-bold text-xs flex items-center justify-center font-mono select-none">
                            A1
                          </div>
                          <div className="space-y-0.5 text-left">
                            <span className="text-xs font-bold text-slate-800 dark:text-white font-mono block">{thread.code}</span>
                            <p className="text-[10px] text-slate-500 leading-tight truncate w-36" dangerouslySetInnerHTML={{ __html: thread.txt }}></p>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span className="text-[9px] font-mono text-slate-400">{thread.time}</span>
                          {thread.unread > 0 && (
                            <span className="size-4.5 rounded-full bg-[var(--brand-color)] text-white text-[9px] font-bold font-mono flex items-center justify-center">
                              {thread.unread}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main chat Pane */}
                <div className="lg:col-span-8 bg-[#f8fafc] dark:bg-[#0b0f19] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[500px]">
                  
                  {/* Chat header */}
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 pb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-[var(--brand-color)/10] text-[var(--brand-color)] font-bold text-xs flex items-center justify-center font-mono">
                        A1
                      </div>
                      <div className="text-left space-y-0.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-white font-mono block">A-1042</span>
                        <span className="text-[10px] text-slate-400 block font-medium">Opted in &middot; private to the airman</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[9px] font-bold rounded-full uppercase tracking-wider text-slate-500 font-mono">
                      Confidential
                    </span>
                  </div>

                  {/* Chat logs timeline window */}
                  <div className="flex-1 overflow-y-auto py-6 space-y-6 max-h-[350px] pr-2">
                    
                    {/* Rendered messages list */}
                    {messagesList.map((msg, idx) => {
                      const showDateHeader = idx === 0 || messagesList[idx - 1].date !== msg.date;
                      return (
                        <div key={idx} className="space-y-4">
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
                        End-to-end · private to A-1042 · not visible to leadership
                      </span>
                    </div>
                  </div>

                  {/* Message Input box */}
                  <div className="border-t border-slate-200/60 dark:border-white/5 pt-4 flex-shrink-0 flex items-center gap-3">
                    <input
                      type="text"
                      aria-label="Message A-1042"
                      placeholder="Message A-1042"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 px-4 py-2 text-xs rounded-xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none placeholder-slate-400"
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      Send
                    </button>
                  </div>

                </div>

              </div>

              {/* Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-4">
                Ascend · Purpose pathway prototype
              </div>

            </div>
          )}

        </main>
      </div>

      {viewingThread && (
        <RecordDetailDialog
          open={!!viewingThread}
          onClose={() => setViewingThread(null)}
          title={viewingThread.code}
          subtitle={viewingThread.txt}
          fields={[
            { label: "Last activity", value: viewingThread.time },
            { label: "Unread", value: viewingThread.unread },
            { label: "Status", value: viewingThread.active ? "Active thread" : "Inactive" },
          ]}
        />
      )}

      {/* TOAST NOTIFICATION */}
      {showConfirmToast && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-slide-up border border-slate-800 dark:border-white/5 font-sans">
          <CheckCircle className="size-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <CreateRecordModal
        open={showNewPastoralNoteModal}
        onClose={() => setShowNewPastoralNoteModal(false)}
        title="New pastoral note"
        subtitle="Privileged · visible only to you. Not for leadership review."
        submitLabel="Save draft"
        fields={[
          { name: "AirmanCode", label: "Airman code", type: "text", required: true, placeholder: "e.g. A-1503" },
          { name: "Date", label: "Date", type: "date", required: true, defaultValue: new Date().toISOString().slice(0, 10) },
          { name: "Body", label: "Note body", type: "textarea", required: true, placeholder: "Observation · context · next step" }
        ]}
        onSubmit={(values) => {
          const newNote: PastoralNote = {
            airmanCode: values.AirmanCode || "A-????",
            date: values.Date || new Date().toISOString().slice(0, 10),
            body: values.Body || "",
          };
          setPastoralNotes([newNote, ...pastoralNotes]);
          setShowNewPastoralNoteModal(false);
          triggerToast(`Created: ${newNote.airmanCode}`);
        }}
      />

      <CreateRecordModal
        open={showReachOutModal}
        onClose={() => setShowReachOutModal(false)}
        title="Reach out"
        subtitle="Compose an initial chaplain outreach. Private channel."
        submitLabel="Start outreach"
        fields={[
          { name: "AirmanCode", label: "Airman code", type: "text", required: true, placeholder: "e.g. A-1503" },
          { name: "Topic", label: "Topic", type: "select", required: true, options: ["Check-in", "Follow-up", "Spiritual care", "Crisis support"] },
          { name: "Preview", label: "Preview", type: "textarea", required: true, placeholder: "Brief opening · intent · timing" }
        ]}
        onSubmit={(values) => {
          const newReachOut: ReachOut = {
            airmanCode: values.AirmanCode || "A-????",
            topic: values.Topic || "Check-in",
            preview: values.Preview || "",
          };
          setReachOuts([newReachOut, ...reachOuts]);
          setShowReachOutModal(false);
          triggerToast(`Created: ${newReachOut.airmanCode}`);
        }}
      />

    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AscendLogo } from "@/components/ascend-logo";
import { PrivacyStateBadge } from "@/components/privacy/privacy-state-badge";
import { PopulationScopeBadge } from "@/components/privacy/population-scope-badge";
import { IconButton } from "@/components/ui/icon-button";
import { RecordDetailDialog } from "@/components/ui/record-detail-dialog";
import { CreateRecordModal } from "@/components/ui/create-record-modal";
import { POPULATION_LEVELS, PRIVACY_STATES, FOLLOW_UP_STATUSES, RECORD_STATUSES } from "@/lib/terminology";
import {
  Brain,
  ChevronDown,
  Bell,
  Sun,
  Moon,
  Shield,
  ShieldAlert,
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
  ChevronRight,
} from "lucide-react";

type TabType = "dashboard" | "notes" | "records" | "messages";

type InboxThread = {
  initials: string;
  name: string;
  time: string;
  txt: string;
  unread: number;
  active: boolean;
};

export default function MpDashboard() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const currentUser = useCurrentUser();
  const [activeTabInternal, setActiveTabInternal] = useState<TabType>("dashboard");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hasMounted, setHasMounted] = useState(false);
  const [showConfirmToast, setShowConfirmToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // Specialist Note editor state — non-clinical coaching note per
  // ASCEND-SPEC.md section 8 (Specialist Notes & Boundaries): date,
  // concern, action assigned, follow-up, status only. No diagnostic
  // scoring, no SOAP structure, no clinical documentation.
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteConcern, setNoteConcern] = useState("Sleep onset remains delayed on 5 of 7 nights since prior contact. Reports intermittent ruminations.");
  const [noteActionAssigned, setNoteActionAssigned] = useState("Behavioral sleep protocol shared · 10-min morning light exposure added. Continue weekly coaching contact.");
  const [noteFollowUp, setNoteFollowUp] = useState<string>(FOLLOW_UP_STATUSES.ASSIGNED);
  const [escalatedToCareTeam, setEscalatedToCareTeam] = useState(false);

  // Phase 6: Note lock + draft persistence + audit ledger
  const [noteLocked, setNoteLocked] = useState<Record<string, boolean>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, { body: string; savedAt: string }>>({});
  const [auditLedger, setAuditLedger] = useState<{ id: string; type: string; airmanCode: string; by: string; at: string }[]>([]);

  // Phase 4: state for the "New session note" / "New note" modals (M1, M2, M3).
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [notesList, setNotesList] = useState<{ id: string; airmanCode: string; type: string; subject: string; status: string; createdAt: string }[]>([
    { id: "N-0001", airmanCode: "A-1042", type: "SOAP", subject: "Sleep diary review", status: "Draft", createdAt: "25 Jul" },
    { id: "N-0002", airmanCode: "A-1087", type: "Follow-up", subject: "Pre-deployment stress", status: "Draft", createdAt: "27 Jul" }
  ]);

  // Phase 4: state for the "New message" modal (M4).
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [inboxThreads, setInboxThreads] = useState<{ initials: string; name: string; time: string; txt: string; unread: boolean; active: boolean }[]>([
    { initials: "TP", name: "A-1042 · T.P.", time: "08:14", txt: "Sleep diary — used the 4-7-8 twice last night", unread: true, active: true },
    { initials: "ML", name: "A-1087 · M.L.", time: "Yest", txt: "Can we shift our Tuesday slot?", unread: true, active: false },
    { initials: "RK", name: "A-1101 · R.K.", time: "26 Jul", txt: "The grounding exercise helped during the sim", unread: true, active: false },
    { initials: "DS", name: "A-1218 · D.S.", time: "24 Jul", txt: "Confirmed for Friday review", unread: false, active: false },
    { initials: "JW", name: "A-1356 · J.W.", time: "22 Jul", txt: "Thanks — the breathing script is on my phone now", unread: false, active: false }
  ]);

  // Dashboard Tab caseload queue filter pill state
  const [caseloadFilter, setCaseloadFilter] = useState<string>("Active");

  // Notes Tab filter pill state
  const [activeNoteFilter, setActiveNoteFilter] = useState<string>("All");

  // Records Tab unredacted state
  const [unredactTargetId, setUnredactTargetId] = useState<string>("A-1101");
  const [isUnredacted, setIsUnredacted] = useState(false);
  const [accessReason, setAccessReason] = useState("");

  // Phase 5: Note-editor visibility selector (Set A)
  const [noteVisibility, setNoteVisibility] = useState<"Care team" | "IDMT only" | "Aggregated">("Care team");

  // Phase 5: Records-tab access-reason category picker (Set B)
  const [accessReasonCategory, setAccessReasonCategory] = useState<string>("");
  const [showReasonPicker, setShowReasonPicker] = useState<boolean>(false);
  type ReasonCategory = "Routine" | "Escalation" | "Follow-up" | "Audit" | "Other";
  const [reasonPickerSelection, setReasonPickerSelection] = useState<ReasonCategory | "">("");

  // Messaging Tab Chat state
  const [chatMessage, setChatMessage] = useState("");
  const [viewingThread, setViewingThread] = useState<InboxThread | null>(null);
  const [chatMessagesList, setChatMessagesList] = useState([
    { sender: "coach", text: "Welcome back, T.P. — bringing the sleep diary to next session? Let me know if the wind-down anchor is holding.", time: "09:58", date: "25 JULY" },
    { sender: "airman", text: "Hi doc — used the 4-7-8 twice last night, felt calmer. Caffeine after 14:00 only twice.", time: "26 Jul · 21:05", date: "25 JULY" },
    { sender: "coach", text: "Two nights is a good start. Let's keep the diary through next week and we'll review patterns Friday.", time: "07:42", date: "27 JULY" },
    { sender: "airman", text: "Sleep diary — used the 4-7-8 twice last night, felt calmer. Onset maybe 40 min instead of 60. Woke once at 03:10.", time: "28 Jul · 08:14", date: "27 JULY" }
  ]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowConfirmToast(true);
    setTimeout(() => setShowConfirmToast(false), 3000);
  };

  const handleSendChatMessage = () => {
    if (!chatMessage.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    setChatMessagesList([
      ...chatMessagesList,
      { sender: "coach", text: chatMessage, time: `${timeStr}`, date: "TODAY" }
    ]);
    setChatMessage("");
    setTimeout(() => {
      triggerToast("Encrypted message dispatched securely");
    }, 100);
  };

  const setActiveTab = (tab: TabType) => {
    setActiveTabInternal(tab);
    setEditingNoteId(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("ascend_mp_active_tab", tab);
    }
  };

  const activeTab = activeTabInternal;

  // Load persistent active tab on client mount
  useEffect(() => {
    const savedTab = localStorage.getItem("ascend_mp_active_tab") as TabType | null;
    if (savedTab && ["dashboard", "notes", "records", "messages"].includes(savedTab)) {
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

  // Sync theme with local storage & document element
  useEffect(() => {
    const savedTheme = localStorage.getItem("ascend_admin_theme") as "light" | "dark" | null;
    let initialTheme: "light" | "dark" = "light";
    if (savedTheme) {
      initialTheme = savedTheme;
    }
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    
    const timer = setTimeout(() => {
      setTheme(initialTheme);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("ascend_admin_theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

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
                Mental Performance
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
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "dashboard" && !editingNoteId
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <Users className="size-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "notes" || editingNoteId
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <ClipboardList className="size-4" />
              Notes
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "records"
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <Lock className="size-4" />
              Records
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "messages"
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
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
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Mental Performance Workspace</span>
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
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight font-sans">{currentUser?.unit}</span>
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
          {editingNoteId && "CUI // OPSEC · Session notes · confidential session note · encrypted at rest"}
          {!editingNoteId && activeTab === "dashboard" && "CUI // OPSEC · Mental Performance content · confidential · access logged"}
          {!editingNoteId && activeTab === "notes" && "CUI // OPSEC · Confidential session note · encrypted at rest"}
          {!editingNoteId && activeTab === "records" && "CUI // OPSEC · Mental Performance records · access reason required"}
          {!editingNoteId && activeTab === "messages" && "CUI // OPSEC · Secure threads · confidential messages"}
        </div>

        {/* 3. WORKSPACE CONTAINER */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#070a13] px-6 py-8 md:px-8 space-y-8">
          
          {/* Active Note Editor Mode */}
          {editingNoteId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left relative">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">Specialist notes / MENTAL PERFORMANCE · COACHING NOTE</p>
                  <div className="flex items-baseline gap-4 mt-0.5">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">A-1042 &middot; 28 Jul</h1>
                    <span className="text-sm font-black text-rose-500/20 uppercase tracking-widest pointer-events-none select-none">draft</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Non-clinical coaching note &middot; card-bounded. Every save is logged.
                  </p>
                  <div className="mt-2">
                    <PopulationScopeBadge level={POPULATION_LEVELS.INDIVIDUAL} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditingNoteId(null)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Specialist notes
                  </button>
                  <button
                    onClick={() => { setActiveTab("records"); setEditingNoteId(null); }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Records
                  </button>
                </div>
              </div>

              {/* Warning box */}
              <div className="bg-[#e0f2fe]/40 dark:bg-sky-950/5 border border-[#bae6fd]/40 dark:border-white/5 rounded-2xl p-5 text-left flex gap-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <Shield className="size-5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">Confidentiality-bounded &middot; minimum-necessary access</span>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400 font-normal">
                    This note is bound by coaching confidentiality &mdash; non-clinical, no diagnosis or treatment. Visibility selector below controls who can read this note. Default is Care Team only &mdash; aggregate is non-identifiable.
                  </p>
                </div>
              </div>

              {/* Note editor split grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
                
                {/* Left Editor */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Note header card */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                          Anonymized identifier - A-1042
                          {noteLocked["A-1042"] && (
                            <Lock className="size-3.5 text-emerald-500" />
                          )}
                        </h3>
                        <p className="text-[10px] text-slate-500">Initials: T.P. &middot; cohort opt-in &middot; assigned 12 Jul</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const airmanCode = "A-1042";
                            setNoteLocked((prev) => ({ ...prev, [airmanCode]: true }));
                            triggerToast("Note locked against modifications");
                          }}
                          disabled={noteLocked["A-1042"]}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition cursor-pointer ${
                            noteLocked["A-1042"]
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 cursor-default"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <Lock className="size-3.5" /> {noteLocked["A-1042"] ? "Locked" : "Lock"}
                        </button>
                        <button
                          onClick={() => {
                            const id = `N-${String(notesList.length + 1).padStart(4, "0")}`;
                            const createdAt = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
                            setNotesList((prev) => [
                              {
                                id,
                                airmanCode: "A-1042",
                                type: "Coaching",
                                subject: "Sleep diary review · draft",
                                status: "draft",
                                createdAt,
                              },
                              ...prev,
                            ]);
                            triggerToast("Specialist note draft saved");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--brand-color)] hover:bg-[#0c8a99] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Save note
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Date</span>
                        <span className="text-slate-700 dark:text-slate-300">28 Jul 2026</span>
                        <span className="text-[10px] text-slate-500 block font-sans">09:30 · 50 min</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Modality</span>
                        <span className="text-slate-700 dark:text-slate-300">Individual</span>
                        <span className="text-[10px] text-slate-500 block font-sans">In-person · office 4B</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Contact #</span>
                        <span className="text-slate-700 dark:text-slate-300">CN-04218</span>
                        <span className="text-[10px] text-slate-500 block font-sans">4 of 8 planned</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Status</span>
                        <span className="text-amber-500 font-bold">{RECORD_STATUSES.DRAFT}</span>
                        <span className="text-[10px] text-slate-500 block font-sans">auto-saved 08:14</span>
                      </div>
                    </div>
                  </div>

                  {/* Specialist note fields — non-clinical: concern, action
                      assigned, follow-up. No diagnostic scoring. */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">

                    {/* Concern */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Concern</span>
                        <span className="text-[9px] text-slate-500 ml-auto font-mono">plain-language, {`${currentUser?.roleName ?? "MP"}`.toLowerCase()}-framed</span>
                      </div>
                      <textarea
                        rows={2}
                        value={noteConcern}
                        onChange={(e) => setNoteConcern(e.target.value)}
                        className="w-full p-3.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--brand-color)/50] leading-relaxed font-sans"
                      />
                    </div>

                    {/* Action assigned */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action assigned</span>
                        <span className="text-[9px] text-slate-500 ml-auto font-mono">coaching resource / referral</span>
                      </div>
                      <textarea
                        rows={2}
                        value={noteActionAssigned}
                        onChange={(e) => setNoteActionAssigned(e.target.value)}
                        className="w-full p-3.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--brand-color)/50] leading-relaxed font-sans"
                      />
                    </div>

                    {/* Follow-up */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Follow-up</span>
                        <span className="text-[9px] text-slate-500 ml-auto font-mono">status</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.values(FOLLOW_UP_STATUSES).map((status) => (
                          <button
                            key={status}
                            onClick={() => setNoteFollowUp(status)}
                            className={`px-3 py-1 rounded text-[10px] font-bold transition cursor-pointer border ${
                              noteFollowUp === status
                                ? "bg-[#0da2b3]/15 border-[#0da2b3] text-[#0da2b3] ring-1 ring-[#0da2b3]"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Escalation — a referral trigger, not a clinical risk
                      score. MP flags concern and routes to care team; it
                      does not grade or diagnose risk itself. */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-2 font-sans">Escalation</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed sm:max-w-md">
                        If this coaching contact raises a concern beyond MP&apos;s non-clinical scope, escalate to the care team for clinical review &mdash; MP does not diagnose or grade risk.
                      </p>
                      <button
                        onClick={() => {
                          setEscalatedToCareTeam(true);
                          triggerToast("Escalated to care team — clinical review requested");
                        }}
                        disabled={escalatedToCareTeam}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
                          escalatedToCareTeam
                            ? "bg-rose-500/10 text-rose-500 cursor-default"
                            : "bg-rose-500 hover:bg-rose-600 text-white"
                        }`}
                      >
                        <ShieldAlert className="size-4" />
                        {escalatedToCareTeam ? "Escalated to care team" : "Escalate to care team"}
                      </button>
                    </div>
                  </div>

                  {/* Visibility controls */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Visibility</h3>
                      <span className="text-[10px] text-slate-500 font-mono">Default: Care team only</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { title: "Care team", desc: "MP staff on caseload · IDMT on request" },
                        { title: "IDMT only", desc: "Restricted to Integrated Delivery Medical Team" },
                        { title: "Aggregated", desc: "Non-identifiable cohort summary · k>5" }
                      ].map((vis) => (
                        <button
                          key={vis.title}
                          type="button"
                          onClick={() => setNoteVisibility(vis.title as "Care team" | "IDMT only" | "Aggregated")}
                          className={`p-3.5 rounded-xl border cursor-pointer transition text-left space-y-1.5 ${
                            noteVisibility === vis.title
                              ? "bg-[#0da2b3]/10 border-[#0da2b3]/30"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                          }`}
                        >
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white">{vis.title}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">{vis.desc}</p>
                        </button>
                      ))}
                      {/* Explicit denial state (Req 7) for a viewer outside this
                          airman's authorized care team — never silently omitted. */}
                      <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50/40 dark:bg-rose-950/10 text-left space-y-1.5">
                        <PrivacyStateBadge state={PRIVACY_STATES.ACCESS_DENIED} showReason />
                      </div>
                    </div>

                    {/* Visibility indicator — updates with active selection */}
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        Visibility: <span className="font-bold text-slate-700 dark:text-slate-200">{noteVisibility}</span>
                        {noteVisibility === "Care team" && " · shared with all specialists"}
                        {noteVisibility === "IDMT only" && " · restricted to medical staff"}
                        {noteVisibility === "Aggregated" && " · anonymized metrics only"}
                      </p>
                    </div>
                  </div>

                  {/* Note save action buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const airmanCode = "A-1042";
                        const body = `${noteConcern}\n\n${noteActionAssigned}`;
                        const savedAt = new Date().toISOString();
                        setDraftNotes((prev) => ({ ...prev, [airmanCode]: { body, savedAt } }));
                        triggerToast("Authoring note draft saved");
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Save draft
                    </button>
                    {draftNotes["A-1042"] && (
                      <span className="text-[10px] text-emerald-500 font-mono font-bold">
                        Last saved: {new Date(draftNotes["A-1042"].savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        const airmanCode = "A-1042";
                        const id = `N-${String(notesList.length + 1).padStart(4, "0")}`;
                        const createdAt = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
                        setNotesList((prev) => [
                          {
                            id,
                            airmanCode,
                            type: "Coaching",
                            subject: "Sealed coaching note",
                            status: "sealed",
                            createdAt,
                          },
                          ...prev,
                        ]);
                        setAuditLedger((prev) => [
                          {
                            id: `audit-${Date.now()}`,
                            type: "note.sealed",
                            airmanCode,
                            by: "MP",
                            at: new Date().toISOString(),
                          },
                          ...prev,
                        ]);
                        setNoteLocked((prev) => ({ ...prev, [airmanCode]: true }));
                        setNoteConcern("");
                        setNoteActionAssigned("");
                        setDraftNotes((prev) => {
                          const next = { ...prev };
                          delete next[airmanCode];
                          return next;
                        });
                        triggerToast("Confidential note signed and sealed in ledger");
                        setEditingNoteId(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Sign + lock
                    </button>
                  </div>

                </div>

                {/* Right Side Cards */}
                <div className="lg:col-span-4 space-y-6">

                  {/* Recent notes — hidden when visibility is Aggregated (no individual rows surface) */}
                  {noteVisibility !== "Aggregated" && (
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-2 font-sans">Recent notes - A-1042</h3>
                    <div className="space-y-3 font-sans text-xs">
                      {[
                        { date: "25 Jul · 09:30", note: "Sleep diary review · L1" },
                        { date: "18 Jul · 09:30", note: "Wind-down anchor · L1" }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-0.5 text-left border-b border-slate-100 dark:border-white/5 pb-2 last:border-b-0 last:pb-0">
                          <span className="text-[9px] font-mono text-slate-400">{item.date}</span>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{item.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Audit log */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-2 font-sans">Audit log</h3>
                    <div className="space-y-3 font-mono text-[10px]">
                      {[
                        ...auditLedger.map((entry) => ({
                          time: new Date(entry.at).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }),
                          actor: entry.by,
                          log: `${entry.type} · ${entry.airmanCode}`,
                        })),
                        { time: "28 Jul · 08:14", actor: "Dr. M. Khan", log: "Edited subjective section" },
                        { time: "28 Jul · 08:11", actor: "Dr. M. Khan", log: "Opened note - reason: routine" },
                        { time: "27 Jul · 16:42", actor: "System", log: "Auto-save checkpoint" },
                        { time: "25 Jul · 09:58", actor: "Dr. M. Khan", log: "Signed + locked previous note" }
                      ].map((log, idx) => (
                        <div key={idx} className="space-y-0.5 text-left border-b border-slate-100 dark:border-white/5 pb-2 last:border-b-0 last:pb-0">
                          <span className="text-[9px] text-[#0da2b3] font-bold font-sans block">{log.actor}</span>
                          <span className="text-slate-500 font-sans block">{log.log}</span>
                          <span className="text-[8px] text-slate-400 block">{log.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visibility summary */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-2 font-sans">Visibility summary</h3>
                    <div className="space-y-3 font-sans text-xs">
                      {[
                        { name: "MP staff on caseload", val: "Visible", active: true },
                        { name: "IDMT", val: "On request", active: false },
                        { name: "Leadership / aggregate", val: "Not visible", active: false },
                        { name: "Peers / airman peers", val: "Never", active: false }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-2 last:border-b-0 last:pb-0">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                          <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase ${
                            item.active ? "text-emerald-500" : "text-slate-400"
                          }`}>
                            <span className={`size-1.5 rounded-full ${item.active ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                            {item.val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Note metadata footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-4">
                Note ID · ENC-04218 · card · care team · AES-256
              </div>

            </div>
          )}

          {/* Tab 1: DASHBOARD VIEW */}
          {activeTab === "dashboard" && !editingNoteId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider font-sans">MENTAL PERFORMANCE · TODAY'S CASELOAD</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">Mental Performance caseload</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    22 airmen on caseload &middot; 6 new referrals this week &middot; 8 sessions scheduled today. Calm, quiet, confidential. Recommendations are issued as Mental-Performance Actions using only O7&mdash;O9, D3, W5&mdash;W6, M5&mdash;M6.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("records")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Records
                  </button>
                  <button
                    onClick={() => setShowNewNoteModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> New session note
                  </button>
                </div>
              </div>

              {/* 4 KPI overview grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { name: "Active caseload", count: "22", desc: "+2 this week · 18 individual · 4 group", green: true },
                  { name: "Referrals this week", count: "6", desc: "3 self · 2 SCS · 1 PT/IM" },
                  { name: "Sessions today", count: "8", desc: "next at 09:30 - A-1087" },
                  { name: "Follow-ups due", count: "4", desc: "2 due today · 2 this week" }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider">{kpi.name}</span>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{kpi.count}</h2>
                      {kpi.green && (
                        <span className="text-[10px] font-bold text-emerald-500">
                          +2 this week
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">{kpi.desc}</p>
                  </div>
                ))}
              </div>

              {/* Caseload list & Macro drivers split grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                
                {/* Caseload queue table */}
                <div className="lg:col-span-8 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Caseload queue</h3>
                      <p className="text-[10px] text-slate-500">Anonymized identifiers &middot; case-level summary only</p>
                    </div>

                    <div className="flex gap-2">
                      {["Active", "Scheduled", "Follow-up", "New"].map((pill, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCaseloadFilter(pill)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                            pill === caseloadFilter
                              ? "bg-[#0da2b3]/10 border-[#0da2b3]/30 text-[#0da2b3]"
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
                          <th className="pb-3 w-1/4">Airman</th>
                          <th className="pb-3">Referral Reason</th>
                          <th className="pb-3">Last session</th>
                          <th className="pb-3">Next session</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                        {[
                          { code: "A-1042", reason: "Sleep concern", last: "24 Jul", next: "28 Jul · 09:30", status: "Active", col: "green" },
                          { code: "A-1087", reason: "Pre-deployment stress", last: "25 Jul", next: "28 Jul · 11:00", status: "Scheduled", col: "teal" },
                          { code: "A-1101", reason: "Performance anxiety", last: "21 Jul", next: "28 Jul · 14:15", status: "Follow-up", col: "orange" },
                          { code: "A-1123", reason: "Burnout screening", last: "26 Jul", next: "29 Jul · 10:00", status: "Active", col: "green" },
                          { code: "A-1145", reason: "Family adjustment", last: "22 Jul", next: "30 Jul · 13:30", status: "Scheduled", col: "teal" },
                          { code: "A-1058", reason: "Sleep concern", last: "\u2014", next: "New referral", status: "New", col: "badge" },
                          { code: "A-1176", reason: "Pre-deployment stress", last: "\u2014", next: "Awaiting intake", status: "New", col: "badge" }
                        ].filter((row) => row.status === caseloadFilter).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/20 transition">
                            <td className="py-3 font-bold text-slate-800 dark:text-white font-mono">{row.code}</td>
                            <td className="py-3 text-slate-700 dark:text-slate-300">{row.reason}</td>
                            <td className="py-3 text-slate-500 font-mono text-[10px]">{row.last}</td>
                            <td className="py-3 text-slate-500 dark:text-slate-400 font-mono text-[10px]">{row.next}</td>
                            <td className="py-3 text-right">
                              {row.col === "badge" ? (
                                <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-bold rounded">
                                  {row.status}
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1.5 font-bold text-[9px] uppercase ${
                                  row.col === "green" ? "text-emerald-500" :
                                  row.col === "teal" ? "text-[#0da2b3]" : "text-amber-500"
                                }`}>
                                  <span className={`size-1.5 rounded-full ${
                                    row.col === "green" ? "bg-emerald-500" :
                                    row.col === "teal" ? "bg-[#0da2b3]" : "bg-amber-500"
                                  }`}></span>
                                  {row.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>

                {/* Right widgets panel */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Driver scores */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">Mental driver scores</h3>
                        <p className="text-[9px] text-slate-400 font-mono">Cohort k&ge;5 - last 4 weeks</p>
                      </div>
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                        AGGREGATE ONLY
                      </span>
                    </div>

                    <div className="space-y-2.5 font-sans text-xs">
                      {[
                        { name: "Stress mgmt", score: 62 },
                        { name: "Focus", score: 71 },
                        { name: "Sleep quality", score: 54 },
                        { name: "Resilience", score: 68 },
                        { name: "Mood", score: 64 },
                        { name: "Connection", score: 73 }
                      ].map((drv, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4 border-b border-slate-50 dark:border-white/5 pb-1 last:border-0 last:pb-0">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{drv.name}</span>
                          <span className="font-mono font-black text-slate-800 dark:text-white">{drv.score}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[8px] text-slate-400 leading-normal pt-2 border-t border-slate-100 dark:border-white/5">
                      Score range 0-100: higher = better. W5 reverse-scored, M5 direct-scored by the recommendation engine. Cohort only &mdash; minimum-necessary. k&ge;5 threshold met.
                    </p>
                  </div>

                  {/* Today's sessions */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Today's sessions</h3>
                      <p className="text-[9px] text-slate-500">8 scheduled &middot; 2 group</p>
                    </div>

                    <div className="space-y-4 text-xs font-sans text-left">
                      {[
                        { time: "09:30 - A-1042", label: "Individual · Sleep concern", badge: "Follow-up", bCol: "bg-blue-500/10 text-blue-500" },
                        { time: "10:15 - A-1087", label: "Individual · Pre-deployment stress", badge: "Follow-up", bCol: "bg-blue-500/10 text-blue-500" },
                        { time: "11:00 - Group", label: "Group · Resiliency · 6 attendees", badge: "Group", bCol: "bg-slate-100 dark:bg-slate-900 text-slate-400" },
                        { time: "14:15 - A-1101", label: "Individual · Performance anxiety", badge: "Follow-up", bCol: "bg-blue-500/10 text-blue-500" },
                        { time: "15:00 - A-1123", label: "Individual · Burnout — escalated", badge: "Escalated", bCol: "bg-rose-500/10 text-rose-500" }
                      ].map((s, idx) => (
                        <div key={idx} className="border-b border-slate-50 dark:border-white/5 pb-2 last:border-0 last:pb-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] font-bold text-slate-800 dark:text-white font-mono">{s.time}</span>
                            <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-full font-mono uppercase ${s.bCol}`}>
                              {s.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Referral reasons summary */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Referral reasons &mdash; last 30 days</h3>
                  <p className="text-[10px] text-slate-500">Distribution across 6 active referrals &middot; aggregate only</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-5 font-sans text-xs">
                  {[
                    { label: "Sleep concern", val: 3, pct: 60 },
                    { label: "Pre-deployment stress", val: 2, pct: 40 },
                    { label: "Performance anxiety", val: 2, pct: 40 },
                    { label: "Family adjustment", val: 1, pct: 20 },
                    { label: "Burnout screening", val: 1, pct: 20 }
                  ].map((refRow, idx) => (
                    <div key={idx} className="p-3.5 bg-[#f8fafc] dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-[11px] text-slate-700 dark:text-slate-300">{refRow.label}</span>
                        <span className="font-mono text-slate-800 dark:text-white">{refRow.val}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-400 dark:bg-slate-600 rounded-full" style={{ width: `${refRow.pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Policy Statement */}
              <div className="bg-[#f1f5f9] dark:bg-[#0e1628]/60 p-5 rounded-2xl border border-slate-200 dark:border-white/5 text-left text-[10px] text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed font-sans">
                <span className="font-bold text-slate-700 dark:text-white block uppercase tracking-wider text-[8px]">Mental-Performance Action &middot; pattern-based routing</span>
                <p>
                  A Mental-Performance Action is suggested only when a pattern (not an isolated response) crosses the cohort threshold. Actions route to O7&mdash;O9, D3, W5&mdash;W6, M5&mdash;M6 only &mdash; no raw medical access, no unrestricted Performance Summary, no provider-satisfaction flag, no separate stress-burden scoring. W5 is reverse-scored; M5 is direct-scored. High priority is never raised from a single question response.
                </p>
              </div>

              {/* Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left">
                Refreshed &middot; 28 Jul 08:42 UTC &middot; cohort k=22
              </div>

            </div>
          )}

          {/* Tab 2: NOTES LIST VIEW */}
          {activeTab === "notes" && !editingNoteId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Privacy Warning banner */}
              <div className="bg-[#e0f2fe]/40 dark:bg-sky-950/5 border border-[#bae6fd]/40 dark:border-white/5 rounded-2xl p-5 text-left flex gap-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <Lock className="size-5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">Mental Performance view &middot; anonymized identifiers only</span>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400 font-normal">
                    Airmen appear as assigned codes, never by name. Notes are visible to authorized MP staff alone &mdash; not to leadership, peers, SCS, PT/IM, or any aggregate view.
                  </p>
                </div>
              </div>

              {/* Title Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider font-sans">MENTAL PERFORMANCE · SESSION NOTES</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">Session notes</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Notes for your caseload, newest first. Concern / action / follow-up structured, and bound to your role &mdash; every open and save is logged.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowNewNoteModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> New note
                  </button>
                </div>
              </div>

              {/* Table details */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                
                {/* Filters row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notes &middot; 12</h3>
                    <p className="text-[10px] text-slate-500">Sorted by session date &middot; drafts expire 72 h after the session</p>
                  </div>

                  <div className="flex gap-2">
                    {["All", "Drafts", "Signed", "Escalated"].map((noteFilter, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveNoteFilter(noteFilter)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          noteFilter === activeNoteFilter
                            ? "bg-[#0da2b3]/10 border-[#0da2b3]/30 text-[#0da2b3]"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {noteFilter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 w-1/4">Airman</th>
                        <th className="pb-3">Session</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Focus</th>
                        <th className="pb-3">Escalation</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {[
                        { code: "A-1042", sessions: "6 contacts", date: "28 Jul", type: "Follow-up", focus: "Sleep concern", escalated: false, status: RECORD_STATUSES.DRAFT, statusCol: "orange", dot: "red" },
                        { code: "A-1087", sessions: "3 contacts", date: "27 Jul", type: "Follow-up", focus: "Pre-deployment stress", escalated: false, status: RECORD_STATUSES.DRAFT, statusCol: "orange", dot: "red" },
                        { code: "A-1101", sessions: "8 contacts", date: "26 Jul", type: "Follow-up", focus: "Performance anxiety", escalated: false, status: RECORD_STATUSES.SIGNED, statusCol: "green", dot: "green" },
                        { code: "A-1218", sessions: "2 contacts", date: "25 Jul", type: "Intake", focus: "Adjustment", escalated: false, status: RECORD_STATUSES.SIGNED, statusCol: "green", dot: "green" },
                        { code: "A-1356", sessions: "5 contacts", date: "24 Jul", type: "Follow-up", focus: "Focus & recovery", escalated: false, status: RECORD_STATUSES.SIGNED, statusCol: "green", dot: "green" },
                        { code: "A-1409", sessions: "1 contact", date: "23 Jul", type: "Intake", focus: "Referral · SCS", escalated: false, status: RECORD_STATUSES.SIGNED, statusCol: "green", dot: "green" },
                        { code: "A-1042", sessions: "6 contacts", date: "21 Jul", type: "Follow-up", focus: "Sleep concern", escalated: false, status: RECORD_STATUSES.SIGNED, statusCol: "green", dot: "green" },
                        { code: "A-1533", sessions: "4 contacts", date: "20 Jul", type: "Follow-up", focus: "Team cohesion", escalated: false, status: RECORD_STATUSES.SIGNED, statusCol: "green", dot: "green" },
                        { code: "A-1087", sessions: "3 contacts", date: "18 Jul", type: "Intake", focus: "Pre-deployment stress", escalated: true, status: RECORD_STATUSES.SIGNED, statusCol: "green", dot: "green" },
                        { code: "A-1101", sessions: "8 contacts", date: "17 Jul", type: "Follow-up", focus: "Performance anxiety", escalated: false, status: RECORD_STATUSES.SIGNED, statusCol: "green", dot: "green" }
                      ].filter((row) => {
                        if (activeNoteFilter === "All") return true;
                        if (activeNoteFilter === "Drafts") return row.status === RECORD_STATUSES.DRAFT;
                        if (activeNoteFilter === "Signed") return row.status === RECORD_STATUSES.SIGNED;
                        if (activeNoteFilter === "Escalated") return row.escalated;
                        return true;
                      }).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 transition">
                          <td className="py-3">
                            <span className="font-bold text-slate-800 dark:text-white font-mono block">{row.code}</span>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{row.sessions}</span>
                          </td>
                          <td className="py-3 text-slate-700 dark:text-slate-300 font-mono">{row.date}</td>
                          <td className="py-3 text-slate-500 font-medium">{row.type}</td>
                          <td className="py-3 text-slate-700 dark:text-slate-300 font-bold">{row.focus}</td>
                          <td className="py-3">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase ${
                              row.escalated ? "bg-rose-500/10 text-rose-500" : "bg-slate-100 dark:bg-slate-900 text-slate-400"
                            }`}>
                              {row.escalated ? "Escalated" : "—"}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1.5 font-bold text-[9px] uppercase ${
                              row.statusCol === "green" ? "text-emerald-500" : "text-amber-500"
                            }`}>
                              <span className={`size-1.5 rounded-full ${
                                row.dot === "green" ? "bg-emerald-500" : "bg-rose-500"
                              }`}></span>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setEditingNoteId(row.code);
                                triggerToast(`Opening specialist note for: ${row.code}`);
                              }}
                              className="px-3 py-1 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
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
                  <span className="text-[10px] text-slate-500 font-mono">1&mdash;10 of 12</span>
                  <div className="flex items-center gap-1">
                    <button aria-label="Previous page" type="button" className="p-1 px-2 border border-slate-200 dark:border-white/5 text-[10px] text-slate-400 rounded hover:bg-slate-50">&lt;</button>
                    <button aria-label="Page 1" aria-current="page" type="button" className="p-1 px-2 border border-slate-200 dark:border-white/10 text-[10px] text-[#0da2b3] font-bold rounded bg-[#0da2b3]/10">1</button>
                    <button aria-label="Page 2" type="button" className="p-1 px-2 border border-slate-200 dark:border-white/5 text-[10px] text-slate-600 rounded hover:bg-slate-50">2</button>
                    <button aria-label="Next page" type="button" className="p-1 px-2 border border-slate-200 dark:border-white/5 text-[10px] text-slate-600 rounded hover:bg-slate-50">&gt;</button>
                  </div>
                </div>

              </div>

              {/* Footnotes */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Anonymized identifiers &middot; MP staff only &middot; every open logged</span>
                <span className="cursor-pointer hover:underline text-[#0da2b3] font-bold" onClick={() => setActiveTab("records")}>Records &rarr;</span>
              </div>

              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-2">
                12 notes · anonymized identifiers · care team only · AES-256
              </div>

            </div>
          )}

          {/* Tab 3: RECORDS VIEW */}
          {activeTab === "records" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Confidentials access check banner */}
              <div className="bg-[#e0f2fe]/40 dark:bg-sky-950/5 border border-[#bae6fd]/40 dark:border-white/5 rounded-2xl p-5 text-left flex gap-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <Lock className="size-5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">Confidentiality-bounded &middot; minimum-necessary access</span>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400 font-normal">
                    Records default to care-team minimum-necessary. Aggregate fields shown only when k&ge;5. Sensitive coaching notes are redacted by default and require explicit access with reason.
                  </p>
                </div>
              </div>

              {/* Title Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider font-sans">MENTAL PERFORMANCE · RECORDS</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">Specialist records</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Referrals, sessions, and screenings. Redaction applied at the field level. Every access requires a reason.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("dashboard")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setShowNewNoteModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> New note
                  </button>
                </div>
              </div>

              {/* Access Reason Card */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div>
                  <span className="text-[8px] font-bold text-slate-500 block uppercase tracking-wider font-sans">Access reason required</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-sans">State your access reason</h3>
                  <p className="text-[10px] text-slate-500">Every record open is logged with this reason. The operator sees who accessed their record, when, and why.</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 space-y-1">
                      <label id="mp-reason-category-label" className="text-[10px] font-bold text-slate-400 block uppercase font-sans">Reason category</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-labelledby="mp-reason-category-label"
                          onClick={() => setShowReasonPicker((s) => !s)}
                          className="w-full h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 flex items-center justify-between px-3 text-xs text-slate-500 select-none cursor-pointer"
                        >
                          <span>{accessReasonCategory || "Select category"}</span>
                          <ChevronDown className="size-4 text-slate-400" />
                        </button>
                        {accessReasonCategory && (
                          <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                            Selected: {accessReasonCategory}
                          </span>
                        )}
                      </div>

                      {showReasonPicker && (
                        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl space-y-2">
                          {(["Routine", "Escalation", "Follow-up", "Audit", "Other"] as ReasonCategory[]).map((cat) => (
                            <label key={cat} className="flex items-center gap-2 text-[10px] font-mono text-slate-600 dark:text-slate-300 cursor-pointer">
                              <input
                                type="radio"
                                name="mp-reason-category"
                                value={cat}
                                checked={reasonPickerSelection === cat}
                                onChange={() => setReasonPickerSelection(cat)}
                                className="size-3 accent-[#0da2b3]"
                              />
                              {cat}
                            </label>
                          ))}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              disabled={!reasonPickerSelection}
                              onClick={() => {
                                if (reasonPickerSelection) {
                                  setAccessReasonCategory(reasonPickerSelection);
                                  setShowReasonPicker(false);
                                }
                              }}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                reasonPickerSelection
                                  ? "bg-[#0da2b3] text-white hover:bg-[#0c8a99]"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                              }`}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowReasonPicker(false)}
                              className="px-3 py-1 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label htmlFor="mp-access-narrative" className="text-[10px] font-bold text-slate-400 block uppercase font-sans">Narrative (optional)</label>
                      <input
                        id="mp-access-narrative"
                        type="text"
                        placeholder="One sentence explaining the access context."
                        value={accessReason}
                        onChange={(e) => setAccessReason(e.target.value)}
                        className="w-full h-9 px-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 text-slate-800 dark:text-white focus:outline-none placeholder-slate-400 font-sans"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1">
                    {[
                      "Reason logged",
                      "Mirror to operator profile",
                      "Visibility - care team"
                    ].map((term, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 uppercase leading-normal">
                        <CheckCircle className="size-3 text-emerald-500" />
                        {term}
                      </span>
                    ))}
                  </div>

                  <p className="text-[9px] text-slate-400 leading-normal pt-2 border-t border-slate-100 dark:border-white/5 font-sans">
                    Default fields visible: identifier, status, modality, last contact date. Redacted by default: coaching note content, escalation notes. Click Request unredact on any row to escalate.
                  </p>
                </div>
              </div>

              {/* Records list split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                
                {/* Left panel: Record list */}
                <div className="lg:col-span-7 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Record list - caseload</h3>
                      <p className="text-[10px] text-slate-500">22 records · opt-in by default · role-chip applies</p>
                    </div>
                    <span className="px-2 py-0.5 bg-[#0da2b3]/15 text-[#0c8a99] text-[9px] font-bold rounded uppercase">
                      Caseload
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-3 w-1/3">Airman</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Escalation</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Redaction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {[
                          { code: "A-1042", details: "Initial · sleep concerns", type: "Referral", date: "12 Jul", escalated: false, status: "Active", statCol: "blue", red: "Min-nec", isTarget: false },
                          { code: "A-1042", details: "Specialist note", type: "Note", date: "25 Jul", escalated: false, status: RECORD_STATUSES.SIGNED, statCol: "teal", red: "Min-nec", isTarget: false },
                          { code: "A-1087", details: "Contact - Pre-deployment", type: "Note", date: "25 Jul", escalated: false, status: RECORD_STATUSES.SIGNED, statCol: "teal", red: "Min-nec", isTarget: false },
                          { code: "A-1101", details: "Check-in", type: "Check-in", date: "21 Jul", escalated: false, status: "Pending", statCol: "slate", red: "Redacted", isTarget: true },
                          { code: "A-1123", details: "Burnout check-in", type: "Note", date: "26 Jul", escalated: true, status: "Active", statCol: "blue", red: "Min-nec", isTarget: false },
                          { code: "A-1145", details: "Family adjustment intake", type: "Note", date: "22 Jul", escalated: false, status: "Closed", statCol: "slate", red: "Min-nec", isTarget: false },
                          { code: "A-1058", details: "Sleep · new referral", type: "Referral", date: "27 Jul", escalated: false, status: "Awaiting", statCol: "slate", red: "Redacted", isTarget: false },
                          { code: "A-1176", details: "Pre-deployment check-in", type: "Check-in", date: "27 Jul", escalated: false, status: "Pending", statCol: "slate", red: "Redacted", isTarget: false }
                        ].map((row, idx) => (
                          <tr
                            key={idx}
                            onClick={() => {
                              setUnredactTargetId(row.code);
                              setIsUnredacted(row.red === "Min-nec");
                              triggerToast(`Selected record for: ${row.code}`);
                            }}
                            className={`transition cursor-pointer ${
                              unredactTargetId === row.code && row.isTarget
                                ? "bg-slate-50 dark:bg-slate-900/40 font-bold"
                                : "hover:bg-slate-50/20"
                            }`}
                          >
                            <td className="py-3">
                              <span className="font-bold text-slate-800 dark:text-white font-mono block">{row.code}</span>
                              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{row.details}</span>
                            </td>
                            <td className="py-3 text-slate-700 dark:text-slate-300">{row.type}</td>
                            <td className="py-3 font-mono text-[10px] text-slate-500">{row.date}</td>
                            <td className="py-3">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase ${
                                row.escalated ? "bg-rose-500/10 text-rose-500" : "bg-slate-100 dark:bg-slate-900 text-slate-400"
                              }`}>
                                {row.escalated ? "Escalated" : "—"}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-[10px]">
                              <span className={`inline-flex items-center gap-1 ${
                                row.statCol === "blue" ? "text-blue-500" :
                                row.statCol === "teal" ? "text-emerald-500" : "text-slate-400"
                              }`}>
                                <span className={`size-1 rounded-full ${
                                  row.statCol === "blue" ? "bg-blue-500" :
                                  row.statCol === "teal" ? "bg-emerald-500" : "bg-slate-400"
                                }`}></span>
                                {row.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                row.red === "Min-nec" ? "bg-blue-500/10 text-blue-500" : "bg-rose-500/15 text-rose-500"
                              }`}>
                                {row.red}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right panel: Access audit log */}
                <div className="lg:col-span-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Access audit log</h3>
                    <p className="text-[10px] text-slate-500">Every read &middot; mirrored to operator profile</p>
                  </div>

                  <div className="space-y-4 pt-1 font-sans text-xs">
                    {[
                      { time: "28 Jul · 08:42", actor: "Dr. M. Khan", log: "Opened A-1042 · reason: routine caseload review · visibility: care team" },
                      { time: "27 Jul · 16:20", actor: "Dr. M. Khan", log: "Signed + locked ENC-01218 · note sealed" },
                      { time: "27 Jul · 11:00", actor: "IDMT - Col. J. Reyes", log: "Read A-1123 · reason: escalation review · temporary clearance" },
                      { time: "26 Jul · 09:22", actor: "System", log: "Aggregate export k=5 · only non-identifying fields" },
                      { time: "25 Jul · 09:50", actor: "Dr. M. Khan", log: "Opened A-1087 · reason: follow-up session" }
                    ].map((auditRow, idx) => (
                      <div key={idx} className="border-b border-slate-50 dark:border-white/5 pb-2.5 last:border-0 last:pb-0 space-y-0.5 text-left">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{auditRow.actor}</span>
                          <span className="text-[8px] text-slate-400 font-mono">{auditRow.time}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">{auditRow.log}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Bottom Field-level role-chip preview card */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-5 text-left">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Field-level role-chip preview - {unredactTargetId}</h3>
                    <p className="text-[10px] text-slate-500">Sensitive coaching notes hidden by default - unredact requires explicit reason</p>
                  </div>
                  
                  {!isUnredacted ? (
                    <button
                      onClick={() => {
                        if (!accessReason.trim()) {
                          triggerToast("Please provide an access narrative reason category first");
                        } else {
                          setIsUnredacted(true);
                          triggerToast(`Field-level access granted for target: ${unredactTargetId}`);
                        }
                      }}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Request unredact
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsUnredacted(false);
                        triggerToast("Record fields sealed successfully");
                      }}
                      className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 transition cursor-pointer"
                    >
                      Lock records
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed font-sans">
                  
                  {/* Default view */}
                  <div className="space-y-3 border-r border-slate-100 dark:border-white/5 pr-6">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Default View</span>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Identifier:</span>
                        <span className="font-bold text-slate-800 dark:text-white">{unredactTargetId}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Status:</span>
                        <span className="text-slate-800 dark:text-white font-bold">{unredactTargetId === "A-1101" ? "Pending check-in" : "Active"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Last contact:</span>
                        <span className="text-slate-800 dark:text-white">21 Jul 2026</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Escalation:</span>
                        <span className="text-slate-400 font-bold">None</span>
                      </div>
                    </div>
                  </div>

                  {/* Redacted fields — non-clinical coaching content only,
                      no diagnostic scores. */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Redacted Fields</span>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Concern summary:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 italic font-sans truncate w-24">
                            {isUnredacted ? "Adjustment-related stress before deployment..." : "∗"}
                          </span>
                          <span className="text-[8px] bg-slate-100 dark:bg-slate-900 px-1 py-0.2 rounded text-slate-400 uppercase">concern</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Action assigned:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 italic font-sans truncate w-24">
                            {isUnredacted ? "Resource shared · follow-up set" : "∗"}
                          </span>
                          <span className="text-[8px] bg-slate-100 dark:bg-slate-900 px-1 py-0.2 rounded text-slate-400 uppercase">action</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Escalation note:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 italic font-sans truncate w-24">
                            {isUnredacted ? "None on file" : "∗"}
                          </span>
                          <span className="text-[8px] bg-slate-100 dark:bg-slate-900 px-1 py-0.2 rounded text-slate-400 uppercase">escalation</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Footnote */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-2">
                Records ID range · A-1042 &mdash; A-1199 · 22 records · 0 redacted-access events today
              </div>

            </div>
          )}

          {/* Tab 4: MESSAGES VIEW */}
          {activeTab === "messages" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Privacy strip notice banner */}
              <div className="bg-[#e0f2fe]/40 dark:bg-sky-950/5 border border-[#bae6fd]/40 dark:border-white/5 rounded-2xl p-5 text-left flex gap-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <Lock className="size-5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">Confidentiality-bounded &middot; minimum-necessary access</span>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400 font-normal">
                    Threads are bound by coaching confidentiality. Sending records an audit-log entry.
                  </p>
                </div>
              </div>

              {/* Title Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">MENTAL PERFORMANCE · MESSAGES</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans font-sans">Messages</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Confidential threads with your caseload. Not visible to leadership, peers, or aggregate views.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowNewMessageModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> New message
                  </button>
                </div>
              </div>

              {/* Chat pane grid split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Inbox Sidebar List */}
                <div className="lg:col-span-4 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Inbox</h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#0da2b3]/15 text-[#0da2b3] rounded-full text-[9px] font-bold uppercase font-mono">
                      <span className="size-1 bg-[#0da2b3] rounded-full"></span>
                      4 unread
                    </span>
                  </div>

                  <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                      type="text"
                      aria-label="Search threads"
                      placeholder="Search threads"
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#f8fafc] dark:bg-[#070a13] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  {/* List of chat items */}
                  <div className="divide-y divide-slate-100/40 dark:divide-white/5 overflow-y-auto max-h-96 pr-1 space-y-1">
                    {[
                      { initials: "TP", name: "A-1042 · T.P.", time: "08:14", txt: "Sleep diary \u2014 used the 4-7-8 twice last night", unread: 2, active: true },
                      { initials: "ML", name: "A-1087 · M.L.", time: "Yest", txt: "Can we shift our Tuesday slot?", unread: 1, active: false },
                      { initials: "RK", name: "A-1101 · R.K.", time: "26 Jul", txt: "The grounding exercise helped during the sim", unread: 1, active: false },
                      { initials: "DS", name: "A-1218 · D.S.", time: "24 Jul", txt: "Confirmed for Friday review", unread: 0, active: false },
                      { initials: "JW", name: "A-1356 · J.W.", time: "22 Jul", txt: "Thanks \u2014 the breathing script is on my phone now", unread: 0, active: false }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setViewingThread(item)}
                        className={`py-3.5 px-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                          item.active 
                            ? "bg-[#0da2b3]/10" 
                            : "hover:bg-[#f8fafc] dark:hover:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-[#0da2b3]/10 text-[#0da2b3] font-bold text-xs flex items-center justify-center font-mono select-none">
                            {item.initials}
                          </div>
                          <div className="space-y-0.5 text-left font-sans">
                            <span className="text-xs font-bold text-slate-800 dark:text-white block font-mono">{item.name}</span>
                            <p className="text-[10px] text-slate-500 truncate w-36">{item.txt}</p>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span className="text-[9px] font-mono text-slate-400">{item.time}</span>
                          {item.unread > 0 && (
                            <span className="size-4.5 rounded-full bg-[#0da2b3] text-white text-[9px] font-bold font-mono flex items-center justify-center">
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
                      <div className="size-9 rounded-full bg-[#0da2b3]/10 text-[#0da2b3] font-bold text-xs flex items-center justify-center font-mono select-none">
                        TP
                      </div>
                      <div className="text-left space-y-0.5 font-sans">
                        <span className="text-sm font-bold text-slate-800 dark:text-white font-mono block">A-1042 &middot; T.P.</span>
                        <span className="text-[10px] text-slate-400 block font-medium">Sleep concern &middot; opened 18 Jul</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[9px] font-bold rounded-full uppercase tracking-wider text-slate-500 font-mono">
                      Confidential
                    </span>
                  </div>

                  {/* Messaging records */}
                  <div className="flex-1 overflow-y-auto py-6 space-y-6 max-h-[350px] pr-2">
                    
                    <div className="w-full flex items-center justify-center select-none pb-2">
                      <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wide">
                        Thread opened · visibility bound to MP caseload · audit-logged
                      </span>
                    </div>

                    {chatMessagesList.map((msg, idx) => {
                      const showDateHeader = idx === 0 || chatMessagesList[idx - 1].date !== msg.date;
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
                                ? "bg-[#0da2b3] text-white rounded-br-none" 
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
                      aria-label="Message A-1042"
                      placeholder="Message A-1042"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                      className="flex-1 px-4 py-2 text-xs rounded-xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none placeholder-slate-400"
                    />
                    <button 
                      onClick={handleSendChatMessage}
                      className="px-4 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      Send
                    </button>
                  </div>

                </div>

              </div>

              {/* Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left">
                6 threads · 4 unread · last message 08:14 · all access-logged
              </div>

            </div>
          )}

        </main>
      </div>

      {viewingThread && (
        <RecordDetailDialog
          open={!!viewingThread}
          onClose={() => setViewingThread(null)}
          title={viewingThread.name}
          subtitle={viewingThread.txt}
          fields={[
            { label: "Last activity", value: viewingThread.time },
            { label: "Unread", value: viewingThread.unread },
            { label: "Status", value: viewingThread.active ? "Active thread" : "Inactive" },
          ]}
        />
      )}

      <CreateRecordModal
        open={showNewNoteModal}
        onClose={() => setShowNewNoteModal(false)}
        title="New session note"
        subtitle="Bound by coaching confidentiality — non-clinical."
        fields={[
          { name: "airmanCode", label: "Airman code", type: "text", placeholder: "e.g. A-1042", required: true },
          { name: "type", label: "Note type", type: "select", options: ["SOAP", "Consult", "Triage", "Follow-up"], defaultValue: "SOAP" },
          { name: "subject", label: "Subject", type: "text", required: true }
        ]}
        submitLabel="Create note"
        onSubmit={(values) => {
          const id = `N-${String(notesList.length + 1).padStart(4, "0")}`;
          const createdAt = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
          setNotesList([
            {
              id,
              airmanCode: values.airmanCode,
              type: values.type,
              subject: values.subject,
              status: "Draft",
              createdAt
            },
            ...notesList
          ]);
          setShowNewNoteModal(false);
          triggerToast(`Created: note for ${values.airmanCode}`);
        }}
      />

      <CreateRecordModal
        open={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        title="Start new outreach thread"
        subtitle="Threads are audit-logged and confidentiality-bounded."
        fields={[
          { name: "recipientName", label: "Recipient name", type: "text", placeholder: "e.g. Capt Reyes", required: true },
          { name: "recipientCode", label: "Recipient code", type: "text", placeholder: "e.g. A-1042" },
          { name: "initialMessage", label: "Initial message", type: "textarea", required: true }
        ]}
        submitLabel="Start thread"
        onSubmit={(values) => {
          const parts = values.recipientName.trim().split(/\s+/).filter(Boolean);
          const initials = parts.length === 0
            ? "NA"
            : parts.length === 1
              ? parts[0].slice(0, 2).toUpperCase()
              : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
          const code = values.recipientCode?.trim();
          const name = code ? `${code} · ${values.recipientName}` : values.recipientName;
          setInboxThreads([
            {
              initials,
              name,
              time: "now",
              txt: values.initialMessage,
              unread: false,
              active: false
            },
            ...inboxThreads
          ]);
          setShowNewMessageModal(false);
          triggerToast(`Created: thread with ${values.recipientName}`);
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

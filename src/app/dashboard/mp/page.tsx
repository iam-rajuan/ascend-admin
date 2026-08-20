"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { AscendLogo } from "@/components/ascend-logo";
import {
  Brain,
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
  ChevronRight,
} from "lucide-react";

import { RoleProfileView } from "@/components/profile/role-profile-view";
import { UserCheck } from "lucide-react";

type TabType = "dashboard" | "notes" | "records" | "messages" | "profile";

export default function MpDashboard() {
  const router = useRouter();
  const { isAuthenticated, logout, setSelectedRole } = useAuthStore();
  const [activeTabInternal, setActiveTabInternal] = useState<TabType>("dashboard");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hasMounted, setHasMounted] = useState(false);
  const [showConfirmToast, setShowConfirmToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // SOAP Editor state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [soapSubjective, setSoapSubjective] = useState("Sleep onset remains > 60 minutes on 5 of 7 nights since prior session. Reports intermittent ruminations.");
  const [soapObjective, setSoapObjective] = useState("Affect flat, oriented x3, no psychomotor agitation. PHQ-9 = 5 (mild). GAD-7 = 8 (mild-moderate). Engaged.");
  const [soapAssessment, setSoapAssessment] = useState("Adjustment-related sleep difficulty with anticipatory anxiety regarding deployment. Responding to behavioral sleep protocol.");
  const [soapPlan, setSoapPlan] = useState("Continue weekly for 3 more sessions. Add 10-min morning light exposure. Refer to PT/IM only if physical recovery lag persists.");
  const [riskSuicide, setRiskSuicide] = useState("L1");
  const [riskHomicide, setRiskHomicide] = useState("L0");
  const [riskImpairment, setRiskImpairment] = useState("L1");

  // Records Tab unredacted state
  const [unredactTargetId, setUnredactTargetId] = useState<string>("A-1101");
  const [isUnredacted, setIsUnredacted] = useState(false);
  const [accessReason, setAccessReason] = useState("");

  // Messaging Tab Chat state
  const [chatMessage, setChatMessage] = useState("");
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

  const handleBackToRoles = () => {
    setSelectedRole(null);
    router.push("/roles");
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
              <span className="size-2 rounded-full bg-[#0da2b3]"></span>
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
                  ? "bg-[#0da2b3]/10 text-[#0da2b3]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <Users className="size-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "notes" || editingNoteId
                  ? "bg-[#0da2b3]/10 text-[#0da2b3]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <ClipboardList className="size-4" />
              Notes
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "records"
                  ? "bg-[#0da2b3]/10 text-[#0da2b3]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <Lock className="size-4" />
              Records
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "messages"
                  ? "bg-[#0da2b3]/10 text-[#0da2b3]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <MessageSquare className="size-4" />
              Messages
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "profile"
                  ? "bg-[#0da2b3]/10 text-[#0da2b3]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <UserCheck className="size-4" />
              Profile
            </button>
          </nav>
        </div>

        {/* User Session Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 space-y-2">
          <button
            onClick={handleBackToRoles}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-55 dark:hover:bg-slate-900 transition cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            Back to roles
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:text-red-650 hover:bg-red-55/20 dark:hover:bg-red-950/20 transition cursor-pointer"
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
            <span className="text-xs font-medium text-slate-550 dark:text-slate-400">Mental Performance Workspace</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-slate-200 dark:border-white/5 pr-6">
              <button className="relative p-1.5 text-slate-400 hover:text-slate-655 dark:hover:text-white transition cursor-pointer">
                <Bell className="size-4.5" />
                <span className="absolute top-1 right-1 size-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0e1628]"></span>
              </button>
              <button
                onClick={toggleTheme}
                className="p-1.5 text-slate-400 hover:text-slate-655 dark:hover:text-white transition cursor-pointer"
              >
                {theme === "light" ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
              </button>
            </div>

            {/* Profile context */}
            <button
              onClick={() => setActiveTab("profile")}
              className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer text-left focus:outline-none"
              title="Click to view & edit Profile"
              type="button"
            >
              <div className="text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-white block">Dr. Aris Thorne</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight font-sans">Chief MP Psychologist</span>
              </div>
              <div className="size-8 rounded-full bg-[#0da2b3]/15 text-[#0da2b3] font-sans font-black text-xs flex items-center justify-center select-none border border-[#0da2b3]/25">
                AT
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
          {!editingNoteId && activeTab === "profile" && "CUI // OPSEC · MP User Profile & Settings"}
        </div>

        {/* 3. WORKSPACE CONTAINER */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#070a13] px-6 py-8 md:px-8 space-y-8">
          
          {!editingNoteId && activeTab === "profile" && (
            <RoleProfileView roleId="mp" roleName="MP" />
          )}
          
          {/* Active Note Editor Mode */}
          {editingNoteId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left relative">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">Session notes / MENTAL PERFORMANCE · SESSION NOTE</p>
                  <div className="flex items-baseline gap-4 mt-0.5">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-855 dark:text-white font-sans">A-1042 &middot; 28 Jul</h1>
                    <span className="text-sm font-black text-rose-500/20 uppercase tracking-widest pointer-events-none select-none">draft</span>
                  </div>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                    SOAP-structured &middot; risk-graded &middot; card-bounded. Every save is logged.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setEditingNoteId(null)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-655 dark:text-white hover:bg-slate-55 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Session notes
                  </button>
                  <button 
                    onClick={() => { setActiveTab("records"); setEditingNoteId(null); }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-655 dark:text-white hover:bg-slate-55 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Records
                  </button>
                </div>
              </div>

              {/* Warning box */}
              <div className="bg-[#e0f2fe]/40 dark:bg-sky-955/5 border border-[#bae6fd]/40 dark:border-white/5 rounded-2xl p-5 text-left flex gap-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <Shield className="size-5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">Confidentiality-bounded &middot; HIPAA-equivalent handling</span>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400 font-normal">
                    This note is bound by clinical confidentiality. Visibility selector below controls who can read this note. Default is Care Team only &mdash; aggregate is non-identifiable.
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
                        <h3 className="text-sm font-bold text-slate-855 dark:text-white font-mono">Anonymized identifier - A-1042</h3>
                        <p className="text-[10px] text-slate-455">Initials: T.P. &middot; cohort opt-in &middot; assigned 12 Jul</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => triggerToast("Note locked against modifications")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-350 transition cursor-pointer"
                        >
                          <Lock className="size-3.5" /> Lock
                        </button>
                        <button 
                          onClick={() => triggerToast("Session note draft saved")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Save note
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Date</span>
                        <span className="text-slate-700 dark:text-slate-350">28 Jul 2026</span>
                        <span className="text-[10px] text-slate-455 block font-sans">09:30 · 50 min</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Modality</span>
                        <span className="text-slate-700 dark:text-slate-350">Individual</span>
                        <span className="text-[10px] text-slate-455 block font-sans">In-person · clinic 4B</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Encounter #</span>
                        <span className="text-slate-700 dark:text-slate-350">ENC-04218</span>
                        <span className="text-[10px] text-slate-455 block font-sans">4 of 8 planned</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Status</span>
                        <span className="text-amber-500 font-bold">Draft</span>
                        <span className="text-[10px] text-slate-455 block font-sans">auto-saved 08:14</span>
                      </div>
                    </div>
                  </div>

                  {/* SOAP fields */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
                    
                    {/* Subjective */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-slate-800 dark:text-white">S</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subjective</span>
                        <span className="text-[9px] text-slate-455 ml-auto font-mono">airman-reported</span>
                      </div>
                      <textarea 
                        rows={2}
                        value={soapSubjective}
                        onChange={(e) => setSoapSubjective(e.target.value)}
                        className="w-full p-3.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0da2b3]/50 leading-relaxed font-sans"
                      />
                    </div>

                    {/* Objective */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-slate-800 dark:text-white">O</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Objective</span>
                        <span className="text-[9px] text-slate-455 ml-auto font-mono">clinician-observed</span>
                      </div>
                      <textarea 
                        rows={2}
                        value={soapObjective}
                        onChange={(e) => setSoapObjective(e.target.value)}
                        className="w-full p-3.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0da2b3]/50 leading-relaxed font-sans"
                      />
                    </div>

                    {/* Assessment */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-slate-800 dark:text-white">A</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessment</span>
                        <span className="text-[9px] text-slate-455 ml-auto font-mono">clinical formulation</span>
                      </div>
                      <textarea 
                        rows={2}
                        value={soapAssessment}
                        onChange={(e) => setSoapAssessment(e.target.value)}
                        className="w-full p-3.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0da2b3]/50 leading-relaxed font-sans"
                      />
                    </div>

                    {/* Plan */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-slate-800 dark:text-white">P</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan</span>
                        <span className="text-[9px] text-slate-455 ml-auto font-mono">next steps</span>
                      </div>
                      <textarea 
                        rows={2}
                        value={soapPlan}
                        onChange={(e) => setSoapPlan(e.target.value)}
                        className="w-full p-3.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0da2b3]/50 leading-relaxed font-sans"
                      />
                    </div>
                  </div>

                  {/* Risk assessment levels */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-2 font-sans">Risk assessment</h3>
                    
                    <div className="space-y-4 text-xs font-sans">
                      {[
                        { label: "Suicide / self-harm", val: riskSuicide, setVal: setRiskSuicide, levels: ["L0", "L1", "L2", "L3", "L4", "L5"] },
                        { label: "Homicide / harm to others", val: riskHomicide, setVal: setRiskHomicide, levels: ["L0", "L1", "L2", "L3", "L4", "L5"] },
                        { label: "Operational impairment", val: riskImpairment, setVal: setRiskImpairment, levels: ["L0", "L1", "L2", "L3"] }
                      ].map((riskRow, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="font-bold text-slate-700 dark:text-slate-300 sm:w-44">{riskRow.label}</span>
                          <div className="flex gap-2">
                            {riskRow.levels.map((lvl) => {
                              const isActive = riskRow.val === lvl;
                              return (
                                <button
                                  key={lvl}
                                  onClick={() => riskRow.setVal(lvl)}
                                  className={`px-3 py-1 rounded text-[10px] font-bold font-mono transition cursor-pointer border ${
                                    isActive
                                      ? "bg-[#0da2b3]/15 border-[#0da2b3] text-[#0da2b3] ring-1 ring-[#0da2b3]"
                                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                  }`}
                                >
                                  {lvl}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visibility controls */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Visibility</h3>
                      <span className="text-[10px] text-slate-455 font-mono">Default: Care team only</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { title: "Care team", desc: "MP staff on caseload · IDMT on request", active: true },
                        { title: "IDMT only", desc: "Restricted to Integrated Delivery Medical Team", active: false },
                        { title: "Aggregated", desc: "Non-identifiable cohort summary · k>5", active: false }
                      ].map((vis, i) => (
                        <div 
                          key={i} 
                          onClick={() => triggerToast(`Visibility adjusted to: ${vis.title}`)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition text-left space-y-1.5 ${
                            vis.active 
                              ? "bg-[#0da2b3]/10 border-[#0da2b3]/30" 
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-slate-350 dark:hover:border-white/10"
                          }`}
                        >
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white">{vis.title}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed font-sans">{vis.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Note save action buttons */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => triggerToast("Authoring note draft saved")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-55 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Save draft
                    </button>
                    <button 
                      onClick={() => {
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
                  
                  {/* Recent notes */}
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

                  {/* Audit log */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-2 font-sans">Audit log</h3>
                    <div className="space-y-3 font-mono text-[10px]">
                      {[
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
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-855 dark:text-white font-sans">Mental Performance caseload</h1>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                    22 airmen on caseload &middot; 6 new referrals this week &middot; 8 sessions scheduled today. Calm, quiet, confidential. Recommendations are issued as Mental-Performance Actions using only O7&mdash;O9, D3, W5&mdash;W6, M5&mdash;M6.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("records")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-655 dark:text-white hover:bg-slate-55 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Records
                  </button>
                  <button 
                    onClick={() => { setEditingNoteId("A-1042"); triggerToast("Editing SOAP session notes template draft"); }}
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
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 block uppercase tracking-wider">{kpi.name}</span>
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
                      <h3 className="text-sm font-bold text-slate-855 dark:text-white">Caseload queue</h3>
                      <p className="text-[10px] text-slate-455">Anonymized identifiers &middot; case-level summary only</p>
                    </div>

                    <div className="flex gap-2">
                      {["Active", "Due", "L3+"].map((pill, idx) => (
                        <button
                          key={idx}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                            pill === "Active"
                              ? "bg-[#0da2b3]/10 border-[#0da2b3]/30 text-[#0da2b3]"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-855"
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
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-55/20 transition">
                            <td className="py-3 font-bold text-slate-800 dark:text-white font-mono">{row.code}</td>
                            <td className="py-3 text-slate-700 dark:text-slate-350">{row.reason}</td>
                            <td className="py-3 text-slate-500 font-mono text-[10px]">{row.last}</td>
                            <td className="py-3 text-slate-550 dark:text-slate-400 font-mono text-[10px]">{row.next}</td>
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
                        <h3 className="text-xs font-bold text-slate-855 dark:text-white">Mental driver scores</h3>
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
                          <span className="font-bold text-slate-655 dark:text-slate-350">{drv.name}</span>
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
                      <h3 className="text-xs font-bold text-slate-855 dark:text-white">Today's sessions</h3>
                      <p className="text-[9px] text-slate-455">8 scheduled &middot; 2 group</p>
                    </div>

                    <div className="space-y-4 text-xs font-sans text-left">
                      {[
                        { time: "09:30 - A-1042", label: "Individual · Sleep concern · L1", badge: "L1", bCol: "bg-blue-500/10 text-blue-500" },
                        { time: "10:15 - A-1087", label: "Individual · Pre-deployment stress · L2", badge: "L2", bCol: "bg-amber-500/15 text-amber-500" },
                        { time: "11:00 - Group", label: "Group · Resiliency · 6 attendees · L0", badge: "L0", bCol: "bg-slate-100 dark:bg-slate-900 text-slate-400" },
                        { time: "14:15 - A-1101", label: "Individual · Performance anxiety · L1", badge: "L1", bCol: "bg-blue-500/10 text-blue-500" },
                        { time: "15:00 - A-1123", label: "Individual · Burnout · L3 — monitored", badge: "L3", bCol: "bg-rose-500/10 text-rose-500" }
                      ].map((s, idx) => (
                        <div key={idx} className="border-b border-slate-50 dark:border-white/5 pb-2 last:border-0 last:pb-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] font-bold text-slate-800 dark:text-white font-mono">{s.time}</span>
                            <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-full font-mono uppercase ${s.bCol}`}>
                              {s.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-455 font-medium">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Referral reasons summary */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-855 dark:text-white">Referral reasons &mdash; last 30 days</h3>
                  <p className="text-[10px] text-slate-455">Distribution across 6 active referrals &middot; aggregate only</p>
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
              <div className="bg-[#f1f5f9] dark:bg-[#0e1628]/60 p-5 rounded-2xl border border-slate-200 dark:border-white/5 text-left text-[10px] text-slate-550 dark:text-slate-400 space-y-2 leading-relaxed font-sans">
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
              <div className="bg-[#e0f2fe]/40 dark:bg-sky-955/5 border border-[#bae6fd]/40 dark:border-white/5 rounded-2xl p-5 text-left flex gap-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
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
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-855 dark:text-white font-sans">Session notes</h1>
                  <p className="text-xs text-slate-550 dark:text-slate-455 mt-1">
                    Notes for your caseload, newest first. SOAP-structured, risk-graded, and bound to your role &mdash; every open and save is logged.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setEditingNoteId("A-1042"); triggerToast("Starting new SOAP note entry template"); }}
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
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white">Notes &middot; 12</h3>
                    <p className="text-[10px] text-slate-455">Sorted by session date &middot; drafts expire 72 h after the session</p>
                  </div>

                  <div className="flex gap-2">
                    {["All", "Drafts", "Signed", "Risk-flagged"].map((noteFilter, idx) => (
                      <button
                        key={idx}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          noteFilter === "All"
                            ? "bg-[#0da2b3]/10 border-[#0da2b3]/30 text-[#0da2b3]"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-855"
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
                        <th className="pb-3">Risk</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {[
                        { code: "A-1042", sessions: "6 sessions", date: "28 Jul", type: "Follow-up", focus: "Sleep concern", risk: "L1", riskCol: "blue", status: "Draft", statusCol: "orange", dot: "red" },
                        { code: "A-1087", sessions: "3 sessions", date: "27 Jul", type: "Follow-up", focus: "Pre-deployment stress", risk: "L2", riskCol: "orange", status: "Draft", statusCol: "orange", dot: "red" },
                        { code: "A-1101", sessions: "8 sessions", date: "26 Jul", type: "Follow-up", focus: "Performance anxiety", risk: "L1", riskCol: "blue", status: "Signed", statusCol: "green", dot: "green" },
                        { code: "A-1218", sessions: "2 sessions", date: "25 Jul", type: "Intake", focus: "Adjustment", risk: "L1", riskCol: "blue", status: "Signed", statusCol: "green", dot: "green" },
                        { code: "A-1356", sessions: "5 sessions", date: "24 Jul", type: "Follow-up", focus: "Focus & recovery", risk: "L0", riskCol: "slate", status: "Signed", statusCol: "green", dot: "green" },
                        { code: "A-1409", sessions: "1 session", date: "23 Jul", type: "Intake", focus: "Referral · SCS", risk: "L2", riskCol: "orange", status: "Signed", statusCol: "green", dot: "green" },
                        { code: "A-1042", sessions: "6 sessions", date: "21 Jul", type: "Follow-up", focus: "Sleep concern", risk: "L1", riskCol: "blue", status: "Signed", statusCol: "green", dot: "green" },
                        { code: "A-1533", sessions: "4 sessions", date: "20 Jul", type: "Follow-up", focus: "Team cohesion", risk: "L0", riskCol: "slate", status: "Signed", statusCol: "green", dot: "green" },
                        { code: "A-1087", sessions: "3 sessions", date: "18 Jul", type: "Intake", focus: "Pre-deployment stress", risk: "L2", riskCol: "orange", status: "Signed", statusCol: "green", dot: "green" },
                        { code: "A-1101", sessions: "8 sessions", date: "17 Jul", type: "Follow-up", focus: "Performance anxiety", risk: "L1", riskCol: "blue", status: "Signed", statusCol: "green", dot: "green" }
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-55/20 transition">
                          <td className="py-3">
                            <span className="font-bold text-slate-800 dark:text-white font-mono block">{row.code}</span>
                            <span className="text-[10px] text-slate-455 font-medium block mt-0.5">{row.sessions}</span>
                          </td>
                          <td className="py-3 text-slate-700 dark:text-slate-350 font-mono">{row.date}</td>
                          <td className="py-3 text-slate-500 font-medium">{row.type}</td>
                          <td className="py-3 text-slate-700 dark:text-slate-350 font-bold">{row.focus}</td>
                          <td className="py-3">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase ${
                              row.riskCol === "blue" ? "bg-blue-500/10 text-blue-500" :
                              row.riskCol === "orange" ? "bg-amber-500/10 text-amber-500" :
                              "bg-slate-100 dark:bg-slate-900 text-slate-400"
                            }`}>
                              {row.risk}
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
                                triggerToast(`Opening SOAP note editor for encounter: ${row.code}`);
                              }}
                              className="px-3 py-1 border border-slate-200 dark:border-white/10 hover:bg-slate-55 dark:hover:bg-slate-900 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
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
                  <span className="text-[10px] text-slate-455 font-mono">1&mdash;10 of 12</span>
                  <div className="flex items-center gap-1">
                    <button className="p-1 px-2 border border-slate-200 dark:border-white/5 text-[10px] text-slate-400 rounded hover:bg-slate-50">&lt;</button>
                    <button className="p-1 px-2 border border-slate-200 dark:border-white/10 text-[10px] text-[#0da2b3] font-bold rounded bg-[#0da2b3]/10">1</button>
                    <button className="p-1 px-2 border border-slate-200 dark:border-white/5 text-[10px] text-slate-555 rounded hover:bg-slate-50">2</button>
                    <button className="p-1 px-2 border border-slate-200 dark:border-white/5 text-[10px] text-slate-555 rounded hover:bg-slate-55">&gt;</button>
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
              <div className="bg-[#e0f2fe]/40 dark:bg-sky-955/5 border border-[#bae6fd]/40 dark:border-white/5 rounded-2xl p-5 text-left flex gap-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <Lock className="size-5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">Confidentiality-bounded &middot; minimum-necessary access</span>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400 font-normal">
                    Records default to care-team minimum-necessary. Aggregate fields shown only when k&ge;5. Sensitive clinical fields are redacted by default and require explicit access with reason.
                  </p>
                </div>
              </div>

              {/* Title Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider font-sans">MENTAL PERFORMANCE · RECORDS</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-855 dark:text-white font-sans">Mental health records</h1>
                  <p className="text-xs text-slate-550 dark:text-slate-450 mt-1">
                    Referrals, sessions, and screenings. Redaction applied at the field level. Every access requires a reason.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("dashboard")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-655 dark:text-white hover:bg-slate-55 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={() => { setEditingNoteId("A-1042"); triggerToast("Starting new note draft template"); }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> New note
                  </button>
                </div>
              </div>

              {/* Access Reason Card */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div>
                  <span className="text-[8px] font-bold text-slate-455 block uppercase tracking-wider font-sans">Access reason required</span>
                  <h3 className="text-sm font-bold text-slate-855 dark:text-white mt-0.5 font-sans">State your access reason</h3>
                  <p className="text-[10px] text-slate-455">Every record open is logged with this reason. The operator sees who accessed their record, when, and why.</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase font-sans">Reason category</label>
                      <div className="w-full h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 flex items-center justify-between px-3 text-xs text-slate-455 select-none cursor-pointer">
                        <span>Select category</span>
                        <ChevronDown className="size-4 text-slate-400" />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase font-sans">Narrative (optional)</label>
                      <input 
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
                    Default fields visible: identifier, status, modality, last session date. Redacted by default: clinical content, screening scores, risk notes. Click Request unredact on any row to escalate.
                  </p>
                </div>
              </div>

              {/* Records list split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                
                {/* Left panel: Record list */}
                <div className="lg:col-span-7 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-855 dark:text-white font-sans">Record list - caseload</h3>
                      <p className="text-[10px] text-slate-455">22 records · opt-in by default · role-chip applies</p>
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
                          <th className="pb-3">Risk</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Redaction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {[
                          { code: "A-1042", details: "Initial · sleep concerns", type: "Referral", date: "12 Jul", risk: "L1", col: "blue", status: "Active", statCol: "blue", red: "Min-nec", isTarget: false },
                          { code: "A-1042", details: "Session note SOAP", type: "Note", date: "25 Jul", risk: "L1", col: "blue", status: "Signed", statCol: "teal", red: "Min-nec", isTarget: false },
                          { code: "A-1087", details: "Session - Pre-deployment", type: "Note", date: "25 Jul", risk: "L2", col: "orange", status: "Signed", statCol: "teal", red: "Min-nec", isTarget: false },
                          { code: "A-1101", details: "Screening - GAD-7", type: "Screening", date: "21 Jul", risk: "L1", col: "blue", status: "Pending", statCol: "slate", red: "Redacted", isTarget: true },
                          { code: "A-1123", details: "Burnout screening", type: "Note", date: "26 Jul", risk: "L3", col: "rose", status: "Active", statCol: "blue", red: "Min-nec", isTarget: false },
                          { code: "A-1145", details: "Family adjustment intake", type: "Note", date: "22 Jul", risk: "L0", col: "slate", status: "Closed", statCol: "slate", red: "Min-nec", isTarget: false },
                          { code: "A-1058", details: "Sleep · new referral", type: "Referral", date: "27 Jul", risk: "L0", col: "slate", status: "Awaiting", statCol: "slate", red: "Redacted", isTarget: false },
                          { code: "A-1176", details: "Pre-deployment screening", type: "Screening", date: "27 Jul", risk: "L0", col: "slate", status: "Pending", statCol: "slate", red: "Redacted", isTarget: false }
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
                                : "hover:bg-slate-55/20"
                            }`}
                          >
                            <td className="py-3">
                              <span className="font-bold text-slate-800 dark:text-white font-mono block">{row.code}</span>
                              <span className="text-[10px] text-slate-455 font-medium block mt-0.5">{row.details}</span>
                            </td>
                            <td className="py-3 text-slate-655 dark:text-slate-350">{row.type}</td>
                            <td className="py-3 font-mono text-[10px] text-slate-550">{row.date}</td>
                            <td className="py-3">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase ${
                                row.col === "blue" ? "bg-blue-500/10 text-blue-500" :
                                row.col === "orange" ? "bg-amber-500/10 text-amber-500" :
                                row.col === "rose" ? "bg-rose-500/10 text-rose-500" :
                                "bg-slate-100 dark:bg-slate-900 text-slate-400"
                              }`}>
                                {row.risk}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-[10px]">
                              <span className={`inline-flex items-center gap-1 ${
                                row.statCol === "blue" ? "text-blue-500" :
                                row.statCol === "teal" ? "text-emerald-500" : "text-slate-400"
                              }`}>
                                <span className={`size-1 rounded-full ${
                                  row.statCol === "blue" ? "bg-blue-500" :
                                  row.statCol === "teal" ? "bg-emerald-500" : "bg-slate-450"
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
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white font-sans">Access audit log</h3>
                    <p className="text-[10px] text-slate-455">Every read &middot; mirrored to operator profile</p>
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
                          <span className="font-bold text-slate-700 dark:text-slate-350">{auditRow.actor}</span>
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
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white font-sans">Field-level role-chip preview - {unredactTargetId}</h3>
                    <p className="text-[10px] text-slate-455">Sensitive clinical content hidden by default - unredact requires explicit reason</p>
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
                      className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-650 transition cursor-pointer"
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
                        <span className="text-slate-800 dark:text-white font-bold">{unredactTargetId === "A-1101" ? "Pending screening" : "Active"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Last contact:</span>
                        <span className="text-slate-800 dark:text-white">21 Jul 2026</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Risk level:</span>
                        <span className="text-blue-500 font-bold">L1</span>
                      </div>
                    </div>
                  </div>

                  {/* Redacted fields */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Redacted Fields</span>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">PHQ-9 score:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">{isUnredacted ? "9" : "∗"}</span>
                          <span className="text-[8px] bg-slate-100 dark:bg-slate-900 px-1 py-0.2 rounded text-slate-400 uppercase">9</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">GAD-7 score:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">{isUnredacted ? "12" : "∗"}</span>
                          <span className="text-[8px] bg-slate-100 dark:bg-slate-900 px-1 py-0.2 rounded text-slate-400 uppercase">12</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Clinical free text:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-455 italic font-sans truncate w-24">
                            {isUnredacted ? "Adjustment-related anxiety..." : "∗"}
                          </span>
                          <span className="text-[8px] bg-slate-100 dark:bg-slate-900 px-1 py-0.2 rounded text-slate-400 uppercase">notes body</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Risk justification:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-455 italic font-sans truncate w-24">
                            {isUnredacted ? "Deployment prep stressors..." : "∗"}
                          </span>
                          <span className="text-[8px] bg-slate-100 dark:bg-slate-900 px-1 py-0.2 rounded text-slate-400 uppercase">rationale</span>
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
              <div className="bg-[#e0f2fe]/40 dark:bg-sky-955/5 border border-[#bae6fd]/40 dark:border-white/5 rounded-2xl p-5 text-left flex gap-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <Lock className="size-5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">Confidentiality-bounded &middot; HIPAA-equivalent handling</span>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400 font-normal">
                    Threads are bound by clinical confidentiality. Sending records an audit-log entry.
                  </p>
                </div>
              </div>

              {/* Title Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">MENTAL PERFORMANCE · MESSAGES</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-855 dark:text-white font-sans font-sans">Messages</h1>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                    Confidential threads with your caseload. Not visible to leadership, peers, or aggregate views.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => triggerToast("Outreach thread draft initialized")}
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
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white font-sans">Inbox</h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#0da2b3]/15 text-[#0da2b3] rounded-full text-[9px] font-bold uppercase font-mono">
                      <span className="size-1 bg-[#0da2b3] rounded-full"></span>
                      4 unread
                    </span>
                  </div>

                  <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search threads"
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#f8fafc] dark:bg-[#070a13] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  {/* List of chat items */}
                  <div className="divide-y divide-slate-150/40 dark:divide-white/5 overflow-y-auto max-h-96 pr-1 space-y-1">
                    {[
                      { initials: "TP", name: "A-1042 · T.P.", time: "08:14", txt: "Sleep diary \u2014 used the 4-7-8 twice last night", unread: 2, active: true },
                      { initials: "ML", name: "A-1087 · M.L.", time: "Yest", txt: "Can we shift our Tuesday slot?", unread: 1, active: false },
                      { initials: "RK", name: "A-1101 · R.K.", time: "26 Jul", txt: "The grounding exercise helped during the sim", unread: 1, active: false },
                      { initials: "DS", name: "A-1218 · D.S.", time: "24 Jul", txt: "Confirmed for Friday review", unread: 0, active: false },
                      { initials: "JW", name: "A-1356 · J.W.", time: "22 Jul", txt: "Thanks \u2014 the breathing script is on my phone now", unread: 0, active: false }
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => triggerToast(`Opened message history with: ${item.name}`)}
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
                            <span className="text-xs font-bold text-slate-850 dark:text-white block font-mono">{item.name}</span>
                            <p className="text-[10px] text-slate-455 truncate w-36">{item.txt}</p>
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
                        <span className="text-[10px] text-slate-400 block font-medium">Sleep concern &middot; L1 &middot; opened 18 Jul</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-white/10 text-[9px] font-bold rounded-full uppercase tracking-wider text-slate-500 font-mono">
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

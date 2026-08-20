"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { AscendLogo } from "@/components/ascend-logo";
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

import { RoleProfileView } from "@/components/profile/role-profile-view";
import { UserCheck } from "lucide-react";

type TabType = "caseload" | "reflections" | "messages" | "profile";

export default function PcDashboard() {
  const router = useRouter();
  const { isAuthenticated, logout, setSelectedRole } = useAuthStore();
  const [activeTabInternal, setActiveTabInternal] = useState<TabType>("caseload");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hasMounted, setHasMounted] = useState(false);
  const [showConfirmToast, setShowConfirmToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // Chat messaging state
  const [chatMessage, setChatMessage] = useState("");
  const [messagesList, setMessagesList] = useState([
    { sender: "coach", text: "Try the 5-minute gratitude block tonight — no writing needed, just the sitting.", time: "18:40", date: "26 JULY" },
    { sender: "airman", text: "Did it two nights running. Quieter than I expected.", time: "21:05", date: "26 JULY" },
    { sender: "coach", text: "Wednesday's reflection arrived. \"Finally sat with the question long enough to hear my own answer.\" I read it three times. Want to sit with that one next week?", time: "09:14", date: "27 JULY" },
    { sender: "airman", text: "Yes. Wednesday works. Same time?", time: "09:31", date: "27 JULY" }
  ]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowConfirmToast(true);
    setTimeout(() => setShowConfirmToast(false), 3000);
  };

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
                  ? "bg-[#0da2b3]/10 text-[#0da2b3] dark:text-[#0da2b3]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <Home className="size-4" />
              Caseload
            </button>
            <button
              onClick={() => setActiveTab("reflections")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "reflections"
                  ? "bg-[#0da2b3]/10 text-[#0da2b3] dark:text-[#0da2b3]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <FileText className="size-4" />
              Reflections
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "messages"
                  ? "bg-[#0da2b3]/10 text-[#0da2b3] dark:text-[#0da2b3]"
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
                  ? "bg-[#0da2b3]/10 text-[#0da2b3] dark:text-[#0da2b3]"
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
            <span className="text-xs font-medium text-slate-550 dark:text-slate-400">Purpose Coach</span>
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
                <span className="text-xs font-bold text-slate-800 dark:text-white block">Capt E. Rostova</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight">Performance Coach</span>
              </div>
              <div className="size-8 rounded-full bg-[#0da2b3]/15 text-[#0da2b3] font-sans font-black text-xs flex items-center justify-center select-none border border-[#0da2b3]/25">
                ER
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
          {activeTab === "profile" && "CUI // OPSEC · PC User Profile & Settings"}
        </div>

        {/* 3. WORKSPACE CONTAINER */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#070a13] px-6 py-8 md:px-8 space-y-8">
          
          {activeTab === "profile" && (
            <RoleProfileView roleId="pc" roleName="PC" />
          )}
          
          {/* Active opt-in consent required warning banner */}
          <div className="bg-[#fffbeb] dark:bg-amber-950/10 text-slate-800 dark:text-slate-200 p-5 rounded-2xl border border-amber-250 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-left">
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
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-855 dark:text-white">Today's caseload</h1>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                    Tuesday, 28 July · A quiet day ahead. Three pastoral consults, twenty-two active reflections, and one first-time engagement to welcome. Take what's here.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("reflections")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-655 dark:text-white hover:bg-slate-55 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Reflection log
                  </button>
                  <button 
                    onClick={() => triggerToast("Starting new confidential pastoral note")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 block uppercase tracking-wider">{kpi.name}</span>
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
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white">Caseload · opted-in</h3>
                    <p className="text-[10px] text-slate-455">Anonymized codes only. No rank, no PII. Use codes when messaging or referencing in pastoral notes.</p>
                  </div>
                  <div className="flex gap-2">
                    {["All themes", "Active", "Needs outreach"].map((pill, idx) => (
                      <button
                        key={idx}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          pill === "All themes"
                            ? "bg-[#0da2b3]/10 border-[#0da2b3]/30 text-[#0da2b3]"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-850 dark:hover:text-white"
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
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-55/20 transition">
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
                          <td className="py-3.5 text-slate-700 dark:text-slate-350">{row.date}</td>
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
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white">Reflection themes · this month</h3>
                    <p className="text-[10px] text-slate-455 mt-0.5">Aggregated across 22 entries. Identifies only themes, never authorship.</p>
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
                        <span className="font-bold text-slate-800 dark:text-slate-250 w-20 flex-shrink-0">{themeRow.label}</span>
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-400 dark:bg-slate-600 rounded-full" style={{ width: `${themeRow.pct}%` }}></div>
                        </div>
                        <span className="w-12 text-right font-mono text-slate-500">{themeRow.val} entries</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[9px] text-slate-400 leading-normal pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 font-mono">
                    <span className="size-2 rounded-full bg-amber-500"></span>
                    Theme-count &middot; Of 22 active reflections
                  </p>
                </div>

                {/* Pastoral care today */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white">Pastoral care · today</h3>
                    <p className="text-[10px] text-slate-455 mt-0.5">Three consults on the schedule. Two are returning, one is a welcome.</p>
                  </div>

                  {/* Vertical Timeline registry */}
                  <div className="relative pl-6 border-l-2 border-slate-100 dark:border-white/5 space-y-6 ml-2 text-xs font-sans pt-2">
                    {[
                      {
                        time: "09:30 - 45 min",
                        title: "A-1042 · Returning",
                        desc: "Continuation - cadence holds steady",
                        badge: "Returning",
                        badgeCol: "bg-slate-100 dark:bg-slate-800 text-slate-655"
                      },
                      {
                        time: "11:15 - 60 min",
                        title: "A-1503 · First-time engagement",
                        desc: "Welcome, consent, listening",
                        badge: "Welcome",
                        badgeCol: "bg-[#0da2b3]/15 text-[#0da2b3]"
                      },
                      {
                        time: "14:00 - 30 min",
                        title: "A-1087 · Brief check-in",
                        desc: "Light pastoral touch · grief, paused",
                        badge: "Brief",
                        badgeCol: "bg-slate-100 dark:bg-slate-800 text-slate-655"
                      }
                    ].map((evt, idx) => (
                      <div key={idx} className="relative space-y-1">
                        {/* Timeline Bullet circle */}
                        <span className="absolute -left-[30px] top-1.5 size-2 rounded-full bg-slate-350 dark:bg-slate-600 border border-white dark:border-[#0e1628]"></span>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-bold text-slate-400 tracking-wide block uppercase">{evt.time}</span>
                          <div className="flex items-center justify-between gap-4">
                            <h4 className="text-xs font-bold text-slate-850 dark:text-white font-mono">{evt.title}</h4>
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
              <div className="bg-[#f1f5f9] dark:bg-[#0e1628]/60 p-5 rounded-2xl border border-slate-200 dark:border-white/5 text-left text-[10px] text-slate-550 dark:text-slate-400 space-y-2 leading-relaxed font-sans">
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
              <div className="bg-[#e0f2fe]/40 dark:bg-sky-955/5 border border-[#bae6fd]/40 dark:border-white/5 rounded-2xl p-5 text-left flex gap-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
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
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-855 dark:text-white">Reflections & records</h1>
                  <p className="text-xs text-slate-550 dark:text-slate-450 mt-1">
                    Opt-in confirmations, reflection entries, and confidential notes for airmen who consented to the Purpose pathway.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("caseload")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-655 dark:text-white hover:bg-slate-55 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Caseload
                  </button>
                  <button 
                    onClick={() => triggerToast("Initializing chaplain reach out message")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> Reach out
                  </button>
                </div>
              </div>

              {/* Opt-in confirmation audit */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-855 dark:text-white">Opt-in confirmation audit</h3>
                  <p className="text-[10px] text-slate-455">Every opt-in and opt-out is timestamped and immutable. Trail visible only to Purpose pathway roles.</p>
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
                        { code: "A-1042", status: "Opted in", recorded: "14 Mar · 14:02", method: "Secure form - signed", witness: "Chaplain (Capt. R. Owens)", col: "blue" },
                        { code: "A-1087", status: "Opted in", recorded: "02 Apr · 09:30", method: "In-person - verbal confirmation", witness: "Chaplain (Capt. R. Owens)", col: "blue" },
                        { code: "A-1218", status: "Revoked - paused", recorded: "19 May · 11:11", method: "Casual contact - on request", witness: "—", col: "purple" },
                        { code: "A-1503", status: "Opted in", recorded: "28 Jul · 08:55", badge: "Today", method: "In-person - verbal confirmation", witness: "Chaplain (Capt. R. Owens)", col: "blue" }
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-55/20 transition">
                          <td className="py-3.5 font-bold text-slate-855 dark:text-white font-mono">{row.code}</td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              row.col === "blue" ? "bg-sky-500/10 text-sky-600" : "bg-purple-500/10 text-purple-600"
                            }`}>
                              <span className={`size-1.5 rounded-full ${row.col === "blue" ? "bg-sky-500" : "bg-purple-500"}`}></span>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-700 dark:text-slate-350 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span>{row.recorded}</span>
                              {row.badge && (
                                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold rounded">
                                  {row.badge}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 text-slate-550 dark:text-slate-400">{row.method}</td>
                          <td className="py-3.5 text-slate-550 dark:text-slate-400 font-bold">{row.witness}</td>
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
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white">Spiritual reflection entries</h3>
                    <p className="text-[10px] text-slate-455">22 active reflections this month. Entries are private to the consenting airman and to you.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["All themes", "Purpose", "Grief", "Transition"].map((themeFilter, idx) => (
                      <button
                        key={idx}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          themeFilter === "All themes"
                            ? "bg-[#0da2b3]/10 border-[#0da2b3]/30 text-[#0da2b3]"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-855 dark:hover:text-white"
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
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Search</label>
                    <input
                      type="text"
                      placeholder="Search by code or theme"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">From</label>
                    <input
                      type="text"
                      defaultValue="01 Jul 2026"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">To</label>
                    <input
                      type="text"
                      defaultValue="28 Jul 2026"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      onClick={() => triggerToast("Filtering reflection entries list")}
                      className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-[#0da2b3] hover:text-white text-slate-700 dark:text-white text-xs font-bold rounded-lg cursor-pointer transition"
                    >
                      Filter
                    </button>
                  </div>
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
                      {[
                        { date: "27 Jul", code: "A-1042", theme: "Purpose", len: "312 words", preview: "“Finally sat with the question long enough to hear my own answer.”", flag: "Pastoral", col: "green" },
                        { date: "26 Jul", code: "A-1356", theme: "Values", len: "184 words", preview: "“Wrote down the three things I won't trade. They held up.”", flag: "Pastoral", col: "green" },
                        { date: "24 Jul", code: "A-1218", theme: "Grief", len: "421 words", preview: "“Not ready to talk about it. But I want a place to put the words.”", flag: "Tender", col: "green" },
                        { date: "22 Jul", code: "A-1087", theme: "Transition", len: "256 words", preview: "“PCS in nine weeks. Trying to be present here, now.”", flag: "Pastoral", col: "green" },
                        { date: "21 Jul", code: "A-1421", theme: "Meaning", len: "298 words", preview: "“The quiet still finds me, even on the good days.”", flag: "Pastoral", col: "green" },
                        { date: "19 Jul", code: "A-1042", theme: "Gratitude", len: "147 words", preview: "“A long walk. Cold air. The first star I noticed all month.”", flag: "Pastoral", col: "green" }
                      ].map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-55/20 transition">
                          <td className="py-3 text-slate-500 font-mono">{p.date}</td>
                          <td className="py-3 font-bold text-slate-800 dark:text-white font-mono">{p.code}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              p.theme === "Grief" ? "bg-sky-500/10 text-sky-600" : "bg-purple-500/10 text-purple-650"
                            }`}>
                              {p.theme}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500 font-mono text-[10px]">{p.len}</td>
                          <td className="py-3 text-slate-700 dark:text-slate-350 italic font-serif leading-relaxed text-[11px]">{p.preview}</td>
                          <td className="py-3 text-right">
                            <span className="inline-flex items-center gap-1 font-bold text-[9px] text-[#0da2b3] uppercase font-sans">
                              <span className="size-1.5 rounded-full bg-[#0da2b3]"></span>
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
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white font-sans">Pastoral note - A-1503</h3>
                    <p className="text-[10px] text-slate-455 mt-0.5">Privileged - visible only to you</p>
                  </div>

                  <div className="pt-2 space-y-3">
                    <textarea 
                      rows={4}
                      defaultValue="First-time engagement. Airman arrived quiet, attentive. Asked about cadence (weekly) —"
                      className="w-full p-3.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0da2b3]/50 leading-relaxed font-sans"
                    />
                    <div className="text-[9px] text-slate-400 font-medium">This note is privileged communication. Not for leadership review.</div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button 
                      onClick={() => triggerToast("Note draft saved")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-55 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Save draft
                    </button>
                    <button 
                      onClick={() => triggerToast("Confidential pastoral note saved to ledger")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Save pastoral note
                    </button>
                  </div>
                </div>

                {/* Records access log */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white font-sans">Records access log</h3>
                    <p className="text-[10px] text-slate-455 mt-0.5">Every read, write, and export is recorded. Audit only — never surfaced to leadership.</p>
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
                          <tr key={idx} className="hover:bg-slate-55/20 transition">
                            <td className="py-3 text-slate-500">{logRow.time}</td>
                            <td className="py-3 text-slate-700 dark:text-slate-350">{logRow.act}</td>
                            <td className="py-3 font-bold text-slate-800 dark:text-white">{logRow.rec}</td>
                          </tr>
                        ))}
                        {/* Export row */}
                        <tr className="hover:bg-slate-55/20 transition">
                          <td className="py-3 text-slate-500">27 Jul · 11:20</td>
                          <td className="py-3 text-slate-700 dark:text-slate-350">Exported</td>
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
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-855 dark:text-white font-sans">Messages</h1>
                <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                  One thread per airman. Private to the airman &mdash; not visible to leadership.
                </p>
              </div>

              {/* Chat pane grid split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Threads Sidebar Panel */}
                <div className="lg:col-span-4 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white">Threads</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0da2b3]/15 text-[#0da2b3] rounded-full text-[9px] font-bold uppercase font-mono">
                      <span className="size-1 bg-[#0da2b3] rounded-full"></span>
                      3 unread
                    </span>
                  </div>

                  <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by code"
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#f8fafc] dark:bg-[#070a13] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  {/* Threads list */}
                  <div className="divide-y divide-slate-150/40 dark:divide-white/5 overflow-y-auto max-h-96 pr-1 space-y-1">
                    {[
                      { code: "A-1042", time: "26 Jul", txt: "Yes. Wednesday works. Same time?", unread: 2, active: true },
                      { code: "A-1087", time: "24 Jul", txt: "Booked Wed 14:00. I'll be there.", unread: 0, active: false },
                      { code: "A-1218", time: "22 Jul", txt: "Reading the passage you shared. Thank you.", unread: 1, active: false },
                      { code: "A-1356", time: "20 Jul", txt: "Weekly reflections sent &mdash; thank you.", unread: 0, active: false }
                    ].map((thread, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => triggerToast(`Opened message history with: ${thread.code}`)}
                        className={`py-3.5 px-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                          thread.active 
                            ? "bg-[#0da2b3]/10" 
                            : "hover:bg-[#f8fafc] dark:hover:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-[#0da2b3]/10 text-[#0da2b3] font-bold text-xs flex items-center justify-center font-mono select-none">
                            A1
                          </div>
                          <div className="space-y-0.5 text-left">
                            <span className="text-xs font-bold text-slate-800 dark:text-white font-mono block">{thread.code}</span>
                            <p className="text-[10px] text-slate-455 leading-tight truncate w-36" dangerouslySetInnerHTML={{ __html: thread.txt }}></p>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span className="text-[9px] font-mono text-slate-400">{thread.time}</span>
                          {thread.unread > 0 && (
                            <span className="size-4.5 rounded-full bg-[#0da2b3] text-white text-[9px] font-bold font-mono flex items-center justify-center">
                              {thread.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main chat Pane */}
                <div className="lg:col-span-8 bg-[#f8fafc] dark:bg-[#0b0f19] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[500px]">
                  
                  {/* Chat header */}
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 pb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-[#0da2b3]/10 text-[#0da2b3] font-bold text-xs flex items-center justify-center font-mono">
                        A1
                      </div>
                      <div className="text-left space-y-0.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-white font-mono block">A-1042</span>
                        <span className="text-[10px] text-slate-400 block font-medium">Opted in &middot; private to the airman</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-white/10 text-[9px] font-bold rounded-full uppercase tracking-wider text-slate-500 font-mono">
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
                        End-to-end · private to A-1042 · not visible to leadership
                      </span>
                    </div>
                  </div>

                  {/* Message Input box */}
                  <div className="border-t border-slate-200/60 dark:border-white/5 pt-4 flex-shrink-0 flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Message A-1042"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 px-4 py-2 text-xs rounded-xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none placeholder-slate-400"
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="px-4 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
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

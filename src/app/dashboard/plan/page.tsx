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
} from "lucide-react";

import { RoleProfileView } from "@/components/profile/role-profile-view";
import { UserCheck } from "lucide-react";

type TabType = "dashboard" | "assignment" | "reconditioning" | "profile";

export default function PlanDashboard() {
  const router = useRouter();
  const { isAuthenticated, logout, setSelectedRole } = useAuthStore();
  const [activeTabInternal, setActiveTabInternal] = useState<TabType>("dashboard");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hasMounted, setHasMounted] = useState(false);
  const [showConfirmToast, setShowConfirmToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowConfirmToast(true);
    setTimeout(() => setShowConfirmToast(false), 3000);
  };

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
    if (savedTab && ["dashboard", "assignment", "reconditioning", "profile"].includes(savedTab)) {
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
    setTheme(initialTheme);
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
      
      {/* TOAST FEEDBACK BANNER */}
      {showConfirmToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl shadow-2xl border border-slate-700 dark:border-slate-300 text-xs font-semibold animate-fade-in">
          <CheckCircle className="size-4 text-[#0da2b3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-[#0e1628] text-slate-600 dark:text-slate-300 flex flex-col justify-between border-r border-slate-200 dark:border-white/5 flex-shrink-0 z-30">
        <div>
          {/* Brand logo wrapper */}
          <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#0da2b3]"></span>
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
                  ? "bg-[#0da2b3]/10 text-[#0da2b3] dark:text-[#0da2b3]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <ClipboardList className="size-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("assignment")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "assignment"
                  ? "bg-[#0da2b3]/10 text-[#0da2b3] dark:text-[#0da2b3]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <Layers className="size-4" />
              Assignment
            </button>
            <button
              onClick={() => setActiveTab("reconditioning")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "reconditioning"
                  ? "bg-[#0da2b3]/10 text-[#0da2b3] dark:text-[#0da2b3]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-55/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <Activity className="size-4" />
              Reconditioning
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
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
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
            <span className="text-xs font-medium text-slate-550 dark:text-slate-400">Plan</span>
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
                <span className="text-xs font-bold text-slate-800 dark:text-white block">Lt Col A. Park</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight">Plan · Wing scheduler</span>
              </div>
              <div className="size-8 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 font-sans font-black text-xs flex items-center justify-center select-none">
                AP
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
          
          {activeTab === "profile" && (
            <RoleProfileView roleId="plan" roleName="Plan" />
          )}

          {/* Tab 1: MAIN DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Heading Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">PLAN · DASHBOARD</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-855 dark:text-white">Plan dashboard</h1>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                    KPIs, recent plans, assignment queue, and coordination activity across all linked workspaces.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => triggerToast("Opening full scheduling overview")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-655 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => triggerToast("Creating new custom readiness plan")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> New plan
                  </button>
                </div>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { name: "Active plans", count: "24", desc: "across 3 flights" },
                  { name: "Awaiting assignment", count: "6", desc: "drafted, not routed" },
                  { name: "In reconditioning", count: "8", desc: "multi-specialist" },
                  { name: "Cross-persona", count: "12", desc: "touching \u2265 2 roles" }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 block uppercase tracking-wider">{kpi.name}</span>
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
                    <h3 className="text-lg font-bold text-slate-855 dark:text-white">Active plans by owner</h3>
                    <p className="text-xs text-slate-500">Each plan is owned by at least one role &middot; moves through the linked workspaces</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full text-[9px] font-bold text-slate-500 uppercase">
                      <span className="size-1.5 rounded-full bg-slate-900 dark:bg-white"></span>
                      5 workspaces
                    </span>
                    <button
                      onClick={() => triggerToast("Opening general assignments queue")}
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
                          <p className="text-[10px] text-slate-455 block">{item.desc}</p>
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
                          <p className="text-[10px] text-slate-455 block">{item.desc}</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">{item.badge}</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 font-mono uppercase">{item.k}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mental Perf Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">Mental Perf</span>
                      <span className="text-[10px] text-slate-400 font-mono">4</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Stress & sleep reset", desc: "Opt-in · wk 2 of 4", badge: "Mental", k: "k=12" },
                        { title: "Pre-deployment briefing", desc: "One-off · complete", badge: "Brief", k: null }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-455 block">{item.desc}</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">{item.badge}</span>
                            {item.k && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 font-mono uppercase">{item.k}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nutrition Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">Nutrition</span>
                      <span className="text-[10px] text-slate-400 font-mono">3</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Hydration ramp", desc: "Caseload · wk 1 of 4", badge: "Hydration", k: "k=18" },
                        { title: "Nutrition prep · OFT", desc: "Active · wk 2", badge: "Nutrition", k: null }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-455 block">{item.desc}</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">{item.badge}</span>
                            {item.k && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 font-mono uppercase">{item.k}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Purpose Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">Purpose</span>
                      <span className="text-[10px] text-slate-400 font-mono">2</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Mission purpose cohort", desc: "Opt-in · wk 3", badge: "Purpose", k: "k=10" },
                        { title: "Pre-deployment purpose", desc: "Active · wk 1", badge: "Purpose", k: null }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-455 block">{item.desc}</p>
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
                      <h3 className="text-sm font-bold text-slate-855 dark:text-white font-sans">Recent plans</h3>
                      <p className="text-[10px] text-slate-455 mt-0.5">Last 6 &middot; any status</p>
                    </div>
                    <button 
                      onClick={() => triggerToast("Showing all historical readiness plans")}
                      className="px-3 py-1 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-655 dark:text-slate-350 hover:bg-slate-55 dark:hover:bg-slate-900 transition cursor-pointer"
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
                        {[
                          { title: "4-week recovery · Bravo", desc: "Recovery · strength", owners: "SCS · PT/IM", k: "k=24", status: "Active", col: "green", time: "28 Jul · 06:00" },
                          { title: "Stress & sleep reset", desc: "Mental · 4-week", owners: "Mental Perf · SCS", k: "k=12", status: "Opt-in", col: "teal", time: "27 Jul · 22:18" },
                          { title: "Hydration ramp · Foxtrot", desc: "Nutrition · 4-week", owners: "Nutrition · SCS", k: "k=18", status: "Active", col: "green", time: "27 Jul · 14:55" },
                          { title: "Pre-deployment purpose", desc: "Purpose · one-off", owners: "Purpose · SCS", k: "k=10", status: "Active", col: "green", time: "26 Jul · 11:03" },
                          { title: "Mission purpose cohort", desc: "Purpose · 6-week", owners: "Purpose · SCS", k: "k=10", status: "Opt-in", col: "teal", time: "25 Jul · 09:14" },
                          { title: "OFT prep · Alpha", desc: "Strength · 6-week", owners: "SCS · PT/IM", k: "k=22", status: "Active", col: "green", time: "24 Jul · 07:00" }
                        ].map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-55/20 transition">
                            <td className="py-3.5">
                              <span className="font-bold text-slate-800 dark:text-white block">{p.title}</span>
                              <span className="text-[10px] text-slate-455 mt-0.5 block font-sans">{p.desc}</span>
                            </td>
                            <td className="py-3.5 text-slate-700 dark:text-slate-300 font-bold font-sans">{p.owners}</td>
                            <td className="py-3.5 text-slate-500 font-mono">{p.k}</td>
                            <td className="py-3.5">
                              <span className={`inline-flex items-center gap-1.5 font-bold text-[9px] uppercase ${
                                p.col === "green" ? "text-emerald-500" : "text-[#0da2b3]"
                              }`}>
                                <span className={`size-1.5 rounded-full ${p.col === "green" ? "bg-emerald-500" : "bg-[#0da2b3]"}`}></span>
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
                      <h3 className="text-sm font-bold text-slate-855 dark:text-white font-sans">Assignment queue</h3>
                      <p className="text-[10px] text-slate-455 mt-0.5">Plans drafted, awaiting routing</p>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full uppercase">
                      6 open
                    </span>
                  </div>

                  <div className="space-y-4">
                    {[
                      { title: "Recovery block · Charlie", desc: "Authored · needs SCS + PT/IM owner · 6d", badge: "6d", col: "orange" },
                      { title: "Sleep reset · Bravo", desc: "Authored · needs Mental Performance · 3d", badge: "3d", col: "orange" },
                      { title: "Nutrition prep · OFT", desc: "Authored · needs Nutrition + SCS · 2d", badge: "2d", col: "teal" },
                      { title: "Pre-deployment brief", desc: "Authored · needs Purpose + SCS · 1d", badge: "1d", col: "teal" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 p-3.5 bg-[#f8fafc] dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl hover:shadow-sm transition cursor-pointer">
                        <div className="space-y-0.5 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white font-sans">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{item.desc}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                          item.col === "orange" ? "bg-amber-500/15 text-amber-600" : "bg-[#0da2b3]/15 text-[#0c8a99]"
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
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-855 dark:text-white">New plan · 4-week recovery · Bravo</h1>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                    Author a structured plan from a template. Route to roles. Assign cohort.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => triggerToast("Authoring draft saved to local database")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-655 dark:text-white hover:bg-slate-55 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Save draft
                  </button>
                  <button 
                    onClick={() => triggerToast("Readiness plan sent to owner specialists for approval")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Send className="size-3.5" /> Send to owners
                  </button>
                </div>
              </div>

              {/* Draft Info Banner */}
              <div className="bg-[#e0f2fe]/40 dark:bg-sky-955/5 border border-[#bae6fd]/40 dark:border-white/5 rounded-2xl p-5 md:p-6 text-left space-y-4">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-900 text-white dark:bg-slate-800 rounded px-2.5 py-0.5 text-[9px] font-mono inline-block">
                    DRAFT
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Auto-saved</span>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-850 dark:text-white">Plan authoring &mdash; structured doc</h2>
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
                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-[9px] font-bold text-slate-550 dark:text-slate-400 leading-normal uppercase">
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
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white">Outline</h3>
                    <p className="text-[10px] text-slate-455 mt-0.5">Drag to reorder · click to edit</p>
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
                            ? "bg-[#0da2b3]/10 text-[#0da2b3]" 
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
                      <h3 className="text-sm font-bold text-slate-855 dark:text-white mt-0.5">Plan metadata</h3>
                      <p className="text-[10px] text-slate-455">Name the plan, pick a template, and define the lifecycle.</p>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Plan name</label>
                        <input 
                          type="text" 
                          defaultValue="4-week recovery · Bravo"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:border-[#0da2b3]/50 font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block uppercase">Template</label>
                          <div className="w-full h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 flex items-center justify-between px-3 text-xs text-slate-455 select-none cursor-pointer">
                            <span>Select template</span>
                            <ChevronDown className="size-4 text-slate-400" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block uppercase">Window</label>
                          <div className="w-full h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-between px-3 text-xs text-slate-700 dark:text-slate-350 cursor-pointer">
                            <span className="font-bold">20 Jul &mdash; 15 Aug 2025 · 4 weeks</span>
                            <ChevronDown className="size-4 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 02 */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 text-left">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">SECTION 02</span>
                      <h3 className="text-sm font-bold text-slate-855 dark:text-white mt-0.5">Goal & rationale</h3>
                      <p className="text-[10px] text-slate-455">Author the cohort-level rationale. Members may reference aggregate trends; identifiers are not allowed here.</p>
                    </div>

                    <div className="pt-2">
                      <textarea 
                        rows={4}
                        defaultValue="Recovery protocol rollout in response to the +1.2 MoM lift in wing OPS. Sleep watch on Delta flight is the cohort-level driver."
                        className="w-full p-3.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0da2b3]/50 leading-relaxed font-sans"
                      />
                    </div>
                  </div>

                  {/* Section 03 */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 text-left">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">SECTION 03</span>
                      <h3 className="text-sm font-bold text-slate-855 dark:text-white mt-0.5">Cadence & schedule</h3>
                      <p className="text-[10px] text-slate-455">Define the schedule. Daily capture is encouraged but never mandatory; weekly aggregate is the minimum cadence for k &ge; 5 reporting.</p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 pt-2">
                      <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#0da2b3] text-white cursor-pointer transition">
                        Daily
                      </button>
                      {["Weekly", "Bi-weekly", "Ad-hoc"].map((c, i) => (
                        <button key={i} className="px-4 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-655 dark:text-slate-350 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 04 */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 text-left">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">SECTION 04</span>
                      <h3 className="text-sm font-bold text-slate-855 dark:text-white mt-0.5">Owner routing</h3>
                      <p className="text-[10px] text-slate-455">Route the plan to one or more owners across linked workspaces. Each owner inherits a role-keyed scope.</p>
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
                            { role: "MENTAL PERFORMANCE", req: "Advisory", col: "orange", r: false, w: false, n: true },
                            { role: "NUTRITIONIST", req: null, col: null, r: false, w: false, n: false },
                            { role: "PURPOSE COACH", req: null, col: null, r: "lock", w: false, n: false }
                          ].map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                              <td className="py-3 font-bold text-slate-700 dark:text-slate-300 font-sans">{row.role}</td>
                              <td className="py-3">
                                {row.req ? (
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                    row.col === "teal" ? "bg-[#0da2b3]/15 text-[#0c8a99]" :
                                    row.col === "indigo" ? "bg-indigo-500/15 text-indigo-500" :
                                    "bg-amber-500/15 text-amber-500"
                                  }`}>
                                    {row.req}
                                  </span>
                                ) : "—"}
                              </td>
                              <td className="py-3">
                                {row.r === "lock" ? <Lock className="size-3 text-slate-400" /> :
                                 row.r ? <span className="size-1.5 rounded-full bg-emerald-500 inline-block"></span> : "—"}
                              </td>
                              <td className="py-3">
                                {row.w ? <span className="size-1.5 rounded-full bg-emerald-500 inline-block"></span> : "—"}
                              </td>
                              <td className="py-3">
                                {row.n ? <span className="size-1.5 rounded-full bg-emerald-500 inline-block"></span> : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 05 */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 text-left">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">SECTION 05</span>
                      <h3 className="text-sm font-bold text-slate-855 dark:text-white mt-0.5">Cohort & scope</h3>
                      <p className="text-[10px] text-slate-455">Cohort minimum (k) is enforced at every data point. Select the cohort scope or import an existing one.</p>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Cohort</label>
                        <div className="w-full h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 flex items-center justify-between px-3 text-xs text-slate-455 select-none cursor-pointer">
                          <span>Select cohort scope</span>
                          <ChevronDown className="size-4 text-slate-400" />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button 
                          onClick={() => triggerToast("Authoring draft saved for routing later")}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-55 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          Save & route later
                        </button>
                        <button 
                          onClick={() => triggerToast("Readiness plan sent to owners for review")}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
                  <h3 className="text-base font-bold text-slate-855 dark:text-white">Switch template</h3>
                  <p className="text-xs text-slate-500">Pre-defined cadences &middot; cross-persona by default</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[
                    { cat: "Recovery", title: "4-week reconditioning", desc: "Daily capture · weekly review · aggregate progress at k \u2265 5", b1: "4 weeks", b2: "k \u2265 5" },
                    { cat: "Strength", title: "6-week strength block", desc: "SCS-led · strength + mobility · OFT prep cadence", b1: "6 weeks", b2: "SCS-led" },
                    { cat: "Mental", title: "Sleep reset", desc: "Mental Performance-led · opt-in cohort · 4 weeks", b1: "4 weeks", b2: "Opt-in" },
                    { cat: "Nutrition", title: "Hydration ramp", desc: "Nutrition-led · 4 weeks · daily intake check-in", b1: "4 weeks", b2: "Caseload" },
                    { cat: "Pre-deployment", title: "Nutrition prep", desc: "Nutrition + SCS · pre-deployment · 3 weeks", b1: "3 weeks", b2: "Cross-persona" },
                    { cat: "Purpose", title: "Purpose cohort", desc: "Purpose Coach-led · opt-in · 6 weeks", b1: "6 weeks", b2: "Opt-in" }
                  ].map((tpl, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => triggerToast(`Switched active template to: ${tpl.title}`)}
                      className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 hover:border-[#0da2b3]/55 rounded-2xl p-5 shadow-sm hover:shadow flex flex-col justify-between h-44 cursor-pointer text-left transition"
                    >
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">{tpl.cat}</span>
                        <h4 className="text-sm font-bold text-slate-855 dark:text-white mt-1">{tpl.title}</h4>
                        <p className="text-[10px] text-slate-455 leading-relaxed mt-2">{tpl.desc}</p>
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
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-855 dark:text-white">Reconditioning program</h1>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                    4 / 6-week blocks. Daily / weekly schedule. Aggregate progress by flight (k &ge; 5). Cross-persona coordination.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("dashboard")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-655 dark:text-white hover:bg-slate-55 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Plan dashboard
                  </button>
                  <button 
                    onClick={() => triggerToast("Initializing new reconditioning block")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 block uppercase tracking-wider">{kpi.name}</span>
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
                    <h3 className="text-base font-bold text-slate-855 dark:text-white">Reconditioning templates</h3>
                    <p className="text-xs text-slate-500">Pre-defined cadences · cross-persona by default · k &ge; 5 at every aggregate view</p>
                  </div>
                  <button 
                    onClick={() => triggerToast("Opening switch templates dialog")}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Switch template
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                  {[
                    { cat: "Recovery", title: "4-week reconditioning", desc: "Daily capture · weekly review · aggregate progress at k \u2265 5", b1: "4 weeks", b2: "k \u2265 5" },
                    { cat: "Strength", title: "6-week strength block", desc: "SCS-led · strength + mobility · OFT prep cadence", b1: "6 weeks", b2: "SCS-led" },
                    { cat: "Mental", title: "Sleep reset", desc: "Mental Performance-led · opt-in cohort · 4 weeks", b1: "4 weeks", b2: "Opt-in" },
                    { cat: "Nutrition", title: "Hydration ramp", desc: "Nutrition-led · 4 weeks · daily intake check-in", b1: "4 weeks", b2: "Caseload" },
                    { cat: "Pre-deployment", title: "Nutrition prep", desc: "Nutrition + SCS · pre-deployment · 3 weeks", b1: "3 weeks", b2: "Cross-persona" }
                  ].map((tpl, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => triggerToast(`Switched active template to: ${tpl.title}`)}
                      className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 hover:border-[#0da2b3]/55 rounded-2xl p-5 shadow-sm hover:shadow flex flex-col justify-between h-44 cursor-pointer text-left transition"
                    >
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">{tpl.cat}</span>
                        <h4 className="text-xs font-bold text-slate-855 dark:text-white mt-1 leading-tight">{tpl.title}</h4>
                        <p className="text-[9px] text-slate-455 leading-relaxed mt-2">{tpl.desc}</p>
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
                    <h3 className="text-lg font-bold text-slate-855 dark:text-white">Aggregate progress by cohort - k &ge; 5</h3>
                    <p className="text-xs text-slate-550">Each row is a flight cohort · k is enforced · progress shown as cohort mean</p>
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
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                        {[
                          { name: "Flight Alpha - aggregate", details: "k=22 · OFT prep", block: "6-week strength", wk: "2 of 6", adh: "88%", pct: 88, owners: ["SCS", "PT/IM"], status: "On track", col: "green" },
                          { name: "Flight Bravo - aggregate", details: "k=24 · recovery", block: "4-week recovery", wk: "2 of 4", adh: "81%", pct: 81, owners: ["SCS", "PT/IM"], status: "On track", col: "green" },
                          { name: "Flight Charlie - aggregate", details: "k=20 · mobility", block: "4-week mobility", wk: "1 of 4", adh: "76%", pct: 76, owners: ["SCS"], status: "Ramping", col: "teal" },
                          { name: "Foxtrot - aggregate", details: "k=18 · hydration ramp", block: "4-week nutrition", wk: "1 of 4", adh: "74%", pct: 74, owners: ["NUTRITION"], status: "Ramping", col: "teal" },
                          { name: "Opt-in: Sleep reset", details: "k=12 · Mental Perf", block: "4-week sleep", wk: "2 of 4", adh: "65%", pct: 65, owners: ["MENTAL PERF"], status: "Watch", col: "orange" },
                          { name: "Opt-in: Mission purpose", details: "k=10 · Purpose", block: "6-week purpose", wk: "2 of 6", adh: "91%", pct: 91, owners: ["PURPOSE"], status: "On track", col: "green" },
                          { name: "Caseload: Lower-back RTD", details: "k=8 · PT/IM", block: "6-week rehab", wk: "3 of 6", adh: "85%", pct: 85, owners: ["PT/IM"], status: "On track", col: "green" },
                          { name: "Caseload: Pre-OFT clearance", details: "k=14 · PT/IM", block: "1-week clearance", wk: "1 of 1", adh: "92%", pct: 100, owners: ["PT/IM"], status: "Cleared", col: "green" }
                        ].map((c, i) => (
                          <tr key={i} className="hover:bg-slate-55/20 transition">
                            <td className="py-3">
                              <span className="font-bold text-slate-800 dark:text-white block">{c.name}</span>
                              <span className="text-[10px] text-slate-455 mt-0.5 block font-sans">{c.details}</span>
                            </td>
                            <td className="py-3 text-slate-700 dark:text-slate-300 font-bold">{c.block}</td>
                            <td className="py-3 font-mono text-[10px]">{c.wk}</td>
                            <td className="py-3 font-mono font-bold text-slate-800 dark:text-white">{c.adh}</td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                  <div className={`h-full ${c.status === "Cleared" ? "bg-emerald-500" : "bg-[#0da2b3]"} rounded-full`} style={{ width: `${c.pct}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-1">
                                {c.owners.map((owner, oIdx) => (
                                  <span key={oIdx} className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                    owner === "SCS" ? "bg-[#0da2b3]/15 text-[#0c8a99]" :
                                    owner === "PT/IM" ? "bg-indigo-500/15 text-indigo-500" :
                                    owner === "NUTRITION" ? "bg-amber-500/15 text-amber-500" :
                                    owner === "MENTAL PERF" ? "bg-indigo-500/15 text-indigo-500" :
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
                                c.col === "teal" ? "text-[#0da2b3]" : "text-amber-500"
                              }`}>
                                <span className={`size-1.5 rounded-full ${
                                  c.col === "green" ? "bg-emerald-500" :
                                  c.col === "teal" ? "bg-[#0da2b3]" : "bg-amber-500"
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
                    <h3 className="text-lg font-bold text-slate-855 dark:text-white">Active blocks by owner</h3>
                    <p className="text-xs text-slate-500">Each block is owned by at least one role &middot; moves through the linked workspaces</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-full text-[9px] font-bold text-slate-500 uppercase">
                      <span className="size-1.5 rounded-full bg-slate-900 dark:bg-white"></span>
                      5 workspaces
                    </span>
                    <button
                      onClick={() => triggerToast("Opening general assignments queue")}
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
                          <p className="text-[10px] text-slate-455 block">{item.desc}</p>
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
                          <p className="text-[10px] text-slate-455 block">{item.desc}</p>
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

                  {/* Mental Perf Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">Mental Perf</span>
                      <span className="text-[10px] text-slate-400 font-mono">2</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Stress & sleep reset", desc: "Opt-in · wk 2 of 4", badge: "Mental", k: "k=12" },
                        { title: "Week close reflection", desc: "Scheduled · wk 4", badge: "Reflect", k: null, badgeCol: "indigo" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-455 block">{item.desc}</p>
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

                  {/* Nutrition Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">Nutrition</span>
                      <span className="text-[10px] text-slate-400 font-mono">2</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Hydration ramp", desc: "Caseload · wk 1 of 4", badge: "Hydration", k: "k=18" },
                        { title: "Nutrition prep · OFT", desc: "Active · wk 2", badge: "Nutrition", k: null }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-455 block">{item.desc}</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[8px] font-bold uppercase">{item.badge}</span>
                            {item.k && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 font-mono uppercase">{item.k}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Purpose Column */}
                  <div className="space-y-3 bg-white/40 dark:bg-slate-950/10 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">Purpose</span>
                      <span className="text-[10px] text-slate-400 font-mono">1</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Mission purpose cohort", desc: "Opt-in · wk 3", badge: "Purpose", k: "k=10" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-3.5 shadow-sm space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-455 block">{item.desc}</p>
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

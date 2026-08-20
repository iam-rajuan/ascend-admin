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
} from "lucide-react";

import { RoleProfileView } from "@/components/profile/role-profile-view";
import { UserCheck, User } from "lucide-react";

type TabType = "index" | "aggregate" | "trends" | "reports" | "briefings" | "profile";

export default function LeadershipDashboard() {
  const router = useRouter();
  const { isAuthenticated, logout, setSelectedRole } = useAuthStore();
  const [activeTabInternal, setActiveTabInternal] = useState<TabType>("index");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hasMounted, setHasMounted] = useState(false);

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
  const [showConfirmToast, setShowConfirmToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowConfirmToast(true);
    setTimeout(() => setShowConfirmToast(false), 3000);
  };

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
      
      {/* CONFIRMATION TOAST BANNER */}
      {showConfirmToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl shadow-2xl border border-slate-700 dark:border-slate-300 text-xs font-semibold animate-fade-in">
          <CheckCircle className="size-4 text-[#0da2b3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-[#0e1628] border-r border-slate-200 dark:border-white/5 flex flex-col justify-between flex-shrink-0 z-30">
        <div>
          {/* Header Brand Badge */}
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-slate-900 text-[#0da2b3] dark:bg-white dark:text-[#0da2b3] font-bold flex items-center justify-center text-xs shadow-sm">
                LE
              </div>
              <div>
                <span className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-white block leading-tight">
                  Leadership
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wider">
                  OPS COMMAND METRICS
                </span>
              </div>
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
                      ? "bg-[#0da2b3]/10 text-[#0da2b3]"
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
                      ? "bg-[#0da2b3]/10 text-[#0da2b3]"
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
                      ? "bg-[#0da2b3]/10 text-[#0da2b3]"
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
                      ? "bg-[#0da2b3]/10 text-[#0da2b3]"
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
                      ? "bg-[#0da2b3]/10 text-[#0da2b3]"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Layers className="size-4" />
                  Briefings
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-[#0da2b3]/10 text-[#0da2b3]"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <UserCheck className="size-4" />
                  Profile
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Sidebar Footer / Controls */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 space-y-2">
          <button
            onClick={handleBackToRoles}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            Back to roles
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
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-455">
              <span className="size-1.5 rounded-full bg-slate-300"></span>
              <span>Leadership</span>
            </div>

            {/* Profile Dropdown */}
            <button
              onClick={() => setActiveTab("profile")}
              className="flex items-center gap-2.5 pl-2 border-l border-slate-100 dark:border-white/5 text-slate-800 dark:text-white hover:opacity-80 transition cursor-pointer text-left focus:outline-none"
              title="Click to view & edit Profile"
              type="button"
            >
              <div className="size-7 rounded-full bg-slate-200 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs">
                JM
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-[11px] font-bold leading-none">
                  Lt Col J. Mendez
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 leading-none">
                  CC · 23rd SFS
                </span>
              </div>
              <ChevronDown className="size-3.5 text-slate-400 cursor-pointer" />
            </button>

            {/* Notification Bell */}
            <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <Bell className="size-4" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </button>

          </div>
        </header>

        {/* 2. CUI BANNER */}
        <section className="flex h-9 w-full items-center justify-center bg-[#101b22] px-6 text-center text-[10px] font-semibold tracking-wider text-slate-400 select-none flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#0da2b3]"></span>
            <span>CUI // OPSEC · Not a Government System of Record</span>
          </div>
        </section>

        {/* 3. MAIN SCROLLABLE VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#f8fafc] dark:bg-[#070a13] space-y-8">
          
          {activeTab === "profile" && (
            <RoleProfileView roleId="leadership" roleName="Leadership" />
          )}
          
          {activeTab === "index" && (
            <div className="space-y-8 animate-fade-in">
              {/* Privacy/Aggregate warning box */}
              <div className="bg-slate-900 text-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-800 dark:border-white/5 flex gap-3 text-xs leading-relaxed">
                <Shield className="size-5 text-[#0da2b3] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Aggregate views enforce k &ge; 5 &mdash; no group smaller than 5 is shown</span>
                  <p className="mt-0.5 text-slate-400 dark:text-slate-455">
                    Individual identifiers are never exposed. By design, leadership surfaces show flights, cohorts, and periods only &mdash; never operators.
                  </p>
                </div>
              </div>

              {/* Title Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">LEADERSHIP · WORKSPACE</p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-850 dark:text-white">Leadership</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Five aggregate surfaces. Composite OPS leads, drivers support, by-flight is utility. Every figure represents cohorts where k &ge; 5.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("aggregate")}
                  className="px-4 py-2 bg-[#0da2b3] hover:bg-[#0da2b3]/95 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer self-start md:self-center transition"
                >
                  <Activity className="size-3.5" /> Open Aggregate
                </button>
              </div>

              {/* Surfaces section */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider">SURFACES</p>
                    <h2 className="text-xl font-bold text-slate-850 dark:text-white">Leadership workspace</h2>
                    <p className="text-xs text-slate-500">Five surfaces · aggregate only · k &ge; 5 enforced on every figure</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-white/5 rounded text-[10px] font-bold font-mono text-slate-500">
                    CUI · k &ge; 5
                  </span>
                </div>

                {/* 4 Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Card 1: Aggregate */}
                  <div
                    onClick={() => setActiveTab("aggregate")}
                    className="group bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-250 cursor-pointer space-y-4 text-left"
                  >
                    <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-[#0da2b3] transition-colors">01</span>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-850 dark:text-white group-hover:text-[#0da2b3] transition-colors">Aggregate</h3>
                      <p className="text-xs text-slate-500 leading-normal">Hero trend · driver tiles · by-flight comparison</p>
                    </div>
                  </div>

                  {/* Card 2: Trends */}
                  <div
                    onClick={() => setActiveTab("trends")}
                    className="group bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-250 cursor-pointer space-y-4 text-left"
                  >
                    <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-[#0da2b3] transition-colors">02</span>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-850 dark:text-white group-hover:text-[#0da2b3] transition-colors">Trends</h3>
                      <p className="text-xs text-slate-500 leading-normal">7d / 30d / 3&ndash;12 mo · MoM · PvP comparison</p>
                    </div>
                  </div>

                  {/* Card 3: Reports */}
                  <div
                    onClick={() => setActiveTab("reports")}
                    className="group bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-250 cursor-pointer space-y-4 text-left"
                  >
                    <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-[#0da2b3] transition-colors">03</span>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-850 dark:text-white group-hover:text-[#0da2b3] transition-colors">Reports</h3>
                      <p className="text-xs text-slate-500 leading-normal">Weekly · Monthly · Quarterly · Annual aggregate</p>
                    </div>
                  </div>

                  {/* Card 4: Briefings */}
                  <div
                    onClick={() => setActiveTab("briefings")}
                    className="group bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-250 cursor-pointer space-y-4 text-left"
                  >
                    <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-[#0da2b3] transition-colors">04</span>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-850 dark:text-white group-hover:text-[#0da2b3] transition-colors">Briefings</h3>
                      <p className="text-xs text-slate-500 leading-normal">Mission · readiness · risk · recommendations</p>
                    </div>
                  </div>

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
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-850 dark:text-white">Aggregate readiness</h1>
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
                    className="px-4 py-2 bg-[#0da2b3] hover:bg-[#0da2b3]/95 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <TrendingUp className="size-3.5" /> Open trends
                  </button>
                </div>
              </div>

              {/* 12-Month Readiness Hero Card with soft cyan outer container */}
              <div className="bg-[#e0f2fe]/50 dark:bg-sky-955/10 border border-[#bae6fd]/50 dark:border-white/5 rounded-[32px] p-2 shadow-sm text-left">
                <div className="bg-white dark:bg-[#0e1628] rounded-[28px] p-6 md:p-8 space-y-6">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">COMPOSITE OPS · WING</span>
                    <h2 className="text-2xl font-black text-slate-850 dark:text-white mt-1">12-month readiness, lifted by recovery rollout</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">Cohort k = 125 · last 12 months</span>
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
                          <span className="text-7xl font-black tracking-tight text-slate-850 dark:text-white leading-none">76</span>
                          <span className="text-lg font-bold text-[#94a3b8] dark:text-slate-450 leading-none">+1.2</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 border-t border-slate-100 dark:border-white/5 pt-4 text-left">
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-555 block uppercase leading-tight">Period start</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 mt-1 block">Aug 2024 - 68</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-555 block uppercase leading-tight">Period end</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 mt-1 block">Jul 2025 - 76</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-555 block uppercase leading-tight">MoM delta</span>
                          <span className="text-[10px] font-bold text-emerald-500 mt-1 block">+3.4</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-555 block uppercase leading-tight">Target</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 mt-1 block">75</span>
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
                          stroke="#0da2b3"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <defs>
                          <linearGradient id="hero-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0da2b3" />
                            <stop offset="100%" stopColor="#0da2b3" stopOpacity="0" />
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
                    <span className="text-xs font-bold text-slate-450 leading-none">flights</span>
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
                    <h3 className="text-lg font-bold text-slate-850 dark:text-white">Driver trends</h3>
                    <p className="text-xs text-slate-505">5 drivers · sparkline + delta · month-over-month</p>
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
                        <span className="text-[11px] font-bold text-slate-655 dark:text-slate-350">{drv.name}</span>
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
                      <span className="size-2 rounded-full bg-[#0da2b3]"></span>
                      <h3 className="text-sm font-bold text-slate-850 dark:text-white">By-flight comparison</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 text-[9px] font-bold rounded">
                      6 flights · k &ge; 5
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-455 -mt-2">Readiness, MoM delta, confidence. Aggregate only &mdash; never individuals.</p>

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
                                  <div className="h-full bg-[#0da2b3] rounded-full" style={{ width: `${row.read}%` }}></div>
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
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-850 hover:bg-[#0da2b3] hover:text-white dark:hover:bg-[#0da2b3] rounded-lg text-[9px] font-bold cursor-pointer transition text-slate-600 dark:text-slate-400"
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
                      <span className="size-2 rounded-full bg-[#0da2b3]"></span>
                      <h3 className="text-sm font-bold text-slate-850 dark:text-white">Risk heatmap</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 text-[9px] font-bold rounded">
                      No cells below k=5
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-455 -mt-2">Flight + driver signal &mdash; cohort-level only</p>

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
                    <span className="font-bold text-slate-450 uppercase">Legend:</span>
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
                  <p className="text-[10px] text-slate-505 leading-normal pt-2 border-t border-slate-100 dark:border-white/5">
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
                  <p className="text-[10px] text-slate-505 leading-normal pt-2 border-t border-slate-100 dark:border-white/5">
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
                  <p className="text-[10px] text-slate-505 leading-normal pt-2 border-t border-slate-100 dark:border-white/5">
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
                      <h3 className="text-sm font-bold text-slate-850 dark:text-white">SCS + PT/IM hours coverage</h3>
                      <p className="text-[10px] text-slate-450">Scheduled + worked · 95% target · progress toward contract</p>
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
                      <h3 className="text-sm font-bold text-slate-850 dark:text-white">Monthly OFT reporting</h3>
                      <p className="text-[10px] text-slate-455">Status · pass rate · reconditioning · next due</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded">
                      k = 125
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-sans">
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 block">CURRENT</span>
                      <p className="text-lg font-bold text-slate-800 dark:text-white">104</p>
                      <span className="text-[9px] text-slate-450 block font-bold leading-normal uppercase">TESTS CONDUCTED</span>
                      <p className="text-lg font-bold text-slate-800 dark:text-white mt-2">22</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 block">NOT CURRENT</span>
                      <p className="text-lg font-bold text-slate-800 dark:text-white">17</p>
                      <span className="text-[9px] text-[#0da2b3] block font-bold leading-normal uppercase">PASS RATE</span>
                      <p className="text-lg font-bold text-slate-800 dark:text-white mt-2">92%</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 block">EXEMPT</span>
                      <p className="text-lg font-bold text-slate-800 dark:text-white">4</p>
                      <span className="text-[9px] text-slate-450 block font-bold leading-normal uppercase">IN RECOND.</span>
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
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-850 dark:text-white">Trends</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Period selector, MoM / PvP comparison, and annotated events. Composite trend leads; drivers and cohorts support the read.
                  </p>
                </div>
                
                {/* Period & Comparison Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-white dark:bg-slate-900 text-xs text-slate-650 dark:text-slate-400">
                    <button className="px-2.5 py-1 font-medium">7d</button>
                    <button className="px-2.5 py-1 font-medium">30d</button>
                    <button className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-bold text-slate-800 dark:text-white">3 mo</button>
                    <button className="px-2.5 py-1 font-medium">6 mo</button>
                    <button className="px-2.5 py-1 font-medium">12 mo</button>
                  </div>
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-white dark:bg-slate-900 text-xs text-slate-650 dark:text-slate-400">
                    <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-bold text-slate-800 dark:text-white">MoM</button>
                    <button className="px-3 py-1 font-medium">PvP</button>
                  </div>
                </div>
              </div>

              {/* Trends Compare Cohorts Warning Box */}
              <div className="bg-slate-900 text-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-800 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-left">
                <Shield className="size-5 text-[#0da2b3] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Trends compare cohorts &mdash; never individuals</span>
                  <p className="mt-0.5 text-slate-400 dark:text-slate-455 font-normal">
                    Driver trends and period deltas are computed against cohorts where k &ge; 5 is satisfied at every data point in the window.
                  </p>
                </div>
              </div>

              {/* Main Chart Hero Panel with nested cyan frame */}
              <div className="bg-[#e0f2fe]/50 dark:bg-sky-955/10 border border-[#bae6fd]/50 dark:border-white/5 rounded-[32px] p-2 shadow-sm text-left">
                <div className="bg-white dark:bg-[#0e1628] rounded-[28px] p-6 md:p-8 space-y-6">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">COMPOSITE OPS · 12 MONTH</span>
                    <h2 className="text-2xl font-black text-slate-850 dark:text-white mt-1">Composite OPS, with annotated material events</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Period: 12 months &middot; comparison: month over month &middot; cohort k = 125
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                    
                    {/* Left Big stats stack */}
                    <div className="lg:col-span-4 space-y-6 text-left">
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-7xl font-black tracking-tight text-slate-850 dark:text-white leading-none">76</span>
                          <span className="text-lg font-bold text-emerald-500 leading-none">+3.4</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 border-t border-slate-100 dark:border-white/5 pt-4 text-left">
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-555 block uppercase leading-tight">Aug 2024</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 mt-1 block">68</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-555 block uppercase leading-tight">Jul 2025</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 mt-1 block">76</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-555 block uppercase leading-tight">12-mo high</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 mt-1 block">76</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-555 block uppercase leading-tight">12-mo low</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 mt-1 block">60</span>
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
                          stroke="#0da2b3"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <defs>
                          <linearGradient id="trends-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0da2b3" />
                            <stop offset="100%" stopColor="#0da2b3" stopOpacity="0" />
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
                    <h3 className="text-lg font-bold text-slate-850 dark:text-white">Driver trends</h3>
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
                        <span className="text-[11px] font-bold text-slate-655 dark:text-slate-350">{drv.name}</span>
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
                      <span className="size-2 rounded-full bg-[#0da2b3]"></span>
                      <h3 className="text-sm font-bold text-slate-855 dark:text-white">Cohort trend breakdown</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 text-[9px] font-bold rounded">
                      3 cohorts · k &ge; 5
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-455 -mt-2">By readiness band · cohort-level deltas</p>

                  <div className="space-y-4 pt-2 font-sans text-xs">
                    {[
                      { label: "High readiness", pct: 70, val: "+2.6", color: "bg-[#0da2b3]", textCol: "text-emerald-500" },
                      { label: "Mid readiness", pct: 60, val: "+3.8", color: "bg-[#0da2b3]", textCol: "text-emerald-500" },
                      { label: "Watch band", pct: 25, val: "-1.2", color: "bg-amber-500", textCol: "text-red-500" },
                    ].map((band, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4">
                        <span className="font-bold text-slate-800 dark:text-slate-250 w-28 flex-shrink-0">{band.label}</span>
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
                      <span className="size-2 rounded-full bg-[#0da2b3]"></span>
                      <h3 className="text-sm font-bold text-slate-855 dark:text-white">Annotated events</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 text-[9px] font-bold rounded uppercase">
                      Editorial
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-455 -mt-2">Material context for period deltas</p>

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
                          <span className="text-[8px] font-bold text-[#0da2b3] tracking-wide block uppercase">{evt.date}</span>
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
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-850 dark:text-white">Reports</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Weekly, monthly, quarterly, and annual aggregate reports. Every export carries the k &ge; 5 statement and is CUI-labelled.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => triggerToast("Opening export registry library")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-655 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Download className="size-4" /> Export library
                  </button>
                  <button 
                    onClick={() => triggerToast("Initializing new custom report draft")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> New report
                  </button>
                </div>
              </div>

              {/* Warning Banner */}
              <div className="bg-slate-900 text-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-800 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-left">
                <Shield className="size-5 text-[#0da2b3] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Reports are aggregate only &middot; k &ge; 5 enforced</span>
                  <p className="mt-0.5 text-slate-400 dark:text-slate-455 font-normal">
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
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                        pill === "All"
                          ? "bg-[#0da2b3]/10 border-[#0da2b3]/30 text-[#0da2b3]"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-850 dark:hover:text-white"
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
                    placeholder="Search by title, flight, or cohort"
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0da2b3]/50 transition"
                  />
                </div>
              </div>

              {/* Recent reports list card container */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white">Recent reports</h3>
                    <p className="text-[10px] text-slate-455">Last 6 &middot; aggregate &middot; k &ge; 5</p>
                  </div>
                  <button 
                    onClick={() => triggerToast("Filtering to show all historical reports")}
                    className="px-3 py-1 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
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
                        <th className="pb-3">Period</th>
                        <th className="pb-3">Generated</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                      {[
                        {
                          title: "Wing Weekly OPS",
                          subtext: "Composite + 5 drivers · 6 flights",
                          type: "Weekly",
                          period: "21 – 27 Jul 2025",
                          gen: "28 Jul · 06:00",
                          status: "Ready",
                          color: "green"
                        },
                        {
                          title: "Monthly Cohort Review",
                          subtext: "High / mid / watch bands",
                          type: "Monthly",
                          period: "Jun 2025",
                          gen: "01 Jul · 09:14",
                          status: "Sent",
                          color: "green"
                        },
                        {
                          title: "Q2 OFT Aggregate",
                          subtext: "Pass rate · by-flight · k=125",
                          type: "Quarterly",
                          period: "Apr – Jun 2025",
                          gen: "05 Jul · 12:02",
                          status: "Archived",
                          color: "green"
                        },
                        {
                          title: "Annual Wing Readiness",
                          subtext: "FY 24 → FY 25 comparison",
                          type: "Annual",
                          period: "Aug 2024 – Jul 2025",
                          gen: "14 Jul · 16:30",
                          status: "In review",
                          color: "orange"
                        },
                        {
                          title: "Recovery Program Progress",
                          subtext: "3 flights · 12-week blocks",
                          type: "Ad-hoc",
                          period: "Mar – Jun 2025",
                          gen: "02 Jul · 10:00",
                          status: "Sent",
                          color: "green"
                        },
                        {
                          title: "Sleep Watch Brief",
                          subtext: "Delta flight · driver context",
                          type: "Ad-hoc",
                          period: "Week of 14 Jul",
                          gen: "21 Jul · 07:55",
                          status: "Draft",
                          color: "orange"
                        }
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                          <td className="py-4">
                            <span className="font-bold text-slate-800 dark:text-white block">{item.title}</span>
                            <span className="text-[10px] text-slate-455 mt-0.5 block">{item.subtext}</span>
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded text-slate-500 dark:text-slate-400">
                              {item.type}
                            </span>
                          </td>
                          <td className="py-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">{item.period}</td>
                          <td className="py-4 text-slate-655 dark:text-slate-400 font-mono text-[11px]">{item.gen}</td>
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
                              onClick={() => triggerToast(`Opening report: ${item.title}`)}
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
              </div>

              {/* Templates Section */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">TEMPLATES</span>
                    <h3 className="text-lg font-bold text-slate-855 dark:text-white">Report templates</h3>
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
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-555 block uppercase tracking-wider">{tpl.cat}</span>
                        <h4 className="text-sm font-bold text-slate-855 dark:text-white mt-1">{tpl.title}</h4>
                        <p className="text-[10px] text-slate-455 leading-relaxed mt-2">{tpl.desc}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-3 mt-3">
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                          <span className="font-bold">{tpl.per}</span> <span className="text-slate-400">&middot;</span> {tpl.sub}
                        </div>
                        <button
                          onClick={() => triggerToast(`Using template: ${tpl.title}`)}
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
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-855 dark:text-white">Briefings</h1>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                    Compose the executive briefing from a structured outline. Every section pulls from aggregate data only.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => triggerToast("Briefing draft saved to local registry")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-655 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Save draft
                  </button>
                  <button 
                    onClick={() => triggerToast("Executive briefing sent to squadron command channels")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0da2b3] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Send className="size-3.5" /> Send briefing
                  </button>
                </div>
              </div>

              {/* Warning Banner */}
              <div className="bg-slate-900 text-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-800 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-left">
                <Shield className="size-5 text-[#0da2b3] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Briefing content is aggregate only &middot; k &ge; 5 enforced</span>
                  <p className="mt-0.5 text-slate-400 dark:text-slate-455 font-normal">
                    Briefings are generated from cohorts and never embed operator identifiers. Sections pull from aggregate trend, drivers, risk, and recommendations only.
                  </p>
                </div>
              </div>

              {/* Templates Section */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5 text-left">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">TEMPLATES</span>
                  <h3 className="text-base font-bold text-slate-855 dark:text-white">Start from a template</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[
                    {
                      title: "Mission Readiness",
                      desc: "Composite trend · driver snapshot · OFT pass rate · top risk"
                    },
                    {
                      title: "Recovery Rollout",
                      desc: "Multi-flight progress · adherence · recovery signal · open risks"
                    },
                    {
                      title: "Quarterly Wing Review",
                      desc: "FY-quarter comparison · cohort bands · recommendations · next quarter"
                    }
                  ].map((tpl, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => triggerToast(`Selected template: ${tpl.title}`)}
                      className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 hover:border-[#0da2b3]/50 rounded-2xl p-5 shadow-sm hover:shadow transition cursor-pointer text-left"
                    >
                      <h4 className="text-xs font-black text-[#0da2b3] uppercase tracking-wider">{tpl.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-2">{tpl.desc}</p>
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
                        <h3 className="text-sm font-bold text-slate-855 dark:text-white">Outline</h3>
                        <p className="text-[10px] text-slate-455 mt-0.5">Drag to reorder · click to edit</p>
                      </div>
                      <button 
                        onClick={() => triggerToast("Adding new outline section block")}
                        className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
                      >
                        <Plus className="size-3 text-[#0da2b3]" /> Add section
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                      {[
                        { num: 1, name: "Mission context", desc: "Window · cohort · confidence" },
                        { num: 2, name: "Composite OPS trend", desc: "12-mo · k=125 · +3.4 PvP" },
                        { num: 3, name: "Driver snapshot", desc: "5 drivers · watch · momentum" },
                        { num: 4, name: "By-flight comparison", desc: "6 flights · k \u2265 5 · MoM" },
                        { num: 5, name: "Risk & recommendations", desc: "Sleep watch · 1 advisory open" }
                      ].map((sec, idx) => (
                        <div key={idx} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/20 transition cursor-pointer">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-white block">
                              {sec.num} &middot; {sec.name}
                            </span>
                            <span className="text-[10px] text-slate-455 block font-mono">{sec.desc}</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 font-mono">Section</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview Right Panel */}
                <div className="lg:col-span-7 bg-[#f8fafc] dark:bg-[#0b0f19] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-855 dark:text-white">Preview</h3>
                      <p className="text-[10px] text-slate-455 mt-0.5">Live · k &ge; 5 · CUI-labelled</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full text-[9px] font-bold text-slate-500 uppercase">
                        <span className="size-1.5 rounded-full bg-slate-900 dark:bg-white"></span>
                        Draft
                      </span>
                      <button 
                        onClick={() => triggerToast("Generating aggregate PDF document for download")}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Download className="size-3" /> PDF
                      </button>
                    </div>
                  </div>

                  {/* Rendered Live Briefing Text */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-5 md:p-6 shadow-sm text-xs font-sans text-slate-700 dark:text-slate-350 space-y-4 text-left leading-relaxed">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">Mission readiness &middot; 28 Jul 2025</h4>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">Aggregate view &middot; cohort k = 125 &middot; 12-month window &middot; confidence high</p>
                    </div>

                    <ul className="space-y-3 pl-2 text-[11px] list-none">
                      <li className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-1.5 before:size-1.5 before:bg-[#0da2b3] before:rounded-full">
                        Composite OPS lifted 8 points to 76 (Aug &rarr; Jul). Recovery program rollout in March is the dominant signal.
                      </li>
                      <li className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-1.5 before:size-1.5 before:bg-[#0da2b3] before:rounded-full">
                        Drivers &mdash; Physical 78 (+2), Mental 73 (+3), Purpose 75 (+2). Sleep 71 (-1, watch).
                      </li>
                      <li className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-1.5 before:size-1.5 before:bg-[#0da2b3] before:rounded-full">
                        By flight &mdash; Alpha, Bravo, Charlie, Echo, Foxtrot all high confidence. Delta flight flagged at cohort level (sleep watch).
                      </li>
                      <li className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-1.5 before:size-1.5 before:bg-[#0da2b3] before:rounded-full">
                        Risk &mdash; Sleep watch open, L2 advisory. No L4+ at the cohort level.
                      </li>
                      <li className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-1.5 before:size-1.5 before:bg-[#0da2b3] before:rounded-full">
                        Recommendation &mdash; Continue recovery program &middot; Sleep intervention in Delta &middot; No operational gate changes.
                      </li>
                    </ul>
                  </div>
                </div>

              </div>

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

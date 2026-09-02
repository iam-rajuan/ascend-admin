"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "@/hooks/use-theme";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AscendLogo } from "@/components/ascend-logo";
import { IconButton } from "@/components/ui/icon-button";
import { LeadershipProvider } from "../context/leadership-context";
import {
  Activity,
  ArrowLeft,
  Calendar,
  FileText,
  Home,
  LogOut,
  Moon,
  Sun,
  TrendingUp,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "index", label: "Command Overview", icon: Home, href: "/dashboard/leadership/index" },
  { id: "aggregate", label: "Aggregate Readiness", icon: Activity, href: "/dashboard/leadership/aggregate" },
  { id: "trends", label: "Aggregate Trends", icon: TrendingUp, href: "/dashboard/leadership/trends" },
  { id: "reports", label: "Reports Library", icon: FileText, href: "/dashboard/leadership/reports" },
  { id: "briefings", label: "Executive Briefings", icon: Calendar, href: "/dashboard/leadership/briefings" },
];

function LeadershipLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useCurrentUser();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const getSubSection = () => {
    if (pathname.includes("/index")) return "Command Overview";
    if (pathname.includes("/aggregate")) return "Aggregate Readiness";
    if (pathname.includes("/trends")) return "Aggregate Trends";
    if (pathname.includes("/reports")) return "Reports Library";
    if (pathname.includes("/briefings")) return "Executive Briefings";
    return "Command Overview";
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f0f4f9] font-sans text-slate-800 dark:bg-[#070a13] dark:text-slate-100">
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="z-30 flex w-64 flex-shrink-0 flex-col justify-between border-r border-slate-200 bg-white dark:border-white/5 dark:bg-[#0e1628]">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 p-5 dark:border-white/5">
              <AscendLogo width={22} height={22} showDetails={false} />
              <div>
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Leadership</span>
                <p className="text-[10px] font-medium tracking-wider text-slate-400">COMMAND OVERVIEW</p>
              </div>
            </div>

            <div className="p-3">
              <p className="px-3 pt-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Navigation</p>
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href) || (pathname === "/dashboard/leadership" && item.id === "index");
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition duration-150 cursor-pointer ${
                        isActive
                          ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/50"
                      }`}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="border-t border-slate-100 p-4 dark:border-white/5">
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-900/50 cursor-pointer"
              type="button"
            >
              <ArrowLeft className="size-4" />
              My profile
            </button>
          </div>
        </aside>

        {/* MAIN BODY */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="z-20 flex h-14 w-full flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-white/5 dark:bg-[#0e1628]">
            <div className="flex items-center gap-2">
              <AscendLogo width={20} height={20} showDetails={false} />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-color)]">Leadership Dashboard</span>
              <span className="text-xs text-slate-300 dark:text-slate-600">/</span>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{getSubSection()}</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden rounded-full border border-slate-200/55 bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-400 dark:border-white/5 dark:bg-slate-950/40 md:flex">
                Aggregate-only leadership view
              </span>
              <button onClick={() => router.push("/dashboard/profile")} className="flex items-center gap-2.5 cursor-pointer" type="button">
                <div className="flex size-7 items-center justify-center rounded-full border border-[var(--brand-color)/25] bg-[var(--brand-color)/15] text-xs font-bold text-[var(--brand-color)]">
                  {currentUser?.initials}
                </div>
                <div className="hidden text-left lg:block">
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{currentUser?.name}</p>
                  <p className="text-[9px] text-slate-400">{currentUser?.unit}</p>
                </div>
              </button>
              <IconButton
                icon={theme === "light" ? Moon : Sun}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                onClick={toggleTheme}
              />
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-950/20 dark:bg-red-950/10 dark:text-red-400 dark:hover:bg-red-950/30 cursor-pointer"
                type="button"
              >
                <LogOut className="size-3.5" />
                Sign Out
              </button>
            </div>
          </header>

          <section className="z-10 flex h-9 w-full flex-shrink-0 items-center justify-center bg-[#101b22] px-6 text-center text-[10px] font-semibold tracking-wider text-slate-400 select-none">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[var(--brand-color)]" />
              <span>CUI // OPSEC · Leadership screens are aggregate only and enforce cohort suppression from the live backend.</span>
            </div>
          </section>

          <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-6 dark:bg-[#070a13] md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export function LeadershipLayout({ children }: { children: React.ReactNode }) {
  return (
    <LeadershipProvider>
      <LeadershipLayoutInner>{children}</LeadershipLayoutInner>
    </LeadershipProvider>
  );
}

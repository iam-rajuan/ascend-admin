"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "@/hooks/use-theme";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AscendLogo } from "@/components/ascend-logo";
import { IconButton } from "@/components/ui/icon-button";
import {
  Activity,
  ArrowLeft,
  Bell,
  Calendar,
  ClipboardList,
  FileText,
  LogOut,
  Moon,
  Shield,
  Stethoscope,
  Sun,
  TrendingUp,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp, href: "/dashboard/pt-im/dashboard" },
  { id: "injury", label: "Injury Trends", icon: Activity, href: "/dashboard/pt-im/injury" },
  { id: "records", label: "Medical Records", icon: FileText, href: "/dashboard/pt-im/records" },
  { id: "quarterly", label: "Quarterly Reports", icon: Calendar, href: "/dashboard/pt-im/quarterly" },
  { id: "scs", label: "SCS Integration", icon: ClipboardList, href: "/dashboard/pt-im/scs" },
  { id: "handoff", label: "IDMT Handoff", icon: Stethoscope, href: "/dashboard/pt-im/handoff" },
];

export function PtImLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useCurrentUser();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f4f9] font-sans text-slate-800 transition-colors duration-200 dark:bg-[#070a13] dark:text-slate-100">
      {/* SIDEBAR */}
      <aside className="z-30 flex w-64 flex-shrink-0 flex-col justify-between border-r border-slate-200 bg-white dark:border-white/5 dark:bg-[#0e1628]">
        <div>
          <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-white/5">
            <AscendLogo width={22} height={22} showDetails={false} />
            <div className="flex flex-col">
              <span className="font-sans text-xs font-bold leading-tight text-slate-800 dark:text-white">
                Ascend
              </span>
              <span className="font-sans text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                PT / IM
              </span>
            </div>
          </div>

          <div className="px-5 pb-2 pt-6 font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Clinical Workspace
          </div>

          <nav className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href) || (pathname === "/dashboard/pt-im" && item.id === "dashboard");
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? "bg-[var(--brand-color)]/10 text-[var(--brand-color)]"
                      : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-800 dark:hover:bg-slate-900/60 dark:hover:text-white"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-slate-200 p-4 dark:border-white/5">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            type="button"
          >
            <ArrowLeft className="size-4" />
            My profile
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50/50 hover:text-red-600 dark:hover:bg-red-950/20"
            type="button"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="z-20 flex h-14 w-full flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-white/5 dark:bg-[#0e1628] md:px-8">
          <div className="flex items-center gap-2">
            <AscendLogo width={20} height={20} showDetails={false} />
            <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">Ascend</span>
            <span className="select-none text-xs font-light text-slate-400 dark:text-slate-500">/</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">PT / IM Clinical Workspace</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-slate-200 pr-6 dark:border-white/5">
              <IconButton
                icon={Bell}
                aria-label="Notifications"
                className="relative cursor-pointer p-1.5 text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
                iconClassName="size-4.5"
              >
                <span className="absolute right-1 top-1 size-2 rounded-full bg-[var(--brand-color)] ring-2 ring-white dark:ring-[#0e1628]" />
              </IconButton>
              <IconButton
                icon={theme === "light" ? Moon : Sun}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                onClick={toggleTheme}
                className="cursor-pointer p-1.5 text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
                iconClassName="size-4.5"
              />
            </div>

            <button onClick={() => router.push("/dashboard/profile")} className="flex items-center gap-3 cursor-pointer" type="button">
              <div className="flex flex-col items-end text-right">
                <span className="block text-xs font-bold text-slate-800 dark:text-white">{currentUser?.name}</span>
                <span className="block font-sans text-[10px] leading-tight text-slate-400 dark:text-slate-500">{currentUser?.unit}</span>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-emerald-500 font-sans text-xs font-black text-white dark:border-white/5">
                {currentUser?.initials}
              </div>
            </button>
          </div>
        </header>

        <div className="z-10 flex h-6 w-full flex-shrink-0 items-center justify-center border-b border-slate-800 bg-slate-900 px-6 font-sans text-[9px] font-mono tracking-wider text-slate-500 select-none">
          <span className="mr-2 text-[var(--brand-color)]">•</span>
          CUI // HIPAA / Privacy Act · PT / IM Clinical Data Protected
        </div>

        <main className="flex-1 space-y-8 overflow-y-auto bg-[#f8fafc] px-6 py-8 dark:bg-[#070a13] md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

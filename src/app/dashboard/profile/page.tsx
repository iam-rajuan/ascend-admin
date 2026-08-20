"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { RoleProfileView } from "@/components/profile/role-profile-view";
import { AscendLogo } from "@/components/ascend-logo";
import { ArrowLeft, Moon, Sun, LogOut } from "lucide-react";

export default function StandaloneProfilePage() {
  const router = useRouter();
  const { isAuthenticated, selectedRole, setSelectedRole, logout } = useAuthStore();
  const [hasMounted, setHasMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, hasMounted, router]);

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

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!hasMounted || !isAuthenticated) return null;

  const currentRole = selectedRole || "Admin";
  const roleKey = currentRole.toLowerCase().replace("/", "-");

  return (
    <div className="flex h-screen flex-col bg-[#f0f4f9] dark:bg-[#070a13] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 overflow-hidden">
      {/* HEADER BAR */}
      <header className="flex h-14 w-full items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0e1628] px-6 flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <AscendLogo width={20} height={20} showDetails={false} />
          <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">Ascend</span>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-xs font-semibold text-[#0da2b3] uppercase">{currentRole} Profile</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/${roleKey}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
            type="button"
          >
            <ArrowLeft className="size-3.5" />
            Back to {currentRole} Dashboard
          </button>

          <button
            onClick={toggleTheme}
            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#070a13] hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            type="button"
          >
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 dark:border-red-950/20 dark:bg-red-950/10 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 transition cursor-pointer"
            type="button"
          >
            <LogOut className="size-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* CUI BANNER */}
      <section className="flex h-9 w-full items-center justify-center bg-[#101b22] px-6 text-center text-[10px] font-semibold tracking-wider text-slate-400 select-none flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[#0da2b3]"></span>
          <span>CUI // OPSEC · User Profile & Access Control Management</span>
        </div>
      </section>

      {/* MAIN VIEW */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <RoleProfileView
          roleId={roleKey}
          roleName={currentRole}
          onBackToDashboard={() => router.push(`/dashboard/${roleKey}`)}
        />
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { AscendLogo } from "@/components/ascend-logo";
import { LogOut, ShieldAlert } from "lucide-react";

// This page no longer lets a signed-in session pick any role — each account
// has exactly one assigned role now (see src/store/users-store.ts). It only
// exists as a landing spot for old bookmarks/back-navigation: it redirects
// straight to the signed-in user's own dashboard, or shows a fallback if no
// role could be resolved for the account.
export default function RolesPage() {
  const router = useRouter();
  const { isAuthenticated, currentUserRole, logout } = useAuthStore();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    if (!isAuthenticated) {
      router.push("/");
      return;
    }
    if (currentUserRole) {
      router.push(`/dashboard/${currentUserRole}`);
    }
  }, [hasMounted, isAuthenticated, currentUserRole, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!hasMounted || !isAuthenticated) {
    return null;
  }

  if (currentUserRole) {
    return null; // redirecting
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#f0f4f9] dark:bg-[#070a13] text-slate-800 dark:text-slate-100 font-sans px-6">
      <div className="flex flex-col items-center text-center max-w-sm">
        <AscendLogo width={36} height={36} showDetails={true} />
        <div className="mt-4 flex size-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
          <ShieldAlert className="size-6" />
        </div>
        <h2 className="mt-4 text-lg font-extrabold tracking-tight text-slate-800 dark:text-white">
          No role assigned
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Your account isn&apos;t assigned to a workspace yet. Contact your administrator to have a role assigned.
        </p>
        <button
          onClick={handleLogout}
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 dark:border-red-950/20 dark:bg-red-950/10 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-100 dark:hover:bg-red-950/30 cursor-pointer"
          type="button"
        >
          <LogOut className="size-3.5" />
          SIGN OUT
        </button>
      </div>
    </div>
  );
}

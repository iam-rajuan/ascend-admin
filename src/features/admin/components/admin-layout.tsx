"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import {
  formatAdminApiError,
  rejectAdminConfirmation,
} from "@/lib/admin-api";
import {
  useAdminStore,
  ConfirmationItem,
} from "@/store/admin-store";
import { useTheme } from "@/hooks/use-theme";
import { useCurrentUser } from "@/hooks/use-current-user";
import { IconButton } from "@/components/ui/icon-button";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { SERVICE_STATUS, ROLES } from "@/lib/terminology";
import { AscendLogo } from "@/components/ascend-logo";
import {
  Shield,
  FileText,
  Download,
  Settings,
  Lock,
  Sliders,
  Layers,
  LogOut,
  Moon,
  Sun,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

type SidebarNavItemProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active: boolean;
  badge?: string;
  badgeColor?: "red" | "yellow" | "default";
};

function SidebarNavItem({
  icon: Icon,
  label,
  href,
  active,
  badge,
  badgeColor = "default",
}: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
        active
          ? "bg-[var(--brand-color)] text-white shadow-md shadow-[var(--brand-color)/10] font-bold"
          : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`size-4 ${active ? "text-white" : "text-slate-500"}`} />
        <span>{label}</span>
      </div>
      {badge && (
        <span
          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
            badgeColor === "red"
              ? "bg-red-500/20 text-red-400"
              : badgeColor === "yellow"
              ? "bg-amber-500/20 text-amber-400"
              : "bg-slate-800 text-slate-300"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const currentUser = useCurrentUser();
  const { isAuthenticated, isHydrated, logout, accessToken } = useAuthStore();
  const adminStore = useAdminStore();
  const { initialize: initializeAdmin, approveConfirmation } = adminStore;

  const [hasMounted, setHasMounted] = useState(false);
  const [activeReviewItem, setActiveReviewItem] = useState<ConfirmationItem | null>(null);
  const [reviewRejectReason, setReviewRejectReason] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && isHydrated && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, hasMounted, isHydrated, router]);

  useEffect(() => {
    if (!hasMounted || !isHydrated || !accessToken) {
      return;
    }
    void initializeAdmin(accessToken);
  }, [accessToken, hasMounted, initializeAdmin, isHydrated]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!hasMounted || !isHydrated || !isAuthenticated) return null;

  // Determine current active section for breadcrumb & sidebar
  const getSubSection = () => {
    if (pathname.includes("/overview")) return "overview";
    if (pathname.includes("/roles")) return "roles";
    if (pathname.includes("/scope")) return "scope";
    if (pathname.includes("/audit-log")) return "audit-log";
    if (pathname.includes("/exports")) return "exports";
    if (pathname.includes("/system")) return "system";
    return "overview";
  };

  const currentSection = getSubSection();

  return (
    <div className="flex h-screen w-screen bg-[#f0f4f9] dark:bg-[#070a13] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 overflow-hidden">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-[#111827] dark:bg-[#0b0f19] text-slate-300 flex flex-col justify-between border-r border-slate-800 flex-shrink-0 z-30">
        <div>
          {/* Brand/Heading logo wrapper */}
          <div className="p-5 border-b border-slate-800/60 flex items-center gap-2">
            <AscendLogo width={22} height={22} showDetails={false} />
            <div>
              <span className="text-sm font-bold tracking-tight text-white">Dominion Performance</span>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider">DPS GLOBAL · ADMIN</p>
            </div>
          </div>

          {/* Sub Navigation Section Title */}
          <div className="px-5 pt-6 pb-2 text-[10px] font-bold text-slate-500 tracking-widest uppercase">
            Control Plane
          </div>

          {/* Nav Items */}
          <nav className="px-3 space-y-1">
            <SidebarNavItem
              icon={Sliders}
              label="Overview"
              href="/dashboard/admin/overview"
              active={currentSection === "overview"}
            />
            <SidebarNavItem
              icon={Shield}
              label="Roles"
              href="/dashboard/admin/roles"
              active={currentSection === "roles"}
            />
            <SidebarNavItem
              icon={Layers}
              label="Scope"
              href="/dashboard/admin/scope"
              active={currentSection === "scope"}
            />
            <SidebarNavItem
              icon={FileText}
              label="Audit log"
              href="/dashboard/admin/audit-log"
              active={currentSection === "audit-log"}
              badge={adminStore.recentActivity.length > 0 ? "live" : undefined}
            />
            <SidebarNavItem
              icon={Download}
              label="Exports"
              href="/dashboard/admin/exports"
              active={currentSection === "exports"}
              badge={adminStore.pendingConfirmations.filter((c) => c.action === "Export").length.toString()}
              badgeColor="yellow"
            />
            <SidebarNavItem
              icon={Settings}
              label="System"
              href="/dashboard/admin/system"
              active={currentSection === "system"}
              badge={adminStore.services.filter((s) => s.status !== SERVICE_STATUS.ONLINE).length > 0 ? "alert" : undefined}
              badgeColor="red"
            />
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/60 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 tracking-wider">
            <span>GRAPHITE CHROME</span>
            <span className="text-emerald-500">SECURE</span>
          </div>
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/60 transition cursor-pointer text-left"
            type="button"
          >
            <div className="size-8 rounded-full bg-[var(--brand-color)/20] text-[var(--brand-color)] font-bold text-xs flex items-center justify-center border border-[var(--brand-color)/30]">
              {currentUser?.initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-200 truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{currentUser?.unit || "My Profile"}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP UTILITY HEADER */}
        <header className="h-14 bg-white dark:bg-[#0e1628] border-b border-slate-200 dark:border-white/5 px-6 flex items-center justify-between flex-shrink-0 z-20">
          {/* Header left breadcrumbs */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--brand-color)] uppercase tracking-wider">
              ADMIN OVERVIEW
            </span>
            <span className="text-xs text-slate-300 dark:text-slate-600">/</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {currentSection.replace("-", " ")}
            </span>
          </div>

          {/* Header right user info / settings */}
          <div className="flex items-center gap-6">
            {/* CUI Warning center label */}
            <div className="hidden md:flex items-center gap-2 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-950/40 px-3 py-1 rounded-full border border-slate-200/55 dark:border-white/5">
              <span className="size-1.5 rounded-full bg-[var(--brand-color)] animate-pulse" />
              CUI // OPSEC · Not a Government System of Record
            </div>

            {/* Active role tag */}
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 rounded border dark:border-white/10 uppercase">
              {ROLES.ADMIN}
            </span>

            {/* User Dropdown badge */}
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="flex items-center gap-2.5 cursor-pointer"
              type="button"
            >
              <div className="size-7 rounded-full bg-[var(--brand-color)/15] text-[var(--brand-color)] font-bold text-xs flex items-center justify-center border border-[var(--brand-color)/25]">
                {currentUser?.initials}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                  {currentUser?.name}
                </p>
                <p className="text-[9px] text-slate-400 leading-none">{currentUser?.unit}</p>
              </div>
            </button>

            {/* Theme switcher */}
            <IconButton
              icon={theme === "light" ? Moon : Sun}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              onClick={toggleTheme}
            />

            {/* Disconnect session button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 dark:border-red-950/20 dark:bg-red-950/10 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-100 dark:hover:bg-red-950/30 cursor-pointer"
              type="button"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </button>
          </div>
        </header>

        {/* SUB HEADER WARNING BANNER */}
        <section className="bg-[#101b22] h-9 w-full flex items-center justify-center text-center text-[10px] font-semibold tracking-wider text-slate-400 select-none flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <Lock className="size-3.5 text-[#e2b13c]" />
            <span>
              Graphite chrome · Every mutation is reversible. Actions are logged and subject to confirmation gating.
            </span>
          </div>
        </section>

        {/* MAIN SCROLLABLE VIEW CARD */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#f8fafc] dark:bg-[#070a13] transition-colors duration-200">
          {children}
        </main>
      </div>

      {/* REVIEW CONFIRMATION DIALOG MODAL */}
      {activeReviewItem && (
        <AccessibleDialog
          open={!!activeReviewItem}
          onClose={() => {
            setActiveReviewItem(null);
            setReviewRejectReason("");
          }}
          titleId="review-pending-request-title"
        >
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 id="review-pending-request-title" className="text-base font-bold text-slate-800 dark:text-white">
                Review Pending Request
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify the following action before committing to the audit registry.
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Action type:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{activeReviewItem.action}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Target:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{activeReviewItem.target}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Consequence:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{activeReviewItem.consequence}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Scope:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{activeReviewItem.scope}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Records affected:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{activeReviewItem.records}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Rejection reason (optional for approval, required for rejection)
            </label>
            <input
              type="text"
              value={reviewRejectReason}
              onChange={(e) => setReviewRejectReason(e.target.value)}
              placeholder="e.g. Requires authorization sign-off from CO"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#070a13] text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setActiveReviewItem(null);
                setReviewRejectReason("");
              }}
              className="flex-1 py-2 px-4 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!accessToken) {
                  triggerToast("Your session expired. Please sign in again.");
                  return;
                }
                if (!reviewRejectReason.trim()) {
                  triggerToast("Enter a rejection reason before rejecting this request.");
                  return;
                }
                try {
                  await rejectAdminConfirmation(accessToken, activeReviewItem.id, reviewRejectReason.trim());
                  await initializeAdmin(accessToken);
                  setActiveReviewItem(null);
                  setReviewRejectReason("");
                  triggerToast(`${activeReviewItem.action} request rejected.`);
                } catch (error) {
                  triggerToast(formatAdminApiError(error));
                }
              }}
              className="flex-1 py-2 px-4 border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-300 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              Reject
            </button>
            <button
              onClick={async () => {
                if (!accessToken) {
                  triggerToast("Your session expired. Please sign in again.");
                  return;
                }
                const result = await approveConfirmation(accessToken, activeReviewItem.id);
                if (!result.ok) {
                  triggerToast(result.error || "Unable to approve this request.");
                  return;
                }
                await initializeAdmin(accessToken);
                setActiveReviewItem(null);
                setReviewRejectReason("");
                triggerToast(`${activeReviewItem.action} request approved successfully.`);
              }}
              className="flex-1 py-2 px-4 bg-[var(--brand-color)] hover:bg-[var(--brand-color)/95] text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              Approve & Write Log
            </button>
          </div>
        </AccessibleDialog>
      )}

      {/* DYNAMIC TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white border border-slate-800 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-slide-in">
          <CheckCircle className="size-4 text-[var(--brand-color)]" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

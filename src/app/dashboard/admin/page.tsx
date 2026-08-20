"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import {
  useAdminStore,
  AdminStore,
  AdminTab,
  ConfirmationItem,
  ActivityItem,
  ServiceStatus,
  RoleCatalogItem,
  RbacMatrixRow,
} from "@/store/admin-store";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUsersStore, type Person } from "@/store/users-store";
import { roles as roleDefinitions, type RoleId } from "@/lib/roles";
import { PersonFormModal } from "@/features/people/components/person-form-modal";
import { PersonProfileModal } from "@/features/people/components/person-profile-modal";
import { IconButton } from "@/components/ui/icon-button";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { SERVICE_STATUS, ROLES, REPORT_STATUSES } from "@/lib/terminology";
import { AscendLogo } from "@/components/ascend-logo";
import {
  Shield,
  Users,
  ClipboardList,
  Laptop,
  Apple,
  Activity,
  Stethoscope,
  Landmark,
  ArrowLeft,
  LogOut,
  Moon,
  Sun,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Download,
  Settings,
  Plus,
  Play,
  Key,
  Eye,
  Lock,
  Database,
  Sliders,
  Layers,
  HelpCircle,
  Clock,
  Check,
  UserCheck,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const adminStore = useAdminStore();
  const { theme, toggleTheme } = useTheme();
  const currentUser = useCurrentUser();
  const { show: showConfirmToast, message: toastMessage, triggerToast } = useToast();
  const [hasMounted, setHasMounted] = useState(false);

  // Local state for modals and changes
  const [activeReviewItem, setActiveReviewItem] = useState<ConfirmationItem | null>(null);
  const [scopeChanged, setScopeChanged] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Protect the route
  useEffect(() => {
    if (hasMounted && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, hasMounted, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!hasMounted || !isAuthenticated) return null;

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
              active={adminStore.activeTab === "overview"}
              onClick={() => adminStore.setActiveTab("overview")}
            />
            <SidebarNavItem
              icon={Shield}
              label="Roles"
              active={adminStore.activeTab === "roles"}
              onClick={() => adminStore.setActiveTab("roles")}
            />
            <SidebarNavItem
              icon={Layers}
              label="Scope"
              active={adminStore.activeTab === "scope"}
              onClick={() => adminStore.setActiveTab("scope")}
            />
            <SidebarNavItem
              icon={FileText}
              label="Audit log"
              active={adminStore.activeTab === "audit-log"}
              onClick={() => adminStore.setActiveTab("audit-log")}
              badge={adminStore.recentActivity.length > 0 ? "live" : undefined}
            />
            <SidebarNavItem
              icon={Download}
              label="Exports"
              active={adminStore.activeTab === "exports"}
              onClick={() => adminStore.setActiveTab("exports")}
              badge={adminStore.pendingConfirmations.filter(c => c.action === "Export").length.toString()}
              badgeColor="yellow"
            />
            <SidebarNavItem
              icon={Settings}
              label="System"
              active={adminStore.activeTab === "system"}
              onClick={() => adminStore.setActiveTab("system")}
              badge={adminStore.services.filter(s => s.status !== SERVICE_STATUS.ONLINE).length > 0 ? "alert" : undefined}
              badgeColor="red"
            />
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/20">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="flex w-full items-center gap-2 p-2 rounded-xl text-xs font-semibold hover:bg-slate-800 hover:text-white transition cursor-pointer"
            type="button"
          >
            <ArrowLeft className="size-4 text-slate-500" />
            My Profile
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN LAYOUT BLOCK */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP SYSTEM HEADER */}
        <header className="h-14 w-full border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0e1628] flex items-center justify-between px-6 flex-shrink-0 z-20">
          
          {/* Header left breadcrumbs */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--brand-color)] uppercase tracking-wider">ADMIN OVERVIEW</span>
            <span className="text-xs text-slate-300 dark:text-slate-600">/</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {adminStore.activeTab.replace("-", " ")}
            </span>
          </div>

          {/* Header right user info / settings */}
          <div className="flex items-center gap-6">
            
            {/* CUI Warning center label */}
            <div className="hidden md:flex items-center gap-2 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-950/40 px-3 py-1 rounded-full border border-slate-200/55 dark:border-white/5">
              <span className="size-1.5 rounded-full bg-[var(--brand-color)] animate-pulse"></span>
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
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{currentUser?.name}</p>
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
            <span>Graphite chrome · Every mutation is reversible. Actions are logged and subject to confirmation gating.</span>
          </div>
        </section>

        {/* MAIN SCROLLABLE VIEW CARD */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#f8fafc] dark:bg-[#070a13] transition-colors duration-200">
          
          {/* DYNAMIC VIEWS MATCHING Figmas */}
          {adminStore.activeTab === "overview" && (
            <OverviewView 
              adminStore={adminStore} 
              setActiveReviewItem={setActiveReviewItem}
            />
          )}
          {adminStore.activeTab === "roles" && (
            <RolesView 
              adminStore={adminStore}
              triggerToast={triggerToast}
            />
          )}
          {adminStore.activeTab === "scope" && (
            <ScopeView 
              adminStore={adminStore} 
              scopeChanged={scopeChanged}
              setScopeChanged={setScopeChanged}
              triggerToast={triggerToast}
            />
          )}
          {adminStore.activeTab === "audit-log" && (
            <AuditLogView 
              adminStore={adminStore} 
            />
          )}
          {adminStore.activeTab === "exports" && (
            <ExportsView 
              adminStore={adminStore} 
              setActiveReviewItem={setActiveReviewItem}
              triggerToast={triggerToast}
            />
          )}
          {adminStore.activeTab === "system" && (
            <SystemView
              adminStore={adminStore}
              triggerToast={triggerToast}
            />
          )}

        </main>
      </div>

      {/* REVIEW CONFIRMATION DIALOG MODAL */}
      {activeReviewItem && (
        <AccessibleDialog
          open={!!activeReviewItem}
          onClose={() => setActiveReviewItem(null)}
          titleId="review-pending-request-title"
        >
          <div className="flex items-start gap-4">
              <div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 id="review-pending-request-title" className="text-base font-bold text-slate-800 dark:text-white">Review Pending Request</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verify the following action before committing to the audit registry.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-white/5 space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px] font-bold">Action</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{activeReviewItem.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px] font-bold">Target</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{activeReviewItem.target}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px] font-bold">Scope</span>
                <span className="text-slate-800 dark:text-slate-200">{activeReviewItem.scope}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px] font-bold">Impact</span>
                <span className="text-slate-800 dark:text-slate-200">{activeReviewItem.consequence}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 uppercase text-[9px] font-bold">Risk Code</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeReviewItem.risk === "L4" ? "bg-red-500/10 text-red-500" :
                  activeReviewItem.risk === "L3" ? "bg-orange-500/10 text-orange-500" :
                  activeReviewItem.risk === "L2" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                }`}>
                  Level {activeReviewItem.risk}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setActiveReviewItem(null)}
                className="flex-1 py-2 px-4 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  adminStore.removeConfirmation(activeReviewItem.id);
                  setActiveReviewItem(null);
                  triggerToast(`${activeReviewItem.action} request approved successfully.`);
                }}
                className="flex-1 py-2 px-4 bg-[var(--brand-color)] hover:bg-[var(--brand-color)/95] text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                Approve & Write Log
              </button>
            </div>
        </AccessibleDialog>
      )}

      {/* DYNAMIC CONFIRMATION TOAST */}
      {showConfirmToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white border border-slate-800 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-slide-in">
          <CheckCircle className="size-4 text-[var(--brand-color)]" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

// ----------------------------------------------------
// SUB COMPONENTS & DATA WIDGETS
// ----------------------------------------------------

type SidebarNavItemProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
  badgeColor?: "red" | "yellow" | "default";
};

function SidebarNavItem({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
  badgeColor = "default",
}: SidebarNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
        active
          ? "bg-[var(--brand-color)] text-white shadow-md shadow-[var(--brand-color)/10] font-bold"
          : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
      }`}
      type="button"
    >
      <div className="flex items-center gap-3">
        <Icon className={`size-4 ${active ? "text-white" : "text-slate-500"}`} />
        <span>{label}</span>
      </div>
      {badge && (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
          badgeColor === "red" ? "bg-red-500/20 text-red-400" :
          badgeColor === "yellow" ? "bg-amber-500/20 text-amber-400" :
          "bg-slate-800 text-slate-300"
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ----------------------------------------------------
// 1. OVERVIEW VIEW
// ----------------------------------------------------
function OverviewView({
  adminStore,
  setActiveReviewItem,
}: {
  adminStore: AdminStore;
  setActiveReviewItem: (item: ConfirmationItem | null) => void;
}) {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Upper overview header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 tracking-wider">ADMIN OVERVIEW</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Control plane</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Six admin modules · utility chrome · audit-first decision support.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => adminStore.setActiveTab("audit-log")}
            className="px-4 py-2 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Open audit log
          </button>
          <button
            onClick={() => adminStore.setActiveTab("roles")}
            className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color)/95] text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            Manage roles
          </button>
        </div>
      </div>

      {/* Split Panels: Recent Activity & Pending Confirmations — leads the
          page per Req 3 (actionable work first, decorative metrics below). */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Recent Activity Panel */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent activity</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Last 6 actions across the control plane.</p>
            </div>
            <button
              onClick={() => adminStore.setActiveTab("audit-log")}
              className="px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {adminStore.recentActivity.map((activity: ActivityItem) => (
              <div key={activity.id} className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{activity.action}</p>
                  <p className="text-[10px] text-slate-400">
                    {activity.time} · {activity.reason}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase select-none ${
                  activity.tag === "logged" ? "bg-emerald-500/10 text-emerald-500" :
                  activity.tag === "system" ? "bg-blue-500/10 text-blue-500" :
                  activity.tag === "review" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                }`}>
                  {activity.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Confirmations Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Pending confirmations</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Destructive actions awaiting second review.</p>
            </div>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full">
              {adminStore.pendingConfirmations.length} open
            </span>
          </div>

          {adminStore.pendingConfirmations.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Check className="size-6 text-emerald-500 mx-auto mb-2" />
              All actions confirmed. No pending queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5">
                    <th className="pb-2 font-semibold">ACTION</th>
                    <th className="pb-2 font-semibold">TARGET</th>
                    <th className="pb-2 font-semibold text-right">REVIEW</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {adminStore.pendingConfirmations.map((conf: ConfirmationItem) => (
                    <tr key={conf.id} className="align-middle">
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">{conf.action}</td>
                      <td className="py-3">
                        <p className="font-semibold text-slate-800 dark:text-white">{conf.target}</p>
                        <p className="text-[10px] text-slate-400 leading-none mt-0.5">{conf.consequence}</p>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setActiveReviewItem(conf)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-[var(--brand-color)] hover:text-white dark:hover:bg-[var(--brand-color)] text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Audit entries - 24h"
          value="2,184"
          subtext="+12% vs 7-day avg"
          subtextStyle="text-emerald-500"
        />
        <MetricCard
          title="Pending confirmations"
          value={adminStore.pendingConfirmations.length.toString()}
          subtext={`${adminStore.pendingConfirmations.filter((c: ConfirmationItem) => c.action === "Export").length} exports · ${adminStore.pendingConfirmations.filter((c: ConfirmationItem) => c.action === "Deactivation").length} deactivation`}
          subtextStyle="text-amber-500"
          highlight
        />
        <MetricCard
          title="Roles configured"
          value="10"
          subtext="last edit · 22 Jul · Lead Admin"
        />
        <MetricCard
          title="System health"
          value="99.98%"
          subtext="Healthy · 30d"
          subtextStyle="text-emerald-500"
        />
      </div>

      {/* Modules Shortcuts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Modules / Admin modules</span>
          <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold rounded">graphite</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <ModuleShortcutCard
            code="PR-W-300.A"
            title="Roles & RBAC"
            desc="Role catalog, scope matrix, and permission toggles."
            badge="10 roles"
            badgeColor="teal"
            onClick={() => adminStore.setActiveTab("roles")}
          />
          <ModuleShortcutCard
            code="PR-W-300.B"
            title="Scope matrix"
            desc="Role visibility, driver scope, and cohort minimums."
            badge="10 + 5"
            badgeColor="teal"
            onClick={() => adminStore.setActiveTab("scope")}
          />
          <ModuleShortcutCard
            code="PR-W-300.C"
            title="Audit log"
            desc="Every login, access, export, configuration change, and deactivation."
            badge="2,184 / 24h"
            badgeColor="yellow"
            onClick={() => adminStore.setActiveTab("audit-log")}
          />
          <ModuleShortcutCard
            code="PR-W-300.D"
            title="Exports"
            desc="Aggregate and restricted exports with confirmation gating."
            badge={`${adminStore.pendingConfirmations.filter((c: ConfirmationItem) => c.action === "Export").length} pending`}
            badgeColor="yellow"
            onClick={() => adminStore.setActiveTab("exports")}
          />
          <ModuleShortcutCard
            code="PR-W-300.E"
            title="System"
            desc="Uptime, services, scoring config, thresholds, and queues."
            badge="7 sub-modules"
            badgeColor="teal"
            onClick={() => adminStore.setActiveTab("system")}
          />
          <ModuleShortcutCard
            code="PR-W-300.F"
            title="Reversibility"
            desc="Every destructive action is paired with confirmation and recovery history."
            badge="all reversible"
            badgeColor="green"
            onClick={() => adminStore.setActiveTab("audit-log")}
          />
        </div>
      </div>

    </div>
  );
}

function MetricCard({
  title,
  value,
  subtext,
  subtextStyle = "text-slate-400",
  highlight = false,
}: {
  title: string;
  value: string;
  subtext: string;
  subtextStyle?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-5 rounded-2xl bg-white dark:bg-[#0e1628] border shadow-sm ${
      highlight ? "border-amber-500/25 dark:border-amber-500/10" : "border-slate-200 dark:border-white/5"
    }`}>
      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase select-none">{title}</span>
      <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">{value}</h3>
      <p className={`text-[10px] font-semibold mt-2 ${subtextStyle}`}>{subtext}</p>
    </div>
  );
}

function ModuleShortcutCard({
  code,
  title,
  desc,
  badge,
  badgeColor,
  onClick,
}: {
  code: string;
  title: string;
  desc: string;
  badge: string;
  badgeColor: "teal" | "yellow" | "green";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0e1628] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between h-40"
      type="button"
    >
      <div>
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-1">{code}</span>
        <h3 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-[var(--brand-color)] dark:group-hover:text-[var(--brand-color)] transition-colors duration-200">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
          {desc}
        </p>
      </div>

      <div className="pt-3">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold select-none ${
          badgeColor === "teal" ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]" :
          badgeColor === "yellow" ? "bg-amber-500/10 text-amber-500" :
          "bg-emerald-500/10 text-emerald-500"
        }`}>
          {badge}
        </span>
      </div>
    </button>
  );
}

// ----------------------------------------------------
// 2. ROLES VIEW
// ----------------------------------------------------
function RolesView({
  adminStore,
  triggerToast,
}: {
  adminStore: AdminStore;
  triggerToast: (msg: string) => void;
}) {
  const [rbacChanged, setRbacChanged] = useState(false);
  const [outcomesPage, setOutcomesPage] = useState(1);
  const [lastDeployAt, setLastDeployAt] = useState<string | null>(null);

  // People directory (real per-person accounts, distinct from the static
  // role-category catalog below).
  const people = useUsersStore((state) => state.people);
  const setPersonStatus = useUsersStore((state) => state.setStatus);
  const adminResetPassword = useUsersStore((state) => state.adminResetPassword);
  const [peopleFilter, setPeopleFilter] = useState<RoleId | "All">("All");
  const [personModal, setPersonModal] = useState<{ mode: "add" | "edit"; person?: Person } | null>(null);
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null);
  const [resetResult, setResetResult] = useState<{ person: Person; tempPassword: string } | null>(null);

  const filteredPeople = people.filter((p) => peopleFilter === "All" || p.role === peopleFilter);

  // Only the staff/specialist roles map to real accounts in the people
  // directory — Operator (100+ end users, roster-provisioned) and IDMT
  // (external recipient, no direct login per spec) stay as the static
  // aggregate figures already in rolesCatalog.
  const ROLE_LABEL_TO_ID: Partial<Record<string, RoleId>> = {
    SCS: "scs",
    "PT/IM": "pt-im",
    Nutritionist: "nutritionist",
    MP: "mp",
    "Purpose Coach": "pc",
    Plan: "plan",
    Leadership: "leadership",
    Admin: "admin",
  };

  const roleCategories = ["All", "Staff", "Contractor", "Officer", "System"];

  const filteredRoles = adminStore.rolesCatalog.filter((role: RoleCatalogItem) => {
    if (adminStore.rolesFilter === "All") return true;
    return role.category === adminStore.rolesFilter;
  });

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    adminStore.toggleRbacCell(rowIndex, colIndex);
    setRbacChanged(true);
  };

  const handleConfirmChanges = () => {
    setRbacChanged(false);
    const now = new Date();
    setLastDeployAt(now.toISOString());
    adminStore.addActivity({
      action: "RBAC rules deployed",
      actor: "Lead Admin",
      reason: "Override matrices committed to control plane",
      scope: "Admin · Roles & RBAC",
      tag: "system",
      tagColor: "blue",
    });
    triggerToast("RBAC rules and override matrices deployed.");
  };

  const renderRbacIcon = (state: RbacMatrixRow["states"][number]) => {
    switch (state) {
      case "active":
        return (
          <svg className="size-4 text-emerald-500 fill-current mx-auto" viewBox="0 0 16 16">
            <title>Full</title>
            <circle cx="8" cy="8" r="6" />
            <path d="M5.5 8l2 2 3.5-3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );
      case "conditional":
        return (
          <svg className="size-4 text-amber-500 mx-auto" viewBox="0 0 16 16">
            <title>Conditional (reason required)</title>
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 2a6 6 0 0 1 0 12V2z" fill="currentColor" />
          </svg>
        );
      case "gated":
        return (
          <svg className="size-4 text-red-500 mx-auto" viewBox="0 0 16 16">
            <title>Gated</title>
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 8H2a6 6 0 0 0 12 0H8z" fill="currentColor" />
          </svg>
        );
      case "locked":
      case "none":
      default:
        return (
          <svg className="size-4 text-slate-500 dark:text-slate-600 mx-auto" viewBox="0 0 16 16">
            <title>None</title>
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
    }
  };

  // Mock Question Registry Data
  const outcomesPage1 = [
    { id: "O1", driver: "Physical", direction: "Higher = better", routing: "SCS", validation: "Valid" },
    { id: "O2", driver: "Sleep", direction: "Higher = better", routing: "SCS", validation: "Valid" },
    { id: "O3", driver: "Mental", direction: "Higher = better", routing: "Mental Perf.", validation: "Valid" },
    { id: "O4", driver: "Nutritional", direction: "Higher = better", routing: "Nutritionist", validation: "Valid" },
    { id: "O5", driver: "Nutritional", direction: "Higher = better", routing: "Nutritionist", validation: "Valid" },
    { id: "O6", driver: "Nutritional", direction: "Higher = better", routing: "Nutritionist", validation: "Valid" },
    { id: "O7", driver: "Mental", direction: "Higher = better", routing: "Mental Perf.", validation: "Valid" },
    { id: "O8", driver: "Mental", direction: "Higher = better", routing: "Mental Perf.", validation: "Valid" },
    { id: "O9", driver: "Mental", direction: "Higher = better", routing: "Mental Perf.", validation: "Valid" },
    { id: "O10", driver: "Spiritual", direction: "Higher = better", routing: "Purpose", validation: "Valid" },
  ];

  const outcomesPage2 = [
    { id: "O11", driver: "Spiritual", direction: "Higher = better", routing: "Purpose", validation: "Valid" },
    { id: "O12", driver: "Physical", direction: "Higher = better", routing: "SCS + PT/IM", validation: "Valid" },
    { id: "O13", driver: "Recovery", direction: "Higher = better", routing: "SCS + PT/IM", validation: "Valid" },
  ];

  const driversData = [
    { id: "D1", driver: "Physical", direction: "Higher = better", routing: "SCS", validation: "Valid" },
    { id: "D2", driver: "Nutritional", direction: "Higher = better", routing: "Nutritionist", validation: "Valid" },
    { id: "D3", driver: "Mental", direction: "Higher = better", routing: "Mental Perf.", validation: "Valid" },
    { id: "D4", driver: "Spiritual", direction: "Higher = better", routing: "Purpose", validation: "Valid" },
    { id: "D5", driver: "Sleep", direction: "Higher = better", routing: "SCS", validation: "Valid" },
    { id: "D6", driver: "Recovery", direction: "Higher = better", routing: "SCS + PT/IM", validation: "Valid" },
  ];

  const weeklyData = [
    { id: "W1", driver: "Physical", direction: "Higher = better", routing: "SCS", validation: "Valid" },
    { id: "W2", driver: "Sleep", direction: "Higher = better", routing: "SCS", validation: "Valid" },
    { id: "W3", driver: "Nutritional", direction: "Higher = better", routing: "Nutritionist", validation: "Valid" },
    { id: "W4", driver: "Nutritional", direction: "Higher = better", routing: "Nutritionist", validation: "Valid" },
    { id: "W5", driver: "Mental", direction: "Reverse (higher = lower stress)", routing: "Mental Perf.", validation: "Valid", highlight: true },
    { id: "W6", driver: "Mental", direction: "Higher = better", routing: "Mental Perf.", validation: "Valid" },
    { id: "W7", driver: "Spiritual", direction: "Higher = better", routing: "Purpose", validation: "Valid" },
    { id: "W8", driver: "Spiritual", direction: "Higher = better", routing: "Purpose", validation: "Valid" },
    { id: "W9", driver: "Recovery", direction: "Higher = better", routing: "SCS", validation: "Valid" },
    { id: "W10", driver: "Workout adherence", direction: "Higher = better", routing: "SCS", validation: "Valid" },
  ];

  const monthlyData = [
    { id: "M1", driver: "Physical", direction: "Higher = better", routing: "SCS", validation: "Valid" },
    { id: "M2", driver: "Sleep", direction: "Higher = better", routing: "SCS", validation: "Valid" },
    { id: "M3", driver: "Nutritional", direction: "Higher = better", routing: "Nutritionist", validation: "Valid" },
    { id: "M4", driver: "Nutritional", direction: "Higher = better", routing: "Nutritionist", validation: "Valid" },
    { id: "M5", driver: "Mental", direction: "Direct (higher = better stress mgmt)", routing: "Mental Perf.", validation: "Valid", highlight: true },
    { id: "M6", driver: "Mental", direction: "Higher = better", routing: "Mental Perf.", validation: "Valid" },
    { id: "M7", driver: "Spiritual", direction: "Higher = better", routing: "Purpose", validation: "Valid" },
    { id: "M8", driver: "Spiritual", direction: "Higher = better", routing: "Purpose", validation: "Valid" },
    { id: "M9", driver: "Recovery", direction: "Higher = better", routing: "SCS + PT/IM", validation: "Valid" },
    { id: "M10", driver: "Compliance", direction: "Higher = better", routing: "SCS", validation: "Valid" },
  ];

  const currentOutcomes = outcomesPage === 1 ? outcomesPage1 : outcomesPage2;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* 1. Policy Alert box */}
      <div className="bg-[#1e293b]/20 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        <Lock className="size-5 text-[var(--brand-color)] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800 dark:text-white">Rules & RBAC · security policy</span>
          <p className="mt-0.5">Every modification to standard role assignments must write to the control plane log. Device & override logic resolves in order of specificity.</p>
        </div>
      </div>

      {/* 2. Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 tracking-wider">ADMIN · ROLES & RBAC</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Roles & RBAC</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Role catalog, scope assignments, and device + context overrides. Code-coded scope: rules logic override hierarchy.
          </p>
          {lastDeployAt && (
            <p className="text-[10px] text-emerald-500 font-bold mt-1 font-mono">
              Last deploy: {new Date(lastDeployAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => adminStore.setActiveTab("audit-log")}
            className="px-4 py-2 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Audit trail
          </button>
          <button
            onClick={() => {
              adminStore.addActivity({
                action: "Policy deploy",
                actor: "Lead Admin",
                reason: "RBAC matrix posted to control plane",
                scope: "Admin · Roles & RBAC",
                tag: "system",
                tagColor: "blue",
              });
              triggerToast("Deploying active policy definitions...");
            }}
            className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color)/95] text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
          >
            Post rules
          </button>
        </div>
      </div>

      {/* 2b. People Directory Section — real per-person accounts */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">People</h3>
            <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 text-[10px] font-bold rounded-full">
              {people.length} accounts
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={peopleFilter}
              onChange={(e) => setPeopleFilter(e.target.value as RoleId | "All")}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase border bg-slate-50 dark:bg-[#070a13] border-slate-200 dark:border-white/5 text-slate-500 cursor-pointer"
            >
              <option value="All">All roles</option>
              {roleDefinitions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setPersonModal({ mode: "add" })}
              className="px-3 py-1.5 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-lg text-[10px] font-bold uppercase tracking-wide cursor-pointer"
              type="button"
            >
              + Add person
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5">
                <th className="pb-3 font-semibold">NAME</th>
                <th className="pb-3 font-semibold">EMAIL</th>
                <th className="pb-3 font-semibold">ROLE</th>
                <th className="pb-3 font-semibold">UNIT</th>
                <th className="pb-3 font-semibold">STATUS</th>
                <th className="pb-3 font-semibold">LAST EDIT</th>
                <th className="pb-3 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredPeople.map((p) => (
                <tr key={p.id} className="align-middle">
                  <td className="py-3 font-bold text-slate-800 dark:text-white">{p.name}</td>
                  <td className="py-3 font-mono text-slate-500">{p.email}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold rounded text-[10px] uppercase">
                      {p.role}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{p.unit || "—"}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 font-semibold rounded text-[10px] ${
                        p.status === "active"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-rose-500/10 text-rose-500"
                      }`}
                    >
                      {p.status === "active" ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">{p.lastEdit}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => setViewingPerson(p)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-[var(--brand-color)] hover:text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      type="button"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPeople.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No people match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Role Catalog Card Section */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Role catalog</h3>
            <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 text-[10px] font-bold rounded-full">
              20 Active
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {roleCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => adminStore.setRolesFilter(cat)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase transition cursor-pointer border ${
                  adminStore.rolesFilter === cat
                    ? "bg-[var(--brand-color)] text-white border-transparent"
                    : "bg-slate-50 dark:bg-[#070a13] border-slate-200 dark:border-white/5 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5">
                <th className="pb-3 font-semibold">ROLE</th>
                <th className="pb-3 font-semibold">CATEGORY</th>
                <th className="pb-3 font-semibold">SCOPE</th>
                <th className="pb-3 font-semibold">ASSIGNED</th>
                <th className="pb-3 font-semibold">LAST EDIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredRoles.map((r: RoleCatalogItem) => {
                const mappedRoleId = ROLE_LABEL_TO_ID[r.role];
                const liveCount = mappedRoleId
                  ? people.filter((p) => p.role === mappedRoleId && p.status === "active").length
                  : null;
                return (
                  <tr key={r.id} className="align-middle">
                    <td className="py-3 font-bold text-slate-800 dark:text-white">{r.role}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold rounded text-[10px]">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-500">{r.scope}</td>
                    <td className="py-3">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {liveCount !== null ? liveCount : r.assigned}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{r.lastEdit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. RBAC Matrix Role & Permission Section */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">RBAC matrix · role & permission</h3>
            <div className="flex flex-wrap gap-4 text-[9px] font-medium text-slate-400 mt-1 select-none">
              <span className="flex items-center gap-1">
                <svg className="size-3 text-emerald-500 fill-current" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" />
                </svg>
                full
              </span>
              <span className="flex items-center gap-1">
                <svg className="size-3 text-amber-500" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <path d="M8 2a6 6 0 0 1 0 12V2z" fill="currentColor" />
                </svg>
                conditional (reason required)
              </span>
              <span className="flex items-center gap-1">
                <svg className="size-3 text-red-500" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <path d="M8 8H2a6 6 0 0 0 12 0H8z" fill="currentColor" />
                </svg>
                gated
              </span>
              <span className="flex items-center gap-1">
                <svg className="size-3 text-slate-500 dark:text-slate-600" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M5 8h6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                none
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 text-[10px] font-bold select-none">
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded">• full</span>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded">◐ conditional</span>
            <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded">◒ gated</span>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded">○ none</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5">
                <th className="pb-3 font-semibold min-w-[200px]">PERMISSION</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">OPERATOR</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">SCS</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">PT/IM</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">MP</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">NUTR.</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">PURPOSE</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">PLAN</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">LEAD</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">ADMIN</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">IDMT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {adminStore.rbacMatrix.map((row: RbacMatrixRow, rIdx: number) => (
                <tr key={rIdx} className="align-middle hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 font-bold text-slate-800 dark:text-slate-200">{row.permission}</td>
                  {row.states.map((state: RbacMatrixRow["states"][number], cIdx: number) => (
                    <td
                      key={cIdx}
                      onClick={() => handleCellClick(rIdx, cIdx)}
                      className="py-3 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 rounded transition-colors"
                    >
                      {renderRbacIcon(state)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-4 text-[10px] font-bold mt-4 pt-4 border-t border-slate-100 dark:border-white/5 select-none">
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded font-mono uppercase">L0 none</span>
          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded font-mono uppercase">L2 conditional</span>
          <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded font-mono uppercase">L4 gated (reason)</span>
        </div>
      </div>

      {/* 5. Accounts & Onboarding Grid Panel */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Accounts & onboarding</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Status · access expiration · assigned providers · effective permissions · Purpose consent (separate)</p>
          </div>
          <span className="px-2 py-0.5 bg-[var(--brand-color)/10] text-[var(--brand-color)] text-[9px] font-bold rounded-full uppercase">
            Effective permissions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">ACCOUNT STATUS</span>
              <p className="font-bold text-slate-800 dark:text-white">14 active · 0 expired</p>
              <p className="text-[10px] text-slate-400">No accounts past access expiration</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">ASSIGNED PROVIDERS</span>
              <p className="font-bold text-slate-800 dark:text-white">SCS + PT/IM</p>
              <p className="text-[10px] text-slate-400">Per-caseload assignment</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">ONBOARDING</span>
              <p className="font-bold text-slate-800 dark:text-white">3 in flight</p>
              <p className="text-[10px] text-slate-400">2 awaiting role confirmation</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">EFFECTIVE PERMISSIONS</span>
              <p className="font-bold text-slate-800 dark:text-white">RBAC matrix above</p>
              <p className="text-[10px] text-slate-400">Conditional + gated marked</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">ACCESS EXPIRATION</span>
              <p className="font-bold text-slate-800 dark:text-white">31 Dec 2026</p>
              <p className="text-[10px] text-slate-400">All scopes renew automatically on annual review</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">PURPOSE CONSENT (SEPARATE)</span>
              <p className="font-bold text-slate-800 dark:text-white">Active · 1 withdrawn</p>
              <p className="text-[10px] text-slate-400">Revoked consent &rarr; immediate access removal</p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Contract Question Registry Panel */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Contract Question Registry · 46 approved questions</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">O1–O20 + D1–D6 + W1–W10 + M1–M10 = 46 · versioned · scoring direction · routing · validation status</p>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded uppercase">
            Version 2026.7
          </span>
        </div>

        {/* Dynamic Outcomes Sub-table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-1">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Outcomes · O1–O20</span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5 uppercase text-[9px]">
                  <th className="pb-2 font-bold w-16">ID</th>
                  <th className="pb-2 font-bold">DRIVER</th>
                  <th className="pb-2 font-bold">DIRECTION</th>
                  <th className="pb-2 font-bold">ROUTING</th>
                  <th className="pb-2 font-bold">VALIDATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
                {currentOutcomes.map((row) => (
                  <tr key={row.id} className="align-middle">
                    <td className="py-2.5 font-bold text-slate-500">{row.id}</td>
                    <td className="py-2.5 text-slate-800 dark:text-white font-sans">{row.driver}</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400 font-sans">{row.direction}</td>
                    <td className="py-2.5 text-slate-800 dark:text-slate-300 font-sans">{row.routing}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-emerald-500 font-bold font-sans">
                        <span className="size-1.5 rounded-full bg-emerald-500"></span>
                        {row.validation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Outcomes table Pagination */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-[10px] text-slate-400 select-none">
            <span>{outcomesPage === 1 ? "1–10 of 13" : "11–13 of 13"}</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setOutcomesPage(1)}
                className={`size-6 flex items-center justify-center rounded-lg border text-xs font-bold transition cursor-pointer ${
                  outcomesPage === 1
                    ? "bg-[var(--brand-color)] text-white border-transparent"
                    : "border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                1
              </button>
              <button
                onClick={() => setOutcomesPage(2)}
                className={`size-6 flex items-center justify-center rounded-lg border text-xs font-bold transition cursor-pointer ${
                  outcomesPage === 2
                    ? "bg-[var(--brand-color)] text-white border-transparent"
                    : "border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                2
              </button>
            </div>
          </div>
        </div>

        {/* Drivers Sub-table */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Drivers · D1–D6</span>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5 uppercase text-[9px]">
                  <th className="pb-2 font-bold w-16">ID</th>
                  <th className="pb-2 font-bold">DRIVER</th>
                  <th className="pb-2 font-bold">DIRECTION</th>
                  <th className="pb-2 font-bold">ROUTING</th>
                  <th className="pb-2 font-bold">VALIDATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
                {driversData.map((row) => (
                  <tr key={row.id} className="align-middle">
                    <td className="py-2.5 font-bold text-slate-500">{row.id}</td>
                    <td className="py-2.5 text-slate-800 dark:text-white font-sans">{row.driver}</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400 font-sans">{row.direction}</td>
                    <td className="py-2.5 text-slate-800 dark:text-slate-300 font-sans">{row.routing}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-emerald-500 font-bold font-sans">
                        <span className="size-1.5 rounded-full bg-emerald-500"></span>
                        {row.validation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weekly Check-ins Sub-table */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Weekly Check-ins · W1–W10 (W5 REVERSE-SCORED)</span>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5 uppercase text-[9px]">
                  <th className="pb-2 font-bold w-16">ID</th>
                  <th className="pb-2 font-bold">DRIVER</th>
                  <th className="pb-2 font-bold">DIRECTION</th>
                  <th className="pb-2 font-bold">ROUTING</th>
                  <th className="pb-2 font-bold">VALIDATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
                {weeklyData.map((row) => (
                  <tr key={row.id} className="align-middle">
                    <td className="py-2.5 font-bold text-slate-500">{row.id}</td>
                    <td className={`py-2.5 text-slate-800 dark:text-white font-sans ${row.highlight ? "font-bold" : ""}`}>{row.driver}</td>
                    <td className={`py-2.5 text-slate-600 dark:text-slate-400 font-sans ${row.highlight ? "font-bold text-[var(--brand-color)]" : ""}`}>{row.direction}</td>
                    <td className={`py-2.5 text-slate-800 dark:text-slate-300 font-sans ${row.highlight ? "font-bold" : ""}`}>{row.routing}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-emerald-500 font-bold font-sans">
                        <span className="size-1.5 rounded-full bg-emerald-500"></span>
                        {row.validation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Check-ins Sub-table */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Monthly Check-ins · M1–M10 (M5 DIRECT-SCORED)</span>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5 uppercase text-[9px]">
                  <th className="pb-2 font-bold w-16">ID</th>
                  <th className="pb-2 font-bold">DRIVER</th>
                  <th className="pb-2 font-bold">DIRECTION</th>
                  <th className="pb-2 font-bold">ROUTING</th>
                  <th className="pb-2 font-bold">VALIDATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
                {monthlyData.map((row) => (
                  <tr key={row.id} className="align-middle">
                    <td className="py-2.5 font-bold text-slate-500">{row.id}</td>
                    <td className={`py-2.5 text-slate-800 dark:text-white font-sans ${row.highlight ? "font-bold" : ""}`}>{row.driver}</td>
                    <td className={`py-2.5 text-slate-600 dark:text-slate-400 font-sans ${row.highlight ? "font-bold text-[var(--brand-color)]" : ""}`}>{row.direction}</td>
                    <td className={`py-2.5 text-slate-800 dark:text-slate-300 font-sans ${row.highlight ? "font-bold" : ""}`}>{row.routing}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-emerald-500 font-bold font-sans">
                        <span className="size-1.5 rounded-full bg-emerald-500"></span>
                        {row.validation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 italic pt-2">
          Engine behavior: W5 reverse-score · M5 direct-score. UI shows the LABEL only — never the score direction. Separate from Supplemental Assessments.
        </p>
      </div>

      {/* RBAC CONFIRM BOTTOM BAR */}
      {rbacChanged && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a] text-white p-4 border-t border-slate-800 flex items-center justify-between z-40 animate-slide-up shadow-2xl">
          <div className="flex items-center gap-2 max-w-2xl">
            <AlertTriangle className="size-5 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-slate-300">
              This will affect 14 user records. RBAC role change requires 2nd reviewer sign-off.
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setRbacChanged(false);
                triggerToast("RBAC changes discarded.");
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmChanges}
              className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color)/90] text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer"
            >
              Confirm change
            </button>
          </div>
        </div>
      )}

      {personModal && (
        <PersonFormModal
          mode={personModal.mode}
          initial={personModal.person}
          onClose={() => setPersonModal(null)}
          onSaved={(msg) => triggerToast(msg)}
        />
      )}

      {viewingPerson && (
        <PersonProfileModal
          person={viewingPerson}
          onClose={() => setViewingPerson(null)}
          onEdit={() => {
            setPersonModal({ mode: "edit", person: viewingPerson });
            setViewingPerson(null);
          }}
          onResetPassword={() => {
            const tempPassword = adminResetPassword(viewingPerson.id);
            if (tempPassword) {
              setResetResult({ person: viewingPerson, tempPassword });
              setViewingPerson(null);
            }
          }}
          onToggleStatus={() => {
            const next = viewingPerson.status === "active" ? "deactivated" : "active";
            setPersonStatus(viewingPerson.id, next);
            triggerToast(`${viewingPerson.name} ${next === "active" ? "reactivated" : "deactivated"}.`);
            setViewingPerson(null);
          }}
        />
      )}

      {resetResult && (
        <AccessibleDialog
          open={!!resetResult}
          onClose={() => setResetResult(null)}
          titleId="password-reset-title"
          className="bg-white dark:bg-[#0e1628] rounded-2xl p-6 max-w-md w-full shadow-2xl"
        >
          <h3 id="password-reset-title" className="text-sm font-bold text-slate-800 dark:text-white">Password reset</h3>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            New temporary password for <span className="font-bold text-slate-700 dark:text-slate-200">{resetResult.person.name}</span> — share it with them directly, it won&apos;t be shown again.
          </p>
          <p className="mt-3 rounded-lg bg-slate-100 dark:bg-[#070a13] px-4 py-3 text-center font-mono text-lg font-bold tracking-widest text-slate-800 dark:text-white">
            {resetResult.tempPassword}
          </p>
          <button
            onClick={() => setResetResult(null)}
            className="mt-4 w-full px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold cursor-pointer"
            type="button"
          >
            Done
          </button>
        </AccessibleDialog>
      )}

    </div>
  );
}

// ----------------------------------------------------
// 3. SCOPE VIEW
// ----------------------------------------------------
type DriverKey = keyof AdminStore["driverVisibility"];

type CoverageRow = {
  role: string;
  self: string;
  flight: string;
  caseload: string;
  optin: string;
  wing: string;
  global: string;
};

function ScopeView({
  adminStore,
  scopeChanged,
  setScopeChanged,
  triggerToast,
}: {
  adminStore: AdminStore;
  scopeChanged: boolean;
  setScopeChanged: (val: boolean) => void;
  triggerToast: (msg: string) => void;
}) {
  const units = ["Dot 1 - Operations", "Dot 2 - Maint.", "Fit 1A", "Fit 2B", "Fit 3A", "Spt. Staff"];
  const cohortSizes = [1, 5, 8, 12];

  type CohortDeployment = {
    cohortId: string;
    unit: string;
    cohortSizeK: number;
    drivers: string[];
    at: string;
  };
  const [cohortDeployments, setCohortDeployments] = useState<CohortDeployment[]>([]);

  const handleUnitClick = (unit: string) => {
    adminStore.setSelectedScopeUnit(unit);
    setScopeChanged(true);
  };

  const handleKClick = (k: number) => {
    adminStore.setCohortSizeK(k);
    setScopeChanged(true);
  };

  const handleDriverToggle = (driver: DriverKey) => {
    adminStore.toggleDriverVisibility(driver);
    setScopeChanged(true);
  };

  const handleSaveChange = () => {
    setScopeChanged(false);
    const activeDrivers = Object.entries(adminStore.driverVisibility)
      .filter(([, visible]) => visible)
      .map(([key]) => key);
    const deployment: CohortDeployment = {
      cohortId: `cohort-${Date.now()}`,
      unit: adminStore.selectedScopeUnit,
      cohortSizeK: adminStore.cohortSizeK,
      drivers: activeDrivers,
      at: new Date().toISOString(),
    };
    setCohortDeployments([deployment, ...cohortDeployments]);
    adminStore.addActivity({
      action: "Cohort config deployed",
      actor: "Lead Admin",
      reason: `${deployment.unit} · k=${deployment.cohortSizeK} · ${deployment.drivers.length} drivers`,
      scope: "Admin · Scope matrix",
      tag: "system",
      tagColor: "blue",
    });
    triggerToast("Cohort configurations updated and deployed.");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Warning header */}
      <div className="bg-[#1e293b]/20 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        <Layers className="size-5 text-[var(--brand-color)] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800 dark:text-white">Scope matrix - inheritance & cohort minimums</span>
          <p className="mt-0.5">Every role reads through inheritance (Wing &rarr; Unit &rarr; Flight). Cohort minimums (k) apply whenever data crosses a privacy boundary.</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-slate-400 tracking-wider">ADMIN · SCOPE MATRIX</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Scope matrix</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          What each role can see, with driver visibility and cohort minimum (k). Inheritance is resolved top-down.
        </p>
      </div>

      {/* Grid of selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coverage Active Selection */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Coverage · active selection</h3>
            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-bold rounded">
              {adminStore.selectedScopeUnit}
            </span>
          </div>

          {/* Unit selection */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Unit</span>
            <div className="flex flex-wrap gap-2">
              {units.map((unit) => (
                <button
                  key={unit}
                  onClick={() => handleUnitClick(unit)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    adminStore.selectedScopeUnit === unit
                      ? "bg-[var(--brand-color)] text-white border-transparent"
                      : "bg-slate-50 dark:bg-[#070a13] border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          {/* Cohort size selection */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Cohort size (k)</span>
            <div className="flex gap-2">
              {cohortSizes.map((k) => (
                <button
                  key={k}
                  onClick={() => handleKClick(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    adminStore.cohortSizeK === k
                      ? "bg-[var(--brand-color)] text-white border-transparent"
                      : "bg-slate-50 dark:bg-[#070a13] border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  k = {k} {k === 5 ? "(default)" : k === 1 ? "(self)" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Driver Visibility toggles */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Driver visibility</span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "physical", label: "Physical" },
                  { key: "sleep", label: "Sleep" },
                  { key: "mental", label: "Mental" },
                  { key: "nutrition", label: "Nutrition" },
                  { key: "purpose", label: "Purpose (off)" },
                ] as { key: DriverKey; label: string }[]
              ).map((driver) => {
                const isActive = adminStore.driverVisibility[driver.key];
                return (
                  <button
                    key={driver.key}
                    onClick={() => handleDriverToggle(driver.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                      isActive
                        ? "bg-[var(--brand-color)] text-white border-transparent"
                        : "bg-slate-50 dark:bg-[#070a13] border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {driver.label}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Inheritance flows Wing &rarr; Unit &rarr; Flight. Below are the resolved paths for the active selection.
          </p>
        </div>

        {/* Scope Inheritance */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">
            Scope inheritance
          </h3>

          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-white/5 space-y-1">
              <p className="text-slate-800 dark:text-slate-300 font-bold">Wing-level</p>
              <p className="text-[10px] text-slate-400">Det 1 Ops · Det 2 Maint · Fit 1A</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-white/5 space-y-1">
              <p className="text-slate-800 dark:text-slate-300 font-bold">Wing-level</p>
              <p className="text-[10px] text-slate-400">Det 1 Ops · Det 2 Maint</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-white/5 space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase">PT/IM caseload</span>
              <p className="text-slate-800 dark:text-slate-300 font-bold">Caseload</p>
              <p className="text-[10px] text-amber-500">Gated · 14 / 22 / 9 records</p>
            </div>
          </div>

          {cohortDeployments.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-white/5">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                Recent deployments
              </span>
              <div className="space-y-2">
                {cohortDeployments.slice(0, 3).map((d) => (
                  <div
                    key={d.cohortId}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-[10px] space-y-0.5"
                  >
                    <p className="font-bold text-slate-700 dark:text-slate-200">{d.unit} · k={d.cohortSizeK}</p>
                    <p className="text-slate-400 font-mono">
                      {new Date(d.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                      {" · "}{d.drivers.length} drivers
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Admin Coverage Map table */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Admin coverage map</h3>
          <div className="flex items-center gap-4 text-[10px] font-bold select-none">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded bg-sky-500"></span> own</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded bg-emerald-500"></span> active</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded bg-amber-500"></span> gated</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded bg-red-500"></span> confirm</span>
          </div>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5">
                <th className="pb-3 font-semibold">ROLE</th>
                <th className="pb-3 font-semibold text-center">SELF</th>
                <th className="pb-3 font-semibold text-center">FLIGHT</th>
                <th className="pb-3 font-semibold text-center">CASELOAD</th>
                <th className="pb-3 font-semibold text-center">OPT-IN</th>
                <th className="pb-3 font-semibold text-center">WING Kz5</th>
                <th className="pb-3 font-semibold text-center">GLOBAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {(
                [
                  { role: "Operator", self: "own", flight: "-", caseload: "-", optin: "-", wing: "-", global: "-" },
                  { role: "SCS", self: "own", flight: "-", caseload: "active", optin: "-", wing: "gated", global: "-" },
                  { role: "PT/IM", self: "own", flight: "-", caseload: "active", optin: "confirm", wing: "gated", global: "-" },
                  { role: "MP", self: "own", flight: "-", caseload: "-", optin: "confirm", wing: "-", global: "-" },
                  { role: "Nutrition", self: "own", flight: "-", caseload: "active", optin: "confirm", wing: "-", global: "-" },
                  { role: "Purpose", self: "own", flight: "-", caseload: "-", optin: "-", wing: "-", global: "-" },
                  { role: "Plan", self: "own", flight: "-", caseload: "active", optin: "active", wing: "active", global: "gated" },
                  { role: "Leadership", self: "own", flight: "-", caseload: "-", optin: "-", wing: "-", global: "active" },
                  { role: "Admin", self: "own", flight: "active", caseload: "active", optin: "active", wing: "active", global: "active" },
                ] as CoverageRow[]
              ).map((row, idx) => (
                <tr key={idx} className="align-middle">
                  <td className="py-3 font-bold text-slate-800 dark:text-white">{row.role}</td>
                  {(["self", "flight", "caseload", "optin", "wing", "global"] as (keyof Omit<CoverageRow, "role">)[]).map((col) => {
                    const status = row[col];
                    return (
                      <td key={col} className="py-3 text-center">
                        {status === "-" ? (
                          <span className="text-slate-300 dark:text-slate-700 font-light">—</span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            status === "own" ? "bg-sky-500/10 text-sky-500" :
                            status === "active" ? "bg-emerald-500/10 text-emerald-500" :
                            status === "gated" ? "bg-amber-500/10 text-amber-500" :
                            "bg-red-500/10 text-red-500"
                          }`}>
                            {status}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conditional Pathway Matrix table */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">
          Conditional pathway matrix
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5">
                <th className="pb-3 font-semibold">PATHWAY</th>
                <th className="pb-3 font-semibold">APPROVAL</th>
                <th className="pb-3 font-semibold">ENABLEMENT</th>
                <th className="pb-3 font-semibold">STAFFING</th>
                <th className="pb-3 font-semibold">PROVIDER ASSIGNMENT</th>
                <th className="pb-3 font-semibold">ACCESS DATES</th>
                <th className="pb-3 font-semibold">DATA ACCESS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {[
                { name: "Nutritionist", app: "Approved · 14 Jan 2026", en: "Enabled · 01 Feb 2026", st: "1 nutritionist · onboarded", pa: "Per-caseload · 4 ops", dates: "Caseload window · 12 mo", data: "Authorized Nutrition Context only" },
                { name: "Mental Performance", app: "Approved · 14 Jan 2026", en: "Enabled · 01 Feb 2026", st: "1 mental perf · onboarded", pa: "Opt-in only · 8 active", dates: "Opt-in · revocable", data: "Pattern-based only · k=1 not surfaced to leadership" },
                { name: "Purpose Coach", app: "Approved · 14 Jan 2026", en: "Enabled · 01 Feb 2026", st: "1 purpose coach · onboarded", pa: "Opt-in only · 4 active", dates: "Opt-in · revocable", data: "Assigned operators with active consent only" },
              ].map((row, idx) => (
                <tr key={idx} className="align-middle">
                  <td className="py-4 font-bold text-slate-800 dark:text-white">{row.name}</td>
                  <td className="py-4">
                    <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span> {row.app}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span> {row.en}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="flex items-center gap-1.5 text-emerald-500">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span> {row.st}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="flex items-center gap-1.5 text-emerald-500">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span> {row.pa}
                    </span>
                  </td>
                  <td className="py-4 text-slate-500 dark:text-slate-400">{row.dates}</td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 font-bold rounded">
                      {row.data}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCOPE BOTTOM ACTION CONFIRM BAR */}
      {scopeChanged && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a] text-white p-4 border-t border-slate-800 flex items-center justify-between z-40 animate-slide-up shadow-2xl">
          <div className="flex items-center gap-2 max-w-2xl">
            <AlertTriangle className="size-5 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-slate-300">
              This will affect user scope assignments. Cohort size (k) and driver visibility changes are reversible through the audit log.
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setScopeChanged(false);
                triggerToast("Changes discarded.");
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChange}
              className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color)/90] text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer"
            >
              Confirm change
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ----------------------------------------------------
// 4. AUDIT LOG VIEW
// ----------------------------------------------------
function AuditLogView({
  adminStore,
}: {
  adminStore: AdminStore;
}) {
  const categories = ["All", "Login", "Record access", "Export", "Config change", "Deactivation"];

  const filteredLogs = adminStore.recentActivity.filter((log: ActivityItem) => {
    // Category match
    const catMatch = adminStore.auditFilter === "All" || log.action.toLowerCase().includes(adminStore.auditFilter.toLowerCase()) || log.actor.toLowerCase().includes(adminStore.auditFilter.toLowerCase());
    
    // Search query match
    const text = (log.actor + log.action + log.scope).toLowerCase();
    const queryMatch = text.includes(adminStore.auditSearchQuery.toLowerCase());
    
    return catMatch && queryMatch;
  });

  const getSeverityColor = (color: string) => {
    switch (color) {
      case "green":
        return "bg-emerald-500";
      case "orange":
        return "bg-orange-500";
      case "red":
        return "bg-red-500";
      case "gray":
      default:
        return "bg-slate-500 dark:bg-slate-600";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* 1. Policy Alert box */}
      <div className="bg-[#1e293b]/20 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        <Lock className="size-5 text-[var(--brand-color)] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800 dark:text-white">Audit log · every action, immutable</span>
          <p className="mt-0.5">2,184 entries in the last 24 hours. Filterable by actor role, scope, and severity. Drill down into any row for full context.</p>
        </div>
      </div>

      {/* 2. Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 tracking-wider">ADMIN · AUDIT LOG</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Audit log</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Every login, record access, export, configuration change, and deactivation. Searchable, filterable, drill-in.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            <Download className="size-4" /> Export CSV
          </button>
          <span className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold shadow-sm select-none">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live tail
          </span>
        </div>
      </div>

      {/* 3. Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">24h</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">2,184</span>
          <span className="text-[10px] text-emerald-500 font-bold block">+12% vs 7d avg</span>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">7d</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">14,902</span>
          <span className="text-[10px] text-slate-400 font-semibold block">93% log only</span>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Record accesses</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">128</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="size-1.5 rounded-full bg-amber-500"></span>
            <span className="text-[10px] text-amber-500 font-bold">3 with reason</span>
          </div>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Destructive actions</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">7</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="size-1.5 rounded-full bg-red-500"></span>
            <span className="text-[10px] text-red-500 font-bold">3 pending review</span>
          </div>
        </div>
      </div>

      {/* 4. Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 p-4 rounded-2xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            aria-label="Search actor, action, target, scope"
            value={adminStore.auditSearchQuery}
            onChange={(e) => adminStore.setAuditSearchQuery(e.target.value)}
            placeholder="Search actor, action, target, scope..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs focus:ring-[var(--brand-color)] focus:border-[var(--brand-color)] outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => adminStore.setAuditFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition cursor-pointer border ${
                adminStore.auditFilter === cat
                  ? "bg-[var(--brand-color)] text-white border-transparent"
                  : "bg-slate-50 dark:bg-[#070a13] border-slate-200 dark:border-white/5 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Live Tail Table Panel */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span>Live tail</span>
            <span className="text-[10px] text-slate-500 font-light normal-case">Streaming · pauses on filter change</span>
          </h3>
          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-bold uppercase select-none">
            <span className="size-1 rounded-full bg-emerald-500 animate-ping"></span>
            Live
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No audit records matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5 uppercase text-[9px]">
                  <th className="pb-3 font-semibold w-8"></th>
                  <th className="pb-3 font-semibold w-24">TIME</th>
                  <th className="pb-3 font-semibold">ACTOR ACTION</th>
                  <th className="pb-3 font-semibold text-right">SCOPE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
                {filteredLogs.map((log: ActivityItem) => (
                  <tr key={log.id} className="align-middle">
                    <td className="py-3">
                      <div className={`size-1.5 rounded-full ${getSeverityColor(log.tagColor)}`} />
                    </td>
                    <td className="py-3 text-slate-400">[{log.time}]</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300 font-sans">
                      <span className="font-bold text-slate-800 dark:text-white mr-1.5">{log.actor}</span>
                      {log.action}
                    </td>
                    <td className="py-3 text-right text-slate-500 dark:text-slate-400">{log.scope}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Audit categories section */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Audit categories · 6 required</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Permission changes · recommendation changes · resolved/archived · medical-record access · downloads · exports</p>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded">
            All categories logged
          </span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5 uppercase text-[9px]">
                <th className="pb-3 font-semibold">CATEGORY</th>
                <th className="pb-3 font-semibold">LAST 24H</th>
                <th className="pb-3 font-semibold">LAST 7D</th>
                <th className="pb-3 font-semibold">LAST 30D</th>
                <th className="pb-3 font-semibold">RETENTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
              {[
                { cat: "Permission changes", h24: 3, d7: 14, d30: 62, ret: "7 yr" },
                { cat: "Recommendation changes", h24: 8, d7: 41, d30: 189, ret: "7 yr" },
                { cat: "Resolved/archived", h24: 5, d7: 22, d30: 94, ret: "7 yr" },
                { cat: "Medical-record access", h24: 11, d7: 62, d30: 248, ret: "7 yr · minimum-necessary" },
                { cat: "Downloads", h24: 2, d7: 14, d30: 61, ret: "7 yr · reason required" },
                { cat: "Exports", h24: 4, d7: 22, d30: 96, ret: "7 yr · 2nd reviewer" },
              ].map((row, idx) => (
                <tr key={idx} className="align-middle">
                  <td className="py-3 font-bold text-slate-800 dark:text-white">{row.cat}</td>
                  <td className="py-3 text-slate-700 dark:text-slate-300 font-mono">{row.h24}</td>
                  <td className="py-3 text-slate-700 dark:text-slate-300 font-mono">{row.d7}</td>
                  <td className="py-3 text-slate-700 dark:text-slate-300 font-mono">{row.d30}</td>
                  <td className="py-3 text-slate-500 dark:text-slate-400 font-mono">{row.ret}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-slate-400 italic pt-2 border-t border-slate-100 dark:border-white/5">
          Every medical-record event captures authorization - expiration - denial - quarantine - download - export. See PT/IM Medical Records for the access-gate UI confirmation.
        </p>
      </div>

    </div>
  );
}

// ----------------------------------------------------
// 5. EXPORTS VIEW
// ----------------------------------------------------
function ExportsView({
  adminStore,
  setActiveReviewItem,
  triggerToast,
}: {
  adminStore: AdminStore;
  setActiveReviewItem: (item: ConfirmationItem | null) => void;
  triggerToast: (msg: string) => void;
}) {
  const [showConfirmExportBar, setShowConfirmExportBar] = useState(false);
  const [schedules, setSchedules] = useState([
    { id: "sch-1", name: "Wing 0 aggregate", cadence: "Weekly · Mon 08:00", scope: "Kz-5", format: "PDF + CSV", nextRun: "04 Aug · 08:00", status: REPORT_STATUSES.ACTIVE },
    { id: "sch-2", name: "Monthly cohort review", cadence: "Monthly · 1st 09:00", scope: "Kz5", format: "PDF", nextRun: "01 Aug · 09:00", status: REPORT_STATUSES.ACTIVE },
    { id: "sch-3", name: "PT/IM caseload audit", cadence: "Quarterly", scope: "caseload", format: "CSV", nextRun: "30 Sep · 08:00", status: REPORT_STATUSES.PAUSED },
    { id: "sch-4", name: "IDMT handoff digest", cadence: "Weekly · Fri 16:00", scope: "handoff", format: "PDF", nextRun: "01 Aug · 16:00", status: REPORT_STATUSES.ACTIVE },
  ]);
  const [showScheduleWizard, setShowScheduleWizard] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    cadence: "Weekly · Mon 08:00",
    scope: "Kz-5",
    format: "PDF",
    recipients: "Wing CC + DPH",
  });

  const handleEditSchedule = (id: string) => {
    const target = schedules.find((s) => s.id === id);
    if (target) {
      setEditingScheduleId(id);
      setScheduleForm({
        name: target.name,
        cadence: target.cadence,
        scope: target.scope,
        format: target.format,
        recipients: "Wing CC + DPH",
      });
    }
    setShowScheduleWizard(true);
    triggerToast("Configuring recurring schedule...");
  };

  const handleSubmitSchedule = () => {
    if (!scheduleForm.name.trim()) return;
    if (editingScheduleId) {
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === editingScheduleId
            ? { ...s, name: scheduleForm.name, cadence: scheduleForm.cadence, scope: scheduleForm.scope, format: scheduleForm.format }
            : s
        )
      );
      adminStore.addActivity({
        action: "Schedule updated",
        actor: "Lead Admin",
        reason: `${scheduleForm.name} · ${scheduleForm.cadence}`,
        scope: "Admin · Exports",
        tag: "system",
        tagColor: "blue",
      });
      triggerToast(`Schedule updated: ${scheduleForm.name}`);
    } else {
      const newSchedule = {
        id: `sch-${Date.now()}`,
        name: scheduleForm.name,
        cadence: scheduleForm.cadence,
        scope: scheduleForm.scope,
        format: scheduleForm.format,
        nextRun: "—",
        status: REPORT_STATUSES.ACTIVE,
      };
      setSchedules((prev) => [newSchedule, ...prev]);
      adminStore.addActivity({
        action: "Schedule added",
        actor: "Lead Admin",
        reason: `${newSchedule.name} · ${newSchedule.cadence} · ${scheduleForm.recipients}`,
        scope: "Admin · Exports",
        tag: "system",
        tagColor: "blue",
      });
      triggerToast(`Schedule added: ${newSchedule.name}`);
    }
    setShowScheduleWizard(false);
    setEditingScheduleId(null);
    setScheduleForm({ name: "", cadence: "Weekly · Mon 08:00", scope: "Kz-5", format: "PDF", recipients: "Wing CC + DPH" });
  };

  const handleConfirmSendExport = () => {
    setShowConfirmExportBar(false);
    triggerToast("PII secure export dispatched to 2nd reviewer.");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Warning alert */}
      <div className="bg-amber-500/10 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-950/30 p-4 rounded-xl flex gap-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
        <AlertTriangle className="size-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Exports - confirm before share</span>
          <p className="mt-0.5">Exports containing PII scope require explicit confirmation. Aggregate exports (k &ge; 5) confirm with one click; caseload exports require a second reviewer.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 tracking-wider">ADMIN · EXPORTS</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Exports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Schedule recurring exports or run a one-off. The confirmation bar appears before any share with PII scope.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingScheduleId(null);
              setScheduleForm({ name: "", cadence: "Weekly · Mon 08:00", scope: "Kz-5", format: "PDF", recipients: "Wing CC + DPH" });
              setShowScheduleWizard(true);
              triggerToast("Initializing export wizard...");
            }}
            className="px-4 py-2 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Schedule export
          </button>
          <button
            onClick={() => setShowConfirmExportBar(true)}
            className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color)/95] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-3.5" /> New export
          </button>
        </div>
      </div>

      {/* Grid: Pending Confirmations & Recent exports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Pending Confirmations */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Pending confirmations</h3>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full">
              {adminStore.pendingConfirmations.filter((c: ConfirmationItem) => c.action === "Export").length} open
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5">
                  <th className="pb-2 font-semibold">EXPORT</th>
                  <th className="pb-2 font-semibold">SCOPE</th>
                  <th className="pb-2 font-semibold">RECORDS</th>
                  <th className="pb-2 font-semibold text-center">RISK</th>
                  <th className="pb-2 font-semibold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {adminStore.pendingConfirmations
                  .filter((c: ConfirmationItem) => c.action === "Export")
                  .map((conf: ConfirmationItem) => (
                    <tr key={conf.id} className="align-middle">
                      <td className="py-3 font-bold text-slate-800 dark:text-white">{conf.target}</td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">{conf.scope}</td>
                      <td className="py-3 font-semibold">{conf.records}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          conf.risk === "L4" ? "bg-red-500/10 text-red-500" :
                          conf.risk === "L3" ? "bg-orange-500/10 text-orange-500" :
                          conf.risk === "L2" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                        }`}>
                          {conf.risk}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setActiveReviewItem(conf)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-[var(--brand-color)] hover:text-white dark:hover:bg-[var(--brand-color)] text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Exports */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">
            Recent exports
          </h3>

          <div className="space-y-4 text-xs font-mono">
            {[
              { name: "Wing Q3 aggregate · PDF", info: "8.4 MB · scheduled · sent 28 Jul · 08:00", tag: "Sent" },
              { name: "Recovery program progress · CSV", info: "0.6 MB · ad-hoc · 3 flights · sent 21 Jul · 09:14", tag: "Sent" },
              { name: "OFT pass rate - monthly · PPTX", info: "2.1 MB · scheduled · sent 14 Jul · 12:02", tag: "Sent" },
              { name: "Sleep watch brief · PDF", info: "0.3 MB · ad-hoc · draft · created 21 Jul · 07:55", tag: "Draft" },
            ].map((exp, idx) => (
              <div key={idx} className="flex justify-between items-start gap-4">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-white">{exp.name}</p>
                  <p className="text-[10px] text-slate-400">{exp.info}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold select-none ${
                  exp.tag === "Sent" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-100 text-slate-400"
                }`}>
                  {exp.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Schedules Recurring exports Table */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Schedules · recurring exports</h3>
          <button
            onClick={() => {
              setEditingScheduleId(null);
              setScheduleForm({ name: "", cadence: "Weekly · Mon 08:00", scope: "Kz-5", format: "PDF", recipients: "Wing CC + DPH" });
              setShowScheduleWizard(true);
              triggerToast("Adding recurring export schedule...");
            }}
            className="px-2.5 py-1.5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300"
          >
            <Plus className="size-3.5" /> Add schedule
          </button>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5">
                <th className="pb-3 font-semibold">NAME</th>
                <th className="pb-3 font-semibold">CADENCE</th>
                <th className="pb-3 font-semibold">SCOPE</th>
                <th className="pb-3 font-semibold">FORMAT</th>
                <th className="pb-3 font-semibold">NEXT RUN</th>
                <th className="pb-3 font-semibold">STATUS</th>
                <th className="pb-3 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {schedules.map((sch) => (
                <tr key={sch.id} className="align-middle">
                  <td className="py-3 font-bold text-slate-800 dark:text-white">{sch.name}</td>
                  <td className="py-3 text-slate-500 dark:text-slate-400">{sch.cadence}</td>
                  <td className="py-3">
                    <span className="px-1.5 py-0.5 bg-[var(--brand-color)/10] text-[var(--brand-color)] text-[9px] font-bold rounded">
                      {sch.scope}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{sch.format}</td>
                  <td className="py-3 font-semibold">{sch.nextRun}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase select-none ${
                      sch.status === "Active" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-100 text-slate-400"
                    }`}>
                      {sch.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleEditSchedule(sch.id)}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold transition cursor-pointer border border-transparent dark:border-white/5"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9 Required contract reports */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">9 required contract reports</h3>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded">
            Separated from supplemental
          </span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5">
                <th className="pb-3 font-semibold">REPORT</th>
                <th className="pb-3 font-semibold">PERIOD</th>
                <th className="pb-3 font-semibold">DUE DATE</th>
                <th className="pb-3 font-semibold">RECIPIENT</th>
                <th className="pb-3 font-semibold">APPROVAL</th>
                <th className="pb-3 font-semibold">SENSITIVITY</th>
                <th className="pb-3 font-semibold">TIMESTAMP</th>
                <th className="pb-3 font-semibold text-right">AUDIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {[
                { name: "Monthly OFT Metrics", pr: "Jul 2026", due: "05 Aug 2026", rec: "Wing CC + DPH", app: "Approved · Capt Shah", sens: "CUI", time: "—", status: "Pending" },
                { name: "Quarterly Utilization", pr: "Q3 2026", due: "15 Oct 2026", rec: "Wing CC + DPH", app: "Drafted", sens: "CUI", time: "—", status: "Pending" },
                { name: "Quarterly Injury/Recovery", pr: "Q3 2026", due: "15 Oct 2026", rec: "Wing CC + DPH", app: "Drafted", sens: "CUI", time: "—", status: "Pending" },
                { name: "Assessment Completion", pr: "Monthly", due: "05 Aug 2026", rec: "Wing CC", app: "Approved · Capt Chen", sens: "CUI", time: "27 Jul · 14:02", status: "Logged" },
                { name: "PRS/QCP Support", pr: "Monthly", due: "05 Aug 2026", rec: "DPH + Wing CC", app: "Approved · Plan role", sens: "CUI", time: "27 Jul · 14:08", status: "Logged" },
                { name: "Leadership Aggregate Readiness", pr: "Monthly", due: "05 Aug 2026", rec: "Wing CC + DPH", app: "Approved · Lt Col Park", sens: "CUI", time: "27 Jul · 14:18", status: "Logged" },
              ].map((row, idx) => (
                <tr key={idx} className="align-middle">
                  <td className="py-3 font-bold text-slate-800 dark:text-white">{row.name}</td>
                  <td className="py-3 text-slate-500">{row.pr}</td>
                  <td className="py-3 text-slate-500">{row.due}</td>
                  <td className="py-3 text-slate-800 dark:text-slate-300 font-semibold">{row.rec}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      row.app.includes("Approved") ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-100 text-slate-400"
                    }`}>
                      {row.app}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">{row.sens}</td>
                  <td className="py-3 text-slate-500">{row.time}</td>
                  <td className="py-3 text-right">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                      row.status === "Logged" ? "text-emerald-500" : "text-sky-500"
                    }`}>
                      <span className={`size-1.5 rounded-full ${
                        row.status === "Logged" ? "bg-emerald-500" : "bg-sky-500 animate-pulse"
                      }`}></span>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXPORT CONFIRM BOTTOM BAR */}
      {showConfirmExportBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a] text-white p-4 border-t border-slate-800 flex items-center justify-between z-40 animate-slide-up shadow-2xl">
          <div className="flex items-center gap-2 max-w-2xl">
            <AlertTriangle className="size-5 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-slate-300">
              This export contains 14 restricted records. PT/IM caseload share requires 2nd reviewer sign-off before release. Reversible through the audit log.
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmExportBar(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSendExport}
              className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color)/90] text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer"
            >
              Confirm & send
            </button>
          </div>
        </div>
      )}

      {/* SCHEDULE WIZARD MODAL */}
      {showScheduleWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  {editingScheduleId ? "Edit schedule" : "Schedule export wizard"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure cadence, scope, format and recipients. Reversible through the audit log.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowScheduleWizard(false);
                  setEditingScheduleId(null);
                }}
                type="button"
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer flex-shrink-0"
                aria-label="Close"
              >
                <XCircle className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">
                  Schedule name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Wing 0 aggregate"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">
                  Cadence
                </label>
                <select
                  value={scheduleForm.cadence}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, cadence: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                >
                  <option value="Weekly · Mon 08:00">Weekly · Mon 08:00</option>
                  <option value="Weekly · Fri 16:00">Weekly · Fri 16:00</option>
                  <option value="Monthly · 1st 09:00">Monthly · 1st 09:00</option>
                  <option value="Monthly · 15th 09:00">Monthly · 15th 09:00</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">
                    Scope
                  </label>
                  <input
                    type="text"
                    value={scheduleForm.scope}
                    onChange={(e) => setScheduleForm((f) => ({ ...f, scope: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">
                    Format
                  </label>
                  <select
                    value={scheduleForm.format}
                    onChange={(e) => setScheduleForm((f) => ({ ...f, format: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                  >
                    <option value="PDF">PDF</option>
                    <option value="CSV">CSV</option>
                    <option value="PDF + CSV">PDF + CSV</option>
                    <option value="PPTX">PPTX</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">
                  Recipients
                </label>
                <input
                  type="text"
                  value={scheduleForm.recipients}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, recipients: e.target.value }))}
                  placeholder="e.g. Wing CC + DPH"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowScheduleWizard(false);
                  setEditingScheduleId(null);
                }}
                type="button"
                className="flex-1 py-2 px-4 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitSchedule}
                type="button"
                disabled={!scheduleForm.name.trim()}
                className="flex-1 py-2 px-4 bg-[var(--brand-color)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {editingScheduleId ? "Save changes" : "Create schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ----------------------------------------------------
// 6. SYSTEM VIEW
// ----------------------------------------------------
function SystemView({
  adminStore,
  triggerToast,
}: {
  adminStore: AdminStore;
  triggerToast: (msg: string) => void;
}) {
  const [localSystemChanged, setLocalSystemChanged] = useState(false);
  const [deactivations, setDeactivations] = useState([
    { id: "de-1", initials: "SCS", name: "Staff - SCS", role: "Staff", activity: "10 Jul - 11:22", caseloads: "8", reassign: "SCS Liaison" },
    { id: "de-2", initials: "MP", name: "Staff - Mental Performance", role: "Staff", activity: "08 Jul - 16:00", caseloads: "4", reassign: "Dr. Patel" },
    { id: "de-3", initials: "OP", name: "Operator", role: "Operator", activity: "28 Jun - 09:14", caseloads: "—", reassign: "—" },
  ]);

  const [queues, setQueues] = useState([
    { queue: "Provider coverage", assigned: "Plan lead", status: REPORT_STATUSES.OPEN, due: "31 Jul", recipient: "Red flag list", overflow: "—" },
    { queue: "Support", assigned: "Plan lead", status: REPORT_STATUSES.OPEN, due: "Rolling 7d", recipient: "Provider support tickets", overflow: "—" },
    { queue: "Corrective actions", assigned: "SCS lead", status: REPORT_STATUSES.OPEN, due: "15 Aug", recipient: "Minor warnings followups", overflow: "—" },
    { queue: "IMT documentation handoffs", assigned: "PT/IM + IDMT", status: REPORT_STATUSES.APPROVED, due: "Weekly", recipient: "Last 7d clinical", overflow: "27 min", action: "Locked" },
    { queue: "Medical access audit", assigned: "Active audit", status: REPORT_STATUSES.PASS, due: "Weekly", recipient: "No anomalies", overflow: "27 min", action: "Locked" },
    { queue: "Retention/disposition", assigned: "Active audit", status: REPORT_STATUSES.CONSENTED, due: "31 Jul", recipient: "7 yr retention sweep", overflow: "—" },
    { queue: "Export audit", assigned: "Active audit", status: REPORT_STATUSES.PASS, due: "Daily", recipient: "Aggregate logs check", overflow: "27 min", action: "Locked" },
    { queue: "Equipment gaps", assigned: "SCS lead", status: REPORT_STATUSES.OPEN, due: "10 Aug", recipient: "Temp service class 2 sensor", overflow: "—" },
    { queue: "Fly Army IM", assigned: "SCS lead", status: REPORT_STATUSES.PENDING_LINK, due: "Monthly", recipient: "Last verified 26 Jul", overflow: "22 min", action: "Locked" },
  ]);

  const handleResolveDeactivation = (id: string) => {
    setDeactivations(prev => prev.filter(item => item.id !== id));
    setLocalSystemChanged(true);
    triggerToast("Deactivation candidate queue reassignment queued.");
  };

  const handleRouteQueue = (queueName: string) => {
    setLocalSystemChanged(true);
    triggerToast(`Routing operation queue for ${queueName}.`);
  };

  const handleConfirmChanges = () => {
    setLocalSystemChanged(false);
    triggerToast("System parameter thresholds updated globally.");
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* 1. Policy Alert box */}
      <div className="bg-[#1e293b]/20 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        <Sliders className="size-5 text-[var(--brand-color)] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800 dark:text-white">System module · R6.90A - 26d</span>
          <p className="mt-0.5">7 sub-modules, all green. Overall system status is normal; last build 23 May 10:22 (v1.11.0) for the testing engineering.</p>
        </div>
      </div>

      {/* 2. Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 tracking-wider">ADMIN · SYSTEM</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">System</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Uptime, services, routing config, question bank, threshold rates, compliance monitors, and the deactivation queues.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => adminStore.setActiveTab("audit-log")}
            className="px-4 py-2 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Audit trail
          </button>
          <button
            onClick={() => triggerToast("Initializing diagnostic sweep...")}
            className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color)/95] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span className="size-1.5 rounded-full bg-emerald-500"></span>
            Run diagnostics
          </button>
        </div>
      </div>

      {/* 3. Quick Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Uptime - 24h</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">99.98%</span>
          <span className="text-[10px] text-emerald-500 font-bold block">normal - no incidents</span>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Services status</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">12 / 12</span>
          <span className="text-[10px] text-slate-400 font-semibold block">normal - audit server channel</span>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Active sessions</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">14</span>
          <span className="text-[10px] text-slate-400 font-semibold block">8 staff · 4 admin · 2 IMT</span>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Pending transmission</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">3</span>
          <span className="text-[10px] text-slate-400 font-semibold block">1 staff · 2 admin queue</span>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Questions bank - active</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">42</span>
          <span className="text-[10px] text-slate-400 font-semibold block">locked - 10 Jul</span>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Threshold limits</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">7</span>
          <span className="text-[10px] text-slate-400 font-semibold block">seven parameters custom</span>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Compliance - 55d</span>
          <span className="text-2xl font-black text-[var(--brand-color)]">PASS</span>
          <span className="text-[10px] text-slate-400 font-semibold block">full - 22/03/24 - 10:42</span>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Last backup</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">—</span>
          <span className="text-[10px] text-slate-400 font-semibold block">no pending updates</span>
        </div>
      </div>

      {/* 4. Services Status & Threshold limits grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Services Status Table */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Services - status</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Unit · geolocations client · base band</p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded">
              All active
            </span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5 uppercase text-[9px]">
                  <th className="pb-2 font-semibold">SERVICE</th>
                  <th className="pb-2 font-semibold">STATUS</th>
                  <th className="pb-2 font-semibold">LATENCY</th>
                  <th className="pb-2 font-semibold">LAST CHECK</th>
                  <th className="pb-2 font-semibold">VERSION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                {adminStore.services.map((srv: ServiceStatus) => (
                  <tr
                    key={srv.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Toggle status for ${srv.name}`}
                    onClick={() => {
                      adminStore.toggleServiceStatus(srv.id);
                      setLocalSystemChanged(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        adminStore.toggleServiceStatus(srv.id);
                        setLocalSystemChanged(true);
                      }
                    }}
                    className="align-middle hover:bg-slate-50 dark:hover:bg-slate-900/60 cursor-pointer transition-colors duration-150"
                  >
                    <td className="py-3 font-bold text-slate-800 dark:text-white">{srv.name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold select-none ${
                        srv.status === SERVICE_STATUS.ONLINE ? "bg-emerald-500/10 text-emerald-500" :
                        srv.status === SERVICE_STATUS.DEGRADED ? "bg-amber-500/10 text-amber-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>
                        {srv.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-semibold text-slate-600 dark:text-slate-400">{srv.latency}</td>
                    <td className="py-3 font-mono text-slate-400">{srv.lastCheck}</td>
                    <td className="py-3 font-mono text-slate-500">{srv.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Threshold Rates Configuration */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Threshold rates</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Country, confidence, and cohort minimums.</p>
            </div>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 text-[10px] font-bold rounded">
              R1.1 / 2a
            </span>
          </div>

          <div className="overflow-x-auto text-[11px] font-sans">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5 uppercase text-[9px]">
                  <th className="pb-2 font-semibold">RATE</th>
                  <th className="pb-2 font-semibold text-center">VALUE</th>
                  <th className="pb-2 font-semibold text-right">APPLIES TO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {[
                  { rate: "Cohort minimum (k)", val: "5", applies: "All aggregate views" },
                  { rate: "Severity L2 trigger", val: "Δ -1.0 v 7d", applies: "Driver alerts" },
                  { rate: "Severity L3 trigger", val: "Δ -2.0 / 7d", applies: "Driver alerts" },
                  { rate: "Severity L4 trigger", val: "L4 gating event", applies: "Safety pathway" },
                  { rate: "Confidence limit", val: "> 80%", applies: "OPS input" },
                  { rate: "Deactivation grace", val: "14 days", applies: "Inactive accounts" },
                  { rate: "Export approval window", val: "12h", applies: "All clinical exports" },
                ].map((row, idx) => (
                  <tr key={idx} className="align-middle">
                    <td className="py-2.5 font-bold text-slate-800 dark:text-white">{row.rate}</td>
                    <td className="py-2.5 text-center font-mono font-bold text-[var(--brand-color)]">{row.val}</td>
                    <td className="py-2.5 text-right text-slate-500 dark:text-slate-400">{row.applies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 5. Deactivation Queue Panel */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Deactivation queue · {deactivations.length}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Candidates to be reassigned before status is changed.</p>
          </div>
          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded">
            {deactivations.length} items
          </span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5 uppercase text-[9px]">
                <th className="pb-3 font-semibold">USER</th>
                <th className="pb-3 font-semibold">ROLE</th>
                <th className="pb-3 font-semibold">LAST ACTIVITY</th>
                <th className="pb-3 font-semibold text-center">CASELOADS</th>
                <th className="pb-3 font-semibold">REASSIGN TO</th>
                <th className="pb-3 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {deactivations.map((row) => (
                <tr key={row.id} className="align-middle">
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-center text-[10px]">
                        {row.initials}
                      </div>
                      <span className="font-bold text-slate-800 dark:text-white">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400">{row.role}</td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400 font-mono">{row.activity}</td>
                  <td className="py-3.5 text-center font-mono font-bold">{row.caseloads}</td>
                  <td className="py-3.5 font-bold text-slate-800 dark:text-slate-300">{row.reassign}</td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleResolveDeactivation(row.id)}
                      className="px-3 py-1 bg-slate-100 hover:bg-[var(--brand-color)] hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer transition"
                    >
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Permissions panel - UI gate §7.1 */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Permissions panel - UI gate §7.1</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Assigned · anonymous · expired · withdrawal consent · aggregate only · admin & protected roles</p>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded uppercase">
            All rules enforced
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs leading-normal">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">ASSIGNED</span>
              <p className="font-bold text-slate-800 dark:text-white">14 active</p>
              <p className="text-[10px] text-slate-500 leading-normal">Providers with active workload.</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">WITHDRAWN CONSENT</span>
              <p className="font-bold text-slate-800 dark:text-white">1 Purpose · 0 Mental</p>
              <p className="text-[10px] text-slate-500 leading-normal">Access removed immediately.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">UNASSIGNED</span>
              <p className="font-bold text-slate-800 dark:text-white">2</p>
              <p className="text-[10px] text-slate-500 leading-normal">Providers redundant.</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">AGGREGATE ONLY</span>
              <p className="font-bold text-slate-800 dark:text-white">Leadership · 3</p>
              <p className="text-[10px] text-slate-500 leading-normal">k &ge; 5 enforced · no individual.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">EXPIRED</span>
              <p className="font-bold text-slate-800 dark:text-white">0</p>
              <p className="text-[10px] text-slate-600 leading-normal">Accounts past access expiration.</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">ADMIN & PROTECTED ROLES</span>
              <p className="font-bold text-slate-800 dark:text-white">5</p>
              <p className="text-[10px] text-slate-600 leading-normal">2nd reviewer sign-off.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Questions panel - UI gate §7.3 */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Questions panel - UI gate §7.3</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Approved questions database · W5 reverse-score · M5 direct-score · database validation state · T&S compliance · routing · recommendation rules</p>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded uppercase">
            All gates enforced
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-normal">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">APPROVED REGISTRY</span>
              <p className="font-bold text-slate-800 dark:text-white">46 in Contract Question Registry</p>
              <p className="text-[10px] text-slate-500 leading-normal">O1–O20 + D1–D6 + W1–W10 + M1–M10</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">REGISTRY SCORE</span>
              <p className="font-bold text-slate-800 dark:text-white">Engine behavior</p>
              <p className="text-[10px] text-slate-500 leading-normal">Higher score = lower stress (stress).</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">HIGH MEDICINE WATCH</span>
              <p className="font-bold text-slate-800 dark:text-white">High Medicine Watch</p>
              <p className="text-[10px] text-slate-500 leading-normal">Default visibility · k &ge; 5.</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">ACTIVE</span>
              <p className="font-bold text-slate-800 dark:text-white">Active</p>
              <p className="text-[10px] text-slate-500 leading-normal">Same active database across all spaces.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">REVERSE-SCORING</span>
              <p className="font-bold text-slate-800 dark:text-white">Engine behavior</p>
              <p className="text-[10px] text-slate-500 leading-normal">Higher score = lower stress (stress).</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">RECOMMENDATION DATA</span>
              <p className="font-bold text-slate-800 dark:text-white">Plugged in audit</p>
              <p className="text-[10px] text-slate-500 leading-normal">Surfaces "+" value when data loading.</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">SCHEMA</span>
              <p className="font-bold text-slate-800 dark:text-white">Deterministic · versioned</p>
              <p className="text-[10px] text-slate-500 leading-normal">For Outcomes O1–O20.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 8. Hours tracking - contract targets */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Hours tracking - contract targets</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">SCS hours &ge; 2,800 · PT/IM hours &ge; 512 · 98% coverage · reduced coverage · RSD coverage (caseload)</p>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded uppercase">
            99% target
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs leading-normal">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">SCS YTD</span>
            <p className="font-bold text-slate-800 dark:text-white">1,120 / 2,800</p>
            <p className="text-[10px] text-slate-500">SCS - caseworker.</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">PT/IM YTD</span>
            <p className="font-bold text-slate-800 dark:text-white">340 / 512</p>
            <p className="text-[10px] text-[var(--brand-color)] font-semibold">66% - on pace.</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">WEEKLY COVERAGE</span>
            <p className="font-bold text-slate-800 dark:text-white">R</p>
            <p className="text-[10px] text-slate-500">3 due in zone · 6 due in system.</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">CORRECTIVE ACTION</span>
            <p className="font-bold text-slate-800 dark:text-white">Plan role</p>
            <p className="text-[10px] text-slate-600">Re-allocate 3 hours coverage.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">RSD coverage (caseload)</span>
            <p className="text-[10px] text-slate-500 leading-normal">Restricted status duty and hours tracked separately from regular hours.</p>
          </div>
          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded uppercase">
            98% YTD
          </span>
        </div>
      </div>

      {/* 9. Privacy & cohort suppression - UI gate §7.5 */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Privacy & cohort suppression - UI gate §7.5</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Cohort suppression prevents individual identification. Headers, screens, exports.</p>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded uppercase">
            All gates enforced
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs leading-normal">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">COHORT SIZE</span>
            <p className="font-bold text-slate-800 dark:text-white">k &ge; 5 enforced</p>
            <p className="text-[10px] text-slate-500">No individual identifiers · flight/scenario only.</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">LEADERSHIP EXPORTS</span>
            <p className="font-bold text-slate-800 dark:text-white">Suppress or inherited</p>
            <p className="text-[10px] text-slate-500">PII suppressed at boundary.</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">CELL SUPPRESSION</span>
            <p className="font-bold text-slate-800 dark:text-white">k &lt; 5 &rarr; "—"</p>
            <p className="text-[10px] text-slate-500">No approximation or merging.</p>
          </div>
        </div>
      </div>

      {/* 10. Operational Queues Panel */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">9 operational queues</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Provider coverage · support · corrective actions · IDMT/documentation handoffs · medical-access audit · retention/disposition · export audit · equipment gaps · Fly Away Kit</p>
          </div>
          <span className="px-2 py-0.5 bg-[var(--brand-color)/10] text-[var(--brand-color)] text-[9px] font-bold rounded uppercase">
            Each with assignment/status/due/resolution/closure/audit
          </span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5 uppercase text-[9px]">
                <th className="pb-3 font-semibold">QUEUE</th>
                <th className="pb-3 font-semibold">ASSIGNMENT</th>
                <th className="pb-3 font-semibold">STATUS</th>
                <th className="pb-3 font-semibold">DUE</th>
                <th className="pb-3 font-semibold">RESOLUTION</th>
                <th className="pb-3 font-semibold">CLOSURE</th>
                <th className="pb-3 font-semibold text-right">AUDIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {[
                { queue: "Provider coverage", assignment: "Plan role", status: "2 open", statusType: "orange", due: "31 Jul", resolution: "Nutritionist slot", closure: "—", audit: "Pending" },
                { queue: "Support", assignment: "Plan role", status: "4 open", statusType: "cyan", due: "Rolling 7d", resolution: "Operator support tickets", closure: "—", audit: "Pending" },
                { queue: "Corrective actions", assignment: "SCS Lead", status: "3 open", statusType: "orange", due: "15 Aug", resolution: "Missed-coverage follow-ups", closure: "—", audit: "Pending" },
                { queue: "IDMT/documentation handoffs", assignment: "PT/IM + IDMT", status: "All cleared", statusType: "green", due: "Weekly", resolution: "Last 7d: 0 stuck", closure: "27 Jul", audit: "Logged" },
                { queue: "Medical-access audit", assignment: "Admin audit", status: REPORT_STATUSES.PASS, statusType: "green", due: "Weekly", resolution: "No anomalies", closure: "27 Jul", audit: "Logged" },
                { queue: "Retention/disposition", assignment: "Admin audit", status: "2 scheduled", statusType: "cyan", due: "31 Jul", resolution: "7-yr retention sweep", closure: "—", audit: "Pending" },
                { queue: "Export audit", assignment: "Admin audit", status: REPORT_STATUSES.PASS, statusType: "green", due: "Daily", resolution: "All exports have reason", closure: "27 Jul", audit: "Logged" },
                { queue: "Equipment gaps", assignment: "SCS Lead", status: "1 open", statusType: "orange", due: "10 Aug", resolution: "Tempo lane · lane 3 sensor", closure: "—", audit: "Pending" },
                { queue: "Fly Away Kit", assignment: "SCS Lead", status: "Inventory OK", statusType: "green", due: "Monthly", resolution: "Last checked 26 Jul", closure: "26 Jul", audit: "Logged" },
              ].map((row, idx) => (
                <tr key={idx} className="align-middle">
                  <td className="py-3.5 font-bold text-slate-800 dark:text-white">{row.queue}</td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-300">{row.assignment}</td>
                  <td className="py-3.5">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold select-none uppercase ${
                      row.statusType === "orange" ? "bg-amber-500/10 text-amber-600" :
                      row.statusType === "cyan" ? "bg-cyan-500/10 text-cyan-600" :
                      "bg-emerald-500/10 text-emerald-600"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-500 font-mono">{row.due}</td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-300">{row.resolution}</td>
                  <td className="py-3.5 text-slate-500 font-mono">{row.closure}</td>
                  <td className="py-3.5 text-right">
                    {row.audit === "Logged" ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-500 font-bold">
                        <span className="size-1.5 rounded-full bg-emerald-500"></span>
                        Logged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-cyan-500 font-bold">
                        <span className="size-1.5 rounded-full bg-cyan-500"></span>
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-4 border-t border-slate-100 dark:border-white/5 select-none font-mono">
        <span>Ascend · Admin · System · v1.0 · 99.98% uptime</span>
      </div>

      {/* SYSTEM CONFIRM BOTTOM BAR */}
      {localSystemChanged && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a] text-white p-4 border-t border-slate-800 flex items-center justify-between z-40 animate-slide-up shadow-2xl">
          <div className="flex flex-col gap-0.5 max-w-2xl text-left font-sans">
            <span className="text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500 flex-shrink-0" />
              This config change affects all roles globally
            </span>
            <span className="text-[11px] text-slate-500 pl-6">
              Threshold rule update requires 2nd reviewer sign-off. Reversible through the audit log.
            </span>
          </div>
          <div className="flex gap-3 font-sans">
            <button
              onClick={() => {
                setLocalSystemChanged(false);
                triggerToast("System changes discarded.");
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmChanges}
              className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color)/90] text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer"
            >
              Confirm change
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

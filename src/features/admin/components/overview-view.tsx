"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useAdminStore,
  ConfirmationItem,
  ActivityItem,
} from "@/store/admin-store";
import { Check } from "lucide-react";

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "—";
  }
  return `${value.toFixed(1)}%`;
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
    <div
      className={`p-5 rounded-2xl bg-white dark:bg-[#0e1628] border shadow-sm ${
        highlight
          ? "border-amber-500/25 dark:border-amber-500/10"
          : "border-slate-200 dark:border-white/5"
      }`}
    >
      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase select-none">
        {title}
      </span>
      <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">
        {value}
      </h3>
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
  href,
}: {
  code: string;
  title: string;
  desc: string;
  badge: string;
  badgeColor: "teal" | "yellow" | "green";
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group text-left p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0e1628] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between h-40"
    >
      <div>
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
          {code}
        </span>
        <h3 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-[var(--brand-color)] dark:group-hover:text-[var(--brand-color)] transition-colors duration-200">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
          {desc}
        </p>
      </div>

      <div className="pt-3">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold select-none ${
            badgeColor === "teal"
              ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
              : badgeColor === "yellow"
              ? "bg-amber-500/10 text-amber-500"
              : "bg-emerald-500/10 text-emerald-500"
          }`}
        >
          {badge}
        </span>
      </div>
    </Link>
  );
}

export function OverviewView() {
  const router = useRouter();
  const adminStore = useAdminStore();
  const auditStats = adminStore.auditStats;
  const systemOverview = adminStore.systemOverview;
  const roleCount = adminStore.roleCatalogRaw.length;
  const exportPendingCount = adminStore.pendingConfirmations.filter(
    (c: ConfirmationItem) => c.action === "Export"
  ).length;
  const deactivationPendingCount = adminStore.pendingConfirmations.filter(
    (c: ConfirmationItem) => c.action === "Deactivation"
  ).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper overview header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 tracking-wider">ADMIN OVERVIEW</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
            Control plane
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Six admin modules · utility chrome · audit-first decision support.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/audit-log"
            className="px-4 py-2 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Open audit log
          </Link>
          <Link
            href="/dashboard/admin/roles"
            className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color)/95] text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            Manage roles
          </Link>
        </div>
      </div>

      {/* Split Panels: Recent Activity & Pending Confirmations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity Panel */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent activity</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Last 6 actions across the control plane.
              </p>
            </div>
            <Link
              href="/dashboard/admin/audit-log"
              className="px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold cursor-pointer"
            >
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {adminStore.recentActivity.map((activity: ActivityItem) => (
              <div key={activity.id} className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {activity.action}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {activity.time} · {activity.reason}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase select-none ${
                    activity.tag === "logged"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : activity.tag === "system"
                      ? "bg-blue-500/10 text-blue-500"
                      : activity.tag === "review"
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
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
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Pending confirmations
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Destructive actions awaiting second review.
              </p>
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
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">
                        {conf.action}
                      </td>
                      <td className="py-3">
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {conf.target}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-none mt-0.5">
                          {conf.consequence}
                        </p>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href="/dashboard/admin/exports"
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-[var(--brand-color)] hover:text-white dark:hover:bg-[var(--brand-color)] text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        >
                          Review
                        </Link>
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
          value={(auditStats?.count_24h ?? 0).toString()}
          subtext={`${auditStats?.percent_vs_7d_avg ?? 0}% vs 7d avg`}
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
          value={roleCount.toString()}
          subtext={`${adminStore.scopeConfigs.length} scope configs live`}
        />
        <MetricCard
          title="System health"
          value={formatPercent(systemOverview?.system_health.percentage)}
          subtext={`${systemOverview?.system_health.label ?? "Unknown"} · ${systemOverview?.system_health.window_days ?? 0}d`}
          subtextStyle="text-emerald-500"
        />
      </div>

      {/* Modules Shortcuts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            Modules / Admin modules
          </span>
          <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold rounded">
            graphite
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <ModuleShortcutCard
            code="PR-W-300.A"
            title="Roles & RBAC"
            desc="Role catalog, scope matrix, and permission toggles."
            badge={`${roleCount} roles`}
            badgeColor="teal"
            href="/dashboard/admin/roles"
          />
          <ModuleShortcutCard
            code="PR-W-300.B"
            title="Scope matrix"
            desc="Role visibility, driver scope, and cohort minimums."
            badge={`${adminStore.scopeMatrix.length} + ${adminStore.scopeConfigs.length}`}
            badgeColor="teal"
            href="/dashboard/admin/scope"
          />
          <ModuleShortcutCard
            code="PR-W-300.C"
            title="Audit log"
            desc="Every login, access, export, configuration change, and deactivation."
            badge={`${auditStats?.count_24h ?? 0} / 24h`}
            badgeColor="yellow"
            href="/dashboard/admin/audit-log"
          />
          <ModuleShortcutCard
            code="PR-W-300.D"
            title="Exports"
            desc="Aggregate and restricted exports with confirmation gating."
            badge={`${adminStore.pendingConfirmations.filter((c: ConfirmationItem) => c.action === "Export").length} pending`}
            badgeColor="yellow"
            href="/dashboard/admin/exports"
          />
          <ModuleShortcutCard
            code="PR-W-300.E"
            title="System"
            desc="Uptime, services, scoring config, thresholds, and queues."
            badge={`${adminStore.services.length} services`}
            badgeColor="teal"
            href="/dashboard/admin/system"
          />
          <ModuleShortcutCard
            code="PR-W-300.F"
            title="Reversibility"
            desc="Every destructive action is paired with confirmation and recovery history."
            badge={`${deactivationPendingCount + exportPendingCount} reviewable`}
            badgeColor="green"
            href="/dashboard/admin/audit-log"
          />
        </div>
      </div>
    </div>
  );
}

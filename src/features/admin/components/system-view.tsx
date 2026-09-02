"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  useAdminStore,
  ServiceStatus,
} from "@/store/admin-store";
import { formatAdminDate } from "@/features/admin/utils";
import { SERVICE_STATUS } from "@/lib/terminology";
import { Sliders } from "lucide-react";

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "—";
  }
  return `${value.toFixed(1)}%`;
}

function formatCompactDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTitle(value: string | null | undefined) {
  if (!value) {
    return "—";
  }
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getInitials(value: string | null | undefined) {
  if (!value) {
    return "NA";
  }
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) {
    return "NA";
  }
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function SystemView({
  triggerToast = () => {},
}: {
  triggerToast?: (msg: string) => void;
}) {
  const router = useRouter();
  const adminStore = useAdminStore();
  const systemOverview = adminStore.systemOverview;
  const systemDiagnostics = adminStore.systemDiagnostics;
  const questionRegistry = adminStore.questionRegistry;
  const thresholdRules = systemOverview?.threshold_rules;
  const totalServices = adminStore.services.length;
  const healthyServices = adminStore.services.filter(
    (service) => service.status === SERVICE_STATUS.ONLINE,
  ).length;
  const diagnosticRuns = systemDiagnostics?.scheduler_jobs ?? [];
  const latestDiagnosticRun = diagnosticRuns
    .map((job) => job.last_run_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  const roleProtectionCount = adminStore.roleCatalogRaw.filter(
    (role) => role.cluster === "Officer" || role.cluster === "System",
  ).length;
  const questionVersionCount = adminStore.questionBankVersions.length;
  const questionTotal = questionRegistry?.total_questions ?? systemOverview?.question_bank?.total_questions ?? 0;
  const totalUtilizationEvents = adminStore.utilizationEvents.length;
  const usedUtilizationEvents = adminStore.utilizationEvents.filter((event) => event.actual_use).length;
  const averageAttendance = totalUtilizationEvents
    ? Math.round(
        adminStore.utilizationEvents.reduce((sum, event) => sum + (event.attendance_count ?? 0), 0) /
          totalUtilizationEvents,
      )
    : 0;
  const distinctStaffLeads = new Set(
    adminStore.utilizationEvents
      .map((event) => event.staff_lead_name)
      .filter((name): name is string => Boolean(name)),
  ).size;

  const deactivations = [
    ...((systemOverview?.deactivation_queue?.admin_initiated_pending ?? []).map((item) => {
      const rowCount =
        item.payload && typeof item.payload.row_count === "number" ? String(item.payload.row_count) : "—";

      return {
        id: item.id,
        initials: getInitials(item.target_summary),
        name: item.target_summary || "Pending deactivation",
        role: formatTitle(item.action_type),
        activity: formatAdminDate(item.requested_at, true),
        caseloads: rowCount,
        reassign: item.scope_summary || item.consequence_summary || "Awaiting review",
      };
    }) ?? []),
    ...((systemOverview?.deactivation_queue?.self_service_pending ?? []).map((item) => ({
      id: item.id,
      initials: getInitials(item.user_name),
      name: item.user_name,
      role: "Self-service",
      activity: formatAdminDate(item.requested_at, true),
      caseloads: "—",
      reassign: item.reason || formatTitle(item.status),
    })) ?? []),
  ];

  const thresholdRows = thresholdRules
    ? [
        { rate: "Cohort minimum (k)", val: String(thresholdRules.cohort_minimum_k), applies: "Aggregate views" },
        { rate: "Severity L2 trigger", val: String(thresholdRules.l2_drop_points), applies: "Driver alerts" },
        { rate: "Severity L3 trigger", val: String(thresholdRules.l3_drop_points), applies: "Driver alerts" },
        { rate: "Severity L4 trigger", val: String(thresholdRules.l4_drop_points), applies: "Safety routing" },
        {
          rate: "Confidence rule",
          val: thresholdRules.confidence_rule,
          applies: "Recommendation engine",
        },
        {
          rate: "Deactivation grace",
          val: `${thresholdRules.deactivation_grace_days} days`,
          applies: "Inactive accounts",
        },
        {
          rate: "Export approval window",
          val: `${thresholdRules.export_approval_window_hours}h`,
          applies: "Clinical exports",
        },
      ]
    : [];

  const operationalQueues = [
    {
      queue: "Pending confirmations",
      assignment: "Admin review",
      status: `${adminStore.pendingConfirmations.length} open`,
      statusType: adminStore.pendingConfirmations.length > 0 ? "orange" : "green",
      due: "Live",
      resolution: "Second-review gating",
      closure: adminStore.pendingConfirmations[0] ? formatCompactDate(adminStore.exportHistory[0]?.created_at) : "—",
      audit: adminStore.pendingConfirmations.length > 0 ? "Pending" : "Logged",
    },
    {
      queue: "Deactivation review",
      assignment: "System admin",
      status: `${deactivations.length} queued`,
      statusType: deactivations.length > 0 ? "orange" : "green",
      due: thresholdRules ? `${thresholdRules.deactivation_grace_days}d window` : "—",
      resolution: "User and scope review",
      closure: deactivations[0]?.activity ?? "—",
      audit: deactivations.length > 0 ? "Pending" : "Logged",
    },
    {
      queue: "Equipment gaps",
      assignment: "Provider ops",
      status: `${adminStore.equipmentGaps.length} tracked`,
      statusType: adminStore.equipmentGaps.some((gap) => gap.status.toLowerCase() !== "resolved") ? "orange" : "green",
      due: adminStore.equipmentGaps[0] ? formatCompactDate(adminStore.equipmentGaps[0].date_identified) : "—",
      resolution: adminStore.equipmentGaps[0]?.item ?? "No open gaps",
      closure: adminStore.equipmentGaps[0]?.status ?? "Closed",
      audit: adminStore.equipmentGaps.some((gap) => !gap.included_in_report) ? "Pending" : "Logged",
    },
    {
      queue: "Credential readiness",
      assignment: "Admin ops",
      status: `${adminStore.credentials.length} credentials`,
      statusType: adminStore.credentials.some((credential) => credential.status.toLowerCase() !== "active") ? "cyan" : "green",
      due: adminStore.credentials[0]?.expiration_date ? formatCompactDate(adminStore.credentials[0].expiration_date) : "—",
      resolution: adminStore.credentials[0]?.provider_name ?? "No credentials loaded",
      closure: adminStore.credentials[0]?.status ?? "—",
      audit: adminStore.credentials.length > 0 ? "Logged" : "Pending",
    },
    {
      queue: "Scheduled exports",
      assignment: "Report scheduler",
      status: `${adminStore.scheduledExports.length} scheduled`,
      statusType: adminStore.scheduledExports.length > 0 ? "cyan" : "orange",
      due: adminStore.scheduledExports[0]?.next_run_at ? formatCompactDate(adminStore.scheduledExports[0].next_run_at) : "—",
      resolution: adminStore.scheduledExports[0]?.name ?? "No schedules configured",
      closure: adminStore.scheduledExports[0]?.status ?? "—",
      audit: adminStore.scheduledExports.length > 0 ? "Logged" : "Pending",
    },
    {
      queue: "Export audit",
      assignment: "Audit log",
      status: `${adminStore.exportHistory.length} exports`,
      statusType: adminStore.exportHistory.some((item) => item.lifecycle_status !== "completed") ? "cyan" : "green",
      due: latestDiagnosticRun ? formatCompactDate(latestDiagnosticRun) : "—",
      resolution: adminStore.exportHistory[0]?.title ?? adminStore.exportHistory[0]?.report_type ?? "No exports yet",
      closure: adminStore.exportHistory[0]?.lifecycle_status ?? "—",
      audit: adminStore.exportHistory.length > 0 ? "Logged" : "Pending",
    },
    {
      queue: "Utilization feed",
      assignment: "Operations",
      status: `${usedUtilizationEvents}/${totalUtilizationEvents} used`,
      statusType: totalUtilizationEvents > 0 ? "cyan" : "orange",
      due: adminStore.utilizationEvents[0] ? formatCompactDate(adminStore.utilizationEvents[0].event_date) : "—",
      resolution: adminStore.utilizationEvents[0]?.opportunity_offered ?? "No utilization events",
      closure: totalUtilizationEvents > 0 ? `${averageAttendance} avg attendance` : "—",
      audit: totalUtilizationEvents > 0 ? "Logged" : "Pending",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. Policy Alert box */}
      <div className="bg-[#1e293b]/20 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        <Sliders className="size-5 text-[var(--brand-color)] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800 dark:text-white">
            System module · {systemOverview?.system_health?.label ?? "unknown"} · {systemOverview?.system_health?.window_days ?? 0}d
          </span>
          <p className="mt-0.5">
            {totalServices} backend diagnostic services loaded. Last scheduler activity{" "}
            {latestDiagnosticRun ? formatAdminDate(latestDiagnosticRun, true) : "not available"}.
          </p>
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
            onClick={() => router.push("/dashboard/admin/audit-log")}
            className="px-4 py-2 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Audit trail
          </button>
          <button
            onClick={() => triggerToast("Initializing diagnostic sweep...")}
            className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color)/95] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Run diagnostics
          </button>
        </div>
      </div>

      {/* 3. Quick Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Uptime - 24h</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">{formatPercent(systemOverview?.system_health?.percentage)}</span>
          <span className="text-[10px] text-emerald-500 font-bold block">{systemOverview?.system_health?.label ?? "unknown"} system health</span>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Services status</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">{healthyServices} / {totalServices}</span>
          <span className="text-[10px] text-slate-400 font-semibold block">database + scheduler diagnostics</span>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Active sessions</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">{systemOverview?.active_sessions?.total ?? 0}</span>
          <span className="text-[10px] text-slate-400 font-semibold block">
            {systemOverview?.active_sessions?.staff ?? 0} staff · {systemOverview?.active_sessions?.admin ?? 0} admin · {systemOverview?.active_sessions?.imt ?? 0} IMT
          </span>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Pending transmission</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">{systemOverview?.pending_transmission_count ?? 0}</span>
          <span className="text-[10px] text-slate-400 font-semibold block">live backend transmission queue</span>
        </div>
      </div>

      {/* 4. Services Status & Threshold limits grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Services Status Table */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Services - status</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Database and scheduled job health from live diagnostics.</p>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
              healthyServices === totalServices
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-amber-500/10 text-amber-500"
            }`}>
              {healthyServices === totalServices ? "All active" : `${totalServices - healthyServices} attention`}
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
                  <tr key={srv.id} className="align-middle">
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
              <p className="text-[10px] text-slate-500 mt-0.5">Live threshold rules returned by the admin system overview API.</p>
            </div>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 text-[10px] font-bold rounded">
              {thresholdRows.length} rules
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
              <tbody className="divide-y divide-slate-100 dark:border-white/5">
                {thresholdRows.map((row) => (
                  <tr key={row.rate} className="align-middle">
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
            <p className="text-[10px] text-slate-500 mt-0.5">Admin-initiated and self-service deactivation requests from the backend queue.</p>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
            deactivations.length > 0 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
          }`}>
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
                      onClick={() => triggerToast("Review deactivation actions from the live admin workflow.")}
                      className="px-3 py-1 bg-slate-100 hover:bg-[var(--brand-color)] hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer transition"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {deactivations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No pending deactivation requests were returned by the backend.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Queues Panel */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">{operationalQueues.length} operational queues</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Queues derived from confirmations, deactivations, exports, equipment, credentials, and utilization events.</p>
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
              {operationalQueues.map((row) => (
                <tr key={row.queue} className="align-middle">
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
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Logged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-cyan-500 font-bold">
                        <span className="size-1.5 rounded-full bg-cyan-500" />
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
    </div>
  );
}

"use client";

import React from "react";
import { useAdminStore } from "@/store/admin-store";
import { formatAdminDate } from "@/features/admin/utils";
import { Lock, Download, Search } from "lucide-react";

export function AuditLogView() {
  const adminStore = useAdminStore();
  const categories = ["All", "Login", "Record access", "Export", "Config change", "Deactivation"];

  const filteredLogs = adminStore.auditEntries.filter((log) => {
    const haystack = `${log.event_type} ${log.actor_role ?? ""} ${log.summary_message} ${log.target_entity_type ?? ""}`.toLowerCase();
    const queryMatch = haystack.includes(adminStore.auditSearchQuery.toLowerCase());
    const category = adminStore.auditFilter.toLowerCase();
    const categoryMatch = adminStore.auditFilter === "All" || haystack.includes(category);
    return categoryMatch && queryMatch;
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
          <p className="mt-0.5">
            {adminStore.auditStats?.count_24h ?? 0} entries in the last 24 hours. Filterable by actor role, scope, and severity. Drill down into any row for full context.
          </p>
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
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Live tail
          </span>
        </div>
      </div>

      {/* 3. Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">24h</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">{adminStore.auditStats?.count_24h ?? 0}</span>
          <span className="text-[10px] text-emerald-500 font-bold block">{adminStore.auditStats?.percent_vs_7d_avg ?? 0}% vs 7d avg</span>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">7d</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">{adminStore.auditStats?.count_7d ?? 0}</span>
          <span className="text-[10px] text-slate-400 font-semibold block">{adminStore.auditStats?.retention_years ?? 0} year retention</span>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Record accesses</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">{adminStore.auditStats?.record_access_count_24h ?? 0}</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="size-1.5 rounded-full bg-amber-500" />
            <span className="text-[10px] text-amber-500 font-bold">Medical-record access in 24h</span>
          </div>
        </div>
        <div className="p-5 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Destructive actions</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">{adminStore.auditStats?.destructive_action_total_count ?? 0}</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="size-1.5 rounded-full bg-red-500" />
            <span className="text-[10px] text-red-500 font-bold">{adminStore.auditStats?.destructive_action_pending_review_count ?? 0} pending review</span>
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
            <span className="size-1 rounded-full bg-emerald-500 animate-ping" />
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
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="align-middle">
                    <td className="py-3">
                      <div className={`size-1.5 rounded-full ${getSeverityColor(log.outcome_status === "success" ? "green" : "orange")}`} />
                    </td>
                    <td className="py-3 text-slate-400">[{formatAdminDate(log.created_at, true)}]</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300 font-sans">
                      <span className="font-bold text-slate-800 dark:text-white mr-1.5">{log.actor_role || "System"}</span>
                      {log.summary_message}
                    </td>
                    <td className="py-3 text-right text-slate-500 dark:text-slate-400">{log.target_entity_type || "audit"}</td>
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
              {adminStore.auditRollup.map((row) => (
                <tr key={row.category} className="align-middle">
                  <td className="py-3 font-bold text-slate-800 dark:text-white">{row.category}</td>
                  <td className="py-3 text-slate-700 dark:text-slate-300 font-mono">{row.last_24h}</td>
                  <td className="py-3 text-slate-700 dark:text-slate-300 font-mono">{row.last_7d}</td>
                  <td className="py-3 text-slate-700 dark:text-slate-300 font-mono">{row.last_30d}</td>
                  <td className="py-3 text-slate-500 dark:text-slate-400 font-mono">{adminStore.auditStats?.retention_years ?? 0} yr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

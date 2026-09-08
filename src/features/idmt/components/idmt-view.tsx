"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/staff-api";
import {
  listIdmtHandoffs,
  acknowledgeIdmtHandoff,
  downloadIdmtHandoffSummary,
  type IdmtHandoffsResponse,
} from "@/lib/role-dashboards-api";

// Real handoff row shape from IdmtHandoffService._serialize.
type IdmtHandoffRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  export_type: string;
  content_category: string;
  export_format: string;
  prepared_by_name: string | null;
  recipient_role: string;
  status: string;
  prepared_date: string;
  transmitted_date: string | null;
  acknowledgement_status: string;
  acknowledged_by_name: string | null;
  acknowledged_at: string | null;
};

function formatNumber(value: unknown, fallback = "—") {
  return typeof value === "number" ? value.toLocaleString("en-US") : fallback;
}

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: withTime ? "2-digit" : undefined,
    minute: withTime ? "2-digit" : undefined,
  });
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace(/_/g, " ");
}

function statusTone(status: string | null | undefined) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized.includes("acknowledged")) {
    return "bg-emerald-500/10 text-emerald-500";
  }
  if (normalized.includes("transmitted") || normalized.includes("not_acknowledged")) {
    return "bg-amber-500/10 text-amber-500";
  }
  return "bg-sky-500/10 text-sky-500";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function MetricCard({ title, value, subtext, accent }: { title: string; value: string; subtext: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#0e1628]">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">{title}</span>
      <h3 className={`mt-2 text-3xl font-extrabold tracking-tight ${accent || "text-slate-800 dark:text-white"}`}>{value}</h3>
      <p className="mt-2 text-[10px] font-semibold text-slate-400">{subtext}</p>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#0e1628] ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 border-b border-slate-100 pb-3 dark:border-white/5">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white">{title}</h3>
      {subtitle && <p className="mt-0.5 text-[10px] text-slate-400">{subtitle}</p>}
    </div>
  );
}

export function IdmtView() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [handoffs, setHandoffs] = useState<IdmtHandoffsResponse | null>(null);

  const refreshAll = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const data = await listIdmtHandoffs(accessToken);
      setHandoffs(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHydrated && isAuthenticated && accessToken) {
      void refreshAll();
    }
  }, [accessToken, isAuthenticated, isHydrated]);

  const handleAcknowledge = async (handoffId: string) => {
    if (!accessToken) return;
    setActionError("");
    setMutatingId(handoffId);
    try {
      await acknowledgeIdmtHandoff(accessToken, handoffId);
      await refreshAll();
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setMutatingId(null);
    }
  };

  const handleDownload = async (handoff: IdmtHandoffRow) => {
    if (!accessToken) return;
    setActionError("");
    setMutatingId(handoff.id);
    try {
      const blob = await downloadIdmtHandoffSummary(accessToken, handoff.id);
      const extension = handoff.export_format === "csv" ? "csv" : "pdf";
      downloadBlob(blob, `idmt_handoff_${handoff.id}.${extension}`);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setMutatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 animate-pulse">
        <div className="h-32 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#0e1628]" />
        <div className="h-32 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#0e1628]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-950/20">
        {error}
      </div>
    );
  }

  const rows = (handoffs?.handoffs as IdmtHandoffRow[] | undefined) ?? [];
  const pendingAckCount = rows.filter((h) => h.acknowledgement_status === "not_acknowledged").length;
  const acknowledgedCount = rows.filter((h) => h.acknowledgement_status === "acknowledged").length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">IDMT Operations</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Clinical Handoff Summaries</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Independent Duty Medical Technician clinical handoff review and transmission log.</p>
        </div>
        <button
          onClick={() => void refreshAll()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
          type="button"
        >
          Refresh
        </button>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-950/20">
          {actionError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard title="Total Handoffs" value={formatNumber(rows.length)} subtext="Transmitted or acknowledged." />
        <MetricCard title="Awaiting Acknowledgement" value={formatNumber(pendingAckCount)} subtext="Transmitted, not yet acknowledged." accent="text-amber-500" />
        <MetricCard title="Acknowledged" value={formatNumber(acknowledgedCount)} subtext="Receipt confirmed." accent="text-emerald-500" />
      </div>

      <Card>
        <CardHeader title="Transmitted Handoff Summaries" subtitle="Live handoffs returned by the backend - only transmitted or acknowledged, never earlier states." />
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                <th className="pb-3 font-semibold">Operator</th>
                <th className="pb-3 font-semibold">Export type</th>
                <th className="pb-3 font-semibold">Format</th>
                <th className="pb-3 font-semibold">Prepared by</th>
                <th className="pb-3 font-semibold">Transmitted</th>
                <th className="pb-3 font-semibold">Acknowledgement</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {rows.map((handoff) => (
                <tr key={handoff.id}>
                  <td className="py-3 font-semibold text-slate-800 dark:text-white">{handoff.user_name ?? "—"}</td>
                  <td className="py-3 text-slate-500">{formatLabel(handoff.export_type)}</td>
                  <td className="py-3 text-slate-500">{handoff.export_format.toUpperCase()}</td>
                  <td className="py-3 text-slate-500">{handoff.prepared_by_name ?? "—"}</td>
                  <td className="py-3 text-slate-500">{formatDate(handoff.transmitted_date, true)}</td>
                  <td className="py-3">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(handoff.acknowledgement_status)}`}>
                      {formatLabel(handoff.acknowledgement_status)}
                    </span>
                    {handoff.acknowledged_by_name && (
                      <span className="ml-2 text-slate-400">by {handoff.acknowledged_by_name} on {formatDate(handoff.acknowledged_at)}</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      {handoff.acknowledgement_status === "not_acknowledged" && (
                        <button
                          onClick={() => void handleAcknowledge(handoff.id)}
                          disabled={mutatingId === handoff.id}
                          className="rounded-lg bg-[var(--brand-color)] px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50 cursor-pointer"
                          type="button"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => void handleDownload(handoff)}
                        disabled={mutatingId === handoff.id}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
                        type="button"
                      >
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-slate-400">No transmitted handoffs.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

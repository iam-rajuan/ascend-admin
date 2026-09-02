"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/staff-api";
import {
  getPtimDashboard,
  listUploadedRecords,
  getMessageThreads,
  type PtimDashboardData,
  type RecordUploadsResponse,
  type MessageThreadsResponse,
} from "@/lib/role-dashboards-api";

export type TabType = "dashboard" | "notes" | "records" | "messages";

function formatNumber(value: unknown, fallback = "—") {
  return typeof value === "number" ? value.toLocaleString("en-US") : fallback;
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

export function MpView({ activeTab = "dashboard" }: { activeTab?: TabType }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dashboard, setDashboard] = useState<PtimDashboardData | null>(null);
  const [records, setRecords] = useState<RecordUploadsResponse | null>(null);
  const [threads, setThreads] = useState<MessageThreadsResponse | null>(null);

  const refreshAll = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const [dash, recs, th] = await Promise.all([
        getPtimDashboard(accessToken),
        listUploadedRecords(accessToken),
        getMessageThreads(accessToken),
      ]);
      setDashboard(dash);
      setRecords(recs);
      setThreads(th);
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

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-32 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#0e1628]" />
        ))}
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mental Performance</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Mental Performance Operations</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Clinical notes, behavioral health tracking, and confidential messaging.</p>
        </div>
        <button
          onClick={() => void refreshAll()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
          type="button"
        >
          Refresh
        </button>
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Assigned Count" value={formatNumber(dashboard?.assigned_count)} subtext="Currently assigned operators." />
            <MetricCard title="Active Cases" value={formatNumber(dashboard?.active_reconditioning_count)} subtext="Active mental performance cases." />
            <MetricCard title="Pending Review" value={formatNumber(dashboard?.pending_review_total)} subtext="Records awaiting review." accent="text-amber-500" />
            <MetricCard title="Active Threads" value={formatNumber(threads?.threads?.length)} subtext="Confidential message threads." />
          </div>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Clinical Progress Notes" subtitle="HIPAA-encrypted mental health notes." />
            <div className="space-y-4 text-xs">
              <p className="text-slate-500">Records count: {records?.records ? records.records.length : 0}</p>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "records" && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Behavioral Health Records" subtitle="Uploaded psychological evaluations and records." />
            <div className="space-y-4 text-xs">
              <p className="text-slate-500">Records count: {records?.records ? records.records.length : 0}</p>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "messages" && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Confidential Messaging" subtitle="Encrypted communication threads." />
            <div className="space-y-4 text-xs">
              <p className="text-slate-500">Threads count: {threads?.threads ? threads.threads.length : 0}</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

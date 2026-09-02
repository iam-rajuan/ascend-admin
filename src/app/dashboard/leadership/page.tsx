"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AscendLogo } from "@/components/ascend-logo";
import { IconButton } from "@/components/ui/icon-button";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { getApiErrorMessage } from "@/lib/staff-api";
import {
  archiveLeadershipBriefing,
  createLeadershipAnnotation,
  createLeadershipBriefing,
  deleteLeadershipAnnotation,
  downloadLeadershipBriefingPdf,
  getLeadershipAggregate,
  getLeadershipBriefing,
  getLeadershipBriefingTemplates,
  getLeadershipBriefings,
  getLeadershipDashboard,
  getLeadershipReports,
  getLeadershipReportTemplates,
  getLeadershipTrends,
  markLeadershipBriefingReady,
  sendLeadershipBriefing,
  submitLeadershipBriefingForReview,
  updateLeadershipBriefing,
  useLeadershipReportTemplate,
  type LeadershipAggregate,
  type LeadershipBriefingDetail,
  type LeadershipBriefingSummary,
  type LeadershipBriefingTemplate,
  type LeadershipDashboardSummary,
  type LeadershipPeriod,
  type LeadershipReportsLibrary,
  type LeadershipReportTemplate,
  type LeadershipTrends,
} from "@/lib/role-dashboards-api";
import {
  Activity,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Download,
  FileText,
  Home,
  Layers,
  LogOut,
  Moon,
  Plus,
  Send,
  Sun,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

type TabType = "index" | "aggregate" | "trends" | "reports" | "briefings";

const PERIOD_OPTIONS: LeadershipPeriod[] = ["7d", "30d", "3mo", "6mo", "12mo"];

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: withTime ? "2-digit" : undefined,
    minute: withTime ? "2-digit" : undefined,
  });
}

function formatMonth(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const [year, month] = value.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatScore(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "—";
  }

  return value.toFixed(1);
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "—";
  }

  return `${value.toFixed(1)}%`;
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return value.replace(/_/g, " ");
}

function statusTone(status: string | null | undefined) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized.includes("sent") || normalized.includes("ready") || normalized.includes("completed")) {
    return "bg-emerald-500/10 text-emerald-500";
  }
  if (normalized.includes("review") || normalized.includes("pending") || normalized.includes("draft")) {
    return "bg-amber-500/10 text-amber-500";
  }
  if (normalized.includes("archive")) {
    return "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
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

export default function LeadershipDashboard() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useCurrentUser();
  const { theme, mounted: hasMounted, toggleTheme } = useTheme();
  const { show: showToast, message: toastMessage, triggerToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("index");
  const [period, setPeriod] = useState<LeadershipPeriod>("12mo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dashboard, setDashboard] = useState<LeadershipDashboardSummary | null>(null);
  const [aggregate, setAggregate] = useState<LeadershipAggregate | null>(null);
  const [trends, setTrends] = useState<LeadershipTrends | null>(null);
  const [reports, setReports] = useState<LeadershipReportsLibrary | null>(null);
  const [reportTemplates, setReportTemplates] = useState<LeadershipReportTemplate[]>([]);
  const [briefingTemplates, setBriefingTemplates] = useState<LeadershipBriefingTemplate[]>([]);
  const [briefings, setBriefings] = useState<LeadershipBriefingSummary[]>([]);
  const [selectedBriefingId, setSelectedBriefingId] = useState<string | null>(null);
  const [selectedBriefing, setSelectedBriefing] = useState<LeadershipBriefingDetail | null>(null);
  const [outlineDraft, setOutlineDraft] = useState<Array<{ section_key: string; title: string }>>([]);

  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [annotationTitle, setAnnotationTitle] = useState("");
  const [annotationNarrative, setAnnotationNarrative] = useState("");
  const [annotationDate, setAnnotationDate] = useState(new Date().toISOString().slice(0, 10));
  const [briefingTitle, setBriefingTitle] = useState("");
  const [briefingTemplateKey, setBriefingTemplateKey] = useState("");
  const [recipientRoles, setRecipientRoles] = useState("Leadership,DWS Admin");
  const [reportsFilter, setReportsFilter] = useState("All");
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const saved = window.localStorage.getItem("ascend_leadership_active_tab");
    if (saved && ["index", "aggregate", "trends", "reports", "briefings"].includes(saved)) {
      setActiveTab(saved as TabType);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ascend_leadership_active_tab", activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (hasMounted && isHydrated && !isAuthenticated) {
      router.push("/");
    }
  }, [hasMounted, isAuthenticated, isHydrated, router]);

  const loadLeadership = async (nextSelectedId?: string | null) => {
    if (!accessToken) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [dashboardData, aggregateData, trendsData, reportsData, reportTemplateData, briefingTemplateData, briefingData] =
        await Promise.all([
          getLeadershipDashboard(accessToken),
          getLeadershipAggregate(accessToken),
          getLeadershipTrends(accessToken, period),
          getLeadershipReports(accessToken),
          getLeadershipReportTemplates(accessToken),
          getLeadershipBriefingTemplates(accessToken),
          getLeadershipBriefings(accessToken),
        ]);

      setDashboard(dashboardData);
      setAggregate(aggregateData);
      setTrends(trendsData);
      setReports(reportsData);
      setReportTemplates(reportTemplateData.templates);
      setBriefingTemplates(briefingTemplateData.templates);
      setBriefings(briefingData.briefings);

      const chosenId = nextSelectedId ?? selectedBriefingId ?? briefingData.briefings[0]?.id ?? null;
      setSelectedBriefingId(chosenId);

      if (chosenId) {
        const detail = await getLeadershipBriefing(accessToken, chosenId);
        setSelectedBriefing(detail);
        setOutlineDraft(detail.outline);
      } else {
        setSelectedBriefing(null);
        setOutlineDraft([]);
      }
    } catch (nextError) {
      setError(getApiErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasMounted || !isHydrated || !accessToken) {
      return;
    }

    void loadLeadership();
  }, [accessToken, hasMounted, isHydrated, period]);

  const filteredReports = useMemo(() => {
    const rows = reports?.recent_reports ?? [];
    if (reportsFilter === "All") {
      return rows;
    }
    return rows.filter((row) => row.export_format.toUpperCase() === reportsFilter || row.report_type === reportsFilter);
  }, [reports?.recent_reports, reportsFilter]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const refreshWithToast = async (message: string, selectedId?: string | null) => {
    await loadLeadership(selectedId);
    triggerToast(message);
  };

  if (!hasMounted || !isHydrated || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f4f9] font-sans text-slate-800 transition-colors duration-200 dark:bg-[#070a13] dark:text-slate-100">
      <aside className="z-30 flex w-64 flex-shrink-0 flex-col justify-between border-r border-slate-200 bg-white text-slate-600 dark:border-white/5 dark:bg-[#0e1628] dark:text-slate-300">
        <div>
          <div className="border-b border-slate-100 p-4 dark:border-white/5">
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-2 py-1.5 text-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
              <span className="size-2 rounded-full bg-[var(--brand-color)]" />
              <span className="text-xs font-bold">Leadership</span>
            </div>
          </div>

          <div className="space-y-6 p-4">
            <div className="space-y-1">
              <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Workspace
              </span>
              <nav className="mt-2 space-y-1">
                {[
                  { id: "index", label: "Index", icon: Home },
                  { id: "aggregate", label: "Aggregate", icon: Activity },
                  { id: "trends", label: "Trends", icon: TrendingUp },
                  { id: "reports", label: "Reports", icon: FileText },
                  { id: "briefings", label: "Briefings", icon: Layers },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as TabType)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition duration-150 cursor-pointer ${
                        activeTab === item.id
                          ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/50"
                      }`}
                      type="button"
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 p-4 dark:border-white/5">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-900/50"
            type="button"
          >
            <ArrowLeft className="size-4" />
            My profile
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="z-20 flex h-14 w-full flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-white/5 dark:bg-[#0e1628]">
          <div className="flex items-center gap-2">
            <AscendLogo width={20} height={20} showDetails={false} />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-color)]">Leadership Dashboard</span>
            <span className="text-xs text-slate-300 dark:text-slate-600">/</span>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{activeTab}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden rounded-full border border-slate-200/55 bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-400 dark:border-white/5 dark:bg-slate-950/40 md:flex">
              Aggregate-only leadership view
            </span>
            <button onClick={() => router.push("/dashboard/profile")} className="flex items-center gap-2.5" type="button">
              <div className="flex size-7 items-center justify-center rounded-full border border-[var(--brand-color)/25] bg-[var(--brand-color)/15] text-xs font-bold text-[var(--brand-color)]">
                {currentUser?.initials}
              </div>
              <div className="hidden text-left lg:block">
                <p className="text-xs font-bold text-slate-800 dark:text-white">{currentUser?.name}</p>
                <p className="text-[9px] text-slate-400">{currentUser?.unit}</p>
              </div>
            </button>
            <IconButton
              icon={theme === "light" ? Moon : Sun}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              onClick={toggleTheme}
            />
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-950/20 dark:bg-red-950/10 dark:text-red-400 dark:hover:bg-red-950/30"
              type="button"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </button>
          </div>
        </header>

        <section className="z-10 flex h-9 w-full flex-shrink-0 items-center justify-center bg-[#101b22] px-6 text-center text-[10px] font-semibold tracking-wider text-slate-400">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[var(--brand-color)]" />
            <span>CUI // OPSEC · Leadership screens are aggregate only and enforce cohort suppression from the live backend.</span>
          </div>
        </section>

        <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-6 dark:bg-[#070a13] md:p-8">
          <div className="space-y-8">
            {loading && <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/5 dark:bg-[#0e1628]">Loading live leadership data...</div>}
            {!loading && error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-300">{error}</div>}

            {!loading && !error && activeTab === "index" && dashboard && (
              <div className="space-y-8 animate-fade-in">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#0e1628]">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leadership · Index</p>
                      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Command overview</h1>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Landing metrics, aggregate readiness, support routing, and recent exports from the live leadership API.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("aggregate")}
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                      type="button"
                    >
                      <Activity className="size-4" />
                      Open aggregate
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                  <MetricCard title="Enrolled operators" value={dashboard.enrolled_operator_count.toString()} subtext="Live cohort count" />
                  <MetricCard title="Average OPS" value={formatScore(dashboard.average_ops_score)} subtext="Aggregate only" accent="text-emerald-500" />
                  <MetricCard title="Support requests" value={Object.values(dashboard.support_requests_by_pathway).reduce((sum, count) => sum + count, 0).toString()} subtext="Across all pathways" />
                  <MetricCard title="Utilization 90d" value={dashboard.utilization_event_count_90d.toString()} subtext="Real event count" />
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                  <Card className="lg:col-span-5">
                    <CardHeader title="Band distribution" subtitle="Current aggregate readiness bands" />
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {Object.entries(dashboard.band_distribution).map(([band, count]) => (
                        <div key={band} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{band}</p>
                          <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{count}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="lg:col-span-7">
                    <CardHeader title="Component averages" subtitle="Live backend aggregate component scores" />
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                            <th className="pb-3 font-semibold">Component</th>
                            <th className="pb-3 font-semibold text-right">Average score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {Object.entries(dashboard.component_averages).map(([component, value]) => (
                            <tr key={component}>
                              <td className="py-3 font-semibold text-slate-800 dark:text-white">{component}</td>
                              <td className="py-3 text-right font-mono text-slate-500">{formatScore(value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                  <Card className="lg:col-span-6">
                    <CardHeader title="OFT status counts" subtitle="Current, exempt, scheduled, and not current" />
                    <SimpleKeyValueList rows={Object.entries(dashboard.oft_status_counts).map(([key, value]) => ({ label: formatLabel(key), value: String(value) }))} />
                  </Card>
                  <Card className="lg:col-span-6">
                    <CardHeader title="Recent report exports" subtitle="Latest leadership-visible exports" />
                    <div className="space-y-3 text-xs">
                      {dashboard.recent_report_exports.map((item, index) => (
                        <div key={`${item.report_type}-${item.created_at}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                          <p className="font-semibold text-slate-900 dark:text-white">{formatLabel(item.report_type)}</p>
                          <p className="mt-1 text-[10px] text-slate-500">{item.date_range || "current"} · {formatDate(item.created_at, true)}</p>
                        </div>
                      ))}
                      {dashboard.recent_report_exports.length === 0 && <EmptyState label="No leadership exports have been generated yet." />}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {!loading && !error && activeTab === "aggregate" && aggregate && (
              <div className="space-y-8 animate-fade-in">
                <SectionTitle
                  kicker="Leadership · Aggregate"
                  title="Aggregate readiness"
                  description={`Live aggregate OPS, by-flight comparison, recovery program summary, and risk heatmap. Cohort minimum k ≥ ${aggregate.min_cohort_size}.`}
                  actions={
                    <>
                      <button onClick={() => setActiveTab("reports")} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-slate-800" type="button">Reports</button>
                      <button onClick={() => setActiveTab("trends")} className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90" type="button">Open trends</button>
                    </>
                  }
                />

                <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                  <MetricCard title="Hero cohort" value={aggregate.hero.cohort_size.toString()} subtext={aggregate.hero.score_band || "No band"} />
                  <MetricCard title="Average OPS" value={formatScore(aggregate.hero.average_ops_score)} subtext={`Target ${formatScore(aggregate.hero.approximate_target_score)}`} accent="text-emerald-500" />
                  <MetricCard title="MoM delta" value={formatScore(aggregate.hero.mom_delta)} subtext="Month-over-month" />
                  <MetricCard title="PvP delta" value={formatScore(aggregate.hero.pvp_delta)} subtext="Period-over-period" />
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                  <Card className="lg:col-span-5">
                    <CardHeader title="Driver trends" subtitle="Aggregate component averages and current bands" />
                    <SimpleKeyValueList rows={aggregate.driver_trends.map((item) => ({ label: item.component, value: `${formatScore(item.average_score)} · ${item.score_band || "—"}` }))} />
                  </Card>
                  <Card className="lg:col-span-7">
                    <CardHeader title="Flight comparison" subtitle={`${aggregate.flight_comparison.flights_meeting_cohort_minimum} of ${aggregate.flight_comparison.total_flights} flights meet the cohort minimum`} />
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                            <th className="pb-3 font-semibold">Flight</th>
                            <th className="pb-3 font-semibold">Cohort</th>
                            <th className="pb-3 font-semibold">OPS</th>
                            <th className="pb-3 font-semibold">Band</th>
                            <th className="pb-3 font-semibold">MoM</th>
                            <th className="pb-3 font-semibold">Confidence</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {aggregate.flight_comparison.flights.map((flight) => (
                            <tr key={flight.flight_id}>
                              <td className="py-3 font-semibold text-slate-800 dark:text-white">{flight.flight_name}</td>
                              <td className="py-3 text-slate-500">{flight.cohort_size}</td>
                              <td className="py-3 font-mono text-slate-500">{formatScore(flight.average_ops_score)}</td>
                              <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(flight.score_band)}`}>{flight.score_band || "—"}</span></td>
                              <td className="py-3 text-slate-500">{formatScore(flight.mom_delta)}</td>
                              <td className="py-3 text-slate-500">{flight.confidence || "—"}</td>
                            </tr>
                          ))}
                          {aggregate.flight_comparison.flights.length === 0 && <EmptyRow colSpan={6} label="No flights met the aggregate comparison criteria." />}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                  <Card className="lg:col-span-7">
                    <CardHeader title="Risk heatmap" subtitle="Driver severity and band values returned by the backend" />
                    <div className="space-y-4">
                      {aggregate.risk_heatmap.flights.map((flight) => (
                        <div key={flight.flight_id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{flight.flight_name}</p>
                            <span className="text-[10px] text-slate-400">{flight.suppressed ? "Suppressed" : `k=${flight.cohort_size}`}</span>
                          </div>
                          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                            {Object.keys(flight.driver_bands).map((driver) => (
                              <div key={driver} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-white/5 dark:bg-[#0e1628]">
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{driver}</span>
                                <span className="text-[10px] text-slate-500">{flight.driver_bands[driver] || "—"} · {flight.driver_severity[driver] || "—"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {aggregate.risk_heatmap.flights.length === 0 && <EmptyState label="No heatmap cells were returned for this aggregate cohort." />}
                    </div>
                  </Card>
                  <Card className="lg:col-span-5">
                    <CardHeader title="Recovery program summary" subtitle={`${aggregate.recovery_program_summary.total_active_plans} active plans across live flights`} />
                    <SimpleKeyValueList
                      rows={[
                        { label: "Flights with active recovery", value: String(aggregate.recovery_program_summary.flights_with_active_recovery) },
                        { label: "On-track flights", value: String(aggregate.recovery_program_summary.on_track_flight_count) },
                        { label: "Flights meeting cohort minimum", value: String(aggregate.recovery_program_summary.flights_meeting_cohort_minimum) },
                        { label: "OFT due soon", value: String(aggregate.oft_due_soon_count ?? 0) },
                      ]}
                    />
                    <div className="mt-4 space-y-3 text-xs">
                      {aggregate.recovery_program_summary.flights.map((flight) => (
                        <div key={flight.flight_id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                          <p className="font-semibold text-slate-900 dark:text-white">{flight.flight_name}</p>
                          <p className="mt-1 text-[10px] text-slate-500">{flight.active_plan_count} active plans · {flight.overdue_review_count} overdue reviews</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {!loading && !error && activeTab === "trends" && trends && (
              <div className="space-y-8 animate-fade-in">
                <SectionTitle
                  kicker="Leadership · Trends"
                  title="Aggregate trends"
                  description={`Trend period ${period} from the live backend. Annotations are cohort-level only.`}
                  actions={
                    <button onClick={() => setShowAnnotationModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90" type="button"><Plus className="size-4" /> Add annotation</button>
                  }
                />

                <div className="flex flex-wrap gap-2">
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => setPeriod(option)}
                      className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
                        option === period
                          ? "border-transparent bg-[var(--brand-color)] text-white"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0e1628] dark:hover:bg-slate-800"
                      }`}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                  <Card className="lg:col-span-8">
                    <CardHeader title="Trend periods" subtitle="Average OPS and cohort size by returned period rows" />
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                            <th className="pb-3 font-semibold">Period</th>
                            <th className="pb-3 font-semibold">Cohort</th>
                            <th className="pb-3 font-semibold">Average OPS</th>
                            <th className="pb-3 font-semibold">Physical</th>
                            <th className="pb-3 font-semibold">Sleep</th>
                            <th className="pb-3 font-semibold">Mental</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {trends.trend.months.map((month) => (
                            <tr key={month.month}>
                              <td className="py-3 font-semibold text-slate-800 dark:text-white">{formatMonth(month.month)}</td>
                              <td className="py-3 text-slate-500">{month.cohort_size}</td>
                              <td className="py-3 font-mono text-slate-500">{formatScore(month.average_ops_score)}</td>
                              <td className="py-3 text-slate-500">{formatScore(month.component_averages["Physical Readiness"])}</td>
                              <td className="py-3 text-slate-500">{formatScore(month.component_averages["Sleep Readiness"])}</td>
                              <td className="py-3 text-slate-500">{formatScore(month.component_averages["Mental Readiness"])}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <Card className="lg:col-span-4">
                    <CardHeader title="Current distribution" subtitle={`MoM ${formatScore(trends.trend.mom_delta)} · PvP ${formatScore(trends.trend.pvp_delta)}`} />
                    <SimpleKeyValueList rows={trends.band_distribution.current_distribution.map((row) => ({ label: row.band, value: `${row.count} (${row.delta >= 0 ? "+" : ""}${row.delta})` }))} />
                  </Card>
                </div>

                <Card>
                  <CardHeader title="Annotations" subtitle="Leadership-created aggregate context markers" />
                  <div className="space-y-4">
                    {trends.annotations.map((annotation) => (
                      <div key={annotation.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{annotation.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{annotation.narrative}</p>
                          <p className="mt-2 text-[10px] text-slate-400">{formatDate(annotation.event_date)} · {annotation.created_by_name || "Unknown author"}</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (!accessToken) return;
                            setIsMutating(true);
                            try {
                              await deleteLeadershipAnnotation(accessToken, annotation.id);
                              await refreshWithToast("Annotation removed from live trends.");
                            } catch (nextError) {
                              triggerToast(getApiErrorMessage(nextError));
                            } finally {
                              setIsMutating(false);
                            }
                          }}
                          disabled={isMutating}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold text-rose-600 disabled:opacity-50 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-300"
                          type="button"
                        >
                          <XCircle className="size-3.5" />
                          Delete
                        </button>
                      </div>
                    ))}
                    {trends.annotations.length === 0 && <EmptyState label="No aggregate annotations are stored yet." />}
                  </div>
                </Card>
              </div>
            )}

            {!loading && !error && activeTab === "reports" && reports && (
              <div className="space-y-8 animate-fade-in">
                <SectionTitle
                  kicker="Leadership · Reports"
                  title="Reports library"
                  description="Recent aggregate exports, recurring schedules, and template-backed schedule creation from the live backend."
                />

                <div className="flex flex-wrap gap-2">
                  {["All", "CSV", "PDF"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setReportsFilter(filter)}
                      className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
                        reportsFilter === filter
                          ? "border-transparent bg-[var(--brand-color)] text-white"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0e1628] dark:hover:bg-slate-800"
                      }`}
                      type="button"
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                  <Card className="lg:col-span-7">
                    <CardHeader title="Recent reports" subtitle={`${filteredReports.length} live exports in the current filter`} />
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                            <th className="pb-3 font-semibold">Title</th>
                            <th className="pb-3 font-semibold">Format</th>
                            <th className="pb-3 font-semibold">Sensitivity</th>
                            <th className="pb-3 font-semibold">Status</th>
                            <th className="pb-3 font-semibold">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {filteredReports.map((report) => (
                            <tr key={report.id}>
                              <td className="py-3 font-semibold text-slate-800 dark:text-white">{report.title || formatLabel(report.report_type)}</td>
                              <td className="py-3 text-slate-500">{report.export_format.toUpperCase()}</td>
                              <td className="py-3 text-slate-500">{report.sensitivity_level}</td>
                              <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(report.export_log_status)}`}>{report.export_log_status}</span></td>
                              <td className="py-3 text-slate-500">{formatDate(report.created_at, true)}</td>
                            </tr>
                          ))}
                          {filteredReports.length === 0 && <EmptyRow colSpan={5} label="No reports match this live filter." />}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <Card className="lg:col-span-5">
                    <CardHeader title="Report templates" subtitle="Using a template creates a real recurring schedule" />
                    <div className="space-y-3">
                      {reportTemplates.map((template) => (
                        <div key={template.key} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{template.title}</p>
                              <p className="mt-1 text-[10px] text-slate-500">{template.report_type} · {template.cadence} · {template.export_format.toUpperCase()}</p>
                            </div>
                            <button
                              onClick={async () => {
                                if (!accessToken) return;
                                setIsMutating(true);
                                try {
                                  await useLeadershipReportTemplate(accessToken, template.key);
                                  await refreshWithToast(`${template.title} template created a live schedule.`);
                                } catch (nextError) {
                                  triggerToast(getApiErrorMessage(nextError));
                                } finally {
                                  setIsMutating(false);
                                }
                              }}
                              disabled={isMutating}
                              className="rounded-lg bg-[var(--brand-color)] px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
                              type="button"
                            >
                              Use
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <Card>
                  <CardHeader title="Recurring schedules" subtitle={`${reports.schedules.length} live schedules returned for leadership`} />
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                          <th className="pb-3 font-semibold">Name</th>
                          <th className="pb-3 font-semibold">Report type</th>
                          <th className="pb-3 font-semibold">Cadence</th>
                          <th className="pb-3 font-semibold">Recipient role</th>
                          <th className="pb-3 font-semibold">Next run</th>
                          <th className="pb-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {reports.schedules.map((schedule) => (
                          <tr key={schedule.id}>
                            <td className="py-3 font-semibold text-slate-800 dark:text-white">{schedule.name}</td>
                            <td className="py-3 text-slate-500">{schedule.report_type}</td>
                            <td className="py-3 text-slate-500">{schedule.cadence}</td>
                            <td className="py-3 text-slate-500">{schedule.recipient_role}</td>
                            <td className="py-3 text-slate-500">{formatDate(schedule.next_run_at, true)}</td>
                            <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(schedule.status)}`}>{schedule.status}</span></td>
                          </tr>
                        ))}
                        {reports.schedules.length === 0 && <EmptyRow colSpan={6} label="No leadership schedules are configured yet." />}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {!loading && !error && activeTab === "briefings" && (
              <div className="space-y-8 animate-fade-in">
                <SectionTitle
                  kicker="Leadership · Briefings"
                  title="Executive briefings"
                  description="Create, edit, submit, mark ready, send, archive, and download live briefing records without using frontend mock state."
                  actions={
                    <button onClick={() => setShowBriefingModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90" type="button"><Plus className="size-4" /> New briefing</button>
                  }
                />

                <div className="grid gap-6 lg:grid-cols-12">
                  <Card className="lg:col-span-4">
                    <CardHeader title="Briefing templates" subtitle={`${briefingTemplates.length} live templates`} />
                    <div className="space-y-3 text-xs">
                      {briefingTemplates.map((template) => (
                        <div key={template.key} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                          <p className="font-semibold text-slate-900 dark:text-white">{template.title}</p>
                          <p className="mt-1 text-[10px] text-slate-500">{template.sections.join(" · ")}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="lg:col-span-8">
                    <CardHeader title="Live briefings" subtitle={`${briefings.length} briefing records`} />
                    <div className="space-y-3">
                      {briefings.map((briefing) => (
                        <button
                          key={briefing.id}
                          onClick={async () => {
                            if (!accessToken) return;
                            setSelectedBriefingId(briefing.id);
                            setLoading(true);
                            try {
                              const detail = await getLeadershipBriefing(accessToken, briefing.id);
                              setSelectedBriefing(detail);
                              setOutlineDraft(detail.outline);
                            } catch (nextError) {
                              triggerToast(getApiErrorMessage(nextError));
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className={`w-full rounded-xl border p-4 text-left text-xs transition ${
                            selectedBriefingId === briefing.id
                              ? "border-[var(--brand-color)] bg-[var(--brand-color)/5]"
                              : "border-slate-100 bg-slate-50 hover:bg-slate-100 dark:border-white/5 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                          }`}
                          type="button"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{briefing.title}</p>
                              <p className="mt-1 text-[10px] text-slate-500">{briefing.template_key} · {briefing.section_count} sections · {formatDate(briefing.created_at, true)}</p>
                            </div>
                            <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(briefing.status)}`}>{briefing.status}</span>
                          </div>
                        </button>
                      ))}
                      {briefings.length === 0 && <EmptyState label="No live briefings exist yet for this role." />}
                    </div>
                  </Card>
                </div>

                <Card>
                  <CardHeader title="Selected briefing" subtitle={selectedBriefing ? `${selectedBriefing.template_key} · ${selectedBriefing.status}` : "Choose a briefing to view its outline and content"} />
                  {!selectedBriefing && <EmptyState label="Select a live briefing to inspect generated content and workflow state." />}

                  {selectedBriefing && (
                    <div className="space-y-6">
                      <div className="grid gap-6 lg:grid-cols-12">
                        <div className="space-y-3 lg:col-span-5">
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Outline</p>
                            <div className="mt-3 space-y-3">
                              {outlineDraft.map((section, index) => (
                                <div key={`${section.section_key}-${index}`} className="rounded-lg border border-slate-100 bg-white p-3 dark:border-white/5 dark:bg-[#0e1628]">
                                  <p className="text-[10px] text-slate-400">{section.section_key}</p>
                                  <input
                                    value={section.title}
                                    onChange={(event) =>
                                      setOutlineDraft((current) =>
                                        current.map((item, itemIndex) =>
                                          itemIndex === index ? { ...item, title: event.target.value } : item,
                                        ),
                                      )
                                    }
                                    disabled={selectedBriefing.status !== "draft" || isMutating}
                                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-[var(--brand-color)] focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                                  />
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={async () => {
                                if (!accessToken || !selectedBriefing) return;
                                setIsMutating(true);
                                try {
                                  const updated = await updateLeadershipBriefing(accessToken, selectedBriefing.id, { outline: outlineDraft });
                                  setSelectedBriefing(updated);
                                  setOutlineDraft(updated.outline);
                                  await refreshWithToast("Briefing outline saved.", selectedBriefing.id);
                                } catch (nextError) {
                                  triggerToast(getApiErrorMessage(nextError));
                                } finally {
                                  setIsMutating(false);
                                }
                              }}
                              disabled={selectedBriefing.status !== "draft" || isMutating}
                              className="mt-4 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              type="button"
                            >
                              Save outline
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3 lg:col-span-7">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={async () => {
                                if (!accessToken || !selectedBriefing) return;
                                setIsMutating(true);
                                try {
                                  await submitLeadershipBriefingForReview(accessToken, selectedBriefing.id);
                                  await refreshWithToast("Briefing submitted for review.", selectedBriefing.id);
                                } catch (nextError) {
                                  triggerToast(getApiErrorMessage(nextError));
                                } finally {
                                  setIsMutating(false);
                                }
                              }}
                              disabled={selectedBriefing.status !== "draft" || isMutating}
                              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-slate-800"
                              type="button"
                            >
                              Submit for review
                            </button>
                            <button
                              onClick={async () => {
                                if (!accessToken || !selectedBriefing) return;
                                setIsMutating(true);
                                try {
                                  await markLeadershipBriefingReady(accessToken, selectedBriefing.id);
                                  await refreshWithToast("Briefing marked ready.", selectedBriefing.id);
                                } catch (nextError) {
                                  triggerToast(getApiErrorMessage(nextError));
                                } finally {
                                  setIsMutating(false);
                                }
                              }}
                              disabled={selectedBriefing.status !== "pending_review" || isMutating}
                              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-slate-800"
                              type="button"
                            >
                              Mark ready
                            </button>
                            <button
                              onClick={async () => {
                                if (!accessToken || !selectedBriefing) return;
                                setIsMutating(true);
                                try {
                                  const parsedRoles = recipientRoles.split(",").map((role) => role.trim()).filter(Boolean);
                                  await sendLeadershipBriefing(accessToken, selectedBriefing.id, parsedRoles);
                                  await refreshWithToast("Briefing sent.", selectedBriefing.id);
                                } catch (nextError) {
                                  triggerToast(getApiErrorMessage(nextError));
                                } finally {
                                  setIsMutating(false);
                                }
                              }}
                              disabled={!["draft", "ready"].includes(selectedBriefing.status) || isMutating}
                              className="rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              type="button"
                            >
                              Send briefing
                            </button>
                            <button
                              onClick={async () => {
                                if (!accessToken || !selectedBriefing) return;
                                setIsMutating(true);
                                try {
                                  await archiveLeadershipBriefing(accessToken, selectedBriefing.id);
                                  await refreshWithToast("Briefing archived.", selectedBriefing.id);
                                } catch (nextError) {
                                  triggerToast(getApiErrorMessage(nextError));
                                } finally {
                                  setIsMutating(false);
                                }
                              }}
                              disabled={selectedBriefing.status !== "sent" || isMutating}
                              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-slate-800"
                              type="button"
                            >
                              Archive
                            </button>
                            <button
                              onClick={async () => {
                                if (!accessToken || !selectedBriefing) return;
                                setIsMutating(true);
                                try {
                                  const blob = await downloadLeadershipBriefingPdf(accessToken, selectedBriefing.id);
                                  downloadBlob(blob, `${selectedBriefing.title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
                                  triggerToast("Briefing PDF downloaded.");
                                } catch (nextError) {
                                  triggerToast(getApiErrorMessage(nextError));
                                } finally {
                                  setIsMutating(false);
                                }
                              }}
                              disabled={isMutating}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-slate-800"
                              type="button"
                            >
                              <Download className="size-3.5" />
                              PDF
                            </button>
                          </div>

                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Recipient roles</label>
                            <input
                              value={recipientRoles}
                              onChange={(event) => setRecipientRoles(event.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[var(--brand-color)] focus:outline-none dark:border-white/10 dark:bg-[#0e1628] dark:text-white"
                            />
                          </div>

                          <div className="space-y-3">
                            {selectedBriefing.outline.map((section) => (
                              <div key={section.section_key} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{section.title}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{section.section_key}</p>
                                <p className="mt-3 text-xs leading-6 text-slate-600 dark:text-slate-300">
                                  {selectedBriefing.generated_content[section.section_key] || "No generated content returned for this section."}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {showAnnotationModal && (
        <AccessibleDialog open onClose={() => setShowAnnotationModal(false)} titleId="leadership-annotation-title">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="leadership-annotation-title" className="text-sm font-bold text-slate-900 dark:text-white">Create annotation</h3>
              <button onClick={() => setShowAnnotationModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white" type="button">
                <XCircle className="size-4" />
              </button>
            </div>
            <input value={annotationTitle} onChange={(event) => setAnnotationTitle(event.target.value)} placeholder="Wing PT test week" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-[var(--brand-color)] focus:outline-none dark:border-white/10 dark:bg-[#070a13]" />
            <textarea value={annotationNarrative} onChange={(event) => setAnnotationNarrative(event.target.value)} placeholder="Aggregate cohort note for trends." rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-[var(--brand-color)] focus:outline-none dark:border-white/10 dark:bg-[#070a13]" />
            <input type="date" value={annotationDate} onChange={(event) => setAnnotationDate(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-[var(--brand-color)] focus:outline-none dark:border-white/10 dark:bg-[#070a13]" />
            <div className="flex gap-3">
              <button onClick={() => setShowAnnotationModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-slate-800" type="button">Cancel</button>
              <button
                onClick={async () => {
                  if (!accessToken) return;
                  setIsMutating(true);
                  try {
                    await createLeadershipAnnotation(accessToken, {
                      title: annotationTitle.trim(),
                      narrative: annotationNarrative.trim(),
                      event_date: annotationDate,
                      unit_id: null,
                    });
                    setShowAnnotationModal(false);
                    setAnnotationTitle("");
                    setAnnotationNarrative("");
                    await refreshWithToast("Annotation created in live leadership trends.");
                  } catch (nextError) {
                    triggerToast(getApiErrorMessage(nextError));
                  } finally {
                    setIsMutating(false);
                  }
                }}
                disabled={!annotationTitle.trim() || !annotationNarrative.trim() || isMutating}
                className="flex-1 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                type="button"
              >
                Save
              </button>
            </div>
          </div>
        </AccessibleDialog>
      )}

      {showBriefingModal && (
        <AccessibleDialog open onClose={() => setShowBriefingModal(false)} titleId="leadership-briefing-title">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="leadership-briefing-title" className="text-sm font-bold text-slate-900 dark:text-white">Create briefing</h3>
              <button onClick={() => setShowBriefingModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white" type="button">
                <XCircle className="size-4" />
              </button>
            </div>
            <input value={briefingTitle} onChange={(event) => setBriefingTitle(event.target.value)} placeholder="August Wing Briefing" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-[var(--brand-color)] focus:outline-none dark:border-white/10 dark:bg-[#070a13]" />
            <select value={briefingTemplateKey} onChange={(event) => setBriefingTemplateKey(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-[var(--brand-color)] focus:outline-none dark:border-white/10 dark:bg-[#070a13]">
              <option value="">Select briefing template</option>
              {briefingTemplates.map((template) => (
                <option key={template.key} value={template.key}>{template.title}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowBriefingModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-slate-800" type="button">Cancel</button>
              <button
                onClick={async () => {
                  if (!accessToken || !briefingTemplateKey || !briefingTitle.trim()) return;
                  setIsMutating(true);
                  try {
                    const created = await createLeadershipBriefing(accessToken, {
                      title: briefingTitle.trim(),
                      template_key: briefingTemplateKey,
                      custom_outline: null,
                    });
                    setShowBriefingModal(false);
                    setBriefingTitle("");
                    setBriefingTemplateKey("");
                    await refreshWithToast("Briefing created from the live backend.", created.id);
                  } catch (nextError) {
                    triggerToast(getApiErrorMessage(nextError));
                  } finally {
                    setIsMutating(false);
                  }
                }}
                disabled={!briefingTitle.trim() || !briefingTemplateKey || isMutating}
                className="flex-1 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                type="button"
              >
                Create
              </button>
            </div>
          </div>
        </AccessibleDialog>
      )}

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white shadow-2xl">
          <CheckCircle className="size-4 text-[var(--brand-color)]" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{kicker}</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtext,
  accent,
}: {
  title: string;
  value: string;
  subtext: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#0e1628]">
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <p className={`mt-1 text-2xl font-black text-slate-900 dark:text-white ${accent ?? ""}`}>{value}</p>
      <p className="mt-1 text-[10px] text-slate-400">{subtext}</p>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#0e1628] ${className}`}>{children}</div>;
}

function CardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4 border-b border-slate-100 pb-3 dark:border-white/5">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-[10px] text-slate-500">{subtitle}</p>
    </div>
  );
}

function SimpleKeyValueList({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <div className="space-y-3 text-xs">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/5 dark:bg-slate-900/50">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{row.label}</span>
          <span className="font-mono text-slate-500">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400 dark:border-white/10 dark:bg-slate-900/40">{label}</div>;
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-6 text-center text-slate-400">
        {label}
      </td>
    </tr>
  );
}

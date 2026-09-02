"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useLeadership } from "../context/leadership-context";
import {
  archiveLeadershipBriefing,
  createLeadershipBriefing,
  downloadLeadershipBriefingPdf,
  getLeadershipBriefing,
  markLeadershipBriefingReady,
  sendLeadershipBriefing,
  submitLeadershipBriefingForReview,
  updateLeadershipBriefing,
  type LeadershipBriefingDetail,
} from "@/lib/role-dashboards-api";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { Plus, Download, FileText, Send, CheckCircle, XCircle } from "lucide-react";

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

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-[#ffffff] p-6 shadow-sm dark:border-white/5 dark:bg-[#0e1628] ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 border-b border-slate-100 pb-3 dark:border-white/5">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      {subtitle && <p className="mt-0.5 text-[10px] text-slate-400">{subtitle}</p>}
    </div>
  );
}

export function BriefingsView() {
  const { loading, error, briefings, briefingTemplates, refreshData, isMutating, setIsMutating } = useLeadership();
  const accessToken = useAuthStore((state) => state.accessToken);

  const [selectedBriefingId, setSelectedBriefingId] = useState<string | null>(null);
  const [briefingDetail, setBriefingDetail] = useState<LeadershipBriefingDetail | null>(null);

  const [showBriefingWizard, setShowBriefingWizard] = useState(false);
  const [briefingTitle, setBriefingTitle] = useState("");
  const [briefingTemplateKey, setBriefingTemplateKey] = useState("monthly_command_readiness");

  const openBriefingDetail = async (briefingId: string) => {
    if (!accessToken) return;
    setSelectedBriefingId(briefingId);
    try {
      const detail = await getLeadershipBriefing(accessToken, briefingId);
      setBriefingDetail(detail);
    } catch (err) {
      // handled
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/5 dark:bg-[#0e1628]">Loading live briefings...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-300">{error}</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leadership · Briefings</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Executive briefings</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Draft, review, mark ready, send, archive, or download PDF briefings backed by live endpoints.</p>
        </div>
        <button
          onClick={() => setShowBriefingWizard(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
          type="button"
        >
          <Plus className="size-4" /> New briefing
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader title="Briefing documents" subtitle={`${briefings.length} live executive briefing records`} />
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                  <th className="pb-3 font-semibold">Title</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Recipients</th>
                  <th className="pb-3 font-semibold">Updated</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {briefings.map((briefing) => (
                  <tr key={briefing.id}>
                    <td className="py-3 font-semibold text-slate-800 dark:text-white">{briefing.title}</td>
                    <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(briefing.status)}`}>{briefing.status}</span></td>
                    <td className="py-3 text-slate-500">{briefing.recipient_roles ? briefing.recipient_roles.join(", ") : "—"}</td>
                    <td className="py-3 text-slate-500">{formatDate(briefing.created_at, true)}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => void openBriefingDetail(briefing.id)}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-[var(--brand-color)] hover:text-white dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                        type="button"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {briefings.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-400">No briefings exist yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader title="Briefing templates" subtitle="Built-in executive templates for fast generation" />
          <div className="space-y-3">
            {briefingTemplates.map((template) => (
              <div key={template.key} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-900/50">
                <p className="font-bold text-slate-900 dark:text-white">{template.title}</p>
                <p className="mt-1 text-xs text-slate-500">Sections: {template.sections ? template.sections.join(", ") : "—"}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {briefingDetail && (
        <Card className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4 dark:border-white/5">
            <div>
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(briefingDetail.status)}`}>{briefingDetail.status}</span>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{briefingDetail.title}</h2>
              <p className="text-xs text-slate-500">Recipients: {briefingDetail.recipient_roles ? briefingDetail.recipient_roles.join(", ") : "Not specified"}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  if (!accessToken) return;
                  setIsMutating(true);
                  try {
                    const blob = await downloadLeadershipBriefingPdf(accessToken, briefingDetail.id);
                    downloadBlob(blob, `${briefingDetail.id}.pdf`);
                  } catch (nextError) {
                    // handled
                  } finally {
                    setIsMutating(false);
                  }
                }}
                disabled={isMutating}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-slate-800 cursor-pointer"
                type="button"
              >
                <Download className="size-3.5" /> PDF
              </button>

              {briefingDetail.status === "draft" && (
                <button
                  onClick={async () => {
                    if (!accessToken) return;
                    setIsMutating(true);
                    try {
                      await submitLeadershipBriefingForReview(accessToken, briefingDetail.id);
                      await openBriefingDetail(briefingDetail.id);
                      await refreshData("Briefing submitted for review.");
                    } catch (err) {
                      // handled
                    } finally {
                      setIsMutating(false);
                    }
                  }}
                  disabled={isMutating}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:border-amber-950/30 dark:bg-amber-950/20 dark:text-amber-300 cursor-pointer"
                  type="button"
                >
                  Submit review
                </button>
              )}

              {briefingDetail.status === "under_review" && (
                <button
                  onClick={async () => {
                    if (!accessToken) return;
                    setIsMutating(true);
                    try {
                      await markLeadershipBriefingReady(accessToken, briefingDetail.id);
                      await openBriefingDetail(briefingDetail.id);
                      await refreshData("Briefing marked ready.");
                    } catch (err) {
                      // handled
                    } finally {
                      setIsMutating(false);
                    }
                  }}
                  disabled={isMutating}
                  className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:opacity-90 cursor-pointer"
                  type="button"
                >
                  Mark ready
                </button>
              )}

              {briefingDetail.status === "ready" && (
                <button
                  onClick={async () => {
                    if (!accessToken) return;
                    setIsMutating(true);
                    try {
                      await sendLeadershipBriefing(accessToken, briefingDetail.id, briefingDetail.recipient_roles || ["Leadership"]);
                      await openBriefingDetail(briefingDetail.id);
                      await refreshData("Briefing sent.");
                    } catch (err) {
                      // handled
                    } finally {
                      setIsMutating(false);
                    }
                  }}
                  disabled={isMutating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-color)] px-3 py-2 text-xs font-bold text-white hover:opacity-90 cursor-pointer"
                  type="button"
                >
                  <Send className="size-3.5" /> Send
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Sections</h3>
              <ul className="list-disc pl-4 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                {briefingDetail.outline?.map((item) => (
                  <li key={item.section_key}>
                    <span className="font-bold">{item.title}:</span> {briefingDetail.generated_content?.[item.section_key] || "—"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* BRIEFING WIZARD MODAL */}
      {showBriefingWizard && (
        <AccessibleDialog open={showBriefingWizard} onClose={() => setShowBriefingWizard(false)} titleId="create-briefing-title">
          <div className="space-y-4">
            <h3 id="create-briefing-title" className="text-base font-bold text-slate-900 dark:text-white">Create new executive briefing</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Briefing Title</label>
                <input
                  type="text"
                  value={briefingTitle}
                  onChange={(e) => setBriefingTitle(e.target.value)}
                  placeholder="e.g. Monthly Command Readiness Review"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Template</label>
                <select
                  value={briefingTemplateKey}
                  onChange={(e) => setBriefingTemplateKey(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                >
                  {briefingTemplates.map((t) => (
                    <option key={t.key} value={t.key}>{t.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowBriefingWizard(false)} className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-slate-800 cursor-pointer" type="button">Cancel</button>
              <button
                onClick={async () => {
                  if (!accessToken || !briefingTitle.trim()) return;
                  setIsMutating(true);
                  try {
                    const newBriefing = await createLeadershipBriefing(accessToken, {
                      title: briefingTitle.trim(),
                      template_key: briefingTemplateKey,
                    });
                    setShowBriefingWizard(false);
                    setBriefingTitle("");
                    await openBriefingDetail(newBriefing.id);
                    await refreshData("New briefing created.");
                  } catch (err) {
                    // handled
                  } finally {
                    setIsMutating(false);
                  }
                }}
                disabled={isMutating || !briefingTitle.trim()}
                className="flex-1 rounded-xl bg-[var(--brand-color)] py-2 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
                type="button"
              >
                Create briefing
              </button>
            </div>
          </div>
        </AccessibleDialog>
      )}
    </div>
  );
}

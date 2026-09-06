"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { getApiErrorMessage } from "@/lib/staff-api";
import { Download, Plus, Send, Archive, ChevronUp, ChevronDown, X, Shield } from "lucide-react";

// Mirrors the real backend's SECTION_TITLES (briefing_service.py) - the
// only 8 section types `_get_section_data` actually resolves. Not exposed
// by any GET endpoint, so kept in sync here rather than invented.
const SECTION_TITLES: Record<string, string> = {
  mission_context: "Mission context",
  composite_trend: "Composite OPS trend",
  driver_snapshot: "Driver snapshot",
  by_flight: "By-flight comparison",
  oft_snapshot: "OFT readiness",
  band_distribution: "Cohort band distribution",
  risk_recommendations: "Risk & recommendations",
  recovery_snapshot: "Recovery program snapshot",
};

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

function formatTime(value: Date) {
  return value.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
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

function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/5">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[10px] text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function BriefingsView() {
  const { loading, error, briefings, briefingTemplates, trends, refreshData, isMutating, setIsMutating, triggerToast } = useLeadership();
  const accessToken = useAuthStore((state) => state.accessToken);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LeadershipBriefingDetail | null>(null);
  const [localOutline, setLocalOutline] = useState<Array<{ section_key: string; title: string }>>([]);
  const [selectedSectionKey, setSelectedSectionKey] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);

  const cohortK = trends?.band_distribution.min_cohort_size ?? 5;

  const openBriefing = async (briefingId: string) => {
    if (!accessToken) return;
    try {
      const data = await getLeadershipBriefing(accessToken, briefingId);
      setActiveId(briefingId);
      setDetail(data);
      setLocalOutline(data.outline);
      setSelectedSectionKey(data.outline[0]?.section_key ?? null);
      setLastSavedAt(null);
    } catch (err) {
      triggerToast(getApiErrorMessage(err));
    }
  };

  // Default to the most recently updated draft, matching the old design's
  // always-open builder - real data (whichever draft is newest), not a
  // fabricated default. `attemptedAutoOpen` guards against React
  // dev-mode's double-effect-invoke firing this twice - each open pays a
  // real, non-trivial cost (5 live Claude section-narrative calls).
  const attemptedAutoOpen = useRef(false);
  useEffect(() => {
    if (activeId || attemptedAutoOpen.current || briefings.length === 0) return;
    const mostRecentDraft = briefings.find((b) => b.status === "draft");
    if (mostRecentDraft) {
      attemptedAutoOpen.current = true;
      void openBriefing(mostRecentDraft.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefings]);

  const startFromTemplate = async (templateKey: string) => {
    if (!accessToken) return;
    const template = briefingTemplates.find((t) => t.key === templateKey);
    if (!template) return;
    setIsMutating(true);
    try {
      const title = `${template.title} · ${formatDate(new Date().toISOString())}`;
      const created = await createLeadershipBriefing(accessToken, { title, template_key: templateKey });
      setActiveId(created.id);
      setDetail(created);
      setLocalOutline(created.outline);
      setSelectedSectionKey(created.outline[0]?.section_key ?? null);
      setLastSavedAt(null);
      await refreshData();
    } catch (err) {
      triggerToast(getApiErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const saveDraft = async () => {
    if (!accessToken || !activeId) return;
    setIsMutating(true);
    try {
      const data = await updateLeadershipBriefing(accessToken, activeId, { outline: localOutline });
      setDetail(data);
      setLastSavedAt(new Date());
      await refreshData();
    } catch (err) {
      triggerToast(getApiErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const next = [...localOutline];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setLocalOutline(next);
  };

  const removeSection = (sectionKey: string) => {
    setLocalOutline((prev) => prev.filter((item) => item.section_key !== sectionKey));
    if (selectedSectionKey === sectionKey) setSelectedSectionKey(null);
  };

  const addSection = (sectionKey: string) => {
    setLocalOutline((prev) => [...prev, { section_key: sectionKey, title: SECTION_TITLES[sectionKey] }]);
    setShowAddSection(false);
  };

  const availableSectionKeys = Object.keys(SECTION_TITLES).filter(
    (key) => !localOutline.some((item) => item.section_key === key)
  );

  const outlineDirty = detail ? JSON.stringify(localOutline) !== JSON.stringify(detail.outline) : false;

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/5 dark:bg-[#0e1628]">Loading live briefings...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-300">{error}</div>;
  }

  const activeTemplateTitle = briefingTemplates.find((t) => t.key === detail?.template_key)?.title ?? detail?.template_key ?? "Custom";

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leadership · Briefings Builder</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Briefings</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Compose the executive briefing from a structured outline. Every section pulls from aggregate data only. Scope: Organization.
          </p>
          {lastSavedAt && <p className="mt-1 text-[10px] font-semibold text-emerald-500">Last saved: {formatTime(lastSavedAt)}</p>}
        </div>
        <div className="flex items-center gap-2">
          {detail?.status === "draft" && (
            <button
              onClick={saveDraft}
              disabled={isMutating || !outlineDirty}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-slate-800 cursor-pointer"
              type="button"
            >
              Save draft
            </button>
          )}
          {(detail?.status === "draft" || detail?.status === "ready") && (
            <button
              onClick={async () => {
                if (!accessToken || !activeId) return;
                setIsMutating(true);
                try {
                  await sendLeadershipBriefing(accessToken, activeId, detail?.recipient_roles?.length ? detail.recipient_roles : ["Leadership"]);
                  await openBriefing(activeId);
                  await refreshData("Briefing sent.");
                } catch (err) {
                  triggerToast(getApiErrorMessage(err));
                } finally {
                  setIsMutating(false);
                }
              }}
              disabled={isMutating || !activeId}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-color)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
              type="button"
            >
              <Send className="size-4" /> Send briefing
            </button>
          )}
          {detail?.status === "pending_review" && (
            <button
              onClick={async () => {
                if (!accessToken || !activeId) return;
                setIsMutating(true);
                try {
                  await markLeadershipBriefingReady(accessToken, activeId);
                  await openBriefing(activeId);
                  await refreshData("Briefing marked ready.");
                } catch (err) {
                  triggerToast(getApiErrorMessage(err));
                } finally {
                  setIsMutating(false);
                }
              }}
              disabled={isMutating}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
              type="button"
            >
              Mark ready
            </button>
          )}
          {detail?.status === "sent" && (
            <button
              onClick={async () => {
                if (!accessToken || !activeId) return;
                setIsMutating(true);
                try {
                  await archiveLeadershipBriefing(accessToken, activeId);
                  await openBriefing(activeId);
                  await refreshData("Briefing archived.");
                } catch (err) {
                  triggerToast(getApiErrorMessage(err));
                } finally {
                  setIsMutating(false);
                }
              }}
              disabled={isMutating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-slate-800 cursor-pointer"
              type="button"
            >
              <Archive className="size-3.5" /> Archive
            </button>
          )}
          {detail?.status === "draft" && (
            <button
              onClick={async () => {
                if (!accessToken || !activeId) return;
                setIsMutating(true);
                try {
                  await submitLeadershipBriefingForReview(accessToken, activeId);
                  await openBriefing(activeId);
                  await refreshData("Briefing submitted for review.");
                } catch (err) {
                  triggerToast(getApiErrorMessage(err));
                } finally {
                  setIsMutating(false);
                }
              }}
              disabled={isMutating}
              className="text-xs font-semibold text-slate-500 underline hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              type="button"
            >
              or submit for review
            </button>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl bg-[#101b22] p-4 text-slate-200">
        <Shield className="mt-0.5 size-4 shrink-0 text-[var(--brand-color)]" />
        <div>
          <p className="text-xs font-bold">Briefing content is aggregate only · k ≥ {cohortK} enforced</p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Briefings are generated from cohorts and never embed operator identifiers. Sections pull from aggregate trend, drivers, risk, and recommendations only.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Templates</p>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Start from a template</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {briefingTemplates.map((template) => {
            const isSelected = detail?.template_key === template.key && detail?.status === "draft";
            return (
              <button
                key={template.key}
                onClick={() => startFromTemplate(template.key)}
                disabled={isMutating}
                className={`rounded-2xl border p-5 text-left transition disabled:opacity-50 cursor-pointer ${
                  isSelected
                    ? "border-[var(--brand-color)] bg-[var(--brand-color)/5]"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-[#0e1628] dark:hover:bg-slate-900"
                }`}
                type="button"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">{template.title}</p>
                <p className="mt-2 text-xs text-slate-500">{template.sections.map((s) => SECTION_TITLES[s] ?? s).join(" · ")}</p>
                {isSelected && (
                  <span className="mt-3 inline-block rounded bg-[var(--brand-color)] px-2 py-0.5 text-[9px] font-bold uppercase text-white">Selected</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {detail ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-5">
            <CardHeader
              title="Outline"
              subtitle="Click a section to preview it"
              action={
                detail.status === "draft" && (
                  <button
                    onClick={() => setShowAddSection((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-bold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-slate-800 cursor-pointer"
                    type="button"
                  >
                    <Plus className="size-3" /> Add section
                  </button>
                )
              }
            />
            {showAddSection && (
              <div className="mb-3 space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-2 dark:border-white/5 dark:bg-slate-900/50">
                {availableSectionKeys.length === 0 && <p className="p-2 text-[10px] text-slate-400">All real section types are already in this outline.</p>}
                {availableSectionKeys.map((key) => (
                  <button
                    key={key}
                    onClick={() => addSection(key)}
                    className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                    type="button"
                  >
                    {SECTION_TITLES[key]}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {localOutline.map((item, index) => (
                <div
                  key={item.section_key}
                  onClick={() => setSelectedSectionKey(item.section_key)}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-3 text-xs transition ${
                    selectedSectionKey === item.section_key
                      ? "border-[var(--brand-color)] bg-[var(--brand-color)/5]"
                      : "border-slate-100 bg-slate-50 hover:bg-slate-100 dark:border-white/5 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {index + 1} · {item.title}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">
                      {(detail.generated_content[item.section_key] || "Not generated yet").slice(0, 70)}
                      {(detail.generated_content[item.section_key]?.length ?? 0) > 70 ? "…" : ""}
                    </p>
                  </div>
                  {selectedSectionKey === item.section_key ? (
                    <span className="shrink-0 rounded bg-[var(--brand-color)] px-2 py-0.5 text-[9px] font-bold uppercase text-white">Active</span>
                  ) : (
                    <span className="shrink-0 text-[9px] font-bold uppercase text-slate-400">Section</span>
                  )}
                  {detail.status === "draft" && (
                    <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => moveSection(index, -1)} disabled={index === 0} className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer" type="button">
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button onClick={() => moveSection(index, 1)} disabled={index === localOutline.length - 1} className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer" type="button">
                        <ChevronDown className="size-3.5" />
                      </button>
                      <button onClick={() => removeSection(item.section_key)} className="rounded p-1 text-slate-400 hover:text-rose-500 cursor-pointer" type="button">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {localOutline.length === 0 && <p className="py-6 text-center text-xs text-slate-400">No sections yet - use Add section above.</p>}
            </div>
          </Card>

          <Card className="lg:col-span-7">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Preview</p>
                <p className="text-[10px] text-slate-400">
                  Section {localOutline.findIndex((i) => i.section_key === selectedSectionKey) + 1 || "—"} of {localOutline.length} · {activeTemplateTitle} · aggregate view · cohort k = {cohortK}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${statusTone(detail.status)}`}>{detail.status}</span>
                <button
                  onClick={async () => {
                    if (!accessToken || !activeId) return;
                    setIsMutating(true);
                    try {
                      const blob = await downloadLeadershipBriefingPdf(accessToken, activeId);
                      downloadBlob(blob, `${activeId}.pdf`);
                    } catch (nextError) {
                      triggerToast(getApiErrorMessage(nextError));
                    } finally {
                      setIsMutating(false);
                    }
                  }}
                  disabled={isMutating}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-bold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-slate-800 cursor-pointer"
                  type="button"
                >
                  <Download className="size-3" /> PDF
                </button>
              </div>
            </div>

            {selectedSectionKey ? (
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{detail.title}</p>
                <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {detail.generated_content[selectedSectionKey] || "Content regenerates live while this briefing is a draft."}
                </p>
              </div>
            ) : (
              <p className="py-10 text-center text-xs text-slate-400">Click any outline item on the left to preview its content here.</p>
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <p className="py-10 text-center text-xs text-slate-400">Pick a template above to start a new briefing, or select one from the documents list below.</p>
        </Card>
      )}

      <Card>
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
                <tr key={briefing.id} className={briefing.id === activeId ? "bg-slate-50 dark:bg-slate-900/40" : ""}>
                  <td className="py-3 font-semibold text-slate-800 dark:text-white">{briefing.title}</td>
                  <td className="py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusTone(briefing.status)}`}>{briefing.status}</span></td>
                  <td className="py-3 text-slate-500">{briefing.recipient_roles?.length ? briefing.recipient_roles.join(", ") : "—"}</td>
                  <td className="py-3 text-slate-500">{formatDate(briefing.created_at, true)}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => void openBriefing(briefing.id)}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-[var(--brand-color)] hover:text-white dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                      type="button"
                    >
                      Open in builder
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
    </div>
  );
}

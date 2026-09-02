"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { formatAdminDate } from "@/features/admin/utils";
import {
  formatAdminApiError,
  createAdminScheduledExport,
  updateAdminScheduledExport,
} from "@/lib/admin-api";
import {
  useAdminStore,
  ConfirmationItem,
} from "@/store/admin-store";
import { AlertTriangle, Plus, XCircle } from "lucide-react";

function cadenceToApiValue(value: string) {
  if (value.toLowerCase().includes("quarter")) return "quarterly";
  if (value.toLowerCase().includes("annual")) return "annual";
  if (value.toLowerCase().includes("month")) return "monthly";
  return "weekly";
}

function cadenceToLabel(value: string) {
  switch (value) {
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "quarterly":
      return "Quarterly";
    case "annual":
      return "Annual";
    default:
      return value;
  }
}

function formatToApiValue(value: string) {
  return value.toLowerCase().includes("csv") ? "csv" : "pdf";
}

function formatToLabel(value: string) {
  return value.toUpperCase();
}

function inferReportType(scope: string) {
  if (scope.toLowerCase().includes("audit")) return "audit_log";
  if (scope.toLowerCase().includes("injury")) return "injury_trend";
  if (scope.toLowerCase().includes("readiness")) return "readiness_summary";
  return "aggregate_summary";
}

export function ExportsView({
  triggerToast = () => {},
}: {
  triggerToast?: (msg: string) => void;
}) {
  const adminStore = useAdminStore();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [showConfirmExportBar, setShowConfirmExportBar] = useState(false);
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
    const target = adminStore.scheduledExports.find((s) => s.id === id);
    if (target) {
      setEditingScheduleId(id);
      setScheduleForm({
        name: target.name,
        cadence: cadenceToLabel(target.cadence),
        scope: target.sensitivity_level,
        format: formatToLabel(target.export_format),
        recipients: target.recipient_role,
      });
    }
    setShowScheduleWizard(true);
    triggerToast("Configuring recurring schedule...");
  };

  const handleSubmitSchedule = async () => {
    if (!scheduleForm.name.trim() || !accessToken) return;

    const payload = {
      name: scheduleForm.name.trim(),
      report_type: inferReportType(scheduleForm.scope),
      export_format: formatToApiValue(scheduleForm.format),
      cadence: cadenceToApiValue(scheduleForm.cadence),
      recipient_role: scheduleForm.recipients.trim() || "DWS Admin",
    };

    if (editingScheduleId) {
      try {
        await updateAdminScheduledExport(accessToken, editingScheduleId, {
          name: payload.name,
          cadence: payload.cadence,
          export_format: payload.export_format,
          recipient_role: payload.recipient_role,
        });
      } catch (error) {
        triggerToast(formatAdminApiError(error));
        return;
      }

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
      try {
        await createAdminScheduledExport(accessToken, payload);
      } catch (error) {
        triggerToast(formatAdminApiError(error));
        return;
      }

      adminStore.addActivity({
        action: "Schedule added",
        actor: "Lead Admin",
        reason: `${scheduleForm.name} · ${scheduleForm.cadence} · ${scheduleForm.recipients}`,
        scope: "Admin · Exports",
        tag: "system",
        tagColor: "blue",
      });
      triggerToast(`Schedule added: ${scheduleForm.name}`);
    }

    await adminStore.initialize(accessToken);
    setShowScheduleWizard(false);
    setEditingScheduleId(null);
    setScheduleForm({ name: "", cadence: "Weekly · Mon 08:00", scope: "Kz-5", format: "PDF", recipients: "Wing CC + DPH" });
  };

  const handleConfirmSendExport = () => {
    setShowConfirmExportBar(false);
    triggerToast("PII secure export dispatched to 2nd reviewer.");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
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
                          onClick={() => triggerToast("Review pending request")}
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
            {adminStore.exportHistory.slice(0, 4).map((exp) => (
              <div key={exp.id} className="flex justify-between items-start gap-4">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-white">{exp.title || exp.report_type} · {exp.export_format.toUpperCase()}</p>
                  <p className="text-[10px] text-slate-400">
                    {exp.file_size_bytes ? `${(exp.file_size_bytes / 1024).toFixed(1)} KB` : "size pending"} · {exp.date_range || "current"} · {formatAdminDate(exp.created_at, true)}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold select-none ${
                  exp.export_log_status === "completed" || exp.export_log_status === "approved" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-100 text-slate-400"
                }`}>
                  {exp.export_log_status === "completed" || exp.export_log_status === "approved" ? "Sent" : "Draft"}
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
              {adminStore.scheduledExports.map((sch) => (
                <tr key={sch.id} className="align-middle">
                  <td className="py-3 font-bold text-slate-800 dark:text-white">{sch.name}</td>
                  <td className="py-3 text-slate-500 dark:text-slate-400">{cadenceToLabel(sch.cadence)}</td>
                  <td className="py-3">
                    <span className="px-1.5 py-0.5 bg-[var(--brand-color)/10] text-[var(--brand-color)] text-[9px] font-bold rounded">
                      {sch.sensitivity_level}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{formatToLabel(sch.export_format)}</td>
                  <td className="py-3 font-semibold">{formatAdminDate(sch.next_run_at, true)}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase select-none ${
                      sch.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-100 text-slate-400"
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

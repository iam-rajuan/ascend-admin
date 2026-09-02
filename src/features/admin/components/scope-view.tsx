"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import {
  useAdminStore,
  AdminStore,
} from "@/store/admin-store";
import { formatAdminDate } from "@/features/admin/utils";
import { Layers, AlertTriangle } from "lucide-react";

type DriverKey = keyof AdminStore["driverVisibility"];

export function ScopeView({
  triggerToast = () => {},
}: {
  triggerToast?: (msg: string) => void;
}) {
  const adminStore = useAdminStore();
  const accessToken = useAuthStore((state) => state.accessToken);
  const units = adminStore.orgUnits.length > 0 ? adminStore.orgUnits : [];
  const cohortSizes = [1, 5, 8, 12];
  const [scopeChanged, setScopeChanged] = useState(false);

  type CohortDeployment = {
    cohortId: string;
    unit: string;
    cohortSizeK: number;
    drivers: string[];
    at: string;
  };
  const [cohortDeployments, setCohortDeployments] = useState<CohortDeployment[]>([]);

  const handleUnitClick = (unit: { id: string; name: string }) => {
    adminStore.setSelectedScopeUnit(unit.name);
    adminStore.setSelectedScopeUnitId(unit.id);
    setScopeChanged(true);
    if (accessToken) {
      void adminStore.refreshScopeResolve(accessToken);
    }
  };

  const handleKClick = (k: number) => {
    adminStore.setCohortSizeK(k);
    setScopeChanged(true);
  };

  const handleDriverToggle = (driver: DriverKey) => {
    adminStore.toggleDriverVisibility(driver);
    setScopeChanged(true);
  };

  const handleSaveChange = async () => {
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

    if (!accessToken) {
      triggerToast("Your session expired. Please sign in again.");
      return;
    }

    const result = await adminStore.saveAdminScopeConfig(accessToken);
    if (!result.ok) {
      triggerToast(result.error || "Unable to save scope configuration.");
      return;
    }

    setScopeChanged(false);
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
    <div className="space-y-6 animate-fade-in pb-16">
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
                  key={unit.id}
                  onClick={() => handleUnitClick(unit)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    adminStore.selectedScopeUnitId === unit.id
                      ? "bg-[var(--brand-color)] text-white border-transparent"
                      : "bg-slate-50 dark:bg-[#070a13] border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {unit.name}
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
              <p className="text-[10px] text-slate-400">
                {adminStore.scopeResolution?.ancestor_path.map((item) => item.name).join(" · ") || "No live unit resolution loaded"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-white/5 space-y-1">
              <p className="text-slate-800 dark:text-slate-300 font-bold">Resolved members</p>
              <p className="text-[10px] text-slate-400">{adminStore.scopeResolution?.member_count_in_unit ?? 0} members in selected unit</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-white/5 space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase">PT/IM caseload</span>
              <p className="text-slate-800 dark:text-slate-300 font-bold">{adminStore.scopeResolution?.role_scope.caseload || "none"}</p>
              <p className="text-[10px] text-amber-500">Global: {adminStore.scopeResolution?.role_scope.global || "none"}</p>
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
              {adminStore.scopeMatrix.map((row, idx) => (
                <tr key={idx} className="align-middle">
                  <td className="py-3 font-bold text-slate-800 dark:text-white">{row.role}</td>
                  {(["self", "unit_visibility", "caseload", "opt_in", "aggregate_wing", "global"] as const).map((col) => {
                    const raw = String(row[col]);
                    const status = raw === "none" ? "-" : raw === "k>=5" ? "gated" : raw.startsWith("opt-in") ? "confirm" : raw === "active" ? "active" : raw;
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
              {adminStore.pathwayMatrix.map((row, idx) => (
                <tr key={idx} className="align-middle">
                  <td className="py-4 font-bold text-slate-800 dark:text-white">{row.pathway_key}</td>
                  <td className="py-4">
                    <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span> {row.approval.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span> {row.approval.enabled_at ? `Enabled · ${formatAdminDate(row.approval.enabled_at)}` : "Awaiting enablement"}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="flex items-center gap-1.5 text-emerald-500">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span> {row.staffing} staff · {row.active_opt_in_count} active
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="flex items-center gap-1.5 text-emerald-500">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span> {row.provider_assignment_model}
                    </span>
                  </td>
                  <td className="py-4 text-slate-500 dark:text-slate-400">{row.approval.access_policy || "Not set"}</td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 font-bold rounded">
                      {row.data_access}
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

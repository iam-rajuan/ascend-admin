"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import {
  useAdminStore,
  AdminStore,
  RoleCatalogItem,
  RbacMatrixRow,
} from "@/store/admin-store";
import { useUsersStore, type Person } from "@/store/users-store";
import { roles as roleDefinitions, type RoleId } from "@/lib/roles";
import { PersonFormModal } from "@/features/people/components/person-form-modal";
import { PersonProfileModal } from "@/features/people/components/person-profile-modal";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { Lock, AlertTriangle } from "lucide-react";

function formatQuestionRows(
  rows: Array<{ id: string; readiness_component: string; routing: string; direction: string }>,
) {
  return rows.map((row) => ({
    id: row.id,
    driver: row.readiness_component.replace(" Readiness", ""),
    direction: row.direction,
    routing: row.routing,
    validation: "Valid",
    highlight: row.id === "W5" || row.id === "M5",
  }));
}

export function RolesView({
  triggerToast = () => {},
}: {
  triggerToast?: (msg: string) => void;
}) {
  const router = useRouter();
  const adminStore = useAdminStore();
  const [rbacChanged, setRbacChanged] = useState(false);
  const [outcomesPage, setOutcomesPage] = useState(1);
  const [lastDeployAt, setLastDeployAt] = useState<string | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  const people = useUsersStore((state) => state.people);
  const setPersonStatus = useUsersStore((state) => state.setStatus);
  const adminResetPassword = useUsersStore((state) => state.adminResetPassword);
  const [peopleFilter, setPeopleFilter] = useState<RoleId | "All">("All");
  const [personModal, setPersonModal] = useState<{ mode: "add" | "edit"; person?: Person } | null>(null);
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null);
  const [resetResult, setResetResult] = useState<{ person: Person; emailed: boolean } | null>(null);
  const questionRegistry = adminStore.questionRegistry;
  const currentOutcomes = formatQuestionRows(
    (questionRegistry?.onboarding ?? []).slice(outcomesPage === 1 ? 0 : 10, outcomesPage === 1 ? 10 : 20),
  );
  const driversData = formatQuestionRows(questionRegistry?.daily ?? []);
  const weeklyData = formatQuestionRows(questionRegistry?.weekly ?? []);
  const monthlyData = formatQuestionRows(questionRegistry?.monthly ?? []);
  const activeQuestionVersion =
    questionRegistry?.current_version?.version_id ??
    adminStore.questionBankVersions.find((version) => !version.retired_date)?.version_id ??
    adminStore.questionBankVersions[0]?.version_id ??
    "No active version";

  const filteredPeople = people.filter((p) => peopleFilter === "All" || p.role === peopleFilter);

  const ROLE_LABEL_TO_ID: Partial<Record<string, RoleId>> = {
    SCS: "scs",
    "PT/IM": "pt-im",
    Nutritionist: "nutritionist",
    MP: "mp",
    "Purpose Coach": "pc",
    Plan: "plan",
    Leadership: "leadership",
    Admin: "admin",
  };

  const roleCategories = ["All", "Staff", "Contractor", "Officer", "System"];

  const filteredRoles = adminStore.rolesCatalog.filter((role: RoleCatalogItem) => {
    if (adminStore.rolesFilter === "All") return true;
    return role.category === adminStore.rolesFilter;
  });

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    adminStore.toggleRbacCell(rowIndex, colIndex);
    setRbacChanged(true);
  };

  const handleConfirmChanges = () => {
    setRbacChanged(false);
    const now = new Date();
    setLastDeployAt(now.toISOString());
    adminStore.addActivity({
      action: "RBAC rules deployed",
      actor: "Lead Admin",
      reason: "Override matrices committed to control plane",
      scope: "Admin · Roles & RBAC",
      tag: "system",
      tagColor: "blue",
    });
    triggerToast("RBAC rules and override matrices deployed.");
  };

  const renderRbacIcon = (state: RbacMatrixRow["states"][number]) => {
    switch (state) {
      case "active":
        return (
          <svg className="size-4 text-emerald-500 fill-current mx-auto" viewBox="0 0 16 16">
            <title>Full</title>
            <circle cx="8" cy="8" r="6" />
            <path d="M5.5 8l2 2 3.5-3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );
      case "conditional":
        return (
          <svg className="size-4 text-amber-500 mx-auto" viewBox="0 0 16 16">
            <title>Conditional (reason required)</title>
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 2a6 6 0 0 1 0 12V2z" fill="currentColor" />
          </svg>
        );
      case "gated":
        return (
          <svg className="size-4 text-red-500 mx-auto" viewBox="0 0 16 16">
            <title>Gated</title>
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 8H2a6 6 0 0 0 12 0H8z" fill="currentColor" />
          </svg>
        );
      case "locked":
      case "none":
      default:
        return (
          <svg className="size-4 text-slate-500 dark:text-slate-600 mx-auto" viewBox="0 0 16 16">
            <title>None</title>
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. Policy Alert box */}
      <div className="bg-[#1e293b]/20 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex gap-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        <Lock className="size-5 text-[var(--brand-color)] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800 dark:text-white">Rules & RBAC · security policy</span>
          <p className="mt-0.5">Every modification to standard role assignments must write to the control plane log. Device & override logic resolves in order of specificity.</p>
        </div>
      </div>

      {/* 2. Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 tracking-wider">ADMIN · ROLES & RBAC</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Roles & RBAC</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Role catalog, scope assignments, and device + context overrides. Code-coded scope: rules logic override hierarchy.
          </p>
          {lastDeployAt && (
            <p className="text-[10px] text-emerald-500 font-bold mt-1 font-mono">
              Last deploy: {new Date(lastDeployAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/admin/audit-log")}
            className="px-4 py-2 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Audit trail
          </button>
          <button
            onClick={() => {
              adminStore.addActivity({
                action: "Policy deploy",
                actor: "Lead Admin",
                reason: "RBAC matrix posted to control plane",
                scope: "Admin · Roles & RBAC",
                tag: "system",
                tagColor: "blue",
              });
              triggerToast("Deploying active policy definitions...");
            }}
            className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color)/95] text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
          >
            Post rules
          </button>
        </div>
      </div>

      {/* 2b. People Directory Section */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">People</h3>
            <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 text-[10px] font-bold rounded-full">
              {people.length} accounts
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={peopleFilter}
              onChange={(e) => setPeopleFilter(e.target.value as RoleId | "All")}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase border bg-slate-50 dark:bg-[#070a13] border-slate-200 dark:border-white/5 text-slate-500 cursor-pointer"
            >
              <option value="All">All roles</option>
              {roleDefinitions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setPersonModal({ mode: "add" })}
              className="px-3 py-1.5 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-lg text-[10px] font-bold uppercase tracking-wide cursor-pointer"
              type="button"
            >
              + Add person
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5">
                <th className="pb-3 font-semibold">NAME</th>
                <th className="pb-3 font-semibold">EMAIL</th>
                <th className="pb-3 font-semibold">ROLE</th>
                <th className="pb-3 font-semibold">UNIT</th>
                <th className="pb-3 font-semibold">STATUS</th>
                <th className="pb-3 font-semibold">LAST EDIT</th>
                <th className="pb-3 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredPeople.map((p) => (
                <tr key={p.id} className="align-middle">
                  <td className="py-3 font-bold text-slate-800 dark:text-white">{p.name}</td>
                  <td className="py-3 font-mono text-slate-500">{p.email}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold rounded text-[10px] uppercase">
                      {p.roleLabel}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{p.unit || "—"}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 font-semibold rounded text-[10px] ${
                        p.status === "active"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-rose-500/10 text-rose-500"
                      }`}
                    >
                      {p.status === "active" ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">{p.lastEdit}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => setViewingPerson(p)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-[var(--brand-color)] hover:text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      type="button"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPeople.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No people match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Role Catalog Card Section */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Role catalog</h3>
            <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 text-[10px] font-bold rounded-full">
              {adminStore.roleCatalogRaw.length} Active
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {roleCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => adminStore.setRolesFilter(cat)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase transition cursor-pointer border ${
                  adminStore.rolesFilter === cat
                    ? "bg-[var(--brand-color)] text-white border-transparent"
                    : "bg-slate-50 dark:bg-[#070a13] border-slate-200 dark:border-white/5 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5">
                <th className="pb-3 font-semibold">ROLE</th>
                <th className="pb-3 font-semibold">CATEGORY</th>
                <th className="pb-3 font-semibold">SCOPE</th>
                <th className="pb-3 font-semibold">ASSIGNED</th>
                <th className="pb-3 font-semibold">LAST EDIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredRoles.map((r: RoleCatalogItem) => {
                const mappedRoleId = ROLE_LABEL_TO_ID[r.role];
                const liveCount = mappedRoleId
                  ? people.filter((p) => p.role === mappedRoleId && p.status === "active").length
                  : null;
                return (
                  <tr key={r.id} className="align-middle">
                    <td className="py-3 font-bold text-slate-800 dark:text-white">{r.role}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold rounded text-[10px]">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-500">{r.scope}</td>
                    <td className="py-3">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {liveCount !== null ? liveCount : r.assigned}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{r.lastEdit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. RBAC Matrix Section */}
      <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">RBAC matrix · role & permission</h3>
            <div className="flex flex-wrap gap-4 text-[9px] font-medium text-slate-400 mt-1 select-none">
              <span className="flex items-center gap-1">
                <svg className="size-3 text-emerald-500 fill-current" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" />
                </svg>
                full
              </span>
              <span className="flex items-center gap-1">
                <svg className="size-3 text-amber-500" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <path d="M8 2a6 6 0 0 1 0 12V2z" fill="currentColor" />
                </svg>
                conditional (reason required)
              </span>
              <span className="flex items-center gap-1">
                <svg className="size-3 text-red-500" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <path d="M8 8H2a6 6 0 0 0 12 0H8z" fill="currentColor" />
                </svg>
                gated
              </span>
              <span className="flex items-center gap-1">
                <svg className="size-3 text-slate-500 dark:text-slate-600" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M5 8h6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                none
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-white/5">
                <th className="pb-3 font-semibold min-w-[200px]">PERMISSION</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">OPERATOR</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">SCS</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">PT/IM</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">MP</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">NUTR.</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">PURPOSE</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">PLAN</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">LEAD</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">ADMIN</th>
                <th className="pb-3 font-semibold text-center uppercase tracking-wider text-[9px]">IDMT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {adminStore.rbacMatrix.map((row: RbacMatrixRow, rIdx: number) => (
                <tr key={rIdx} className="align-middle hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 font-bold text-slate-800 dark:text-slate-200">{row.permission}</td>
                  {row.states.map((state: RbacMatrixRow["states"][number], cIdx: number) => (
                    <td
                      key={cIdx}
                      onClick={() => handleCellClick(rIdx, cIdx)}
                      className="py-3 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 rounded transition-colors"
                    >
                      {renderRbacIcon(state)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC CONFIRM BOTTOM BAR */}
      {rbacChanged && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a] text-white p-4 border-t border-slate-800 flex items-center justify-between z-40 animate-slide-up shadow-2xl">
          <div className="flex items-center gap-2 max-w-2xl">
            <AlertTriangle className="size-5 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-slate-300">
              This will affect 14 user records. RBAC role change requires 2nd reviewer sign-off.
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setRbacChanged(false);
                triggerToast("RBAC changes discarded.");
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmChanges}
              className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color)/90] text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer"
            >
              Confirm change
            </button>
          </div>
        </div>
      )}

      {personModal && (
        <PersonFormModal
          mode={personModal.mode}
          initial={personModal.person}
          onClose={() => setPersonModal(null)}
          onSaved={(msg) => triggerToast(msg)}
        />
      )}

      {viewingPerson && (
        <PersonProfileModal
          person={viewingPerson}
          onClose={() => setViewingPerson(null)}
          onEdit={() => {
            setPersonModal({ mode: "edit", person: viewingPerson });
            setViewingPerson(null);
          }}
          onResetPassword={() => {
            void (async () => {
              if (!accessToken) {
                triggerToast("Your session expired. Please sign in again.");
                return;
              }

              const result = await adminResetPassword(accessToken, viewingPerson.id);
              if (!result.ok) {
                triggerToast(result.error || "Unable to reset this password.");
                return;
              }

              setResetResult({ person: viewingPerson, emailed: result.emailed ?? true });
              setViewingPerson(null);
            })();
          }}
          onToggleStatus={() => {
            void (async () => {
              if (!accessToken) {
                triggerToast("Your session expired. Please sign in again.");
                return;
              }

              const next = viewingPerson.status === "active" ? "deactivated" : "active";
              const result = await setPersonStatus(accessToken, viewingPerson.id, next);
              if (!result.ok) {
                triggerToast(result.error || "Unable to update account status.");
                return;
              }

              triggerToast(`${viewingPerson.name} ${next === "active" ? "reactivated" : "deactivated"}.`);
              setViewingPerson(null);
            })();
          }}
        />
      )}

      {resetResult && (
        <AccessibleDialog
          open={!!resetResult}
          onClose={() => setResetResult(null)}
          titleId="password-reset-title"
          className="bg-white dark:bg-[#0e1628] rounded-2xl p-6 max-w-md w-full shadow-2xl"
        >
          <h3 id="password-reset-title" className="text-sm font-bold text-slate-800 dark:text-white">Password reset</h3>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Password reset completed for <span className="font-bold text-slate-700 dark:text-slate-200">{resetResult.person.name}</span>.
          </p>
          <p className="mt-3 rounded-lg bg-slate-100 dark:bg-[#070a13] px-4 py-3 text-center text-sm font-semibold text-slate-800 dark:text-white">
            {resetResult.emailed
              ? "The backend emailed the temporary password to the user."
              : "The backend completed the reset, but did not report an email status."}
          </p>
          <button
            onClick={() => setResetResult(null)}
            className="mt-4 w-full px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold cursor-pointer"
            type="button"
          >
            Done
          </button>
        </AccessibleDialog>
      )}
    </div>
  );
}

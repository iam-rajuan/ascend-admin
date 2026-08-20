"use client";

import { useState, type SubmitEvent } from "react";
import { X, RefreshCw } from "lucide-react";
import { roles as roleDefinitions } from "@/lib/roles";
import type { RoleId } from "@/lib/roles";
import { useUsersStore, type Person, type AccountStatus } from "@/store/users-store";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";

type PersonFormModalProps = {
  mode: "add" | "edit";
  initial?: Person;
  onClose: () => void;
  onSaved: (message: string) => void;
};

const genPassword = () => Math.random().toString(36).slice(-8);

export function PersonFormModal({ mode, initial, onClose, onSaved }: PersonFormModalProps) {
  const addPerson = useUsersStore((state) => state.addPerson);
  const updatePerson = useUsersStore((state) => state.updatePerson);
  const people = useUsersStore((state) => state.people);

  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState<RoleId>(initial?.role ?? "scs");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [status, setStatus] = useState<AccountStatus>(initial?.status ?? "active");
  const [password, setPassword] = useState(mode === "add" ? genPassword() : "");
  const [error, setError] = useState("");

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const duplicate = people.find(
      (p) => p.email === normalizedEmail && p.id !== initial?.id
    );
    if (duplicate) {
      setError("An account with this email already exists.");
      return;
    }

    if (mode === "add") {
      addPerson({ name, email, password, role, unit, status });
      onSaved(`${name} added and assigned to ${role.toUpperCase()}.`);
    } else if (initial) {
      updatePerson(initial.id, { name, email, role, unit, status });
      onSaved(`${name}'s account updated.`);
    }
    onClose();
  };

  return (
    <AccessibleDialog
      open
      onClose={onClose}
      titleId="person-form-title"
      className="bg-white dark:bg-[#0e1628] rounded-2xl p-6 max-w-md w-full shadow-2xl"
    >
        <div className="flex items-center justify-between mb-4">
          <h3 id="person-form-title" className="text-sm font-bold text-slate-800 dark:text-white">
            {mode === "add" ? "Add person" : "Edit person"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="person-name" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Name</label>
            <input
              id="person-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] px-3 py-2 text-sm text-slate-800 dark:text-white outline-none focus:border-[var(--brand-color)]"
              placeholder="Full name"
            />
          </div>
          <div>
            <label htmlFor="person-email" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</label>
            <input
              id="person-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] px-3 py-2 text-sm text-slate-800 dark:text-white outline-none focus:border-[var(--brand-color)]"
              placeholder="name@ascend.mil"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="person-role" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</label>
              <select
                id="person-role"
                value={role}
                onChange={(e) => setRole(e.target.value as RoleId)}
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] px-3 py-2 text-sm text-slate-800 dark:text-white outline-none focus:border-[var(--brand-color)]"
              >
                {roleDefinitions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="person-status" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</label>
              <select
                id="person-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AccountStatus)}
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] px-3 py-2 text-sm text-slate-800 dark:text-white outline-none focus:border-[var(--brand-color)]"
              >
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="person-unit" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Unit / team</label>
            <input
              id="person-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] px-3 py-2 text-sm text-slate-800 dark:text-white outline-none focus:border-[var(--brand-color)]"
              placeholder="e.g. 23rd SFS"
            />
          </div>

          {mode === "add" && (
            <div>
              <label htmlFor="person-password" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Initial password
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="person-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] px-3 py-2 text-sm font-mono text-slate-800 dark:text-white outline-none focus:border-[var(--brand-color)]"
                />
                <button
                  type="button"
                  onClick={() => setPassword(genPassword())}
                  className="flex-shrink-0 p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  title="Generate new password"
                  aria-label="Generate new password"
                >
                  <RefreshCw className="size-3.5" />
                </button>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">Share this with the person directly — it isn&apos;t emailed.</p>
            </div>
          )}

          {error && <p className="text-xs font-medium text-rose-500">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              {mode === "add" ? "Add person" : "Save changes"}
            </button>
          </div>
        </form>
    </AccessibleDialog>
  );
}

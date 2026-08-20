"use client";

import { X, Mail, UserRound, ShieldCheck, KeyRound, Pencil, Ban, CheckCircle2 } from "lucide-react";
import { getRoleName } from "@/lib/roles";
import { getInitials } from "@/lib/utils";
import type { Person } from "@/store/users-store";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";

type PersonProfileModalProps = {
  person: Person;
  onClose: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onToggleStatus: () => void;
};

export function PersonProfileModal({
  person,
  onClose,
  onEdit,
  onResetPassword,
  onToggleStatus,
}: PersonProfileModalProps) {
  return (
    <AccessibleDialog
      open
      onClose={onClose}
      titleId="person-profile-title"
      className="bg-white dark:bg-[#0e1628] rounded-2xl p-6 max-w-md w-full shadow-2xl"
    >
        <div className="flex items-center justify-between mb-4">
          <h3 id="person-profile-title" className="text-sm font-bold text-slate-800 dark:text-white">Person profile</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex size-12 items-center justify-center rounded-full bg-[var(--brand-color)/15] text-[var(--brand-color)] border border-[var(--brand-color)/25] text-sm font-bold">
            {getInitials(person.name)}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{person.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{getRoleName(person.role)}</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Mail className="size-3.5 text-slate-400" />
            {person.email}
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <UserRound className="size-3.5 text-slate-400" />
            {person.unit || "No unit assigned"}
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className={`size-3.5 ${person.status === "active" ? "text-emerald-500" : "text-rose-500"}`} />
            <span className={person.status === "active" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
              {person.status === "active" ? "Active" : "Deactivated"}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">Last edit · {person.lastEdit}</div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            type="button"
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
          <button
            onClick={onResetPassword}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            type="button"
          >
            <KeyRound className="size-3.5" />
            Reset password
          </button>
          <button
            onClick={onToggleStatus}
            className={`col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              person.status === "active"
                ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/30"
                : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/30"
            }`}
            type="button"
          >
            {person.status === "active" ? <Ban className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
            {person.status === "active" ? "Deactivate account" : "Reactivate account"}
          </button>
        </div>
    </AccessibleDialog>
  );
}

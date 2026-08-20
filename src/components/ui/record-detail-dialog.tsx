"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";

export type DetailField = {
  label: string;
  value: ReactNode;
};

type RecordDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** e.g. a PopulationScopeBadge or PrivacyStateBadge rendered next to the title. */
  badge?: ReactNode;
  fields: DetailField[];
  /** Extra content below the field grid — a sub-table, notes list, timeline, etc. */
  children?: ReactNode;
  /** Footer action buttons; defaults to just a Close button when omitted. */
  actions?: ReactNode;
};

// Generic "open a record's detail" dialog — the fix for every "Open"/"View"/
// "Preview" button across the dashboards that used to only fire a toast.
// The calling page already has the row's fields in scope (it's rendered in
// the table), so this is just "pass those fields in," not new data-fetching.
export function RecordDetailDialog({
  open,
  onClose,
  title,
  subtitle,
  badge,
  fields,
  children,
  actions,
}: RecordDetailDialogProps) {
  return (
    <AccessibleDialog
      open={open}
      onClose={onClose}
      titleId="record-detail-title"
      className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          {badge}
          <h3 id="record-detail-title" className="text-base font-bold text-slate-800 dark:text-white">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          type="button"
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer flex-shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      {fields.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-white/5 space-y-3 font-mono text-xs">
          {fields.map((field, idx) => (
            <div key={idx} className="flex justify-between gap-4">
              <span className="text-slate-400 uppercase text-[9px] font-bold flex-shrink-0">{field.label}</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold text-right">{field.value}</span>
            </div>
          ))}
        </div>
      )}

      {children}

      <div className="flex gap-3 pt-2">
        {actions ?? (
          <button
            onClick={onClose}
            type="button"
            className="flex-1 py-2 px-4 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        )}
      </div>
    </AccessibleDialog>
  );
}

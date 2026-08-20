"use client";

import { useId, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";

export type CreateField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "date";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
};

type CreateRecordModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fields: CreateField[];
  /** Called with { [field.name]: value } once every required field is filled. */
  onSubmit: (values: Record<string, string>) => void;
  submitLabel?: string;
  /** Extra content rendered below the field list, above the actions. */
  children?: ReactNode;
};

// Generic "create a new record" form modal — the fix for every "New X"/"Add X"
// button across the dashboards that used to only fire a toast. Mirrors
// RecordDetailDialog's visual language and AccessibleDialog foundation.
export function CreateRecordModal({
  open,
  onClose,
  title,
  subtitle,
  fields,
  onSubmit,
  submitLabel = "Create",
  children,
}: CreateRecordModalProps) {
  const titleId = useId();
  const [values, setValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);

  const getValue = (field: CreateField) => values[field.name] ?? field.defaultValue ?? "";

  const missingRequired = fields.some((f) => f.required && !getValue(f).trim());

  const handleClose = () => {
    setValues({});
    setTouched(false);
    onClose();
  };

  const handleSubmit = () => {
    setTouched(true);
    if (missingRequired) return;
    const resolved: Record<string, string> = {};
    for (const f of fields) resolved[f.name] = getValue(f);
    onSubmit(resolved);
    setValues({});
    setTouched(false);
  };

  return (
    <AccessibleDialog
      open={open}
      onClose={handleClose}
      titleId={titleId}
      className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 id={titleId} className="text-base font-bold text-slate-800 dark:text-white">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        <button
          onClick={handleClose}
          aria-label="Close"
          type="button"
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer flex-shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      {fields.length > 0 && (
        <div className="space-y-4">
          {fields.map((field) => {
            const value = getValue(field);
            const showError = touched && field.required && !value.trim();
            const fieldId = `${titleId}-${field.name}`;
            return (
              <div key={field.name} className="space-y-1.5">
                <label
                  htmlFor={fieldId}
                  className="text-[10px] uppercase font-bold tracking-wide text-slate-400"
                >
                  {field.label}
                  {field.required && <span className="text-rose-500"> *</span>}
                </label>

                {field.type === "textarea" ? (
                  <textarea
                    id={fieldId}
                    value={value}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                  />
                ) : field.type === "select" ? (
                  <select
                    id={fieldId}
                    value={value}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={fieldId}
                    type={field.type === "date" ? "date" : "text"}
                    value={value}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                  />
                )}

                {showError && (
                  <p className="text-[10px] text-rose-500 font-semibold">{field.label} is required.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {children}

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleClose}
          type="button"
          className="flex-1 py-2 px-4 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          type="button"
          className="flex-1 py-2 px-4 bg-[var(--brand-color)] hover:opacity-90 text-white rounded-xl text-xs font-bold transition cursor-pointer"
        >
          {submitLabel}
        </button>
      </div>
    </AccessibleDialog>
  );
}

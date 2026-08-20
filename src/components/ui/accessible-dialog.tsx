"use client";

import { useEffect, useRef, type ReactNode } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type AccessibleDialogProps = {
  open: boolean;
  onClose: () => void;
  /** id of the element that labels the dialog (usually its heading). */
  titleId?: string;
  /** id of the element that describes the dialog, if any. */
  descriptionId?: string;
  children: ReactNode;
  /** Overrides the default centered-panel styling. */
  className?: string;
  overlayClassName?: string;
};

const DEFAULT_OVERLAY_CLASSES =
  "fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in";
const DEFAULT_PANEL_CLASSES =
  "bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6";

// Accessible modal wrapper: role="dialog" + aria-modal, focus trap while
// open, Escape-to-close, click-outside-to-close, and focus restoration to
// the element that opened it. Replaces the plain `fixed inset-0` divs
// previously used for confirmation dialogs across the dashboards.
export function AccessibleDialog({
  open,
  onClose,
  titleId,
  descriptionId,
  children,
  className,
  overlayClassName,
}: AccessibleDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable?.[0] ?? panel)?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={overlayClassName ?? DEFAULT_OVERLAY_CLASSES}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={className ?? DEFAULT_PANEL_CLASSES}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

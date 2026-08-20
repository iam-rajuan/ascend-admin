import type { ReactNode } from "react";
import { Users, Shield } from "lucide-react";
import { POPULATION_LEVELS } from "@/lib/terminology";

type PopulationLevel = (typeof POPULATION_LEVELS)[keyof typeof POPULATION_LEVELS];

type PopulationScopeBadgeProps = {
  level: PopulationLevel;
  /** Extra qualifier shown after the level, e.g. "k≥5" or "last 12 months". */
  detail?: string;
  className?: string;
};

// Population-level scope badge (Req 6) — every card/chart/table/detail
// view must declare which population level its data represents, visible
// near the title or active filters. Modeled on the rounded-icon pattern
// already used in pt-im/page.tsx and the "COHORT DETAIL · k≥5" pill used
// in nutritionist/page.tsx and leadership/page.tsx.
export function PopulationScopeBadge({ level, detail, className }: PopulationScopeBadgeProps) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[8px] font-bold font-mono uppercase tracking-wider bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 inline-flex items-center gap-1 ${className ?? ""}`}
    >
      <Users className="size-2.5" />
      {level}
      {detail ? ` · ${detail}` : ""}
    </span>
  );
}

type AggregateOnlyFooterProps = {
  /** Defaults to the standard leadership copy; override for a role-specific reason. */
  children?: ReactNode;
};

// Repeats leadership/page.tsx's aggregate-only footer copy (Req 6) so any
// dashboard that only ever shows aggregate/cohort data — never individual
// drill-down — can adopt the identical, already-approved wording instead
// of writing new copy per page.
export function AggregateOnlyFooter({ children }: AggregateOnlyFooterProps) {
  return (
    <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-400 dark:text-slate-500">
      <Shield className="size-3 flex-shrink-0" />
      {children ?? "Aggregate-only · no individual drill-down · no individual exports · UI gate §7.5"}
    </div>
  );
}

import { Shield, Lock, ShieldOff, ShieldQuestion, ShieldCheck } from "lucide-react";
import { PRIVACY_STATES, PERSON_TERM, type PrivacyState } from "@/lib/terminology";

// Privacy state -> visual treatment. All PRIVACY_STATES values must be
// representable and must never render blank (a reason is always shown).
export const PRIVACY_STATE_STYLES: Record<PrivacyState, { badge: string; icon: "shield" | "lock" | "question" | "off" | "check" }> = {
  [PRIVACY_STATES.RESTRICTED]: { badge: "bg-[var(--brand-color)/10] text-[var(--brand-color)]", icon: "shield" },
  [PRIVACY_STATES.AUTH_REQUIRED]: { badge: "bg-amber-500/10 text-amber-500", icon: "question" },
  [PRIVACY_STATES.ACCESS_EXPIRED]: { badge: "bg-slate-200 dark:bg-slate-800 text-slate-500", icon: "lock" },
  [PRIVACY_STATES.CONSENT_REQUIRED]: { badge: "bg-sky-500/10 text-sky-500", icon: "question" },
  [PRIVACY_STATES.CONSENT_GRANTED]: { badge: "bg-emerald-500/10 text-emerald-500", icon: "check" },
  [PRIVACY_STATES.CONSENT_WITHDRAWN]: { badge: "bg-rose-500/10 text-rose-500", icon: "off" },
  [PRIVACY_STATES.ACCESS_DENIED]: { badge: "bg-rose-500/10 text-rose-500", icon: "off" },
};

// Default reason shown alongside every privacy-state badge — never blank.
// Callers can override individual entries via the `reasonOverrides` prop
// on PrivacyStateBadge instead of forking this map.
export const PRIVACY_STATE_REASON: Record<PrivacyState, string> = {
  [PRIVACY_STATES.RESTRICTED]: "Minimum-necessary access only — role-scoped view.",
  [PRIVACY_STATES.AUTH_REQUIRED]: "Authorizing specialist has not yet approved this request.",
  [PRIVACY_STATES.ACCESS_EXPIRED]: "Prior authorization window closed — re-request required.",
  [PRIVACY_STATES.CONSENT_REQUIRED]: `${PERSON_TERM} consent on file has not been captured for this record.`,
  [PRIVACY_STATES.CONSENT_GRANTED]: `${PERSON_TERM} has opted in — visibility active per recorded scope.`,
  [PRIVACY_STATES.CONSENT_WITHDRAWN]: `${PERSON_TERM} withdrew consent — record locked pending review.`,
  [PRIVACY_STATES.ACCESS_DENIED]: "Outside assigned caseload — access denied and logged.",
};

export function getPrivacyReason(
  state: PrivacyState,
  reasonOverrides?: Partial<Record<PrivacyState, string>>
) {
  return reasonOverrides?.[state] ?? PRIVACY_STATE_REASON[state] ?? PRIVACY_STATE_REASON[PRIVACY_STATES.RESTRICTED];
}

type PrivacyStateBadgeProps = {
  state: PrivacyState;
  /** Per-page overrides for the default reason text (e.g. a role-specific explanation). */
  reasonOverrides?: Partial<Record<PrivacyState, string>>;
  /** When true, renders the reason text beneath the badge instead of leaving it to the caller. */
  showReason?: boolean;
  className?: string;
};

export function PrivacyStateBadge({ state, reasonOverrides, showReason, className }: PrivacyStateBadgeProps) {
  const style = PRIVACY_STATE_STYLES[state] ?? PRIVACY_STATE_STYLES[PRIVACY_STATES.RESTRICTED];
  const badge = (
    <span
      className={`px-2 py-0.5 rounded text-[8px] font-bold font-sans uppercase inline-flex items-center gap-1 ${style.badge} ${className ?? ""}`}
    >
      {style.icon === "shield" && <Shield className="size-2.5" />}
      {style.icon === "lock" && <Lock className="size-2.5" />}
      {style.icon === "off" && <ShieldOff className="size-2.5" />}
      {style.icon === "check" && <ShieldCheck className="size-2.5" />}
      {style.icon === "question" && <ShieldQuestion className="size-2.5" />}
      {state}
    </span>
  );

  if (!showReason) return badge;

  return (
    <div className="flex flex-col gap-0.5">
      {badge}
      <span className="text-[8px] text-slate-400 leading-tight max-w-[220px]">
        {getPrivacyReason(state, reasonOverrides)}
      </span>
    </div>
  );
}

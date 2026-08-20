// =============================================================
// ASCEND — APPROVED TERMINOLOGY GLOSSARY
// Single source of truth for all dashboard labels, statuses,
// role names, case types, population levels, and privacy states.
// =============================================================

// ----------------------------------------------------------------
// ROLE NAMES (one approved term per role)
// ----------------------------------------------------------------
export const ROLES = {
  ADMIN: "Admin",
  LEAD_ADMIN: "Lead Admin",
  OPERATOR: "Operator",
  SCS: "SCS",
  PT_IM: "PT/IM",
  MP: "MP",
  NUTRITIONIST: "Nutritionist",
  PURPOSE_COACH: "Purpose Coach",
  PLAN: "Plan",
  LEADERSHIP: "Leadership",
  IDMT: "IDMT",
} as const;

export type RoleKey = (typeof ROLES)[keyof typeof ROLES];

// ----------------------------------------------------------------
// READINESS CATEGORIES
// ----------------------------------------------------------------
export const READINESS_CATEGORIES = {
  OWN: "Own",
  FLIGHT: "Flight",
  CASELOAD: "Caseload",
  GLOBAL: "Global",
} as const;

// ----------------------------------------------------------------
// PERSON TERM (Req 1 — one approved term for the tracked person,
// used everywhere instead of "Soldier"/"Patient"/generic "user")
// ----------------------------------------------------------------
export const PERSON_TERM = "Airman";

// ----------------------------------------------------------------
// POPULATION LEVELS (Req 6 — every view must show one)
// ----------------------------------------------------------------
export const POPULATION_LEVELS = {
  INDIVIDUAL: `Individual ${PERSON_TERM}`,
  CASELOAD: "Assigned Caseload",
  COHORT: "Cohort",
  UNIT: "Unit",
  ORGANIZATION: "Organization",
} as const;

// ----------------------------------------------------------------
// PRIVACY STATES (Req 7 — consistent everywhere, never blank)
// ----------------------------------------------------------------
export const PRIVACY_STATES = {
  RESTRICTED: "Restricted",
  AUTH_REQUIRED: "Authorization Required",
  ACCESS_EXPIRED: "Access Expired",
  CONSENT_REQUIRED: "Consent Required",
  CONSENT_GRANTED: "Opted In",
  CONSENT_WITHDRAWN: "Consent Withdrawn",
  ACCESS_DENIED: "Access Denied",
} as const;

export type PrivacyState =
  (typeof PRIVACY_STATES)[keyof typeof PRIVACY_STATES];

// ----------------------------------------------------------------
// WORKFLOW STATUSES — ALERTS
// ----------------------------------------------------------------
export const ALERT_STATUSES = {
  NEW: "New",
  ACKNOWLEDGED: "Acknowledged",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  ESCALATED: "Escalated",
} as const;

// ----------------------------------------------------------------
// WORKFLOW STATUSES — PERFORMANCE PLANS
// ----------------------------------------------------------------
export const PLAN_STATUSES = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
} as const;

// ----------------------------------------------------------------
// WORKFLOW STATUSES — SPECIALIST FOLLOW-UPS
// ----------------------------------------------------------------
export const FOLLOW_UP_STATUSES = {
  ASSIGNED: "Assigned",
  DUE: "Due",
  OVERDUE: "Overdue",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

// ----------------------------------------------------------------
// WORKFLOW STATUSES — REHABILITATION CASES
// ----------------------------------------------------------------
export const REHAB_STATUSES = {
  OPEN: "Open",
  IN_REHAB: "In Rehabilitation",
  COORDINATING: "Coordinating",
  CLEARED: "Cleared",
  CLOSED: "Closed",
} as const;

// ----------------------------------------------------------------
// WORKFLOW STATUSES — SUPPORT REQUESTS
// ----------------------------------------------------------------
export const SUPPORT_REQUEST_STATUSES = {
  NEW: "New",
  REVIEWING: "Reviewing",
  ACTION_NEEDED: "Action Needed",
  RESOLVED: "Resolved",
} as const;

// ----------------------------------------------------------------
// CASE TYPES
// ----------------------------------------------------------------
export const CASE_TYPES = {
  INJURY: "Injury",
  RECOVERY: "Recovery",
  PERFORMANCE: "Performance",
  MEDICAL: "Medical",
  REHABILITATION: "Rehabilitation",
} as const;

// ----------------------------------------------------------------
// ALERT TYPES
// ----------------------------------------------------------------
export const ALERT_TYPES = {
  READINESS_DROP: "Readiness Drop",
  FOLLOW_UP_DUE: "Follow-up Due",
  OVERDUE_ACTION: "Overdue Action",
  NEW_ASSIGNMENT: "New Assignment",
  UNREAD_MESSAGE: "Unread Communication",
  PLAN_REVIEW: "Plan Review Needed",
} as const;

// ----------------------------------------------------------------
// SKILL/PLAN TYPES
// ----------------------------------------------------------------
export const PLAN_TYPES = {
  REHAB_BLOCK: "Rehab Block",
  PERFORMANCE: "Performance",
  CONDITIONING: "Conditioning",
  HYDRATION: "Hydration",
  NUTRITION: "Nutrition",
  PRE_HAB: "Pre-hab",
} as const;

// ----------------------------------------------------------------
// RISK LEVELS
// ----------------------------------------------------------------
export const RISK_LEVELS = ["L1", "L2", "L3", "L4"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

// ----------------------------------------------------------------
// AUDIT TAG TYPES
// ----------------------------------------------------------------
export const AUDIT_TAGS = ["logged", "system", "review", "gated"] as const;
export type AuditTag = (typeof AUDIT_TAGS)[number];

// ----------------------------------------------------------------
// RBAC PERMISSION STATES (admin-store.ts aligned)
// ----------------------------------------------------------------
export const RBAC_STATES = {
  ACTIVE: "active",
  CONDITIONAL: "conditional",
  GATED: "gated",
  LOCKED: "locked",
  NONE: "none",
} as const;
export type RbacState = (typeof RBAC_STATES)[keyof typeof RBAC_STATES];

// ----------------------------------------------------------------
// SERVICE STATUS
// ----------------------------------------------------------------
export const SERVICE_STATUS = {
  ONLINE: "Online",
  DEGRADED: "Degraded",
  OFFLINE: "Offline",
} as const;

// ----------------------------------------------------------------
// DEVICE OVERIDE STATUS
// ----------------------------------------------------------------
export const DEVICE_STATUS = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  HANDSHAKE: "Handshake",
  SECURE: "Secure",
  UNSYNCED: "Unsynced",
} as const;

// ----------------------------------------------------------------
// WORKFLOW STATUSES — AUDIT / COMPLIANCE / EXPORT REQUESTS (Admin)
// ----------------------------------------------------------------
export const REPORT_STATUSES = {
  OPEN: "Open",
  APPROVED: "Approved",
  PASS: "Pass",
  CONSENTED: "Consented",
  PENDING_LINK: "Pending Link",
  ACTIVE: "Active",
  PAUSED: "Paused",
} as const;

// ----------------------------------------------------------------
// WORKFLOW STATUSES — LEADERSHIP BRIEFINGS
// Reuses PLAN_STATUSES wording where the concept overlaps (Draft,
// Pending Review) instead of inventing synonyms.
// ----------------------------------------------------------------
export const BRIEFING_STATUSES = {
  DRAFT: PLAN_STATUSES.DRAFT,
  PENDING_REVIEW: PLAN_STATUSES.PENDING_REVIEW,
  READY: "Ready",
  SENT: "Sent",
  ARCHIVED: PLAN_STATUSES.ARCHIVED,
} as const;

// ----------------------------------------------------------------
// PLAN HEALTH (progress/trend indicator — kept separate from
// PLAN_STATUSES, which is the true lifecycle state, so a plan can
// show both without conflating "what stage" with "how it's going")
// ----------------------------------------------------------------
export const PLAN_HEALTH = {
  ON_TRACK: "On Track",
  RAMPING: "Ramping",
  WATCH: "Watch",
  CLEARED: "Cleared",
} as const;

// ----------------------------------------------------------------
// WORKOUT STATUSES (SCS)
// ----------------------------------------------------------------
export const WORKOUT_STATUSES = {
  DONE: "Done",
  MODIFIED: "Modified",
  SKIPPED: "Skipped",
} as const;

// ----------------------------------------------------------------
// REVIEW STATUS (SCS/PT-IM coordination — single wording, no
// singular/plural drift like "PT/IM review" vs "PT/IM reviews")
// ----------------------------------------------------------------
export const REVIEW_STATUS = {
  PENDING: "PT/IM Review Pending",
  REVIEWED: "PT/IM Reviewed",
} as const;

// ----------------------------------------------------------------
// RECORD STATUSES (specialist notes/records — MP, others)
// ----------------------------------------------------------------
export const RECORD_STATUSES = {
  DRAFT: "Draft",
  SIGNED: "Signed",
} as const;

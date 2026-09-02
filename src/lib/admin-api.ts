import { env } from "@/lib/env";
import { StaffApiError, getApiErrorMessage } from "@/lib/staff-api";
import { useAuthStore } from "@/store/auth-store";

const NGROK_HEADERS = {
  "ngrok-skip-browser-warning": "1",
};

type ApiEnvelope<T> = {
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
};

export type AdminUserRecord = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  unit_id: string | null;
  is_active: boolean;
  is_verified: boolean;
  access_expires_at?: string | null;
  created_at?: string | null;
  last_edit_at?: string | null;
};

export type AdminUsersResponse = {
  users: AdminUserRecord[];
};

export type AdminCreateUserPayload = {
  full_name: string;
  email: string;
  role: string;
  unit_id?: string | null;
  is_active?: boolean;
  initial_password?: string;
};

export type AdminCreateUserResponse = AdminUserRecord & {
  initial_password?: string | null;
};

export type AdminConfirmation = {
  id: string;
  action_type: string;
  status: string;
  requested_by: string | null;
  requested_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  target_entity_type: string | null;
  target_entity_id: string | null;
  target_summary: string | null;
  consequence_summary: string | null;
  scope_summary: string | null;
  payload?: Record<string, unknown> | null;
  executed_at?: string | null;
  reverted_at?: string | null;
  reverted_by?: string | null;
  risk_tier?: string | null;
};

export type AdminAuditEntry = {
  id: string;
  event_type: string;
  actor_id: string | null;
  actor_role: string | null;
  target_entity_type: string | null;
  target_entity_id: string | null;
  summary_message: string;
  metadata_payload?: Record<string, unknown> | null;
  outcome_status?: string | null;
  created_at: string;
};

export type AdminAuditStats = {
  count_24h: number;
  count_7d: number;
  percent_vs_7d_avg: number;
  record_access_count_24h: number;
  destructive_action_total_count: number;
  destructive_action_pending_review_count: number;
  retention_years: number;
};

export type AdminAuditRollupCategory = {
  category: string;
  last_24h: number;
  last_7d: number;
  last_30d: number;
};

export type AdminRoleCatalogEntry = {
  role: string;
  cluster: "Staff" | "Contractor" | "Officer" | "System";
  scope: string;
  member_count: number;
  last_edit: string | null;
  audit_entry_count: number;
  is_real_role: boolean;
};

export type AdminRoleCatalogResponse = {
  role_count: number;
  roles: AdminRoleCatalogEntry[];
  purpose_consent?: {
    active_count: number;
    withdrawn_count: number;
  };
};

export type AdminAccountsOnboardingSummary = {
  account_status: {
    active_count: number;
    expired_count: number;
    total_count: number;
  };
  onboarding: {
    in_flight_count: number;
    awaiting_role_confirmation_count: number;
  };
  access_expiration: {
    expiring_soon_30d_count: number;
    expired_count: number;
    renewal_note: string;
  };
  assigned_providers: {
    always_available_pathways: string[];
  };
  effective_permissions: {
    note: string;
  };
  purpose_consent: {
    active_count: number;
    withdrawn_count: number;
  };
};

export type AdminRbacMatrixResponse = {
  roles: string[];
  columns: Array<{
    key: string;
    label: string;
    role: string | null;
  }>;
  matrix: Array<{
    capability: string;
    roles: Record<string, "full" | "conditional" | "gated" | "none">;
    enforced: Record<string, string>;
  }>;
  divergences: Array<{
    capability: string;
    column: string;
    declared: string;
    enforced: string;
  }>;
  divergence_count: number;
};

export type AdminQuestionRegistryEntry = {
  question_id: string;
  readiness_component: string;
  routing: string;
  direction: string;
};

export type AdminQuestionRegistryResponse = {
  total_questions: number;
  onboarding: Array<{
    id: string;
    readiness_component: string;
    routing: string;
    direction: string;
  }>;
  daily: Array<{
    id: string;
    readiness_component: string;
    routing: string;
    direction: string;
  }>;
  weekly: Array<{
    id: string;
    readiness_component: string;
    routing: string;
    direction: string;
  }>;
  monthly: Array<{
    id: string;
    readiness_component: string;
    routing: string;
    direction: string;
  }>;
  current_version?: {
    id: string;
    version_id: string;
    effective_date?: string | null;
    retired_date?: string | null;
    change_reason?: string | null;
  } | null;
};

export type AdminQuestionBankVersion = {
  id: string;
  version_id: string;
  effective_date?: string | null;
  retired_date?: string | null;
  approved_by?: string | null;
  change_reason?: string | null;
};

export type AdminScopeConfig = {
  role: string;
  cohort_k: number;
  visible_components: string[];
  is_default?: boolean;
};

export type AdminScopeMatrixRow = {
  role: string;
  self: number;
  unit_visibility: string;
  caseload: string;
  opt_in: string;
  aggregate_wing: string;
  global: string;
};

export type AdminScopeResolveResponse = {
  role: string;
  unit_id: string;
  ancestor_path: Array<{
    id: string;
    name: string;
    unit_type: string;
  }>;
  member_count_in_unit: number;
  role_scope: AdminScopeMatrixRow;
};

export type AdminPathwayMatrixEntry = {
  pathway_key: string;
  label: string;
  staffing: number;
  active_opt_in_count: number;
  provider_assignment_model: string;
  data_access: string;
  approval: {
    pathway_key: string;
    status: string;
    approved_by: string | null;
    approved_at: string | null;
    enabled_by: string | null;
    enabled_at: string | null;
    access_policy: string | null;
  };
};

export type AdminExportsOverview = {
  pending_confirmations: AdminConfirmation[];
  recent_exports: AdminExportRecord[];
  schedules: AdminScheduledExport[];
  available_reports: Array<{
    report_type: string;
    sensitivity_level: string;
    last_generated_at: string | null;
  }>;
};

export type AdminRequiredContractReport = {
  report_type: string;
  docx_name: string;
  required_sections: string;
  primary_users: string;
  last_generated_at: string | null;
  last_export_id: string | null;
  last_export_status: string | null;
  ever_generated: boolean;
};

export type AdminScheduledExport = {
  id: string;
  name: string;
  report_type: string;
  export_format: string;
  cadence: string;
  recipient_role: string;
  sensitivity_level: string;
  status: string;
  next_run_at: string | null;
  created_by: string | null;
};

export type AdminExportRecord = {
  id: string;
  report_type: string;
  date_range: string | null;
  generated_by: string | null;
  recipient_role: string | null;
  export_format: string;
  sensitivity_level: string;
  export_log_status: string;
  lifecycle_status: string;
  title: string | null;
  flight_id: string | null;
  file_size_bytes: number | null;
  created_at: string;
  risk_tier?: string | null;
};

export type AdminSystemOverview = {
  system_health: {
    percentage: number;
    label: string;
    window_days: number;
  };
  question_bank: {
    total_questions: number;
  };
  threshold_rules: {
    cohort_minimum_k: number;
    l2_drop_points: number;
    l3_drop_points: number;
    l4_drop_points: number;
    export_approval_window_hours: number;
    deactivation_grace_days: number;
    confidence_rule: string;
  };
  reverse_scoring_status: string;
  deactivation_queue: {
    admin_initiated_pending: AdminConfirmation[];
    self_service_pending: Array<{
      id: string;
      user_id: string;
      user_name: string;
      reason: string;
      status: string;
      requested_at: string;
      reviewed_at: string | null;
    }>;
  };
  inactive_accounts_count: number;
  rsd_coverage: {
    year: number;
    total_rsd_hours: number;
    session_count: number;
  };
  privacy_cohort_suppression: {
    leadership_k: number;
  };
  active_sessions: {
    window_minutes: number;
    total: number;
    staff: number;
    admin: number;
    imt: number;
  };
  pending_transmission_count: number;
};

export type AdminSystemDiagnostics = {
  database: {
    status: string;
    latency_ms: number;
  };
  scheduler_jobs: Array<{
    job_name: string;
    last_run_status: string;
    last_run_at: string | null;
  }>;
  ai_provider_configured: boolean;
};

export type AdminOrgUnit = {
  id: string;
  name: string;
  unit_type: string;
  parent_id: string | null;
  ancestor_path: string[];
};

export type AdminCredential = {
  id: string;
  provider_id: string;
  provider_name: string;
  credential_type: string;
  issuing_body: string | null;
  issued_date: string | null;
  expiration_date: string | null;
  status: string;
};

export type AdminEquipmentGap = {
  id: string;
  item: string;
  supply_need: string;
  priority: string;
  requested_by_name: string;
  date_identified: string;
  status: string;
  included_in_report: boolean;
};

export type AdminUtilizationEvent = {
  id: string;
  event_type: string;
  opportunity_offered: string;
  actual_use: boolean;
  event_date: string;
  staff_lead_name: string | null;
  attendance_count: number | null;
  notes: string | null;
};

export type AdminCoverageLog = {
  id: string;
  provider_id: string;
  role: string;
  hours: number;
  coverage_date: string;
  is_weekend_rsd: boolean;
};

function buildUrl(path: string) {
  return `${env.NEXT_PUBLIC_API_BASE_URL}${path}`;
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: ApiEnvelope<T> & { detail?: string } = {};

  if (text) {
    try {
      payload = JSON.parse(text) as ApiEnvelope<T> & { detail?: string };
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    throw new StaffApiError(
      payload.message || payload.detail || `Request failed with status ${response.status}.`,
      response.status,
      payload,
    );
  }

  return (payload.data ?? payload) as T;
}

async function requestOnce<T>(accessToken: string, path: string, init?: RequestInit) {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      ...NGROK_HEADERS,
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  return parseEnvelope<T>(response);
}

async function request<T>(accessToken: string, path: string, init?: RequestInit) {
  try {
    return await requestOnce<T>(accessToken, path, init);
  } catch (error) {
    if (!(error instanceof StaffApiError) || error.status !== 401) {
      console.error("Admin API request failed", {
        path,
        method: init?.method ?? "GET",
        error,
      });
      throw error;
    }

    console.warn("Admin API request received 401, attempting token refresh", {
      path,
      method: init?.method ?? "GET",
    });

    const authStore = useAuthStore.getState();
    const refreshed = await authStore.refreshSession();
    const nextToken = useAuthStore.getState().accessToken;

    if (!refreshed || !nextToken) {
      console.error("Admin API token refresh failed", {
        path,
        method: init?.method ?? "GET",
        error,
      });
      throw error;
    }

    try {
      return await requestOnce<T>(nextToken, path, init);
    } catch (retryError) {
      console.error("Admin API retry failed after refresh", {
        path,
        method: init?.method ?? "GET",
        error: retryError,
      });
      throw retryError;
    }
  }
}

export function formatAdminApiError(error: unknown) {
  return getApiErrorMessage(error);
}

export function toAdminRoleLabel(roleId: string) {
  switch (roleId) {
    case "admin":
      return "DWS Admin";
    case "pc":
      return "Chaplain";
    case "pt-im":
      return "PT/IM";
    case "mp":
      return "Mental Performance";
    case "nutritionist":
      return "Nutritionist";
    case "leadership":
      return "Leadership";
    case "scs":
      return "SCS";
    case "idmt":
      return "IDMT";
    case "plan":
      return "Plan";
    default:
      return roleId;
  }
}

export async function getAdminUsers(accessToken: string, role?: string) {
  const search = role ? `?role=${encodeURIComponent(role)}` : "";
  return request<AdminUsersResponse>(accessToken, `/admin/users${search}`);
}

export async function createAdminUser(accessToken: string, payload: AdminCreateUserPayload) {
  return request<AdminCreateUserResponse>(accessToken, "/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function changeAdminUserRole(accessToken: string, userId: string, role: string) {
  return request<AdminUserRecord>(accessToken, `/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role }),
  });
}

export async function assignAdminUserUnit(accessToken: string, userId: string, unitId: string | null) {
  return request<AdminUserRecord>(accessToken, `/admin/users/${userId}/unit`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ unit_id: unitId }),
  });
}

export async function requestAdminUserDeactivation(accessToken: string, userId: string, reason: string) {
  return request<unknown>(accessToken, `/admin/users/${userId}/deactivate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
}

export async function renewAdminUserAccess(accessToken: string, userId: string) {
  return request<AdminUserRecord>(accessToken, `/admin/users/${userId}/renew-access`, {
    method: "POST",
  });
}

export async function resetAdminUserPassword(accessToken: string, userId: string) {
  return request<AdminUserRecord & { emailed?: boolean }>(accessToken, `/admin/users/${userId}/reset-password`, {
    method: "POST",
  });
}

export async function assignAdminUserProvider(
  accessToken: string,
  userId: string,
  payload: { pathway_key: string; provider_user_id: string },
) {
  return request<unknown>(accessToken, `/admin/users/${userId}/assign-provider`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getAdminDeactivationRequests(accessToken: string) {
  return request<{ requests: AdminSystemOverview["deactivation_queue"]["self_service_pending"] }>(
    accessToken,
    "/admin/deactivation-requests",
  );
}

export async function approveAdminDeactivationRequest(accessToken: string, requestId: string) {
  return request<unknown>(accessToken, `/admin/deactivation-requests/${requestId}/approve`, {
    method: "POST",
  });
}

export async function rejectAdminDeactivationRequest(accessToken: string, requestId: string) {
  return request<unknown>(accessToken, `/admin/deactivation-requests/${requestId}/reject`, {
    method: "POST",
  });
}

export async function getAdminRoleCatalog(accessToken: string) {
  return request<AdminRoleCatalogResponse>(accessToken, "/roles/catalog");
}

export async function getAdminAccountsOnboardingSummary(accessToken: string) {
  return request<AdminAccountsOnboardingSummary>(accessToken, "/roles/accounts-onboarding-summary");
}

export async function getAdminRbacMatrix(accessToken: string) {
  return request<AdminRbacMatrixResponse>(accessToken, "/roles/matrix");
}

export async function getAdminQuestionRegistry(accessToken: string) {
  return request<AdminQuestionRegistryResponse>(accessToken, "/admin/question-registry");
}

export async function createAdminQuestionBankVersion(accessToken: string, payload: { version_id: string; change_reason: string }) {
  return request<AdminQuestionBankVersion>(accessToken, "/admin/question-bank-versions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getAdminQuestionBankVersions(accessToken: string) {
  return request<{ versions: AdminQuestionBankVersion[] }>(accessToken, "/admin/question-bank-versions");
}

export async function retireAdminQuestionBankVersion(accessToken: string, versionId: string) {
  return request<AdminQuestionBankVersion>(accessToken, `/admin/question-bank-versions/${versionId}/retire`, {
    method: "POST",
  });
}

export async function getAdminScopeConfigs(accessToken: string, role?: string) {
  const search = role ? `?role=${encodeURIComponent(role)}` : "";
  return request<{ configs?: AdminScopeConfig[] } | AdminScopeConfig>(accessToken, `/roles/scope-config${search}`);
}

export async function updateAdminScopeConfig(accessToken: string, role: string, payload: Pick<AdminScopeConfig, "cohort_k" | "visible_components">) {
  return request<AdminScopeConfig>(accessToken, `/roles/scope-config/${encodeURIComponent(role)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getAdminScopeMatrix(accessToken: string) {
  return request<{ roles: AdminScopeMatrixRow[] }>(accessToken, "/roles/scope-matrix");
}

export async function resolveAdminScope(accessToken: string, role: string, unitId: string) {
  return request<AdminScopeResolveResponse>(
    accessToken,
    `/roles/scope-resolve?role=${encodeURIComponent(role)}&unit_id=${encodeURIComponent(unitId)}`,
  );
}

export async function getAdminPathwayMatrix(accessToken: string) {
  return request<{ pathways: AdminPathwayMatrixEntry[] }>(accessToken, "/roles/pathway-matrix");
}

export async function approveAdminPathway(accessToken: string, pathwayKey: string) {
  return request<unknown>(accessToken, `/roles/pathway-approvals/${encodeURIComponent(pathwayKey)}/approve`, {
    method: "POST",
  });
}

export async function enableAdminPathway(accessToken: string, pathwayKey: string, accessPolicy?: string) {
  return request<unknown>(accessToken, `/roles/pathway-approvals/${encodeURIComponent(pathwayKey)}/enable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(accessPolicy ? { access_policy: accessPolicy } : {}),
  });
}

export async function getAdminAuditLog(accessToken: string, page = 1, pageSize = 50, eventType?: string) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (eventType) {
    params.set("event_type", eventType);
  }
  return request<{ total: number; page: number; page_size: number; entries: AdminAuditEntry[] }>(
    accessToken,
    `/admin/audit-log?${params.toString()}`,
  );
}

export async function getAdminAuditStats(accessToken: string) {
  return request<AdminAuditStats>(accessToken, "/admin/audit-log/stats");
}

export async function getAdminAuditCategoryRollup(accessToken: string) {
  return request<{ categories: AdminAuditRollupCategory[] }>(accessToken, "/admin/audit-log/category-rollup");
}

export async function getAdminExportsOverview(accessToken: string) {
  return request<AdminExportsOverview>(accessToken, "/admin/exports/overview");
}

export async function getAdminRequiredContractReports(accessToken: string) {
  return request<{ required_count: number; generated_at_least_once_count: number; reports: AdminRequiredContractReport[] }>(
    accessToken,
    "/admin/reports/required-contract-reports",
  );
}

export async function createAdminScheduledExport(
  accessToken: string,
  payload: {
    name: string;
    report_type: string;
    export_format: string;
    cadence: string;
    recipient_role: string;
  },
) {
  return request<AdminScheduledExport>(accessToken, "/admin/scheduled-exports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getAdminScheduledExports(accessToken: string) {
  return request<{ schedules: AdminScheduledExport[] }>(accessToken, "/admin/scheduled-exports");
}

export async function updateAdminScheduledExport(
  accessToken: string,
  scheduleId: string,
  payload: Partial<Pick<AdminScheduledExport, "name" | "cadence" | "export_format" | "recipient_role" | "status">>,
) {
  return request<AdminScheduledExport>(accessToken, `/admin/scheduled-exports/${scheduleId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminScheduledExport(accessToken: string, scheduleId: string) {
  return request<unknown>(accessToken, `/admin/scheduled-exports/${scheduleId}`, {
    method: "DELETE",
  });
}

export async function getAdminExportLogHistory(accessToken: string) {
  return request<{ exports: AdminExportRecord[] }>(accessToken, "/admin/reports/export-log/history");
}

export async function searchAdminExportLog(accessToken: string, query: string) {
  return request<{ exports: AdminExportRecord[] }>(accessToken, `/admin/reports/export-log/search?q=${encodeURIComponent(query)}`);
}

export async function setAdminExportLifecycleStatus(accessToken: string, exportId: string, lifecycleStatus: string) {
  return request<AdminExportRecord>(accessToken, `/admin/reports/export-log/${exportId}/lifecycle`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lifecycle_status: lifecycleStatus }),
  });
}

export async function approveAdminConfirmation(accessToken: string, confirmationId: string) {
  return request<unknown>(accessToken, `/admin/confirmations/${confirmationId}/approve`, {
    method: "POST",
  });
}

export async function rejectAdminConfirmation(accessToken: string, confirmationId: string, reason: string) {
  return request<unknown>(accessToken, `/admin/confirmations/${confirmationId}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
}

export async function revertAdminConfirmation(accessToken: string, confirmationId: string) {
  return request<unknown>(accessToken, `/admin/confirmations/${confirmationId}/revert`, {
    method: "POST",
  });
}

export async function getAdminSystemDiagnostics(accessToken: string) {
  return request<AdminSystemDiagnostics>(accessToken, "/admin/system/diagnostics");
}

export async function getAdminSystemOverview(accessToken: string) {
  return request<AdminSystemOverview>(accessToken, "/admin/system/overview");
}

export async function createAdminScoringConfig(
  accessToken: string,
  payload: {
    effective_date: string;
    physical_weight: number;
    sleep_weight: number;
    mental_weight: number;
    nutritional_weight: number;
    spiritual_weight: number;
  },
) {
  return request<unknown>(accessToken, "/admin/scoring-config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getAdminScoringConfigHistory(accessToken: string) {
  return request<{ configs: unknown[] }>(accessToken, "/admin/scoring-config");
}

export async function createAdminRecommendationThresholdConfig(
  accessToken: string,
  payload: {
    effective_date: string;
    high_threshold: number;
    moderate_threshold: number;
  },
) {
  return request<unknown>(accessToken, "/admin/recommendation-thresholds", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getAdminRecommendationThresholdHistory(accessToken: string) {
  return request<{ thresholds: unknown[] }>(accessToken, "/admin/recommendation-thresholds");
}

export async function createAdminOrgUnit(accessToken: string, payload: { name: string; unit_type: string; parent_id?: string | null }) {
  return request<AdminOrgUnit>(accessToken, "/admin/org-units", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getAdminOrgUnits(accessToken: string) {
  return request<{ units: AdminOrgUnit[] }>(accessToken, "/admin/org-units");
}

export async function setAdminEmergencyContacts(accessToken: string, unitId: string, payload: Record<string, string | null>) {
  return request<unknown>(accessToken, `/admin/emergency-contacts/${unitId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function addAdminCredential(
  accessToken: string,
  payload: {
    provider_id: string;
    credential_type: string;
    issuing_body?: string | null;
    issued_date?: string | null;
    expiration_date?: string | null;
  },
) {
  return request<AdminCredential>(accessToken, "/admin/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getAdminCredentials(accessToken: string) {
  return request<{ credentials: AdminCredential[] }>(accessToken, "/admin/credentials");
}

export async function createAdminEquipmentGap(
  accessToken: string,
  payload: {
    item: string;
    supply_need: string;
    priority: string;
  },
) {
  return request<AdminEquipmentGap>(accessToken, "/admin/equipment-gaps", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getAdminEquipmentGaps(accessToken: string) {
  return request<{ gaps: AdminEquipmentGap[] }>(accessToken, "/admin/equipment-gaps");
}

export async function updateAdminEquipmentGap(accessToken: string, gapId: string, payload: { status?: string; included_in_report?: boolean }) {
  return request<AdminEquipmentGap>(accessToken, `/admin/equipment-gaps/${gapId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function createAdminUtilizationEvent(
  accessToken: string,
  payload: {
    event_type: string;
    opportunity_offered: string;
    actual_use: boolean;
    event_date: string;
    attendance_count?: number | null;
    notes?: string | null;
  },
) {
  return request<AdminUtilizationEvent>(accessToken, "/admin/utilization-events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getAdminUtilizationEvents(accessToken: string, days = 90) {
  return request<{ events: AdminUtilizationEvent[] }>(accessToken, `/admin/utilization-events?days=${days}`);
}

export async function createAdminCoverageLog(
  accessToken: string,
  payload: {
    provider_id: string;
    role: string;
    hours: number;
    coverage_date: string;
    is_weekend_rsd: boolean;
  },
) {
  return request<AdminCoverageLog>(accessToken, "/admin/coverage-logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getAdminCoverageLog(accessToken: string, providerId: string) {
  return request<{ logs: AdminCoverageLog[] }>(accessToken, `/admin/coverage-logs/${providerId}`);
}

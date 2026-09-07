"use client";

import { env } from "@/lib/env";
import { StaffApiError } from "@/lib/staff-api";

const NGROK_HEADERS = {
  "ngrok-skip-browser-warning": "1",
};

type ApiEnvelope<T> = {
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
};

export type LeadershipPeriod = "7d" | "30d" | "3mo" | "6mo" | "12mo";

export type LeadershipDashboardSummary = {
  enrolled_operator_count: number;
  average_ops_score: number | null;
  band_distribution: Record<string, number>;
  component_averages: Record<string, number>;
  oft_status_counts: Record<string, number>;
  support_requests_by_pathway: Record<string, number>;
  utilization_event_count_90d: number;
  assessment_completion: {
    total_operators: number;
    eligible_6_month_cohort_size: number;
    eligible_6_month_completion_pct: number | null;
    eligible_6_month_target_pct: number | null;
    eligible_12_month_cohort_size: number;
    eligible_12_month_completion_pct: number | null;
    eligible_12_month_target_pct: number | null;
  };
  recent_report_exports: Array<{
    report_type: string;
    date_range: string | null;
    created_at: string;
  }>;
};

export type LeadershipHoursCoverage = {
  role: string;
  year: number;
  entries_with_schedule: number;
  total_scheduled_hours: number;
  total_worked_hours: number;
  worked_pct_of_scheduled: number | null;
  missed_count: number;
  missed_by_reason: Record<string, number>;
};

export type LeadershipPrsProviderRow = {
  provider_id: string;
  provider_name: string | null;
  role: string;
  logged_hours: number;
  rsd_hours: number;
  target_hours: number;
  coverage_pct: number;
  meets_95pct_evidence: boolean;
};

export type LeadershipAggregate = {
  hero: {
    cohort_size: number;
    average_ops_score: number | null;
    score_band: string | null;
    mom_delta: number | null;
    pvp_delta: number | null;
    months: Array<{
      month: string;
      cohort_size: number;
      average_ops_score: number | null;
      component_averages: Record<string, number>;
    }>;
    approximate_target_score: number | null;
    target_is_approximated: boolean;
  };
  driver_trends: Array<{
    component: string;
    average_score: number | null;
    score_band: string | null;
  }>;
  flight_comparison: {
    min_cohort_size: number;
    total_flights: number;
    flights_meeting_cohort_minimum: number;
    flights: Array<{
      flight_id: string;
      flight_name: string;
      cohort_size: number;
      average_ops_score: number | null;
      score_band: string | null;
      mom_delta: number | null;
      confidence: string | null;
    }>;
    reference_months: string[];
  };
  risk_heatmap: {
    min_cohort_size: number;
    flights: Array<{
      flight_id: string;
      flight_name: string;
      cohort_size: number;
      suppressed: boolean;
      driver_bands: Record<string, string | null>;
      driver_severity: Record<string, string | null>;
    }>;
  };
  recovery_program_summary: {
    min_cohort_size: number;
    total_flights: number;
    flights_meeting_cohort_minimum: number;
    flights_with_active_recovery: number;
    on_track_flight_count: number;
    total_active_plans: number;
    flights: Array<{
      flight_id: string;
      flight_name: string;
      cohort_size: number;
      active_plan_count: number;
      phase_distribution: Record<string, number>;
      overdue_review_count: number;
      on_track: boolean;
    }>;
  };
  min_cohort_size: number;
  assessment_targets?: {
    total_operators: number;
    eligible_6_month_cohort_size: number;
    eligible_6_month_completion_pct: number | null;
    eligible_6_month_target_pct: number;
    eligible_12_month_cohort_size: number;
    eligible_12_month_completion_pct: number | null;
    eligible_12_month_target_pct: number;
  } | null;
  feedback_sessions?: {
    period_start: string;
    period_end: string;
    total_assessments_in_period: number;
    feedback_sessions_completed: number;
    completion_pct: number | null;
  } | null;
  scs_hours_coverage?: LeadershipHoursCoverage | null;
  ptim_hours_coverage?: LeadershipHoursCoverage | null;
  prs_providers?: LeadershipPrsProviderRow[] | null;
  rsd_coverage?: {
    year: number;
    total_rsd_hours: number;
    session_count: number;
  } | null;
  oft_metrics?: {
    month: string | null;
    status_counts: Record<string, number>;
    pass_count: number;
    fail_count: number;
    pass_rate_pct: number | null;
    avg_items_passed: number | null;
    avg_items_total: number | null;
    government_entry_compliance_pct: number | null;
    annual_test_count_distribution: Record<string, number>;
    by_flight?: {
      min_cohort_size: number;
      flights: Array<{
        flight_id: string;
        flight_name: string;
        cohort_size: number;
        pass_count: number;
        fail_count: number;
        pass_rate_pct: number | null;
      }>;
    };
  } | null;
  oft_due_soon_count?: number | null;
};

export type LeadershipTrends = {
  trend: {
    period: LeadershipPeriod;
    granularity: string;
    min_cohort_size: number;
    months: Array<{
      month: string;
      cohort_size: number;
      average_ops_score: number | null;
      component_averages: Record<string, number>;
    }>;
    mom_delta: number | null;
    pvp_delta: number | null;
  };
  band_distribution: {
    min_cohort_size: number;
    months: Array<{
      month: string;
      cohort_size: number;
      band_counts: Record<string, number>;
    }>;
    current_distribution: Array<{
      band: string;
      count: number;
      delta: number;
    }>;
  };
  annotations: Array<{
    id: string;
    title: string;
    narrative: string;
    event_date: string;
    unit_id: string | null;
    created_by_name: string | null;
    created_at: string;
  }>;
};

export type LeadershipReport = {
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
};

export type LeadershipSchedule = {
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

export type LeadershipReportsLibrary = {
  recent_reports: LeadershipReport[];
  schedules: LeadershipSchedule[];
};

export type LeadershipReportTemplate = {
  key: string;
  title: string;
  report_type: string;
  cadence: string;
  export_format: string;
};

export type LeadershipBriefingTemplate = {
  key: string;
  title: string;
  sections: string[];
};

export type LeadershipBriefingSummary = {
  id: string;
  title: string;
  template_key: string;
  status: string;
  recipient_roles: string[];
  section_count: number;
  created_at: string;
  sent_at: string | null;
  archived_at: string | null;
};

export type LeadershipBriefingDetail = {
  id: string;
  title: string;
  template_key: string;
  outline: Array<{
    section_key: string;
    title: string;
  }>;
  generated_content: Record<string, string>;
  status: string;
  recipient_roles: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  archived_at: string | null;
};

// Real per-operator row from provider_dashboard_service._build_scs_row.
export type ScsOperatorRow = {
  user_id: string;
  user_name: string;
  current_ops_score: number | null;
  current_ops_band: string | null;
  physical_readiness: number | null;
  sleep_readiness: number | null;
  checked_in_today: boolean;
  missed_workouts_recent: number;
  reported_limitation_recent: boolean;
  oft_status: string;
  reconditioning_active: boolean;
  ptim_clearance_status: string | null;
  active_risk_flag: string | null;
  driver_flag: string | null;
  ptim_referral_status: string | null;
};

export type ScsDashboardData = {
  assigned_count: number;
  checked_in_today_count: number;
  missed_checkin_today_count: number;
  low_ops_count: number;
  oft_cleared_today_count: number;
  reconditioning_awaiting_review_count: number;
  operators: ScsOperatorRow[];
};

export type PtimDashboardData = {
  assigned_count: number;
  active_reconditioning_count: number;
  pending_review_total: number;
  operators: Array<Record<string, unknown>>;
};

// Real shape from provider_dashboard_service.get_specialist_dashboard -
// shared by Nutritionist/Mental Performance/Chaplain, NOT the same shape
// as PtimDashboardData above (this dashboard has no
// active_reconditioning_count/pending_review_total fields).
export type SpecialistDashboardData = {
  pathway_key: string;
  relevant_readiness_component: string | null;
  assigned_count: number;
  open_request_count: number;
  low_consistency_operator_count: number | null;
  operators: Array<Record<string, unknown>>;
  notes: Array<Record<string, unknown>>;
  recent_requests: Array<Record<string, unknown>>;
};

// Real shape from provider_dashboard_service.get_mental_driver_scores -
// Mental Performance-only, k-gated cohort aggregate.
export type MentalDriverScoresResponse = {
  cohort_size: number;
  cohort_k: number;
  window_days: number;
  suppressed: boolean;
  drivers: Record<string, number | null> | null;
};

// Real shape from provider_dashboard_service.get_meal_consistency_by_flight -
// Nutritionist-only, k-gated per-flight aggregate.
export type MealConsistencyByFlightResponse = {
  window_days: number;
  min_cohort_size: number;
  total_flights: number;
  flights_meeting_cohort_minimum: number;
  flights: Array<{
    flight_id: string;
    flight_name: string;
    cohort_size: number;
    flagged_members: number;
    flagged_rate_pct: number;
    consistency_level: string;
    pending_review_count: number;
  }>;
};

export type ActiveRecommendationsResponse = {
  recommendations?: Array<Record<string, unknown>>;
} | null;

export type WorkoutListResponse = {
  workouts: Array<Record<string, unknown>>;
};

export type WorkoutSummaryResponse = {
  range_days: number;
  total_sessions: number;
  completed_sessions: number;
  missed_sessions: number;
  by_activity_type: Record<string, number>;
  total_duration_minutes: number;
  recent_adherence_label: string;
  current_streak_weeks: number;
};

export type OftRecordResponse = {
  current_status: string;
  latest_pass_fail: string | null;
  latest_test_date: string | null;
  items_passed: number | null;
  items_total: number | null;
  next_scheduled_date: string | null;
  next_scheduled_relative: string | null;
  annual_test_count: number;
};

export type ReconditioningTimelineResponse = {
  events: Array<Record<string, unknown>>;
};

export type ReconditioningRestrictionsResponse = {
  restrictions: Array<Record<string, unknown>>;
};

export type FlightReconditioningLoad = {
  flight_id: string;
  flight_name: string;
  cohort_size: number;
  active_reconditioning_count: number;
  load_pct: number;
};

// Real shape from coverage_service.get_reconditioning_load_by_flight.
// Deliberately only reconditioning load - PT/OFT lanes and a per-flight
// "capacity" number have no real data source anywhere in the backend and
// were never built (see the service method's own docstring).
export type CoverageLoadByFlightResponse = {
  min_cohort_size: number;
  total_flights: number;
  flights_meeting_cohort_minimum: number;
  flights: FlightReconditioningLoad[];
};

export type PerformanceSummaryEntry = {
  id: string;
  user_id: string;
  created_by: string;
  reviewer_role: string;
  review_date: string;
  approved_visibility_level: string;
  expiration_or_review_due_date: string | null;
  specialist_notes_link: string[];
  created_at: string;
  injury_history_summary: string | null;
  limitations_summary: string | null;
  return_to_performance_considerations: string | null;
  nutrition_considerations: string | null;
  sleep_recovery_considerations: string | null;
  medication_allergy_considerations_if_authorized: string | null;
  withheld_fields: string[];
};

export type PerformanceSummariesResponse = {
  summaries: PerformanceSummaryEntry[];
};

export type RoutingLevelsResponse = {
  levels: Array<{
    level: string;
    name: string;
    trigger: string;
    user_experience: string;
    coach_admin_action: string;
    specialist_routing: string;
  }>;
};

export type MessageThreadsResponse = {
  threads: Array<Record<string, unknown>>;
};

export type MessageEntry = {
  id: string;
  thread_key: string;
  thread_id: string | null;
  sender_id: string;
  sender_role: string;
  recipient_id: string | null;
  body: string;
  is_read: boolean;
  source_type: string;
  related_recommendation_id: string | null;
  attachment: { file_name: string; file_size_bytes: number } | null;
  created_at: string;
};

export type MessageThreadDetailResponse = {
  thread_key: string;
  other_user_id: string;
  other_user_name: string | null;
  other_user_role: string;
  pathway_context: Record<string, unknown> | null;
  messages: MessageEntry[];
};

export type RecordUploadsResponse = {
  records: Array<Record<string, unknown>>;
};

export type RecordFileDownloadResponse = {
  content_base64: string;
  content_type: string;
  file_name: string;
  file_size_bytes: number;
};

export type RomMeasurementsResponse = {
  measurements: Array<Record<string, unknown>>;
};

export type InjuryReportByFlightResponse = {
  window_days: number;
  window_start: string;
  window_end: string;
  fiscal_year?: number;
  quarter?: number;
  min_cohort_size: number;
  total_flights: number;
  flights_meeting_cohort_minimum: number;
  flights: Array<Record<string, unknown>>;
};

export type InjuryReportQuartersResponse = {
  fiscal_year: number;
  quarters: Array<
    InjuryReportByFlightResponse & {
      quarter: number;
      total_injuries: number;
      l4_plus_count: number;
      days_lost: number;
      injury_rate_per_100_person_months: number | null;
      total_injuries_delta: number | null;
      l4_plus_count_delta: number | null;
      days_lost_delta: number | null;
      injury_rate_per_100_person_months_delta: number | null;
    }
  >;
};

export type InjuryTypeBreakdownResponse = {
  window_start: string;
  window_end: string;
  min_cohort_size: number;
  types: Array<{
    injury_type: string;
    count: number | null;
    suppressed: boolean;
  }>;
};

export type IdmtHandoffsResponse = {
  handoffs: Array<Record<string, unknown>>;
};

export type UpcomingPtSessionsResponse = {
  window_days: number;
  sessions: Array<Record<string, unknown>>;
};

export type LeaveRecordSummary = {
  id: string;
  user_id: string;
  user_name: string | null;
  leave_type: string;
  leave_type_label: string;
  start_date: string;
  end_date: string;
  note: string | null;
  created_at: string;
};

export type LeaveOverlapPair = {
  record_id_a: string;
  record_id_b: string;
  overlap_start: string;
  overlap_end: string;
  overlap_days: number;
};

// Real shape from leave_service.list_overlap_window.
export type LeaveOverlapResponse = {
  window_days: number;
  records: LeaveRecordSummary[];
  overlapping_pairs: LeaveOverlapPair[];
};

export type LeaveHistoryResponse = {
  records?: Array<Record<string, unknown>>;
  leave?: Array<Record<string, unknown>>;
};

function buildUrl(path: string) {
  return `${env.NEXT_PUBLIC_API_BASE_URL}${path}`;
}

/** Same host/path as the real REST API, http(s) swapped for ws(s) - for the real `/messaging/live` change-stream socket. */
export function buildWsUrl(path: string, accessToken: string) {
  const wsBase = env.NEXT_PUBLIC_API_BASE_URL.replace(/^http/, "ws");
  return `${wsBase}${path}?token=${encodeURIComponent(accessToken)}`;
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as ApiEnvelope<T>) : {};

  if (!response.ok) {
    throw new StaffApiError(
      payload.message || `Request failed with status ${response.status}.`,
      response.status,
      payload,
    );
  }

  return (payload.data ?? payload) as T;
}

async function request<T>(accessToken: string, path: string, init?: RequestInit) {
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

export async function getLeadershipDashboard(accessToken: string) {
  return request<LeadershipDashboardSummary>(accessToken, "/dashboard/leadership");
}

export async function getLeadershipAggregate(accessToken: string) {
  return request<LeadershipAggregate>(accessToken, "/dashboard/leadership/aggregate");
}

export async function getLeadershipTrends(accessToken: string, period: LeadershipPeriod) {
  return request<LeadershipTrends>(accessToken, `/dashboard/leadership/trends?period=${period}`);
}

export async function createLeadershipAnnotation(
  accessToken: string,
  payload: { title: string; narrative: string; event_date: string; unit_id?: string | null },
) {
  return request<Record<string, unknown>>(accessToken, "/dashboard/leadership/annotations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteLeadershipAnnotation(accessToken: string, annotationId: string) {
  return request<Record<string, unknown>>(accessToken, `/dashboard/leadership/annotations/${annotationId}`, {
    method: "DELETE",
  });
}

export async function getLeadershipReports(accessToken: string) {
  return request<LeadershipReportsLibrary>(accessToken, "/dashboard/leadership/reports");
}

export async function getLeadershipReportTemplates(accessToken: string) {
  return request<{ templates: LeadershipReportTemplate[] }>(accessToken, "/dashboard/leadership/report-templates");
}

export async function useLeadershipReportTemplate(accessToken: string, templateKey: string, name?: string) {
  return request<Record<string, unknown>>(accessToken, `/dashboard/leadership/report-templates/${templateKey}/use`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(name ? { name } : {}),
  });
}

export async function getLeadershipBriefingTemplates(accessToken: string) {
  return request<{ templates: LeadershipBriefingTemplate[] }>(accessToken, "/dashboard/leadership/briefing-templates");
}

export async function createLeadershipBriefing(
  accessToken: string,
  payload: { title: string; template_key: string; custom_outline?: Array<{ section_key: string; title: string }> | null },
) {
  return request<LeadershipBriefingDetail>(accessToken, "/dashboard/leadership/briefings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getLeadershipBriefings(accessToken: string) {
  return request<{ briefings: LeadershipBriefingSummary[] }>(accessToken, "/dashboard/leadership/briefings");
}

export async function getLeadershipBriefing(accessToken: string, briefingId: string) {
  return request<LeadershipBriefingDetail>(accessToken, `/dashboard/leadership/briefings/${briefingId}`);
}

export async function updateLeadershipBriefing(
  accessToken: string,
  briefingId: string,
  payload: { outline: Array<{ section_key: string; title: string }> },
) {
  return request<LeadershipBriefingDetail>(accessToken, `/dashboard/leadership/briefings/${briefingId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function submitLeadershipBriefingForReview(accessToken: string, briefingId: string) {
  return request<Record<string, unknown>>(accessToken, `/dashboard/leadership/briefings/${briefingId}/submit-for-review`, {
    method: "POST",
  });
}

export async function markLeadershipBriefingReady(accessToken: string, briefingId: string) {
  return request<Record<string, unknown>>(accessToken, `/dashboard/leadership/briefings/${briefingId}/mark-ready`, {
    method: "POST",
  });
}

export async function sendLeadershipBriefing(accessToken: string, briefingId: string, recipient_roles: string[]) {
  return request<Record<string, unknown>>(accessToken, `/dashboard/leadership/briefings/${briefingId}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient_roles }),
  });
}

export async function archiveLeadershipBriefing(accessToken: string, briefingId: string) {
  return request<Record<string, unknown>>(accessToken, `/dashboard/leadership/briefings/${briefingId}/archive`, {
    method: "POST",
  });
}

export async function downloadLeadershipBriefingPdf(accessToken: string, briefingId: string) {
  const response = await fetch(buildUrl(`/dashboard/leadership/briefings/${briefingId}/pdf`), {
    headers: {
      ...NGROK_HEADERS,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new StaffApiError(`Request failed with status ${response.status}.`, response.status, null);
  }

  return response.blob();
}

export async function getScsDashboard(accessToken: string) {
  return request<ScsDashboardData>(accessToken, "/dashboard/scs");
}

export async function getActiveRecommendations(accessToken: string) {
  return request<ActiveRecommendationsResponse>(accessToken, "/recommendations/active");
}

export async function getScopedWorkouts(accessToken: string) {
  return request<WorkoutListResponse>(accessToken, "/workouts");
}

export async function getScopedWorkoutSummary(accessToken: string) {
  return request<WorkoutSummaryResponse>(accessToken, "/workouts/summary");
}

export async function getOftRecord(accessToken: string, userId: string) {
  return request<OftRecordResponse>(accessToken, `/oft/${userId}`);
}

export async function assignRecommendation(
  accessToken: string,
  userId: string,
  payload: {
    readiness_component: string;
    assigned_provider_name: string;
    assigned_provider_role: string;
    title: string;
    instructions: string;
    steps: Array<{ title: string; description: string }>;
    follow_up_timeline: string;
    is_joint_coordination: boolean;
  },
) {
  return request<Record<string, unknown>>(accessToken, `/recommendations/${userId}/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function upsertReconditioningPlan(
  accessToken: string,
  userId: string,
  payload: {
    phase: string;
    sessions_completed: number;
    sessions_total: number;
    cadence_note: string;
    injury_flags: string[];
    ptim_clearance_status: string;
    next_review_date: string;
    limitation_flag: boolean;
    rehab_strategy_summary: string;
    scs_coordination_status: string;
    severity_level: string;
    injury_reported_on: string;
    rtd_source_authority?: string;
    rtd_decision_date?: string;
    rtd_verified?: boolean;
    rtd_reevaluation_date?: string;
  },
) {
  return request<Record<string, unknown>>(accessToken, `/records/reconditioning-plan/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getReconditioningTimeline(accessToken: string, userId: string) {
  return request<ReconditioningTimelineResponse>(accessToken, `/records/reconditioning-plan/${userId}/timeline`);
}

export async function getReconditioningRestrictions(accessToken: string, userId: string) {
  return request<ReconditioningRestrictionsResponse>(accessToken, `/records/reconditioning-plan/${userId}/restrictions`);
}

export async function addReconditioningRestriction(
  accessToken: string,
  userId: string,
  payload: { description: string; required_phase: string },
) {
  return request<Record<string, unknown>>(accessToken, `/records/reconditioning-plan/${userId}/restrictions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function releaseReconditioningRestriction(accessToken: string, restrictionId: string) {
  return request<Record<string, unknown>>(accessToken, `/records/reconditioning-plan/restrictions/${restrictionId}/release`, {
    method: "POST",
  });
}

export async function createCoverageLog(
  accessToken: string,
  payload: {
    provider_id: string;
    role: string;
    hours: number;
    coverage_date: string;
    is_weekend_rsd: boolean;
  },
) {
  return request<Record<string, unknown>>(accessToken, "/admin/coverage-logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getCoverageLog(accessToken: string, providerId: string) {
  return request<{ logs: Array<Record<string, unknown>> }>(accessToken, `/admin/coverage-logs/${providerId}`);
}

export async function getCoverageLoadByFlight(accessToken: string) {
  return request<CoverageLoadByFlightResponse>(accessToken, "/admin/coverage/reconditioning-load-by-flight");
}

export type ScsWeeklyAvailabilityProvider = {
  provider_id: string;
  provider_name: string;
  days: Record<string, number>;
  week_total_hours: number;
};

// Real shape from coverage_service.get_scs_weekly_availability.
export type ScsWeeklyAvailabilityResponse = {
  week_start: string;
  week_end: string;
  day_keys: string[];
  providers: ScsWeeklyAvailabilityProvider[];
};

export async function getScsWeeklyAvailability(accessToken: string) {
  return request<ScsWeeklyAvailabilityResponse>(accessToken, "/admin/coverage/scs-weekly-availability");
}

// Real shape from coverage_service.get_schedule_vs_worked_summary.
export type ScheduleVsWorkedResponse = {
  role: string;
  year: number;
  entries_with_schedule: number;
  total_scheduled_hours: number;
  total_worked_hours: number;
  worked_pct_of_scheduled: number | null;
  missed_count: number;
  missed_by_reason: Record<string, number>;
};

export async function getScheduleVsWorked(accessToken: string, role: string, year: number) {
  return request<ScheduleVsWorkedResponse>(accessToken, `/admin/coverage/schedule-vs-worked?role=${role}&year=${year}`);
}

// Real shape from coverage_service.get_rsd_summary.
export type RsdSummaryResponse = {
  year: number;
  total_rsd_hours: number;
  session_count: number;
};

export async function getRsdSummary(accessToken: string, year: number) {
  return request<RsdSummaryResponse>(accessToken, `/admin/coverage/rsd-summary?year=${year}`);
}

export async function getPerformanceSummaries(accessToken: string, userId: string) {
  return request<PerformanceSummariesResponse>(accessToken, `/performance-summaries/${userId}`);
}

export async function getRoutingLevels(accessToken: string) {
  return request<RoutingLevelsResponse>(accessToken, "/messaging/routing-levels");
}

export async function scanMessage(accessToken: string, body: string) {
  return request<{ blocked_terms?: string[]; severity?: number | null }>(accessToken, "/messaging/scan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body }),
  });
}

export async function getMessageThreads(accessToken: string) {
  return request<MessageThreadsResponse>(accessToken, "/messaging/threads");
}

export async function getMessageThread(accessToken: string, otherUserId: string) {
  return request<MessageThreadDetailResponse>(accessToken, `/messaging/thread/${otherUserId}`);
}

export async function sendMessage(
  accessToken: string,
  payload: { recipient_id: string; body: string; related_recommendation_id?: string; file?: File | Blob },
) {
  const formData = new FormData();
  formData.append("recipient_id", payload.recipient_id);
  formData.append("body", payload.body);
  if (payload.related_recommendation_id) {
    formData.append("related_recommendation_id", payload.related_recommendation_id);
  }
  if (payload.file) {
    formData.append("file", payload.file);
  }

  return request<Record<string, unknown>>(accessToken, "/messaging/send", {
    method: "POST",
    body: formData,
  });
}

export async function getMessageTrace(accessToken: string, messageId: string) {
  return request<Record<string, unknown>>(accessToken, `/messaging/message/${messageId}/trace`);
}

export async function getGroupThreads(accessToken: string) {
  return request<MessageThreadsResponse>(accessToken, "/messaging/group-threads");
}

export async function createGroupThread(
  accessToken: string,
  payload: { participant_ids: string[]; title: string },
) {
  return request<Record<string, unknown>>(accessToken, "/messaging/group-threads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getGroupThread(accessToken: string, threadId: string) {
  return request<Record<string, unknown>>(accessToken, `/messaging/group-threads/${threadId}`);
}

export async function sendGroupMessage(accessToken: string, threadId: string, body: string) {
  return request<Record<string, unknown>>(accessToken, `/messaging/group-threads/${threadId}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body }),
  });
}

export async function getPtimDashboard(accessToken: string) {
  return request<PtimDashboardData>(accessToken, "/dashboard/ptim");
}

export async function getSpecialistDashboard(accessToken: string) {
  return request<SpecialistDashboardData>(accessToken, "/dashboard/specialist");
}

export async function getMentalDriverScores(accessToken: string) {
  return request<MentalDriverScoresResponse>(accessToken, "/dashboard/mp/mental-drivers");
}

export async function getMealConsistencyByFlight(accessToken: string) {
  return request<MealConsistencyByFlightResponse>(accessToken, "/dashboard/nutrition/meal-consistency");
}

export type MealLogEntry = {
  id: string;
  user_id: string;
  meal_date: string;
  meal_type: string;
  description: string;
  calories: number | null;
  carbs_g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  flagged: boolean;
  flag_reason: string | null;
  logged_by_id: string;
  created_at: string;
};

export type MealLogsResponse = {
  meal_logs: MealLogEntry[];
};

export async function getMealLogs(accessToken: string, userId: string, days = 60) {
  return request<MealLogsResponse>(accessToken, `/meal-logs/${userId}?days=${days}`);
}

export async function updateMealLogFlag(
  accessToken: string,
  mealLogId: string,
  payload: { flagged: boolean; flag_reason?: string | null },
) {
  return request<MealLogEntry>(accessToken, `/meal-logs/${mealLogId}/flag`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export type CohortMacroDistribution = {
  window_days: number;
  min_cohort_size: number;
  cohort_size: number;
  meets_cohort_minimum: boolean;
  carbs_pct: number | null;
  protein_pct: number | null;
  fat_pct: number | null;
  entries_with_macros: number;
  on_target_band_pct: number | null;
  on_target_entries: number;
  entries_with_target: number;
};

export async function getCohortMacroDistribution(accessToken: string) {
  return request<CohortMacroDistribution>(accessToken, "/dashboard/nutrition/macro-distribution");
}

export type HydrationAlert = {
  flight_id: string;
  flight_name: string;
  streak_days: number;
  latest_adherence_pct: number | null;
  threshold_pct: number;
  members: Array<{ id: string; name: string | null; messageable: boolean }>;
};

export type HydrationAlertsResponse = {
  window_days: number;
  threshold_pct: number;
  min_streak_days: number;
  min_cohort_size: number;
  alerts: HydrationAlert[];
};

export async function getHydrationAlerts(accessToken: string) {
  return request<HydrationAlertsResponse>(accessToken, "/dashboard/nutrition/hydration-alerts");
}

export type SpecialistNoteEntry = {
  id: string;
  user_id: string;
  specialist_id: string;
  specialist_name: string | null;
  specialist_type: string;
  title: string;
  note_date: string;
  note_type: string;
  escalated: boolean;
  user_concern: string;
  action_assigned: string | null;
  follow_up_needed: boolean;
  status: string;
  documentation_status: string;
  signed_at: string | null;
  draft_expired: boolean;
  is_redacted: boolean;
  created_at: string;
};

export async function listSpecialistNotes(accessToken: string, userId: string) {
  return request<{ notes: SpecialistNoteEntry[] }>(accessToken, `/specialist-notes/${userId}`);
}

export async function createSpecialistNote(
  accessToken: string,
  userId: string,
  payload: { title: string; user_concern: string; action_assigned?: string; follow_up_needed?: boolean; note_type?: string; escalated?: boolean },
) {
  return request<SpecialistNoteEntry>(accessToken, `/specialist-notes/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export type MyAuditLogEntry = {
  id: string;
  event_type: string;
  actor_id: string | null;
  actor_role: string;
  target_entity_type: string;
  target_entity_id: string;
  summary_message: string;
  metadata_payload: Record<string, unknown> | null;
  outcome_status: string;
  created_at: string;
};

export type MyAuditLogResponse = {
  total: number;
  page: number;
  page_size: number;
  entries: MyAuditLogEntry[];
};

export async function getMyAuditLog(accessToken: string, page = 1, pageSize = 20) {
  return request<MyAuditLogResponse>(accessToken, `/admin/audit-log/mine?page=${page}&page_size=${pageSize}`);
}

export type MacroTarget = {
  id: string;
  user_id: string;
  title: string;
  carbs_pct: number;
  protein_pct: number;
  fat_pct: number;
  status: string;
  set_by_id: string;
  started_at: string;
  ended_at: string | null;
  adherence_pct: number | null;
  entries_with_macros: number;
  updated_at: string;
};

export async function getMacroTarget(accessToken: string, userId: string) {
  return request<MacroTarget | null>(accessToken, `/meal-logs/targets/${userId}`);
}

export async function getMacroTargetHistory(accessToken: string, userId: string) {
  return request<{ targets: MacroTarget[] }>(accessToken, `/meal-logs/targets/${userId}/history`);
}

export async function setMacroTarget(
  accessToken: string,
  userId: string,
  payload: { title: string; carbs_pct: number; protein_pct: number; fat_pct: number },
) {
  return request<MacroTarget>(accessToken, `/meal-logs/targets/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listUploadedRecords(accessToken: string, documentType = "all") {
  return request<RecordUploadsResponse>(accessToken, `/records/uploads?document_type=${encodeURIComponent(documentType)}`);
}

export type CaseloadMedicalRecordsResponse = {
  records: Array<Record<string, unknown>>;
};

export async function listCaseloadMedicalRecords(accessToken: string) {
  return request<CaseloadMedicalRecordsResponse>(accessToken, "/records/uploads/caseload");
}

export async function requestMedicalRecordAccess(accessToken: string, recordId: string) {
  return request<Record<string, unknown>>(accessToken, `/records/uploads/${recordId}/request-access`, {
    method: "POST",
  });
}

export async function withdrawMedicalRecordConsent(accessToken: string, recordId: string) {
  return request<Record<string, unknown>>(accessToken, `/records/uploads/${recordId}/withdraw-consent`, {
    method: "POST",
  });
}

export async function restoreMedicalRecordConsent(accessToken: string, recordId: string) {
  return request<Record<string, unknown>>(accessToken, `/records/uploads/${recordId}/restore-consent`, {
    method: "POST",
  });
}

export async function getUploadedRecordDetail(accessToken: string, recordId: string) {
  return request<Record<string, unknown>>(accessToken, `/records/uploads/${recordId}`);
}

export async function getUploadedRecordFile(accessToken: string, recordId: string) {
  return request<RecordFileDownloadResponse>(accessToken, `/records/uploads/${recordId}/file`);
}

export async function reviewUploadedRecord(
  accessToken: string,
  recordId: string,
  payload: { note: string; approve: boolean },
) {
  return request<Record<string, unknown>>(accessToken, `/records/uploads/${recordId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function updateRecordAccessLevel(
  accessToken: string,
  recordId: string,
  approvedAccessLevel: string[],
) {
  return request<Record<string, unknown>>(accessToken, `/records/uploads/${recordId}/access-level`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ approved_access_level: approvedAccessLevel }),
  });
}

export async function revealRecordField(
  accessToken: string,
  recordId: string,
  payload: { field_name: string; reason: string; reason_category: string },
) {
  return request<Record<string, unknown>>(accessToken, `/records/uploads/${recordId}/reveal-field`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getRomMeasurements(accessToken: string, userId: string) {
  return request<RomMeasurementsResponse>(accessToken, `/records/reconditioning-plan/${userId}/rom-measurements`);
}

export async function addRomMeasurement(
  accessToken: string,
  userId: string,
  payload: { movement: string; value_degrees: number; measured_date: string; note?: string },
) {
  return request<Record<string, unknown>>(accessToken, `/records/reconditioning-plan/${userId}/rom-measurements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function createPerformanceSummary(
  accessToken: string,
  userId: string,
  payload: {
    injury_history_summary: string;
    limitations_summary: string;
    return_to_performance_considerations: string;
    nutrition_considerations: string;
    sleep_recovery_considerations: string;
    medication_allergy_considerations_if_authorized: string;
    specialist_notes_link: string[];
  },
) {
  return request<Record<string, unknown>>(accessToken, `/performance-summaries/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function setPerformanceSummaryVisibility(
  accessToken: string,
  summaryId: string,
  approvedVisibilityLevel: "draft" | "approved" | "approved_with_medical",
) {
  return request<Record<string, unknown>>(accessToken, `/performance-summaries/${summaryId}/visibility`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ approved_visibility_level: approvedVisibilityLevel }),
  });
}

export async function getInjuryReportByFlight(
  accessToken: string,
  params: { days?: number; fiscal_year?: number; quarter?: number },
) {
  const query = new URLSearchParams();
  if (typeof params.days === "number") query.set("days", String(params.days));
  if (typeof params.fiscal_year === "number") query.set("fiscal_year", String(params.fiscal_year));
  if (typeof params.quarter === "number") query.set("quarter", String(params.quarter));
  const suffix = query.size ? `?${query.toString()}` : "";
  return request<InjuryReportByFlightResponse>(accessToken, `/admin/reports/injury/by-flight${suffix}`);
}

export async function getInjuryReportQuarters(accessToken: string, fiscalYear: number) {
  return request<InjuryReportQuartersResponse>(accessToken, `/admin/reports/injury/quarters?fiscal_year=${fiscalYear}`);
}

export async function getInjuryTypeBreakdown(
  accessToken: string,
  params: { fiscal_year: number; quarter: number },
) {
  return request<InjuryTypeBreakdownResponse>(
    accessToken,
    `/admin/reports/injury/types?fiscal_year=${params.fiscal_year}&quarter=${params.quarter}`,
  );
}

export async function exportQuarterlyInjuryReport(
  accessToken: string,
  params: { date_range: string; export_format: "csv" | "pdf" },
) {
  return request<Record<string, unknown>>(
    accessToken,
    `/admin/reports/injury/export?date_range=${encodeURIComponent(params.date_range)}&export_format=${params.export_format}`,
  );
}

export async function sendRecommendationForSignoff(accessToken: string, recommendationId: string) {
  return request<Record<string, unknown>>(accessToken, `/recommendations/${recommendationId}/send-for-signoff`, {
    method: "POST",
  });
}

export async function signOffRecommendation(accessToken: string, recommendationId: string) {
  return request<Record<string, unknown>>(accessToken, `/recommendations/${recommendationId}/sign-off`, {
    method: "POST",
  });
}

export async function createIdmtHandoff(
  accessToken: string,
  payload: { user_id: string; export_type: string; export_format: string },
) {
  return request<Record<string, unknown>>(accessToken, "/admin/idmt-handoffs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function createIdmtHandoffsBatch(
  accessToken: string,
  payload: { user_ids: string[]; export_type: string; export_format: string },
) {
  return request<Record<string, unknown>>(accessToken, "/admin/idmt-handoffs/batch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function listIdmtHandoffs(accessToken: string) {
  return request<IdmtHandoffsResponse>(accessToken, "/admin/idmt-handoffs");
}

export async function markIdmtHandoffTransmitted(accessToken: string, handoffId: string) {
  return request<Record<string, unknown>>(accessToken, `/admin/idmt-handoffs/${handoffId}/transmit`, {
    method: "POST",
  });
}

export async function acknowledgeIdmtHandoff(accessToken: string, handoffId: string) {
  return request<Record<string, unknown>>(accessToken, `/admin/idmt-handoffs/${handoffId}/acknowledge`, {
    method: "POST",
  });
}

export type CoordinationItemsResponse = {
  items: Array<Record<string, unknown>>;
};

export async function listCoordinationItems(accessToken: string) {
  return request<CoordinationItemsResponse>(accessToken, "/records/coordination-items");
}

export async function raiseCoordinationItem(
  accessToken: string,
  payload: { user_id: string; title: string; trigger_category: string; trigger_detail?: string; affects: string },
) {
  return request<Record<string, unknown>>(accessToken, "/records/coordination-items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function acknowledgeCoordinationItem(accessToken: string, itemId: string) {
  return request<Record<string, unknown>>(accessToken, `/records/coordination-items/${itemId}/acknowledge`, {
    method: "POST",
  });
}

export async function closeCoordinationItem(accessToken: string, itemId: string) {
  return request<Record<string, unknown>>(accessToken, `/records/coordination-items/${itemId}/close`, {
    method: "POST",
  });
}

export type PtimRecommendationsResponse = {
  recommendations: Array<Record<string, unknown>>;
};

export async function listPtimRecommendations(accessToken: string, fiscalYear: number, quarter: number) {
  return request<PtimRecommendationsResponse>(
    accessToken,
    `/records/ptim-recommendations?fiscal_year=${fiscalYear}&quarter=${quarter}`,
  );
}

export async function createPtimRecommendation(
  accessToken: string,
  payload: { fiscal_year: number; quarter: number; title: string; body: string; subject: string; owners: string[]; due_date?: string },
) {
  return request<Record<string, unknown>>(accessToken, "/records/ptim-recommendations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function markPtimRecommendationDone(accessToken: string, recommendationId: string) {
  return request<Record<string, unknown>>(accessToken, `/records/ptim-recommendations/${recommendationId}/done`, {
    method: "POST",
  });
}

export async function downloadIdmtHandoffSummary(accessToken: string, handoffId: string) {
  const response = await fetch(buildUrl(`/admin/idmt-handoffs/${handoffId}/download`), {
    headers: {
      ...NGROK_HEADERS,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};
    throw new StaffApiError(
      payload.message || payload.detail || `Request failed with status ${response.status}.`,
      response.status,
      payload,
    );
  }

  return response.blob();
}

export async function createPtSession(
  accessToken: string,
  payload: {
    session_date: string;
    start_time: string;
    group_label: string;
    focus: string;
    capacity: number;
    lead_provider_id?: string;
  },
) {
  return request<Record<string, unknown>>(accessToken, "/admin/pt-sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function updatePtSession(accessToken: string, sessionId: string, payload: { status?: string; capacity?: number }) {
  return request<Record<string, unknown>>(accessToken, `/admin/pt-sessions/${sessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function enrollPtSessionAttendee(accessToken: string, sessionId: string, userId: string) {
  return request<Record<string, unknown>>(accessToken, `/admin/pt-sessions/${sessionId}/attendees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function removePtSessionAttendee(accessToken: string, sessionId: string, userId: string) {
  return request<Record<string, unknown>>(accessToken, `/admin/pt-sessions/${sessionId}/attendees/${userId}`, {
    method: "DELETE",
  });
}

export async function getUpcomingPtSessions(accessToken: string, days = 14) {
  return request<UpcomingPtSessionsResponse>(accessToken, `/admin/pt-sessions/upcoming?days=${days}`);
}

export async function createLeaveRecord(
  accessToken: string,
  payload: { leave_type: string; start_date: string; end_date: string; note?: string; user_id?: string },
) {
  return request<Record<string, unknown>>(accessToken, "/admin/leave", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getLeaveOverlap(accessToken: string, days = 30) {
  return request<LeaveOverlapResponse>(accessToken, `/admin/leave/overlap?days=${days}`);
}

export async function getLeaveHistory(accessToken: string, userId: string, days = 90) {
  return request<LeaveHistoryResponse>(accessToken, `/admin/leave/${userId}?days=${days}`);
}

export async function deleteLeaveRecord(accessToken: string, leaveId: string) {
  return request<Record<string, unknown>>(accessToken, `/admin/leave/${leaveId}`, {
    method: "DELETE",
  });
}

export type PtSessionSummary = {
  id: string;
  lead_provider_id: string;
  lead_provider_name: string | null;
  lead_provider_role: string;
  session_date: string;
  start_time: string;
  group_label: string;
  focus: string;
  focus_label: string;
  capacity: number;
  enrolled_count: number;
  capacity_pct: number;
  status: string;
  created_at: string;
};

// Real shape from pt_session_service._list_for_date.
export type TodayPtSessionsResponse = {
  date: string;
  sessions: PtSessionSummary[];
};

export async function getTodayPtSessions(accessToken: string) {
  return request<TodayPtSessionsResponse>(accessToken, "/admin/pt-sessions/today");
}

export type ChecklistItem = {
  label: string;
  done: boolean;
};

export type SpecialistSessionSummary = {
  id: string;
  provider_id: string;
  provider_name: string | null;
  provider_role: string;
  session_date: string;
  start_time: string;
  session_type: string;
  attendee_user_ids: string[];
  attendee_count: number;
  group_label: string | null;
  topic: string | null;
  capacity: number | null;
  capacity_pct: number | null;
  status: string;
  prep_checklist: ChecklistItem[];
  prep_ready: boolean;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  created_at: string;
};

export type SpecialistSessionsResponse = {
  date?: string;
  window_days?: number;
  sessions: SpecialistSessionSummary[];
};

export async function createSpecialistSession(
  accessToken: string,
  payload: {
    session_date: string;
    start_time: string;
    session_type?: "individual" | "group";
    attendee_user_ids?: string[];
    group_label?: string;
    topic?: string;
    capacity?: number;
    prep_checklist_items?: string[];
  },
) {
  return request<SpecialistSessionSummary>(accessToken, "/admin/specialist-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateSpecialistSession(accessToken: string, sessionId: string, payload: { status: string }) {
  return request<SpecialistSessionSummary>(accessToken, `/admin/specialist-sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function startSpecialistSession(accessToken: string, sessionId: string) {
  return request<SpecialistSessionSummary>(accessToken, `/admin/specialist-sessions/${sessionId}/start`, {
    method: "POST",
  });
}

export async function toggleSpecialistSessionChecklistItem(
  accessToken: string,
  sessionId: string,
  payload: { label: string; done: boolean },
) {
  return request<SpecialistSessionSummary>(accessToken, `/admin/specialist-sessions/${sessionId}/checklist`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getTodaySpecialistSessions(accessToken: string) {
  return request<SpecialistSessionsResponse>(accessToken, "/admin/specialist-sessions/today");
}

export async function getUpcomingSpecialistSessions(accessToken: string, days = 14) {
  return request<SpecialistSessionsResponse>(accessToken, `/admin/specialist-sessions/upcoming?days=${days}`);
}

export type SpecialistSessionQueueSummary = {
  today_count: number;
  today_follow_up_count: number;
  today_new_count: number;
  today_prep_ready_count: number;
  week_count: number;
  week_start: string;
  week_end: string;
  avg_duration_minutes: number | null;
  duration_window_days: number;
  duration_sample_size: number;
};

export async function getSpecialistSessionQueueSummary(accessToken: string) {
  return request<SpecialistSessionQueueSummary>(accessToken, "/admin/specialist-sessions/queue-summary");
}

export async function downloadMessageAttachment(accessToken: string, messageId: string) {
  return request<RecordFileDownloadResponse>(accessToken, `/messaging/message/${messageId}/attachment`);
}


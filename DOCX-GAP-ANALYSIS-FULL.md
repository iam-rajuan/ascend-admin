# DOCX Gap Analysis — Full App

**Source:** `1. Final Ascend App Requirements (AC).docx` — all 20 sections, 31 tables.
**Checked against:** `ascend-backend` + `ascend-admin` @ `arik-dev`, 6 Sep 2026.

Every gap below was verified in code or with a live API call. Dashboard-only detail lives in [`DOCX-DASHBOARD-GAPS.md`](./DOCX-DASHBOARD-GAPS.md); this document covers the whole spec.

---

## What is fully covered

Worth stating plainly, because most of the spec is done:

| DOCX area | State |
|---|---|
| §3 / §3A Scoring — 1-4 scale, 25/50/75/100 conversion, reverse scoring, flag-only, bands, weights, cadence weighting | ✅ `scoring_config`, `question_bank_version`, `ops_snapshot` |
| §4 Recommendation engine + §5 routing thresholds (L0–L5) | ✅ configurable via `recommendation_threshold_config` |
| §7 Permission matrix | ✅ enforced three ways — `visible_components` scope config, `VIEW_ALLOWED_ROLES` on records, pathway siloing on notes |
| §10 Messaging | ✅ threads, group threads, OPSEC scan, attachments, trace |
| §12 Report templates — all 9 | ✅ every template has a real builder (see caveat below) |
| §13 Notifications | ✅ check-in, assigned action, message, provider follow-up, support request, assessment due, OFT due, compliance due, medical-record governance, export completion, safety boundary |
| §17 Specialist notes | ✅ incl. draft/signed lifecycle, redaction, reason-gated reveal |
| §18 AI insights | ✅ real Anthropic integration with a stub fallback when no API key; reviewable/overrideable |
| §2A First-use flow | ✅ `onboarding_status`, `day0_daily_checkin_status`, OPS gated until both complete |

---

## Missing — backend / data model

These need new backend work, not just wiring.

### 1. Fly Away Kit — mostly not built

DOCX data dictionary requires: `kit_id, mission_context, equipment_list, training_plan_link, recovery_guidance, created_by, export_status`.
Acceptance checklist requires: *"checklist, training plan, equipment list, and export."*

What exists is `FlyAwayKitService`, which composes emergency contacts + assigned providers + rehab status. **There is no kit model at all** — no `kit_id`, no mission context, no equipment list, no training plan link, no recovery guidance, no export.

There is also **no UI anywhere** — not Admin, not Leadership, not SCS. The one endpoint (`GET /records/fly-away-kit`) has no consumer.

### 2. Training compliance — 3 of 8 items in §14 have no fields

§14 requires **AT Level I**, **OPSEC Initial Training**, and **OPSEC Annual Refresher**, each with `due_date, completion_date, certificate_uploaded, submitted_to, submission_status` (plus `renewal_due_date` for the refresher).

`ProviderCredential` has `credential_type, issuing_body, issued_date, expiration_date` — **zero** of the required compliance fields. There is no certificate upload, no submission status, no "submitted to" party. The acceptance checklist item *"Training Compliance — tracks AT Level I, OPSEC, refresher due dates, certificates, and submission status"* is not met.

### 3. Base Access / Badge / Pass — no model

§14 compliance item requiring `request_date, approval_status, expiration_date, return_required, returned_date`. Nothing in the codebase tracks it.

### 4. QCP issue tracking — no model

§18 requires tracking *"QCP issue categories, prevention actions, corrective actions, responsible party, due date, and closure status"*, and the PRS/QCP report template lists *"corrective actions; issue categories"* as required sections.

The PRS/QCP report delivers coverage hours vs the 2,080 / 512 annual targets, the 95% evidence flag, RSD weekend coverage and assessment compliance — all correct. But **corrective actions and issue categories are absent entirely**, with no model behind them.

### 5. OPS Calculation Audit — partial, no traceability

DOCX wants `ops_audit_id, user_id, date, scoring_config_id, input_snapshot_ids, ops_score, confidence_level, missing_component_count, stale_data_flag, calculation_notes` — *"traceability for how OPS was calculated"*.

`OpsSnapshot` stores score, band, confidence level, component scores and stale components. **Missing: `scoring_config_id`, `input_snapshot_ids`, `calculation_notes`.** Since admins can change weights and thresholds at runtime, there is currently no way to tell which config version produced a historical score — which is the entire point of the audit object.

---

## Missing — wired backend, no UI

The backend works; nothing calls it.

### 6. Admin exports can only create one valid report type — live-verified bug

`exports-view.tsx` derives the report type from a free-text scope string:

```
inferReportType(scope) -> "audit_log" | "injury_trend" | "readiness_summary" | "aggregate_summary"
```

Three of those four are **not keys in the backend's `REPORT_BUILDERS`**, and the backend correctly rejects unknown types. Live test against the dev backend:

| report_type sent | Result |
|---|---|
| `aggregate_summary` | **400** |
| `readiness_summary` | **400** |
| `injury_trend` | **400** |
| `audit_log` | 201 |

So creating a recurring export from the Admin UI fails unless the scope text happens to contain the word "audit". Meanwhile **11 of the 13 real report builders** — `oft_metrics`, `utilization`, `prs_qcp`, `assessment_completion`, `leadership_aggregate_readiness`, `idmt_handoff_summary`, `medical_records_audit`, `performance_summary_export`, `wing_weekly_ops`, `monthly_cohort_review`, `annual_wing_readiness` — are unreachable from any screen.

This is the single highest-value fix in this document: all nine DOCX report templates exist and work, and the UI can reach almost none of them.

### 7. 42 API functions with no caller

Documented in [`DASHBOARD-AUDIT.md`](./DASHBOARD-AUDIT.md). The DOCX-relevant clusters:

- **§8 clinical tracking** — ROM measurements, reconditioning timeline, restrictions, OFT record, record review / access-level / field reveal
- **§8.5 IDMT** — prepare, batch prepare, transmit (only acknowledge and download are wired)
- **§8.3 utilization / workload** — PT sessions, coverage log, leave records
- **§10 messaging** — group threads, scan, trace, attachment download
- **medical history** — performance summary create / list / visibility

---

## Missing — dashboards

Full detail in [`DOCX-DASHBOARD-GAPS.md`](./DOCX-DASHBOARD-GAPS.md). Summary against §11:

| Dashboard | Required views | State |
|---|---|---|
| SCS | 11 | ✅ 11/11 |
| PT/IM | 6 | 2 ✅ · 1 ⚠️ · 3 ❌ (recovery trends, reported limitations, rehab strategy summary) |
| Specialist | 7 × 3 roles | Nutritionist/MP partial · **Chaplain returns 403 on every tab** |
| Leadership | 7 | 6 ✅ · 1 ⚠️ (support category breakdown collapsed to a single total) |
| Admin | 8 | 6 ✅ · 2 ❌ (**Teams**, **Tickets**) |

Three PT/IM gaps and the specialist follow-up gap are **rendering-only** — the data already arrives in the response and is declared in the TypeScript type, but never reaches JSX.

---

## Priority

**Blocking a DOCX role**
1. Chaplain dashboard 403 — one whole §11 dashboard role is unusable; same one-line fix already applied to MP and Nutritionist.

**Fails a DOCX acceptance item**
2. Admin exports report-type bug — 400s on 3 of 4 inputs, and hides 11 working report builders.
3. Training compliance fields — AT Level I / OPSEC / refresher with certificate + submission status.
4. QCP issue categories and corrective actions.
5. Fly Away Kit — model, fields, and any UI.
6. Base Access / Badge / Pass tracking.

**Cheap — data already in the payload**
7. PT/IM reported limitations + rehab strategy summary (render only).
8. Specialist follow-up status (render only).
9. Leadership support-category breakdown (render only).

**Needs backend, lower urgency**
10. Admin Teams view and Tickets queue.
11. OPS calculation audit traceability fields.
12. PT/IM recovery trends — `getReconditioningTimeline` is built and unwired.

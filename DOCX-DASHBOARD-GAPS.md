# DOCX Dashboard Gaps

**Source:** `1. Final Ascend App Requirements (AC).docx` — Section 11 "Dashboards" (table 25), cross-checked against Section 7 Permission Matrix (table 23) and Section 20 Acceptance Checklist (table 30).
**Checked against:** `arik-dev` @ 6 Sep 2026.
**Date:** 6 September 2026

The DOCX defines **exactly 5 dashboards**, each with a "Must Answer" question and a list of "Required Views". Every required view below was checked against the actual rendering code — not just the API layer. A field that exists in the backend response and in the TypeScript type but never reaches JSX is counted as **missing**, because the provider cannot see it.

Legend: ✅ built · ⚠️ partial · ❌ missing

---

## 1. SCS Dashboard — 11/11 ✅

> *Must answer: who checked in, missed check-ins, has low OPS, declining Physical/Sleep scores, missed workouts, limitations, PT/IM referral need, OFT or reconditioning need?*

| Required view | Status |
|---|---|
| User list | ✅ |
| OPS | ✅ |
| Readiness component scores | ✅ Physical + Sleep, gated by the admin-set `visible_components` scope config |
| Check-in status | ✅ |
| Workout adherence | ✅ |
| OFT status | ✅ |
| Reconditioning status | ✅ |
| Risk flags | ✅ incl. real L0–L5 routing level |
| Messaging | ✅ |
| Plan management | ✅ |
| Referral status | ✅ pending PT/IM referral count |

**The only DOCX-complete dashboard.** Two caveats that are not DOCX gaps: one section (14-day flight readiness chart) is still mock and badged as such, and the PT-session / leave / coverage API functions exist but are not called from any control.

---

## 2. PT/IM Dashboard — 2/6 ✅, 1 ⚠️, 3 ❌

> *Must answer: who has injury/recovery concerns, limitations, return-to-performance needs, unresolved follow-up, rehab strategy needs, or injury-report relevance?*

| Required view | Status | Detail |
|---|---|---|
| Recovery trends | ❌ | No trend or timeline anywhere in the PT/IM UI. `getReconditioningTimeline` is a real, working API function with no caller. The quarterly injury report is a *flight-level injury* trend, not a per-operator recovery trend. |
| Reported limitations | ❌ | `reported_limitation_recent` and `injury_flags` are returned by the backend row builder and declared in the TS type — but never rendered in any table. The provider cannot see who reported a limitation. |
| PT/IM follow-up | ✅ | Next review date per operator. |
| Rehab strategy summary | ❌ | Returned by the backend and declared in the type; never rendered. |
| Return-to-performance status | ⚠️ | `ptim_clearance_status` is shown. The real 4-field return-to-duty gate (`rtd_source_authority`, `rtd_decision_date`, `rtd_verified`, `rtd_reevaluation_date`, `rtd_cleared`) exists in the model and serializer but is **not included in the dashboard row at all** — so the RTP-vs-RTD distinction the DOCX draws in 2B is invisible here. |
| Export status | ✅ | IDMT handoff tab. |

**Cheapest fix in the whole audit:** three of these are data already sitting in the response object. Adding columns closes "reported limitations" and "rehab strategy summary" with no backend work.

---

## 3. Specialist Dashboard — applies to Nutritionist, Mental Performance, Chaplain

> *Must answer: who requested support, who was flagged by trends, what action was assigned, and what follow-up is pending?*

| Required view | Nutritionist | Mental Performance | Chaplain (Purpose Coach) |
|---|---|---|---|
| Assigned users | ✅ | ✅ | ❌ page 403s |
| Support requests | ✅ | ✅ | ❌ page 403s |
| Relevant readiness component status | ✅ Nutritional | ✅ Mental | ❌ page 403s |
| Relevant check-ins | ✅ 60-day meal/hydration signals + check-in count | ❌ none | ❌ |
| Action list | ⚠️ single `assigned_action_title`, not a list | ⚠️ same | ❌ |
| Messaging | ✅ | ✅ | ✅ (only working tab) |
| Follow-up status | ❌ no notes table at all | ❌ `follow_up_needed` is in the note type but never rendered | ❌ |

**Chaplain is the blocking item.** The whole dashboard returns *"You do not have permission to access this resource"* — it calls the SCS dashboard endpoint, which the Chaplain role cannot access, and a single failed fetch blanks every tab. Its reflections tab is also unwired even though `GET /reflections/{user_id}` is real and already gated to Admin + Chaplain.

**"Follow-up status" is missing for all three**, which is one of the four questions the DOCX says this dashboard must answer.

---

## 4. Leadership Dashboard — 6/7 ✅, 1 ⚠️

> *Must answer: is the program being used, where are readiness gaps, what are assessment/OFT/utilization trends, and what requires leadership attention?*

| Required view | Status |
|---|---|
| Aggregate OPS | ✅ |
| Utilization | ✅ 90-day event count |
| OFT metrics | ✅ current / exempt / scheduled / not current |
| Assessment completion | ✅ |
| Support category usage | ⚠️ `support_requests_by_pathway` is fetched with the per-pathway breakdown, then summed into a single total. The category breakdown — which is what "category usage" means — is never displayed. |
| Readiness summaries | ✅ band distribution + component averages |
| Quarterly report exports | ✅ reports library |

**Also from the acceptance checklist:** *"Equipment/Supply Gaps — app tracks shortfalls and includes them in **leadership reporting**."* Equipment gaps are in the leadership aggregate *report* (`reports_service`) and in the Admin system view, but do not appear on the leadership *dashboard*.

---

## 5. Admin Dashboard — 6/8 ✅, 2 ❌

> *Must answer: are users, roles, reports, permissions, support requests, exports, compliance items, and access controls properly managed?*

| Required view | Status | Detail |
|---|---|---|
| Accounts | ✅ | |
| Roles | ✅ | roles & RBAC + scope matrix |
| **Teams** | ❌ | No team-management view exists. There is per-user provider assignment (`assignAdminUserProvider`) and unit assignment, but no screen for teams themselves — and no admin team endpoint on the backend either. |
| **Tickets** | ❌ | No support-request queue for Admin. `SupportRequest` is a real model surfaced on specialist dashboards, but Admin — the role the DOCX says must manage support requests — has no view and no admin endpoint. |
| Access logs | ✅ | audit log view |
| Export logs | ✅ | exports view |
| Compliance / training trackers | ✅ | provider credentials + equipment gaps in system view |
| Deactivation queue | ✅ | |

Note the "Must Answer" line names **support requests** explicitly, so the missing ticket queue fails the section's own acceptance question, not just a row in the view list.

---

## Dashboards that exist but the DOCX never defines

| Dashboard | Note |
|---|---|
| **IDMT** | No DOCX dashboard row. Justifiable — Section 8.5 requires IDMT handoff logs and authorized documentation exports, and this screen delivers exactly that (list, acknowledge, download). Treat as an implementation of 8.5, not an unrequested extra. |
| **Plan** | No DOCX dashboard row and **no backend role**. Orphaned; slated for deletion. |

---

## Other DOCX items with no dashboard surface

| Acceptance-checklist item | State |
|---|---|
| **Fly Away Kits** — *"checklist, training plan, equipment list, and export"* | `GET /records/fly-away-kit` exists on the backend. **No UI anywhere** — not in Admin, not in Leadership, not in SCS. |
| **Equipment/Supply Gaps in leadership reporting** | In the leadership report and Admin system view, not on the leadership dashboard. |

---

## Priority order

1. **Chaplain dashboard 403** — a whole DOCX dashboard role is unusable. Same one-line fix already applied to MP and Nutritionist.
2. **Admin tickets queue** — fails the Admin section's own "Must Answer" question; needs a backend endpoint plus a view.
3. **PT/IM reported limitations + rehab strategy summary** — data is already in the response; this is a rendering change only.
4. **Follow-up status on specialist dashboards** — one of the four questions that dashboard must answer; `follow_up_needed` already exists on every note.
5. **PT/IM recovery trends** — `getReconditioningTimeline` is built and unwired.
6. **Admin teams view** — needs backend work; lowest urgency of the outright-missing set.
7. **Leadership support-category breakdown** — the data is already in the payload, only the rendering collapses it.
8. **Fly Away kit UI** — endpoint exists, no consumer.

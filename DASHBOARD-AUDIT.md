# Dashboard Audit — Mock Snapshot vs. Wired Build

**Date:** 3 September 2026
**Snapshot audited:** `637dab234594b94ee7e7cad1fa71fc421d35b7bc` (12 Aug 2026) — head of `new-feature-branch`
**Current build:** `20f65e88` (3 Sep 2026) — head of `arik-dev`

Every status below was confirmed with live HTTP calls against the running dev backend using each role's own test account — not inferred from reading code.

---

## Headline finding

**The snapshot is not a source of missing features. It is the direct ancestor of the current build.**

Git confirms it:

- `637dab23` **is** the merge-base between the two branches.
- `arik-dev` is **27 commits ahead** of it.
- The snapshot contains **0 commits** that `arik-dev` lacks.
- It ships **no backend layer at all** — no `role-dashboards-api.ts`, no `staff-api.ts`, no `admin-api.ts`. Its `src/lib/` holds only `constants.ts`, `env.ts`, `roles.ts`, `terminology.ts`, `utils.ts`.

Every screen in the snapshot is hardcoded mock UI (`Capt Chen`, `J. Reyes`, `L4 lower back pain`, `77`, `12 active cases`). Porting files *from* it would overwrite working, live-verified backend integration with fabricated data.

What it **is** genuinely useful for is the opposite direction: it is the original design intent. Reading it against the current build shows exactly which intended features are wired, which have real backend data sitting unused, and which never had a backend at all.

### By the numbers

| | |
|---:|---|
| **18,601** | Lines of mock UI in the snapshot, across 8 single-file dashboards |
| **0** | Backend API calls in the snapshot — the API layer does not exist there |
| **42** | Real API functions in the current build that no component ever calls |
| **1** | Role dashboard still fully broken today (Purpose Coach / Chaplain) |

---

## Role-by-role status

### 🔴 Purpose Coach / Chaplain — BROKEN, UNFIXED

*mock 1,177 → current 150 lines*

- **Broken:** calls `GET /dashboard/scs`, which only admits Admin and SCS. A real Chaplain account gets **403** — and because the page fetches through a single `Promise.all`, that one failure blanks **every tab**, not just one. Verified live today with `dash-chaplain@ascend.mil`. The correct endpoint, `GET /dashboard/specialist`, returns 200 for the same account with real Spiritual Readiness data.
- **Unwired:** the reflections tab renders a heading and nothing else. `GET /reflections/{user_id}` is real and already gated to Admin + Chaplain, but no component calls it.
- **Working:** messaging threads only.

### 🟢 PT / IM — FIXED TODAY

*mock 3,114 → current 478 lines*

- **Was broken:** `GET /admin/idmt-handoffs` excluded the PT/IM role while the prepare and transmit routes allowed it — a 403 that blanked the whole dashboard for real PT/IM staff. Fixed and verified 403 → 200.
- **Was wrong:** the records and SCS tabs called self-scoped endpoints that can only ever return the *provider's own* records and recommendations, never a patient's. Both now read caseload data the dashboard row builder already had.
- **Perf:** dashboard N+1 fixed — **27.5s → 4.0s** for 23 operators, byte-identical response.
- **Gap:** mock shows a ROM snapshot; `RomMeasurement` is a real model with a real API function that is still **never called**. Same for the reconditioning timeline and restrictions.
- **No source:** mock's structured medications, allergies and immunizations lists have no backend model — only one optional free-text field on `PerformanceSummary`. Porting them would be fabrication.

### 🟢 Mental Performance — FIXED TODAY

*mock 1,824 → current 434 lines*

- **Was broken:** called `GET /dashboard/ptim`, which does not admit Mental Performance — **403 on every tab** for every real MP user. Now on `GET /dashboard/specialist`.
- **Recovered:** `GET /dashboard/mp/mental-drivers` — a real k-gated cohort endpoint — existed on the backend but was called from nowhere. Now wired and returning real driver scores.
- **Added:** caseload-wide specialist notes, batched at the service layer, verified end to end by writing a real note through the API and reading it back.

### 🟢 Nutritionist — FIXED TODAY

*mock 2,066 → current 410 lines*

- **Was broken:** identical 403 — called the PT/IM dashboard endpoint. Verified with `dash-nutritionist@ascend.mil` before and after.
- **Recovered:** `GET /dashboard/nutrition/meal-consistency` was real but never called. Now rendered per flight, k-gated.
- **Perf:** that endpoint held the worst query pattern in the codebase — a per-flight loop with a per-member query nested inside it. Now two batched queries.
- **No source:** mock's food log, macro split and height/weight have **no backend model of any kind**. Not portable without inventing data.

### 🟢 IDMT — FIXED TODAY

*not in the mock → current 272 lines*

- **Note:** this role has **no dashboard in the snapshot at all** — it was designed and built entirely during backend integration.
- **Was inert:** the page fetched real data but was read-only. Acknowledge and download — IDMT's two core actions — had working backend routes and no UI; the acknowledge API function did not exist in the client at all.
- **Verified:** full lifecycle exercised live — transmitted an approved handoff, acknowledged it as a real IDMT account, downloaded the resulting 1,465-byte summary PDF.

### 🟡 SCS — WIRED, 1 MOCK LEFT

*mock 3,560 → current 3,765 lines*

- **Working:** the only dashboard that grew — the richest mock screen was carried across and wired rather than simplified.
- **Mock left:** one section, the 14-day flight readiness chart, is still hardcoded and correctly carries the project's `MockItemBadge` (`scs-view.tsx:1937`). It is the last marked mock in the whole app.
- **Unwired:** PT sessions, coverage log and leave records all have complete API functions that no component calls.

### 🟢 Leadership — WIRED

*mock 2,093 → current 1,386 lines across 6 files*

- **Working:** all five surfaces — index, aggregate, trends, reports, briefings — are split into real components against live endpoints.
- **Unwired:** `updateLeadershipBriefing` is the one leadership function with no caller.

### 🟢 Admin — WIRED

*mock 3,203 → current 2,894 lines across 7 files*

- **Working:** the largest mock screen, now six separate views — overview, roles, scope, audit log, exports, system — all against `admin-api.ts`.

### ⚫ Plan — ORPHANED, SLATED FOR DELETION

*mock 1,564 → current 150 lines*

- **Finding:** there is **no Plan role in the backend**, and the account-creation modal explicitly filters it out of assignable roles (`person-form-modal.tsx:61`) — no account can ever hold it. Its dashboard calls the PT/IM endpoint and would 403 for anyone but Admin or PT/IM.
- **Decision:** left untouched; the frontend developer is removing the route.

---

## The wrong-endpoint pattern

Four dashboards shared one defect: a role calling another role's endpoint. Because each page fetches through a single `Promise.all`, one 403 blanks the entire dashboard rather than degrading a single panel. Three are fixed; one remains.

| Role | Called | Should call | Live result | State |
|---|---|---|---|---|
| Mental Performance | `/dashboard/ptim` | `/dashboard/specialist` | 403 → 200 | ✅ Fixed |
| Nutritionist | `/dashboard/ptim` | `/dashboard/specialist` | 403 → 200 | ✅ Fixed |
| PT / IM | `/admin/idmt-handoffs` | same, role added | 403 → 200 | ✅ Fixed |
| **Purpose Coach** | `/dashboard/scs` | `/dashboard/specialist` | **403** | ❌ **Open** |
| Plan *(orphan)* | `/dashboard/ptim` | — no backend role | n/a | ⚫ Deleting |

---

## Backend built, never surfaced

42 functions in `role-dashboards-api.ts` are complete and correct, and no dashboard component references any of them. This is the real backlog the snapshot comparison exposes — working backend capability with no way to reach it from the UI.

**PT/IM clinical (12)**
`getRomMeasurements` · `addRomMeasurement` · `getReconditioningTimeline` · `getReconditioningRestrictions` · `addReconditioningRestriction` · `releaseReconditioningRestriction` · `getOftRecord` · `reviewUploadedRecord` · `revealRecordField` · `updateRecordAccessLevel` · `getUploadedRecordDetail` · `getUploadedRecordFile`

**Handoff workflow (4)**
`createIdmtHandoff` · `createIdmtHandoffsBatch` · `markIdmtHandoffTransmitted` · `exportQuarterlyInjuryReport`

**SCS scheduling & coverage (10)**
`createPtSession` · `updatePtSession` · `getUpcomingPtSessions` · `enrollPtSessionAttendee` · `removePtSessionAttendee` · `createCoverageLog` · `getCoverageLog` · `createLeaveRecord` · `deleteLeaveRecord` · `getLeaveHistory`

**Group messaging (7)**
`createGroupThread` · `getGroupThread` · `getGroupThreads` · `sendGroupMessage` · `scanMessage` · `getMessageTrace` · `downloadMessageAttachment`

**Cross-role (9)**
`getPerformanceSummaries` · `createPerformanceSummary` · `setPerformanceSummaryVisibility` · `signOffRecommendation` · `getActiveRecommendations` · `getRoutingLevels` · `getScopedWorkouts` · `getScopedWorkoutSummary` · `updateLeadershipBriefing`

---

## Mock features with no backend to port to

These appear in the snapshot's design but have no model behind them. Building them means either inventing data or adding new backend models first — worth naming explicitly so they are not mistaken for a wiring task.

| Mock feature | Role | Backend reality |
|---|---|---|
| Food log, macro split (C/P/F) | Nutritionist | No model exists |
| Height, weight, age/sex panel | Nutritionist | No model exists |
| Structured medications list | PT/IM | Only one free-text field on `PerformanceSummary`, access-gated |
| Allergies, immunizations lists | PT/IM | Same single field — not structured records |
| 14-day pain trend | PT/IM | No model exists |
| Caseload medical-record queue | MP, Nutritionist | Deliberately refused — support pathways are excluded from raw record access by policy (`medical_record_service.py`, `VIEW_ALLOWED_ROLES`) |

---

## What to do next

1. **Fix the Purpose Coach dashboard** *(blocking)* — it is the last role fully broken for its own users, and the fix is the same one already applied three times today. The reflections tab can be wired in the same pass.
2. **Wire the handoff workflow actions** *(high value)* — PT/IM can view handoffs but cannot prepare or transmit one from the UI, so the chain that IDMT's new acknowledge button completes cannot be started. Three ready functions, one screen.
3. **Surface the clinical records already built** *(backlog)* — ROM measurements, the reconditioning timeline and restrictions are real, tested and invisible. They are the mock's clinical depth, available without inventing anything.
4. **Do not port from the snapshot** *(guardrail)* — every file in it predates integration. Use it as a design reference for what a screen should eventually show, never as a source of code.

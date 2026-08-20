"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { AscendLogo } from "@/components/ascend-logo";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  POPULATION_LEVELS,
  PRIVACY_STATES,
  FOLLOW_UP_STATUSES,
  PERSON_TERM,
} from "@/lib/terminology";
import { PrivacyStateBadge, PRIVACY_STATE_REASON } from "@/components/privacy/privacy-state-badge";
import { PopulationScopeBadge as PopulationBadge } from "@/components/privacy/population-scope-badge";
import { IconButton } from "@/components/ui/icon-button";
import { CreateRecordModal } from "@/components/ui/create-record-modal";
import {
  Stethoscope,
  ChevronDown,
  Bell,
  Sun,
  Moon,
  Shield,
  Activity,
  ArrowLeft,
  LogOut,
  Info,
  CheckCircle,
  AlertTriangle,
  Download,
  Calendar,
  Plus,
  Send,
  Search,
  ClipboardList,
  User,
  MessageSquare,
  Sparkles,
  TrendingUp,
  FileText,
  Landmark,
  ArrowLeftRight,
  Dumbbell,
} from "lucide-react";

type TabType = "dashboard" | "injury" | "records" | "quarterly" | "scs" | "handoff";

export default function PtImDashboard() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const currentUser = useCurrentUser();
  const [activeTabInternal, setActiveTabInternal] = useState<TabType>("dashboard");
  const { theme, toggleTheme } = useTheme();
  const [hasMounted, setHasMounted] = useState(false);
  const { show: showConfirmToast, message: toastMessage, triggerToast } = useToast();

  // Detailed view states
  const [reviewingAirmanId, setReviewingAirmanId] = useState<string | null>(null);
  const [viewingRecordId, setViewingRecordId] = useState<string | null>(null);

  // ROM state controls (detail page)
  const [romFilter, setRomFilter] = useState<"SLR" | "All" | "Flex">("SLR");

  // Phase 5: J. Reyes record-detail filter pills (Full / Visit only / Clearance)
  const [recordFilter, setRecordFilter] = useState<"Full" | "Visit only" | "Clearance">("Full");

  // Phase 5: Visibility level row selection (PT/IM record detail)
  const [visibilityIndex, setVisibilityIndex] = useState<number>(0);

  // Phase 5: J. Reyes record-detail sub-tabs (Overview / ROM / Treatment plan / History / Notes)
  const [recordDetailTab, setRecordDetailTab] = useState<"Overview" | "ROM" | "Treatment plan" | "History" | "Notes">("Overview");

  // Phase 5: Quick-action toggle states
  const [showClearanceEditor, setShowClearanceEditor] = useState(false);
  const [flaggedForIdmt, setFlaggedForIdmt] = useState(false);

  // List-scoping filter pills (Phase 3 — real filtering, not toast-only)
  const [dashboardQueueFilter, setDashboardQueueFilter] = useState<"All" | "High priority" | "Limited duty" | "OFT pending">("All");
  const [injuryQueueFilter, setInjuryQueueFilter] = useState<"All" | "High priority" | "Limited duty" | "OFT pending">("All");
  const [dashboardTrendPeriod, setDashboardTrendPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [regionTrendPeriod, setRegionTrendPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [recordsFilter, setRecordsFilter] = useState<"My caseload" | "Open cases" | "Expiring access">("My caseload");
  const [quarterlyPeriod, setQuarterlyPeriod] = useState<"Q1" | "Q2" | "Q3" | "Q4">("Q3");
  const [scsFilter, setScsFilter] = useState<"Open" | "Awaiting SCS" | "Awaiting PT/IM" | "Closed">("Open");

  // Shared predicate: is an OFT action still pending (not cleared, not blocked/hold, not n/a)
  const isOftPending = (oft: string) => !["No OFT", "Hold"].includes(oft) && !oft.startsWith("Cleared");

  // Shared queue-filter predicate (dashboard widget + injury tab both use the same 3 pills)
  const matchesQueueFilter = (row: { prio: string; status: string; oft: string }, filter: "All" | "High priority" | "Limited duty" | "OFT pending") =>
    filter === "All" ? true :
    filter === "High priority" ? row.prio === "High" :
    filter === "Limited duty" ? row.status.toLowerCase().includes("limited duty") :
    isOftPending(row.oft);

  // Dashboard "Injury queue" widget rows (subset of the full injury queue)
  const dashboardQueueRows = [
    { code: "J. Reyes", details: "SrA · Flight A", type: "Lower back pain", limitation: "Sub-acute · restricted bending/lifting", prio: "High", prioCol: "red", status: "Restricted - non-deployable", sev: "L4", sevCol: "red", days: "14", oft: "Hold", oftCol: "red", isJ: true },
    { code: "D. Mendez", details: "SSgt · Flight B", type: "Ankle sprain", limitation: "No running", prio: "Medium", prioCol: "orange", status: "Limited duty · no run", sev: "L2", sevCol: "orange", days: "5", oft: "Cleared 1 Aug", oftCol: "green", isJ: false },
    { code: "T. Cho", details: "A1C · Flight A", type: "Knee strain", limitation: "Load capped", prio: "Medium", prioCol: "orange", status: "Modified - load capped", sev: "L3", sevCol: "orange", days: "9", oft: "Due 1 Aug", oftCol: "orange", isJ: false },
    { code: "B. Ndiaye", details: "A1C · Flight C", type: "Shoulder impingement", limitation: "No overhead", prio: "Low", prioCol: "teal", status: "Full duty · no overhead", sev: "L1", sevCol: "blue", days: "3", oft: "No OFT", oftCol: "slate", isJ: false },
    { code: "R. Patel", details: "SrA · Flight B", type: "Hamstring strain", limitation: "Sprint capped", prio: "Medium", prioCol: "orange", status: "Modified - sprint cap", sev: "L3", sevCol: "orange", days: "7", oft: "Pending sign-off", oftCol: "orange", isJ: false }
  ];
  const filteredDashboardQueueRows = dashboardQueueRows.filter((row) => matchesQueueFilter(row, dashboardQueueFilter));

  // Injury tab "All active cases" rows (full caseload page — 10 of 12 shown, page 1)
  const injuryQueueRows = [
    { code: "J. Reyes", details: "SrA · Flight A", type: "Lower back pain", limitation: "Sub-acute · restricted bending/lifting", prio: "High", prioCol: "red", status: "Restricted - non-deployable", sev: "L4", sevCol: "red", days: "14", oft: "Hold", oftCol: "red" },
    { code: "D. Mendez", details: "SSgt · Flight B", type: "Ankle sprain", limitation: "No running", prio: "Medium", prioCol: "orange", status: "Limited duty · no run", sev: "L2", sevCol: "orange", days: "5", oft: "Cleared 1 Aug", oftCol: "green" },
    { code: "T. Cho", details: "A1C · Flight A", type: "Knee strain", limitation: "Load capped", prio: "Medium", prioCol: "orange", status: "Modified - load capped", sev: "L3", sevCol: "orange", days: "9", oft: "Due 1 Aug", oftCol: "orange" },
    { code: "B. Ndiaye", details: "A1C · Flight C", type: "Shoulder impingement", limitation: "No overhead", prio: "Low", prioCol: "teal", status: "Full duty · no overhead", sev: "L1", sevCol: "blue", days: "3", oft: "No OFT", oftCol: "slate" },
    { code: "R. Patel", details: "SrA · Flight B", type: "Hamstring strain", limitation: "Sprint capped", prio: "Medium", prioCol: "orange", status: "Modified - sprint cap", sev: "L3", sevCol: "orange", days: "7", oft: "Pending sign-off", oftCol: "orange" },
    { code: "S. Hayes", details: "SSgt · Flight D", type: "Lumbar strain", limitation: "No lifting", prio: "Low", prioCol: "teal", status: "Limited duty · no lift", sev: "L2", sevCol: "orange", days: "2", oft: "Pre-OFT eval", oftCol: "teal" },
    { code: "R. Brooks", details: "Amn · Flight A", type: "Lateral ankle", limitation: "Braced", prio: "Low", prioCol: "teal", status: "Full duty · brace", sev: "L1", sevCol: "blue", days: "1", oft: "No OFT", oftCol: "slate" },
    { code: "E. Vega", details: "SrA · Flight C", type: "Wrist sprain", limitation: "No pushup", prio: "Low", prioCol: "teal", status: "Modified · no pushup", sev: "L2", sevCol: "orange", days: "4", oft: "No OFT", oftCol: "slate" },
    { code: "K. Park", details: "A1C · Flight B", type: "Achilles tendinitis", limitation: "Run capped", prio: "Medium", prioCol: "orange", status: "Modified · run cap", sev: "L2", sevCol: "orange", days: "6", oft: "Due 5 Aug", oftCol: "orange" },
    { code: "L. Soto", details: "SrA · Flight C", type: "Calf strain", limitation: "Pace capped", prio: "Low", prioCol: "teal", status: "Full duty · pace", sev: "L1", sevCol: "blue", days: "3", oft: "No OFT", oftCol: "slate" }
  ];
  const filteredInjuryQueueRows = injuryQueueRows.filter((row) => matchesQueueFilter(row, injuryQueueFilter));

  // Trending injury types chart — bar heights per selected day range
  const TRENDING_INJURY_TYPES_BY_PERIOD: Record<"7d" | "30d" | "90d", { label: string; pct: string }[]> = {
    "7d": [
      { label: "Lumbar", pct: "60%" }, { label: "Knee", pct: "55%" }, { label: "Ankle", pct: "70%" },
      { label: "Shoulder", pct: "40%" }, { label: "Hamstring", pct: "30%" }, { label: "Wrist", pct: "15%" }, { label: "Hip", pct: "10%" }
    ],
    "30d": [
      { label: "Lumbar", pct: "85%" }, { label: "Knee", pct: "70%" }, { label: "Ankle", pct: "60%" },
      { label: "Shoulder", pct: "50%" }, { label: "Hamstring", pct: "35%" }, { label: "Wrist", pct: "20%" }, { label: "Hip", pct: "10%" }
    ],
    "90d": [
      { label: "Lumbar", pct: "90%" }, { label: "Knee", pct: "75%" }, { label: "Ankle", pct: "55%" },
      { label: "Shoulder", pct: "60%" }, { label: "Hamstring", pct: "45%" }, { label: "Wrist", pct: "25%" }, { label: "Hip", pct: "15%" }
    ],
  };

  // Medical records list — filterable by caseload / openable / expiring access
  const recordsRows = [
    { code: "J. Reyes", details: "SrA · Flight A", enc: "28 Jul", type: "MSK · lower back", case: "INJ-0142", privacy: PRIVACY_STATES.RESTRICTED, exp: "31 Jul 18:00" },
    { code: "D. Mendez", details: "SSgt · Flight B", enc: "27 Jul", type: "MSK · ankle", case: "INJ-0139", privacy: PRIVACY_STATES.AUTH_REQUIRED, exp: "30 Jul 18:00" },
    { code: "T. Cho", details: "A1C · Flight A", enc: "26 Jul", type: "MSK · knee", case: "INJ-0136", privacy: PRIVACY_STATES.RESTRICTED, exp: "29 Jul 18:00" },
    { code: "B. Ndiaye", details: "A1C · Flight C", enc: "26 Jul", type: "MSK · shoulder", case: "INJ-0134", privacy: PRIVACY_STATES.RESTRICTED, exp: "2 Aug 18:00" },
    { code: "R. Patel", details: "SrA · Flight B", enc: "25 Jul", type: "MSK · hamstring", case: "INJ-0131", privacy: PRIVACY_STATES.ACCESS_EXPIRED, exp: "24 Jul 18:00" },
    { code: "S. Hayes", details: "SSgt · Flight D", enc: "25 Jul", type: "MSK · lumbar", case: "INJ-0129", privacy: PRIVACY_STATES.RESTRICTED, exp: "28 Jul 18:00" },
    { code: "R. Brooks", details: "Amn · Flight A", enc: "24 Jul", type: "MSK · lateral ankle", case: "INJ-0127", privacy: PRIVACY_STATES.CONSENT_REQUIRED, exp: "1 Aug 18:00" },
    { code: "E. Vega", details: "SrA · Flight C", enc: "24 Jul", type: "MSK · wrist", case: "INJ-0125", privacy: PRIVACY_STATES.RESTRICTED, exp: "27 Jul 18:00" },
    { code: "K. Park", details: "A1C · Flight B", enc: "23 Jul", type: "MSK · achilles", case: "INJ-0122", privacy: PRIVACY_STATES.CONSENT_WITHDRAWN, exp: "26 Jul 18:00" },
    { code: "L. Soto", details: "SrA · Flight C", enc: "22 Jul", type: "MSK · calf", case: "INJ-0119", privacy: PRIVACY_STATES.ACCESS_DENIED, exp: "30 Jul 18:00" }
  ];
  const filteredRecordsRows = recordsRows.filter((row) =>
    recordsFilter === "My caseload" ? true :
    recordsFilter === "Open cases" ? row.privacy === PRIVACY_STATES.RESTRICTED :
    row.privacy === PRIVACY_STATES.ACCESS_EXPIRED || row.privacy === PRIVACY_STATES.AUTH_REQUIRED
  );

  // Quarterly injury review — full per-quarter dataset (Q1–Q4 pill scopes the whole review page)
  const QUARTER_DATA: Record<"Q1" | "Q2" | "Q3" | "Q4", {
    dateRange: string;
    suppressedCount: number;
    suppressedNote: string;
    cards: { name: string; count: string; desc: string; icon: string }[];
    flightRows: { fl: string; air: string; inj: string; rate: string; l4: string; dot: string; bold?: boolean }[];
    breakdown: { type: string; count: number }[];
    recommendations: { title: string; tags: string; body: string; sub: string }[];
  }> = {
    Q1: {
      dateRange: "Oct–Dec 2025",
      suppressedCount: 2,
      suppressedNote: "“Wrist” injuries (k=2) and “Hip” injuries (k=1) are suppressed below the minimum cohort size. Suppressed values are not approximated or merged with adjacent categories.",
      cards: [
        { name: "Total injuries", count: "8", desc: "First quarter baseline", icon: "green" },
        { name: "Injury rate (per 100 airman-months)", count: "3.3", desc: "Baseline quarter", icon: "teal" },
        { name: "L4+ count", count: "2", desc: "Baseline quarter", icon: "red" },
        { name: "Days lost", count: "28", desc: "Baseline quarter", icon: "slate" }
      ],
      flightRows: [
        { fl: "Flight A", air: "22", inj: "3", rate: "4.1", l4: "1", dot: "red" },
        { fl: "Flight B", air: "21", inj: "2", rate: "2.9", l4: "0", dot: "blue" },
        { fl: "Flight C", air: "22", inj: "2", rate: "2.7", l4: "1", dot: "orange" },
        { fl: "Flight D", air: "20", inj: "1", rate: "1.5", l4: "0", dot: "blue" },
        { fl: "Total", air: "85", inj: "8", rate: "3.3", l4: "2", dot: "red", bold: true }
      ],
      breakdown: [
        { type: "Lumbar strain", count: 3 }, { type: "Ankle sprain", count: 2 }, { type: "Knee strain", count: 1 },
        { type: "Shoulder impinge", count: 1 }, { type: "Hamstring", count: 1 }
      ],
      recommendations: [
        { title: "Establish baseline lumbar pre-hab", tags: "Cohort baseline", body: "Lumbar strain is the leading category this quarter. Recommend a standing pre-hab block ahead of Q2 OFT cycle.", sub: "Owners: SCS + PT/IM · due 15 Jan" },
        { title: "Ankle taping protocol review", tags: "2 of 8 cases", body: "Ankle sprains cluster around unimproved terrain PT. Recommend reviewing taping / bracing protocol with Flight leads.", sub: "Owner: PT/IM" }
      ]
    },
    Q2: {
      dateRange: "Jan–Mar 2026",
      suppressedCount: 1,
      suppressedNote: "“Foot/toe” injuries (k=2) are suppressed below the minimum cohort size. Suppressed values are not approximated or merged with adjacent categories.",
      cards: [
        { name: "Total injuries (Q2)", count: "9", desc: "+1 vs Q1 (8)", icon: "green" },
        { name: "Injury rate (per 100 airman-months)", count: "3.7", desc: "+0.4 vs Q1", icon: "teal" },
        { name: "L4+ count", count: "2", desc: "+0 vs Q1", icon: "red" },
        { name: "Days lost", count: "35", desc: "+7 vs Q1", icon: "slate" }
      ],
      flightRows: [
        { fl: "Flight A", air: "22", inj: "3", rate: "4.1", l4: "1", dot: "red" },
        { fl: "Flight B", air: "21", inj: "2", rate: "2.9", l4: "1", dot: "orange" },
        { fl: "Flight C", air: "22", inj: "2", rate: "2.7", l4: "0", dot: "blue" },
        { fl: "Flight D", air: "20", inj: "2", rate: "3.0", l4: "0", dot: "blue" },
        { fl: "Total", air: "85", inj: "9", rate: "3.7", l4: "2", dot: "orange", bold: true }
      ],
      breakdown: [
        { type: "Lumbar strain", count: 3 }, { type: "Knee strain", count: 2 }, { type: "Ankle sprain", count: 2 },
        { type: "Shoulder impinge", count: 1 }, { type: "Hamstring", count: 1 }
      ],
      recommendations: [
        { title: "Lumbar strain trending up", tags: "Flight A, D", body: "Lumbar strain rose for the second straight quarter. Recommend hip-hinge mechanics review before Q3 OFT cycle.", sub: "Owners: SCS + PT/IM · due 15 Apr" },
        { title: "Flight B shoulder programming check", tags: "Flight B", body: "Shoulder impingement concentrated in Flight B overhead lifts. Recommend a programming review with Flight leadership.", sub: "Owner: Flight B leadership + PT/IM" }
      ]
    },
    Q3: {
      dateRange: "Apr–Jun 2026",
      suppressedCount: 2,
      suppressedNote: "“Hand” injuries (k=3) and “Foot/toe” injuries (k=2) are suppressed below the minimum cohort size. Suppressed values are not approximated or merged with adjacent categories.",
      cards: [
        { name: "Total injuries (Q3)", count: "12", desc: "+3 vs Q2 (9)", icon: "green" },
        { name: "Injury rate (per 100 airman-months)", count: "4.8", desc: "+1.1 vs Q2", icon: "teal" },
        { name: "L4+ count", count: "3", desc: "+1 vs Q2", icon: "red" },
        { name: "Days lost", count: "47", desc: "+12 vs Q2", icon: "slate" }
      ],
      flightRows: [
        { fl: "Flight A", air: "22", inj: "4", rate: "5.4", l4: "1", dot: "red" },
        { fl: "Flight B", air: "21", inj: "3", rate: "4.3", l4: "1", dot: "orange" },
        { fl: "Flight C", air: "22", inj: "3", rate: "4.1", l4: "0", dot: "blue" },
        { fl: "Flight D", air: "20", inj: "2", rate: "3.0", l4: "1", dot: "orange" },
        { fl: "Total", air: "85", inj: "12", rate: "4.8", l4: "3", dot: "red", bold: true }
      ],
      breakdown: [
        { type: "Lumbar strain", count: 5 }, { type: "Knee strain", count: 3 }, { type: "Ankle sprain", count: 3 },
        { type: "Shoulder impinge", count: 2 }, { type: "Hamstring", count: 2 }, { type: "Wrist", count: 1 }, { type: "Hip flexor", count: 1 }
      ],
      recommendations: [
        { title: "Strengthen lumbar pre-hab in PT block", tags: "Reyes, Cho, Hayes", body: "3 of 5 lumbar injuries share a load-bearing onset pattern. Recommend a 2-week pre-hab block focused on hip-hinge mechanics before next OFT cycle.", sub: "Owners: SCS + PT/IM · due 4 Aug" },
        { title: "Flight A running mileage audit", tags: "Flight A · rate 5.4", body: "Flight A carries the highest rate (5.4) and 1 L4+. Recommend a 2-week mileage audit + form review during PT block.", sub: "Owner: Flight A leadership + PT/IM" },
        { title: "Ruck progression policy refresh", tags: "≥ 25 lb loads", body: "Two L4+ cases include ruck onset > 25 lb. PT/IM recommends a staged progression rule (15 → 25 → 35 lb) and mandatory form check before each step.", sub: "Owner: SCS + PT/IM · due 11 Aug" }
      ]
    },
    Q4: {
      dateRange: "Jul–Sep 2026 (in progress)",
      suppressedCount: 3,
      suppressedNote: "“Hand” (k=1), “Foot/toe” (k=1) and “Hip” (k=2) injuries are suppressed below the minimum cohort size so far this quarter. Suppressed values are not approximated or merged with adjacent categories.",
      cards: [
        { name: "Total injuries (Q4, partial)", count: "6", desc: "-6 vs Q3 (12)", icon: "green" },
        { name: "Injury rate (per 100 airman-months)", count: "2.5", desc: "-2.3 vs Q3", icon: "teal" },
        { name: "L4+ count", count: "1", desc: "-2 vs Q3", icon: "red" },
        { name: "Days lost", count: "19", desc: "-28 vs Q3", icon: "slate" }
      ],
      flightRows: [
        { fl: "Flight A", air: "22", inj: "2", rate: "2.7", l4: "0", dot: "blue" },
        { fl: "Flight B", air: "21", inj: "1", rate: "1.4", l4: "1", dot: "orange" },
        { fl: "Flight C", air: "22", inj: "2", rate: "2.7", l4: "0", dot: "blue" },
        { fl: "Flight D", air: "20", inj: "1", rate: "1.5", l4: "0", dot: "blue" },
        { fl: "Total", air: "85", inj: "6", rate: "2.5", l4: "1", dot: "orange", bold: true }
      ],
      breakdown: [
        { type: "Lumbar strain", count: 2 }, { type: "Knee strain", count: 1 }, { type: "Ankle sprain", count: 1 },
        { type: "Shoulder impinge", count: 1 }, { type: "Hamstring", count: 1 }
      ],
      recommendations: [
        { title: "Quarter in progress — interim read only", tags: "Partial data", body: "Q4 figures reflect activity to date and will update as the quarter closes. Trend directionally down from Q3 across all flights.", sub: "Owner: PT/IM · refreshed daily" }
      ]
    }
  };
  const quarterData = QUARTER_DATA[quarterlyPeriod];

  // SCS coordination items — filterable by Open / Awaiting SCS / Awaiting PT/IM / Closed
  const [scsCoordinationRows, setScsCoordinationRows] = useState([
    { code: "J. Reyes", details: "SrA · Flight A", item: "Load cap for Rehab Block 2", trig: "Pain · lower back", aff: "Training load", owner: "PT/IM", status: FOLLOW_UP_STATUSES.DUE, detail: "Awaiting SCS response", date: "28 Jul" },
    { code: "D. Mendez", details: "SSgt · Flight B", item: "No-run clearance until 1 Aug", trig: "Limitation · ankle", aff: "Session plan", owner: "PT/IM", status: FOLLOW_UP_STATUSES.ASSIGNED, detail: "Acknowledged by SCS", date: "27 Jul" },
    { code: "T. Cho", details: "A1C · Flight A", item: "OFT retest window", trig: "Failed OFT", aff: "Assessment", owner: "SCS", status: FOLLOW_UP_STATUSES.DUE, detail: "Awaiting PT/IM response", date: "27 Jul" },
    { code: "B. Ndiaye", details: "A1C · Flight C", item: "Overhead work restriction", trig: "Limitation · shoulder", aff: "Programming", owner: "PT/IM", status: FOLLOW_UP_STATUSES.ASSIGNED, detail: "Acknowledged by PT/IM", date: "26 Jul" },
    { code: "R. Patel", details: "SrA · Flight B", item: "Sprint cap - week 2", trig: "Recovery decline", aff: "Training load", owner: "SCS", status: FOLLOW_UP_STATUSES.DUE, detail: "Awaiting PT/IM response", date: "25 Jul" },
    { code: "S. Hayes", details: "SSgt · Flight D", item: "No-lift clearance", trig: "Limitation · lumbar", aff: "Session plan", owner: "PT/IM", status: FOLLOW_UP_STATUSES.ASSIGNED, detail: "Acknowledged by SCS", date: "25 Jul" },
    { code: "E. Vega", details: "SrA · Flight C", item: "No-pushup substitution", trig: "Limitation · wrist", aff: "Programming", owner: "PT/IM", status: FOLLOW_UP_STATUSES.COMPLETED, detail: "Resolved 24 Jul", date: "24 Jul" },
    { code: "K. Park", details: "A1C · Flight B", item: "Run-volume cap - 5 Aug review", trig: "Pain · achilles", aff: "Training load", owner: "PT/IM", status: FOLLOW_UP_STATUSES.DUE, detail: "Awaiting SCS response", date: "23 Jul" }
  ] as { code: string; details: string; item: string; trig: string; aff: string; owner: string; status: string; detail: string; date: string }[]);
  const filteredScsCoordinationRows = scsCoordinationRows.filter((row) =>
    scsFilter === "Open" ? row.status !== FOLLOW_UP_STATUSES.COMPLETED :
    scsFilter === "Closed" ? row.status === FOLLOW_UP_STATUSES.COMPLETED :
    scsFilter === "Awaiting SCS" ? row.detail.includes("Awaiting SCS") :
    row.detail.includes("Awaiting PT/IM")
  );

  // Injuries by body region chart (quarterly review) — bar heights + suppression per selected day range
  const REGION_TREND_BY_PERIOD: Record<"7d" | "30d" | "90d", { label: string; pct: string; suppressed: boolean }[]> = {
    "7d": [
      { label: "Lumbar", pct: "70%", suppressed: false }, { label: "Knee", pct: "50%", suppressed: false }, { label: "Ankle", pct: "45%", suppressed: false },
      { label: "Shoulder", pct: "30%", suppressed: true }, { label: "Hamstring", pct: "25%", suppressed: true }, { label: "Wrist", pct: "15%", suppressed: true }, { label: "Hip", pct: "10%", suppressed: true }
    ],
    "30d": [
      { label: "Lumbar", pct: "85%", suppressed: false }, { label: "Knee", pct: "70%", suppressed: false }, { label: "Ankle", pct: "60%", suppressed: false },
      { label: "Shoulder", pct: "50%", suppressed: false }, { label: "Hamstring", pct: "35%", suppressed: false }, { label: "Wrist", pct: "20%", suppressed: true }, { label: "Hip", pct: "10%", suppressed: true }
    ],
    "90d": [
      { label: "Lumbar", pct: "90%", suppressed: false }, { label: "Knee", pct: "78%", suppressed: false }, { label: "Ankle", pct: "62%", suppressed: false },
      { label: "Shoulder", pct: "58%", suppressed: false }, { label: "Hamstring", pct: "42%", suppressed: false }, { label: "Wrist", pct: "28%", suppressed: false }, { label: "Hip", pct: "18%", suppressed: true }
    ],
  };

  // Clinician notes state controls
  const [newClinicianNote, setNewClinicianNote] = useState("");
  const [clinicianNotes, setClinicianNotes] = useState([
    { author: "Capt Chen · PT/IM", time: "27 Jul 13:42", note: "SLR improved to 62°, pain stable at 4. Holding Phase 2, review Monday for Phase 3 onset. No red flags." },
    { author: "Capt Chen · PT/IM", time: "24 Jul 09:10", note: `${PERSON_TERM} reports morning stiffness easing. Lift restriction limit to 20 lb temporarily per SCS request — flagged for review.` },
    { author: "Capt Chen · PT/IM", time: "22 Jul 14:55", note: "Phase 1 complete. Initiation of Phase 2 — manual therapy + mobility. NSAIDs PRN continued." },
    { author: "SSgt Lin · SCS", time: "14 Jul 08:30", note: "Hosted from SFS daily check-in. L4 back pain onset during PT. Initiated Phase 1 plan." }
  ]);

  const handleAddClinicianNote = () => {
    if (!newClinicianNote.trim()) return;
    setClinicianNotes([
      { author: "Capt Chen · PT/IM", time: "TODAY", note: newClinicianNote },
      ...clinicianNotes
    ]);
    setNewClinicianNote("");
    triggerToast("Clinician session note added successfully");
  };

  // Recent IDMT handoff packets — "New IDMT handoff" (dashboard) and "New Handoff Packet"
  // (handoff tab) both create into this same list.
  const [handoffPackets, setHandoffPackets] = useState([
    { initials: "GB", title: "Sent to G. Bates · IDMT", txt: "T. Cho — L3 knee clearance window", time: "26 Jul 14:00" },
    { initials: "JS", title: "Read by J. Saez · IDMT", txt: "OFT clearance request - Flight B", time: "25 Jul 09:30" },
    { initials: "MD", title: "Drafted · M. Donovan", txt: "R. Patel — hamstring return-to-duty", time: "24 Jul 16:18" },
    { initials: "GB", title: "Acknowledged · G. Bates", txt: "D. Mendez — L2 ankle eval report", time: "22 Jul 11:45" }
  ]);
  const [creatingHandoff, setCreatingHandoff] = useState(false);

  // Create-record modal controls (Phase 4)
  const [creatingScsItem, setCreatingScsItem] = useState(false);

  // PT1 — Add visit note (clinician SOAP)
  const [showVisitNoteModal, setShowVisitNoteModal] = useState(false);
  const [visitNotes, setVisitNotes] = useState<{ id: string; date: string; type: string; body: string }[]>([
    { id: "vn-seed-1", date: "2026-07-22", type: "Initial eval", body: "L4 lower back pain, sub-acute. Phase 1 plan initiated." }
  ]);

  // PT2 — Treatment plan note
  const [showTreatmentNoteModal, setShowTreatmentNoteModal] = useState(false);
  const [treatmentNotes, setTreatmentNotes] = useState<{ id: string; title: string; phase: string; body: string }[]>([
    { id: "tn-seed-1", title: "Phase 2 manual therapy plan", phase: "Week 1", body: "Manual therapy + mobility, 2 sessions/week. Hold for pain flare." }
  ]);

  // PT3 — New IDMT handoff (dashboard)
  const [showIdmtHandoffModal, setShowIdmtHandoffModal] = useState(false);
  const [idmtHandoffs, setIdmtHandoffs] = useState<{ id: string; date: string; recipient: string; scope: string; status: string }[]>([
    { id: "ih-seed-1", date: "2026-07-26", recipient: "IDMT", scope: "A single airman", status: "Draft" }
  ]);

  // PT4 — Raise joint coordination item
  const [showRaiseItemModal, setShowRaiseItemModal] = useState(false);
  const [coordinationItems, setCoordinationItems] = useState<{ id: string; title: string; owner: string; dueDate: string; status: string }[]>([
    { id: "ci-seed-1", title: "Sprint cap review for Flight A", owner: "SCS", dueDate: "2026-08-01", status: "Open" }
  ]);

  // PT5 — New Handoff Packet (handoff tab)
  const [showHandoffPacketModal, setShowHandoffPacketModal] = useState(false);

  // Phase 6 — Workflow action wiring (visible effect, not just triggerToast)
  // ① Reconditioning "Request review" — per-airman flag map
  const [recondReviewRequested, setRecondReviewRequested] = useState<Record<string, boolean>>({});

  // ② Bottom action strip "Flag escalation" — escalation log
  const [safetyEscalations, setSafetyEscalations] = useState<{ id: string; airmanId: string; by: string; at: string; note: string }[]>([]);

  // ③ + ⑤ Clearance update — per-airman status + audit log
  const [clearanceStatus, setClearanceStatus] = useState<Record<string, string>>({});
  const [auditLog, setAuditLog] = useState<{ id: string; type: string; airmanId: string; at: string }[]>([]);

  // ④ Quarterly "Export PDF" — generation history
  const [pdfExports, setPdfExports] = useState<{ id: string; period: string; at: string }[]>([]);

  const setActiveTab = (tab: TabType) => {
    setActiveTabInternal(tab);
    setReviewingAirmanId(null);
    setViewingRecordId(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("ascend_ptim_active_tab", tab);
    }
  };

  const activeTab = activeTabInternal;

  // Load persistent active tab on client mount
  useEffect(() => {
    const savedTab = localStorage.getItem("ascend_ptim_active_tab") as TabType | null;
    if (savedTab && ["dashboard", "injury", "records", "quarterly", "scs", "handoff"].includes(savedTab)) {
      setActiveTabInternal(savedTab);
    }
  }, []);

  // Protect route & check mount
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Protect the route: if not authenticated, redirect to /
  useEffect(() => {
    if (hasMounted && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, hasMounted, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!hasMounted || !isAuthenticated) return null;

  return (
    <div className="flex h-screen w-screen bg-[#f0f4f9] dark:bg-[#070a13] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-[#0e1628] flex flex-col justify-between border-r border-slate-200 dark:border-white/5 flex-shrink-0 z-30">
        <div>
          {/* Brand logo wrapper */}
          <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[var(--brand-color)]"></span>
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase font-sans">
                PT/IM
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION A — PERFORMANCE SUPPORT (non-clinical)                */}
          {/* Req 4: must be visually unmistakable from the clinical block  */}
          {/* below. Never allow these two workflows to blur together.     */}
          {/* ============================================================ */}
          <div className="px-5 pt-6 pb-2 flex items-center gap-1.5">
            <Dumbbell className="size-3 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase font-sans">
              Performance Support
            </span>
          </div>
          <div className="px-5 pb-2 -mt-1">
            <span className="text-[8px] text-slate-400 dark:text-slate-400 font-mono">Non-clinical · reconditioning &amp; readiness</span>
          </div>

          <nav className="px-3 space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "dashboard" && !reviewingAirmanId && !viewingRecordId
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <TrendingUp className="size-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("injury")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                (activeTab === "injury" || reviewingAirmanId) && !viewingRecordId
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <Activity className="size-4" />
              Injury queue
            </button>
            <button
              onClick={() => setActiveTab("scs")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "scs"
                  ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50/40 dark:hover:bg-slate-900/60"
              }`}
            >
              <ArrowLeftRight className="size-4" />
              SCS coordination
            </button>
          </nav>

          {/* ============================================================ */}
          {/* VISUAL DIVIDER — hard boundary between non-clinical and       */}
          {/* clinical workflows. Distinct header color + tinted panel so   */}
          {/* the two sections can never be mistaken for one another.      */}
          {/* ============================================================ */}
          <div className="mt-6 border-t-2 border-amber-500/30 dark:border-amber-500/20" />

          {/* ============================================================ */}
          {/* SECTION B — CLINICAL / REHABILITATION                        */}
          {/* Req 4 + Req 7: rehab cases, medical docs, restrictions,      */}
          {/* authorizations, RTD. Privacy-sensitive — tinted panel.       */}
          {/* ============================================================ */}
          <div className="bg-amber-500/5 dark:bg-amber-500/[0.04] pb-3 border-b border-amber-500/10 dark:border-amber-500/10">
            <div className="px-5 pt-4 pb-2 flex items-center gap-1.5">
              <Stethoscope className="size-3 text-amber-600 dark:text-amber-500" />
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-500 tracking-widest uppercase font-sans">
                Clinical / Rehabilitation
              </span>
            </div>
            <div className="px-5 pb-2 -mt-1">
              <span className="text-[8px] text-amber-700/70 dark:text-amber-500/60 font-mono">Medical record scope · access is logged</span>
            </div>

            <nav className="px-3 space-y-1">
              <button
                onClick={() => setActiveTab("records")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                  activeTab === "records" || viewingRecordId
                    ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
                }`}
              >
                <FileText className="size-4" />
                Medical Records
              </button>
              <button
                onClick={() => setActiveTab("quarterly")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                  activeTab === "quarterly"
                    ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
                }`}
              >
                <Calendar className="size-4" />
                Quarterly
              </button>
              <button
                onClick={() => setActiveTab("handoff")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                  activeTab === "handoff"
                    ? "bg-[var(--brand-color)/10] text-[var(--brand-color)]"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60"
                }`}
              >
                <Send className="size-4" />
                IDMT handoff (export)
              </button>
            </nav>
          </div>
        </div>

        {/* User Session Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 space-y-2">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            My profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50/20 dark:hover:bg-red-950/20 transition cursor-pointer"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* RIGHT WORKSPACE WRAPPER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* 1. TOP HEADER BAR */}
        <header className="flex h-14 w-full items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0e1628] px-6 md:px-8 flex-shrink-0 z-20">
          <div className="flex items-center gap-2">
            <AscendLogo width={20} height={20} showDetails={false} />
            <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">Ascend</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-light select-none">/</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">PT/IM workspace</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-slate-200 dark:border-white/5 pr-6">
              <IconButton
                icon={Bell}
                aria-label="Notifications"
                className="relative p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                iconClassName="size-4.5"
              >
                <span className="absolute top-1 right-1 size-2 rounded-full bg-[var(--brand-color)] ring-2 ring-white dark:ring-[#0e1628]"></span>
              </IconButton>
              <IconButton
                icon={theme === "light" ? Moon : Sun}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                onClick={toggleTheme}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                iconClassName="size-4.5"
              />
            </div>

            {/* Profile context */}
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="flex items-center gap-3 cursor-pointer"
              type="button"
            >
              <div className="text-right flex flex-col items-end">
                <span className="text-xs font-bold text-slate-800 dark:text-white block">{currentUser?.name}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight font-sans">{currentUser?.unit}</span>
              </div>
              <div className="size-8 rounded-full bg-emerald-500 text-white font-sans font-black text-xs flex items-center justify-center select-none border border-slate-200 dark:border-white/5">
                {currentUser?.initials}
              </div>
            </button>
          </div>
        </header>

        {/* 2. CUI ALERT STRIP */}
        <div className="h-6 w-full bg-slate-900 border-b border-slate-800 flex items-center justify-center px-6 text-[9px] font-mono tracking-wider text-slate-500 flex-shrink-0 select-none z-10 font-sans">
          <span className="text-[var(--brand-color)] mr-2 font-black">•</span>
          {viewingRecordId && "CUI // OPSEC · Records · access reason required · access logged"}
          {!viewingRecordId && reviewingAirmanId && "CUI // OPSEC · PT/IM · case details · access logged"}
          {!viewingRecordId && !reviewingAirmanId && `CUI // OPSEC · PT/IM · access logged`}
        </div>

        {/* 3. WORKSPACE MAIN VIEWPORT */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#070a13] px-6 py-8 md:px-8 space-y-8">
          
          {/* Active Record Detail View Mode (History performance summary) */}
          {viewingRecordId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 tracking-wider font-mono">PT/IM · CLINICAL / REHABILITATION · RECORDS</p>
                    <PopulationBadge level={POPULATION_LEVELS.INDIVIDUAL} />
                    <PrivacyStateBadge state={PRIVACY_STATES.RESTRICTED} />
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">Medical History Performance Summary</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Human-approved · minimum-necessary · versioned · time-limited · named audiences. Each event logs to operator profile, SCS handoff chain, and Admin audit (7-yr retention).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setViewingRecordId(null)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Back to records
                  </button>
                  <button 
                    onClick={() => { setViewingRecordId(null); triggerToast("Access authorization revoked securely"); }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-950/20 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50/20 dark:hover:bg-red-950/20 transition cursor-pointer"
                  >
                    Revoke access
                  </button>
                </div>
              </div>

              {/* Access controls honored banner */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-sans">Access controls honored</h3>
                  <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                    Authorization · expiration · denial · quarantine · download · export · audit logging
                  </p>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded-full uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500"></span>
                  All gates confirmed
                </span>
              </div>

              {/* Authorizations items grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-left font-sans text-xs">
                {[
                  { label: "Authorization", val: "Capt Chen · PT/IM", sub: "Active session · role-checked" },
                  { label: "Expiration", val: "31 Jul 18:00", sub: "Auto-revoke at expiration" },
                  { label: "Denial path", val: "RBAC enforced", sub: "403 logged on attempt" },
                  { label: "Quarantine", val: "No flags", sub: "Behavioral / overdue review" },
                  { label: "Download", val: "Allowed · reason required", sub: "Watermark applied" },
                  { label: "Export", val: "Allowed · audience named", sub: "PDF/A · logged" }
                ].map((authItem, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">{authItem.label}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block leading-tight">{authItem.val}</span>
                    <span className="text-[9px] text-slate-500 block">{authItem.sub}</span>
                  </div>
                ))}
              </div>

              {/* Access reason log strip */}
              <div className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-4 text-left text-xs leading-relaxed flex flex-col md:flex-row justify-between items-baseline md:items-center gap-4">
                <p className="text-slate-600 dark:text-slate-400 font-normal">
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">Access reason logged:</span> Pre-OFT clearance review &middot; J. Reyes (SrA) &middot; opened 27 Jul 14:02 by Capt Chen &middot; note PT/IM &middot; session #A-2207
                </p>
                <div className="flex gap-2 flex-shrink-0">
                  {["PT/IM", "IDMT", "Admin audit"].map((pill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded text-[9px] font-bold font-mono">
                      {pill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Airman context banner card */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{PERSON_TERM}</span>
                    <span className="font-bold text-slate-800 dark:text-white">J. Reyes</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Rank / Unit</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">SrA · Flight A</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Last visit</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">27 Jul 2026 · PT/IM</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Functional limitation</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Lower back — restricted bending/lifting</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Full medical record</span>
                    <span className="text-[10px] text-[var(--brand-color)] font-bold">See Records tab (Section B)</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Flight status</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Limited duty · exp 8 Aug</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Last access event</span>
                    <span className="font-bold text-[var(--brand-color)]">27 Jul 14:02 · Capt Chen</span>
                  </div>
                </div>
              </div>

              {/* Records columns grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left font-sans text-xs">
                
                {/* Left Column: Health Records Sheets */}
                <div className="lg:col-span-8 space-y-6">
                  
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
                    
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">J. Reyes &mdash; record</h3>
                      <div className="flex gap-2">
                        {(["Full", "Visit only", "Clearance"] as const).map((f, i) => (
                          <span
                            key={i}
                            onClick={() => setRecordFilter(f)}
                            className={`px-2 py-0.5 text-[8px] font-bold rounded-full uppercase cursor-pointer transition ${
                              recordFilter === f
                                ? "bg-[var(--brand-color)/15] text-[var(--brand-color)]"
                                : "bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            }`}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Immunizations */}
                    {recordFilter === "Full" && (
                    <div className="space-y-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider font-sans">Immunizations</span>
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {[
                          { title: "Influenza (quadrivalent) Lot #FLX-2241 · IM deltoid L", date: "15 Oct 2025", badge: "Current", col: "green" },
                          { title: "Tdap booster Td/Tdap · IM deltoid R", date: "03 Mar 2024", badge: "Current", col: "green" },
                          { title: "Hepatitis B series 3-dose series · titer positive", date: "2021-2022", badge: "Current", col: "green" },
                          { title: "MMR2-dose · titer positive", date: "2020", badge: "Current", col: "green" },
                          { title: "COVID-19 booster 2025-2026 formulation", date: "12 Nov 2025", badge: "Current", col: "green" }
                        ].map((imm, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-4 py-2.5">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{imm.title}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-slate-400">{imm.date}</span>
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold rounded">
                                {imm.badge}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Allergies */}
                    {recordFilter === "Full" && (
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider font-sans">Allergies & adverse reactions</span>
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {[
                          { title: "Latex Mild contact dermatitis · gloves", date: "2020", badge: "Caution", col: "orange" },
                          { title: "NKDA - drugs No known drug allergies", date: "-", badge: "None", col: "slate" }
                        ].map((all, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-4 py-2.5">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{all.title}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-slate-400">{all.date}</span>
                              <span className={`px-2 py-0.5 text-[8px] font-bold rounded ${
                                all.col === "orange" ? "bg-amber-500/15 text-amber-500" : "bg-slate-100 dark:bg-slate-900 text-slate-400"
                              }`}>
                                {all.badge}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Medications */}
                    {recordFilter === "Full" && (
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider font-sans">Medications (current)</span>
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {[
                          { title: "Naproxen 500 mg PRN · 1 tab q6h · max 3/day · pain", type: "PRN", badge: "Active", col: "green" },
                          { title: "Acetaminophen 500 mg PRN · 1-2 tabs q6h · max 8/day", type: "PRN", badge: "Active", col: "green" },
                          { title: "Multivitamin OTC · 1 daily", type: "Daily", badge: "OTC", col: "slate" }
                        ].map((med, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-4 py-2.5">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{med.title}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-slate-400">{med.type}</span>
                              <span className={`px-2 py-0.5 text-[8px] font-bold rounded ${
                                med.col === "green" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-100 dark:bg-slate-900 text-slate-400"
                              }`}>
                                {med.badge}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Prior injuries */}
                    {recordFilter === "Full" && (
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider font-sans">Prior injuries & encounters</span>
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {[
                          { title: "L2 lateral ankle sprain · 1 wk limited duty · resolved", date: "Apr 2024", badge: "Resolved", col: "green" },
                          { title: "L1 wrist strain · RSelf-limited · 4 days", date: "Sep 2023", badge: "Resolved", col: "green" },
                          { title: "URI eval Sick call · no duty restriction", date: "Jan 2025", badge: "Resolved", col: "green" }
                        ].map((inj, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-4 py-2.5">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{inj.title}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-slate-400">{inj.date}</span>
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold rounded">
                                {inj.badge}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Visit log (shown when Visit only) */}
                    {recordFilter === "Visit only" && (
                      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider font-sans">Visit log</span>
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                          {[
                            { title: "Phase 2 manual therapy", desc: "Capt Chen · \"Manual therapy + mobility, SLR 62 deg\"", date: "27 Jul 13:42", col: "green" },
                            { title: "Phase 1 closeout", desc: "Capt Chen · \"Phase 1 complete, initiate Phase 2\"", date: "22 Jul 14:55", col: "green" },
                            { title: "Initial eval", desc: "Capt Chen · \"L4 lower back pain, sub-acute, Phase 1 initiated\"", date: "14 Jul 08:30", col: "slate" }
                          ].map((vRow, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-4 py-2.5">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{vRow.title}</span>
                              <div className="flex items-center gap-3 text-right">
                                <span className="text-[10px] text-slate-500 font-sans">{vRow.desc}</span>
                                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">{vRow.date}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* OFT clearance block (shown when Clearance) */}
                    {recordFilter === "Clearance" && (
                      <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider font-sans">OFT clearance status</span>
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-bold rounded uppercase">NC · Reconditioning</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Test Date</span>
                            <span className="font-bold text-slate-800 dark:text-white">15 Jul 2026</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Status</span>
                            <span className="font-bold text-rose-500 block">NC - Not Cleared</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Score</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 block">71 / 100</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Next Due</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 block">22 Jul</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                          <span className="text-[10px] text-slate-500">Reconditioning window open · Block 1 week 1</span>
                          <div className="flex items-center gap-2">
                            {recondReviewRequested["J. Reyes"] && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/15 text-amber-500 text-[9px] font-bold rounded-full uppercase tracking-wider font-mono">
                                <span className="size-1.5 rounded-full bg-amber-500"></span>
                                Review requested · pending PT/IM
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setRecondReviewRequested((prev) => ({ ...prev, "J. Reyes": true }));
                                triggerToast("Reconditioning review request submitted to PT/IM");
                              }}
                              className="px-2.5 py-1 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Request review
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                </div>

                {/* Right Column: Visibility Summary & Log audits */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Visibility Level card */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Visibility level</h3>
                      <p className="text-[9px] text-slate-500">Restrict further before export.</p>
                    </div>

                    <div className="space-y-3 font-sans text-xs">
                      {[
                        { label: "PT/IM only", desc: "Capt Chen" },
                        { label: "PT/IM + IDMT recipient", desc: "Bates" },
                        { label: "PT/IM + SCS", desc: "Lin" },
                        { label: "Admin audit", desc: "redacted" }
                      ].map((visRow, idx) => (
                        <div
                          key={idx}
                          onClick={() => setVisibilityIndex(idx)}
                          className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                            visibilityIndex === idx
                              ? "bg-[var(--brand-color)/10] border-[var(--brand-color)/30] text-[var(--brand-color)]"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-slate-300"
                          }`}
                        >
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{visRow.label}</h4>
                          <span className="text-[9px] text-slate-500 block leading-normal mt-0.5">{visRow.desc}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-white/5">
                      Currently active scope: <span className="font-bold text-[var(--brand-color)]">{[
                        "PT/IM only",
                        "PT/IM + IDMT recipient",
                        "PT/IM + SCS",
                        "Admin audit"
                      ][visibilityIndex]}</span>
                    </p>
                  </div>

                  {/* Downloads log */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Downloads log</h3>
                      <p className="text-[9px] text-slate-500">Every export is recorded.</p>
                    </div>
                    <div className="space-y-3 font-mono text-[10px]">
                      {[
                        { name: "Record summary PDF", date: "27 Jul 13:42", note: "Capt Chen · \"Pre-OFT review\"", flag: "logged" },
                        { name: "Visit 3 note · DOCX", date: "24 Jul 09:10", note: "Capt Chen · \"Phase 2\"", flag: "logged" },
                        { name: "Clearance letter", date: "14 Jul 16:30", note: "Capt Chen · \"Limited duty\"", flag: "logged" }
                      ].map((exp, idx) => (
                        <div key={idx} className="space-y-0.5 text-left border-b border-slate-100 dark:border-white/5 pb-2 last:border-b-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-300 font-sans">{exp.name}</span>
                            <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-900 text-slate-400 text-[8px] font-bold rounded uppercase">
                              {exp.flag}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-500 block">{exp.note}</span>
                          <span className="text-[8px] text-slate-400 block">{exp.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-sans">Quick actions</h3>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setShowVisitNoteModal(true)}
                        className="w-full text-center py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      >
                        Add visit note
                      </button>
                      <button
                        onClick={() => setShowClearanceEditor((v) => !v)}
                        className="w-full text-center py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      >
                        Update clearance
                      </button>
                      <button
                        onClick={() => { setFlaggedForIdmt(true); triggerToast("IDMT handoff review request escalated"); }}
                        className="w-full text-center py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      >
                        Flag for IDMT review
                      </button>
                      <button
                        onClick={() => { setViewingRecordId(null); triggerToast("Authorizations credentials revoked"); }}
                        className="w-full text-center py-2 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-950/20 hover:bg-red-50/20 rounded-xl text-xs font-bold text-red-500 transition cursor-pointer"
                      >
                        Revoke access
                      </button>
                    </div>

                    {flaggedForIdmt && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 text-amber-500 text-[10px] font-bold rounded-full uppercase tracking-wider font-mono">
                        <span className="size-1.5 rounded-full bg-amber-500"></span>
                        Flagged for IDMT review
                      </span>
                    )}

                    {showClearanceEditor && (
                      <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider font-sans">Clearance update</span>
                          <button
                            onClick={() => setShowClearanceEditor(false)}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                            aria-label="Close clearance editor"
                          >
                            Close
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          Clearance status: <span className="font-bold text-emerald-500">PASS</span> · last updated 2026-07-12
                        </div>
                        <label className="block space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider font-sans">Reason</span>
                          <textarea
                            placeholder="Reason for clearance update (will be audit-logged)..."
                            rows={3}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-[var(--brand-color)] text-slate-800 dark:text-white placeholder-slate-400 resize-none"
                          />
                        </label>
                        <button
                          onClick={() => {
                            const airmanId = "J. Reyes";
                            const entry = {
                              id: `cu-${Date.now()}`,
                              type: "clearance.updated",
                              airmanId,
                              at: new Date().toISOString(),
                            };
                            setClearanceStatus((prev) => ({ ...prev, [airmanId]: "cleared" }));
                            setAuditLog((prev) => [entry, ...prev]);
                            triggerToast("Clearance status updated · audit-logged");
                            setShowClearanceEditor(false);
                          }}
                          className="w-full py-2 bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Submit clearance update
                        </button>
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* Summary metadata footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-4">
                Records &middot; J. Reyes &middot; session #A-2207 &middot; CUI // OPSEC &middot; 7-yr retention
              </div>

            </div>
          )}

          {/* Active Injury Profile View Mode (J. Reyes injury detail) */}
          {reviewingAirmanId && !viewingRecordId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Back navigation */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4">
                <button
                  onClick={() => setReviewingAirmanId(null)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="size-4" /> Back to injury queue
                </button>
                <PopulationBadge level={POPULATION_LEVELS.INDIVIDUAL} />
              </div>

              {/* Airman header card */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">J. Reyes</h2>
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[9px] font-bold rounded">
                        L4
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                      SrA &middot; Flight A &middot; DOB 1998-04-12 &middot; 14 days since onset
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-0.5 bg-rose-500/15 text-rose-500 text-[9px] font-bold rounded-full uppercase">Post-OFT</span>
                    <span className="px-2.5 py-0.5 bg-[var(--brand-color)/15] text-[var(--brand-color)] text-[9px] font-bold rounded-full uppercase">Limited duty</span>
                    <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-400 text-[9px] font-bold rounded-full uppercase">Audit - 4 views today</span>
                    <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 text-[9px] font-bold rounded-full uppercase">Lumbar sub-acute</span>
                  </div>
                </div>

                {/* Case details details list */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 text-xs font-sans">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Source / Date</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">SCS daily check-in</span>
                    <span className="text-[10px] text-slate-500 font-mono block">14 Jul 2026 - 08:30</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Priority</span>
                    <span className="font-bold text-rose-500 inline-flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-rose-500"></span> High
                    </span>
                    <span className="text-[10px] text-slate-500 block">L4 lower back pain - subacute</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Functional Status</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">Restricted - non-deployable</span>
                    <span className="text-[10px] text-slate-500 block">No heavy lift · no ruck &gt; 25 lb</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Severity</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">L4</span>
                    <span className="text-[10px] text-slate-500 block">Lumbar sub-acute</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Assigned PT/IM</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">Capt Chen</span>
                    <span className="text-[10px] text-slate-500 block">Primary clinician</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Assigned SCS</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">SSgt Lin</span>
                    <span className="text-[10px] text-slate-500 block">Reconditioning partner</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Follow-up dates</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">31 Jul - 7 Aug - 14 Aug</span>
                    <span className="text-[10px] text-slate-500 block font-mono">3 sessions scheduled</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">RTP status</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">Phase 2 active</span>
                    <span className="text-[10px] text-slate-500 block">Phase 3 pending sign-off</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Linked action</span>
                    <span className="font-bold text-[var(--brand-color)] block">Rehab Block 2</span>
                    <span className="text-[10px] text-slate-500 block">SCS + PT/IM · 22 Jul \u2014 8 Aug</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Authorized records</span>
                    <button type="button" className="font-bold text-[var(--brand-color)] block cursor-pointer hover:underline" onClick={() => setViewingRecordId("J. Reyes")}>Medical History Summary</button>
                    <span className="text-[10px] text-slate-500 block">PT/IM-approved · restricted</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Closure status</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">Open</span>
                    <span className="text-[10px] text-slate-500 block">Anticipated closure 21 Aug</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">IDMT export</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">Read-only handoff</span>
                    <span className="text-[10px] text-slate-500 block">Last sent 26 Jul · audit-logged</span>
                  </div>
                </div>
              </div>

              {/* RTP + RTD Paths definitions banner */}
              <div className="bg-[#f8fafc] dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 text-left text-xs space-y-3 font-sans">
                <span className="font-bold text-slate-800 dark:text-white block uppercase tracking-wider text-[9px]">RTP + RTD &mdash; separate paths</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-[var(--brand-color)] block">Return to Performance (RTP)</span>
                    <p className="text-slate-500 leading-normal font-normal">
                      Managed in Ascend: PT/IM + SCS coordinate reconditioning, training load, and progression. Current case: Phase 2 active, Phase 3 pending.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-amber-500 block">Return to Duty (RTD)</span>
                    <p className="text-slate-500 leading-normal font-normal">
                      Requires source-authority + decision date + verification + reevaluation/expiration. RTD is only surfaced when all four fields are present, and is the only path that lifts duty restriction. SCS does not edit it.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-tabs in page */}
              <div className="flex gap-4 border-b border-slate-100 dark:border-white/5 pb-2 text-xs font-bold text-left">
                {(["Overview", "ROM", "Treatment plan", "History", "Notes"] as const).map((st, i) => (
                  <span
                    key={i}
                    onClick={() => setRecordDetailTab(st)}
                    className={`cursor-pointer pb-1 border-b-2 transition ${
                      recordDetailTab === st
                        ? "border-[var(--brand-color)] text-[var(--brand-color)]"
                        : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    }`}
                  >
                    {st}
                  </span>
                ))}
              </div>

              {/* Detail logs metrics and charts stacked - rendered per active sub-tab */}
              {recordDetailTab === "Overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left font-sans text-xs">

                {/* Left Side: stats and ROM charts */}
                <div className="lg:col-span-8 space-y-6">

                  {/* Overview statistics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { name: "Pain today (0-10)", val: "4", sub: "vs start: 7", green: true },
                      { name: "SLR right", val: "62°", sub: "target: 70°+" },
                      { name: "Clearance", val: "Limited", sub: "expires 8 Aug" },
                      { name: "Sessions to date", val: "3", sub: "2 this week" }
                    ].map((st, idx) => (
                      <div key={idx} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">{st.name}</span>
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{st.val}</h4>
                        <span className={`text-[10px] block font-mono ${st.green ? "text-emerald-500" : "text-slate-500"}`}>{st.sub}</span>
                      </div>
                    ))}
                  </div>

                  {/* ROM and Pain Trend charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* ROM Graph */}
                    <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">ROM - straight-leg raise (right)</h4>
                          <p className="text-[9px] text-slate-500">5 sessions over 14 days · degrees, pain-free end-range</p>
                        </div>
                        <div className="flex gap-1.5 font-mono text-[9px]">
                          {["SLR", "All", "Flex"].map((btn) => (
                            <button
                              key={btn}
                              onClick={() => setRomFilter(btn as "SLR" | "All" | "Flex")}
                              className={`px-1.5 py-0.5 rounded transition cursor-pointer border ${
                                romFilter === btn 
                                  ? "bg-[var(--brand-color)/10] border-[var(--brand-color)/30] text-[var(--brand-color)]" 
                                  : "bg-white dark:bg-slate-900 border-slate-200 text-slate-400"
                              }`}
                            >
                              {btn}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Vertical ROM bar chart matching Figma layout */}
                      <div className="flex flex-col flex-1 justify-between pt-2">
                        {/* Bars Container */}
                        <div className="flex items-end justify-between h-36 px-2 relative">
                          {/* Target Dotted Line overlay */}
                          <div className="absolute top-[10%] left-0 right-0 border-t border-dashed border-emerald-500/50 z-10 flex items-center justify-end pr-2">
                            <span className="text-[8px] font-mono text-emerald-500 bg-white dark:bg-[#0e1628] px-1 -mt-1.5">70° target</span>
                          </div>

                          {(
                            romFilter === "SLR"
                              ? [
                                  { deg: "40°", pct: "57%" },
                                  { deg: "48°", pct: "68%" },
                                  { deg: "52°", pct: "74%" },
                                  { deg: "58°", pct: "82%" },
                                  { deg: "62°", pct: "88%" }
                                ]
                              : romFilter === "Flex"
                              ? [
                                  { deg: "32°", pct: "46%" },
                                  { deg: "38°", pct: "54%" },
                                  { deg: "44°", pct: "62%" },
                                  { deg: "48°", pct: "68%" },
                                  { deg: "52°", pct: "74%" }
                                ]
                              : [
                                  { deg: "32°", pct: "46%" },
                                  { deg: "40°", pct: "57%" },
                                  { deg: "38°", pct: "54%" },
                                  { deg: "48°", pct: "68%" },
                                  { deg: "44°", pct: "62%" },
                                  { deg: "52°", pct: "74%" },
                                  { deg: "58°", pct: "82%" },
                                  { deg: "62°", pct: "88%" }
                                ]
                          ).map((romBar, idx) => (
                            <div key={idx} className="flex flex-col justify-end items-center h-full flex-1 group z-20">
                              <div 
                                style={{ height: romBar.pct }}
                                className="w-10 bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-700 rounded-t-md transition-all duration-300 relative"
                              >
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                  {romBar.deg}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Bottom line */}
                        <div className="w-full h-px bg-slate-200 dark:bg-white/10" />

                        {/* Legend Row */}
                        <div className="flex gap-4 pt-3 text-[9px] font-bold text-slate-500 font-sans justify-start select-none">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="size-1.5 bg-blue-500 rounded-full"></span>
                            Measured &mdash; 5 sessions
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                            Target 70°
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pain Trend */}
                    <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="border-b border-slate-100 dark:border-white/5 pb-3">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Pain trend (14 days)</h4>
                        <p className="text-[9px] text-slate-500">Self-reported 0-10 &middot; trend down</p>
                      </div>

                      {/* Vertical Pain trend chart matching Figma layout */}
                      <div className="flex flex-col flex-1 justify-between pt-2">
                        {/* Bars Container */}
                        <div className="flex items-end justify-between h-36 px-2 relative">
                          {[
                            { pain: "7/10", pct: "70%" },
                            { pain: "6/10", pct: "60%" },
                            { pain: "6/10", pct: "60%" },
                            { pain: "5/10", pct: "50%" },
                            { pain: "5/10", pct: "50%" },
                            { pain: "4/10", pct: "40%" },
                            { pain: "4/10", pct: "40%" }
                          ].map((painBar, idx) => (
                            <div key={idx} className="flex flex-col justify-end items-center h-full flex-1 group z-20">
                              <div 
                                style={{ height: painBar.pct }}
                                className="w-8 bg-rose-500 dark:bg-rose-600 hover:bg-rose-700 rounded-t-md transition-all duration-300 relative"
                              >
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                  {painBar.pain}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Bottom line */}
                        <div className="w-full h-px bg-slate-200 dark:bg-white/10" />

                        {/* Bottom Spacer/Text */}
                        <div className="pt-3 text-[9px] font-bold text-slate-500 font-sans text-left select-none">
                          Self-reported pain index &middot; 14-day history
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Treatment plan timeline */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Treatment plan timeline</h3>
                        <p className="text-[10px] text-slate-500">2 sessions/week &middot; manual + mobility &middot; 5-week course</p>
                      </div>
                      <button 
                        onClick={() => triggerToast("Edit treatment plan timeline wizard opened")}
                        className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
                      >
                        Edit plan
                      </button>
                    </div>

                    <div className="space-y-4 pt-1 font-sans text-xs">
                      {[
                        { title: "PHASE 2 - SUB-ACUTE · ACTIVE", body: "Manual therapy + mobility", desc: "2 sessions/week · 28 Jul \u2014 31 Aug · progress: 3 of 12 sessions", active: true },
                        { title: "PHASE 1 - ACUTE · COMPLETE", body: "Pain control + rest", desc: "14 Jul \u2014 20 Jul · NSAIDs PRN · activity modification · pain 7 &rarr; 5", active: false, done: true },
                        { title: "PHASE 3 - LOADING · PENDING", body: "Progressive loading + return-to-run", desc: "Planned 1 Sep · sub-80% 1RM block · ruck x 25 lb · PT sign-off required", active: false },
                        { title: "PHASE 4 - RETURN-TO-DUTY · PENDING", body: "Full duty + OFT clearance", desc: "Subject to PT/IM + IDMT clearance · OFT window 5 Aug", active: false }
                      ].map((step, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`size-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                              step.active ? "bg-[var(--brand-color)]" : step.done ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                            }`}>
                              {idx + 1}
                            </div>
                            {idx < 3 && <div className="w-0.5 h-12 bg-slate-200 dark:bg-slate-800 mt-1"></div>}
                          </div>
                          <div className="space-y-1 text-left">
                            <span className={`text-[9px] font-bold font-mono tracking-wider block ${
                              step.active ? "text-[var(--brand-color)]" : step.done ? "text-emerald-500" : "text-slate-400"
                            }`}>{step.title}</span>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight font-sans">{step.body}</h4>
                            <p className="text-[10px] text-slate-500 leading-normal">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Clinician notes */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Clinician notes</h3>
                        <p className="text-[10px] text-slate-500">4 entries &middot; most recent first.</p>
                      </div>
                      <button
                        onClick={() => setShowTreatmentNoteModal(true)}
                        className="px-2.5 py-1 bg-[var(--brand-color)] hover:bg-[#0c8a99] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        + New note
                      </button>
                    </div>

                    <div className="space-y-4 pt-1 font-sans text-xs">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          aria-label="Type clinical session note"
                          placeholder="Type clinical session note..."
                          value={newClinicianNote}
                          onChange={(e) => setNewClinicianNote(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddClinicianNote()}
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-[var(--brand-color)] text-slate-800 dark:text-white placeholder-slate-400"
                        />
                      </div>

                      {clinicianNotes.map((noteRow, idx) => (
                        <div key={idx} className="p-3.5 bg-[#f8fafc] dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl space-y-1.5 text-left">
                          <div className="flex items-center justify-between gap-4 font-mono text-[9px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{noteRow.author}</span>
                            <span className="text-slate-400">{noteRow.time}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">{noteRow.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Side: avoiding blocks, ROM progress, and Access logs */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Current ROM snapshot progress */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Current ROM snapshot</h3>
                      <p className="text-[9px] text-slate-500">vs target end-range</p>
                    </div>

                    <div className="space-y-3 font-sans text-xs">
                      {[
                        { label: "SLR right", val: "62° / 70°", pct: 88 },
                        { label: "SLR left", val: "68° / 70°", pct: 97 },
                        { label: "Lumbar flex", val: "52° / 70°", pct: 74 },
                        { label: "Hip ext", val: "14° / 22°", pct: 63 }
                      ].map((snapshot, idx) => (
                        <div key={idx} className="space-y-1 text-left">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{snapshot.label}</span>
                            <span className="font-mono text-slate-800 dark:text-white">{snapshot.val}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--brand-color)] rounded-full" style={{ width: `${snapshot.pct}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Avoid until cleared warnings */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Avoid until cleared</h3>
                      <p className="text-[9px] text-slate-500">Phase 2 restrictions</p>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Heavy lifting > 80% 1RM", desc: "Block remains in effect until Phase 3 signoff." },
                        { title: "Ruck > 25 lb", desc: "Limit: Phase 3 signoff." },
                        { title: "Contact PT", desc: "No combatives until cleared." }
                      ].map((warn, i) => (
                        <div key={i} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-left space-y-1">
                          <h4 className="text-xs font-bold text-amber-600 inline-flex items-center gap-1.5">
                            <AlertTriangle className="size-3.5" />
                            {warn.title}
                          </h4>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal font-sans font-normal">{warn.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Access log */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Access log</h3>
                      <p className="text-[9px] text-slate-500">This case · last 7 days.</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-white/5 text-[9px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                            <th className="pb-2">When</th>
                            <th className="pb-2">Actor</th>
                            <th className="pb-2">Action</th>
                            <th className="pb-2 text-right">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[10px]">
                          {[
                            { time: "27 Jul 13:42", actor: "Capt Chen", act: "Updated note", reason: "Routine visit" },
                            { time: "27 Jul 07:31", actor: "Capt Chen", act: "Opened detail", reason: "Pre-visit prep" },
                            { time: "26 Jul 15:20", actor: "Capt Chen", act: "Updated plan", reason: "Phase 2 hold" },
                            { time: "25 Jul 09:30", actor: "System", act: "Routed from SCS", reason: "L4 back pain" },
                            { time: "24 Jul 09:10", actor: "Capt Chen", act: "Edited note", reason: "Ruck limit review" },
                            { time: "14 Jul 08:30", actor: "SSgt Lin", act: "Routed to PT/IM", reason: "L4 back pain" }
                          ].map((accessRow, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/20 transition">
                              <td className="py-2 text-slate-500">{accessRow.time}</td>
                              <td className="py-2 text-slate-800 dark:text-white font-sans font-bold">{accessRow.actor}</td>
                              <td className="py-2 text-slate-500 font-sans">{accessRow.act}</td>
                              <td className="py-2 text-right text-slate-500 font-sans">{accessRow.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>
              )}

              {recordDetailTab === "ROM" && (
                <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">ROM - straight-leg raise (right)</h4>
                      <p className="text-[9px] text-slate-500">5 sessions over 14 days · degrees, pain-free end-range</p>
                    </div>
                    <div className="flex gap-1.5 font-mono text-[9px]">
                      {(["SLR", "All", "Flex"] as const).map((btn) => (
                        <button
                          key={btn}
                          onClick={() => setRomFilter(btn)}
                          className={`px-1.5 py-0.5 rounded transition cursor-pointer border ${
                            romFilter === btn
                              ? "bg-[var(--brand-color)/10] border-[var(--brand-color)/30] text-[var(--brand-color)]"
                              : "bg-white dark:bg-slate-900 border-slate-200 text-slate-400"
                          }`}
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 justify-between pt-2">
                    <div className="flex items-end justify-between h-36 px-2 relative">
                      <div className="absolute top-[10%] left-0 right-0 border-t border-dashed border-emerald-500/50 z-10 flex items-center justify-end pr-2">
                        <span className="text-[8px] font-mono text-emerald-500 bg-white dark:bg-[#0e1628] px-1 -mt-1.5">70° target</span>
                      </div>
                      {(
                        romFilter === "SLR"
                          ? [
                              { deg: "40°", pct: "57%" },
                              { deg: "48°", pct: "68%" },
                              { deg: "52°", pct: "74%" },
                              { deg: "58°", pct: "82%" },
                              { deg: "62°", pct: "88%" }
                            ]
                          : romFilter === "Flex"
                          ? [
                              { deg: "32°", pct: "46%" },
                              { deg: "38°", pct: "54%" },
                              { deg: "44°", pct: "62%" },
                              { deg: "48°", pct: "68%" },
                              { deg: "52°", pct: "74%" }
                            ]
                          : [
                              { deg: "32°", pct: "46%" },
                              { deg: "40°", pct: "57%" },
                              { deg: "38°", pct: "54%" },
                              { deg: "48°", pct: "68%" },
                              { deg: "44°", pct: "62%" },
                              { deg: "52°", pct: "74%" },
                              { deg: "58°", pct: "82%" },
                              { deg: "62°", pct: "88%" }
                            ]
                      ).map((romBar, idx) => (
                        <div key={idx} className="flex flex-col justify-end items-center h-full flex-1 group z-20">
                          <div
                            style={{ height: romBar.pct }}
                            className="w-10 bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-700 rounded-t-md transition-all duration-300 relative"
                          >
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                              {romBar.deg}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="w-full h-px bg-slate-200 dark:bg-white/10" />
                    <div className="flex gap-4 pt-3 text-[9px] font-bold text-slate-500 font-sans justify-start select-none">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 bg-blue-500 rounded-full"></span>
                        Measured &mdash; 5 sessions
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                        Target 70°
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {recordDetailTab === "Treatment plan" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Treatment plan timeline</h3>
                        <p className="text-[10px] text-slate-500">2 sessions/week &middot; manual + mobility &middot; 5-week course</p>
                      </div>
                      <button
                        onClick={() => triggerToast("Edit treatment plan timeline wizard opened")}
                        className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
                      >
                        Edit plan
                      </button>
                    </div>
                    <div className="space-y-4 pt-1 font-sans text-xs">
                      {[
                        { title: "PHASE 2 - SUB-ACUTE · ACTIVE", body: "Manual therapy + mobility", desc: "2 sessions/week · 28 Jul - 31 Aug · progress: 3 of 12 sessions", active: true },
                        { title: "PHASE 1 - ACUTE · COMPLETE", body: "Pain control + rest", desc: "14 Jul - 20 Jul · NSAIDs PRN · activity modification · pain 7 -> 5", active: false, done: true },
                        { title: "PHASE 3 - LOADING · PENDING", body: "Progressive loading + return-to-run", desc: "Planned 1 Sep · sub-80% 1RM block · ruck x 25 lb · PT sign-off required", active: false },
                        { title: "PHASE 4 - RETURN-TO-DUTY · PENDING", body: "Full duty + OFT clearance", desc: "Subject to PT/IM + IDMT clearance · OFT window 5 Aug", active: false }
                      ].map((step, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`size-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                              step.active ? "bg-[var(--brand-color)]" : step.done ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                            }`}>
                              {idx + 1}
                            </div>
                            {idx < 3 && <div className="w-0.5 h-12 bg-slate-200 dark:bg-slate-800 mt-1"></div>}
                          </div>
                          <div className="space-y-1 text-left">
                            <span className={`text-[9px] font-bold font-mono tracking-wider block ${
                              step.active ? "text-[var(--brand-color)]" : step.done ? "text-emerald-500" : "text-slate-400"
                            }`}>{step.title}</span>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight font-sans">{step.body}</h4>
                            <p className="text-[10px] text-slate-500 leading-normal">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {recordDetailTab === "History" && (
                <div className="space-y-3">
                  {[
                    { who: "Capt Chen", phase: "Phase 2", date: "27 Jul 2026 · 13:42", note: "Manual therapy + mobility. SLR improved to 62°, pain stable at 4. No red flags." },
                    { who: "Capt Chen", phase: "Phase 2", date: "24 Jul 2026 · 09:10", note: "Morning stiffness easing. Lift restriction reviewed with SCS, flagged for re-eval Monday." },
                    { who: "Capt Chen", phase: "Phase 1", date: "22 Jul 2026 · 14:55", note: "Phase 1 complete. Initiation of Phase 2 - manual therapy + mobility. NSAIDs PRN continued." }
                  ].map((hRow, i) => (
                    <div key={i} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm text-left space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white">{hRow.who} <span className="text-slate-500 font-normal">· {hRow.phase}</span></h4>
                        <span className="text-[10px] font-mono text-slate-500">{hRow.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">{hRow.note}</p>
                    </div>
                  ))}
                </div>
              )}

              {recordDetailTab === "Notes" && (
                <div className="space-y-3">
                  {clinicianNotes.slice(0, 3).map((noteRow, idx) => (
                    <div key={idx} className="p-3.5 bg-[#f8fafc] dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl space-y-1.5 text-left">
                      <div className="flex items-center justify-between gap-4 font-mono text-[9px]">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{noteRow.author}</span>
                        <span className="text-slate-400">{noteRow.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">{noteRow.note}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Safety escalation banner */}
              {safetyEscalations.filter((esc) => esc.airmanId === "J. Reyes").length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 text-left">
                  <AlertTriangle className="size-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 dark:text-slate-200">
                    <span className="font-extrabold text-amber-600 dark:text-amber-500 block">
                      {safetyEscalations.filter((esc) => esc.airmanId === "J. Reyes").length} safety escalation{safetyEscalations.filter((esc) => esc.airmanId === "J. Reyes").length === 1 ? "" : "s"} on J. Reyes
                    </span>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      {safetyEscalations.filter((esc) => esc.airmanId === "J. Reyes").map((esc) => `${esc.note} (by ${esc.by} · ${esc.at.slice(0, 16).replace("T", " ")})`).join("; ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom Action strip buttons */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/5 pt-4">
                <button
                  onClick={() => {
                    const entry = {
                      id: `esc-${Date.now()}`,
                      airmanId: "J. Reyes",
                      by: "PT",
                      at: new Date().toISOString(),
                      note: "Duty restriction concern",
                    };
                    setSafetyEscalations((prev) => [entry, ...prev]);
                    triggerToast("Duty restriction safety concern escalated");
                  }}
                  className="px-3.5 py-2 border border-red-200 dark:border-red-950/20 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50/25 transition cursor-pointer"
                >
                  Flag escalation
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setViewingRecordId("J. Reyes"); setReviewingAirmanId(null); triggerToast("Opening historical Performance summaries records"); }}
                    className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition hover:bg-slate-50 cursor-pointer"
                  >
                    Open record
                  </button>
                  <button
                    onClick={() => {
                      const airmanId = "J. Reyes";
                      const entry = {
                        id: `cu-${Date.now()}`,
                        type: "clearance.updated",
                        airmanId,
                        at: new Date().toISOString(),
                      };
                      setClearanceStatus((prev) => ({ ...prev, [airmanId]: "cleared" }));
                      setAuditLog((prev) => [entry, ...prev]);
                      triggerToast("Cleared status updated");
                    }}
                    className="px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Update clearance
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left">
                Injury detail · J. Reyes · L4 lumbar · CUI // OPSEC
              </div>

            </div>
          )}

          {/* Tab 1: CLINICAL QUEUE DASHBOARD VIEW */}
          {activeTab === "dashboard" && !reviewingAirmanId && !viewingRecordId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">PT/IM · PERFORMANCE SUPPORT</p>
                    <PopulationBadge level={POPULATION_LEVELS.CASELOAD} />
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">Today&apos;s PT/IM queue</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    12 active injuries &middot; 9 follow-ups due &middot; 3 L4+ open cases. Reviewed by Capt Chen.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("records")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Records
                  </button>
                  <button
                    onClick={() => setShowIdmtHandoffModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="size-4" /> New IDMT handoff
                  </button>
                </div>
              </div>

              {/* Actionable work queues (Req 3) — priority work first, clickable, opens the filtered record set. Analytics is pushed below this section. */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-sans">Action queues</h2>
                  <span className="text-[9px] text-slate-400 font-mono">Click a queue to open its filtered list</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                  {[
                    { name: "New injury cases", count: "4", desc: "Opened in last 24h", icon: "red", tab: "injury" as TabType, toast: "Filtered injury queue: new cases" },
                    { name: "Follow-ups due", count: "9", desc: "Before 1 Aug", icon: "orange", tab: "injury" as TabType, toast: "Filtered injury queue: follow-ups due" },
                    { name: "Overdue actions", count: "3", desc: "Past due · needs action", icon: "red", tab: "injury" as TabType, toast: "Filtered injury queue: overdue actions" },
                    { name: "Unread communications", count: "5", desc: "SCS + IDMT threads", icon: "teal", tab: "scs" as TabType, toast: "Filtered SCS coordination: unread items" },
                    { name: "Plans requiring review", count: "4", desc: "2 L4+ · 1 trended cohort", icon: "slate", tab: "quarterly" as TabType, toast: "Opening quarterly review items" },
                  ].map((card, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveTab(card.tab); triggerToast(card.toast); }}
                      className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left hover:border-[var(--brand-color)/40] hover:shadow-md transition cursor-pointer"
                    >
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider font-sans">{card.name}</span>
                      <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{card.count}</h2>
                      </div>
                      <p className={`text-[10px] font-mono ${
                        card.icon === "red" ? "text-rose-500" :
                        card.icon === "orange" ? "text-amber-500" :
                        card.icon === "teal" ? "text-[var(--brand-color)]" : "text-slate-500"
                      }`}>{card.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* RTP + RTD Paths details box */}
              <div className="bg-[#f8fafc] dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 text-left text-xs space-y-3 font-sans">
                <span className="font-bold text-slate-800 dark:text-white block uppercase tracking-wider text-[9px]">RTP + RTD &mdash; separate paths</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="font-bold text-[var(--brand-color)] block">Return to Performance (RTP)</span>
                    <p className="text-slate-500 leading-normal font-normal">
                      Is managed in Ascend: PT/IM + SCS coordinate reconditioning, training load, and progression.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-amber-500 block">Return to Duty (RTD)</span>
                    <p className="text-slate-500 leading-normal font-normal">
                      requires source-authority + decision date + verification + reevaluation/expiration. RTD is only surfaced when all four fields are present, and is the only path that lifts duty restriction.
                    </p>
                  </div>
                </div>
              </div>

              {/* Partial Injury queue roster */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Injury queue</h3>
                    <p className="text-[10px] text-slate-500">12 active · sorted by priority then functional status. Click a row to open the case.</p>
                  </div>

                  <div className="flex gap-2">
                    {(["All", "High priority", "Limited duty", "OFT pending"] as const).map((fPill, idx) => (
                      <button
                        key={idx}
                        onClick={() => setDashboardQueueFilter(fPill)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          dashboardQueueFilter === fPill
                            ? "bg-[var(--brand-color)/10] border-[var(--brand-color)/30] text-[var(--brand-color)]"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {fPill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 w-1/4">Airman</th>
                        <th className="pb-3">Injury Type</th>
                        <th className="pb-3">Priority</th>
                        <th className="pb-3">Functional Status</th>
                        <th className="pb-3">Severity</th>
                        <th className="pb-3">Days out</th>
                        <th className="pb-3">OFT Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredDashboardQueueRows.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-slate-400 text-[11px]">No cases match this filter.</td>
                        </tr>
                      )}
                      {filteredDashboardQueueRows.map((row, idx) => (
                        <tr
                          key={idx}
                          onClick={() => {
                            setReviewingAirmanId(row.code);
                            triggerToast(`Selected case: ${row.code}`);
                          }}
                          className="hover:bg-slate-50/20 transition cursor-pointer"
                        >
                          <td className="py-3.5">
                            <span className="font-bold text-slate-800 dark:text-white block">{row.code}</span>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{row.details}</span>
                          </td>
                          <td className="py-3.5">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block">{row.type}</span>
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{row.limitation}</span>
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-1.5 font-bold ${
                              row.prioCol === "red" ? "text-rose-500" :
                              row.prioCol === "orange" ? "text-amber-500" : "text-[var(--brand-color)]"
                            }`}>
                              <span className={`size-1.5 rounded-full ${
                                row.prioCol === "red" ? "bg-rose-500" :
                                row.prioCol === "orange" ? "bg-amber-500" : "bg-[var(--brand-color)]"
                              }`}></span>
                              {row.prio}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-700 dark:text-slate-300">{row.status}</td>
                          <td className="py-3.5 font-bold">
                            <span className={
                              row.sevCol === "red" ? "text-rose-500" :
                              row.sevCol === "orange" ? "text-amber-500" : "text-[var(--brand-color)]"
                            }>{row.sev}</span>
                          </td>
                          <td className="py-3.5 font-mono text-[10px] text-slate-500">{row.days}</td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              row.oftCol === "red" ? "bg-rose-500/10 text-rose-500" :
                              row.oftCol === "green" ? "bg-emerald-500/10 text-emerald-500" :
                              row.oftCol === "orange" ? "bg-amber-500/10 text-amber-500" :
                              "bg-slate-100 dark:bg-slate-900 text-slate-400"
                            }`}>
                              {row.oft}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReviewingAirmanId(row.code);
                                triggerToast(`Reviewing medical case files for: ${row.code}`);
                              }}
                              className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500">Showing {filteredDashboardQueueRows.length} of 12</span>
                  <button type="button" className="text-[var(--brand-color)] font-bold cursor-pointer hover:underline" onClick={() => setActiveTab("injury")}>View all &rarr;</button>
                </div>
              </div>

              {/* Analytics — pushed below the action queues per Req 3 */}
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-sans">Analytics</h2>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

                {/* Trending injury types bar chart */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <div className="text-left">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Trending injury types</h3>
                      <p className="text-[9px] text-slate-500">Last {dashboardTrendPeriod === "7d" ? "7 days" : dashboardTrendPeriod === "30d" ? "30 days" : "90 days"} &middot; by ICD-10 category &middot; k&ge;5 enforced</p>
                    </div>

                    <div className="flex gap-1.5 font-mono text-[9px]">
                      {(["7d", "30d", "90d"] as const).map((dayF) => (
                        <button key={dayF} type="button" onClick={() => setDashboardTrendPeriod(dayF)} className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          dashboardTrendPeriod === dayF
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                            : "text-slate-400"
                        }`}>
                          {dayF}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vertical bar chart matching Figma layout */}
                  <div className="flex flex-col flex-1 justify-between pt-4">

                    {/* Chart Group (Bars, Line, Labels stay aligned together) */}
                    <div className="space-y-0">
                      {/* Bars Container */}
                      <div className="flex items-end justify-between h-36 px-2">
                        {TRENDING_INJURY_TYPES_BY_PERIOD[dashboardTrendPeriod].map((bar, idx) => (
                          <div key={idx} className="flex flex-col justify-end items-center h-full flex-1 group">
                            {/* Bar block */}
                            <div
                              style={{ height: bar.pct }}
                              className="w-8 sm:w-10 bg-[var(--brand-color)] dark:bg-[#0c8a99] hover:bg-[#0b7a87] rounded-t-md transition-all duration-300 relative"
                            >
                              {/* Hover tooltip */}
                              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20">
                                {bar.pct}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bottom Line Indicator */}
                      <div className="w-full h-px bg-slate-200 dark:bg-white/10" />

                      {/* Labels Row */}
                      <div className="flex justify-between px-2 pt-2 select-none">
                        {TRENDING_INJURY_TYPES_BY_PERIOD[dashboardTrendPeriod].map((bar, idx) => (
                          <span key={idx} className="text-[10px] text-slate-500 font-bold flex-1 text-center font-sans">
                            {bar.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Legend Row */}
                    <div className="flex flex-wrap gap-4 pt-3 text-[9px] font-bold text-slate-500 justify-start select-none">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 bg-blue-500 rounded-full"></span>
                        Lumbar &mdash; leading, +2 wk/wk
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                        Knee &mdash; stable
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 bg-cyan-500 rounded-full"></span>
                        Ankle &mdash; declining
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right columns widgets stack */}
                <div className="lg:col-span-6 flex flex-col gap-6">
                  
                  {/* OFT Clearance widget */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4 flex-1">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">OFT clearance due</h3>
                      <p className="text-[9px] text-slate-500">9 due before 1 Aug &middot; 3 cleared this week</p>
                    </div>

                    <div className="space-y-3 font-sans text-xs">
                      {[
                        { name: "T. Cho", detail: "OFT 6 Aug - Flight A", due: "Due 1 Aug" },
                        { name: "R. Patel", detail: "OFT 7 Aug - Flight B", due: "Due 1 Aug" },
                        { name: "S. Hayes", detail: "OFT 9 Aug - Flight D", due: "Due 4 Aug" },
                        { name: "E. Vega", detail: "OFT 12 Aug - Flight C", due: "Due 6 Aug" }
                      ].map((oftItem, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4 border-b border-slate-50 dark:border-white/5 pb-2 last:border-0 last:pb-0">
                          <div className="text-left space-y-0.5">
                            <span className="font-bold text-slate-800 dark:text-white">{oftItem.name}</span>
                            <span className="text-[9px] text-slate-500 block">{oftItem.detail}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-bold rounded font-mono uppercase">
                              {oftItem.due}
                            </span>
                            <button 
                              onClick={() => { setReviewingAirmanId(oftItem.name === "T. Cho" ? "T. Cho" : "J. Reyes"); triggerToast(`Reviewing clearance details`); }}
                              className="px-2.5 py-1 border border-slate-200 dark:border-white/10 hover:bg-slate-50 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-lg transition"
                            >
                              Open
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Handoffs widget */}
                  <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4 flex-1">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">Recent handoffs</h3>
                        <p className="text-[9px] text-slate-500">Read-receipted IDMT channel</p>
                      </div>
                      <button type="button" className="text-[var(--brand-color)] hover:underline text-[10px] font-bold cursor-pointer font-mono" onClick={() => setActiveTab("handoff")}>
                        All &rarr;
                      </button>
                    </div>

                    <div className="space-y-3.5 font-sans text-xs">
                      {[
                        { initials: "GB", title: "Sent to G. Bates · IDMT", txt: "T. Cho \u2014 L3 knee clearance window", time: "26 Jul 14:00" },
                        { initials: "JS", title: "Read by J. Saez · IDMT", txt: "OFT clearance request - Flight B", time: "25 Jul 09:30" },
                        { initials: "MD", title: "Drafted · M. Donovan", txt: "R. Patel \u2014 hamstring return-to-duty", time: "24 Jul 16:18" },
                        { initials: "GB", title: "Acknowledged · G. Bates", txt: "D. Mendez \u2014 L2 ankle eval report", time: "22 Jul 11:45" }
                      ].map((ho, idx) => (
                        <div key={idx} className="flex gap-2.5 border-b border-slate-50 dark:border-white/5 pb-2 last:border-0 last:pb-0">
                          <div className="size-6 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold text-[8px] flex items-center justify-center font-mono select-none">
                            {ho.initials}
                          </div>
                          <div className="text-left space-y-0.5">
                            <div className="flex items-baseline justify-between gap-4">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{ho.title}</span>
                              <span className="text-[8px] font-mono text-slate-400">{ho.time}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate w-64 leading-normal">{ho.txt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Refresh Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-4">
                Dashboard &middot; last refresh 27 Jul 14:02 · CUI // OPSEC
              </div>

            </div>
          )}

          {/* Tab 2: INJURY QUEUE LIST VIEW */}
          {activeTab === "injury" && !reviewingAirmanId && !viewingRecordId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">PT/IM · PERFORMANCE SUPPORT · INJURY QUEUE</p>
                    <PopulationBadge level={POPULATION_LEVELS.CASELOAD} />
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">Injury queue</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    12 active cases sorted by priority then functional status. Opening a case is audit logged.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("records")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Records
                  </button>
                  <button 
                    onClick={() => { setReviewingAirmanId("J. Reyes"); triggerToast("Opening next priority case: J. Reyes"); }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Open next case
                  </button>
                </div>
              </div>

              {/* Metrics stack */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { name: "Active patients", count: "87", desc: "+3 this week", icon: "green" },
                  { name: "Injury queue", count: "12", desc: "+2 · 3 high-priority", icon: "teal" },
                  { name: "OFT clearance due", count: "9", desc: "-3 cleared this week", icon: "red" },
                  { name: "Quarterly review items", count: "4", desc: "2 L4+ · 1 trended cohort", icon: "slate" }
                ].map((card, i) => (
                  <div key={i} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider font-sans">{card.name}</span>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{card.count}</h2>
                      <span className={`text-[10px] font-bold ${
                        card.icon === "green" ? "text-emerald-500" :
                        card.icon === "teal" ? "text-[var(--brand-color)]" :
                        card.icon === "red" ? "text-rose-500" : "text-slate-500"
                      }`}>
                        {card.desc.split(" · ")[0]}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">{card.desc}</p>
                  </div>
                ))}
              </div>

              {/* Active cases table */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">All active cases &middot; 12</h3>
                    <p className="text-[10px] text-slate-500">Sorted by priority then functional status. Click a row to open the case.</p>
                  </div>

                  <div className="flex gap-2">
                    {(["All", "High priority", "Limited duty", "OFT pending"] as const).map((fPill, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInjuryQueueFilter(fPill)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          injuryQueueFilter === fPill
                            ? "bg-[var(--brand-color)/10] border-[var(--brand-color)/30] text-[var(--brand-color)]"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {fPill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 w-1/4">Airman</th>
                        <th className="pb-3">Injury Type</th>
                        <th className="pb-3">Priority</th>
                        <th className="pb-3">Functional Status</th>
                        <th className="pb-3">Severity</th>
                        <th className="pb-3">Days out</th>
                        <th className="pb-3">OFT Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredInjuryQueueRows.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-slate-400 text-[11px]">No cases match this filter.</td>
                        </tr>
                      )}
                      {filteredInjuryQueueRows.map((row, idx) => (
                        <tr
                          key={idx}
                          onClick={() => {
                            setReviewingAirmanId(row.code);
                            triggerToast(`Selected case: ${row.code}`);
                          }}
                          className="hover:bg-slate-50/20 transition cursor-pointer"
                        >
                          <td className="py-3.5">
                            <span className="font-bold text-slate-800 dark:text-white block">{row.code}</span>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{row.details}</span>
                          </td>
                          <td className="py-3.5">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block">{row.type}</span>
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{row.limitation}</span>
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-1.5 font-bold ${
                              row.prioCol === "red" ? "text-rose-500" :
                              row.prioCol === "orange" ? "text-amber-500" : "text-[var(--brand-color)]"
                            }`}>
                              <span className={`size-1.5 rounded-full ${
                                row.prioCol === "red" ? "bg-rose-500" :
                                row.prioCol === "orange" ? "bg-amber-500" : "bg-[var(--brand-color)]"
                              }`}></span>
                              {row.prio}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-700 dark:text-slate-300">{row.status}</td>
                          <td className="py-3.5 font-bold">
                            <span className={
                              row.sevCol === "red" ? "text-rose-500" :
                              row.sevCol === "orange" ? "text-amber-500" : "text-[var(--brand-color)]"
                            }>{row.sev}</span>
                          </td>
                          <td className="py-3.5 font-mono text-[10px] text-slate-500">{row.days}</td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              row.oftCol === "red" ? "bg-rose-500/10 text-rose-500" :
                              row.oftCol === "green" ? "bg-emerald-500/10 text-emerald-500" :
                              row.oftCol === "orange" ? "bg-amber-500/10 text-amber-500" :
                              row.oftCol === "teal" ? "bg-teal-500/10 text-teal-500" :
                              "bg-slate-100 dark:bg-slate-900 text-slate-400"
                            }`}>
                              {row.oft}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReviewingAirmanId(row.code);
                                triggerToast(`Reviewing medical case files for: ${row.code}`);
                              }}
                              className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                  <span className="text-[10px] text-slate-500 font-mono">{filteredInjuryQueueRows.length === 0 ? "0" : `1–${Math.min(10, filteredInjuryQueueRows.length)}`} of {filteredInjuryQueueRows.length === injuryQueueRows.length ? "12" : filteredInjuryQueueRows.length}</span>
                  <div className="flex items-center gap-1">
                    <button className="p-1 px-2 border border-slate-200 dark:border-white/5 text-[10px] text-slate-400 rounded hover:bg-slate-50">&lt;</button>
                    <button className="p-1 px-2 border border-slate-200 dark:border-white/10 text-[10px] text-[var(--brand-color)] font-bold rounded bg-[var(--brand-color)/10]">1</button>
                    <button className="p-1 px-2 border border-slate-200 dark:border-white/5 text-[10px] text-slate-500 rounded hover:bg-slate-50">2</button>
                    <button className="p-1 px-2 border border-slate-200 dark:border-white/5 text-[10px] text-slate-500 rounded hover:bg-slate-50">&gt;</button>
                  </div>
                </div>

              </div>

              {/* Refresh Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-4">
                Injury queue &middot; last refresh 27 Jul 14:02 · CUI // OPSEC
              </div>

            </div>
          )}

          {/* Tab 3: MEDICAL RECORDS LIST VIEW */}
          {activeTab === "records" && !viewingRecordId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 tracking-wider">PT/IM · CLINICAL / REHABILITATION</p>
                    <PopulationBadge level={POPULATION_LEVELS.CASELOAD} />
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">Medical records</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Records you are authorized to open, scoped to your PT/IM caseload. Opening a record requires a logged access reason and is minimum-necessary by default.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("injury")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Injury queue
                  </button>
                </div>
              </div>

              {/* Privacy block */}
              <div className="bg-[#e0f2fe]/40 dark:bg-sky-950/5 border border-[#bae6fd]/40 dark:border-white/5 rounded-2xl p-5 text-left flex gap-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <Shield className="size-5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold font-sans text-xs">Clinical / Rehabilitation &middot; PT/IM scope only</span>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400 font-normal">
                    This list shows musculoskeletal and encounter history for airmen assigned to you. Mental-performance notes, nutrition logs and purpose reflections are held by their own roles and are not reachable from here. Every record shows a privacy state — access is never rendered blank, a reason is always given.
                  </p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Authorized records &middot; 12</h3>
                    <p className="text-[10px] text-slate-500">Sorted by last encounter &middot; every open is audit logged</p>
                  </div>

                  <div className="flex gap-2">
                    {(["My caseload", "Open cases", "Expiring access"] as const).map((rf, idx) => (
                      <button
                        key={idx}
                        onClick={() => setRecordsFilter(rf)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          recordsFilter === rf
                            ? "bg-[var(--brand-color)/10] border-[var(--brand-color)/30] text-[var(--brand-color)]"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {rf}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 w-1/4">Airman</th>
                        <th className="pb-3">Last encounter</th>
                        <th className="pb-3">Record Type</th>
                        <th className="pb-3">Linked case</th>
                        <th className="pb-3">Privacy state</th>
                        <th className="pb-3">Access expires</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredRecordsRows.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400 text-[11px]">No records match this filter.</td>
                        </tr>
                      )}
                      {filteredRecordsRows.map((row, idx) => {
                        const openable = row.privacy === PRIVACY_STATES.RESTRICTED;
                        return (
                        <tr key={idx} className="hover:bg-slate-50/20 transition">
                          <td className="py-3">
                            <span className="font-bold text-slate-800 dark:text-white block">{row.code}</span>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{row.details}</span>
                          </td>
                          <td className="py-3 text-slate-700 dark:text-slate-300 font-mono">{row.enc}</td>
                          <td className="py-3 text-slate-500 font-medium">{row.type}</td>
                          <td className="py-3 font-mono text-slate-700 dark:text-slate-300">{row.case}</td>
                          <td className="py-3">
                            <div className="flex flex-col gap-0.5">
                              <PrivacyStateBadge state={row.privacy} />
                              <span className="text-[8px] text-slate-400 leading-tight max-w-[160px]">{PRIVACY_STATE_REASON[row.privacy]}</span>
                            </div>
                          </td>
                          <td className="py-3 text-slate-500 font-mono">{row.exp}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                if (openable) {
                                  setViewingRecordId(row.code);
                                  triggerToast(`Access audited: opening Performance Summary for ${row.code}`);
                                } else {
                                  triggerToast(`${row.privacy}: ${PRIVACY_STATE_REASON[row.privacy]}`);
                                }
                              }}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                openable
                                  ? "bg-[var(--brand-color)] hover:bg-[#0c8a99] text-white"
                                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                              }`}
                            >
                              {openable ? "Open" : "Request access"}
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                  <span className="text-[10px] text-slate-500 font-mono">{filteredRecordsRows.length === 0 ? "0" : `1–${Math.min(10, filteredRecordsRows.length)}`} of {filteredRecordsRows.length === recordsRows.length ? "12" : filteredRecordsRows.length}</span>
                  <div className="flex items-center gap-1">
                    <button className="p-1 px-2 border border-slate-200 dark:border-white/5 text-[10px] text-slate-400 rounded hover:bg-slate-50">&lt;</button>
                    <button className="p-1 px-2 border border-slate-200 dark:border-white/10 text-[10px] text-[var(--brand-color)] font-bold rounded bg-[var(--brand-color)/10]">1</button>
                    <button className="p-1 px-2 border border-slate-200 dark:border-white/5 text-[10px] text-slate-500 rounded hover:bg-slate-50">2</button>
                    <button className="p-1 px-2 border border-slate-200 dark:border-white/5 text-[10px] text-slate-500 rounded hover:bg-slate-50">&gt;</button>
                  </div>
                </div>

              </div>

              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-2">
                Access reason required on open · 7-yr audit retention &middot; IDMT handoff &rarr;
              </div>

            </div>
          )}

          {/* Tab 4: QUARTERLY REVIEW VIEW */}
          {activeTab === "quarterly" && !reviewingAirmanId && !viewingRecordId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 tracking-wider">PT/IM · CLINICAL / REHABILITATION · QUARTERLY REVIEW</p>
                    <PopulationBadge level={POPULATION_LEVELS.COHORT} />
                    <PopulationBadge level={POPULATION_LEVELS.UNIT} />
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">{quarterlyPeriod} injury review</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Aggregate injury trends &middot; no individual exposure &middot; k&ge;5 per cohort &middot; {quarterData.dateRange}.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/5 p-1 bg-white dark:bg-slate-900 text-[10px] font-bold font-mono">
                    {(["Q1", "Q2", "Q3", "Q4"] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => { setQuarterlyPeriod(q); triggerToast(`Displaying ${q} injury trends`); }}
                        className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                          quarterlyPeriod === q
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const entry = {
                        id: `pdf-${Date.now()}`,
                        period: quarterlyPeriod,
                        at: new Date().toISOString(),
                      };
                      setPdfExports((prev) => [entry, ...prev]);
                      triggerToast(`${quarterlyPeriod} Injury Review Summary PDF downloaded successfully`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Export PDF
                  </button>
                </div>
              </div>

              {/* PDF generation counter */}
              {pdfExports.length > 0 && (
                <div className="text-[10px] text-slate-500 font-mono text-left">
                  PDFs generated: {pdfExports.length} · most recent {quarterlyPeriod} at {pdfExports[0].at.slice(0, 16).replace("T", " ")}
                </div>
              )}

              {/* Suppression details banner */}
              <div className="bg-[#f8fafc] dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 text-left flex gap-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <span className="size-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 select-none">k</span>
                <div>
                  <span className="font-extrabold font-sans text-xs">k&ge;5 enforced &middot; {quarterData.suppressedCount} cohorts suppressed</span>
                  <p className="mt-0.5 text-slate-500 leading-normal font-normal">
                    {quarterData.suppressedNote}
                  </p>
                </div>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {quarterData.cards.map((card, i) => (
                  <div key={i} className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider font-sans">{card.name}</span>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{card.count}</h2>
                      <span className={`text-[10px] font-bold ${
                        card.icon === "green" ? "text-emerald-500" :
                        card.icon === "teal" ? "text-[var(--brand-color)]" :
                        card.icon === "red" ? "text-rose-500" : "text-slate-500"
                      }`}>
                        {card.desc.split(" vs ")[0]}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">{card.desc}</p>
                  </div>
                ))}
              </div>

              {/* Body region chart and comparison table splits grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Injuries by body region (k>=5) */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <div className="text-left">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Injuries by body region (k&ge;5)</h3>
                      <p className="text-[9px] text-slate-500">{REGION_TREND_BY_PERIOD[regionTrendPeriod].filter((b) => !b.suppressed).length} categories &ge; 5 &middot; {REGION_TREND_BY_PERIOD[regionTrendPeriod].filter((b) => b.suppressed).length} suppressed.</p>
                    </div>

                    <div className="flex gap-1.5 font-mono text-[9px]">
                      {(["7d", "30d", "90d"] as const).map((dayF) => (
                        <button key={dayF} type="button" onClick={() => setRegionTrendPeriod(dayF)} className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          regionTrendPeriod === dayF
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                            : "text-slate-400"
                        }`}>
                          {dayF}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vertical bar chart matching Figma layout */}
                  <div className="flex flex-col flex-1 justify-between pt-4">

                    {/* Bars Container */}
                    <div className="flex items-end justify-between h-36 px-2">
                      {REGION_TREND_BY_PERIOD[regionTrendPeriod].map((bar, idx) => (
                        <div key={idx} className="flex flex-col justify-end items-center h-full flex-1 group">
                          {/* Bar block */}
                          <div
                            style={{ height: bar.pct }}
                            className={`w-8 sm:w-10 rounded-t-md transition-all duration-300 relative ${
                              bar.suppressed
                                ? "bg-[var(--brand-color)/30] dark:bg-[#0c8a99]/30"
                                : "bg-[var(--brand-color)] dark:bg-[#0c8a99] hover:bg-[#0b7a87]"
                            }`}
                          >
                            {/* Hover tooltip */}
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20">
                              {bar.pct}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Line Indicator */}
                    <div className="w-full h-px bg-slate-200 dark:bg-white/10" />

                    {/* Labels Row */}
                    <div className="flex justify-between px-2 pt-2 select-none">
                      {REGION_TREND_BY_PERIOD[regionTrendPeriod].map((bar, idx) => (
                        <span key={idx} className="text-[10px] text-slate-500 font-bold flex-1 text-center font-sans">
                          {bar.label}
                        </span>
                      ))}
                    </div>

                    {/* Legend Row */}
                    <div className="flex flex-wrap gap-4 pt-3 text-[9px] font-bold text-slate-500 justify-start select-none">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 bg-blue-500 rounded-full"></span>
                        Lumbar &mdash; leading cause (n=5)
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                        Shoulder &mdash; trending up
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                        Suppressed (k&lt;5)
                      </span>
                    </div>
                  </div>

                </div>

                {/* By-flight comparison table */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
                  <div className="border-b border-slate-100 dark:border-white/5 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">By-flight comparison</h3>
                    <p className="text-[9px] text-slate-500">Rate per 100 airman-months &middot; {quarterlyPeriod}.</p>
                  </div>

                  <div className="overflow-x-auto my-3 flex-1 flex flex-col justify-center">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-3">Flight</th>
                          <th className="pb-3 text-right">Airman</th>
                          <th className="pb-3 text-right">Injuries</th>
                          <th className="pb-3 text-right">Rate</th>
                          <th className="pb-3 text-right">L4+</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {quarterData.flightRows.map((row, idx) => (
                          <tr key={idx} className={`hover:bg-slate-50/20 transition ${row.bold ? "font-extrabold text-slate-800 dark:text-white" : ""}`}>
                            <td className="py-2.5 font-bold">{row.fl}</td>
                            <td className="py-2.5 text-right font-mono text-slate-500">{row.air}</td>
                            <td className="py-2.5 text-right font-mono text-slate-500">{row.inj}</td>
                            <td className="py-2.5 text-right font-mono text-slate-500">{row.rate}</td>
                            <td className="py-2.5 text-right font-mono flex items-center justify-end gap-1.5">
                              <span className={`size-1.5 rounded-full ${
                                row.dot === "red" ? "bg-rose-500" :
                                row.dot === "orange" ? "bg-amber-500" : "bg-sky-500"
                              }`}></span>
                              {row.l4}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-[9px] text-slate-400 font-mono">
                    Comparison reports updated daily via SCS metrics channel.
                  </div>
                </div>

              </div>

              {/* Bottom split: Injury breakdown and Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Injury breakdown list */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Injury type breakdown</h3>
                    <p className="text-[9px] text-slate-500">Count vs days lost &middot; {quarterlyPeriod}.</p>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-white/5 font-sans text-xs">
                    {quarterData.breakdown.map((row, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2.5">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{row.type}</span>
                        <span className="font-mono font-black text-slate-800 dark:text-white">{row.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Recommendations</h3>
                    <p className="text-[9px] text-slate-500">Drafted by PT/IM &middot; routed to SCS.</p>
                  </div>

                  <div className="space-y-4 font-sans text-xs">
                    {quarterData.recommendations.map((rec, i) => (
                      <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl space-y-1.5 text-left">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-extrabold text-slate-800 dark:text-white">{rec.title}</span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-bold rounded">
                            {rec.tags}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{rec.body}</p>
                        <p className="text-[9px] text-[var(--brand-color)] font-mono leading-none">{rec.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Refresh Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-4">
                Quarterly review &middot; {quarterlyPeriod} &middot; k&ge;5 enforced &middot; CUI // OPSEC
              </div>

            </div>
          )}

          {/* Tab 5: SCS COORDINATION VIEW */}
          {activeTab === "scs" && !reviewingAirmanId && !viewingRecordId && (
            <div className="space-y-8 animate-fade-in pb-16">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">PT/IM · PERFORMANCE SUPPORT · COORDINATION</p>
                    <PopulationBadge level={POPULATION_LEVELS.CASELOAD} />
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">SCS coordination</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Joint items where pain, limitation, a failed OFT, or recovery decline affects a training plan decision. Held as its own record &mdash; kept separate from operator messages and from IDMT handoffs.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowRaiseItemModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand-color)] hover:bg-[#0c8a99] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    + Raise item
                  </button>
                </div>
              </div>

              {/* Scope alert box */}
              <div className="bg-slate-50 dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 text-left flex gap-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <Shield className="size-5 text-[var(--brand-color)] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold font-sans text-xs">Separate record &middot; training-decision scope only</span>
                  <p className="mt-0.5 text-slate-500 leading-normal font-normal font-sans">
                    These items carry the functional limitation and its training implication &mdash; not diagnosis, notes, or raw medical history. Operator messages, mental-performance content and IDMT handoffs each stay in their own workflow.
                  </p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-left space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Open items &middot; {filteredScsCoordinationRows.length}</h3>
                    <p className="text-[10px] text-slate-500">Sorted by last update &middot; both roles see the same record</p>
                  </div>

                  <div className="flex gap-2">
                    {(["Open", "Awaiting SCS", "Awaiting PT/IM", "Closed"] as const).map((sf, idx) => (
                      <button
                        key={idx}
                        onClick={() => setScsFilter(sf)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          scsFilter === sf
                            ? "bg-[var(--brand-color)/10] border-[var(--brand-color)/30] text-[var(--brand-color)]"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {sf}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3">Airman</th>
                        <th className="pb-3 w-1/4">Coordination Item</th>
                        <th className="pb-3">Trigger</th>
                        <th className="pb-3">Affects</th>
                        <th className="pb-3">Owner</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Updated</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredScsCoordinationRows.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-slate-400 text-[11px]">No items match this filter.</td>
                        </tr>
                      )}
                      {filteredScsCoordinationRows.map((row, idx) => {
                        const col = row.status === FOLLOW_UP_STATUSES.ASSIGNED ? "green" : row.status === FOLLOW_UP_STATUSES.DUE ? "orange" : row.status === FOLLOW_UP_STATUSES.OVERDUE ? "red" : "slate";
                        return (
                        <tr key={idx} className="hover:bg-slate-50/20 transition">
                          <td className="py-3">
                            <span className="font-bold text-slate-800 dark:text-white block">{row.code}</span>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{row.details}</span>
                          </td>
                          <td className="py-3 text-slate-700 dark:text-slate-300 font-bold">{row.item}</td>
                          <td className="py-3 text-slate-500 font-medium">{row.trig}</td>
                          <td className="py-3 text-slate-500">{row.aff}</td>
                          <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-400">{row.owner}</td>
                          <td className="py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-bold uppercase w-fit ${
                                col === "green" ? "bg-emerald-500/10 text-emerald-500" :
                                col === "orange" ? "bg-amber-500/10 text-amber-500" :
                                col === "red" ? "bg-rose-500/10 text-rose-500" : "bg-slate-100 dark:bg-slate-900 text-slate-400"
                              }`}>
                                {col === "orange" && <span className="size-1 bg-amber-500 rounded-full"></span>}
                                {col === "green" && <span className="size-1 bg-emerald-500 rounded-full"></span>}
                                {row.status}
                              </span>
                              <span className="text-[8px] text-slate-400">{row.detail}</span>
                            </div>
                          </td>
                          <td className="py-3 text-slate-500 font-mono">{row.date}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setReviewingAirmanId(row.code === "J. Reyes" ? "J. Reyes" : "J. Reyes");
                                triggerToast(`Opening joint coordination sheet detail context`);
                              }}
                              className="px-3.5 py-1.5 bg-[var(--brand-color)] hover:bg-[#0c8a99] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>Return to Performance only &middot; Return to Duty is decided outside Ascend</span>
                  <button type="button" className="text-[var(--brand-color)] font-bold cursor-pointer hover:underline" onClick={() => setActiveTab("injury")}>Injury queue &rarr;</button>
                </div>

              </div>

              {/* Refresh Footer */}
              <div className="text-[10px] text-slate-400 select-none font-mono text-left pt-4">
                SCS coordination &middot; 8 open items &middot; CUI // OPSEC
              </div>

            </div>
          )}

          {/* Tab 6: IDMT HANDOFF VIEW */}
          {activeTab === "handoff" && !reviewingAirmanId && !viewingRecordId && (
            <div className="space-y-6 animate-fade-in pb-16">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 tracking-wider">PT/IM · CLINICAL / REHABILITATION · IDMT HANDOFF</p>
                <PopulationBadge level={POPULATION_LEVELS.INDIVIDUAL} />
              </div>

              <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-white/5 rounded-2xl p-8 shadow-sm space-y-4 text-left">
                <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-[var(--brand-color)/15] text-[var(--brand-color)]">
                  <Send className="size-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">IDMT Handoff Channels</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    Export structured, read-receipted clinical reconditioning statuses directly into the Medical Operations corridor. This app is not an official medical record — exports are performance-informed summaries only.
                  </p>
                </div>

                {/* Privacy state on export — never blank */}
                <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl">
                  <PrivacyStateBadge state={PRIVACY_STATES.RESTRICTED} />
                  <span className="text-[10px] text-slate-500 leading-snug">{PRIVACY_STATE_REASON[PRIVACY_STATES.RESTRICTED]} Named recipients only &middot; audience logged per packet.</span>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowHandoffPacketModal(true)} className="px-4 py-2 bg-[var(--brand-color)] text-white rounded-xl text-xs font-bold hover:bg-[#0c8a99] transition cursor-pointer">
                    New Handoff Packet
                  </button>
                </div>
                <div className="border-t border-slate-100 dark:border-white/5 pt-4 text-[10px] text-slate-400 font-mono">
                  Session access audited &middot; 7-yr compliance record retention.
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* CREATE-RECORD MODALS (Phase 4 — wired to PT1–PT5) */}
      <CreateRecordModal
        open={showVisitNoteModal}
        onClose={() => setShowVisitNoteModal(false)}
        title="Add visit note"
        subtitle="SOAP entry for the active case. Used by clinical + IDMT."
        fields={[
          { name: "type", label: "Visit type", type: "select", options: ["Initial eval", "Follow-up", "Re-eval", "Discharge"], defaultValue: "Follow-up", required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "body", label: "Body", type: "textarea", required: true, placeholder: "Subjective / Objective / Assessment / Plan" }
        ]}
        submitLabel="Save note"
        onSubmit={(values) => {
          const newNote = {
            id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `vn-${Date.now()}`,
            date: values.date || new Date().toISOString().slice(0, 10),
            type: values.type || "Follow-up",
            body: values.body || ""
          };
          setVisitNotes([newNote, ...visitNotes]);
          triggerToast(`Created: ${newNote.type} note`);
          setShowVisitNoteModal(false);
        }}
      />

      <CreateRecordModal
        open={showTreatmentNoteModal}
        onClose={() => setShowTreatmentNoteModal(false)}
        title="New treatment plan note"
        subtitle="Add a structured note to the active treatment plan."
        fields={[
          { name: "title", label: "Note title", type: "text", required: true, placeholder: "e.g. Lumbar pre-hab update" },
          { name: "phase", label: "Phase", type: "text", placeholder: "e.g. Week 1" },
          { name: "body", label: "Body", type: "textarea", required: true, placeholder: "Plan, rationale, blockers" }
        ]}
        submitLabel="Add note"
        onSubmit={(values) => {
          const newNote = {
            id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tn-${Date.now()}`,
            title: values.title || "Untitled note",
            phase: values.phase || "",
            body: values.body || ""
          };
          setTreatmentNotes([newNote, ...treatmentNotes]);
          triggerToast(`Created: ${newNote.title}`);
          setShowTreatmentNoteModal(false);
        }}
      />

      <CreateRecordModal
        open={showIdmtHandoffModal}
        onClose={() => setShowIdmtHandoffModal(false)}
        title="New IDMT handoff"
        subtitle="Generate a structured export package for the IDMT channel."
        fields={[
          { name: "recipient", label: "Recipient role", type: "select", options: ["IDMT", "PC", "MP", "SCS"], defaultValue: "IDMT", required: true },
          { name: "scope", label: "Scope", type: "select", options: ["A single airman", "A cohort", "A program line"], required: true },
          { name: "code", label: "Airman/cohort code", type: "text", placeholder: "e.g. A-1042 or PT cohort", required: true },
          { name: "date", label: "Date", type: "date", required: true }
        ]}
        submitLabel="Generate handoff"
        onSubmit={(values) => {
          const newHandoff = {
            id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ih-${Date.now()}`,
            date: values.date || new Date().toISOString().slice(0, 10),
            recipient: values.recipient || "IDMT",
            scope: values.scope || "A single airman",
            status: "Draft"
          };
          setIdmtHandoffs([newHandoff, ...idmtHandoffs]);
          setHandoffPackets([
            { initials: "NEW", title: `Drafted · ${values.code || "session"}`, txt: `${values.recipient || "IDMT"} - ${values.scope || "A single airman"}`, time: newHandoff.date },
            ...handoffPackets
          ]);
          triggerToast(`Created: IDMT handoff (${values.code || "session"})`);
          setShowIdmtHandoffModal(false);
        }}
      />

      <CreateRecordModal
        open={showRaiseItemModal}
        onClose={() => setShowRaiseItemModal(false)}
        title="Raise joint coordination item"
        subtitle="Joint training-decision item between PT/IM and SCS."
        fields={[
          { name: "title", label: "Item title", type: "text", required: true, placeholder: "e.g. Sprint cap review for Flight A" },
          { name: "owner", label: "Owner role", type: "select", options: ["SCS", "PT", "IM", "PC", "Chaplain"], required: true },
          { name: "dueDate", label: "Due date", type: "date", required: true },
          { name: "notes", label: "Notes", type: "textarea", placeholder: "Trigger, affected scope, context" }
        ]}
        submitLabel="Raise item"
        onSubmit={(values) => {
          const newItem = {
            id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ci-${Date.now()}`,
            title: values.title || "Untitled item",
            owner: values.owner || "SCS",
            dueDate: values.dueDate || new Date().toISOString().slice(0, 10),
            status: "Open"
          };
          setCoordinationItems([newItem, ...coordinationItems]);
          triggerToast(`Created: ${newItem.title}`);
          setShowRaiseItemModal(false);
        }}
      />

      <CreateRecordModal
        open={showHandoffPacketModal}
        onClose={() => setShowHandoffPacketModal(false)}
        title="New Handoff Packet"
        subtitle="Create a named export packet for the IDMT handoff channel."
        fields={[
          { name: "title", label: "Packet title", type: "text", required: true, placeholder: "e.g. Q3 reconditioning summary" },
          { name: "recipients", label: "Recipients", type: "text", required: true, placeholder: "e.g. PT, IM, IDMT" },
          { name: "notes", label: "Notes", type: "textarea", placeholder: "Audience, scope, retention notes" }
        ]}
        submitLabel="Create packet"
        onSubmit={(values) => {
          const today = new Date().toISOString().slice(0, 10);
          const newPacket = {
            id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `hp-${Date.now()}`,
            title: values.title || "Untitled packet",
            recipients: values.recipients || "",
            createdAt: today
          };
          setHandoffPackets([
            { initials: "NEW", title: newPacket.title, txt: `Recipients: ${newPacket.recipients}`, time: today },
            ...handoffPackets
          ]);
          triggerToast(`Created: ${newPacket.title}`);
          setShowHandoffPacketModal(false);
        }}
      />

      {/* TOAST NOTIFICATION */}
      {showConfirmToast && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-slide-up border border-slate-800 dark:border-white/5 font-sans">
          <CheckCircle className="size-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

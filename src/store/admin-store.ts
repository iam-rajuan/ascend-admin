"use client";

import { create } from "zustand";
import {
  approveAdminConfirmation,
  formatAdminApiError,
  getAdminAccountsOnboardingSummary,
  getAdminAuditCategoryRollup,
  getAdminAuditLog,
  getAdminAuditStats,
  getAdminCredentials,
  getAdminEquipmentGaps,
  getAdminExportLogHistory,
  getAdminExportsOverview,
  getAdminOrgUnits,
  getAdminPathwayMatrix,
  getAdminQuestionBankVersions,
  getAdminQuestionRegistry,
  getAdminRbacMatrix,
  getAdminRequiredContractReports,
  getAdminRoleCatalog,
  getAdminScheduledExports,
  getAdminScopeConfigs,
  getAdminScopeMatrix,
  getAdminSystemDiagnostics,
  getAdminSystemOverview,
  getAdminUtilizationEvents,
  type AdminAccountsOnboardingSummary,
  type AdminAuditEntry,
  type AdminAuditRollupCategory,
  type AdminAuditStats,
  type AdminConfirmation,
  type AdminCredential,
  type AdminEquipmentGap,
  type AdminExportRecord,
  type AdminExportsOverview,
  type AdminOrgUnit,
  type AdminPathwayMatrixEntry,
  type AdminQuestionBankVersion,
  type AdminQuestionRegistryEntry,
  type AdminQuestionRegistryResponse,
  type AdminRequiredContractReport,
  type AdminRbacMatrixResponse,
  type AdminRoleCatalogEntry,
  type AdminScheduledExport,
  type AdminScopeConfig,
  type AdminScopeMatrixRow,
  type AdminScopeResolveResponse,
  type AdminSystemDiagnostics,
  type AdminSystemOverview,
  type AdminUtilizationEvent,
  resolveAdminScope,
  updateAdminScopeConfig,
} from "@/lib/admin-api";

export type AdminTab = "overview" | "roles" | "scope" | "audit-log" | "exports" | "system" | "profile";

export type ConfirmationItem = {
  id: string;
  action: string;
  target: string;
  consequence: string;
  scope: string;
  records: number;
  risk: "L1" | "L2" | "L3" | "L4";
};

export type ActivityItem = {
  id: string;
  time: string;
  actor: string;
  action: string;
  reason?: string;
  scope: string;
  tag: "logged" | "system" | "review" | "gated";
  tagColor: "green" | "blue" | "yellow" | "red" | "gray" | "orange";
};

export type ServiceStatus = {
  id: string;
  name: string;
  status: "Online" | "Degraded" | "Offline";
  latency: string;
  lastCheck: string;
  version: string;
};

export type RoleCatalogItem = {
  id: string;
  role: string;
  category: "Staff" | "Contractor" | "Officer" | "System";
  scope: string;
  assigned: string;
  lastEdit: string;
};

export type RbacMatrixRow = {
  permission: string;
  states: ("active" | "conditional" | "gated" | "locked" | "none")[];
};

export type DeviceOverrideItem = {
  id: string;
  operator: string;
  status: "Online" | "Offline" | "Handshake" | "Secure" | "Unsynced";
  details: string;
  log: string;
};

type DriverVisibility = {
  physical: boolean;
  sleep: boolean;
  mental: boolean;
  nutrition: boolean;
  purpose: boolean;
};

export type AdminStore = {
  activeTab: AdminTab;
  pendingConfirmations: ConfirmationItem[];
  recentActivity: ActivityItem[];
  services: ServiceStatus[];
  rolesCatalog: RoleCatalogItem[];
  rbacMatrix: RbacMatrixRow[];
  deviceOverrides: DeviceOverrideItem[];
  auditSearchQuery: string;
  auditFilter: string;
  selectedScopeUnit: string;
  selectedScopeUnitId: string | null;
  cohortSizeK: number;
  rolesFilter: string;
  driverVisibility: DriverVisibility;
  isLoading: boolean;
  loadError: string;
  auditEntries: AdminAuditEntry[];
  auditStats: AdminAuditStats | null;
  auditRollup: AdminAuditRollupCategory[];
  roleCatalogRaw: AdminRoleCatalogEntry[];
  accountsSummary: AdminAccountsOnboardingSummary | null;
  questionRegistry: AdminQuestionRegistryResponse | null;
  questionBankVersions: AdminQuestionBankVersion[];
  scopeConfigs: AdminScopeConfig[];
  scopeMatrix: AdminScopeMatrixRow[];
  scopeResolution: AdminScopeResolveResponse | null;
  pathwayMatrix: AdminPathwayMatrixEntry[];
  exportsOverview: AdminExportsOverview | null;
  requiredReports: AdminRequiredContractReport[];
  scheduledExports: AdminScheduledExport[];
  exportHistory: AdminExportRecord[];
  systemOverview: AdminSystemOverview | null;
  systemDiagnostics: AdminSystemDiagnostics | null;
  orgUnits: AdminOrgUnit[];
  credentials: AdminCredential[];
  equipmentGaps: AdminEquipmentGap[];
  utilizationEvents: AdminUtilizationEvent[];
  setActiveTab: (tab: AdminTab) => void;
  setAuditSearchQuery: (query: string) => void;
  setAuditFilter: (filter: string) => void;
  setSelectedScopeUnit: (unitName: string) => void;
  setSelectedScopeUnitId: (unitId: string | null) => void;
  setCohortSizeK: (k: number) => void;
  setRolesFilter: (filter: string) => void;
  toggleDriverVisibility: (driver: keyof DriverVisibility) => void;
  removeConfirmation: (id: string) => void;
  toggleServiceStatus: (id: string) => void;
  toggleRbacCell: (rowIndex: number, colIndex: number) => void;
  updateRoleCount: (roleId: string, value: string) => void;
  addActivity: (entry: { action: string; actor: string; reason?: string; scope: string; tag?: ActivityItem["tag"]; tagColor?: ActivityItem["tagColor"] }) => void;
  initialize: (accessToken: string) => Promise<void>;
  refreshScopeResolve: (accessToken: string) => Promise<void>;
  saveAdminScopeConfig: (accessToken: string) => Promise<{ ok: boolean; error?: string }>;
  approveConfirmation: (accessToken: string, id: string) => Promise<{ ok: boolean; error?: string }>;
};

const ADMIN_SCOPE_ROLE = "DWS Admin";

const DRIVER_COMPONENT_MAP: Record<keyof DriverVisibility, string> = {
  physical: "Physical Readiness",
  sleep: "Sleep Readiness",
  mental: "Mental Readiness",
  nutrition: "Nutritional Readiness",
  purpose: "Spiritual Readiness",
};

const getInitialAdminTab = (): AdminTab => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("ascend_admin_active_tab");
    if (saved && ["overview", "roles", "scope", "audit-log", "exports", "system"].includes(saved)) {
      return saved as AdminTab;
    }
  }

  return "overview";
};

function formatStamp(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function toRiskCode(riskTier: string | null | undefined): ConfirmationItem["risk"] {
  switch (riskTier) {
    case "high":
      return "L4";
    case "elevated":
      return "L3";
    default:
      return "L1";
  }
}

function toConfirmationAction(actionType: string) {
  switch (actionType) {
    case "export":
      return "Export";
    case "deactivation":
      return "Deactivation";
    case "role_change":
      return "Role change";
    case "idmt_handoff":
      return "IDMT handoff";
    default:
      return actionType.replace(/_/g, " ");
  }
}

function toConfirmationItem(item: AdminConfirmation): ConfirmationItem {
  const rowCount = Number(item.payload && typeof item.payload.row_count === "number" ? item.payload.row_count : 0);
  return {
    id: item.id,
    action: toConfirmationAction(item.action_type),
    target: item.target_summary || item.target_entity_type || "Pending action",
    consequence: item.consequence_summary || "Awaiting review",
    scope: item.scope_summary || "Global",
    records: rowCount,
    risk: toRiskCode(item.risk_tier),
  };
}

function toActivityItem(entry: AdminAuditEntry): ActivityItem {
  const actor = entry.actor_role || "System";
  const eventType = entry.event_type.toLowerCase();
  let tag: ActivityItem["tag"] = "logged";
  let tagColor: ActivityItem["tagColor"] = "green";

  if (eventType.includes("confirm") || eventType.includes("approve")) {
    tag = "review";
    tagColor = "orange";
  } else if (eventType.includes("config") || eventType.includes("deploy")) {
    tag = "system";
    tagColor = "blue";
  } else if (eventType.includes("deactivation") || eventType.includes("reject")) {
    tag = "gated";
    tagColor = "red";
  }

  return {
    id: entry.id,
    time: formatTime(entry.created_at),
    actor,
    action: entry.summary_message,
    reason: entry.event_type,
    scope: entry.target_entity_type || "audit",
    tag,
    tagColor,
  };
}

function toServiceStatus(diagnostics: AdminSystemDiagnostics | null): ServiceStatus[] {
  if (!diagnostics) {
    return [];
  }

  const jobs = diagnostics.scheduler_jobs.map((job, index) => ({
    id: `job-${index}`,
    name: job.job_name.replace(/_/g, " "),
    status:
      job.last_run_status === "success"
        ? "Online"
        : job.last_run_status === "warning"
          ? "Degraded"
          : "Offline",
    latency: diagnostics.database.latency_ms ? `${Math.round(diagnostics.database.latency_ms)} ms` : "—",
    lastCheck: formatTime(job.last_run_at),
    version: job.last_run_status,
  })) as ServiceStatus[];

  return [
    {
      id: "database",
      name: "database",
      status: diagnostics.database.status === "online" ? "Online" : "Offline",
      latency: `${Math.round(diagnostics.database.latency_ms)} ms`,
      lastCheck: jobs[0]?.lastCheck || "—",
      version: diagnostics.ai_provider_configured ? "AI configured" : "AI missing",
    },
    ...jobs,
  ];
}

function toRoleCatalogEntry(item: AdminRoleCatalogEntry, index: number): RoleCatalogItem {
  return {
    id: `rc-${index}`,
    role: item.role,
    category: item.cluster,
    scope: item.scope,
    assigned: String(item.member_count),
    lastEdit: formatStamp(item.last_edit),
  };
}

function toRbacState(value: string): RbacMatrixRow["states"][number] {
  switch (value) {
    case "full":
      return "active";
    case "conditional":
      return "conditional";
    case "gated":
      return "gated";
    default:
      return "none";
  }
}

function toRbacMatrixRows(matrix: AdminRbacMatrixResponse["matrix"]): RbacMatrixRow[] {
  const keys = ["OPERATOR", "SCS", "PT/IM", "NUTR", "MP", "PURPOSE", "PLAN", "LEAD", "ADMIN", "IDMT"];
  return matrix.map((row) => ({
    permission: row.capability,
    states: keys.map((key) => toRbacState(row.roles[key] || "none")),
  }));
}

function toDriverVisibility(config: AdminScopeConfig | null | undefined): DriverVisibility {
  const visible = new Set(config?.visible_components ?? []);
  return {
    physical: visible.has(DRIVER_COMPONENT_MAP.physical),
    sleep: visible.has(DRIVER_COMPONENT_MAP.sleep),
    mental: visible.has(DRIVER_COMPONENT_MAP.mental),
    nutrition: visible.has(DRIVER_COMPONENT_MAP.nutrition),
    purpose: visible.has(DRIVER_COMPONENT_MAP.purpose),
  };
}

const defaultDriverVisibility: DriverVisibility = {
  physical: true,
  sleep: true,
  mental: true,
  nutrition: true,
  purpose: true,
};

export const useAdminStore = create<AdminStore>((set, get) => ({
  activeTab: getInitialAdminTab(),
  pendingConfirmations: [],
  recentActivity: [],
  services: [],
  rolesCatalog: [],
  rbacMatrix: [],
  deviceOverrides: [],
  auditSearchQuery: "",
  auditFilter: "All",
  selectedScopeUnit: "No unit selected",
  selectedScopeUnitId: null,
  cohortSizeK: 5,
  rolesFilter: "All",
  driverVisibility: defaultDriverVisibility,
  isLoading: false,
  loadError: "",
  auditEntries: [],
  auditStats: null,
  auditRollup: [],
  roleCatalogRaw: [],
  accountsSummary: null,
  questionRegistry: null,
  questionBankVersions: [],
  scopeConfigs: [],
  scopeMatrix: [],
  scopeResolution: null,
  pathwayMatrix: [],
  exportsOverview: null,
  requiredReports: [],
  scheduledExports: [],
  exportHistory: [],
  systemOverview: null,
  systemDiagnostics: null,
  orgUnits: [],
  credentials: [],
  equipmentGaps: [],
  utilizationEvents: [],
  setActiveTab: (tab) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ascend_admin_active_tab", tab);
    }
    set({ activeTab: tab });
  },
  setAuditSearchQuery: (query) => set({ auditSearchQuery: query }),
  setAuditFilter: (filter) => set({ auditFilter: filter }),
  setSelectedScopeUnit: (unitName) => set({ selectedScopeUnit: unitName }),
  setSelectedScopeUnitId: (unitId) => set({ selectedScopeUnitId: unitId }),
  setCohortSizeK: (k) => set({ cohortSizeK: k }),
  setRolesFilter: (filter) => set({ rolesFilter: filter }),
  toggleDriverVisibility: (driver) =>
    set((state) => ({
      driverVisibility: {
        ...state.driverVisibility,
        [driver]: !state.driverVisibility[driver],
      },
    })),
  removeConfirmation: (id) =>
    set((state) => ({
      pendingConfirmations: state.pendingConfirmations.filter((item) => item.id !== id),
    })),
  toggleServiceStatus: (id) =>
    set((state) => ({
      services: state.services.map((service) =>
        service.id === id
          ? {
              ...service,
              status:
                service.status === "Online"
                  ? "Degraded"
                  : service.status === "Degraded"
                    ? "Offline"
                    : "Online",
            }
          : service,
      ),
    })),
  toggleRbacCell: (rowIndex, colIndex) =>
    set((state) => {
      const next = [...state.rbacMatrix];
      const row = { ...next[rowIndex] };
      const states = [...row.states];
      const cycle: Record<RbacMatrixRow["states"][number], RbacMatrixRow["states"][number]> = {
        active: "conditional",
        conditional: "gated",
        gated: "locked",
        locked: "none",
        none: "active",
      };
      states[colIndex] = cycle[states[colIndex]];
      row.states = states;
      next[rowIndex] = row;
      return { rbacMatrix: next };
    }),
  updateRoleCount: (roleId, value) =>
    set((state) => ({
      rolesCatalog: state.rolesCatalog.map((role) => (role.id === roleId ? { ...role, assigned: value } : role)),
    })),
  addActivity: (entry) =>
    set((state) => ({
      recentActivity: [
        {
          id: `act-${Date.now()}`,
          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
          actor: entry.actor,
          action: entry.action,
          reason: entry.reason,
          scope: entry.scope,
          tag: entry.tag ?? "logged",
          tagColor: entry.tagColor ?? "green",
        },
        ...state.recentActivity,
      ],
    })),
  initialize: async (accessToken) => {
    set({ isLoading: true, loadError: "" });

    try {
      const [
        auditLog,
        auditStats,
        auditRollup,
        roleCatalog,
        accountsSummary,
        rbacMatrix,
        questionRegistry,
        questionBankVersions,
        scopeConfigResponse,
        scopeMatrix,
        pathwayMatrix,
        exportsOverview,
        requiredReports,
        scheduledExports,
        exportHistory,
        systemOverview,
        systemDiagnostics,
        orgUnits,
        credentials,
        equipmentGaps,
        utilizationEvents,
      ] = await Promise.all([
        getAdminAuditLog(accessToken, 1, 20),
        getAdminAuditStats(accessToken),
        getAdminAuditCategoryRollup(accessToken),
        getAdminRoleCatalog(accessToken),
        getAdminAccountsOnboardingSummary(accessToken),
        getAdminRbacMatrix(accessToken),
        getAdminQuestionRegistry(accessToken),
        getAdminQuestionBankVersions(accessToken),
        getAdminScopeConfigs(accessToken),
        getAdminScopeMatrix(accessToken),
        getAdminPathwayMatrix(accessToken),
        getAdminExportsOverview(accessToken),
        getAdminRequiredContractReports(accessToken),
        getAdminScheduledExports(accessToken),
        getAdminExportLogHistory(accessToken),
        getAdminSystemOverview(accessToken),
        getAdminSystemDiagnostics(accessToken),
        getAdminOrgUnits(accessToken),
        getAdminCredentials(accessToken),
        getAdminEquipmentGaps(accessToken),
        getAdminUtilizationEvents(accessToken),
      ]);

      const scopeConfigs = Array.isArray((scopeConfigResponse as { configs?: AdminScopeConfig[] }).configs)
        ? ((scopeConfigResponse as { configs: AdminScopeConfig[] }).configs ?? [])
        : [scopeConfigResponse as AdminScopeConfig];
      const adminScopeConfig = scopeConfigs.find((item) => item.role === ADMIN_SCOPE_ROLE) ?? null;
      const defaultUnit = orgUnits.units[0] ?? null;

      set({
        pendingConfirmations: exportsOverview.pending_confirmations.map(toConfirmationItem),
        recentActivity: auditLog.entries.map(toActivityItem),
        services: toServiceStatus(systemDiagnostics),
        rolesCatalog: roleCatalog.roles.map(toRoleCatalogEntry),
        rbacMatrix: toRbacMatrixRows(rbacMatrix.matrix),
        auditEntries: auditLog.entries,
        auditStats,
        auditRollup: auditRollup.categories,
        roleCatalogRaw: roleCatalog.roles,
        accountsSummary,
        questionRegistry,
        questionBankVersions: questionBankVersions.versions,
        scopeConfigs,
        scopeMatrix: scopeMatrix.roles,
        pathwayMatrix: pathwayMatrix.pathways,
        exportsOverview,
        requiredReports: requiredReports.reports,
        scheduledExports: scheduledExports.schedules,
        exportHistory: exportHistory.exports,
        systemOverview,
        systemDiagnostics,
        orgUnits: orgUnits.units,
        credentials: credentials.credentials,
        equipmentGaps: equipmentGaps.gaps,
        utilizationEvents: utilizationEvents.events,
        selectedScopeUnit: defaultUnit?.name ?? "No unit selected",
        selectedScopeUnitId: defaultUnit?.id ?? null,
        cohortSizeK: adminScopeConfig?.cohort_k ?? 5,
        driverVisibility: adminScopeConfig ? toDriverVisibility(adminScopeConfig) : defaultDriverVisibility,
        isLoading: false,
      });

      if (defaultUnit?.id) {
        await get().refreshScopeResolve(accessToken);
      }
    } catch (error) {
      set({
        isLoading: false,
        loadError: formatAdminApiError(error),
      });
    }
  },
  refreshScopeResolve: async (accessToken) => {
    const unitId = get().selectedScopeUnitId;
    if (!unitId) {
      set({ scopeResolution: null });
      return;
    }

    try {
      const scopeResolution = await resolveAdminScope(accessToken, ADMIN_SCOPE_ROLE, unitId);
      set({ scopeResolution });
    } catch (error) {
      set({ loadError: formatAdminApiError(error) });
    }
  },
  saveAdminScopeConfig: async (accessToken) => {
    try {
      const visibleComponents = (Object.keys(get().driverVisibility) as (keyof DriverVisibility)[])
        .filter((key) => get().driverVisibility[key])
        .map((key) => DRIVER_COMPONENT_MAP[key]);

      const nextConfig = await updateAdminScopeConfig(accessToken, ADMIN_SCOPE_ROLE, {
        cohort_k: get().cohortSizeK,
        visible_components: visibleComponents,
      });

      set((state) => ({
        scopeConfigs: state.scopeConfigs.some((item) => item.role === ADMIN_SCOPE_ROLE)
          ? state.scopeConfigs.map((item) => (item.role === ADMIN_SCOPE_ROLE ? nextConfig : item))
          : [nextConfig, ...state.scopeConfigs],
      }));

      await get().refreshScopeResolve(accessToken);

      return { ok: true };
    } catch (error) {
      return { ok: false, error: formatAdminApiError(error) };
    }
  },
  approveConfirmation: async (accessToken, id) => {
    try {
      await approveAdminConfirmation(accessToken, id);
      set((state) => ({
        pendingConfirmations: state.pendingConfirmations.filter((item) => item.id !== id),
      }));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: formatAdminApiError(error) };
    }
  },
}));

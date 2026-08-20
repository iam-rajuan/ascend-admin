"use client";

import { create } from "zustand";

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
  // State for each of the 10 roles:
  // Order: [Operator, SCS, PT/IM, Nutrition, MP, Purpose, Plan, Leadership, Admin, IDMT]
  states: ("active" | "conditional" | "gated" | "locked" | "none")[];
};

export type DeviceOverrideItem = {
  id: string;
  operator: string;
  status: "Online" | "Offline" | "Handshake" | "Secure" | "Unsynced";
  details: string;
  log: string;
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
  cohortSizeK: number;
  rolesFilter: string;
  driverVisibility: {
    physical: boolean;
    sleep: boolean;
    mental: boolean;
    nutrition: boolean;
    purpose: boolean;
  };
  setActiveTab: (tab: AdminTab) => void;
  setAuditSearchQuery: (query: string) => void;
  setAuditFilter: (filter: string) => void;
  setSelectedScopeUnit: (unit: string) => void;
  setCohortSizeK: (k: number) => void;
  setRolesFilter: (filter: string) => void;
  toggleDriverVisibility: (driver: "physical" | "sleep" | "mental" | "nutrition" | "purpose") => void;
  removeConfirmation: (id: string) => void;
  toggleServiceStatus: (id: string) => void;
  toggleRbacCell: (rowIndex: number, colIndex: number) => void;
  updateRoleCount: (roleId: string, value: string) => void;
  addActivity: (entry: { action: string; actor: string; reason?: string; scope: string; tag?: ActivityItem["tag"]; tagColor?: ActivityItem["tagColor"] }) => void;
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

export const useAdminStore = create<AdminStore>((set) => ({
  activeTab: getInitialAdminTab(),
  pendingConfirmations: [
    { id: "conf-1", action: "Export", target: "PT/IM audit (Q3)", consequence: "14 records · restricted", scope: "PT/IM caseload", records: 14, risk: "L4" },
    { id: "conf-2", action: "Export", target: "Wing weekly PPTX", consequence: "aggregate · kz5", scope: "Aggregate - kz5", records: 125, risk: "L1" },
    { id: "conf-3", action: "Deactivation", target: "Staff account", consequence: "3 caseloads reassigned", scope: "SCS - flight", records: 22, risk: "L3" },
  ],
  recentActivity: [
    { id: "act-1", time: "07:14:22", actor: "PT/IM", action: "Opened medical record reason: lower-back review", scope: "PT/IM · caseload", tag: "logged", tagColor: "green" },
    { id: "act-2", time: "06:42:08", actor: "SCS", action: "Opened session note note: SCS - caseload", scope: "SCS · caseload", tag: "logged", tagColor: "green" },
    { id: "act-3", time: "06:35:51", actor: "SCS", action: "Sent secure message thread #482", scope: "SCS · caseload", tag: "logged", tagColor: "green" },
    { id: "act-4", time: "22:00:03", actor: "System", action: "Scheduled export completed Wing 03 aggregate - scope kz5", scope: "System · aggregate", tag: "system", tagColor: "gray" },
    { id: "act-5", time: "14:00:46", actor: "PT/IM", action: "Sent IDMT handoff L4 lower-back clearance", scope: "IDMT - L3 clearance", tag: "review", tagColor: "orange" },
    { id: "act-6", time: "10:22:17", actor: "Lead Admin", action: "Role assignment changed pending 2nd review", scope: "Admin - reversible", tag: "gated", tagColor: "red" },
    { id: "act-7", time: "09:58:09", actor: "SCS", action: "Logged in PIV - workstation 4 · session start", scope: "SCS · caseload", tag: "logged", tagColor: "green" },
    { id: "act-8", time: "08:11:30", actor: "System", action: "Threshold warning Sleep driver Δ -1.2 over 7d · Delta flight flagged", scope: "Auto · advisory", tag: "review", tagColor: "orange" },
  ],
  services: [
    { id: "srv-1", name: "Gaming engine", status: "Online", latency: "32 ms", lastCheck: "06:42", version: "v1.1.2" },
    { id: "srv-2", name: "Audit service", status: "Online", latency: "18 ms", lastCheck: "06:42", version: "v2.7.0" },
    { id: "srv-3", name: "Export pipeline", status: "Online", latency: "120 ms", lastCheck: "06:42", version: "v3.0.1" },
    { id: "srv-4", name: "IMT channel", status: "Online", latency: "28 ms", lastCheck: "06:42", version: "v1.4.5" },
    { id: "srv-5", name: "Notifications", status: "Degraded", latency: "310 ms", lastCheck: "06:41", version: "v2.5.4" },
    { id: "srv-6", name: "Identity provider", status: "Online", latency: "55 ms", lastCheck: "06:42", version: "v1.8.9" },
    { id: "srv-7", name: "Caseload server", status: "Online", latency: "24 ms", lastCheck: "06:42", version: "v2.1.7" },
  ],
  rolesCatalog: [
    { id: "rc-1", role: "Operator", category: "Staff", scope: "Own", assigned: "112", lastEdit: "22 Jul - 10:22" },
    { id: "rc-2", role: "SCS", category: "Staff", scope: "Flight", assigned: "2", lastEdit: "22 Jul - 10:22" },
    { id: "rc-3", role: "PT/IM", category: "Staff", scope: "Caseload", assigned: "3", lastEdit: "22 Jul - 10:22" },
    { id: "rc-4", role: "Nutritionist", category: "Staff", scope: "Caseload", assigned: "1", lastEdit: "22 Jul - 10:22" },
    { id: "rc-5", role: "MP", category: "Staff", scope: "Caseload", assigned: "1", lastEdit: "22 Jul - 10:22" },
    { id: "rc-6", role: "Purpose Coach", category: "Staff", scope: "Caseload", assigned: "1", lastEdit: "22 Jul - 10:22" },
    { id: "rc-7", role: "Plan", category: "Contractor", scope: "Flight", assigned: "2", lastEdit: "22 Jul - 10:22" },
    { id: "rc-8", role: "Leadership", category: "Contractor", scope: "Global", assigned: "3", lastEdit: "22 Jul - 10:22" },
    { id: "rc-9", role: "Admin", category: "Officer", scope: "Global", assigned: "3", lastEdit: "22 Jul - 10:22" },
    { id: "rc-10", role: "IDMT", category: "System", scope: "Caseload", assigned: "—", lastEdit: "22 Jul - 10:22" },
  ],
  rbacMatrix: [
    { permission: "View own dashboard", states: ["active", "active", "active", "active", "active", "active", "active", "active", "active", "locked"] },
    { permission: "View caseload records", states: ["locked", "active", "gated", "gated", "gated", "gated", "locked", "locked", "active", "gated"] },
    { permission: "View Authorized Performance Summary", states: ["locked", "conditional", "gated", "conditional", "locked", "locked", "locked", "locked", "active", "conditional"] },
    { permission: "Send message", states: ["active", "active", "active", "active", "active", "active", "active", "locked", "active", "gated"] },
    { permission: "Send IDMT handoff", states: ["locked", "locked", "gated", "gated", "locked", "locked", "locked", "locked", "active", "gated"] },
    { permission: "Author plan", states: ["locked", "active", "active", "active", "active", "active", "active", "locked", "active", "locked"] },
    { permission: "View aggregate trend", states: ["locked", "conditional", "conditional", "conditional", "conditional", "conditional", "active", "active", "active", "locked"] },
    { permission: "Run export", states: ["locked", "locked", "locked", "locked", "locked", "locked", "gated", "gated", "active", "locked"] },
    { permission: "Deactivate user", states: ["locked", "locked", "locked", "locked", "locked", "locked", "locked", "locked", "gated", "locked"] },
  ],
  deviceOverrides: [
    { id: "do-1", operator: "l.admin", status: "Online", details: "Graphite chrome v1.2", log: "Handshake verified" },
    { id: "do-2", operator: "pt.operator", status: "Secure", details: "CAC/PIV active validation", log: "Active connection" },
    { id: "do-3", operator: "scs.liaison", status: "Handshake", details: "Awaiting auth sync", log: "Sync scheduled" },
    { id: "do-4", operator: "clin.audit", status: "Offline", details: "Deactivation sync", log: "Awaiting sync check" },
  ],
  auditSearchQuery: "",
  auditFilter: "All",
  selectedScopeUnit: "PT/IM - Staff",
  cohortSizeK: 5,
  rolesFilter: "All",
  driverVisibility: {
    physical: true,
    sleep: true,
    mental: true,
    nutrition: true,
    purpose: false,
  },
  setActiveTab: (tab) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ascend_admin_active_tab", tab);
    }
    set({ activeTab: tab });
  },
  setAuditSearchQuery: (query) => set({ auditSearchQuery: query }),
  setAuditFilter: (filter) => set({ auditFilter: filter }),
  setSelectedScopeUnit: (unit) => set({ selectedScopeUnit: unit }),
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
    set((state) => {
      const item = state.pendingConfirmations.find((c) => c.id === id);
      if (!item) return {};

      // Add a corresponding log to recentActivity
      const newActivity: ActivityItem = {
        id: `act-${Date.now()}`,
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        actor: "Lead Admin",
        action: `Approved ${item.action.toLowerCase()}`,
        reason: `${item.target} confirmed`,
        scope: item.scope,
        tag: "logged",
        tagColor: "green",
      };

      return {
        pendingConfirmations: state.pendingConfirmations.filter((c) => c.id !== id),
        recentActivity: [newActivity, ...state.recentActivity],
      };
    }),
  toggleServiceStatus: (id) =>
    set((state) => ({
      services: state.services.map((s) => {
        if (s.id !== id) return s;
        const statusCycle: Record<string, "Online" | "Degraded" | "Offline"> = {
          Online: "Degraded",
          Degraded: "Offline",
          Offline: "Online",
        };
        return {
          ...s,
          status: statusCycle[s.status],
          latency: s.status === "Online" ? "320 ms" : s.status === "Degraded" ? "0 ms" : "15 ms",
          lastCheck: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        };
      }),
    })),
  toggleRbacCell: (rowIndex, colIndex) =>
    set((state) => {
      const newMatrix = [...state.rbacMatrix];
      const cycle: Record<string, "active" | "conditional" | "gated" | "locked" | "none"> = {
        active: "conditional",
        conditional: "gated",
        gated: "locked",
        locked: "none",
        none: "active",
      };
      const currentRow = { ...newMatrix[rowIndex] };
      const currentStates = [...currentRow.states];
      currentStates[colIndex] = cycle[currentStates[colIndex]];
      currentRow.states = currentStates;
      newMatrix[rowIndex] = currentRow;
      return { rbacMatrix: newMatrix };
    }),
  updateRoleCount: (roleId, value) =>
    set((state) => ({
      rolesCatalog: state.rolesCatalog.map((r) =>
        r.id === roleId ? { ...r, assigned: value } : r
      ),
    })),
  addActivity: (entry) =>
    set((state) => {
      const newEntry: ActivityItem = {
        id: `act-${Date.now()}`,
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        actor: entry.actor,
        action: entry.action,
        reason: entry.reason,
        scope: entry.scope,
        tag: entry.tag ?? "logged",
        tagColor: entry.tagColor ?? "green",
      };
      return {
        recentActivity: [newEntry, ...state.recentActivity],
      };
    }),
}));

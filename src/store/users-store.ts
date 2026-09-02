"use client";

import { create } from "zustand";
import type { RoleId } from "@/lib/roles";
import {
  assignAdminUserUnit,
  changeAdminUserRole,
  createAdminUser,
  formatAdminApiError,
  getAdminOrgUnits,
  getAdminUsers,
  renewAdminUserAccess,
  requestAdminUserDeactivation,
  resetAdminUserPassword,
  toAdminRoleLabel,
  type AdminOrgUnit,
  type AdminUserRecord,
} from "@/lib/admin-api";
import { normalizeRole } from "@/lib/staff-api";

export type AccountStatus = "active" | "deactivated";

export type Person = {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  roleLabel: string;
  unit: string;
  unitId: string | null;
  status: AccountStatus;
  lastEdit: string;
  createdAt: string | null;
  accessExpiresAt: string | null;
};

export type NewPersonInput = {
  name: string;
  email: string;
  password?: string;
  role: RoleId;
  unit: string;
  status: AccountStatus;
};

type MutationResult = {
  ok: boolean;
  error?: string;
};

type AddPersonResult = MutationResult & {
  person?: Person;
  initialPassword?: string | null;
};

type ResetPasswordResult = MutationResult & {
  emailed?: boolean;
};

type UsersStore = {
  people: Person[];
  isLoading: boolean;
  error: string;
  fetchPeople: (accessToken: string, role?: RoleId | "All") => Promise<MutationResult>;
  addPerson: (accessToken: string, input: NewPersonInput) => Promise<AddPersonResult>;
  updatePerson: (accessToken: string, id: string, updates: Partial<NewPersonInput>) => Promise<MutationResult>;
  setStatus: (accessToken: string, id: string, status: AccountStatus) => Promise<MutationResult>;
  adminResetPassword: (accessToken: string, id: string) => Promise<ResetPasswordResult>;
  findByEmail: (email: string) => Person | undefined;
  getByRole: (role: RoleId) => Person[];
};

function formatStamp(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function mapUnitName(unitId: string | null, units: AdminOrgUnit[]) {
  if (!unitId) {
    return "";
  }

  return units.find((unit) => unit.id === unitId)?.name ?? unitId;
}

function mapUserToPerson(user: AdminUserRecord, units: AdminOrgUnit[]): Person {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email.trim().toLowerCase(),
    role: normalizeRole(user.role),
    roleLabel: user.role,
    unit: mapUnitName(user.unit_id ?? null, units),
    unitId: user.unit_id ?? null,
    status: user.is_active ? "active" : "deactivated",
    lastEdit: formatStamp(user.last_edit_at || user.created_at),
    createdAt: user.created_at ?? null,
    accessExpiresAt: user.access_expires_at ?? null,
  };
}

export const useUsersStore = create<UsersStore>((set, get) => ({
  people: [],
  isLoading: false,
  error: "",
  fetchPeople: async (accessToken, role) => {
    set({ isLoading: true, error: "" });

    try {
      const [response, orgUnitsResponse] = await Promise.all([
        getAdminUsers(accessToken, role && role !== "All" ? toAdminRoleLabel(role) : undefined),
        getAdminOrgUnits(accessToken),
      ]);
      const units = orgUnitsResponse.units ?? [];

      set({
        people: response.users.map((user) => mapUserToPerson(user, units)),
        isLoading: false,
      });

      return { ok: true };
    } catch (error) {
      const message = formatAdminApiError(error);
      set({ isLoading: false, error: message });
      return { ok: false, error: message };
    }
  },
  addPerson: async (accessToken, input) => {
    try {
      const created = await createAdminUser(accessToken, {
        full_name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        role: toAdminRoleLabel(input.role),
        unit_id: input.unit.trim() || null,
        is_active: input.status === "active",
        initial_password: input.password?.trim() || undefined,
      });

      const orgUnitsResponse = await getAdminOrgUnits(accessToken);
      const person = mapUserToPerson(created, orgUnitsResponse.units ?? []);
      set((state) => ({
        people: [person, ...state.people],
      }));

      return {
        ok: true,
        person,
        initialPassword: created.initial_password ?? null,
      };
    } catch (error) {
      console.error("Add person failed", {
        input: {
          full_name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          role: toAdminRoleLabel(input.role),
          unit_id: input.unit.trim() || null,
          is_active: input.status === "active",
          initial_password_supplied: Boolean(input.password?.trim()),
        },
        error,
      });
      return { ok: false, error: formatAdminApiError(error) };
    }
  },
  updatePerson: async (accessToken, id, updates) => {
    const current = get().people.find((person) => person.id === id);
    if (!current) {
      return { ok: false, error: "Person not found." };
    }

    if (updates.name && updates.name.trim() !== current.name) {
      return { ok: false, error: "The admin API does not expose name edits in this dashboard contract." };
    }

    if (updates.email && updates.email.trim().toLowerCase() !== current.email) {
      return { ok: false, error: "The admin API does not expose email edits in this dashboard contract." };
    }

    try {
      if (updates.role && updates.role !== current.role) {
        await changeAdminUserRole(accessToken, id, toAdminRoleLabel(updates.role));
      }

      if (typeof updates.unit === "string" && updates.unit !== (current.unitId ?? "")) {
        await assignAdminUserUnit(accessToken, id, updates.unit.trim() || null);
      }

      if (updates.status && updates.status !== current.status) {
        if (updates.status === "active") {
          await renewAdminUserAccess(accessToken, id);
        } else {
          await requestAdminUserDeactivation(accessToken, id, "Requested from admin dashboard.");
        }
      }

      const refreshed = await get().fetchPeople(accessToken);
      if (!refreshed.ok) {
        return refreshed;
      }

      return { ok: true };
    } catch (error) {
      return { ok: false, error: formatAdminApiError(error) };
    }
  },
  setStatus: async (accessToken, id, status) => {
    try {
      if (status === "active") {
        await renewAdminUserAccess(accessToken, id);
      } else {
        await requestAdminUserDeactivation(accessToken, id, "Requested from admin dashboard.");
      }

      const refreshed = await get().fetchPeople(accessToken);
      if (!refreshed.ok) {
        return refreshed;
      }

      return { ok: true };
    } catch (error) {
      return { ok: false, error: formatAdminApiError(error) };
    }
  },
  adminResetPassword: async (accessToken, id) => {
    try {
      const response = await resetAdminUserPassword(accessToken, id);
      await get().fetchPeople(accessToken);
      return { ok: true, emailed: response.emailed ?? true };
    } catch (error) {
      return { ok: false, error: formatAdminApiError(error) };
    }
  },
  findByEmail: (email) => {
    const normalized = email.trim().toLowerCase();
    return get().people.find((person) => person.email === normalized);
  },
  getByRole: (role) => get().people.filter((person) => person.role === role),
}));

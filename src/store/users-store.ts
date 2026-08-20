"use client";

import { create } from "zustand";
import type { RoleId } from "@/lib/roles";

export type AccountStatus = "active" | "deactivated";

export type Person = {
  id: string;
  name: string;
  email: string; // stored lowercase
  password: string; // PLAINTEXT — prototype only, no backend to hash against
  role: RoleId;
  unit: string;
  status: AccountStatus;
  lastEdit: string;
};

export type NewPersonInput = {
  name: string;
  email: string;
  password: string;
  role: RoleId;
  unit: string;
  status: AccountStatus;
};

export type CredentialsResult = Person | "invalid" | "deactivated";

type UsersStore = {
  people: Person[];
  addPerson: (input: NewPersonInput) => Person;
  updatePerson: (id: string, updates: Partial<NewPersonInput>) => void;
  setStatus: (id: string, status: AccountStatus) => void;
  adminResetPassword: (id: string) => string | null;
  resetPassword: (email: string, newPassword: string) => boolean;
  changePassword: (id: string, currentPassword: string, newPassword: string) => boolean;
  verifyCredentials: (email: string, password: string) => CredentialsResult;
  findByEmail: (email: string) => Person | undefined;
  getByRole: (role: RoleId) => Person[];
};

// Bumped to v3 to invalidate any previously cached directory (old seed
// emails/passwords, or the now-removed "mt" role) still sitting in a
// browser's localStorage.
const STORAGE_KEY = "ascend_people_directory_v3";

const nowStamp = () =>
  new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

const seedPeople: Person[] = [
  { id: "usr-1", name: "Lead Admin", email: "admin@g.com", password: "12345678", role: "admin", unit: "OPS Global", status: "active", lastEdit: "22 Jul 2026" },
  { id: "usr-2", name: "TSgt Marcus Lee", email: "scs@g.com", password: "12345678", role: "scs", unit: "23rd SFS", status: "active", lastEdit: "22 Jul 2026" },
  { id: "usr-3", name: "Capt. Elena Ruiz", email: "pt-im@g.com", password: "12345678", role: "pt-im", unit: "PT/IM Clinic", status: "active", lastEdit: "22 Jul 2026" },
  { id: "usr-4", name: "Dana Whitfield", email: "nutritionist@g.com", password: "12345678", role: "nutritionist", unit: "Nutrition Services", status: "active", lastEdit: "22 Jul 2026" },
  { id: "usr-5", name: "Dr. Sam Okafor", email: "mp@g.com", password: "12345678", role: "mp", unit: "Mental Performance", status: "active", lastEdit: "22 Jul 2026" },
  { id: "usr-6", name: "Chaplain Rivera", email: "pc@g.com", password: "12345678", role: "pc", unit: "Purpose Readiness", status: "active", lastEdit: "22 Jul 2026" },
  { id: "usr-7", name: "MSgt Alicia Chen", email: "plan@g.com", password: "12345678", role: "plan", unit: "Plans & Scheduling", status: "active", lastEdit: "22 Jul 2026" },
  { id: "usr-8", name: "Col. David Park", email: "leadership@g.com", password: "12345678", role: "leadership", unit: "Wing Command", status: "active", lastEdit: "22 Jul 2026" },
];

const getInitialPeople = (): Person[] => {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fall through to seed data
      }
    }
  }
  return seedPeople;
};

const persist = (people: Person[]) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
  }
};

const genId = () => `usr-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const genTempPassword = () => Math.random().toString(36).slice(-8);

export const useUsersStore = create<UsersStore>((set, get) => ({
  people: getInitialPeople(),

  addPerson: (input) => {
    const person: Person = {
      id: genId(),
      name: input.name,
      email: input.email.trim().toLowerCase(),
      password: input.password,
      role: input.role,
      unit: input.unit,
      status: input.status,
      lastEdit: nowStamp(),
    };
    set((state) => {
      const people = [...state.people, person];
      persist(people);
      return { people };
    });
    return person;
  },

  updatePerson: (id, updates) => {
    set((state) => {
      const people = state.people.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updates,
              email: updates.email ? updates.email.trim().toLowerCase() : p.email,
              lastEdit: nowStamp(),
            }
          : p
      );
      persist(people);
      return { people };
    });
  },

  setStatus: (id, status) => {
    set((state) => {
      const people = state.people.map((p) =>
        p.id === id ? { ...p, status, lastEdit: nowStamp() } : p
      );
      persist(people);
      return { people };
    });
  },

  adminResetPassword: (id) => {
    const person = get().people.find((p) => p.id === id);
    if (!person) return null;
    const newPassword = genTempPassword();
    set((state) => {
      const people = state.people.map((p) =>
        p.id === id ? { ...p, password: newPassword, lastEdit: nowStamp() } : p
      );
      persist(people);
      return { people };
    });
    return newPassword;
  },

  resetPassword: (email, newPassword) => {
    const normalized = email.trim().toLowerCase();
    const person = get().people.find((p) => p.email === normalized);
    if (!person) return false;
    set((state) => {
      const people = state.people.map((p) =>
        p.email === normalized ? { ...p, password: newPassword, lastEdit: nowStamp() } : p
      );
      persist(people);
      return { people };
    });
    return true;
  },

  changePassword: (id, currentPassword, newPassword) => {
    const person = get().people.find((p) => p.id === id);
    if (!person || person.password !== currentPassword) return false;
    set((state) => {
      const people = state.people.map((p) =>
        p.id === id ? { ...p, password: newPassword, lastEdit: nowStamp() } : p
      );
      persist(people);
      return { people };
    });
    return true;
  },

  verifyCredentials: (email, password) => {
    const normalized = email.trim().toLowerCase();
    const person = get().people.find((p) => p.email === normalized);
    if (!person || person.password !== password) return "invalid";
    if (person.status === "deactivated") return "deactivated";
    return person;
  },

  findByEmail: (email) => {
    const normalized = email.trim().toLowerCase();
    return get().people.find((p) => p.email === normalized);
  },

  getByRole: (role) => get().people.filter((p) => p.role === role),
}));

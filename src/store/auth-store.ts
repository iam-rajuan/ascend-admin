"use client";

import { create } from "zustand";
import type { RoleId } from "@/lib/roles";
import type { Person } from "@/store/users-store";

type AuthStore = {
  isAuthenticated: boolean;
  selectedRole: string | null;
  currentUserId: string | null;
  currentUserRole: RoleId | null;
  login: (person: Person) => void;
  logout: () => void;
  setSelectedRole: (role: string | null) => void;
};

// Initial state reading from localStorage if available
const getInitialAuth = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("ascend_isAuthenticated") === "true";
  }
  return false;
};

const getInitialRole = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("ascend_selectedRole");
  }
  return null;
};

const getInitialUserId = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("ascend_currentUserId");
  }
  return null;
};

const getInitialUserRole = (): RoleId | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("ascend_currentUserRole") as RoleId | null;
  }
  return null;
};

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: getInitialAuth(),
  selectedRole: getInitialRole(),
  currentUserId: getInitialUserId(),
  currentUserRole: getInitialUserRole(),
  login: (person) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ascend_isAuthenticated", "true");
      localStorage.setItem("ascend_selectedRole", person.role);
      localStorage.setItem("ascend_currentUserId", person.id);
      localStorage.setItem("ascend_currentUserRole", person.role);
    }
    set({
      isAuthenticated: true,
      selectedRole: person.role,
      currentUserId: person.id,
      currentUserRole: person.role,
    });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ascend_isAuthenticated");
      localStorage.removeItem("ascend_selectedRole");
      localStorage.removeItem("ascend_currentUserId");
      localStorage.removeItem("ascend_currentUserRole");
    }
    set({ isAuthenticated: false, selectedRole: null, currentUserId: null, currentUserRole: null });
  },
  setSelectedRole: (role) => {
    if (typeof window !== "undefined") {
      if (role) {
        localStorage.setItem("ascend_selectedRole", role);
      } else {
        localStorage.removeItem("ascend_selectedRole");
      }
    }
    set({ selectedRole: role });
  },
}));

"use client";

import { create } from "zustand";
import type { RoleId } from "@/lib/roles";
import {
  StaffApiError,
  changeStaffEmail,
  changeStaffPassword,
  deleteOwnAvatar,
  getApiErrorMessage,
  getCurrentStaffUser,
  getOwnAvatar,
  getStaffProfile,
  loginStaff,
  normalizeAuthUser,
  refreshStaffSession,
  updateStaffProfileSettings,
  uploadOwnAvatar,
  type AuthSessionUser,
  type ProfileSettingsPayload,
  type StaffProfile,
} from "@/lib/staff-api";

const STORAGE_KEYS = {
  accessToken: "ascend_admin_access_token",
  refreshToken: "ascend_admin_refresh_token",
  user: "ascend_admin_user",
  profile: "ascend_admin_profile",
} as const;

type AuthResult = { ok: true } | { ok: false; error: string };
type EmailChangeResult = { ok: true; profile: StaffProfile } | { ok: false; error: string };
type ProfileUpdateResult = { ok: true; profile: StaffProfile } | { ok: false; error: string };
type AvatarResult = { ok: true; blob?: Blob | null; profile?: StaffProfile | null } | { ok: false; error: string };

export type AuthStore = {
  isHydrated: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  selectedRole: string | null;
  currentUserId: string | null;
  currentUserRole: RoleId | null;
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthSessionUser | null;
  profile: StaffProfile | null;
  authError: string | null;
  initialize: () => Promise<void>;
  loginWithPassword: (email: string, password: string, rememberMe: boolean) => Promise<AuthResult>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
  fetchProfile: () => Promise<StaffProfile | null>;
  updateProfileSettings: (payload: ProfileSettingsPayload) => Promise<ProfileUpdateResult>;
  changePassword: (payload: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<AuthResult>;
  changeEmail: (payload: { newEmail: string; currentPassword: string }) => Promise<EmailChangeResult>;
  fetchAvatar: () => Promise<AvatarResult>;
  uploadAvatar: (file: File) => Promise<AvatarResult>;
  deleteAvatar: () => Promise<AvatarResult>;
};

function readString(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key);
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function persistSession(state: {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthSessionUser | null;
  profile: StaffProfile | null;
}) {
  if (typeof window === "undefined") {
    return;
  }

  if (state.accessToken) {
    window.localStorage.setItem(STORAGE_KEYS.accessToken, state.accessToken);
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.accessToken);
  }

  if (state.refreshToken) {
    window.localStorage.setItem(STORAGE_KEYS.refreshToken, state.refreshToken);
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.refreshToken);
  }

  if (state.user) {
    window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(state.user));
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.user);
  }

  if (state.profile) {
    window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(state.profile));
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.profile);
  }
}

function clearSessionStorage() {
  persistSession({
    accessToken: null,
    refreshToken: null,
    user: null,
    profile: null,
  });
}

function getSessionFields(user: AuthSessionUser | null) {
  return {
    isAuthenticated: !!user,
    selectedRole: user?.roleId ?? null,
    currentUserId: user?.id ?? null,
    currentUserRole: user?.roleId ?? null,
    user,
  };
}

export const useAuthStore = create<AuthStore>()((set, get) => {
  async function withTokenRefresh<T>(request: (token: string) => Promise<T>): Promise<T> {
    const token = get().accessToken;

    if (!token) {
      throw new Error("You are signed out. Please sign in again.");
    }

    try {
      return await request(token);
    } catch (error) {
      if (!(error instanceof StaffApiError) || error.status !== 401) {
        throw error;
      }

      const refreshed = await get().refreshSession();
      const nextToken = get().accessToken;

      if (!refreshed || !nextToken) {
        throw error;
      }

      return request(nextToken);
    }
  }

  return {
    isHydrated: false,
    isLoading: false,
    isAuthenticated: false,
    selectedRole: null,
    currentUserId: null,
    currentUserRole: null,
    accessToken: null,
    refreshToken: null,
    user: null,
    profile: null,
    authError: null,

    initialize: async () => {
      if (get().isHydrated) {
        return;
      }

      const accessToken = readString(STORAGE_KEYS.accessToken);
      const refreshToken = readString(STORAGE_KEYS.refreshToken);
      const user = readJson<AuthSessionUser>(STORAGE_KEYS.user);
      const profile = readJson<StaffProfile>(STORAGE_KEYS.profile);

      set({
        ...getSessionFields(user),
        accessToken,
        refreshToken,
        profile,
        isHydrated: true,
      });

      if (!accessToken) {
        return;
      }

      set({ isLoading: true, authError: null });

      try {
        const nextUser = await getCurrentStaffUser(accessToken);
        const nextProfile = await getStaffProfile(accessToken);

        persistSession({
          accessToken,
          refreshToken,
          user: nextUser,
          profile: nextProfile,
        });

        set({
          ...getSessionFields(nextUser),
          accessToken,
          refreshToken,
          profile: nextProfile,
          isLoading: false,
        });
      } catch {
        const refreshed = await get().refreshSession();

        if (!refreshed) {
          clearSessionStorage();
          set({
            ...getSessionFields(null),
            accessToken: null,
            refreshToken: null,
            profile: null,
            authError: "Your session expired. Please sign in again.",
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      }
    },

    loginWithPassword: async (email, password, rememberMe) => {
      set({ isLoading: true, authError: null });

      try {
        const session = await loginStaff(email.trim(), password, rememberMe);
        const user = normalizeAuthUser(session.user);
        const profile = await getStaffProfile(session.access_token);

        persistSession({
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          user,
          profile,
        });

        set({
          ...getSessionFields(user),
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          profile,
          isHydrated: true,
          isLoading: false,
        });

        return { ok: true };
      } catch (error) {
        const message = getApiErrorMessage(error);
        set({ isLoading: false, authError: message });
        return { ok: false, error: message };
      }
    },

    logout: () => {
      clearSessionStorage();
      set({
        ...getSessionFields(null),
        accessToken: null,
        refreshToken: null,
        profile: null,
        authError: null,
        isHydrated: true,
        isLoading: false,
      });
    },

    refreshSession: async () => {
      const refreshToken = get().refreshToken ?? readString(STORAGE_KEYS.refreshToken);

      if (!refreshToken) {
        return false;
      }

      try {
        const refreshed = await refreshStaffSession(refreshToken);
        const accessToken = refreshed.access_token;
        const nextRefreshToken = refreshed.refresh_token ?? refreshToken;
        const user = await getCurrentStaffUser(accessToken);
        const profile = await getStaffProfile(accessToken);

        persistSession({
          accessToken,
          refreshToken: nextRefreshToken,
          user,
          profile,
        });

        set({
          ...getSessionFields(user),
          accessToken,
          refreshToken: nextRefreshToken,
          profile,
          authError: null,
        });

        return true;
      } catch {
        return false;
      }
    },

    fetchProfile: async () => {
      try {
        const profile = await withTokenRefresh((token) => getStaffProfile(token));

        persistSession({
          accessToken: get().accessToken,
          refreshToken: get().refreshToken,
          user: get().user,
          profile,
        });

        set({ profile });
        return profile;
      } catch {
        return null;
      }
    },

    updateProfileSettings: async (payload) => {
      try {
        const profile = await withTokenRefresh((token) => updateStaffProfileSettings(token, payload));

        persistSession({
          accessToken: get().accessToken,
          refreshToken: get().refreshToken,
          user: get().user,
          profile,
        });

        set({ profile });
        return { ok: true, profile };
      } catch (error) {
        return { ok: false, error: getApiErrorMessage(error) };
      }
    },

    changePassword: async ({ currentPassword, newPassword, confirmPassword }) => {
      try {
        await withTokenRefresh((token) =>
          changeStaffPassword(token, {
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        );

        return { ok: true };
      } catch (error) {
        return { ok: false, error: getApiErrorMessage(error) };
      }
    },

    changeEmail: async ({ newEmail, currentPassword }) => {
      try {
        const profile = await withTokenRefresh((token) =>
          changeStaffEmail(token, {
            new_email: newEmail,
            current_password: currentPassword,
          }),
        );

        const currentUser = get().user;
        const nextUser = currentUser
          ? {
              ...currentUser,
              email: profile.email,
              full_name: profile.full_name,
              is_verified: profile.is_verified,
            }
          : null;

        persistSession({
          accessToken: get().accessToken,
          refreshToken: get().refreshToken,
          user: nextUser,
          profile,
        });

        set({
          ...getSessionFields(nextUser),
          profile,
        });

        return { ok: true, profile };
      } catch (error) {
        return { ok: false, error: getApiErrorMessage(error) };
      }
    },

    fetchAvatar: async () => {
      try {
        const blob = await withTokenRefresh((token) => getOwnAvatar(token));
        return { ok: true, blob };
      } catch (error) {
        return { ok: false, error: getApiErrorMessage(error) };
      }
    },

    uploadAvatar: async (file) => {
      try {
        await withTokenRefresh((token) => uploadOwnAvatar(token, file));
        const profile = await get().fetchProfile();
        return { ok: true, blob: null, profile };
      } catch (error) {
        return { ok: false, error: getApiErrorMessage(error) };
      }
    },

    deleteAvatar: async () => {
      try {
        await withTokenRefresh((token) => deleteOwnAvatar(token));
        const profile = await get().fetchProfile();
        return { ok: true, blob: null, profile };
      } catch (error) {
        return { ok: false, error: getApiErrorMessage(error) };
      }
    },
  };
});

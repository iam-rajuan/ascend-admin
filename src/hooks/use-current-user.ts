"use client";

import { useAuthStore } from "@/store/auth-store";
import { getInitials } from "@/lib/utils";

export function useCurrentUser() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: profile?.full_name || user.full_name,
    email: profile?.email || user.email,
    role: user.roleId,
    roleName: user.roleName,
    unit: profile?.unit_id || "No unit assigned",
    status: user.is_active ? "active" : "deactivated",
    initials: getInitials(profile?.full_name || user.full_name),
    isVerified: profile?.is_verified ?? user.is_verified,
    rankGrade: profile?.rank_grade || null,
    memberSince: profile?.member_since || user.created_at || null,
    lastLoginAt: profile?.sign_in_activation?.last_login_at || user.last_login_at || null,
    notificationsEnabled: profile?.notifications_enabled ?? false,
    themePreference: profile?.theme_preference || "light",
  };
}

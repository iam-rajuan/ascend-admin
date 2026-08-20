"use client";

import { useAuthStore } from "@/store/auth-store";
import { useUsersStore } from "@/store/users-store";
import { getInitials } from "@/lib/utils";
import { getRoleName } from "@/lib/roles";

export function useCurrentUser() {
  const currentUserId = useAuthStore((state) => state.currentUserId);
  const person = useUsersStore((state) =>
    state.people.find((p) => p.id === currentUserId)
  );

  if (!person) {
    return null;
  }

  return {
    id: person.id,
    name: person.name,
    email: person.email,
    role: person.role,
    roleName: getRoleName(person.role),
    unit: person.unit,
    status: person.status,
    initials: getInitials(person.name),
  };
}

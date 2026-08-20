import {
  Shield,
  Users,
  ClipboardList,
  Compass,
  Apple,
  Stethoscope,
  Landmark,
  Brain,
  type LucideIcon,
} from "lucide-react";

export type RoleId =
  | "admin"
  | "leadership"
  | "plan"
  | "pc"
  | "nutritionist"
  | "mp"
  | "pt-im"
  | "scs";

export type RoleDefinition = {
  id: RoleId;
  name: string;
  icon: LucideIcon;
  description: string;
};

// role.id doubles as the /dashboard/<id> route slug — keep it in sync with
// the folder under src/app/dashboard/. role.name is display-only and must
// never be used to derive a route.
export const roles: RoleDefinition[] = [
  { id: "admin", name: "Admin", icon: Shield, description: "System administration and configuration" },
  { id: "leadership", name: "Leadership", icon: Users, description: "Executive oversight and command metrics" },
  { id: "plan", name: "Plan", icon: ClipboardList, description: "Strategic planning and scheduling" },
  { id: "pc", name: "Purpose Coach", icon: Compass, description: "Spiritual/purpose readiness — opt-in support pathway" },
  { id: "nutritionist", name: "Nutritionist", icon: Apple, description: "Nutritional tracking and planning" },
  { id: "mp", name: "MP", icon: Brain, description: "Mental performance coaching and readiness" },
  { id: "pt-im", name: "PT/IM", icon: Stethoscope, description: "Physical therapy and readiness" },
  { id: "scs", name: "SCS", icon: Landmark, description: "Support command services" },
];

export const roleIds: RoleId[] = roles.map((r) => r.id);

export function getRoleDefinition(id: string | null | undefined): RoleDefinition | undefined {
  return roles.find((r) => r.id === id);
}

export function getRoleName(id: string | null | undefined): string {
  return getRoleDefinition(id)?.name ?? "Unknown";
}

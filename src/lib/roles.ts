import {
  Shield,
  Users,
  ClipboardList,
  Compass,
  Apple,
  Stethoscope,
  Dumbbell,
  Brain,
  ClipboardPlus,
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
  | "scs"
  | "idmt";

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
  { id: "plan", name: "Program Manager", icon: ClipboardList, description: "oversees program activity, workflow status, aggregate trends, and operational coordination." },
  { id: "pc", name: "Purpose Coach", icon: Compass, description: "Spiritual/purpose readiness — opt-in support pathway" },
  { id: "nutritionist", name: "Nutritionist", icon: Apple, description: "Nutritional tracking and planning" },
  { id: "mp", name: "Mental Performance", icon: Brain, description: "supports cognitive skills, stress-management strategies, focus, and performance under pressure." },
  { id: "pt-im", name: "Physical Therapy / Injury Management", icon: Stethoscope, description: "supports appropriate rehabilitation and injury-management workflows while maintaining clear separation between clinical care and performance support." },
  { id: "scs", name: "Strength & Conditioning Specialist", icon: Dumbbell, description: "supports physical performance, conditioning, and performance-plan follow-up." },
  { id: "idmt", name: "IDMT", icon: ClipboardPlus, description: "Independent duty medical technician handoffs" },
];

export const roleIds: RoleId[] = roles.map((r) => r.id);

export function getRoleDefinition(id: string | null | undefined): RoleDefinition | undefined {
  return roles.find((r) => r.id === id);
}

export function getRoleName(id: string | null | undefined): string {
  return getRoleDefinition(id)?.name ?? "Unknown";
}

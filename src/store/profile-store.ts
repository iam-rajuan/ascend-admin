"use client";

import { create } from "zustand";

export interface UserSession {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export interface UserPreferences {
  emailNotifications: boolean;
  securityAlerts: boolean;
  operationalBriefings: boolean;
  theme: "light" | "dark";
  compactView: boolean;
}

export interface UserProfile {
  roleId: string;
  roleName: string;
  name: string;
  rankTitle: string;
  email: string;
  phone: string;
  department: string;
  dutyLocation: string;
  officerId: string;
  clearanceLevel: string;
  credentials: string[];
  bio: string;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
  passwordLastChanged: string;
  sessions: UserSession[];
  preferences: UserPreferences;
}

const defaultProfiles: Record<string, UserProfile> = {
  admin: {
    roleId: "admin",
    roleName: "Admin",
    name: "Col. Marcus Vance",
    rankTitle: "Lead Systems Administrator / Colonel",
    email: "marcus.vance@ascend.mil",
    phone: "+1 (555) 019-2831",
    department: "OPS Global System Operations",
    dutyLocation: "HQ Cyber Ops Center - Pentagon",
    officerId: "ADM-88402-US",
    clearanceLevel: "TS/SCI (Top Secret / SCI)",
    credentials: [
      "Certified Information Systems Security Professional (CISSP)",
      "Red Hat Certified Architect (RHCA)",
      "DoD Cyber Systems Oversight & Access Gating",
    ],
    bio: "Lead Administrator overseeing network infrastructure, authentication policy, audit compliance, and system status across all Ascend operational units.",
    twoFactorEnabled: true,
    passwordLastChanged: "14 days ago",
    sessions: [
      { id: "s-1", device: "Chrome 122 (Windows 11)", ip: "192.168.1.104", location: "Arlington, VA (Pentagon)", lastActive: "Active now", current: true },
      { id: "s-2", device: "Mobile App (iOS 17)", ip: "10.42.8.19", location: "Fort Meade, MD", lastActive: "2 hours ago", current: false },
    ],
    preferences: {
      emailNotifications: true,
      securityAlerts: true,
      operationalBriefings: false,
      theme: "dark",
      compactView: false,
    },
  },
  leadership: {
    roleId: "leadership",
    roleName: "Leadership",
    name: "Maj. Gen. Sarah Jenkins",
    rankTitle: "Executive Operations Commander / Major General",
    email: "sarah.jenkins@ascend.mil",
    phone: "+1 (555) 012-9920",
    department: "Executive Command & Strategy Oversight",
    dutyLocation: "Joint Force HQ - Command Deck",
    officerId: "CDR-10492-US",
    clearanceLevel: "TS/SCI (Top Secret / SCI)",
    credentials: [
      "Joint Staff Executive Command Certification",
      "Strategic Force Planning & Operational Assessment",
      "Defense Leadership Executive Council",
    ],
    bio: "Executive commander responsible for strategic alignment, multi-domain readiness tracking, and executive briefing synthesis across all operational divisions.",
    twoFactorEnabled: true,
    passwordLastChanged: "30 days ago",
    sessions: [
      { id: "s-3", device: "Safari 17 (macOS Sonoma)", ip: "192.168.2.44", location: "Washington, D.C.", lastActive: "Active now", current: true },
    ],
    preferences: {
      emailNotifications: true,
      securityAlerts: true,
      operationalBriefings: true,
      theme: "dark",
      compactView: false,
    },
  },
  plan: {
    roleId: "plan",
    roleName: "Plan",
    name: "Lt. Col. David Vance",
    rankTitle: "Chief Operational Planner / Lieutenant Colonel",
    email: "david.vance@ascend.mil",
    phone: "+1 (555) 014-4822",
    department: "Strategic Operations & Scheduling",
    dutyLocation: "4th Operational Planning Group",
    officerId: "PLN-33019-US",
    clearanceLevel: "Secret / NATO Secret",
    credentials: [
      "Master Operational Planner (MOP)",
      "Tactical Reconditioning Pipeline Coordinator",
      "Joint Resource Logistics Management",
    ],
    bio: "Chief planner directing operational unit assignments, exercise scheduling, readiness pipelines, and reconditioning track allocations.",
    twoFactorEnabled: true,
    passwordLastChanged: "45 days ago",
    sessions: [
      { id: "s-4", device: "Edge 122 (Windows 11)", ip: "192.168.4.12", location: "Tampa, FL (MacDill AFB)", lastActive: "Active now", current: true },
    ],
    preferences: {
      emailNotifications: true,
      securityAlerts: true,
      operationalBriefings: true,
      theme: "light",
      compactView: true,
    },
  },
  pc: {
    roleId: "pc",
    roleName: "PC",
    name: "Capt. Elena Rostova",
    rankTitle: "Personal Computing & Performance Coach / Captain",
    email: "elena.rostova@ascend.mil",
    phone: "+1 (555) 017-3310",
    department: "Human Performance & Technical Integration",
    dutyLocation: "Human Performance Wing - Unit 3",
    officerId: "PC-55102-US",
    clearanceLevel: "Secret",
    credentials: [
      "Certified Strength & Conditioning Specialist (CSCS)",
      "Cognitive Workspace Architecture Specialist",
      "Airman Performance & Reflection Log Lead",
    ],
    bio: "Lead workspace and human performance coach managing airman caseloads, reflection logs, and direct daily performance interactions.",
    twoFactorEnabled: true,
    passwordLastChanged: "21 days ago",
    sessions: [
      { id: "s-5", device: "Chrome 122 (Windows 11)", ip: "192.168.3.88", location: "San Antonio, TX (JBSA)", lastActive: "Active now", current: true },
    ],
    preferences: {
      emailNotifications: false,
      securityAlerts: true,
      operationalBriefings: false,
      theme: "dark",
      compactView: false,
    },
  },
  nutrotinish: {
    roleId: "nutrotinish",
    roleName: "Nutrotinish",
    name: "Maj. Robert Sterling, RD",
    rankTitle: "Chief Tactical Nutritionist / Major",
    email: "robert.sterling@ascend.mil",
    phone: "+1 (555) 018-7741",
    department: "Clinical & Tactical Nutrition Operations",
    dutyLocation: "Special Readiness Nutrition Center",
    officerId: "NUT-77201-US",
    clearanceLevel: "Secret / Operational Medical Access",
    credentials: [
      "Registered Dietitian (RD)",
      "Board Certified Specialist in Sports Dietetics (CSSD)",
      "Tactical Metabolism & Hydration Specialist",
    ],
    bio: "Chief nutritionist responsible for airman nutritional intake optimization, dietary consults, fueling schedules, and metabolic recovery plans.",
    twoFactorEnabled: true,
    passwordLastChanged: "12 days ago",
    sessions: [
      { id: "s-6", device: "Firefox 123 (Windows 11)", ip: "192.168.5.21", location: "Colorado Springs, CO", lastActive: "Active now", current: true },
    ],
    preferences: {
      emailNotifications: true,
      securityAlerts: true,
      operationalBriefings: false,
      theme: "light",
      compactView: false,
    },
  },
  mp: {
    roleId: "mp",
    roleName: "MP",
    name: "Dr. Aris Thorne, Psy.D.",
    rankTitle: "Chief Mental Performance Psychologist / Lt. Col.",
    email: "aris.thorne@ascend.mil",
    phone: "+1 (555) 016-5590",
    department: "Cognitive Readiness & Mental Performance",
    dutyLocation: "Behavioral Science Operational Wing",
    officerId: "MP-44810-US",
    clearanceLevel: "Secret / HIPAA Confidential Access",
    credentials: [
      "Licensed Clinical Psychologist (Psy.D.)",
      "Certified Mental Performance Consultant (CMPC)",
      "SOAP Clinical Assessment Lead",
    ],
    bio: "Senior cognitive specialist handling mental health evaluations, confidential SOAP clinical notes, and psychological readiness protocols.",
    twoFactorEnabled: true,
    passwordLastChanged: "7 days ago",
    sessions: [
      { id: "s-7", device: "Chrome 122 (macOS)", ip: "192.168.6.101", location: "Dayton, OH (Wright-Patt)", lastActive: "Active now", current: true },
    ],
    preferences: {
      emailNotifications: true,
      securityAlerts: true,
      operationalBriefings: true,
      theme: "dark",
      compactView: false,
    },
  },
  "pt-im": {
    roleId: "pt-im",
    roleName: "PT/IM",
    name: "Capt. Jonathan Chen, DPT",
    rankTitle: "Lead Physical Therapist & IM Specialist / Captain",
    email: "jonathan.chen@ascend.mil",
    phone: "+1 (555) 013-8824",
    department: "Physical Therapy & Integrative Medicine",
    dutyLocation: "8th Human Performance Rehabilitation Clinic",
    officerId: "PT-99318-US",
    clearanceLevel: "Secret / Medical Officer Access",
    credentials: [
      "Doctor of Physical Therapy (DPT)",
      "Board Certified Orthopedic Specialist (OCS)",
      "Musculoskeletal Range-of-Motion (ROM) Specialist",
    ],
    bio: "Lead physical therapist directing musculoskeletal rehabilitation, ROM tracking, quarterly profile reviews, and SCS handoff coordination.",
    twoFactorEnabled: true,
    passwordLastChanged: "18 days ago",
    sessions: [
      { id: "s-8", device: "Chrome 122 (Windows 11)", ip: "192.168.7.77", location: "San Antonio, TX", lastActive: "Active now", current: true },
    ],
    preferences: {
      emailNotifications: true,
      securityAlerts: true,
      operationalBriefings: false,
      theme: "dark",
      compactView: false,
    },
  },
  scs: {
    roleId: "scs",
    roleName: "SCS",
    name: "Cmdr. Rachel Taylor",
    rankTitle: "Support Command Operations Director / Commander",
    email: "rachel.taylor@ascend.mil",
    phone: "+1 (555) 011-6644",
    department: "Support Command & Force Services",
    dutyLocation: "Support Operations Center East",
    officerId: "SCS-66290-US",
    clearanceLevel: "Secret",
    credentials: [
      "Defense Logistics Command Director",
      "Force Support Operations Officer",
      "Resource Distribution & Duty Status Lead",
    ],
    bio: "Director of Support Command Services overseeing unit duty status, medical profile restrictions, resource distribution, and operational readiness coverage.",
    twoFactorEnabled: true,
    passwordLastChanged: "25 days ago",
    sessions: [
      { id: "s-9", device: "Edge 122 (Windows 11)", ip: "192.168.8.19", location: "Norfolk, VA", lastActive: "Active now", current: true },
    ],
    preferences: {
      emailNotifications: true,
      securityAlerts: true,
      operationalBriefings: true,
      theme: "dark",
      compactView: true,
    },
  },
};

interface ProfileStoreState {
  profiles: Record<string, UserProfile>;
  getProfile: (roleId: string) => UserProfile;
  updateProfile: (roleId: string, updates: Partial<UserProfile>) => void;
  updatePassword: (roleId: string, newPasswordDate?: string) => void;
  toggle2FA: (roleId: string) => void;
  revokeSession: (roleId: string, sessionId: string) => void;
  updatePreferences: (roleId: string, prefs: Partial<UserPreferences>) => void;
  addCredential: (roleId: string, cred: string) => void;
  removeCredential: (roleId: string, cred: string) => void;
}

export const useProfileStore = create<ProfileStoreState>((set, get) => ({
  profiles: defaultProfiles,

  getProfile: (roleId: string) => {
    const key = roleId.toLowerCase().replace("/", "-");
    return get().profiles[key] || defaultProfiles.admin;
  },

  updateProfile: (roleId: string, updates: Partial<UserProfile>) => {
    const key = roleId.toLowerCase().replace("/", "-");
    set((state) => ({
      profiles: {
        ...state.profiles,
        [key]: {
          ...(state.profiles[key] || defaultProfiles.admin),
          ...updates,
        },
      },
    }));
  },

  updatePassword: (roleId: string, newPasswordDate = "Just now") => {
    const key = roleId.toLowerCase().replace("/", "-");
    set((state) => ({
      profiles: {
        ...state.profiles,
        [key]: {
          ...(state.profiles[key] || defaultProfiles.admin),
          passwordLastChanged: newPasswordDate,
        },
      },
    }));
  },

  toggle2FA: (roleId: string) => {
    const key = roleId.toLowerCase().replace("/", "-");
    set((state) => {
      const current = state.profiles[key] || defaultProfiles.admin;
      return {
        profiles: {
          ...state.profiles,
          [key]: {
            ...current,
            twoFactorEnabled: !current.twoFactorEnabled,
          },
        },
      };
    });
  },

  revokeSession: (roleId: string, sessionId: string) => {
    const key = roleId.toLowerCase().replace("/", "-");
    set((state) => {
      const current = state.profiles[key] || defaultProfiles.admin;
      return {
        profiles: {
          ...state.profiles,
          [key]: {
            ...current,
            sessions: current.sessions.filter((s) => s.id !== sessionId),
          },
        },
      };
    });
  },

  updatePreferences: (roleId: string, prefs: Partial<UserPreferences>) => {
    const key = roleId.toLowerCase().replace("/", "-");
    set((state) => {
      const current = state.profiles[key] || defaultProfiles.admin;
      return {
        profiles: {
          ...state.profiles,
          [key]: {
            ...current,
            preferences: {
              ...current.preferences,
              ...prefs,
            },
          },
        },
      };
    });
  },

  addCredential: (roleId: string, cred: string) => {
    const key = roleId.toLowerCase().replace("/", "-");
    set((state) => {
      const current = state.profiles[key] || defaultProfiles.admin;
      if (current.credentials.includes(cred)) return state;
      return {
        profiles: {
          ...state.profiles,
          [key]: {
            ...current,
            credentials: [...current.credentials, cred],
          },
        },
      };
    });
  },

  removeCredential: (roleId: string, cred: string) => {
    const key = roleId.toLowerCase().replace("/", "-");
    set((state) => {
      const current = state.profiles[key] || defaultProfiles.admin;
      return {
        profiles: {
          ...state.profiles,
          [key]: {
            ...current,
            credentials: current.credentials.filter((c) => c !== cred),
          },
        },
      };
    });
  },
}));

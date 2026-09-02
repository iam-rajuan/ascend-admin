import { env } from "@/lib/env";
import type { RoleId } from "@/lib/roles";

const NGROK_HEADERS = {
  "ngrok-skip-browser-warning": "1",
};

export class StaffApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "StaffApiError";
    this.status = status;
    this.payload = payload;
  }
}

type ApiEnvelope<T> = {
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
};

export type StaffApiUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  onboarding_completed?: boolean;
  onboarding_status?: string | null;
  onboarding_step?: string | null;
  day0_daily_checkin_status?: string | null;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string | null;
};

export type StaffLoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  remember_me: boolean;
  user: StaffApiUser;
};

export type StaffProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  unit_id: string | null;
  rank_grade: string | null;
  avatar_url?: string | null;
  avatar_available: boolean;
  is_verified: boolean;
  onboarding_completed: boolean;
  onboarding_status: string | null;
  day0_daily_checkin_status: string | null;
  current_ops_score: number | null;
  current_ops_band: string | null;
  current_ops_band_meaning: string | null;
  ops_confidence_level: string | null;
  onboarding_baseline_ops_score: number | null;
  onboarding_baseline_band: string | null;
  support_pathways_opted_in: string[];
  assigned_scs: { user_id: string; name: string } | null;
  assigned_ptim: { user_id: string; name: string } | null;
  communications_preference: string | null;
  theme_preference: "light" | "dark" | null;
  notifications_enabled: boolean;
  data_use_consent: boolean;
  wellness_recommendations_opt_in: boolean;
  policy_version_accepted: string | null;
  policy_acknowledged_at: string | null;
  sign_in_activation: {
    is_verified: boolean;
    member_since: string | null;
    last_login_at: string | null;
  } | null;
  member_since: string | null;
};

export type ProfileSettingsPayload = {
  full_name?: string;
  rank_grade?: string;
  theme_preference?: "light" | "dark";
  notifications_enabled?: boolean;
};

export type AuthSessionUser = StaffApiUser & {
  roleId: RoleId;
  roleName: string;
};

function extractReadableError(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((item) => extractReadableError(item))
      .filter((item): item is string => Boolean(item));
    return messages.length > 0 ? messages.join(", ") : null;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = [
      record.message,
      record.detail,
      record.error,
      record.reason,
      record.title,
    ]
      .map((item) => extractReadableError(item))
      .find(Boolean);

    if (preferred) {
      return preferred;
    }

    const fieldMessages = Object.entries(record)
      .flatMap(([key, item]) => {
        const readable = extractReadableError(item);
        return readable ? [`${key}: ${readable}`] : [];
      });

    return fieldMessages.length > 0 ? fieldMessages.join("; ") : null;
  }

  return null;
}

function buildUrl(path: string) {
  return `${env.NEXT_PUBLIC_API_BASE_URL}${path}`;
}

export function resolveStaffAssetUrl(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return buildUrl(path);
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as ApiEnvelope<T>) : {};

  if (!response.ok) {
    throw new StaffApiError(
      payload.message || `Request failed with status ${response.status}.`,
      response.status,
      payload,
    );
  }

  return (payload.data ?? payload) as T;
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      ...NGROK_HEADERS,
      ...(init?.headers ?? {}),
    },
  });

  return parseEnvelope<T>(response);
}

export function normalizeRole(roleLabel: string | null | undefined): RoleId {
  const normalized = (roleLabel ?? "").trim().toLowerCase().replace(/[\s/_]+/g, "-");

  switch (normalized) {
    case "dws-admin":
    case "admin":
    case "dws-super-admin":
    case "dws-superadmin":
    case "super-admin":
      return "admin";
    case "leadership":
      return "leadership";
    case "plan":
      return "plan";
    case "chaplain":
    case "purpose-coach":
    case "pc":
      return "pc";
    case "nutritionist":
      return "nutritionist";
    case "mental-performance":
    case "mp":
      return "mp";
    case "pt-im":
    case "ptim":
      return "pt-im";
    case "scs":
      return "scs";
    case "idmt":
      return "idmt";
    default:
      return "admin";
  }
}

export function roleLabelToName(roleLabel: string | null | undefined) {
  const roleId = normalizeRole(roleLabel);
  switch (roleId) {
    case "pc":
      return "Purpose Coach";
    case "pt-im":
      return "PT/IM";
    case "mp":
      return "MP";
    case "idmt":
      return "IDMT";
    default:
      return roleId.charAt(0).toUpperCase() + roleId.slice(1);
  }
}

export function normalizeAuthUser(user: StaffApiUser): AuthSessionUser {
  const roleId = normalizeRole(user.role);

  return {
    ...user,
    roleId,
    roleName: roleLabelToName(user.role),
  };
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof StaffApiError) {
    return extractReadableError(error.payload) || extractReadableError(error.message) || "Something went wrong while talking to the Ascend API.";
  }

  if (error instanceof Error) {
    return extractReadableError(error.message) || "Something went wrong while talking to the Ascend API.";
  }

  return extractReadableError(error) || "Something went wrong while talking to the Ascend API.";
}

export async function loginStaff(email: string, password: string, rememberMe: boolean) {
  return request<StaffLoginResponse>("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      remember_me: rememberMe,
    }),
  });
}

export async function refreshStaffSession(refreshToken: string) {
  return request<{ access_token: string; refresh_token?: string; token_type?: string }>("/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });
}

export async function getCurrentStaffUser(accessToken: string) {
  const user = await request<StaffApiUser>("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return normalizeAuthUser(user);
}

export async function getStaffProfile(accessToken: string) {
  return request<StaffProfile>("/users/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function updateStaffProfileSettings(accessToken: string, payload: ProfileSettingsPayload) {
  return request<StaffProfile>("/users/profile/settings", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function changeStaffPassword(
  accessToken: string,
  payload: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  },
) {
  return request<{ success?: boolean }>("/users/change-password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function changeStaffEmail(
  accessToken: string,
  payload: {
    new_email: string;
    current_password: string;
  },
) {
  return request<StaffProfile>("/users/change-email", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getOwnAvatar(accessToken: string) {
  const response = await fetch(buildUrl("/users/profile/avatar"), {
    method: "GET",
    headers: {
      ...NGROK_HEADERS,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 400 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    let payload: unknown = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new StaffApiError(
      (payload as { message?: string } | null)?.message || `Request failed with status ${response.status}.`,
      response.status,
      payload,
    );
  }

  return response.blob();
}

export async function uploadOwnAvatar(accessToken: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(buildUrl("/users/profile/avatar"), {
    method: "POST",
    headers: {
      ...NGROK_HEADERS,
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  return parseEnvelope<unknown>(response);
}

export async function deleteOwnAvatar(accessToken: string) {
  return request<unknown>("/users/profile/avatar", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function requestPasswordReset(email: string) {
  return request<{ success?: boolean }>("/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
}

export async function verifyResetCode(email: string, code: string) {
  return request<{ success?: boolean }>("/auth/verify-reset-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });
}

export async function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string,
  confirmPassword: string,
) {
  return request<{ success?: boolean }>("/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      code,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });
}

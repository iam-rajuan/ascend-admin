"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  Camera,
  ImagePlus,
  KeyRound,
  LogOut,
  Mail,
  Moon,
  Trash2,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { AscendLogo } from "@/components/ascend-logo";
import { IconButton } from "@/components/ui/icon-button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { resolveStaffAssetUrl } from "@/lib/staff-api";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { show, message, triggerToast } = useToast();
  const user = useCurrentUser();

  const logout = useAuthStore((state) => state.logout);
  const profile = useAuthStore((state) => state.profile);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const updateProfileSettings = useAuthStore((state) => state.updateProfileSettings);
  const changePassword = useAuthStore((state) => state.changePassword);
  const changeEmail = useAuthStore((state) => state.changeEmail);
  const uploadAvatar = useAuthStore((state) => state.uploadAvatar);
  const deleteAvatar = useAuthStore((state) => state.deleteAvatar);

  const [fullName, setFullName] = useState("");
  const [rankGrade, setRankGrade] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSaving, setAvatarSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  const [settingsSaving, setSettingsSaving] = useState(false);

  const buildAvatarSrc = (path: string | null | undefined) => {
    const resolved = resolveStaffAssetUrl(path);
    return resolved ? `${resolved}?t=${Date.now()}` : null;
  };

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void fetchProfile();
  }, [fetchProfile, isHydrated]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFullName(profile.full_name || "");
    setRankGrade(profile.rank_grade || "");
    setNotificationsEnabled(profile.notifications_enabled);
    setNewEmail(profile.email || "");
    setAvatarUrl(buildAvatarSrc(profile.avatar_url));
  }, [profile]);

  if (!user || !profile || !isHydrated || isLoading) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleProfileSave = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError("");
    setSettingsSaving(true);

    const result = await updateProfileSettings({
      full_name: fullName.trim(),
      rank_grade: rankGrade.trim() || undefined,
      theme_preference: theme,
      notifications_enabled: notificationsEnabled,
    });

    setSettingsSaving(false);

    if (!result.ok) {
      setProfileError(result.error);
      return;
    }

    if (result.profile.theme_preference && result.profile.theme_preference !== theme) {
      toggleTheme();
    }

    triggerToast("Profile settings saved.");
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setAvatarError("");
    setAvatarSaving(true);

    const result = await uploadAvatar(file);

    setAvatarSaving(false);

    if (!result.ok) {
      setAvatarError(result.error);
      return;
    }

    setAvatarUrl(buildAvatarSrc(result.profile?.avatar_url));

    triggerToast("Profile photo uploaded.");
  };

  const handleAvatarDelete = async () => {
    setAvatarError("");
    setAvatarSaving(true);

    const result = await deleteAvatar();

    setAvatarSaving(false);

    if (!result.ok) {
      setAvatarError(result.error);
      return;
    }

    setAvatarUrl(buildAvatarSrc(result.profile?.avatar_url));

    triggerToast("Profile photo removed.");
  };

  const handleChangePassword = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    const result = await changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    setPasswordSaving(false);

    if (!result.ok) {
      setPasswordError(result.error);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    triggerToast("Password updated.");
  };

  const handleChangeEmail = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError("");
    setEmailSaving(true);

    const result = await changeEmail({
      newEmail: newEmail.trim(),
      currentPassword: emailPassword,
    });

    setEmailSaving(false);

    if (!result.ok) {
      setEmailError(result.error);
      return;
    }

    setEmailPassword("");
    triggerToast("Email updated. Verification is now required for the new address.");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f0f4f9] font-sans text-slate-800 transition-colors duration-200 dark:bg-[#070a13] dark:text-slate-100">
      <header className="z-20 flex h-14 w-full flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-white/5 dark:bg-[#0e1628] md:px-8">
        <div className="flex items-center gap-2">
          <AscendLogo width={20} height={20} showDetails={false} />
          <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">Ascend</span>
          <span className="select-none text-xs font-light text-slate-400 dark:text-slate-500">/</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">My profile</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/${user.role}`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors duration-200 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            type="button"
          >
            <ArrowLeft className="size-4" />
            BACK TO DASHBOARD
          </button>
          <IconButton
            icon={theme === "light" ? Moon : Sun}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            onClick={toggleTheme}
          />
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-950/20 dark:bg-red-950/10 dark:text-red-400 dark:hover:bg-red-950/30"
            type="button"
          >
            <LogOut className="size-3.5" />
            SIGN OUT
          </button>
        </div>
      </header>

      <section className="z-10 flex h-9 w-full flex-shrink-0 items-center justify-center bg-[#101b22] px-6 text-center text-[10px] font-semibold tracking-wider text-slate-400">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[var(--brand-color)]" />
          <span>CUI // OPSEC · Profile data is loaded from `/users/profile` and saved back to the live backend</span>
        </div>
      </section>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#0e1628]">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative">
                  <div className="flex size-24 items-center justify-center overflow-hidden rounded-2xl border border-[var(--brand-color)/25] bg-[var(--brand-color)/15] text-2xl font-bold text-[var(--brand-color)]">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={`${profile.full_name} avatar`} className="h-full w-full object-cover" />
                    ) : (
                      user.initials
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 rounded-full border border-white bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[#0e1628]">
                    <Camera className="size-3.5 text-[var(--brand-color)]" />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-lg font-bold text-slate-800 dark:text-white">{profile.full_name}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user.roleName}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Upload a JPG, PNG, or HEIC profile photo up to 5 MB. The file is saved through the live backend and displayed from the stored avatar URL.
                  </p>
                  {profile.avatar_available && !avatarUrl && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      A photo is marked on file in the backend. Uploading a new one will replace it.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--brand-color)] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-color-hover)]">
                      <ImagePlus className="size-4" />
                      {avatarSaving ? "Uploading..." : "Upload photo"}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.heic,image/jpeg,image/png,image/heic"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={avatarSaving}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleAvatarDelete}
                      disabled={!profile.avatar_available || avatarSaving}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                      <Trash2 className="size-4" />
                      Remove photo
                    </button>
                  </div>
                  {avatarError && <p className="mt-3 text-xs font-medium text-rose-500">{avatarError}</p>}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoTile icon={Mail} label="Email" value={profile.email} />
                <InfoTile icon={UserRound} label="Unit / Team" value={profile.unit_id || "No unit assigned"} />
                <InfoTile label="Role" value={profile.role} />
                <InfoTile
                  icon={ShieldCheck}
                  label="Verification"
                  value={profile.is_verified ? "Verified" : "Pending verification"}
                  accent={profile.is_verified ? "text-emerald-500" : "text-amber-500"}
                />
                <InfoTile
                  icon={CalendarClock}
                  label="Member since"
                  value={formatDate(profile.member_since)}
                />
                <InfoTile
                  icon={CalendarClock}
                  label="Last sign-in"
                  value={formatDate(profile.sign_in_activation?.last_login_at)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <SideCard title="Readiness visibility" value={profile.current_ops_band || "No band yet"} subtext={profile.current_ops_band_meaning || "No readiness band is available yet."} />
              <SideCard title="Notifications" value={profile.notifications_enabled ? "Enabled" : "Disabled"} subtext={`Theme: ${profile.theme_preference || theme} · Confidence: ${profile.ops_confidence_level || "n/a"}`} />
              <SideCard
                title="Care assignments"
                value={[
                  profile.assigned_scs?.name ? `SCS: ${profile.assigned_scs.name}` : null,
                  profile.assigned_ptim?.name ? `PT/IM: ${profile.assigned_ptim.name}` : null,
                ].filter(Boolean).join(" · ") || "No current assignments"}
                subtext={profile.support_pathways_opted_in.length > 0 ? `Pathways: ${profile.support_pathways_opted_in.join(", ")}` : "No optional support pathways enabled."}
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={handleProfileSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#0e1628]">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Profile settings</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                These are the fields exposed by `/users/profile/settings`. Role and unit stay admin-managed.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <Field label="Full name">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-[var(--brand-color)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/20 dark:border-white/10 dark:bg-[#070a13] dark:text-white"
                  />
                </Field>
                <Field label="Rank / grade">
                  <input
                    value={rankGrade}
                    onChange={(e) => setRankGrade(e.target.value)}
                    placeholder="SSgt"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-[var(--brand-color)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/20 dark:border-white/10 dark:bg-[#070a13] dark:text-white"
                  />
                </Field>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-[#070a13]">
                  <div className="flex items-center gap-2">
                    <Bell className="size-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">Notifications</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Controls `notifications_enabled` in the backend profile.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="size-4 rounded border-slate-300 text-[var(--brand-color)] focus:ring-[var(--brand-color)]"
                  />
                </label>
                {profileError && <p className="text-xs font-medium text-rose-500">{profileError}</p>}
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="mt-1 self-start rounded-xl bg-[var(--brand-color)] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {settingsSaving ? "Saving..." : "Save profile settings"}
                </button>
              </div>
            </form>

            <form onSubmit={handleChangeEmail} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#0e1628]">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Change login email</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                This calls `/users/change-email` and requires the current password.
              </p>

              <div className="mt-4 flex flex-col gap-3 max-w-sm">
                <Field label="New email">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-[var(--brand-color)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/20 dark:border-white/10 dark:bg-[#070a13] dark:text-white"
                  />
                </Field>
                <Field label="Current password">
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 shadow-sm focus:border-[var(--brand-color)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/20 dark:border-white/10 dark:bg-[#070a13] dark:text-white"
                    />
                  </div>
                </Field>
                {emailError && <p className="text-xs font-medium text-rose-500">{emailError}</p>}
                <button
                  type="submit"
                  disabled={emailSaving}
                  className="mt-1 self-start rounded-xl bg-[var(--brand-color)] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {emailSaving ? "Updating..." : "Update email"}
                </button>
              </div>
            </form>

            <form onSubmit={handleChangePassword} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#0e1628] lg:col-span-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Change password</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                This uses the live `/users/change-password` endpoint instead of the old local demo password store.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="Current password">
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 shadow-sm focus:border-[var(--brand-color)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/20 dark:border-white/10 dark:bg-[#070a13] dark:text-white"
                    />
                  </div>
                </Field>
                <Field label="New password">
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 shadow-sm focus:border-[var(--brand-color)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/20 dark:border-white/10 dark:bg-[#070a13] dark:text-white"
                    />
                  </div>
                </Field>
                <Field label="Confirm new password">
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 shadow-sm focus:border-[var(--brand-color)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/20 dark:border-white/10 dark:bg-[#070a13] dark:text-white"
                    />
                  </div>
                </Field>
              </div>
              {passwordError && <p className="mt-3 text-xs font-medium text-rose-500">{passwordError}</p>}
              <button
                type="submit"
                disabled={passwordSaving}
                className="mt-4 rounded-xl bg-[var(--brand-color)] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {passwordSaving ? "Updating..." : "Update password"}
              </button>
            </form>
          </div>
        </div>
      </main>

      {show && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl dark:bg-white dark:text-slate-900">
          {message}
        </div>
      )}
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon?: typeof Mail;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-[#070a13]">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {Icon ? <Icon className="size-3.5" /> : null}
        {label}
      </p>
      <p className={`mt-1 font-medium text-slate-800 dark:text-white ${accent || ""}`}>{value}</p>
    </div>
  );
}

function SideCard({ title, value, subtext }: { title: string; value: string; subtext: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#0e1628]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      <p className="mt-2 text-sm font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{subtext}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}

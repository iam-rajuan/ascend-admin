"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, LogOut, Mail, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { AscendLogo } from "@/components/ascend-logo";
import { useAuthStore } from "@/store/auth-store";
import { useUsersStore } from "@/store/users-store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { IconButton } from "@/components/ui/icon-button";

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const changePassword = useUsersStore((state) => state.changePassword);
  const user = useCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const { show, message, triggerToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFormError, setPasswordFormError] = useState("");

  if (!user) {
    return null;
  }

  const handleChangePassword = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordFormError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFormError("New passwords do not match.");
      return;
    }
    const ok = changePassword(user.id, currentPassword, newPassword);
    if (!ok) {
      setPasswordFormError("Current password is incorrect.");
      return;
    }
    setPasswordFormError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    triggerToast("Password updated.");
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="flex h-screen flex-col bg-[#f0f4f9] dark:bg-[#070a13] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 overflow-hidden">
      <header className="flex h-14 w-full items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0e1628] px-6 md:px-8 flex-shrink-0 z-20">
        <div className="flex items-center gap-2">
          <AscendLogo width={20} height={20} showDetails={false} />
          <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">Ascend</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-light select-none">/</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">My profile</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/${user.role}`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors duration-200 cursor-pointer"
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 dark:border-red-950/20 dark:bg-red-950/10 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-100 dark:hover:bg-red-950/30 cursor-pointer"
            type="button"
          >
            <LogOut className="size-3.5" />
            SIGN OUT
          </button>
        </div>
      </header>

      <section className="flex h-9 w-full items-center justify-center bg-[#101b22] px-6 text-center text-[10px] font-semibold tracking-wider text-slate-400 select-none flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[var(--brand-color)]"></span>
          <span>CUI // OPSEC · Not a Government System of Record</span>
        </div>
      </section>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0e1628] shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-[var(--brand-color)/15] text-[var(--brand-color)] border border-[var(--brand-color)/25] text-lg font-bold">
                {user.initials}
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-white">{user.name}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user.roleName}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#070a13] p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <Mail className="size-3.5" /> Email
                </p>
                <p className="mt-1 font-medium text-slate-800 dark:text-white">{user.email}</p>
              </div>
              <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#070a13] p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <UserRound className="size-3.5" /> Unit / Team
                </p>
                <p className="mt-1 font-medium text-slate-800 dark:text-white">{user.unit}</p>
              </div>
              <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#070a13] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</p>
                <p className="mt-1 font-medium text-slate-800 dark:text-white">{user.roleName}</p>
              </div>
              <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#070a13] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                <p
                  className={`mt-1 flex items-center gap-1.5 font-medium ${
                    user.status === "active" ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  <ShieldCheck className="size-3.5" />
                  {user.status === "active" ? "Active" : "Deactivated"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0e1628] shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">Change password</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Update the password used to sign in to your account.
            </p>
            <form onSubmit={handleChangePassword} className="mt-4 flex flex-col gap-3 max-w-sm">
              <div>
                <label htmlFor="currentPassword" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Current password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] py-3 pl-10 pr-4 text-sm text-slate-800 dark:text-white shadow-sm focus:outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color)]/20 transition-all duration-150"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="newPassword" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] py-3 pl-10 pr-4 text-sm text-slate-800 dark:text-white shadow-sm focus:outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color)]/20 transition-all duration-150"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Confirm new password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] py-3 pl-10 pr-4 text-sm text-slate-800 dark:text-white shadow-sm focus:outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color)]/20 transition-all duration-150"
                  />
                </div>
              </div>
              {passwordFormError && (
                <p className="text-xs font-medium text-rose-500">{passwordFormError}</p>
              )}
              <button
                type="submit"
                className="mt-1 self-start rounded-xl bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 cursor-pointer"
              >
                Update password
              </button>
            </form>
          </div>
        </div>
      </main>

      {show && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 text-sm font-semibold shadow-xl animate-fade-in">
          {message}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useProfileStore, UserProfile } from "@/store/profile-store";
import {
  User,
  Shield,
  Key,
  Smartphone,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sliders,
  Mail,
  Phone,
  Building,
  MapPin,
  BadgeCheck,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Laptop,
  Globe,
  Bell,
  Sun,
  Moon,
  Sparkles,
  Save,
  RefreshCw,
  Check,
  ShieldAlert,
} from "lucide-react";

interface RoleProfileViewProps {
  roleId: string;
  roleName: string;
  onBackToDashboard?: () => void;
}

type InternalTab = "general" | "security" | "credentials" | "preferences";

export function RoleProfileView({ roleId, roleName, onBackToDashboard }: RoleProfileViewProps) {
  const {
    getProfile,
    updateProfile,
    updatePassword,
    toggle2FA,
    revokeSession,
    updatePreferences,
    addCredential,
    removeCredential,
  } = useProfileStore();

  const profile = getProfile(roleId);
  const [activeTab, setActiveTab] = useState<InternalTab>("general");

  // Local form state for General Info
  const [name, setName] = useState(profile.name);
  const [rankTitle, setRankTitle] = useState(profile.rankTitle);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [department, setDepartment] = useState(profile.department);
  const [dutyLocation, setDutyLocation] = useState(profile.dutyLocation);
  const [bio, setBio] = useState(profile.bio);

  // Local state for Change Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  // Local state for Credential adding
  const [newCredInput, setNewCredInput] = useState("");

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info" | "error">("success");

  const showToast = (msg: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (pass.length >= 12) score += 15;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 20;
    if (/[^A-Za-z0-9]/.test(pass)) score += 20;
    return score;
  };

  const passStrength = getPasswordStrength(newPassword);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(roleId, {
      name,
      rankTitle,
      email,
      phone,
      department,
      dutyLocation,
      bio,
    });
    showToast("Profile details updated successfully", "success");
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (!currentPassword) {
      setPassError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPassError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("New password and confirmation do not match.");
      return;
    }

    updatePassword(roleId);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPassSuccess("Password updated successfully. Next rotation due in 90 days.");
    showToast("Password updated successfully", "success");
  };

  const handleAddCredential = () => {
    if (!newCredInput.trim()) return;
    addCredential(roleId, newCredInput.trim());
    setNewCredInput("");
    showToast("New credential added to profile", "success");
  };

  const handleRemoveCredential = (cred: string) => {
    removeCredential(roleId, cred);
    showToast("Credential removed", "info");
  };

  const handleToggle2FA = () => {
    toggle2FA(roleId);
    showToast(
      profile.twoFactorEnabled
        ? "Two-factor authentication disabled"
        : "Two-factor authentication (CAC / TOTP) enabled",
      "info"
    );
  };

  const handleRevokeSession = (sessionId: string) => {
    revokeSession(roleId, sessionId);
    showToast("Active session revoked successfully", "info");
  };

  // Extract initials for avatar badge
  const getInitials = (nameStr: string) => {
    const parts = nameStr.replace(/^(Col\.|Maj\. Gen\.|Lt\. Col\.|Capt\.|Maj\.|Dr\.|Cmdr\.)\s*/i, "").trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0] ? parts[0].substring(0, 2).toUpperCase() : "US";
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f0f4f9] dark:bg-[#070a13] text-slate-800 dark:text-slate-100 p-6 md:p-8 space-y-6">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {toastType === "success" && <CheckCircle2 className="size-5 text-emerald-400" />}
          {toastType === "info" && <BadgeCheck className="size-5 text-[#0da2b3]" />}
          {toastType === "error" && <AlertCircle className="size-5 text-rose-400" />}
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* TOP BANNER / HEADER CARD */}
      <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1628] p-6 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-96 bg-gradient-to-l from-[#0da2b3]/15 via-blue-500/5 to-transparent pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* AVATAR BUBBLE */}
            <div className="relative group">
              <div className="size-20 rounded-2xl bg-gradient-to-br from-[#0da2b3] to-blue-700 flex items-center justify-center text-white text-2xl font-black shadow-lg border-2 border-white dark:border-[#0e1628]">
                {getInitials(profile.name)}
              </div>
              <span className="absolute -bottom-1 -right-1 size-5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0e1628]" title="User Active" />
            </div>

            {/* NAME & ROLE DETAILS */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {profile.name}
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#0da2b3]/15 text-[#0da2b3] border border-[#0da2b3]/30 rounded-full">
                  {roleName} Directory
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-semibold tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <Shield className="size-3" />
                  {profile.clearanceLevel}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {profile.rankTitle} · <span className="text-slate-700 dark:text-slate-300">{profile.department}</span>
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-[#0da2b3]" />
                  {profile.dutyLocation}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="size-3.5 text-[#0da2b3]" />
                  ID: <span className="font-mono text-slate-700 dark:text-slate-200">{profile.officerId}</span>
                </span>
              </div>
            </div>
          </div>

          {/* QUICK STATUS TILES */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-white/5 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Authentication</p>
              <div className="mt-1 flex items-center justify-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <BadgeCheck className="size-3.5" />
                <span>CAC / PIV Verified</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-white/5 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2FA Guard</p>
              <div className="mt-1 flex items-center justify-center gap-1 text-xs font-bold text-[#0da2b3]">
                <Smartphone className="size-3.5" />
                <span>{profile.twoFactorEnabled ? "Active" : "Disabled"}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-white/5 text-center col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Encryption</p>
              <div className="mt-1 flex items-center justify-center gap-1 text-xs font-bold text-amber-500">
                <Lock className="size-3.5" />
                <span>AES-256 GCM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "general"
              ? "bg-[#0da2b3] text-white shadow"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5"
          }`}
          type="button"
        >
          <User className="size-4" />
          General Information
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "security"
              ? "bg-[#0da2b3] text-white shadow"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5"
          }`}
          type="button"
        >
          <Key className="size-4" />
          Security & Password
        </button>

        <button
          onClick={() => setActiveTab("credentials")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "credentials"
              ? "bg-[#0da2b3] text-white shadow"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5"
          }`}
          type="button"
        >
          <Shield className="size-4" />
          Credentials & Clearance
        </button>

        <button
          onClick={() => setActiveTab("preferences")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "preferences"
              ? "bg-[#0da2b3] text-white shadow"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5"
          }`}
          type="button"
        >
          <Sliders className="size-4" />
          System Preferences
        </button>
      </div>

      {/* TAB 1: GENERAL INFORMATION */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveGeneral} className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1628] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="size-4 text-[#0da2b3]" />
                Personal & Military Profile Details
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official directory record for {roleName} workspace operations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-white focus:outline-none focus:border-[#0da2b3]"
                    required
                  />
                </div>
              </div>

              {/* Rank / Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rank / Military Title</label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={rankTitle}
                    onChange={(e) => setRankTitle(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-white focus:outline-none focus:border-[#0da2b3]"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Official Email (.mil)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-white focus:outline-none focus:border-[#0da2b3]"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">DSN / Direct Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-white focus:outline-none focus:border-[#0da2b3]"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department / Unit Assignment</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-white focus:outline-none focus:border-[#0da2b3]"
                  />
                </div>
              </div>

              {/* Duty Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Primary Duty Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={dutyLocation}
                    onChange={(e) => setDutyLocation(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-white focus:outline-none focus:border-[#0da2b3]"
                  />
                </div>
              </div>
            </div>

            {/* Operational Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Operational Biography & Scope Notes</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-white focus:outline-none focus:border-[#0da2b3]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0da2b3] hover:bg-[#0b8b9a] text-white text-xs font-bold shadow transition cursor-pointer"
              >
                <Save className="size-4" />
                Save Profile Changes
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* PASSWORD CHANGE CARD */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1628] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="size-4 text-[#0da2b3]" />
                Change Operational Password
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Passwords must meet DoD Cyber Command complexity guidelines. Last changed: <span className="font-semibold text-slate-700 dark:text-slate-200">{profile.passwordLastChanged}</span>.
              </p>
            </div>

            {passError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-white focus:outline-none focus:border-[#0da2b3]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showCurrentPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter strong password"
                      className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-white focus:outline-none focus:border-[#0da2b3]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showNewPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-white focus:outline-none focus:border-[#0da2b3]"
                    required
                  />
                </div>
              </div>

              {/* PASSWORD STRENGTH INDICATOR */}
              {newPassword.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500">Password Strength:</span>
                    <span
                      className={
                        passStrength < 40
                          ? "text-rose-500"
                          : passStrength < 75
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }
                    >
                      {passStrength < 40 ? "Weak" : passStrength < 75 ? "Good" : "Strong / Compliant"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passStrength < 40
                          ? "bg-rose-500 w-1/3"
                          : passStrength < 75
                          ? "bg-amber-500 w-2/3"
                          : "bg-emerald-500 w-full"
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0da2b3] hover:bg-[#0b8b9a] text-white text-xs font-bold shadow transition cursor-pointer"
                >
                  <Key className="size-4" />
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* TWO-FACTOR AUTHENTICATION (2FA) */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1628] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="size-4 text-[#0da2b3]" />
                  Two-Factor & CAC Card Authentication
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enforce hardware token or authenticator app verification for all login attempts.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggle2FA}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  profile.twoFactorEnabled ? "bg-[#0da2b3]" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                    profile.twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-[#0da2b3]/15 text-[#0da2b3] flex items-center justify-center font-bold">
                  CAC
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">DoD Common Access Card (CAC / PIV)</p>
                  <p className="text-slate-500 dark:text-slate-400">Certificate Status: Active & Bound (Serial: #8891-US-DEFC)</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                Active
              </span>
            </div>
          </div>

          {/* ACTIVE SESSIONS */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1628] p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Laptop className="size-4 text-[#0da2b3]" />
                Active Authorized Sessions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Devices currently authenticated into this role account.
              </p>
            </div>

            <div className="space-y-3">
              {profile.sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-white/5 gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Laptop className="size-5 text-[#0da2b3]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{sess.device}</p>
                        {sess.current && (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded">
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        IP: <span className="font-mono">{sess.ip}</span> · {sess.location} · {sess.lastActive}
                      </p>
                    </div>
                  </div>

                  {!sess.current && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(sess.id)}
                      className="px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition cursor-pointer self-start sm:self-auto"
                    >
                      Revoke Access
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CREDENTIALS & CLEARANCE */}
      {activeTab === "credentials" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1628] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="size-4 text-[#0da2b3]" />
                Security Clearance & Professional Certifications
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified credentials and clearance badges associated with {roleName} workspace authorization.
              </p>
            </div>

            {/* Clearance Level Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-white/5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Security Clearance</p>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{profile.clearanceLevel}</p>
                <p className="text-xs text-slate-500">Authorized for OPSEC Level 4 Operational Data</p>
              </div>
              <span className="px-3 py-1.5 text-xs font-extrabold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded-xl flex items-center gap-1.5">
                <ShieldAlert className="size-4" />
                VERIFIED BY DISA
              </span>
            </div>

            {/* Credentials List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Board Certifications</h3>
              </div>

              <div className="space-y-2">
                {profile.credentials.map((cred, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-white/5 text-xs font-medium text-slate-800 dark:text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="size-4 text-[#0da2b3]" />
                      <span>{cred}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCredential(cred)}
                      className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      title="Remove credential"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Credential Input */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newCredInput}
                  onChange={(e) => setNewCredInput(e.target.value)}
                  placeholder="Add new certification (e.g. CISSP, Board Certified OCS...)"
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-white focus:outline-none focus:border-[#0da2b3]"
                />
                <button
                  type="button"
                  onClick={handleAddCredential}
                  className="px-4 py-2 rounded-xl bg-[#0da2b3] hover:bg-[#0b8b9a] text-white text-xs font-bold shadow transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="size-4" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM PREFERENCES */}
      {activeTab === "preferences" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1628] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="size-4 text-[#0da2b3]" />
                System & Notification Preferences
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize operational notifications, interface display, and OPSEC warning controls.
              </p>
            </div>

            <div className="space-y-4 divide-y divide-slate-100 dark:divide-white/5">
              {/* Email Notifications */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Email Digest & System Notifications</p>
                  <p className="text-[11px] text-slate-500">Receive operational status updates and digest reports via .mil email</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updatePreferences(roleId, {
                      emailNotifications: !profile.preferences.emailNotifications,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    profile.preferences.emailNotifications ? "bg-[#0da2b3]" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                      profile.preferences.emailNotifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Security Alerts */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">High Severity Security Alerts</p>
                  <p className="text-[11px] text-slate-500">Instant notifications for un-redacted view attempts or gated breaches</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updatePreferences(roleId, {
                      securityAlerts: !profile.preferences.securityAlerts,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    profile.preferences.securityAlerts ? "bg-[#0da2b3]" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                      profile.preferences.securityAlerts ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Operational Briefings */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Daily Operational Briefings</p>
                  <p className="text-[11px] text-slate-500">Automated morning summary of unit readiness & schedule changes</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updatePreferences(roleId, {
                      operationalBriefings: !profile.preferences.operationalBriefings,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    profile.preferences.operationalBriefings ? "bg-[#0da2b3]" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                      profile.preferences.operationalBriefings ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

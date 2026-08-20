"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Mail, ShieldCheck, TriangleAlert } from "lucide-react";
import { AscendLogo } from "@/components/ascend-logo";
import { useUsersStore } from "@/store/users-store";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const findByEmail = useUsersStore((state) => state.findByEmail);
  const resetPassword = useUsersStore((state) => state.resetPassword);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [mockCode, setMockCode] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");

  const handleRequestCode = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const person = findByEmail(email);
    if (!person) {
      setEmailError("No account found for that email address.");
      return;
    }
    setEmailError("");
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setMockCode(generated);
    setStep("reset");
  };

  const handleReset = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (code !== mockCode) {
      setResetError("That code doesn't match. Check the demo banner above and try again.");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    resetPassword(email, newPassword);
    setResetError("");
    setStep("done");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground font-sans px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <AscendLogo width={32} height={32} showDetails={true} />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Ascend</h1>
            <p className="text-xs font-medium text-muted">Account recovery</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl">
          {step === "email" && (
            <>
              <h2 className="text-xl font-extrabold tracking-tight text-foreground">Reset your password</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Enter the email address assigned to your account. We&apos;ll walk you through resetting your password.
              </p>
              <form onSubmit={handleRequestCode} noValidate className="mt-6 flex flex-col gap-3">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-foreground">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      placeholder="name@ascend.mil"
                      className="w-full rounded-xl border border-border bg-background py-3.5 pl-10 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted/60 focus:outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color)]/20 transition-all duration-150"
                    />
                  </div>
                  {emailError && <p className="mt-1.5 text-xs font-medium text-rose-500">{emailError}</p>}
                </div>
                <button
                  type="submit"
                  className="mt-2 flex w-full items-center justify-center rounded-xl bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 cursor-pointer"
                >
                  Send reset code
                </button>
              </form>
            </>
          )}

          {step === "reset" && (
            <>
              <h2 className="text-xl font-extrabold tracking-tight text-foreground">Enter your code</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Enter the code below along with your new password.
              </p>

              <div className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--brand-color)]/20 bg-[var(--brand-color)]/5 p-4">
                <TriangleAlert className="mt-0.5 size-4 flex-shrink-0 text-[var(--brand-color)]" />
                <div>
                  <p className="text-xs font-bold text-foreground">Demo mode</p>
                  <p className="mt-1 text-xs text-muted">
                    No email service is configured yet, so in production this code would be emailed to you. For this
                    prototype, your code is:
                  </p>
                  <p className="mt-2 font-mono text-lg font-bold tracking-[0.3em] text-[var(--brand-color)]">
                    {mockCode}
                  </p>
                </div>
              </div>

              <form onSubmit={handleReset} noValidate className="mt-6 flex flex-col gap-3">
                <div>
                  <label htmlFor="code" className="mb-1.5 block text-xs font-semibold text-foreground">
                    Verification code
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full rounded-xl border border-border bg-background py-3.5 px-4 text-sm text-foreground shadow-sm placeholder:text-muted/60 focus:outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color)]/20 transition-all duration-150"
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="mb-1.5 block text-xs font-semibold text-foreground">
                    New password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                    <input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border bg-background py-3.5 pl-10 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted/60 focus:outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color)]/20 transition-all duration-150"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold text-foreground">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                    <input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border bg-background py-3.5 pl-10 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted/60 focus:outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color)]/20 transition-all duration-150"
                    />
                  </div>
                </div>
                {resetError && <p className="text-xs font-medium text-rose-500">{resetError}</p>}
                <button
                  type="submit"
                  className="mt-2 flex w-full items-center justify-center rounded-xl bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 cursor-pointer"
                >
                  Reset password
                </button>
              </form>
            </>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <ShieldCheck className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-extrabold tracking-tight text-foreground">Password updated</h2>
              <p className="mt-2 text-sm text-muted">
                Your password has been reset. You can now sign in with your new password.
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 cursor-pointer"
              >
                Back to sign in
              </button>
            </div>
          )}
        </div>

        {step !== "done" && (
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors duration-150"
          >
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}

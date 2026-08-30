"use client";

import Link from "next/link";
import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { AscendLogo } from "@/components/ascend-logo";
import {
  getApiErrorMessage,
  requestPasswordReset,
  resetPasswordWithCode,
  verifyResetCode,
} from "@/lib/staff-api";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestCode = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError("");
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email.trim());
      setStep("reset");
    } catch (error) {
      setEmailError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError("");

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await verifyResetCode(email.trim(), code.trim());
      await resetPasswordWithCode(email.trim(), code.trim(), newPassword, confirmPassword);
      setStep("done");
    } catch (error) {
      setResetError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 font-sans text-foreground">
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
                Enter the email address assigned to your staff account. The backend will send the reset code to that inbox.
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
                      placeholder="dash-admin@ascend.mil"
                      className="w-full rounded-xl border border-border bg-background py-3.5 pl-10 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted/60 focus:border-[var(--brand-color)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/20"
                    />
                  </div>
                  {emailError && <p className="mt-1.5 text-xs font-medium text-rose-500">{emailError}</p>}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 flex w-full items-center justify-center rounded-xl bg-[var(--brand-color)] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Sending..." : "Send reset code"}
                </button>
              </form>
            </>
          )}

          {step === "reset" && (
            <>
              <h2 className="text-xl font-extrabold tracking-tight text-foreground">Enter your code</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Use the code you received by email, then set a new password for your staff account.
              </p>

              <form onSubmit={handleReset} noValidate className="mt-6 flex flex-col gap-3">
                <div>
                  <label htmlFor="code" className="mb-1.5 block text-xs font-semibold text-foreground">
                    Verification code
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="4-6 digit code"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm text-foreground shadow-sm placeholder:text-muted/60 focus:border-[var(--brand-color)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/20"
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
                      placeholder="New password"
                      className="w-full rounded-xl border border-border bg-background py-3.5 pl-10 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted/60 focus:border-[var(--brand-color)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/20"
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
                      placeholder="Confirm new password"
                      className="w-full rounded-xl border border-border bg-background py-3.5 pl-10 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted/60 focus:border-[var(--brand-color)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/20"
                    />
                  </div>
                </div>
                {resetError && <p className="text-xs font-medium text-rose-500">{resetError}</p>}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 flex w-full items-center justify-center rounded-xl bg-[var(--brand-color)] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Resetting..." : "Reset password"}
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
                Your password was reset against the live backend. Sign in again with the new password.
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-[var(--brand-color)] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[var(--brand-color-hover)]"
              >
                Back to sign in
              </button>
            </div>
          )}
        </div>

        {step !== "done" && (
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors duration-150 hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}

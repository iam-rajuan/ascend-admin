"use client";

import { useState, useEffect, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Moon,
  Sun,
  Clock,
  Lock,
  KeyRound,
  Loader2,
} from "lucide-react";
import { AscendLogo } from "@/components/ascend-logo";
import { AscendBanner } from "@/components/ascend-banner";
import { useAuthStore } from "@/store/auth-store";
import { useUsersStore } from "@/store/users-store";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, currentUserRole, login } = useAuthStore();
  const verifyCredentials = useUsersStore((state) => state.verifyCredentials);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authError, setAuthError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(currentUserRole ? `/dashboard/${currentUserRole}` : "/roles");
    }
  }, [isAuthenticated, currentUserRole, router]);

  // Sync theme with document class list
  useEffect(() => {
    const savedTheme = localStorage.getItem("ascend_admin_theme") as "light" | "dark" | null;
    let initialTheme: "light" | "dark" = "light";

    if (savedTheme) {
      initialTheme = savedTheme;
    }

    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    
    // Set state asynchronously to avoid synchronous setState inside render/effect hook
    const timer = setTimeout(() => {
      setTheme(initialTheme);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("ascend_admin_theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSignIn = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    let hasError = false;
    if (!isValidEmail(email)) {
      setEmailError("Enter the email address assigned to your account.");
      hasError = true;
    } else {
      setEmailError("");
    }
    if (!password) {
      setPasswordError("Enter your password.");
      hasError = true;
    } else {
      setPasswordError("");
    }
    if (hasError) return;

    setAuthError("");
    setIsAuthenticating(true);
    setAuthStep(0);

    // Simulate multi-step secure login handshake
    const timer1 = setTimeout(() => setAuthStep(1), 500);
    const timer2 = setTimeout(() => setAuthStep(2), 1000);
    const timer3 = setTimeout(() => setAuthStep(3), 1500);
    const timer4 = setTimeout(() => {
      const result = verifyCredentials(email, password);
      if (result === "invalid") {
        setIsAuthenticating(false);
        setAuthError("Incorrect email or password.");
        return;
      }
      if (result === "deactivated") {
        setIsAuthenticating(false);
        setAuthError("This account has been deactivated — contact your administrator.");
        return;
      }
      login(result);
      setIsAuthenticating(false);
      router.push(`/dashboard/${result.role}`);
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  };

  // Secure Auth logs for simulated scanning
  const getAuthLogs = () => {
    switch (authStep) {
      case 0:
        return [
          `[INIT] Requesting session for ${email}...`,
          `[CONN] Handshaking with secure government gateway...`,
        ];
      case 1:
        return [
          `[INIT] Requesting session for ${email}...`,
          `[CONN] Handshaking with secure government gateway...`,
          `[AUTH] Verifying email against assigned account directory...`,
          `[AUTH] Confirming role assignment...`,
        ];
      case 2:
        return [
          `[INIT] Requesting session for ${email}...`,
          `[CONN] Handshaking with secure government gateway...`,
          `[AUTH] Verifying email against assigned account directory...`,
          `[AUTH] Confirming role assignment...`,
          `[VERI] Account verified. Running compliance checks...`,
          `[SECURE] Establishing secure session context (AES-256)...`,
        ];
      case 3:
      default:
        return [
          `[INIT] Requesting session for ${email}...`,
          `[CONN] Handshaking with secure government gateway...`,
          `[AUTH] Verifying email against assigned account directory...`,
          `[AUTH] Confirming role assignment...`,
          `[VERI] Account verified. Running compliance checks...`,
          `[SECURE] Establishing secure session context (AES-256)...`,
          `[OK] Authentication successful! Loading workspace...`,
        ];
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground font-sans transition-colors duration-200 overflow-hidden">
      
      {/* 1. TOP HEADER BAR */}
      <header className="flex h-14 w-full items-center justify-between border-b border-border bg-surface px-6 md:px-8 flex-shrink-0 z-20">
        {/* Left Brand Badge */}
        <div className="flex items-center gap-2">
          <AscendLogo width={20} height={20} showDetails={false} />
          <span className="text-sm font-semibold tracking-tight text-foreground">Ascend</span>
          <span className="text-xs text-muted/60 font-light select-none">/</span>
          <span className="text-xs font-medium text-muted">Role directory</span>
        </div>

        {/* Right Action Menu */}
        <div className="flex items-center gap-6">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="flex size-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-surface-muted text-foreground transition-all duration-200 cursor-pointer"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            type="button"
          >
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>

          {/* Workspace Directory Link with Status Dot */}
          <button 
            className="group relative flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground transition-colors duration-200 cursor-pointer"
            type="button"
          >
            WORKSPACE DIRECTORY
            {/* Blinking Red Dot on Workspace Directory */}
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex size-1.5 rounded-full bg-red-500"></span>
            </span>
          </button>
        </div>
      </header>

      {/* 2. CUI / OPSEC NAVY BANNER */}
      <section className="flex h-9 w-full items-center justify-center bg-[#101b22] px-6 text-center text-[10px] font-semibold tracking-wider text-slate-400 select-none flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[var(--brand-color)]"></span>
          <span>CUI // OPSEC · Not a Government System of Record</span>
        </div>
      </section>

      {/* 3. SPLIT MAIN CONTAINER */}
      <main className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: AUTH FORM */}
        <section className="flex flex-col justify-between bg-[#f0f4f9] dark:bg-background p-8 sm:p-12 md:p-16 lg:w-1/2 overflow-y-auto">
          
          {/* Header/Greeting */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <AscendLogo width={36} height={36} showDetails={true} />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Ascend</h1>
                <p className="text-xs font-medium text-muted">Role directory</p>
              </div>
            </div>
          </div>

          {/* Simulated scanning / Login form panel */}
          <div className="my-auto max-w-lg py-8">
            {isAuthenticating ? (
              /* Simulated Handshake Scanner view */
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl dark:shadow-2xl/10 animate-fade-in">
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--brand-color)/10] text-[var(--brand-color)]">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Secure Authentication</h3>
                    <p className="text-xs text-muted">Performing security checks...</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--brand-color)] to-[#e2b13c] transition-all duration-500 ease-out"
                    style={{ width: `${(authStep + 1) * 25}%` }}
                  />
                </div>

                {/* Tactical Terminal logs */}
                <div className="rounded-xl border border-border/80 bg-slate-950 p-4 font-mono text-[10px] leading-relaxed text-[var(--brand-color)]">
                  <div className="flex flex-col gap-1">
                    {getAuthLogs().map((log, idx) => (
                      <div key={idx} className="animate-fade-in">
                        <span className="text-slate-500 mr-1.5">[{new Date().toLocaleTimeString()}]</span>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Static Credentials Buttons View */
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#4f46e5] dark:text-[#818cf8]">
                    AUTHENTICATION
                  </p>
                  <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
                    Sign in
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted">
                    Sign in with your assigned email address. First-use continues into 20 onboarding questions, then drops you into your workspace.
                  </p>
                </div>

                {/* Email Sign-In Form */}
                <form onSubmit={handleSignIn} noValidate className="flex flex-col gap-3 pt-4">
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
                        className="w-full rounded-xl border border-border bg-surface py-3.5 pl-10 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted/60 focus:outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color)]/20 transition-all duration-150"
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1.5 text-xs font-medium text-rose-500">{emailError}</p>
                    )}
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="password" className="block text-xs font-semibold text-foreground">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-semibold text-[var(--brand-color)] hover:text-[var(--brand-color-hover)] transition-colors duration-150"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                      <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError("");
                        }}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-border bg-surface py-3.5 pl-10 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted/60 focus:outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color)]/20 transition-all duration-150"
                      />
                    </div>
                    {passwordError && (
                      <p className="mt-1.5 text-xs font-medium text-rose-500">{passwordError}</p>
                    )}
                  </div>

                  {authError && (
                    <p className="rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                      {authError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="group flex w-full items-center justify-center rounded-xl bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                  >
                    Sign in
                  </button>
                </form>

                {/* Last Used Badge Widget */}
                <div className="mt-8 rounded-xl border border-[var(--brand-color)]/20 bg-[var(--brand-color)]/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex mt-0.5 size-5 items-center justify-center rounded-full bg-[var(--brand-color)/10] text-[var(--brand-color)]">
                      <Clock className="size-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">Last used · Email sign-in</span>
                        {/* Live blinking green active light */}
                        <span className="relative flex size-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted">
                        2 days ago from this device
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer links */}
          <footer className="mt-12 flex flex-wrap gap-6 border-t border-border/40 pt-6 text-xs text-muted">
            <a href="#" className="hover:text-foreground transition-colors duration-150">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors duration-150">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors duration-150">Accessibility</a>
          </footer>
        </section>

        {/* RIGHT COLUMN: GRAPHICS & MISSION GRADIENT */}
        <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1e6f77] via-[#114b53] to-[#0a3339] p-8 sm:p-12 md:p-16 text-white lg:w-1/2">
          {/* Subtle grid mesh overlay overlay for tactical aesthetic */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

          {/* Soft ambient lighting effect in center */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[var(--brand-color)]/15 blur-[80px] pointer-events-none" />

          {/* Top Branding Banner */}
          <div className="relative z-10 flex justify-center">
            <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-6 py-4 shadow-lg">
              <AscendBanner logoSize={64} />
            </div>
          </div>

          {/* Central Quote Section */}
          <div className="relative z-10 my-auto max-w-xl py-12 text-center mx-auto">
            <h3 className="text-3xl font-medium leading-normal md:text-4xl text-white/95">
              “Readiness is the work we do every day, not the moment we need it.”
            </h3>
            <div className="mt-6 flex items-center justify-center gap-2.5 text-xs tracking-wider text-slate-300">
              <span className="font-semibold text-[#e2b13c]">Ascend</span>
              <span className="text-slate-500">•</span>
              <span>Mission statement</span>
            </div>
          </div>

          {/* Bottom Security Info */}
          <div className="relative z-10 flex items-center gap-2 text-[10px] font-semibold tracking-wider text-white/60">
            <Lock className="size-3.5 text-[#e2b13c]" />
            <span>CUI // OPSEC · Not a Government System of Record</span>
          </div>
        </section>

      </main>
    </div>
  );
}

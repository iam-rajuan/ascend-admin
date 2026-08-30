"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { AscendBanner } from "@/components/ascend-banner";
import { AscendLogo } from "@/components/ascend-logo";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/store/auth-store";

export default function Home() {
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const authError = useAuthStore((state) => state.authError);
  const loginWithPassword = useAuthStore((state) => state.loginWithPassword);

  const [email, setEmail] = useState("dash-admin@ascend.mil");
  const [password, setPassword] = useState("AscendDash!2026");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/roles");
    }
  }, [isAuthenticated, isHydrated, router]);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const result = await loginWithPassword(email, password, rememberMe);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    router.replace("/roles");
  };

  return (
    <div className="flex h-screen max-h-screen w-screen flex-col overflow-hidden bg-[#f8fafc] font-sans text-slate-800 transition-colors duration-200 dark:bg-[#070a13] dark:text-slate-100">
      <header className="z-20 flex h-14 w-full flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-white/5 dark:bg-[#0e1628] md:px-8">
        <div className="flex items-center gap-2">
          <AscendLogo width={20} height={20} showDetails={false} />
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Ascend</span>
          <span className="select-none text-xs font-light text-slate-400">/</span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Staff sign-in</span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-all duration-200 hover:bg-slate-50 dark:border-white/10 dark:bg-[#070a13] dark:text-slate-300 dark:hover:bg-slate-900"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            type="button"
          >
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>

          <div className="flex items-center gap-1.5 select-none text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>CONNECTED BACKEND</span>
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
          </div>
        </div>
      </header>

      <section className="z-10 flex h-8 w-full flex-shrink-0 items-center justify-center bg-[#101b22] px-6 text-center text-[10px] font-semibold tracking-wider text-slate-400">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[#0da2b3]" />
          <span>CUI // OPSEC · Staff auth is now routed through the live Ascend API</span>
        </div>
      </section>

      <main className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <section className="flex flex-col justify-between overflow-hidden border-r border-slate-200 bg-white p-6 dark:border-white/5 dark:bg-[#0e1628] sm:p-8 lg:p-12">
          <div className="flex items-center gap-3">
            <AscendLogo width={32} height={32} showDetails={true} />
            <div>
              <h1 className="text-lg font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">Ascend</h1>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">Provider workspace</p>
            </div>
          </div>

          <div className="mx-auto my-auto w-full max-w-md space-y-5">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#0da2b3]">Authentication</p>
              <h2 className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Sign in
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Use your staff account from the API collection. Role routing is automatic after sign-in.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4 pt-1">
              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dash-admin@ascend.mil"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs font-medium text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#0da2b3] focus:outline-none focus:ring-1 focus:ring-[#0da2b3] dark:border-white/10 dark:bg-[#070a13] dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-[11px] font-bold text-[#0da2b3] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="AscendDash!2026"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-xs font-medium text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#0da2b3] focus:outline-none focus:ring-1 focus:ring-[#0da2b3] dark:border-white/10 dark:bg-[#070a13] dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-[#070a13] dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-slate-300 text-[#0da2b3] focus:ring-[#0da2b3]"
                />
                Remember this device
              </label>

              {(formError || authError) && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400">
                  {formError || authError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !mounted || !isHydrated}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#0da2b3] px-5 py-3.5 text-xs font-extrabold text-white shadow-md transition-all duration-200 hover:bg-[#0b8b9a] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span>{isLoading ? "Signing in..." : "Sign in"}</span>
                {!isLoading && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
              </button>
            </form>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-white/5 dark:bg-[#070a13]">
              <div className="flex items-center gap-3">
                <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#0da2b3]/15 text-[#0da2b3]">
                  <Clock className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Staff test accounts</span>
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Examples: `dash-admin@ascend.mil`, `dash-scs@ascend.mil` with `AscendDash!2026`.</p>
                </div>
              </div>
            </div>
          </div>

          <footer className="flex flex-wrap gap-6 pt-4 text-xs text-slate-400">
            <Link href="/" className="transition-colors hover:text-slate-700 dark:hover:text-slate-200">
              Live auth
            </Link>
            <Link href="/forgot-password" className="transition-colors hover:text-slate-700 dark:hover:text-slate-200">
              Recovery
            </Link>
          </footer>
        </section>

        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#124d54] via-[#0e3b40] to-[#071a1d] p-8 text-white lg:flex lg:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0da2b3]/20 blur-[90px]" />

          <div className="relative z-10 flex justify-center">
            <div className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 shadow-xl backdrop-blur-md">
              <AscendBanner logoSize={56} />
            </div>
          </div>

          <div className="relative z-10 mx-auto my-auto max-w-lg space-y-4 py-8 text-center">
            <h3 className="text-2xl font-bold leading-snug tracking-tight text-white/95 lg:text-3xl">
              Real role login, real session identity, and shared staff profile management on the live backend.
            </h3>
            <div className="flex items-center justify-center gap-2 text-xs tracking-wider text-slate-300">
              <span className="font-bold text-[#e2b13c]">Ascend</span>
              <span className="text-slate-500">•</span>
              <span>Connected to `api/v1` via ngrok</span>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[10px] font-semibold tracking-wider text-slate-400">
            <div className="flex items-center gap-2">
              <Lock className="size-3.5 text-[#e2b13c]" />
              <span>CUI // OPSEC · Not a Government System of Record</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="size-3.5" />
              <span>Bearer session live</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

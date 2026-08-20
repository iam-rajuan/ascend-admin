"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Moon,
  Sun,
  Clock,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { AscendLogo } from "@/components/ascend-logo";
import { AscendBanner } from "@/components/ascend-banner";
import { useAuthStore } from "@/store/auth-store";
import type { Person } from "@/store/users-store";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuthStore();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [email, setEmail] = useState("kofosonyq@mailinator.com");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/roles");
    }
  }, [isAuthenticated, router]);

  // Sync theme with document class list
  useEffect(() => {
    const savedTheme = localStorage.getItem("ascend_admin_theme") as "light" | "dark" | null;
    let initialTheme: "light" | "dark" = "light";

    if (savedTheme) {
      initialTheme = savedTheme;
    }

    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("ascend_admin_theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();

    // Directly log in and proceed to the next page (/roles) without validation error prompts
    const userPerson: Person = {
      id: "usr-1",
      name: "Lead Admin",
      email: email || "admin@g.com",
      password: password || "12345678",
      role: "admin",
      unit: "OPS Global",
      status: "active",
      lastEdit: "2026-08-20",
    };

    login(userPerson);
    router.push("/roles");
  };

  return (
    <div className="flex h-screen max-h-screen w-screen flex-col bg-[#f8fafc] dark:bg-[#070a13] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 overflow-hidden">
      
      {/* 1. TOP HEADER BAR */}
      <header className="flex h-14 w-full items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0e1628] px-6 md:px-8 flex-shrink-0 z-20">
        {/* Left Brand Badge */}
        <div className="flex items-center gap-2">
          <AscendLogo width={20} height={20} showDetails={false} />
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Ascend</span>
          <span className="text-xs text-slate-400 font-light select-none">/</span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Role directory</span>
        </div>

        {/* Right Action Menu */}
        <div className="flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#070a13] hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-all duration-200 cursor-pointer"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            type="button"
          >
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
            <span>WORKSPACE DIRECTORY</span>
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex size-1.5 rounded-full bg-red-500"></span>
            </span>
          </div>
        </div>
      </header>

      {/* 2. CUI / OPSEC NAVY BANNER */}
      <section className="flex h-8 w-full items-center justify-center bg-[#101b22] px-6 text-center text-[10px] font-semibold tracking-wider text-slate-400 select-none flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[#0da2b3]"></span>
          <span>CUI // OPSEC · Not a Government System of Record</span>
        </div>
      </section>

      {/* 3. SPLIT MAIN CONTAINER (FIT IN ONE WINDOW PAGE - NO SCROLL) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        
        {/* LEFT COLUMN: AUTH FORM */}
        <section className="flex flex-col justify-between bg-white dark:bg-[#0e1628] p-6 sm:p-8 lg:p-12 overflow-hidden border-r border-slate-200 dark:border-white/5">
          
          {/* Top Brand Logo */}
          <div className="flex items-center gap-3">
            <AscendLogo width={32} height={32} showDetails={true} />
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">Ascend</h1>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Role directory</p>
            </div>
          </div>

          {/* Form Container */}
          <div className="max-w-md w-full mx-auto my-auto space-y-5">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#0da2b3]">
                AUTHENTICATION
              </p>
              <h2 className="mt-1.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Sign in
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Sign in with your assigned email address. First-use continues into 20 onboarding questions, then drops you into your workspace.
              </p>
            </div>

            {/* Email & Password Sign-In Form */}
            <form onSubmit={handleSignIn} className="space-y-4 pt-1">
              {/* Email Address Input */}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kofosonyq@mailinator.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] py-3 pl-10 pr-4 text-xs font-medium text-slate-900 dark:text-white shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-[#0da2b3] focus:ring-1 focus:ring-[#0da2b3] transition-all"
                  />
                </div>
              </div>

              {/* Password Input with Eye Toggle */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-[11px] font-bold text-[#0da2b3] hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070a13] py-3 pl-10 pr-10 text-xs font-medium text-slate-900 dark:text-white shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-[#0da2b3] focus:ring-1 focus:ring-[#0da2b3] transition-all"
                  />
                  {/* Eye Button for Password Show/Hide */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button -> Direct navigation to next page */}
              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#0da2b3] hover:bg-[#0b8b9a] px-5 py-3.5 text-xs font-extrabold text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <span>Sign in</span>
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>

            {/* Last Used Sign-in Widget */}
            <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#070a13] p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex size-7 items-center justify-center rounded-lg bg-[#0da2b3]/15 text-[#0da2b3] flex-shrink-0">
                  <Clock className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Last used · Email sign-in</span>
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500"></span>
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    2 days ago from this device
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer links */}
          <footer className="flex flex-wrap gap-6 pt-4 text-xs text-slate-400">
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Accessibility</a>
          </footer>
        </section>

        {/* RIGHT COLUMN: GRAPHICS & MISSION GRADIENT */}
        <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#124d54] via-[#0e3b40] to-[#071a1d] p-8 lg:p-12 text-white">
          {/* Tactical grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

          {/* Ambient lighting glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#0da2b3]/20 blur-[90px] pointer-events-none" />

          {/* Top Banner Box */}
          <div className="relative z-10 flex justify-center">
            <div className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-6 py-3.5 shadow-xl">
              <AscendBanner logoSize={56} />
            </div>
          </div>

          {/* Central Quote Section */}
          <div className="relative z-10 my-auto max-w-lg py-8 text-center mx-auto space-y-4">
            <h3 className="text-2xl lg:text-3xl font-bold leading-snug text-white/95 tracking-tight">
              “Readiness is the work we do every day, not the moment we need it.”
            </h3>
            <div className="flex items-center justify-center gap-2 text-xs tracking-wider text-slate-300">
              <span className="font-bold text-[#e2b13c]">Ascend</span>
              <span className="text-slate-500">•</span>
              <span>Mission statement</span>
            </div>
          </div>

          {/* Bottom Security Info */}
          <div className="relative z-10 flex items-center justify-between text-[10px] font-semibold tracking-wider text-slate-400">
            <div className="flex items-center gap-2">
              <Lock className="size-3.5 text-[#e2b13c]" />
              <span>CUI // OPSEC · Not a Government System of Record</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="size-3.5" />
              <span>AES-256 Encrypted</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

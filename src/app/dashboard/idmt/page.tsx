"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, LogOut, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { AscendLogo } from "@/components/ascend-logo";
import { IconButton } from "@/components/ui/icon-button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/store/auth-store";

export default function IdmtDashboardPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const user = useCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f0f4f9] font-sans text-slate-800 dark:bg-[#070a13] dark:text-slate-100">
      <header className="z-20 flex h-14 w-full flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-white/5 dark:bg-[#0e1628] md:px-8">
        <div className="flex items-center gap-2">
          <AscendLogo width={20} height={20} showDetails={false} />
          <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">Ascend</span>
          <span className="select-none text-xs font-light text-slate-400 dark:text-slate-500">/</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">IDMT handoffs</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors duration-200 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            type="button"
          >
            <ArrowLeft className="size-4" />
            MY PROFILE
          </button>
          <IconButton
            icon={theme === "light" ? Moon : Sun}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            onClick={toggleTheme}
          />
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
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
          <span>CUI // OPSEC · IDMT login is live and routes to the handoff workspace path</span>
        </div>
      </section>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#0e1628]">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full border border-[var(--brand-color)/25] bg-[var(--brand-color)/15] text-lg font-bold text-[var(--brand-color)]">
                {user.initials}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user.roleName}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Card title="Workspace scope" value="Receive approved handoffs" icon={ClipboardCheck} />
              <Card title="Profile route" value="/dashboard/profile" icon={UserRound} />
              <Card title="Access state" value="Authenticated via live API" icon={ShieldCheck} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#0e1628]">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">IDMT integration status</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              The backend-supported `IDMT` role now lands on a valid dashboard route instead of a 404. This frontend
              workspace is ready for the handoff endpoints listed in the Postman collection:
              `GET /admin/idmt-handoffs`, `POST /admin/idmt-handoffs/:id/acknowledge`, and
              `GET /admin/idmt-handoffs/:id/download`.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Card({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof ClipboardCheck;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-[#070a13]">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <Icon className="size-3.5" />
        {title}
      </p>
      <p className="mt-1 font-medium text-slate-800 dark:text-white">{value}</p>
    </div>
  );
}

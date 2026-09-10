import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AscendLogo } from "@/components/ascend-logo";

const navItems = [
  { label: "Ascend", href: "/" },
  { label: "Solutions", href: "/solutions" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Research", href: "/research" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#070a13]/95">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <AscendLogo width={28} height={28} showDetails={false} />
          <div className="min-w-0">
            <p className="text-sm font-extrabold tracking-tight text-slate-950 dark:text-white">ASCEND™ BY DOMINION PERFORMANCE</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Assess. Adapt. Ascend.</p>
          </div>
        </Link>

        <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-1 py-1 transition hover:text-[var(--brand-color)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/30">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-color)] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-color-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/30"
          >
            Request a Demo
            <ArrowRight className="size-4" />
          </Link>
          <Link href="/sign-in" className="text-sm font-bold text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-5 py-8 text-sm text-slate-600 dark:border-white/10 dark:bg-[#070a13] dark:text-slate-300 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-3 gap-y-2 leading-6">
          <span>© 2026 Dominion Performance. All rights reserved. Ascend™ is a Dominion Performance platform.</span>
          <span aria-hidden="true">|</span>
          <Link href="/privacy" className="font-semibold hover:text-[var(--brand-color)]">Privacy</Link>
          <span aria-hidden="true">|</span>
          <Link href="/terms" className="font-semibold hover:text-[var(--brand-color)]">Terms</Link>
          <span aria-hidden="true">|</span>
          <Link href="/contact" className="font-semibold hover:text-[var(--brand-color)]">Contact</Link>
          <span aria-hidden="true">|</span>
          <a href="mailto:support@dominionperformance.ai" className="font-semibold hover:text-[var(--brand-color)]">support@dominionperformance.ai</a>
        </nav>
      </div>
    </footer>
  );
}

export function PublicPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-[#070a13] dark:text-slate-100">
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}

export function Section({ id, eyebrow, title, children }: { id?: string; eyebrow?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-t border-slate-200 px-5 py-16 dark:border-white/10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {eyebrow ? <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--brand-color)]">{eyebrow}</p> : null}
        <h2 className="mt-3 max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

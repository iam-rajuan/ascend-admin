import { PublicPageShell, Section } from "@/components/public/public-shell";

export default function ContactPage() {
  return (
    <PublicPageShell>
      <Section eyebrow="Contact" title="Talk with Dominion Performance.">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
            Exploring Ascend for a military formation, research program, or workforce? Request a demo, discuss a pilot, or contact us about partnership opportunities.
            <span className="mt-4 block">Interested in Ascend for your organization? Request a demo or discuss a pilot with Dominion Performance.</span>
          </p>
          <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#0e1628]">
            {["Name", "Organization", "Work Email", "Role", "Area of Interest"].map((label) => (
              <label key={label} className="grid gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
                {label}
                <input className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color)]/20 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
              </label>
            ))}
            <label className="grid gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
              Message
              <textarea rows={5} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color)]/20 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
            </label>
            <a href="mailto:support@dominionperformance.ai" className="inline-flex justify-center rounded-lg bg-[var(--brand-color)] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[var(--brand-color-hover)]">
              Request a Demo
            </a>
          </form>
        </div>
      </Section>
    </PublicPageShell>
  );
}

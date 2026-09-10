import { PublicPageShell, Section } from "@/components/public/public-shell";

export default function HowItWorksPage() {
  return (
    <PublicPageShell>
      <Section eyebrow="How It Works" title="ASSESS — Capture brief, recurring health and performance signals. ADAPT — Translate those signals into one practical next action and route support when needed. ASCEND — Build healthier performance patterns while authorized leaders see privacy-protected aggregate trends.">
        <p className="max-w-4xl text-lg leading-8 text-slate-600 dark:text-slate-300">Recurring check-ins identify meaningful changes. Ascend then recommends one practical next action and, when appropriate, routes the individual for human review, follow-up, or specialist support.</p>
      </Section>
    </PublicPageShell>
  );
}


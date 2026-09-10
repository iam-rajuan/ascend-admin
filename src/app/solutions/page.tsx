import { PublicPageShell, Section } from "@/components/public/public-shell";

export default function SolutionsPage() {
  return (
    <PublicPageShell>
      <Section eyebrow="Solutions" title="Built first for distributed military readiness. Designed to scale across high-demand workforces.">
        <div className="grid gap-8 lg:grid-cols-2">
          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">For Guard and Reserve formations, Ascend extends preventive health and human performance support between drills. Individuals receive practical actions, specialists gain continuity between encounters, and authorized leaders see aggregate readiness trends across dispersed populations.</p>
          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">The same preventive-health architecture can support distributed workforces in healthcare, public safety, manufacturing, logistics, aerospace and defense, and other high-demand environments.</p>
        </div>
      </Section>
    </PublicPageShell>
  );
}


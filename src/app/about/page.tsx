import { PublicPageShell, Section } from "@/components/public/public-shell";

export default function AboutPage() {
  return (
    <PublicPageShell>
      <Section eyebrow="About" title="Dominion Performance">
        <div className="space-y-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
          <p>Readiness is the work we do every day, not the moment we need it.</p>
          <p>Dominion Performance helps organizations identify and address emerging health and performance risks before they become preventable human and operational losses.</p>
          <p>Dominion Performance is a preventive health and human performance company headquartered in Augusta, Georgia. We develop systems that help organizations identify emerging risk earlier, guide practical action, connect people to appropriate support, and improve continuity across distributed workforces. Ascend™ is our digital platform for continuous preventive health and human performance.</p>
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Augusta, Georgia.</p>
        </div>
      </Section>
    </PublicPageShell>
  );
}

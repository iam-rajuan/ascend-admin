import { PublicPageShell, Section } from "@/components/public/public-shell";

export default function ResearchPage() {
  return (
    <PublicPageShell>
      <Section eyebrow="Research" title="Research & Validation">
        <div className="space-y-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
          <p>Current Status: Ascend is in pilot and capability-development stages, with ongoing evaluation of usability, engagement, preventive-health workflows, and distributed-force readiness.</p>
          <p>Evaluation priorities include usability, engagement, adherence, time-to-support, workflow completion, readiness trends, and the effectiveness of preventive routing and support.</p>
        </div>
      </Section>
    </PublicPageShell>
  );
}


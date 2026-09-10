import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, ClipboardCheck, Compass, HeartPulse, Layers3, ShieldCheck, UsersRound } from "lucide-react";
import { AscendLogo } from "@/components/ascend-logo";
import { PublicPageShell, Section } from "@/components/public/public-shell";

const domains = ["Physical Performance", "Recovery & Sleep", "Nutrition", "Mental Performance", "Purpose & Connection"];
const outcomes = ["Earlier Risk Identification", "Better Continuity", "More Targeted Support", "Greater Individual Agency", "Actionable Organizational Insight"];
const workflowSteps = [
  { title: "ASSESS — Capture brief, recurring health and performance signals.", icon: ClipboardCheck },
  { title: "ADAPT — Translate those signals into one practical next action and route support when needed.", icon: Compass },
  { title: "ASCEND — Build healthier performance patterns while authorized leaders see privacy-protected aggregate trends.", icon: BarChart3 },
];

export default function Home() {
  return (
    <PublicPageShell>
      <section id="ascend" className="px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--brand-color)]">ASCEND™ BY DOMINION PERFORMANCE</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
              Identify emerging health and performance risk before it becomes operational loss.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Ascend is a preventive health and human performance platform that turns recurring readiness signals into practical action, appropriate support, and privacy-protected organizational insight.
            </p>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Dominion Performance is a preventive health and human performance company developing systems that help organizations identify emerging risk earlier and connect people to timely action and support.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Dominion Performance is a preventive health and human performance company focused on identifying emerging health and performance risks early, guiding practical action, and helping organizations reduce preventable human and operational loss.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-color)] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[var(--brand-color-hover)]">
                Request a Demo
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/sign-in" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-800 transition hover:border-[var(--brand-color)] dark:border-white/10 dark:bg-slate-900 dark:text-white">
                Pilot / Authorized User Sign In
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0e1628]">
            <div className="flex items-center gap-4">
              <AscendLogo width={56} height={56} showDetails={true} />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#e2b13c]">Assess. Adapt. Ascend.</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Preventive health infrastructure for human readiness.</h2>
              </div>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {domains.map((domain) => (
                <div key={domain} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
                  {domain}
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm font-extrabold text-slate-700 dark:text-slate-200">Physical Performance | Recovery & Sleep | Nutrition | Mental Performance | Purpose & Connection.</p>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Privacy-conscious by design — with role-based access, protected workflows, and aggregate organizational reporting.</p>
            <p className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
              Ascend™ is a commercial Dominion Performance product and is not a U.S. Government or Department of Defense program.
            </p>
          </div>
        </div>
      </section>

      <Section id="solutions" eyebrow="Solutions" title="The gap is between the moments that matter.">
        <div className="grid gap-8 lg:grid-cols-2">
          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
            Health and performance risks often emerge between appointments, drills, coaching sessions, and onsite support. By the time those risks become visible through injury, burnout, absence, or declining performance, the opportunity for early action may already be lost.
          </p>
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#0e1628]">
            <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">The real readiness test happens in the other 28 days.</h3>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
              Guard and Reserve service members spend most of each month away from centralized health and performance resources. Ascend helps extend preventive support between drills through brief check-ins, practical actions, and appropriate routing to human support.
            </p>
          </div>
        </div>
      </Section>

      <Section id="how-it-works" eyebrow="How It Works" title="How Ascend turns signals into action.">
        <p className="max-w-4xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Earlier signals. Better continuity. More targeted support. Ascend helps individuals act sooner, specialists focus attention where it matters, and organizations see meaningful trends without exposing unnecessary individual data.
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {workflowSteps.map(({ title, icon: StepIcon }) => {
            return (
              <article key={title} className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#0e1628]">
                <StepIcon className="size-6 text-[var(--brand-color)]" />
                <h3 className="mt-5 text-lg font-black leading-7 text-slate-950 dark:text-white">{title}</h3>
              </article>
            );
          })}
        </div>
        <p className="mt-8 max-w-4xl rounded-lg border border-slate-200 bg-white p-5 leading-7 text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
          Recurring check-ins identify meaningful changes. Ascend then recommends one practical next action and, when appropriate, routes the individual for human review, follow-up, or specialist support.
        </p>
      </Section>

      <Section title="Role-based, privacy-conscious workflows.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            "Individual — completes brief check-ins, receives a personalized next action, tracks progress, and connects with appropriate support.",
            "Strength & Conditioning Specialist — supports physical performance, conditioning, and performance-plan follow-up.",
            "Physical Therapy / Injury Management — supports appropriate rehabilitation and injury-management workflows while maintaining clear separation between clinical care and performance support.",
            "Mental Performance — supports cognitive skills, stress-management strategies, focus, and performance under pressure.",
            "HPO / Program Manager — monitors program-level trends, support utilization, case flow, adherence, and aggregate readiness indicators.",
            "Program Manager — oversees program activity, workflow status, aggregate trends, and operational coordination.",
          ].map((role) => (
            <div key={role} className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold leading-6 text-slate-700 dark:border-white/10 dark:bg-[#0e1628] dark:text-slate-200">
              {role}
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-5xl rounded-lg border border-slate-200 bg-white p-5 leading-7 text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
          Role-based access limits information to the people who need it, while leaders receive aggregate trends rather than unrestricted individual health data.
        </p>
      </Section>

      <Section title="Built first for distributed military readiness. Designed to scale across high-demand workforces.">
        <div className="grid gap-8 lg:grid-cols-2">
          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
            For Guard and Reserve formations, Ascend extends preventive health and human performance support between drills. Individuals receive practical actions, specialists gain continuity between encounters, and authorized leaders see aggregate readiness trends across dispersed populations.
          </p>
          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
            The same preventive-health architecture can support distributed workforces in healthcare, public safety, manufacturing, logistics, aerospace and defense, and other high-demand environments.
          </p>
        </div>
      </Section>

      <Section title="Outcomes Ascend is designed to support.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {outcomes.map((outcome) => (
            <div key={outcome} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0e1628]">
              <CheckCircle2 className="size-5 text-[var(--brand-color)]" />
              <h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">{outcome}</h3>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-5xl leading-7 text-slate-600 dark:text-slate-300">
          Ascend is designed to help organizations address factors associated with burnout, absenteeism, performance decline, and avoidable cost. Outcome claims will be strengthened as pilot and research evidence matures.
        </p>
      </Section>

      <Section id="research" eyebrow="Research" title="Research & Validation">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#0e1628]">
            <HeartPulse className="size-6 text-[var(--brand-color)]" />
            <p className="mt-5 leading-7 text-slate-600 dark:text-slate-300">Current Status: Ascend is in pilot and capability-development stages, with ongoing evaluation of usability, engagement, preventive-health workflows, and distributed-force readiness.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#0e1628]">
            <Layers3 className="size-6 text-[var(--brand-color)]" />
            <p className="mt-5 leading-7 text-slate-600 dark:text-slate-300">Evaluation priorities include usability, engagement, adherence, time-to-support, workflow completion, readiness trends, and the effectiveness of preventive routing and support.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#0e1628]">
            <ShieldCheck className="size-6 text-[var(--brand-color)]" />
            <p className="mt-5 leading-7 text-slate-600 dark:text-slate-300">Ascend supports preventive health, human performance, early risk identification, decision support, and appropriate routing. It is not positioned as an independent diagnostic system.</p>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">Ascend is not currently intended to independently diagnose, treat, cure, or prevent a medical condition and does not replace evaluation or care by a qualified healthcare professional.</p>
          </div>
        </div>
      </Section>

      <Section title="Product status">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            ["Available Now", "Public information pages, the /sign-in authorized-user frontend route, and role-routed dashboard frontend routes are present in the current build."],
            ["In Pilot / Validation", "Current Status: Ascend is in pilot and capability-development stages, with ongoing evaluation of usability, engagement, preventive-health workflows, and distributed-force readiness."],
            ["Planned Expansion", "No additional active production capabilities were verified from the current frontend/project material; unverified capabilities are not categorized as available."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#0e1628]">
              <h3 className="text-lg font-black text-slate-950 dark:text-white">{title}</h3>
              <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">{body}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <p className="rounded-lg border border-slate-200 bg-white p-5 leading-7 text-slate-600 dark:border-white/10 dark:bg-[#0e1628] dark:text-slate-300">Consistent, structured readiness data that supports reliable tracking and reporting.</p>
          <p className="rounded-lg border border-slate-200 bg-white p-5 leading-7 text-slate-600 dark:border-white/10 dark:bg-[#0e1628] dark:text-slate-300">Standardized data and workflow rules designed to support reliable integrations and consistent system behavior.</p>
        </div>
      </Section>

      <Section id="about" eyebrow="About" title="Dominion Performance">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
            <p>Readiness is the work we do every day, not the moment we need it.</p>
            <p>Dominion Performance helps organizations identify and address emerging health and performance risks before they become preventable human and operational losses.</p>
            <p>Dominion Performance is a preventive health and human performance company headquartered in Augusta, Georgia. We develop systems that help organizations identify emerging risk earlier, guide practical action, connect people to appropriate support, and improve continuity across distributed workforces. Ascend™ is our digital platform for continuous preventive health and human performance.</p>
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Augusta, Georgia.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#0e1628]">
            <UsersRound className="size-7 text-[var(--brand-color)]" />
            <p className="mt-5 leading-7 text-slate-600 dark:text-slate-300">Ascend™ is developed and operated by Dominion Performance.</p>
          </div>
        </div>
      </Section>
    </PublicPageShell>
  );
}

import { PublicPageShell, Section } from "@/components/public/public-shell";

export default function TermsPage() {
  return (
    <PublicPageShell>
      <Section eyebrow="Terms" title="Terms of Use">
        <div className="space-y-8 text-base leading-7 text-slate-600 dark:text-slate-300">
          <section>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Platform ownership</h2>
            <p className="mt-3">Ascend is designed to support role-based access, privacy-conscious workflows, and applicable customer security requirements.</p>
            <p className="mt-3">Ascend™ is developed and operated by Dominion Performance.</p>
            <p className="mt-3">Ascend is Dominion Performance&apos;s platform for continuous preventive health and human performance.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Ownership and licensing</h2>
            <p className="mt-3">Dominion Performance owns Ascend and its intellectual property. Authorized users receive a limited, non-transferable right to use the platform according to these Terms and any applicable customer agreement.</p>
            <p className="mt-3">Users may not copy Ascend, reverse engineer Ascend, attempt unauthorized access, misuse the platform, or use Ascend for unlawful purposes.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Enterprise agreements</h2>
            <p className="mt-3">If your organization has entered into a separate written agreement with Dominion Performance governing use of Ascend, that agreement controls to the extent of any conflict with these Terms.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Government use</h2>
            <p className="mt-3">Government users may be subject to additional contractual, security, records-management, and information-handling requirements established in the applicable agreement or authorization.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Clinical boundary</h2>
            <p className="mt-3">Ascend is not currently intended to independently diagnose, treat, cure, or prevent a medical condition and does not replace evaluation or care by a qualified healthcare professional.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Risk allocation topics requiring counsel-approved language</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                "Disclaimer of warranties",
                "Limitation of liability",
                "Indemnification where appropriate",
                "Account suspension/termination",
                "Governing law",
                "Venue/dispute resolution",
                "Severability",
              ].map((topic) => (
                <div key={topic} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
                  {topic}
                </div>
              ))}
            </div>
            <p className="mt-4">Counsel-approved substantive language is required before final publication of these risk-allocation sections.</p>
          </section>
        </div>
      </Section>
    </PublicPageShell>
  );
}

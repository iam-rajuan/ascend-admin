import { PublicPageShell, Section } from "@/components/public/public-shell";

const privacyRows = [
  {
    category: "account/contact data",
    policyNeed: "Identify what account and contact fields are collected and used to provide Ascend access and support.",
  },
  {
    category: "assessment/readiness data",
    policyNeed: "Describe health, readiness, and performance signals according to the approved deployment and customer agreement.",
  },
  {
    category: "usage/log data",
    policyNeed: "Describe platform activity, workflow, access, and audit-related records according to configured deployment needs.",
  },
  {
    category: "device/technical data",
    policyNeed: "Describe browser, device, network, and technical information used for security, reliability, and service operation.",
  },
  {
    category: "support communications",
    policyNeed: "Describe communications submitted through support, contact, pilot, or demo workflows.",
  },
  {
    category: "optional uploaded records",
    policyNeed: "Describe any optional records uploaded by authorized users or customers and the controls that apply to them.",
  },
  {
    category: "purpose of use",
    policyNeed: "Explain the service, support, workflow, analytics, security, and contractual purposes that apply to each deployment.",
  },
  {
    category: "sharing categories",
    policyNeed: "Identify customer, authorized-role, service-provider, legal, security, and agreement-based sharing categories where applicable.",
  },
  {
    category: "retention basis",
    policyNeed: "Use the stated retention basis and identify how periods vary by data type and customer agreement.",
  },
  {
    category: "user/customer controls",
    policyNeed: "Describe available request, access, correction, deletion, consent, and customer-administration controls where applicable.",
  },
];

export default function PrivacyPage() {
  return (
    <PublicPageShell>
      <Section eyebrow="Privacy" title="Privacy Policy">
        <div className="space-y-8 text-base leading-7 text-slate-600 dark:text-slate-300">
          <p>The responsible legal entity has not been verified in the current frontend/project material. Dominion Performance&apos;s privacy role may vary depending on whether it operates for a customer or directly for a user.</p>
          <p>Ascend is not currently intended to independently diagnose, treat, cure, or prevent a medical condition and does not replace evaluation or care by a qualified healthcare professional.</p>
          <p>HIPAA applicability depends on the deployment and the role Dominion Performance performs for a customer. Ascend should not be assumed to be a HIPAA-covered service in every deployment. Where HIPAA applies, required contractual and security obligations will be addressed in the applicable customer agreement.</p>
          <p>We retain personal information only for as long as reasonably necessary to provide the services, satisfy contractual requirements, meet legal or regulatory obligations, resolve disputes, and enforce agreements. Retention periods may vary by data type and customer agreement.</p>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-white/10">
              <caption className="sr-only">Privacy data table</caption>
              <thead className="bg-slate-100 dark:bg-slate-900">
                <tr>
                  <th scope="col" className="px-4 py-3 font-black text-slate-900 dark:text-white">Category</th>
                  <th scope="col" className="px-4 py-3 font-black text-slate-900 dark:text-white">Policy coverage</th>
                  <th scope="col" className="px-4 py-3 font-black text-slate-900 dark:text-white">Current status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-[#0e1628]">
                {privacyRows.map((row) => (
                  <tr key={row.category}>
                    <th scope="row" className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{row.category}</th>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.policyNeed}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Requires approved operational/privacy details before final publication.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <section>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Your Privacy Rights</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                "Rights that apply under relevant law",
                "How to submit a request",
                "Identity verification",
                "Authorized agents where applicable",
                "Non-discrimination for exercising privacy rights",
              ].map((topic) => (
                <div key={topic} className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
                  {topic}
                </div>
              ))}
            </div>
            <p className="mt-4">Privacy requests can be started through the Contact page. Jurisdiction-specific rights, required verification steps, authorized-agent procedures, and the final request intake channel require approved legal/privacy content.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Family and minor data</h2>
            <p className="mt-3">Family/minor functionality is not presented as launched in the current frontend. Before family/minor functionality launches, add: age eligibility, parental/guardian consent, dependent-data access rules, household privacy boundaries, and procedures for deletion or correction of minor data.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">International processing</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {["Cross-border transfer disclosures", "Jurisdiction disclosures", "Lawful-transfer disclosures"].map((topic) => (
                <div key={topic} className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
                  {topic}
                </div>
              ))}
            </div>
            <p className="mt-4">The current frontend/project material does not verify international processing or U.S.-only status. Approved content is required before stating that the service is intended for U.S. use or before publishing cross-border transfer, jurisdiction, and lawful-transfer disclosures.</p>
          </section>
        </div>
      </Section>
    </PublicPageShell>
  );
}

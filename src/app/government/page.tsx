import { PublicPageShell, Section } from "@/components/public/public-shell";

const contractingItems = [
  {
    label: "Verified procurement identifiers",
    value: "Pending verified client-provided identifiers.",
  },
  {
    label: "Relevant NAICS codes",
    value: "Pending verified client-provided NAICS codes.",
  },
  {
    label: "Capabilities statement",
    value:
      "Dominion Performance is a preventive health and human performance company developing systems that help organizations identify emerging risk earlier and connect people to timely action and support.",
  },
  {
    label: "SDVOSB status",
    value: "Pending verified client-provided SDVOSB status.",
  },
  {
    label: "Government contact information",
    value: "Pending verified client-provided government contact information.",
  },
];

export default function GovernmentPage() {
  return (
    <PublicPageShell>
      <Section eyebrow="Government" title="Government and contracting information">
        <div className="max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          <p>Ascend™ is a commercial Dominion Performance product and is not a U.S. Government or Department of Defense program.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {contractingItems.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0e1628]">
              <h2 className="text-base font-black text-slate-950 dark:text-white">{item.label}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.value}</p>
            </div>
          ))}
        </div>
      </Section>
    </PublicPageShell>
  );
}

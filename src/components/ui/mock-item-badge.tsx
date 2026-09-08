/**
 * Shared marker for any dashboard section still backed by mock/placeholder
 * data instead of a real backend call. See AGENTS.md "Mock data marking
 * rule" - every one of the 8 role dashboards must use this exact badge on
 * any mock section, and remove it the same day that section is wired to a
 * real endpoint.
 */
export function MockItemBadge({ label = "Mock data" }: { label?: string }) {
  return (
    <span className="rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-200">
      {label}
    </span>
  );
}

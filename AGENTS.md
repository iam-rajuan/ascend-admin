<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Mock data marking rule (all 8 role dashboards)

Applies to every role dashboard view: `admin`, `scs`, `pt-im`, `mp`, `nutritionist`, `pc`, `leadership`, `idmt` (`src/features/<role>/components/*.tsx`).

- Any section, card, table, or widget whose content is NOT coming from a real backend call (hardcoded numbers/strings, a local placeholder array, a Figma-copied static list) MUST be wrapped with `<MockItemBadge />` from `@/components/ui/mock-item-badge`, placed next to the section's title.
  - Use the default label ("Mock data") for a fully mock section.
  - Use `<MockItemBadge label="Partial mock" />` when some of a section's fields are real and others are still mocked.
- The moment that section is wired to a real endpoint, the `<MockItemBadge />` for it MUST be removed in the same change — a badge left on real data is as misleading as missing one on mock data.
- Do not invent a different visual style per dashboard. `MockItemBadge` is the one shared component for this — import it, don't re-implement it locally (it used to be locally defined inside `scs-view.tsx`; that was wrong and has been extracted to `src/components/ui/mock-item-badge.tsx`).
- When building a new section, real-vs-mock is not a style choice: if the real data isn't available yet (no backend endpoint, or endpoint not yet called from this view), ship it mocked and badged rather than silently shipping fabricated-looking real data.

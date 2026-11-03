# Grocery Agent design rationale

The visual language uses a forest-green identity and native Expo controls.
[AGENTS.md](../../AGENTS.md) holds UI conventions; [src/global.css](../../src/global.css)
is the source of truth for tokens.

- Physical pixel text and spacing tokens avoid Metro’s 14px rem conversion
  shrinking body text or touch targets.
- Borders and semantic surface colors establish grouping without decorative
  shadows, gradients, or glass. Success includes a check and words; color alone
  cannot carry status.
- Loading, empty collections, no search results, and failed requests are separate
  states. Background failures can coexist with previously loaded content.
- Native sheets keep short forms in context. Pending saves retain submitted values
  and block accidental dismissal; failed mutations retain drafts. Dirty edits need
  a keep/discard choice on Back.
- Disclosure keeps meal plans, deals, and technical details available without
  competing with the current shopping task.

For repeatable native checks and historical screenshot limits, see the
[review procedure](verification.md).

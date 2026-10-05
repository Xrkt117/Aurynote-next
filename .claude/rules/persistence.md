---
paths:
  - "desktop/src/store.ts"
  - "desktop/src/progression.ts"
  - "desktop/tests/store.test.ts"
---
# Profile persistence

- The profile lives in localStorage under `aurynote.next.v1`. Never reuse the submitted app's key: both sites
  share a GitHub Pages origin, and separate keys keep their data apart.
- The profile is version 2. A new field gets a default for older saves, and a migration keeps existing
  attempts, lesson progress and preferences.
- The context profile setter writes each completed transition synchronously, so a fast reload does not lose
  it. Do not move the write into an effect.
- Invalid saved data falls back to safe defaults; it never throws. Song charts are validated in
  `progression.ts`.
- Attempts are capped at the latest 2,000. Daily grouping uses local dates; impossible dates are dropped.
- Changes here trigger a cold review and update the "Your progress and storage" section of `docs/DESIGN.md`.

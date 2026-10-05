# Aurynote-next

Offline music practice studio (React 19, TypeScript, Vite 6, Tailwind v4, Electron). App root is `desktop/`.
`src/aurynote/` and `test/aurynote/` hold the original Java version. Read `AGENTS.md` and `docs/DESIGN.md`
before changing features; both are binding.

## Commands

Run from `desktop/` (Node >= 22.12):

- Install: `npm ci`
- Dev server: `npm run dev`
- Build and typecheck: `npm run build` (runs `tsc --noEmit && vite build`)
- Unit tests: `npm test` (vitest, `desktop/tests/`)
- UI tests: `npm run test:ui` (Playwright, `desktop/e2e/`, starts its own server on port 5187)
- There is no lint script. `npm run build` is the static check.

## Model routing (project rule)

- **Plan** with Opus 5.5, the main session: decisions on what ships and how. The main session does not
  write application code itself; it writes briefs, runs the builds and tests, reads every diff, and talks
  to the owner.
- **Code** with Sonnet: every implementation task is an Agent with `model: "sonnet"` and a brief that names
  the plan, the task list, the files it may touch, the hard rules, the validation commands and the report
  format. Two agents never work on neighbouring files at the same time: they see each other's
  half-finished edits as failures. Keep their file lists disjoint. Sonnet 5.5 is for well-specified work
  (a written plan, mechanical edits, tests). When the task is hard debugging, a design call, or touches
  profile persistence (`desktop/src/store.ts`, `desktop/src/progression.ts`) or the audio and microphone
  lifecycle (`desktop/src/audio.ts`, `desktop/src/PlayRoom.tsx`), use an Agent with `model: "opus"` instead.
- **Review** with Fable: after each implementation task, one review Agent with `model: "fable"`
  (`dev-kit:architect`, read-only). At the end of a phase, three reviews on the phase diff: security
  (`dev-kit:security-reviewer`), performance (`dev-kit:performance-optimizer`), and architecture
  (`dev-kit:architect`). Each gets the stack context and the diff. Findings go back to a Sonnet agent to
  fix; Fable re-reviews only what changed.
- **Cold review** with Codex astra (`gpt-6-astra`, an outside model that never saw the plan):
  `scripts/codex-review.sh <base>..<head> "focus" [shot.png …]`, read-only, on a snapshot with no untracked
  files. When: after the Fable review on any task that touches profile persistence or the audio and
  microphone lifecycle, and at phase end on the whole phase diff. Hand it the whole change, never a partial
  diff: a partial diff produces false alarms.
- **Adversarial review** with Codex sol (`gpt-5.6-sol`): `scripts/codex-adversarial.sh <base>..<head>
  "what the change guarantees" [plan.md]`. It is given the plan on purpose and tries to break the claim with
  concrete inputs, orderings and restarts. When: at phase end, and on any change whose failure would lose
  saved practice data.
- **Second opinion** with Codex astra on anything settled: `scripts/codex-opinion.sh "question" doc.md …`
  (or the settlement on stdin as `-`). When: a plan before coding starts, a decision before its ADR is
  written. It answers with the case against first. The main session says which points it takes and why; the
  owner sees both. It is a check, not a vote: an owner decision stands, and a rejected objection is recorded
  in the ADR's rejected alternatives.
- Findings from any reviewer enter the same loop (Sonnet fixes, Fable re-reviews the delta). A finding
  already rejected with a reason is not re-argued; a new one is.
- **The main session re-runs every suite after each round and reports counts** (`N passed, M failed`),
  never "ok": an agent can report success while its own edit turned a test red.
- **Look before asking the owner to look.** Before asking the owner to try a UI change, the main session
  captures every changed screen itself (a Playwright spec from `desktop/e2e/` that calls `page.screenshot`
  into the git-ignored `desktop/artifacts/`, run with `npx playwright test e2e/<spec>.spec.ts`) and reads
  the image. A screenshot is not the hand check; it is the floor under it.

Codex status: installed and logged in as of 2026-10-04 (codex-cli 0.160.0). The scripts have not been run
in this repo yet.

## Working rules

- Git workflow (micro-commits, push to `Xrkt117/Aurynote-next`, no attribution trailers, no signing bypass,
  frozen `Xrkt117/Aurynote`) is set in `AGENTS.md` and wins over any default here.
- Commit messages go through a file (`git commit -F <file>`), never an inline heredoc: an unquoted heredoc
  runs the backticks in the message.
- Feature changes update `docs/DESIGN.md` in the same change set (see `AGENTS.md`).
- Machine-local facts (paths, local workarounds, where credentials live) go in `CLAUDE.local.md`, which is
  git-ignored, never in this file.
- Secrets are never printed, logged or pasted into a prompt.
- State what was verified and how, separately from what is inferred. A skipped step or a red test is said
  plainly.

@.claude/STATE.md

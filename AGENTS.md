# Repository instructions

## Design documentation

Read `docs/DESIGN.md` before changing product features, screens, interactions, sound, notation, or persistence in the desktop app.

Whenever adding, changing, or removing a feature, update the relevant sections of `docs/DESIGN.md` in the same change set. Include the user-facing behavior, layout and controls, states and feedback, accessibility considerations, implementation files, and relevant limitations. Add a short design-history entry for meaningful feature changes. Document shipped behavior accurately; label proposals as unimplemented.

Keep the README short and link to the design document for detail. Preserve aurynote's restrained visual style, simple code comments, and small commits with short plain messages. Do not include unrelated user files in commits.

## GitHub micro-commits

Make frequent, small, meaningful commits as work progresses. Split independent changes into separate commits whenever practical; do not batch an entire feature overhaul into one commit. Each commit should describe one clear change and leave a coherent checkpoint. Do not create empty or artificial commits just to increase the count.

Use short, plain commit messages, such as `Improve sax sounds`, `Clarify answer feedback`, or `Update design notes`. Avoid long descriptions and generated attribution trailers.

Stage only files belonging to the current change. Run relevant checks before publishing and push completed commits to the active task branch on GitHub. Continued development belongs in `Xrkt117/Aurynote-next` on `main` or feature branches. The original `Xrkt117/Aurynote` repository, its `hackathon-overhaul` branch, and its Pages site are frozen hackathon submission artifacts: do not push, change settings, or trigger deployments there. Check the push destination before publishing. Preserve micro-commit history; do not squash or force-push unless explicitly requested.

Preserve commit signing when it is configured. Do not disable signing to bypass a key or passphrase error; resolve the signing issue before committing.

## Codex roles

Read `CLAUDE.md` for the model routing. Codex runs here only as a read-only reviewer, in three roles: the cold review (`scripts/codex-review.sh`, gpt-6-astra, which judges the code without the plan), the adversarial review (`scripts/codex-adversarial.sh`, gpt-5.6-sol, which tries to break what the change claims), and the second opinion (`scripts/codex-opinion.sh`, gpt-6-astra, which argues the case against a settled document). In every role it never edits a file. Tie each finding to a file and line, and a concrete scenario.

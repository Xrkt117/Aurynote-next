# 0001 — Model routing

**Date:** 2026-10-04
**Status:** accepted

## Context
Several models work on this repo. A model that wrote code reviews it less critically than one that did not,
so review has to come from a different model than the one that coded.

## Decision
| Role | Model |
|---|---|
| Plans | Opus 5.5 (main session) |
| Codes | Sonnet 5.5 (Agent `model: "sonnet"`) |
| Hard debugging, design calls, rounds where a wrong answer costs a whole review cycle | Opus 5.5 (Agent `model: "opus"`) |
| Reviews | Fable (Agent `model: "fable"`) |
| Cold review, second opinion | Codex `gpt-6-astra` |
| Adversarial review | Codex `gpt-5.6-sol` |

Codex runs through `scripts/codex-*.sh` on a secret-free `git archive` snapshot, read-only.

## Consequences
- Codex must be logged in (`codex login status`), or the three Codex roles sit idle.
- Each Codex review costs money and time.
- Sonnet agents need disjoint file lists.
- Codex stays read-only and never edits a file.

## Alternatives rejected
- One model for everything: it would review its own work.
- Coding with Codex (tried 2026-09-22 to 09-30 on flipapp and cameratracker): no measured edge over Sonnet,
  its sandbox blocks Gradle and sockets so the main session still validated every round, and it took the
  weekly Codex limit from about 15% to 92%. Codex earns its cost as an independent reviewer: it found
  defects that three Opus reviews missed. That independence is lost if it also writes the code.

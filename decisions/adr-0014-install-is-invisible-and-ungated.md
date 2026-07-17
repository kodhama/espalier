---
id: adr-0014-install-is-invisible-and-ungated
type: adr
status: draft
depends_on: [adr-0012-methodology-delivery-machinery, adr-0013-check-scope-mode]
informed_by: [adr-0005-tdd-and-artifact-gated-dispatch]
owner: agent
updated: 2026-07-17
---

# ADR-0014 (DRAFT): installing grove is invisible to the consumer's tooling, and grove does not gate its own arrival

> **STATUS: DRAFT — not shaped to convergence, not adversary-checked, not
> at any human gate.** Opened as a shaping change-request so a parallel
> session reviewing `/trellis:setup` can cross-read it: several findings
> below are **shared-pattern** (they apply to `trellis`'s setup skill the
> same way, since grove's setup was modeled on trellis's
> augment-never-clobber composition idiom), not grove-only. This draft
> records the grove side of that conversation; it will be shaped +
> adversary-broken before any approval.

## Context

The `math-quest` pilot (adr-0013 Consequence 4 — the first real
consumer install) surfaced install-time friction that no grove-self test
could, because grove-self *is* the tooling owner:

1. **The consumer's linter reds on grove's vendored runtime.** math-quest's
   ESLint linted `.grove/check/**` and flagged `process`/`Buffer` as
   `no-undef` — Node globals in files the linter didn't treat as Node.
   But the deeper point: a consumer should not lint `.grove/` at all — it
   is grove's vendored namespace (runtime + companions + policy carrier),
   a dependency, not the consumer's source.
2. **The install PR reds on grove's own just-vendored machinery.** Because
   the check governs its own machinery (`adr-0013` F3 — a machinery edit is
   never silent), an install that lands as a PR runs the check on that PR,
   where `.grove/check/**` + the workflow are *added* code owing reviews
   they cannot yet have → red. The tripwire that is *correct* for ongoing
   edits is *noise* on the initial vendoring.

Both are one theme: **grove's arrival collides with, or is judged by, the
consumer's existing setup.** The first thing a first-run consumer sees is
red CI on grove's own files — the opposite of "just works."

## Decision (draft — the three moves)

1. **grove does not gate its own installation.**
   - The workflow triggers on `pull_request` / `issue_comment`, never
     `push` — so an install that lands as a **direct commit to the default
     branch** produces *no workflow run at all*. The check begins on the
     consumer's next real PR (green in `scoped` mode for ordinary code).
     This is the default recommendation: installing grove is a bootstrap
     act, not a reviewable change (you do not PR-review `npm install`).
   - For **protected-main repos** (must PR the install): the workflow gains
     a **bootstrap self-detect** first step — it checks whether its own
     file (`check_workflow_path`, `adr-0013`) exists on the base branch. If
     **absent** (this PR is introducing grove), it exits green with
     *"grove install detected — the check activates on your next PR"* and
     never invokes the check. Once merged, the workflow lives on the base;
     every subsequent PR runs it for real.
   - **The F3 tripwire is unweakened.** The skip fires *only* when the
     workflow file is absent-on-base — which happens exactly once, at
     install. A later PR that *edits* `.grove/check/**` (a grove version
     bump) runs and gates normally, because by then the workflow is
     established on base. Install ≠ edit; the check tells them apart by its
     own presence, not by a `paths-ignore` on the machinery (which *would*
     reopen F3's silent-machinery-edit hole — considered and rejected). The
     one theoretical bypass — delete the gate in one PR, re-add it in
     another for a skip — requires **loudly merging a PR that removes your
     own CI**, which no silent actor can do (same class as "a repo can
     always delete its own workflow").

2. **The install is invisible to the consumer's existing tooling.** Setup
   (interactively — see move 3) **detects** the consumer's linters/
   formatters (ESLint `.eslintrc*`/`eslint.config.*`/`eslintConfig`,
   Prettier, Biome, …) and **offers** to add the **whole `.grove/`
   namespace** — not just `.grove/check/` — to their ignore, augment-never-
   clobber, honoring the answer. `.grove/` is the namespace boundary: all
   of it (runtime, companions, policy carrier) is grove's vendored
   territory, none of it consumer source. The whole-namespace rule is
   future-proof — it covers runtime that later grows beyond `check/`, and
   non-JS tooling (a markdown/YAML formatter over the companions/policy) —
   where a `.grove/check/**` glob would not. (Note: the consumer's lint-
   ignore is a *separate tool* from grove's check — ignoring `.grove/` in
   ESLint does not affect grove's own F3 gating of `.grove/check/` edits,
   which reads those files at runtime regardless.)

3. **Interactive install questions live in the setup skill's live-session
   lane — never a fire-and-forget cold agent.** grove has two agent kinds
   on one axis: *fire-and-forget* (executor, reviewers — cold-started, read
   only artifacts, no human in the loop) and *live/interactive* (the
   `shaper` — "cold-started **as interactive**," a live session with the
   human answering each turn). Setup is executed by the **live session**
   reading `SKILL.md` and asking the user directly — not dispatched to a
   subagent. So every interactive install question (the `scope` question of
   `adr-0013`; the linter-ignore offer of move 2; any future ones) belongs
   there, because a fire-and-forget agent has *no human to ask*. This is
   placement, not limitation — and it means setup can be **as interactive
   as the UX wants**. The authoring/running split: *authoring* the
   `SKILL.md` prose is fire-and-forget-able (a cold executor wrote the last
   skills wave); *running* setup at install time is inherently live.

## Considered and rejected (draft)

- **`paths-ignore` the machinery so install PRs skip the check.** Reopens
  `adr-0013` F3's silent-machinery-edit hole (a PR editing *only*
  `.grove/check/**` would skip its own gate). Rejected — the fix is *how
  the install lands*, not *weakening the trigger*.
- **Ignore only `.grove/check/` in the linter.** Scoped to "what ESLint
  flags today," not the namespace boundary; not future-proof. Rejected in
  favor of the whole `.grove/`.
- **Ship the runtime with a Node-env lint marker instead of ignoring.**
  Belt-and-suspenders at best, and version/flat-config-fragile; does not
  address the "you shouldn't lint a dependency" principle. May ride
  *alongside* the ignore, not instead of it — open for shaping.

## Consequences (draft — to be built after approval)

1. The consumer **workflow template** gains the bootstrap self-detect step
   (`plugins/grove/reference/ci/grove-review-bookkeeping.yml`).
2. The **setup + check-install skills** gain: the direct-commit-is-default
   guidance; the interactive linter-detect-and-offer step (whole `.grove/`);
   an in-context note that grove does not gate its own arrival.
3. The **consumer README** (`reference/ci/README.md`) states both plainly
   (self-guiding principle).
4. The **math-quest pilot** re-runs against all three.

## Open questions / for cross-review

- **Shared-pattern with `/trellis:setup`?** Moves 2 (tooling-invisible
  install) and 3 (interactive-questions placement) are not check-specific —
  they are composition-skill hygiene. Does trellis's setup want the same
  linter-detect-and-ignore for `.trellis/`, and does it already hold the
  interactive-vs-cold placement? (The trellis session's findings feed here.)
- **`.trellis/` + `.grove/` folder consolidation** — the maintainer raised
  whether the two vendored namespaces should live under one hidden root.
  **Parked, explicitly later** (2026-07-17); noted so the ignore rule
  (move 2) can be revisited if the namespace changes.
- **Node-env marker alongside the ignore?** (see rejected #3).
- Whether "grove does not gate its own install" wants to be its own tiny
  charter/companion line or stays a consequence of this decision.

## Self-check

DRAFT — deliberately not self-checked to `gated`. Recorded as the shaping
canvas so a parallel trellis-setup review can cross-read the shared-pattern
findings before this converges. Next: fold trellis findings → shape to
`gated` → decision-adversary → human gate.

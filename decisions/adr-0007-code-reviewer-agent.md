---
id: adr-0007-code-reviewer-agent
type: adr
status: draft
depends_on: [adr-0002-agent-vocabulary, adr-0005-tdd-and-artifact-gated-dispatch]
owner: agent
updated: 2026-07-12
---

> **DRAFT — shaping canvas, not a made decision.** Shaped from the
> maintainer's ask (2026-07-12): add a code-quality reviewer role,
> independent of the `conformance-reviewer`, with no hardcoded tech
> stack. Revised same day after the maintainer resolved the open design
> calls via dispatch-session Q&A; one confirmation (call 1's guardrails
> and severity grammar) remains open before gating. The maintainer
> decides; this draft structures the calls. The `## Decision state`
> section below is the canvas's live index and is removed at gating.
>
> **Research-skip record (stage 1):** Stage-1 research skipped: stable,
> well-documented domain; open questions are grove-internal design, not
> landscape; bounded prior-art check (built-in code-review skill,
> community reviewer agents) folded into shaping.

# ADR-0007: `code-reviewer` — an independent, severity-gated code-quality review, stack-agnostic by placeholder, alongside the conformance gate

## Decision state

**Decided** (maintainer, 2026-07-12 — the ask, then the dispatch-session
Q&A resolving the open calls):

- A new grove role exists: a code-*quality* reviewer, independent of the
  `conformance-reviewer` (the ask).
- It hardcodes **no tech stack**; quality standards come from the
  consuming project's own declared rules (the ask).
- The "agent builder" skill (stack detection + interview + wiring a
  stack-specific reviewer into the consumer project) is **out of scope**
  of this decision — recorded as future direction only (the ask; parked
  below).
- **Call 1, gate mode — resolved in principle (Q&A):** a
  **severity-gated hard gate** — the maintainer's own model, not one of
  the drafted options. Findings at the top severity tiers block; below
  them, advisory. Rationale: "that's how most human code reviews work
  anyway" — blocking vs. non-blocking comments. *Pending maintainer
  confirmation before gating:* the two dispatch-session guardrails
  (objective-harm anchor, loud-not-absolute override) and the proposed
  severity grammar — see *Open design calls*.
- **Call 2, stage label — resolved (Q&A):** share stage 4½ with the
  `conformance-reviewer`; README "one per stage" prose reworded.
- **Call 3, built-in skill — resolved (Q&A):** one available
  instrument, not mandated.
- **Call 4, bundle — resolved by non-objection (Q&A), confirmable at
  gating:** name `code-reviewer`, cold-started stateless, read-only
  (judges and reports, does not fix).

**Open** (the maintainer's — one item):

1. Confirm call 1's refinement: the objective-harm anchor on the
   blocking tiers, the loud-not-absolute human override, and the
   proposed severity grammar (tier names + blocking threshold). See
   *Open design calls*.

**Parked** (deferred with reasons — see *Open questions*): the agent
builder skill; validator per-PR-critique overlap.

## Decision (proposed; call 1's refinements pending confirmation)

1. **Charter a new role, `code-reviewer` — the independent code-quality
   review.** It answers a question no current role owns: **"is this good
   code, regardless of the contract?"** — where the
   `conformance-reviewer` asks "does it match the contract?". Keeping
   the two separate keeps both charters sharp: conformance judges
   against the approved upstream and explicitly not against taste;
   quality judges the code itself and explicitly not the contract.

2. **Stack-agnostic via the existing placeholder door** (charters
   never hardcode a project-specific value — `charters/README.md`).
   The role judges against the consuming project's own declared sources
   of truth, in priority order: the project's conventions doc /
   CLAUDE.md (placeholder: `<CONVENTIONS_PATH>`), its lint/formatter
   configuration and command (`<LINT_CMD>`), an optional project
   quality rubric (`<QUALITY_RUBRIC_PATH>`), and the idioms of the
   surrounding code. Where a project declares nothing, the role falls
   back to language-agnostic fundamentals — duplication, dead code,
   misleading names, error-handling gaps, complexity without cause,
   test quality — and **flags the absence of declared conventions as a
   finding** rather than inventing taste.

3. **A severity-gated hard gate, pre-merge** (maintainer's model,
   2026-07-12): every finding is graded by severity; findings at the
   top tiers **block** the gate, everything below is advisory —
   blocking vs. non-blocking comments, the shape of most human code
   review. Two refinements from the dispatch session are folded in as
   part of the proposed decision, **clearly marked as the dispatch
   session's refinement, subject to the maintainer's confirmation
   before gating**:

   - **Objective-harm anchor for the blocking tiers.** Only findings
     with demonstrable harm can be graded into a blocking tier —
     correctness defects, security exposure, data-loss/resource-leak
     risk, broken error handling, misleading behavior. Taste-class
     findings (naming, style, structure, idiom) are capped at the
     advisory tiers **by construction**, regardless of how strongly the
     reviewer feels. This preserves the draft's original principle —
     taste never blocks a merge — while giving the gate real teeth on
     defects.
   - **Loud, not absolute.** A block is overridable by the human with
     an explicitly recorded rationale (grove's human-decides model
     holds): the gate forces the conversation, it does not remove the
     human's authority.

   **Proposed severity grammar** (tier names, blocking threshold, and
   anchor fixed here; tier *definitions* belong in the charter, at
   execution): finding tiers **`severe / high / medium / low`**,
   **blocking ≥ `high`**, with `severe` and `high` reachable only
   through the objective-harm anchor above. Overall verdict grammar,
   matching grove's constrained-verdict style (cf. `spec-adversary`'s
   `APPROVE-READY / NEEDS-REVISION / UNSOUND`):
   **`BLOCK / PASS-WITH-ADVISORIES / CLEAN`** — `BLOCK` iff any finding
   is ≥ `high`; the grammar leaves no room for a vague middle verdict.

4. **Runs alongside the `conformance-reviewer` at stage 4½** (resolved,
   call 2): same input (the finished build), independent questions, can
   run in parallel; findings feed the same dispatcher findings ledger.

5. **Cold-started, stateless, read-only** (resolved by non-objection,
   call 4): all context travels through the change under review plus
   the project's declared quality sources; it judges and reports, it
   does not fix — like the `conformance-reviewer`, a gate can be
   read-only.

6. **The charter charters the *frame*, not the technique.** Claude Code
   ships a built-in `/code-review` skill (diff review for correctness
   bugs and reuse/simplification/efficiency cleanups, severity-graded
   findings). Grove's charter therefore does not re-describe how to
   review code; it charters what the runtime does not provide — the
   **independence** (never the builder), the **sequencing** (pre-merge,
   alongside conformance), the **standards source** (the project's
   declared rules, per item 2), and the **gate-and-reporting contract**
   (the severity grammar of item 3: which tiers block, the
   objective-harm anchor, the recorded-override path, findings into the
   ledger). The built-in skill is one available instrument (resolved,
   call 3), not a mandate.

## Context

**The gap: code quality currently has no home.** Verified against the
charters this sitting, not assumed:

- `conformance-reviewer` explicitly excludes quality: *"Judge against
  the approved upstream, not your taste"*
  (`charters/conformance-reviewer.md` §Boundaries); its agent
  definition is blunter still — *"You are not here to improve the code
  or to relitigate the spec"* (`.claude/agents/conformance-reviewer.md`).
  A change can be sloppy yet fully conform, and today that passes the
  only pre-merge gate.
- `validator`'s per-PR critique is **post-merge** and lightweight by
  charter: *"A lightweight pass on every merged change … advisory, not
  a gate (mostly automatic)"* (`charters/validator.md` §Method 1). A
  glance after the fact, not a review before it.
- `executor`'s refactor step (red → green → **refactor**,
  `charters/executor.md` §Method 2) is the builder grading its own
  work — exactly the pattern the conformance gate exists to break
  (*"Hand off to the conformance-reviewer — you do not grade your own
  work"*, §Method 5), except nobody independent receives the *quality*
  half of that handoff.

**The boundary that keeps both charters sharp.** Conformance-reviewer:
"does it match the contract?" Code-reviewer: "is it good code,
regardless of the contract?" Two independent questions about the same
build — which is also why they can run in parallel (Decision 4).

**Prior art (bounded check, folded into shaping — see the research-skip
record above).** The built-in `/code-review` and `/security-review`
skills mean part of "how to review code" is a runtime capability, not
something a charter needs to author. This reframes the role: grove
charters the independence, sequencing, standards-source, and
gate-and-reporting contract *around* a capability the runtime partially
provides (Decision 6).

**Naming.** `code-reviewer` follows adr-0002's principle — every role
named for what it does — and collides with nothing: the existing
reviewer roles are `conformance-reviewer` (contract gate) and
`corpus-reviewer` (artifact-record audit). Proximity to the built-in
`/code-review` skill name is a feature, not a collision: the role wraps
that territory deliberately.

**Stage label (resolved, call 2, for the record).** The stage number
encodes pipeline *position* (after the build, before merge), not
uniqueness; two independent questions about the same build share 4½
honestly, where a new 4¾ label would falsely imply sequencing.
Precedent for a half-stage exists (`spec-adversary` at 3½); two roles
at one number is new but says exactly what happens — they run in
parallel. Cost accepted: README's "one per stage" sentence is reworded
(it changes anyway — the count moves to twelve).

## Open design calls (live — one confirmation pending; removed at gating)

### Confirm call 1's refinement (maintainer)

The severity-gated hard gate itself is the maintainer's resolved model.
Still to confirm before this draft gates:

1. **The objective-harm anchor** — blocking tiers reachable only by
   demonstrable harm (correctness, security, data-loss/resource-leak,
   broken error handling, misleading behavior); taste-class findings
   capped at advisory by construction. (Dispatch-session refinement.)
2. **Loud, not absolute** — a block is human-overridable with an
   explicitly recorded rationale. (Dispatch-session refinement.)
3. **The proposed severity grammar** — finding tiers
   `severe / high / medium / low`, blocking ≥ `high`; overall verdict
   `BLOCK / PASS-WITH-ADVISORIES / CLEAN`. Tier names and threshold fix
   here; tier definitions land in the charter at execution.

Calls 2–4 are resolved and folded into the Decision above; their option
blocks are retired to *Considered and rejected* per this canvas's own
convention.

## Considered and rejected

- **Extend `validator`'s per-PR critique instead of adding a role** —
  rejected (leaned against in shaping; recorded honestly): `validator`
  is post-merge and reactive by charter — its critique runs on *merged*
  changes and its audits fire on named triggers, never as a standing
  pre-merge review. Stretching it pre-merge muddies a clean role to
  avoid adding an honest one.
- **Fold quality into the `conformance-reviewer`** — rejected: its
  sharpest boundary is *"judge against the approved upstream, not your
  taste"*; adding taste to its remit blunts the gate that boundary
  keeps trustworthy, and entangles a gating verdict with an advisory
  one.
- **A stack-specific quality rubric shipped in the charter** — rejected
  by the maintainer's constraint (no hardcoded stack) and by the
  charter contract itself (`charters/README.md`: written to be
  cold-started in *any* consuming project). The stack-specific path is
  the parked agent-builder direction, not this charter.
- **Pure advisory mode (this draft's original recommendation for
  call 1)** — rejected by the maintainer (2026-07-12) in favor of
  stronger teeth: report-only findings the human weighs at merge. The
  original anti-gate rationale — taste should never block a merge, and
  judgment-based verdicts invite rubber-stamping or gridlock when made
  blocking — is honestly recorded, and is addressed rather than
  overridden by the chosen model: the objective-harm anchor keeps
  taste-class findings structurally incapable of blocking, so what
  blocks is demonstrable harm, not judgment calls.
- **The middle dial (advisory + acknowledge-to-merge on top-tier
  findings)** — rejected with the above: the maintainer chose a real
  gate over an acknowledgment ritual; the loud-not-absolute override
  (recorded rationale) provides the human-authority escape hatch the
  middle dial was reaching for, with more teeth.
- **A new stage label (4¾ or similar) instead of sharing 4½** —
  rejected (call 2): preserves one-role-per-stage but falsely implies
  the quality review runs *after* conformance, which the design does
  not require.
- **Mandating/wrapping the built-in `/code-review` skill** — rejected
  (call 3): couples a portable charter to one runtime's feature set,
  and the skill does not know the project's declared conventions —
  the standards-source contract is needed on top either way.
  **Ignoring it** — also rejected: forgoes a real capability and
  invites the charter to re-describe generic code review.

## Consequences (on approval; execution is a follow-up, not this PR)

- **`charters/code-reviewer.md`** is authored (plus its
  `.claude/agents/` and `plugins/grove/reference/agents/` copies), with
  the placeholders from Decision 2 and the tier definitions from
  Decision 3 — a separate execution step after this decision is
  approved, not part of this decision's own merge.
- **`README.md` team table** gains a row —
  `code-reviewer | 4½ | code-quality gate vs. the project's own declared standards; severity-graded, blocking ≥ high (objective harm only), rest advisory; read-only | yes`
  — and the team prose updates: **eleven roles becomes twelve**, and
  "one per stage" is reworded per call 2.
- **`dispatcher` charter W1** adds the role alongside the conformance
  gate with gate semantics ("`executor` → conformance gate ∥
  code-review gate → HUMAN merge"): a `BLOCK` verdict returns the
  change to the `executor` like a conformance `FAIL`; advisory findings
  ride to the human merge in the findings ledger; a human override of a
  `BLOCK` is recorded with its rationale, never silent.
- **`plugins/grove` setup skill** offers the new role in its composing
  interview and resolves its placeholders (default install count moves
  to twelve).
- **`executor`'s charter is unchanged**: refactor stays in its TDD
  loop; what changes is that the quality of the result now gets an
  independent pre-merge gate.
- No existing decision is superseded; this adds a role, it overturns
  nothing.

## Acceptance criteria (for the execution wave this decision authorizes)

- **AC1** `charters/code-reviewer.md` exists (+ both copies), stating:
  the quality-vs-contract boundary one-liner; the standards-source
  priority order with placeholders `<CONVENTIONS_PATH>`, `<LINT_CMD>`,
  `<QUALITY_RUBRIC_PATH>` (optional); the no-declared-conventions
  fallback with absence-as-finding; the read-only boundary; and cites
  `adr-0007`.
- **AC2** The charter carries the gate contract in full: the severity
  grammar (`severe / high / medium / low`, tier definitions authored
  there), the blocking threshold (≥ `high`), the objective-harm anchor
  (taste-class findings capped at advisory by construction), the
  overall verdict grammar (`BLOCK / PASS-WITH-ADVISORIES / CLEAN`), and
  the human-override path (recorded rationale, never silent).
- **AC3** The charter contains no tech-stack-specific noun (language,
  framework, linter brand) outside placeholder examples — checkable by
  grep, same discipline as the lift's acceptance grep.
- **AC4** `README.md` team table carries the twelfth row and the team
  prose count/one-per-stage wording is updated.
- **AC5** `dispatcher.md` W1 names the role at the conformance-gate
  position with the gate semantics above (BLOCK → back to `executor`;
  advisories → ledger → human merge; override recorded); the
  findings-ledger contract covers its findings.
- **AC6** The plugin setup skill offers the role and resolves its
  placeholders honestly ("none exists yet" allowed, per the standing
  interview contract).
- **AC7** The agent-builder skill appears nowhere in the executed
  charter — out-of-scope boundary held, not silently expanded.

## Open questions (parked, ≤3)

- **The "agent builder" skill** — detect a consuming project's stack,
  interview the user, and wire up a stack-*specific* reviewer in the
  consumer project. Explicitly out of scope of this decision by the
  maintainer's own framing; recorded here as the future direction the
  stack-agnostic placeholder design deliberately leaves the door open
  for. Needs its own shaping (it is a plugin/skill feature, not a
  charter).
- **`validator` per-PR-critique overlap.** Once a pre-merge quality
  gate exists, does `validator`'s post-merge "lightweight pass on
  every merged change" shrink or retire? Leaning: leave it — it is
  nearly free and post-merge remains a distinct vantage — but not
  decided here; revisit on evidence of redundant findings.

## Self-check (gate)

Not yet run — `status: draft`; this section completes at gating, after
the maintainer confirms call 1's refinements (the objective-harm
anchor, the recorded-override path, and the severity grammar).
Verification done so far, directly against source rather than from the
shaping brief: `conformance-reviewer`'s taste-exclusion quoted from its
charter §Boundaries and its agent definition (the "not here to improve
the code" line lives in `.claude/agents/conformance-reviewer.md`, not
the canonical charter — cited accordingly); `validator`'s post-merge
"mostly automatic" critique quoted from its charter §Method 1;
`executor`'s self-graded refactor step and its "do not grade your own
work" handoff quoted from its charter §Method; the `code-reviewer` name
collision-checked against the role list and repo-wide grep; README's
"eleven roles" / "one per stage" prose read directly before claiming it
needs the twelve-roles reword. Round-2 revision (2026-07-12, this
sitting) folded the maintainer's Q&A resolutions in place — legal for a
live draft canvas (append-only binds *ratified* decisions), with the
who/when recorded in `## Decision state`.

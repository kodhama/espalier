---
id: adr-0005-tdd-and-artifact-gated-dispatch
type: adr
status: approved  # 2026-07-11, direct maintainer approval (intent act) — see Self-check
depends_on: [adr-0004-spec-lifecycle-and-organization]
owner: agent
updated: 2026-07-11
---

# ADR-0005: executor works strict TDD; executor dispatch is artifact-gated; conformance-reviewer catches conversation-built changes

> Provenance: two decisions the maintainer chose directly (2026-07-11),
> recorded here and executed into the charters in the same PR — this is
> recording + implementing, not shaping. Decision 1 is the remaining half
> of grove#21 (its GWT/EARS-for-specs half already landed via `adr-0004`
> into `contract-author`'s charter — verified still present, not redone
> here). Decisions 2–3 are options 1 + 3 of the three grove#20 offered
> (option 2 parked below, not silently dropped). `adr-0004` is the direct
> sibling: it made specs GWT/EARS-structured and revise-in-place; this ADR
> completes the pair on the executor / dispatch / review side.

## Decision

1. **`executor` works strict TDD — red → green → refactor, in that
   order.** Given a spec's GWT/EARS acceptance criteria (`adr-0004`
   item 3), the sequence is: the test(s) that encode those criteria
   **exist and are observed failing (red)** → implementation makes them
   **pass (green)** → **refactor** on the green bar. Authoring tests and
   implementation together in one motion — which is roughly what happens
   today even under a "test-first" framing — is **not** TDD: a test that
   has never been observed failing is not yet a trustworthy test, and the
   failing-first observation is the step that makes it one. This tightens
   `executor`'s existing "test-first" wording, exactly the tightening
   grove#21 asked for.

   **On decision-only upstreams (clarification, 2026-07-11).** The red
   tests derive from the spec's GWT/EARS criteria — so strict TDD
   presupposes a spec. Decision 2's gate accepts a `gated`/`approved`
   spec *or decision*; where the upstream is a **decision that bears code
   to implement**, that is itself the signal a spec is owed first (exactly
   grove#20's spec-first discipline — code built straight off a decision,
   with no spec, is the gap). `executor` working from a *decision-only*
   upstream is therefore for **non-code** changes (a doc edit, a config
   change, an artifact annotation), where there are no GWT/EARS criteria
   and no red tests to derive. Code-bearing work derives its tests from a
   spec. This keeps decisions 1 and 2 coherent.

2. **`executor` dispatch is artifact-gated (grove#20, option 1).**
   `executor` **refuses to run without a `gated`/`approved` spec or
   decision to read** — a conversational prose brief synthesized from the
   session is **not** a substitute for the artifact. The `dispatcher`
   correspondingly **must not dispatch `executor`** without such an
   artifact for it to read. This makes **explicit and enforced** what
   `executor`'s charter already only *implied* — "reads only the artifact
   and its `depends_on` graph, never conversation history." A latent
   property is what grove#20 shows gets bypassed under load (`executor`
   was dispatched seven times straight from a decision + issue with a
   conversation-synthesized brief and no artifact to point at); turning it
   into an enforced refusal at the dispatch point is the "structural, not
   a one-off reminder" fix the issue asked for.

3. **`conformance-reviewer` catches conversation-built changes (grove#20,
   option 3).** "**Was this built against a reviewable contract, or
   against a conversation?**" is itself a conformance question.
   `conformance-reviewer` actively flags any change whose upstream is a
   conversation / prose brief rather than a `gated`/`approved` spec or
   decision. A change with **no reviewable upstream** is a `FAIL`, not a
   pass-by-default. This is the second, independent catch for the same
   failure mode decision 2 gates at dispatch: even if a conversation-built
   change slips past dispatch, the independent gate surfaces it before
   merge.

## Context

**The incident (grove#20).** Across the kodhama-0007 wave
(trellis#117–#120, grove#16, trellis#124 twice), the dispatching session
went straight from an approved decision + a GitHub issue to `executor`
dispatch seven times, with zero use of `contract-author` or
`spec-adversary`, feeding `executor` a prose brief synthesized fresh from
conversation each time. The concrete cost: trellis#124 was implemented
twice — the first attempt (PR#128, closed unmerged) was a faithful,
well-tested, gate-passing implementation of the **wrong design**, caught
only when the human read the finished code, at the cost of a full
build-test-gate cycle. A written spec plus an independent pass before any
code existed would have had a real shot at catching it for the cost of
reading a page.

**The companion ask (grove#21).** Specs should be written in a form that
is replayable and mechanically test-derivable, and `executor` should work
strict TDD off them — "tests-exist-and-fail (red) → implementation makes
them pass (green) → refactor," not authoring tests and implementation
together as one motion. The spec-format half of grove#21 (require GWT +
EARS acceptance criteria) already landed in `adr-0004` (item 3) and is
already executed into `contract-author`'s charter — **verified present**
(`charters/contract-author.md` Method step 2: "Write the acceptance
criteria in both grammars, per `adr-0004`: scenarios as Given/When/Then
(GWT), invariants/requirements as EARS 'shall' statements"). This ADR does
not re-decide that; it records the **remaining** half (strict TDD on the
executor side) and pairs it with the dispatch/review gates.

**Why this pairs cleanly.** `adr-0004` made the *contract* replayable
(GWT/EARS specs, revise-in-place). Replayability is only real if the
downstream actually consumes the contract rather than a conversation —
which is precisely what broke in grove#20. Decision 1 makes `executor`
derive failing tests from the GWT/EARS criteria; decisions 2–3 make the
system refuse (at dispatch) and catch (at review) the case where there is
no contract to derive from. The gated/approved lifecycle these gates key
on is grove's already-declared enum (`decisions/README.md`,
`specs/README.md`: `draft | gated | approved | superseded`); no new
vocabulary is introduced.

## Considered and rejected

- **Leave `executor`'s existing "never from conversation memory alone"
  phrasing latent, without an enforced gate** — rejected. grove#20 is the
  evidence that a latent property gets bypassed under load (seven times in
  one wave). The property has to be enforced at a point where it fires
  (dispatch refusal) and caught where it's checked (the conformance gate),
  not merely stated in prose the dispatcher can route around.
- **A one-off reminder / process note instead of a charter change** —
  rejected on grove#20's own terms: reminders don't survive context
  compaction or a new session; only a charter (grove's executable "code")
  is structural.
- **Keep "test-first" as currently written** (tests + implementation in
  one motion) — rejected as insufficient; that is exactly what already
  happens and exactly what grove#21 asked to tighten. The distinguishing
  requirement is the *observed red* before implementation.
- **grove#20 option 2 (an explicit size/stakes threshold)** and
  **grove#21's auto-derive-test-skeletons tooling** — not rejected on the
  merits, deliberately **deferred**; see Open questions. Adopting either
  now would be process/tooling ahead of need (option 2 sets a threshold
  before we have felt where it bites; the skeleton tooling changes the
  contract-author → executor handoff shape and likely needs its own
  decision).

## Consequences

Recording and execution are folded into this one PR, and — as with
`adr-0004` — the maintainer's approval is a **direct intent act**
(2026-07-11), so the `status: approved` flip is recorded **here, in the
PR**, not deferred to a post-merge bump. This departs from grove's
standing written mechanic (`decisions/README.md`: "`approved` — never set
by hand"), pending `trellis#142`; flagged as authorized, not drift —
`floor-intent-gate` holds (a human performed the act). See Self-check.

**Done in this PR (grove-side execution):**

- **`charters/executor.md`** (+ its `.claude/agents/executor.md` installed
  copy and `plugins/grove/reference/agents/executor.md` vendored copy) —
  the strict-TDD requirement (decision 1) and the artifact-gate refusal
  (decision 2), citing this ADR.
- **`charters/conformance-reviewer.md`** (+ both copies) — the
  built-against-a-conversation-vs.-a-reviewable-contract check
  (decision 3), citing this ADR.
- **`charters/dispatcher.md`** (+ both copies) — must not dispatch
  `executor` without a `gated`/`approved` artifact (decision 2's
  dispatch side), citing this ADR.
- **`charters/contract-author.md`** — **no change**: its GWT + EARS
  requirement (grove#21's other half) is already present from `adr-0004`,
  verified above.
- **Charter-copy sync** observed throughout: every canonical change
  propagated to its `.claude/agents/` and `plugins/grove/reference/agents/`
  copies, modulo the pre-existing framing/header and
  placeholder-resolution differences between canonical and the copies.

**Not touched (flagged, not silent):** `README.md`'s team-table summary
("executor | test-first implementation from artifacts only") and
`charters/run-resumer.md`'s passing "test-first" discipline pointer both
remain accurate under strict TDD (which is a form of test-first) and are
outside this decision's scoped charter edits; left unchanged rather than
swept.

## Acceptance criteria

- [x] `executor`'s charter (all three copies) states strict TDD as
      red → green → refactor with tests **observed failing first**, calls
      out that tests + implementation in one motion is not TDD, and cites
      `adr-0005`.
- [x] `executor`'s charter (all three copies) states it **refuses to run**
      without a `gated`/`approved` spec or decision to read — a
      conversational brief is not a substitute — and cites `adr-0005`.
- [x] `dispatcher`'s charter (canonical + both copies) states it must
      **not dispatch `executor`** without a `gated`/`approved` artifact
      for it to read, and cites `adr-0005`.
- [x] `conformance-reviewer`'s charter (all three copies) carries the
      "built against a conversation vs. a reviewable contract" check as an
      active adversarial hunt, and cites `adr-0005`.
- [x] `contract-author`'s charter already requires GWT + EARS (from
      `adr-0004`) — confirmed present, unchanged by this ADR.
- [x] This decision cites grove#20 and grove#21; the PR closes both on
      merge.

## Open questions (parked, ≤3)

- **grove#20 option 2 — an explicit size/stakes threshold.** Not every
  one-line fix needs a full spec cycle; nothing here fixes *when* a
  decision + issue is settled enough to build against directly versus when
  `contract-author` (a full `gated`/`approved` spec) is required first.
  This ADR's gate requires only that **some** reviewable
  `gated`/`approved` artifact exist — *which kind* (decision vs. spec) by
  change size stays an ad-hoc, per-dispatch judgment for now.
  Deliberately deferred, not adopted.
- **grove#21's auto-derive-test-skeletons tooling / a possible new
  stage.** Since GWT/EARS scenarios are mechanically close to test cases,
  tooling (or a stage between `contract-author` and `executor`) could
  derive failing test skeletons directly from the spec, so `executor`
  receives red tests as an input rather than writing them. Deferred: it
  changes the contract-author → executor handoff shape and likely needs
  its own decision.

## Self-check (gate)

- **Frontmatter**: `id`/`type`/`status`/`depends_on`/`owner`/`updated`
  present, well-typed. PASS.
- **`depends_on` resolution**: `adr-0004-spec-lifecycle-and-organization`
  resolves in this repo and is `status: approved` (merged via PR#33,
  2026-07-11) — not `draft`. PASS. No cross-repo (`trellis/…`) dependency
  is claimed: this is an intra-grove process decision building on the
  sibling ADR; the gated/approved lifecycle it keys on is grove's own
  declared enum (`decisions/README.md`), and `adr-0004` already anchors
  the family lifecycle transitively.
- **Directional flow**: this artifact is `gated`; its one dependency
  (`adr-0004`) is `approved`, not draft — a `gated` artifact consuming an
  `approved` one is legal. PASS.
- **Approval mechanic (flagged, not a silent pass)**: `approved` set
  in-PR by the maintainer's direct intent act (2026-07-11), the same
  authorized pattern as `adr-0004` — ahead of the current written
  mechanic (`decisions/README.md`, "never set by hand"), pending
  `trellis#142`. Not agent self-approval (`floor-intent-gate` holds — the
  maintainer performed the act). Documented here and in Consequences as
  authorized, not drift. PASS.
- **Required body sections**: Decision, Context, Considered and rejected,
  Consequences, Acceptance criteria, Open questions, Self-check — present,
  matching sibling ADRs (`adr-0002`, `adr-0003`, `adr-0004`). PASS.
- **Open questions count**: 2, within this repo's ≤3 convention. PASS.
- **Append-only discipline**: new artifact; nothing edited in place. No
  ratified decision is superseded (this *completes* grove#21's other half
  and *adds* grove#20's gates; it does not overturn `adr-0004`). N/A —
  no violation possible.
- **Verified, not assumed**: `contract-author`'s GWT/EARS requirement was
  read directly (`charters/contract-author.md` Method step 2 and both its
  copies) before claiming grove#21's contract-author half needs no rework;
  grove#20 and grove#21 were read in full for their option/ask wording.

**Overall: internally sound, consumable, and `approved`** by the
maintainer's direct intent act (2026-07-11). Merging closes
grove#20 / grove#21.

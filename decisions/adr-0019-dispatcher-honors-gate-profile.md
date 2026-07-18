---
id: adr-0019-dispatcher-honors-gate-profile
type: adr
status: draft
depends_on: [adr-0018-gate-profile-and-trigger-split]
informed_by: [adr-0012-methodology-delivery-machinery, adr-0005-tdd-and-artifact-gated-dispatch]
owner: agent
updated: 2026-07-18
---

# ADR-0019: the run-sequencer honors the gate-profile at run time

> **`draft` — shaping in progress.** This canvas activates `adr-0018` at
> run time: `adr-0018` built the gate-profile machinery (`gates.toml`, the
> floor validator, the `guardian` fallback, `resolveProfile` + the
> `resolve-profile` CLI) but **nothing reads it when sequencing a run** — a
> repo-wide grep finds no consumer of `resolve-profile` outside `gates/`,
> `setup`, and `set-profile`. So the gate-profile is today **configuration
> without enforcement**: a consumer can pick `initiator`, but the swarm
> still runs as if gate ownership were hardcoded, because the dispatcher
> never consults the profile. This decision frames **how the run stops
> assuming hardcoded ownership and starts reading it**. Read
> `## Decision state` first — it is the live state of the decision in one
> place.
>
> **The crux (Q1) is Decided — D1: dispatcher-central.** The dispatcher is
> the single component that reads the profile and enforces pause-vs-proceed
> at each gate. The remaining Open items are the *how* (granularity,
> gate→stage mapping, deterministic realization, fallback timing, D11). Every
> other entry is either an inherited **Given** (from `adr-0018`, cited, not
> reopened) or an **Open** question.

## Decision state

### Decided
- **D1 — dispatcher-central: the run-sequencer is the single reader and
  enforcer of the gate-profile** *(maintainer, 2026-07-18)*. Resolves the
  Q1 crux (Option A over B/C — see `## Rejected options`).
  - **The dispatcher is the single component that reads
    `.grove/gates.toml`** (via `resolve-profile`) **and enforces
    pause-vs-proceed at each handover.** At each gate it resolves the
    owner and routes accordingly:
    - **`C2 = human`** → route to the **human** for that gate's approval
      (merge / in-session, per D11's self-authenticating channels).
    - **`C2 = agent`** → route to that gate's **agent gate-keeper** (e.g.
      `decision-adversary` at `intent`, `conformance-reviewer` at
      `build`). **"Proceed on agent authority" means route-to-agent-
      ratifier, NOT skip the check** — the gate still fires; only *who
      ratifies* changes from human to the independent agent.
  - **Stage charters shed their ownership assertions.** The
    `shaper`/`contract-author`/`executor` charters stop *asserting* who
    owns their gate (e.g. `shaper.md`'s "the merge is the approval; the
    intent gate never opens to agents"); the dispatcher becomes the single
    authority, **reading** ownership from the profile rather than each
    stage hardcoding it. *(Post-approval executor edit — see
    `## Consequences / propagation`.)*
  - **This discharges `adr-0018`'s D2 "merge is the approval" wording
    flag** *(resolves Q8)*. The stage charters shift from *asserting*
    ownership to the dispatcher *reading* it, so the merge-only phrasing
    the D2 flag worried about is removed at its source — not left as a
    later clarifying touch.
  - **Rationale for A over B (single reader, not N):** the safety-critical
    floor logic (floor validation + `guardian` fallback, `adr-0018` D8)
    **lives once, in the dispatcher's read path**, so it cannot **drift**
    across N stage charters each re-implementing it. The `adr-0012` "gates
    emerge from agent boundaries" counter-argument does not apply: it is
    about where gates *emerge*, not where they are *enforced* —
    **enforcement stays central** even though the gate structure is still
    emergent (the profile configures that structure, it does not replace
    it).
  - **What D1 settles about agent-owned gate semantics (folds former Q5).**
    The general shape is now decided: `C2 = agent` routes to the agent
    gate-keeper (not a skip). For the `initiator` front `intent` gate
    specifically, that gate-keeper is the `decision-adversary`
    (soundness-ratify) with the human intent-ratification relocated to
    `ship` (`adr-0018` D3, Given). The remaining *"how, deterministically,
    in a charter-driven v0"* question survives as **Q4**.

### Open
- **Q2 — read granularity.** Resolve the profile **once per run at the
  start**, or **re-resolve at each gate/handover**? Trade-off: a mid-run
  hand-edit of `gates.toml` (or a mid-run breakage triggering the D8
  guardian fallback) is only honored if re-resolved per gate; once-per-run
  is cheaper and gives a run a stable profile it cannot have shift under
  it.
- **Q3 — gate→stage mapping.** grove's four gates
  (`intent`/`spec`/`build`/`ship`) map to which concrete dispatch decision
  points? The working reading: **intent** = the shaping-decision
  ratification (`shaper` → human intent gate on the decision); **spec** =
  spec approval (`contract-author` → spec gate); **build** = conformance
  (`executor` → conformance gate); **ship** = PR merge. Confirm/correct
  the mapping and name which stage consults which gate's owner.
- **Q4 — what "enforce" IS for a charter-driven dispatcher (v0 = the
  interactive session).** The dispatcher is "cold-started: the interactive
  session (v0)" (`charters/dispatcher.md`) — it follows a charter, it is
  not a runner-hosted process. So enforcement is **charter instructions
  that tell the dispatching agent to call `resolve-profile` and
  pause/proceed accordingly**, not a code hook. How does an
  agent-following-a-charter realize per-gate pause/proceed
  **deterministically** (so it cannot "remember" the profile said proceed
  and skip a human gate — the same failure the "a review the dispatcher
  remembers ran does not count" boundary guards against)? *(Also carries
  the residual "what does the dispatcher do differently, step by step, at a
  `C2=agent` vs `C2=human` gate" from former Q5 — D1 settled the general
  shape, Q4 is the deterministic realization.)*
- **Q6 — guardian fallback at run time.** When/how does the dispatcher
  detect a **missing/unreadable/floor-violating** profile mid-sequencing
  and surface the loud D8 warning + run under `guardian`? The CLI already
  emits the warning to stderr and exits `2` on any fallback
  (`resolve-profile.mjs`) — the open part is *when the dispatcher checks
  the exit code* and *how the warning reaches the maintainer* in the
  interactive session.
- **Q7 — D11 at run time.** `adr-0018` D11 (honor only self-authenticating
  approval channels — in-session/merge, **not** a bare tracker comment)
  was left as prose. Is #77 where the dispatcher **operationalizes** D11
  at human gates (checks the channel is self-authenticating before
  counting the gate satisfied), or does that stay **separate** (candidate
  grove#74)?

### Parked
- **Implementation.** This is a decision; the `executor` pass (charter
  edits + any wiring) comes **after** approval. This canvas records the
  decision, not the code.
- **`adr-0018` P1 — in-domain `autonomous` (standing pre-ratification):**
  all gates agent-owned including `ship`, floor satisfied by a same-domain
  recorded standing intent. Keeps its own home (`adr-0018` Parked); #77
  enforces the **shipped** presets only.
- **`adr-0018` P2 — cross-domain external-intent (the grove#36 seal).**
  The reserved `[intent_external]` slot; parked to grove#36. Not enforced
  here.

## Given (inherited from adr-0018 — cited, not reopened)

Carried from `adr-0018` (`approved`, 2026-07-18) and the trellis floor.
If the maintainer's inclination contradicts one of these, the shaper flags
it once with the citation, then defers.

- **The machinery exists and is validated *when set*.** `gates.toml` (four
  explicit C2 rows, D7), the floor validator (`intent = human` OR
  `ship = human`, F1), the `guardian` fallback + loud warning (D8), and
  `resolveProfile` + the `resolve-profile` CLI are **built and tested**
  (`plugins/grove/gates/`). What is missing is a **run-sequencing
  consumer** — this decision supplies the wiring intent, not new
  machinery.
- **The floor** (`floor-intent-gate`): ≥1 human-owned intent-locus gate
  (`intent` front **or** `ship`). Non-configurable to off. The dispatcher's
  enforcement must never let a run proceed past a human-owned intent-locus
  gate without a human act.
- **The three shipped presets** (D3): `guardian`
  `{human, human, agent, human}`, `steward` (default)
  `{human, agent, agent, human}`, `initiator` `{agent, agent, agent, human}`.
  #77 enforces exactly these; the parked P1/P2 cases are out of scope.
- **`intent = agent` semantics** (D3 F1 clarification): autonomous draft +
  agent soundness-ratification + human ratification relocated to `ship`;
  a genuinely **blocking ambiguity may still escalate** to the human
  (`inv-clarify-before-commit`) — an exception, not routine Q&A.
- **`human` sets who is *required*, not who is *allowed*** (D2). A human
  may always weigh in at an agent-owned gate; the profile sets the
  *required* owner. The dispatcher must not *forbid* a human at an
  agent-owned gate — only stop *requiring* one.
- **v0 honors only self-authenticating channels** (D11): in-session
  approval and merge; a bare tracker comment is not honored. (Whether #77
  operationalizes this is Q7.)
- **The profile configures, does not replace, the emergent gate
  structure** (`adr-0012` E5): owed-review rules and the quality gates
  still run; the profile tunes *who owns* a gate, never deletes the seam.

## The crux (Q1) — who reads the profile — DECIDED (D1: Option A)

grove's stage charters currently **hardcode** gate ownership. `adr-0018`
made ownership **configurable per profile**. The core design fork was
*which component reads it*; the maintainer chose **Option A —
dispatcher-central** (see D1). Only the dispatcher (the run-sequencer)
reads `gates.toml` via `resolve-profile` and enforces pause-vs-proceed at
each gate; a `C2=agent` gate routes to that gate's agent gate-keeper (not
a skip); stage charters shed their ownership assertions. The chosen
rationale: the safety-critical floor logic (validation + `guardian`
fallback) lives **once** in the dispatcher's read path, so it cannot drift
across N readers. Options B and C are retired in `## Rejected options`.

## Rejected options

- **Option B — stage-distributed (each charter profile-aware).** Each
  stage charter consults `resolve-profile` for its own gate and
  self-gates. **Rejected (D1, maintainer 2026-07-18):** it puts the
  safety-critical floor + `guardian`-fallback logic in **N stage charters**
  where it can **drift**, and splits the one sequencing responsibility the
  dispatcher already holds across many roles. The `adr-0012` "gates emerge
  from agent boundaries" argument for B does not apply — that is about
  where gates *emerge*, not where they are *enforced*; enforcement stays
  central.
- **Option C — hybrid (dispatcher resolves, passes owner down).** Single
  reader, but the dispatcher hands each stage its gate's resolved owner.
  **Rejected (D1, maintainer 2026-07-18):** it still spreads the *act* of
  gating into every stage and adds a hand-off contract (what exactly the
  dispatcher passes, how a stage proves it acted on it) that A avoids by
  keeping both the read **and** the pause/proceed act in one place.

## Consequences / propagation (draft — POST-approval executor work, NOT part of this canvas)

Flagged now so no dependent is silently missed (`inv-graph-maintenance`);
the actual edits are a post-approval `executor` pass. Under **D1
(dispatcher-central)** the set is now firm:

- **`charters/dispatcher.md`** — the **primary edit**: gains the run-time
  profile-read (`resolve-profile`) + per-gate pause/proceed sequencing (the
  D1 routing table), and its Boundaries line "the intent gate (decisions,
  specs) never fully opens to agents" is rewritten to *read* ownership from
  the profile rather than assert it. It is `gated` and ships to consumers
  who vendor it — so the enforcement, once expressed there, is what makes
  `adr-0018` pay off for adopters.
- **Stage charters shed their ownership assertions** — `charters/shaper.md`
  ("the merge is the approval; the intent gate never opens to agents"), and
  any equivalent assertion in `contract-author`/`executor`. They shift from
  *asserting* ownership to deferring to the dispatcher's profile-read. **This
  discharges `adr-0018`'s D2 "merge is the approval" wording flag** (D1 /
  former Q8) — the source of the merge-only phrasing is removed, not
  patched around.
- **Any run-sequencing skill/entry** that should now call
  `resolve-profile` (the setup skill already documents the intended path
  `node .grove/internal/gates/bin/resolve-profile.mjs`, lines 68-70 — but
  nothing at run time calls it).
- **Append-only discipline.** Where the executor pass touches ratified
  text of `adr-0018` or a `gated` charter (e.g. the D2 wording discharge),
  it follows `decisions/README.md` (forward pointer on the superseded
  text, same change) — not an in-place rewrite of ratified rationale.

## Design constraints (honor while shaping — not open questions)

- **Enforce the floor, never weaken it.** Whatever reads the profile
  validates the floor on every read (D8's load-time guard A is already
  built); the dispatcher must treat a fallback (`resolve-profile` exit
  `2`) as "run under `guardian`, loudly," never as "proceed."
- **Determinism over memory.** A dispatcher that *remembers* the profile
  said "proceed" must not skip a human gate — mirror the existing "a
  review the dispatcher remembers ran does not count" boundary
  (`charters/dispatcher.md`). State is derived from artifacts/records, not
  session recall.
- **Do not re-open `adr-0018`'s Decided set.** #77 activates the shipped
  presets at run time; it does not re-litigate which presets ship, the
  floor shape, or the `intent=agent` semantics — those are Given above.

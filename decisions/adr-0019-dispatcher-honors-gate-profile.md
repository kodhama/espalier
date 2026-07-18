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

> **`draft` — first shaping turn (framing only).** This canvas activates
> `adr-0018` at run time: `adr-0018` built the gate-profile machinery
> (`gates.toml`, the floor validator, the `guardian` fallback,
> `resolveProfile` + the `resolve-profile` CLI) but **nothing reads it
> when sequencing a run** — a repo-wide grep finds no consumer of
> `resolve-profile` outside `gates/`, `setup`, and `set-profile`. So the
> gate-profile is today **configuration without enforcement**: a consumer
> can pick `initiator`, but the swarm still runs as if gate ownership were
> hardcoded, because the dispatcher never consults the profile. This
> decision frames **how the run stops assuming hardcoded ownership and
> starts reading it**. Read `## Decision state` first — it is the live
> state of the decision in one place.
>
> Nothing here is decided yet. The `## Decided` list is empty by design on
> the first turn; every entry below is either an inherited **Given** (from
> `adr-0018`, cited, not reopened) or an **Open** question for the
> maintainer.

## Decision state

### Decided
- **None yet.** This is the first shaping turn. The scope — *wire the
  run-sequencer to read `.grove/gates.toml` and honor it per gate* — is the
  framed goal from grove#77, not a maintainer decision in this
  conversation. Items move here as the maintainer decides them, each
  tagged who/when.

### Open
- **Q1 — the crux: WHO reads the profile.** Does the **dispatcher alone**
  read `gates.toml` and orchestrate pause/proceed at each gate (stage
  charters stay ownership-agnostic), or do **individual stage charters
  become profile-aware** and each consult the profile for its own gate?
  Concrete options in `## The crux (Q1)`. *(Most consequential — it
  determines where enforcement lives and how many charters change.)*
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
  remembers ran does not count" boundary guards against)?
- **Q5 — agent-owned gate semantics, esp. `intent` under `initiator`.**
  `adr-0018` D3 says an agent-owned intent gate ⇒ **autonomous drafting**
  (no interactive human shaping Q&A) + **agent soundness-ratification**
  (`decision-adversary`) + **human ratification relocated to `ship`**. How
  does the dispatcher realize "proceed on agent authority" **concretely**
  at each agent-owned gate — what does it do differently at a `C2=agent`
  gate vs a `C2=human` gate, step by step?
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
- **Q8 — the hardcoded-charter reconciliation.** Stage charters currently
  **assert** ownership — `shaper.md`: "the merge is the approval; the
  intent gate never opens to agents"; `dispatcher.md` Boundaries: "the
  intent gate (decisions, specs) never fully opens to agents." Under
  `initiator` (`intent = agent`) that assertion is now false for the
  *front* intent gate (the floor relocates to `ship`). Does resolving this
  decision also **discharge `adr-0018`'s D2 wording flag** — the charters
  shifting from *asserting* ownership to *reading* it — or is that a
  separate propagation pass? *(Depends heavily on Q1's answer.)*

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

## The crux (Q1) — who reads the profile

grove's stage charters currently **hardcode** gate ownership. `adr-0018`
made ownership **configurable per profile**. The core design fork:

- **Option A — dispatcher-central (single reader).** Only the dispatcher
  (the run-sequencer) reads `gates.toml` via `resolve-profile`, once it
  knows which gate it is at, and decides **pause-for-human**
  (`C2=human`) vs **proceed-on-agent-authority** (`C2=agent`). Stage
  charters stop *asserting* ownership and defer to the dispatcher's
  sequencing. *Pros:* one enforcement point; matches the "the dispatcher
  sequences" boundary; fewest charters change. *Cons:* concentrates the
  logic in the one role that is "the interactive session (v0)" and holds
  no persistent process — the determinism question (Q4) lands hardest
  here.
- **Option B — stage-distributed (each charter profile-aware).** Each
  stage charter consults `resolve-profile` for *its own* gate and
  self-gates. *Pros:* local to where the gate fires; matches `adr-0012`'s
  "gates emerge from each agent's boundary rules." *Cons:* N readers of
  the same file; duplicates the resolve call; the dispatcher already *is*
  the sequencer, so this splits one responsibility across many roles.
- **Option C — hybrid (dispatcher resolves, passes owner down).** The
  dispatcher resolves the profile and **hands each stage its gate's
  resolved owner** as it dispatches; stages act on the passed owner but do
  not read the file. *Pros:* single reader (A's benefit) + local action
  (B's benefit). *Cons:* adds a hand-off contract (what the dispatcher
  passes) that must itself be specified.

This fork also drives **Q8** (the hardcoded-charter reconciliation): under
A, mainly `dispatcher.md` changes and the stage charters lose their
ownership assertions; under B, every stage charter grows a
profile-consult; under C, both change but differently.

## Rejected options

*(None yet — populated as the maintainer retires options. Rejected
options move here with their one-line reason, per the append-only
why-not discipline.)*

## Consequences / propagation (draft — POST-approval executor work, NOT part of this canvas)

Flagged now so no dependent is silently missed (`inv-graph-maintenance`);
the actual edits are a post-approval `executor` pass. The exact set
**depends on Q1's answer**.

- **`charters/dispatcher.md`** — gains the run-time profile-read + per-gate
  pause/proceed sequencing (the primary edit under every option). Note it
  is `gated`, ships to consumers who vendor it — so the enforcement, once
  expressed there, is what makes `adr-0018` pay off for adopters.
- **Stage charters that hardcode ownership** —
  `charters/shaper.md` ("the merge is the approval; the intent gate never
  opens to agents") and `dispatcher.md`'s Boundaries line ("the intent
  gate … never fully opens to agents"). These shift from *asserting*
  ownership to *reading* it under `initiator` (Q8). This is also where
  `adr-0018`'s **D2 wording flag** would be discharged if Q8 folds it in.
- **Any run-sequencing skill/entry** that should now call
  `resolve-profile` (the setup skill already documents the intended path
  `node .grove/internal/gates/bin/resolve-profile.mjs`, lines 68-70 — but
  nothing at run time calls it).
- **Append-only discipline.** If resolving Q8 amends the ratified text of
  `adr-0018` or a `gated` charter, it follows `decisions/README.md`
  (forward pointer on the superseded text, same change) — not an in-place
  rewrite of ratified rationale.

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

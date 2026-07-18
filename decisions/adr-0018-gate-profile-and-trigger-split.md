---
id: adr-0018-gate-profile-and-trigger-split
type: adr
status: draft
depends_on: [adr-0012-methodology-delivery-machinery, trellis/signature-catalog-v1]
informed_by: [adr-0005-tdd-and-artifact-gated-dispatch, adr-0006-operational-conformance-mechanism, adr-0014-install-is-invisible-and-ungated]
owner: agent
updated: 2026-07-18
---

# ADR-0018: the gate-profile mechanism + the trigger-vs-intent-gate split (in-domain)

> **Draft canvas — shaping in progress.** This is the shared canvas for
> converging a decision; nothing here is ratified. The maintainer owns
> the intent gate (`floor-intent-gate`); the merge is the approval. The
> shaper never promotes this past `draft`. Read `## Decision state`
> first — it is the live state of the decision in one place.
>
> Spun out of grove#36's parked dependents (K1/K2). The one preset that
> genuinely needs the cross-domain interop "seal" (`autonomous/standing`
> across domains) stays parked on grove#36 — see `## Parked`.

## Decision state

### Decided
*(turn 1 — nothing converged yet. The presets, the floor validator, and
the schema below are all proposals for the maintainer to accept, reject,
or tune. Items move here as the maintainer decides them, each with
who/when.)*

### Open
1. **The shipped default preset** — is `steward` (human owns intent +
   ship; agents own spec + build — grove's current de-facto behavior)
   the profile a fresh install gets, or does setup force an explicit
   choice with no default? *(Most consequential — see the turn's
   question. Everything a consumer inherits on day one rides this.)*
2. **The preset set** — do all three (`guardian` / `steward` /
   `initiator`) ship, or a subset? Retiring an option beats carrying it.
3. **Which dials are per-gate configurable** — both C1 (enforcement
   strength) and C2 (owner), or is C1 fixed per gate by grove and only
   C2 (who owns it) tunable per profile?
4. **Where the gate-profile artifact lives and its format** — a
   `.grove/` companion file, a managed `CLAUDE.md` block, or frontmatter
   on an existing artifact; YAML vs. a companion-doc table.
5. **How the trigger row is represented** alongside the four gate rows
   (K2) — same table, separate section, what its cells hold.
6. **What the floor validator checks, and when it fires** — presumably
   "reject any profile with 0 human-owned intent gates" at setup and on
   every hand-edit, but the exact check surface and firing points are
   open (does it read only C2 on the intent row, or also the external
   slot once that lands?).

### Parked
- **The `autonomous/standing`-across-domains preset** — all of a repo's
  *local* gates agent-owned, the floor satisfied by a human intent gate
  in a *different* governance domain (an upstream that pre-ratifies, or
  the consuming domain's own ship gate). This is the single case that
  genuinely depends on the cross-domain interop contract's **seal**
  (what a gate-owner guarantees across a boundary), tracked in
  **grove#36**. Not shaped in this canvas — pointer only. The schema
  below leaves an explicit slot for it (`## Design constraints`) so it
  drops in later without a rewrite.

## Given (inherited upstream — not re-litigated here)

Carried from the maintainer/dispatcher evidence base and the trellis
invariants; cited, not reopened. If the maintainer's inclination
contradicts one of these, the shaper flags it once with the citation,
then defers.

- **Gates are implementation, not principle.** Trellis defines the
  invariants + **two dials** — **C1** (enforcement strength:
  `enforced` / `default-on-but-skippable` / `expressed`) and **C2**
  (owner/ratifier: `human` / `independent-agent` / `none`) — and
  `inv-handover-points` (a seam where a gate *can* attach). Trellis does
  **not** enumerate gates (`trellis/signature-catalog-v1`). grove
  instantiates the concrete gates — its pipeline's **intent / spec /
  build / ship** — and sets each gate's C1/C2.
- **grove's gate structure is emergent, not declared** (`adr-0012` E5):
  no one holds "the workflow"; a run's gates emerge from per-artifact
  owed-review rules + each agent's triggers, composed with the standing
  invariants. A gate-profile is a *configuration layer over that*, not a
  replacement for it.
- **A gate-profile is a named per-gate assignment of C1/C2** onto
  grove's four gates — the physical realization of trellis's dials onto
  grove's pipeline. It mirrors how a trellis *profile* sets invariant
  expression: pick a preset, then tune individual dials.
- **The floor that bounds every profile:** `floor-intent-gate` — the
  intent gate's **C2 can never be `none`**; at least one human-owned
  intent gate must exist (`trellis/signature-catalog-v1`; grove echoes
  it in `charters/dispatcher.md`, `adr-0005`, `adr-0014`). A profile
  with zero human intent gates is **illegal** and must be rejected by a
  validator. This is a floor, not a dial — non-configurable to off.
- **grove already runs agentic triggers.** Remediation roles
  (`run-resumer`, `propagation-remediator`), the `validator`'s
  triggered drift audits (`adr-0006` dec 5), and inference-first
  dispatch (`charters/dispatcher.md`) already fire runs with no human at
  the ignition point — so the trigger-vs-intent-gate split (K2) names an
  existing reality, it does not invent one.

## Framing — the mechanism being converged

### K1 — gate-profile mechanism + presets

A **gate-profile** assigns C1/C2 to each of grove's four gates, is
**installed at setup**, and is **hand-editable after**. Candidate
presets (proposals):

| Preset | intent | spec | build | ship | one-line character |
|---|---|---|---|---|---|
| **guardian** | human | human | agent | human | max oversight — human at intent + spec + ship |
| **steward** | human | agent | agent | human | human at intent + ship; agents own the middle *(grove's current de-facto behavior)* |
| **initiator** | human *(expressed at kickoff)* | agent | agent | human *(ratifies)* | human expresses intent at kickoff, ratifies at ship; mid-pipeline agent-owned |

- **Per-gate override.** On top of a chosen preset, the human may flip
  any single gate's dial(s) — the preset is a starting point, not a
  cage.
- **The floor validator** rejects any resulting profile with **0
  human-owned intent gates** (`floor-intent-gate`). guardian and steward
  satisfy it with a human-owned *first* intent gate; initiator satisfies
  it with a human-owned intent gate **at ship** (ratification) — which
  is why K2 matters.

> **guardian vs steward vs initiator — the load-bearing difference.**
> steward and initiator both put a human only at intent + ship, but
> differ on *where the human-owned intent gate physically sits*: steward
> keeps a genuine human intent **gate up front**; initiator has intent
> merely **expressed** at kickoff (C1 `expressed`, ungated) with the
> human-owned intent **ratification landing at ship**. guardian adds a
> third human gate at spec. Fewer human gates = more agent autonomy =
> later the human catches a wrong *direction*.

### K2 — the trigger-vs-intent-gate split

- **The trigger** (what *ignites* a run — a human ask, a cron, a CI
  event, a backprop interrupt) is a **separate row** from the **intent
  gate** (who *ratifies direction*). They are different questions and
  must not be conflated.
- The floor pins the **intent gate** to human; it says **nothing about
  the trigger**, and it does **not** require the intent gate to be
  *first*.
- An **agentic first gate is legal** when intent is ratified at ship
  (initiator), or pre-ratified by a **standing decision within this same
  domain** (a locked decision the agent runs under — `charters/dispatcher.md`'s
  "locked decisions as the autonomy precondition"). The *across-domains*
  version of "intent satisfied elsewhere" is the parked case (grove#36).

## Design constraints (honor while shaping — not open questions)

- **Leave the external-intent slot in the schema** (`inv-graph-maintenance`
  — don't build something the parked decision forces a rewrite of). The
  gate-profile schema must carry an explicit, initially-empty slot for
  **"intent satisfied externally"** — a per-profile marker naming that a
  local intent gate's floor obligation is discharged by a human intent
  gate in another domain. In-domain profiles leave it empty; the parked
  `autonomous/standing` preset (grove#36) fills it once the cross-domain
  **seal** contract exists. Shape the in-domain case now; leave the
  slot; do **not** resolve the external case here.
- **The profile configures, it does not replace, the emergent gate
  structure** (`adr-0012`). The floor validator and the owed-review
  rules both still run; a profile can tighten or (within the floor)
  loosen *who owns / how strongly* a gate fires, never delete the seam.
- **Append-only if this ever supersedes.** Nothing here supersedes an
  existing decision; if a later turn does, it follows `decisions/README.md`
  (forward pointer on the superseded text, same change).

## Options / rejected

*(Empty for now — populated as the maintainer rejects options, each with
its one-line why-not, so the decision records why-nots and the
conversation does not re-argue them.)*

## Open questions

The six live items are enumerated in `## Decision state → Open` above
(single source of truth). They are surfaced one per turn, most
consequential first; the rest wait their turn in the Open list.

## Self-check (draft — not a gate pass)

- **Frontmatter**: `id`/`type`/`status`/`depends_on`/`informed_by`/
  `owner`/`updated` present; `status: draft`. Not self-promoting past
  draft (shaper boundary).
- **`depends_on`**: `adr-0012-methodology-delivery-machinery` (`approved`
  — the emergent gate structure this profiles) and
  `trellis/signature-catalog-v1` (`ratified` — defines the C1/C2 dials +
  `floor-intent-gate` the profile realizes). Both genuine
  correctness-bearing coupling, not provenance.
- **`informed_by`** (provenance, not correctness-bearing): `adr-0005`
  (artifact-gated dispatch — the intent gate at the dispatch point),
  `adr-0006` (the triggered-check machinery a floor validator would ride),
  `adr-0014` (grove does not gate its own arrival; autonomous run leaves
  the change and stops rather than self-approving — the intent-gate floor
  in the install case).
- **Scope guard**: the across-domains preset is parked to grove#36, not
  shaped; the schema leaves its slot. New ideas mid-shaping go to Open or
  Parked, never silently into a Decided.
- **Not converged**: Decided is empty by design (turn 1). This is a
  canvas, not a finished decision.
</content>
</invoke>

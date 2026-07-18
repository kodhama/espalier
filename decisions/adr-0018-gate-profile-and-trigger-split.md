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
- **D1 — `steward` is the shipped default preset** *(maintainer,
  2026-07-18)*. A fresh install gets `steward` (human owns **intent** +
  **ship**; agents own **spec** + **build**). Rationale: (a) `steward`
  already keeps **two** human gates, so the default is conservative on
  its own — the "force an explicit pick for safety" alternative buys
  little; (b) forcing an explicit profile choice at install would make
  grove **gate its own arrival**, contradicting `adr-0014` (install is
  invisible and ungated). `guardian` and `initiator` remain **opt-in**
  presets on top. *(Resolves former Open item 1.)*
- **D2 — a human-owned gate (C2 = `human`) is channel-agnostic**
  *(maintainer, 2026-07-18: "I'm not restricting to a specific
  channel")*. The floor requires the intent gate be human-**owned**; it
  does **not** dictate *by what act* the human satisfies it. Any
  authentic channel counts equally — an **explicit in-session
  approval**, a **direct merge**, **or** a **tracker/GitHub comment**.
  grove must **not** hardcode "the merge is the approval"; the merge is
  **one channel among several**.
  - **In-session approval is first-class, not a fallback.** A human may
    always weigh in at a gate the profile assigns to an *agent* — e.g.
    the maintainer approves specs in-session today even though `steward`
    makes the spec gate agent-owned. **The profile sets who is
    *required* at a gate, not who is *allowed*.**
  - **Reconciling existing language:** where the shaper charter and
    `floor-intent-gate` say "the merge is the approval/ratification,"
    that is the **reference convention for a GitHub-based repo**, not a
    channel restriction. This decision states channel-agnosticism
    explicitly so that phrasing is not misread as merge-only. *(See the
    propagation flag in `## Consequences / propagation`.)*
- **D3 — grove ships all three presets** *(maintainer, 2026-07-18)*:
  **`steward`** (default, D1), **`guardian`** (opt-in), and
  **`initiator`** (opt-in). Rationale: K2 (the trigger-vs-intent-gate
  split) is already in scope and requires designing the "intent
  **expressed** at kickoff, **ratified** at ship" row **regardless** —
  `initiator` merely *names* that configuration, so it is nearly free,
  and cutting it would hollow out K2's deliverable.
  - **`initiator` is in-domain and does NOT depend on grove#36.** Its
    intent is *expressed* at kickoff and **ratified by a human at ship**
    — so there **is** a human intent gate *in this domain*; the floor is
    satisfied **locally**, no cross-domain seal needed. It is **not**
    coupled to, nor likely-to-shift-under, grove#36. Keep it crisply
    distinct from the parked case:
    - **`initiator` (shipped, in-domain):** no human *required* until
      ship; **ship ratifies intent locally**. Floor holds here.
    - **`autonomous/standing` (parked → grove#36, cross-domain):** **no
      human gate in this domain at all**; floor satisfied by a human in
      *another* domain. Needs the seal. *(→ `## Parked`.)*
    The single distinguishing fact: `initiator` has a local human ship
    gate; `autonomous/standing` has no local human gate whatsoever.
- **D4 — C1 is grove-fixed; the profile is a single (C2) axis
  (Model A)** *(maintainer, 2026-07-18)*. Enforcement strength (**C1**:
  `enforced` / `default-on-but-skippable` / `expressed`) is **grove's
  design call per gate**, not a consumer-tunable dial. **The gate-profile
  configures only C2** (who owns each gate). C1 defaults live in a
  **grove-managed internal file grove does NOT surface to users** (a
  power-user can technically set them, but it is not a supported
  surface). Rationale: one axis to configure and validate
  (`inv-minimal-first`); avoids the under-gating footgun of quietly
  setting a gate advisory; and it matches how grove already keeps
  enforcement knobs **gate-locally** (`adr-0007` severity threshold,
  `adr-0013` scope mode) rather than as a global dial. Floor untouched —
  the intent gate stays C1 = `enforced`, C2 = `human`. *(Resolves former
  Open item 1.)*
- **D5 — the consumer `.grove/` layout, split by AUTHORITY**
  *(maintainer, 2026-07-18; recorded here in adr-0018 by the maintainer's
  call)*. Organizing principle: **placement by who is authoritative on a
  file's contents** — *not* machinery-vs-config. *(This supersedes an
  earlier "machinery vs user-editable" framing the maintainer flagged as
  wrong: `review-policy.md`'s strict/scoped mode is a **consumer choice**,
  so that axis mis-split it.)*
  - **`.grove/` root — consumer-authoritative** (setup writes defaults;
    grove **NEVER clobbers**): **`gates.toml`** — the gate-profile (C2 +
    per-gate overrides), **NEW**; and **`review-policy.md`** — the
    strict|scoped scope choice (`adr-0013`), stays on the user surface.
  - **`.grove/internal/` — grove-authoritative** (copied/regenerated
    verbatim on update; hand-edits overwritten): the companions
    `lifecycle.md` (`adr-0008`), `versioning.md` (`adr-0010`),
    `relations.md` (`adr-0011`); the `check/` tool; and the C1
    **`enforcement.toml`** (D4's grove-managed C1 file).
  - Subfolder name: **`internal/`**.
- **D6 — the setup UX for presets** *(maintainer, 2026-07-18)*. The
  preset choice is an **optional `/grove:setup` question with `steward`
  as default** — **NOT a forced pick** (honors `adr-0014`
  invisible/ungated install and D1). Setup shows brief one-liners:
  - **steward** — "you approve direction + final result; agents handle
    spec and build";
  - **guardian** — "you also approve the spec before build";
  - **initiator** — "you kick off intent and approve only the final
    result";

    and points to **`.grove/gates.toml`** for finer per-gate overrides.

### Open
1. **The `gates.toml` format / schema** — the *location* is settled
   (`.grove/gates.toml`, consumer-authoritative, D5) and it configures
   **only C2** (D4); open is the file's *shape*: how the four gate rows
   (intent/spec/build/ship) + the trigger row (Open 2) + the
   external-intent slot (design constraint) are expressed as TOML, and
   how a per-gate override reads.
2. **How the trigger row is represented** alongside the four gate rows
   (K2) — same table/section, what its cells hold (a `gates.toml` shape
   question paired with Open 1).
3. **What the floor validator checks, and when it fires** — presumably
   "reject any profile with 0 human-owned intent gates" at setup and on
   every hand-edit, but the exact check surface and firing points are
   open (does it read only C2 on the intent row, or also the external
   slot once that lands?).
4. **Approval authenticity per channel (in-domain).** D2 leaves the
   approval *channel* unrestricted — but the approval must genuinely
   originate from the accountable human, and **channels differ in
   forgeability**: a tracker/GitHub comment "can be faked," whereas a
   merge (needs write access) or an in-session approval (the human is
   present) is much harder to spoof. How does grove establish that a
   claimed approval is authentic, **per channel**? Kept **in-domain**
   (how *this* domain trusts its *own* approval channels); adjacent to
   grove#36's O3 (cross-domain seal verification) but **not** folded
   into it.
5. **`review-policy.md` mixes consumer-choice + grove-wiring.** It is
   consumer-authoritative in *purpose* (the strict|scoped scope mode,
   `adr-0013`) — which is why D5 keeps it on the `.grove/` root surface —
   but `adr-0013` has setup **also** write machinery keys into it
   (`check_runtime_dir`, `check_workflow_path`). So a user-surface file
   carries grove-wiring. Options to weigh later: keep it on the surface
   and rely on non-clobber discipline, or split choice-from-wiring. **Do
   not resolve here** — `adr-0007`/`adr-0013` territory; flagged.

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

A **gate-profile** assigns **C2** (who owns each gate) to grove's four
gates — **C1 is grove-fixed, not in the profile** (**D4**). It lives at
**`.grove/gates.toml`** (consumer-authoritative, **D5**), is written by
setup with the **`steward`** default (**D1**, **D6**), and is
**hand-editable after**. The three shipped presets (**D3**):

| Preset | intent | spec | build | ship | one-line character |
|---|---|---|---|---|---|
| **guardian** | human | human | agent | human | max oversight — human at intent + spec + ship |
| **steward** *(default, D1)* | human | agent | agent | human | human at intent + ship; agents own the middle *(grove's current de-facto behavior)* |
| **initiator** | human *(expressed at kickoff)* | agent | agent | human *(ratifies)* | human expresses intent at kickoff, ratifies at ship; mid-pipeline agent-owned |

- **`human` sets who is *required*, not who is *allowed* (D2).** A cell
  reading `agent` means no human is *required* at that gate — a human
  may still weigh in there (in-session spec approval under `steward` is
  the live example). And a `human` cell is satisfied by **any authentic
  channel** — in-session approval, merge, or tracker comment alike — not
  by a merge specifically.
- **Per-gate override.** On top of a chosen preset, the human may flip
  any single gate's **C2** in `gates.toml` — the preset is a starting
  point, not a cage. (C1 is not exposed here — D4.)
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

- **Force an explicit profile choice at install (no default).** Rejected
  (**D1**, maintainer 2026-07-18): `steward` already keeps two human
  gates, so the safety argument is weak; and a required setup choice
  would make grove **gate its own arrival**, contradicting `adr-0014`.
- **Hardcode "the merge is the approval" as the intent-gate act.**
  Rejected (**D2**, maintainer 2026-07-18): the merge is one authentic
  channel among several (in-session approval, merge, tracker comment);
  hardcoding it would forbid the in-session approvals the maintainer
  already performs.
- **Make C1 (enforcement strength) a consumer-tunable per-gate dial
  (Model B).** Rejected (**D4**, maintainer 2026-07-18): a second axis to
  configure and validate (`inv-minimal-first`), and it opens the
  under-gating footgun of quietly setting a gate advisory. C1 is grove's
  gate-local design call (matching `adr-0007`/`adr-0013`), not a profile
  dial.
- **Split `.grove/` by machinery-vs-user-editable.** Rejected (**D5**,
  maintainer 2026-07-18): `review-policy.md`'s strict/scoped mode is a
  **consumer choice**, so that axis mis-classifies it as machinery. The
  correct axis is **authority** (who is authoritative on the contents).

## Consequences / propagation (draft — POST-approval executor work, NOT part of this canvas)

The canvas records the decision and this propagation list; **it does not
move files or edit dependents.** The moves below are a **stage-4
`executor` pass after adr-0018 is approved** — flagged now so no
dependent is silently missed (`inv-graph-maintenance`).

- **D5 layout move — required dependent updates when the layout lands:**
  - Relocating the companions into `.grove/internal/` changes documented
    install paths in **`adr-0008`** (lifecycle), **`adr-0010`**
    (versioning), **`adr-0011`** (relations).
  - The `review-policy.md` / `check/` placement touches **`adr-0007`**
    and **`adr-0013`**.
  - The paths are referenced by the **setup, check-install, remove,
    record-verdict skills** and **`reference/ci/`** — all must be updated
    when the layout lands.
- **D2 wording flag (record, do not chase in this canvas).** The shaper
  charter and `floor-intent-gate` phrase ratification as "the merge is
  the approval." Under **D2** that is the **GitHub-repo reference
  convention**, not a channel restriction — the wording may want a later
  clarifying touch so it is not misread as merge-only. Noted for a future
  propagation pass; **not** edited here.

## Open questions

The five live items are enumerated in `## Decision state → Open` above
(single source of truth): (1) the `gates.toml` schema, (2) trigger-row
representation, (3) floor-validator check surface + firing points, (4)
per-channel approval authenticity, (5) `review-policy.md`
choice-vs-wiring mix. They are surfaced one per turn, most consequential
first; the rest wait their turn in the Open list.

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
- **Not converged**: 6 Decided (D1 default preset; D2 channel-agnostic
  intent gate; D3 ship all three presets; D4 C1 grove-fixed, profile is
  C2-only; D5 `.grove/` layout split by authority; D6 optional preset
  setup question) / 5 Open / 1 Parked as of 2026-07-18. Still a canvas,
  not a finished decision — the shaper does not promote past `draft`.

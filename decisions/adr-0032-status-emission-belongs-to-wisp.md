---
id: adr-0032-status-emission-belongs-to-wisp
type: adr
status: approved  # maintainer's intent act 2026-07-23: status emission belongs to wisp; explicitly authorized removal, separate PR, merge, and rebase
depends_on: [adr-0026-thin-vendor-boundary, adr-0027-retire-ci-for-now, adr-0028-plugin-release-tagging]
owner: human
updated: 2026-07-23
---

# ADR-0032: status emission belongs to wisp, not grove

## Decision state

### Decided

- **D1 — remove the `grove-status` charter and skill from Grove.** Runtime
  event emission is Wisp's product concern. Grove's workflow continues to come
  from the dispatcher, role charters, artifacts, and gate profile; telemetry is
  not a workflow source.
- **D2 — stop composing and refreshing the adapter.** New Grove installs do
  not ask about Wisp or write a status skill. Refresh no longer maintains an
  installed copy.
- **D3 — preserve a cleanup path for prior consumers.** `/grove:remove`
  recognizes a legacy `.claude/skills/grove-status/` install and may remove it
  with the same explicit confirmation used for other legacy Grove files.
- **D4 — release as `0.2.0`.** Removing a shipped optional capability is a
  consumer-observable behavior change and takes the pre-1.0 minor slot under
  `adr-0028`.

### Open

*(none)*

### Parked

- Wisp may provide its own agent-facing status skill when that product is
  actively iterated again. Grove makes no contract for its future shape.

## Context

`adr-0026` P3 left the adapter's home parked between Grove and Wisp.
`adr-0027` retained it when review bookkeeping was suspended. In practice the
adapter adds instructions and maintenance surface to Grove while its event
protocol and emitter belong to Wisp, and Wisp is not an active dependency of a
Grove run.

Keeping a dormant optional adapter here confuses telemetry with orchestration.
Removing it makes the boundary explicit: Grove defines how agents work; Wisp
may define how their events are observed.

## Consequences and propagation

- Delete `charters/grove-status.md`, Grove's repo-local installed copy, and the
  plugin's vendored template.
- Remove status-adapter claims from Grove and plugin documentation.
- Remove setup and refresh behavior that installs or maintains the adapter.
- Keep only the legacy detection/removal clauses needed to clean prior
  consumers safely.
- Add forward pointers to `adr-0026` P3 and the affected `adr-0027` clause;
  both decisions otherwise remain approved and unchanged.
- Do not change Wisp or claim that it currently ships a replacement.

## Acceptance criteria

- No Grove source or plugin payload contains a `grove-status` charter or skill.
- Setup never asks about Wisp and never writes a status skill.
- Refresh never maintains the removed adapter and surfaces an existing copy as
  legacy.
- Remove can identify and confirm deletion of the legacy adapter.
- Current documentation does not present telemetry as part of Grove's payload
  or adoption path.
- Historical evidence remains readable and points forward where its live
  decision was superseded.
- The plugin version is `0.2.0`.

## Self-check

- **Boundary:** event emission moves out; no Wisp implementation is invented.
- **Graph:** the two approved decisions whose live clauses change receive
  forward pointers.
- **Migration:** new installs stop creating the file; old installs retain a
  safe cleanup path.
- **Intent:** the maintainer explicitly approved removal and this isolated
  landing.

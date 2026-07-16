---
id: spec-0002-review-bookkeeping-check
type: spec
status: gated
depends_on: [adr-0012-methodology-delivery-machinery, adr-0005-tdd-and-artifact-gated-dispatch, adr-0006-operational-conformance-mechanism]
owner: agent
updated: 2026-07-16
version: 1  # counter initialized at materialization (versioning.md); forward-only from here — held at 1 through this pre-approval revision, see Rubric check
status_note: promoted draft → gated on the passing self-check (contract-author Method 6); approved remains the human intent act (lifecycle.md), and adr-0012 (this spec's authorizing decision) is itself only gated — see Open Q5
---

# spec-0002 — the review-bookkeeping check (Layer A)

The mechanism that makes review bookkeeping mechanical: append-only
**verdict records posted as structured PR comments**, an **owed-map
assembled at run-time from one rule**, and a deterministic **check** that
renders a read-only status view — with the **reason** anything is
un-green — and goes red on any completeness / freshness / coverage /
separation gap. Implements `adr-0012` **Layer A** only. Green is **not**
authorization; a human still judges genuineness and merges.

> This spec constrains machinery, not judgment. It **recomputes** the
> values it can (fingerprints, owed-set, type, coverage, latest-record
> selection) and **trusts, disclosed**, the values it cannot (record
> genuineness, self-reported author/reviewer tags). The values it trusts
> are the Layer B surface (§E), named here, not pretended away.

> **Amendment (2026-07-16, `adr-0012` in-place amendment — the
> maintainer's 2026-07-16 calls; under the fifth adversarial pass).**
> **WHAT:** §A re-based from per-review verdict *files* under
> `.grove/verdicts/` to **append-only verdict records as structured PR
> comments** (record schema, latest-covering selection, vacuity rule);
> the former §C.5 verdicts-directory carve-out **deleted** (no verdict
> path exists in the tree to exempt); §B restated as the decision's
> **one owed-rule** with the fail-closed override; §A.3 splits the
> fingerprint basis by review class (**quality = artifact alone;
> fidelity = artifact + upstream**) following the fidelity/quality
> split (conformance = fidelity at every layer + graph integrity;
> spec-adversary = intrinsic quality only); §D gains the **reason
> grammar**. S2/S6/S7/S12 amended, S13–S15 added; INV1/INV3/INV4/INV9/
> INV12 amended, INV14–INV15 added; traceability re-mapped to the
> amended AC1–AC11 (AC5, AC10).
> **WHY:** `adr-0012` was amended 2026-07-16 — verdict-records-as-
> PR-comments superseding the interim file model (merge residue, an
> exempt-path attack surface, a split output channel), and fidelity
> moving wholly to the `conformance-reviewer` with the `spec-adversary`
> narrowed (the fusion over-invalidated quality verdicts on upstream
> edits). See its Considered-and-rejected entries for both.
> **SCOPE:** §A, §B, §C.0–C.6, §D, both AC grammars, the traceability
> table, and Open Q4 (resolved by the amendment) change; §E, the
> separation rule (§C.4), the decision human gate, and
> S1/S3/S4/S5/S8–S11 stand.
> **POINTER:** current truth is the body below — this note is
> provenance only, not itself an acceptance criterion.
> **VALUE:** as the maintainer, a re-review can never silently
> overwrite a FAIL, an upstream edit no longer spuriously voids a
> spec's quality verdict, and there is no verdict path in the tree left
> to defend as a review-free zone.
> **CONFIDENCE:** `verified` — each change traces to the amended
> `adr-0012` Decision-in-brief, Consequences, and AC1–AC11, read this
> sitting.

## Terms

| Term | Meaning |
|---|---|
| **check** | The single automated job added by this spec (CI on existing primitives, `adr-0012` AC10). Runs on every PR against the protected default branch. |
| **protected branch** | The protected default branch (`main`) — the source of *policy*. Never PR HEAD. |
| **HEAD** | The PR's head commit — the source of reviewed *content*. |
| **diff** | The set of files changed between the PR's merge-base on the protected branch and HEAD (added or modified; deletions per S12). |
| **review** | One of the four reviews: `decision-adversary`, `spec-adversary`, `conformance`, `code-reviewer`. |
| **quality review** | `decision-adversary`, `spec-adversary`, `code-reviewer` — "is it good, judged as the thing it is?" Fingerprint basis: the subject **alone** (§A.3). |
| **fidelity review** | `conformance` — "does it faithfully derive from its artifact upstream?" plus graph integrity (pins resolve, propagation claims true), at every layer with an artifact upstream. Fingerprint basis: subject **+ upstream** (§A.3). |
| **verdict record** | One structured, **append-only** comment a reviewer posts on the PR per review act (§A). The commit point: a review not recorded here does not count. |
| **record stream** | The PR's comment stream, read via the platform API — the only channel the check reads records from. |
| **subject manifest (S)** | The reviewer-declared set of repo-relative paths a record certifies (§A). |
| **upstream set (U)** | The check-derived direct upstream file set of the subjects (§A.3) — fidelity reviews only; derived, never trusted from the record. |
| **fingerprint** | A deterministic hash over the review-class basis (`S` or `S ∪ U`) content (§A.3). |
| **owed-map** | The run-time assembly of the one owed-rule from the reviewer charters' declarations (§B). Never a stored table. |
| **PASS-class** | The pass tokens of a review's own charter verdict grammar (§A.2). |

---

## §A — Verdict-record format

### A.1 The record and its carrier

- A verdict record is a **structured comment on the PR** — one comment
  per review act, posted by the reviewer in **one act** (verdict +
  manifest + fingerprint + attribution + findings together; no second
  channel). Nothing lands in the repo tree: **no verdict path exists**
  (`adr-0012` AC5, AC10).
- **Carrier (concretization, flagged):** the machine-parseable part is a
  fenced code block tagged `grove-verdict` containing YAML per §A.2. A
  comment may carry surrounding prose; only the block is the record. Any
  comment (or block) that does not parse against §A.2 is **inert** — it
  is never a record and never satisfies anything (S7; fail-closed by
  non-recognition).
- **Append-only.** A re-review posts a **new** record; nothing is
  overwritten or deleted. For each owed pair, the **latest covering
  record counts** (§C.3), and the full sequence stays visible — a FAIL
  quietly "becoming" a PASS is visible by construction (S14).
- **Session context never counts.** A review that lives only in a
  session's working memory — however faithfully summarized — satisfies
  nothing; the posted record is the commit point (S15, `adr-0012`
  Decision-in-brief 1).
- **`<subject-key>`** (the grouping key for a record): the subject's
  frontmatter `id` when it has one, else
  `path-<first-12-hex of sha256 of the sorted subject paths>`.
- **Selection rule (concretization, flagged):** `adr-0012` says "the
  latest record per review counts"; with several subjects per PR this
  spec pins the deterministic form — for each owed pair `(f, R)`, the
  **latest schema-valid record for `R` whose `S` contains `f`** counts,
  ordered by the platform's comment creation order (monotone comment
  id). A later record supersedes earlier ones **for the paths it
  covers**; it never uncovers paths it does not mention.

### A.2 Schema (structured data only — YAML, inside the `grove-verdict` block)

Every field is **required** unless marked optional.

| Field | Type | Meaning |
|---|---|---|
| `review` | enum | The review this record is for (one of the four). |
| `verdict` | string | The reviewer's overall verdict token, verbatim from its charter grammar. |
| `subject` | list\<path\> | The subject manifest `S` — repo-relative paths this record certifies. Non-empty. |
| `subject_id` | string (optional) | The subject artifact's frontmatter `id`, when it has one. |
| `manifest_hashes` | map path → sha256 | Per-path content hashes at review time, over `S` (quality) or `S` plus the reviewer-resolved upstream (fidelity). **Used only to name stale reasons (§D); never for the verdict** — the check recomputes everything. |
| `fingerprint` | string | `grove-fp-1:<64-hex>` recorded by the reviewer over the review-class basis (§A.3). Recomputed by the check, never trusted. |
| `author` | string | Self-reported agent id that **produced** the subject. |
| `reviewer` | string | Self-reported agent id that **produced this record**. |
| `findings` | string | The findings **inline, in this record** — the evidence for a PASS-class verdict, the named gaps for a failing one. An empty/whitespace body makes the record **vacuous** (§D): schema-valid but satisfying nothing. |
| `reviewed_at_commit` | string (optional) | The commit SHA reviewed. Informational only; the check ignores it for freshness. |

**PASS-class per review** (read from policy on the protected branch;
`adr-0012` AC1/AC5). Charter updates consolidating the fidelity/quality
split are an `adr-0012` execution deliverable in the same wave as this
spec; the scopes below state the amended decision's split, which the
charters' declarations must match:

| `review` | Class | Scope (per `adr-0012`) | PASS-class tokens | Source charter |
|---|---|---|---|---|
| `conformance` | fidelity | faithful derivation from the artifact upstream, **at every layer** (spec→decision, code→spec, charter→ADR) + graph integrity | `PASS` | `conformance-reviewer.md` (Output) |
| `code-reviewer` | quality | code judged as code, regardless of the contract | `CLEAN`, `PASS-WITH-ADVISORIES` | `code-reviewer.md` (Verdict) |
| `spec-adversary` | quality | **intrinsic quality only** — testability, internal consistency, ambiguity, edge coverage; it no longer reads or judges fidelity to the decision | `APPROVE-READY` | `spec-adversary.md` (Method 4) |
| `decision-adversary` | quality | decision soundness | **per its charter, to be authored** — see Open Q1 | (new role, `adr-0012` AC9) |

A `verdict` token outside its review's PASS-class is **not** a pass; the
owed pair stays uncovered (S1) with reason `review-failed` (§D).

### A.3 Fingerprint algorithm (`grove-fp-1`), review-class basis, and upstream resolution

The fingerprint binds a record to exactly the content the review rested
on, so that a later edit to that content invalidates it — and **only**
it. Per `adr-0012`'s fidelity/quality split, the basis differs by class:

| Review class | Fingerprint input basis | Consequence |
|---|---|---|
| **quality** (`decision-adversary`, `spec-adversary`, `code-reviewer`) | `I = sorted(dedup(S))` — the subject **alone** | An upstream edit does **not** invalidate a quality verdict (S13). |
| **fidelity** (`conformance`) | `I = sorted(dedup(S ∪ U(S, C)))` — subject **+ derived upstream** | Any subject *or* upstream edit — content or membership — invalidates it (S2, S13). |

**Upstream set `U(S, C)`** at commit `C`, derived by the check for
fidelity records (never read from the record):

1. Build an **artifact index** at `C`: glob the policy-declared artifact
   directories (default `decisions/`, `specs/`, `charters/`), read each
   file's frontmatter `id`, map `id → path`.
2. For each subject path `s ∈ S` that carries YAML frontmatter with a
   `depends_on` list: resolve each **direct** dependency id (strip any
   `@version` per `versioning.md`) to its path via the index; add it to
   `U`. Transitive closure is **not** taken (Open Q3).
3. A subject with no frontmatter (**code**) resolves its upstream from the
   **per-package test-deps ledger** (`adr-0006` dec 4, placeholder
   `<TEST_DEPS_LEDGER>`): locate the ledger for the subject's package, read
   its declared `depends_on` (the specs `@vN` and decisions the package's
   tests rest on) at `C`, resolve each id to a path via the index, and add it
   to `U`. The ledger is an artifact the `executor` maintains — so code's
   upstream is **check-derived from a durable, reviewable artifact**, not from
   the reviewer's per-verdict manifest. A code package with no ledger entry
   has no derivable upstream → `conformance`'s "no reviewable upstream ⇒ FAIL"
   backstop (`adr-0005` dec 3) applies (fail-closed). A change to the ledger
   itself changes `U`'s membership → stale, like any upstream change.
   *(Resolves former Open Q2, folding in `adr-0006` dec 4.)*

**`grove-fp-1(I, C)`:**

1. Sort `I` by raw byte order of the path string.
2. For each `p ∈ I`: `b =` the blob bytes of `p` at `C` if it exists,
   else the sentinel `"\x00ABSENT\x00"`; emit
   `L_p = hex(sha256(utf8(p))) + ":" + hex(sha256(b))`.
3. Fingerprint `= "grove-fp-1:" + hex(sha256( join(L_p, "\n") ))`.

The **reviewer** records `grove-fp-1(I, reviewed-commit)` over its
class's basis. The **check** recomputes `grove-fp-1(I, HEAD)` — deriving
`U` itself for fidelity — and compares. Any difference — changed subject
content, changed upstream content, or changed upstream *membership* — is
a **stale** record (S2). Because the check derives `U` itself and
recomputes over `HEAD`, a reviewer cannot make a fidelity record look
fresh by recording a manifest that omits a declared upstream. The
recorded `manifest_hashes` feed only the §D reason attribution: a
mis-recorded per-path hash can at worst **misname** a reason, never flip
the check's red/green.

---

## §B — The owed-map (ONE rule, assembled at run-time — `adr-0012` Consequences + AC4)

**The rule** (`adr-0012`, verbatim intent): *every changed artifact owes
**fidelity-conformance iff it has an artifact upstream**, plus **its
layer's quality gate**.*

`type` is read from the changed file's **frontmatter `type` at HEAD**;
**no frontmatter ⇒ `code`** (`adr-0012`: reuse the frontmatter contract,
no classifier invented).

**The owed-map is not a stored table.** The check **assembles** the
rule's inputs at run-time from the **reviewer charters' machine-readable
declarations** — each reviewer charter declares what it reviews — read
from the **protected branch** (§C.1, AC5), never PR HEAD (`adr-0012`:
*anything derivable is computed at check-time, never stored*). Changing
what a `type` owes is a **charter** edit; there is no map file to
regenerate. The assembly currently projects to (the *expected
projection*, not an authored artifact):

| `type` (at HEAD) | Artifact upstream? | Owed reviews |
|---|---|---|
| `research`, `feedback` | — | *(none — no reviewer declares them)* |
| `adr` / decision | no (its "test" is human intent) | `decision-adversary` **+ human intent gate** (§C.5, AC9) |
| `spec` | yes (its decision) | `conformance` (→ decision) + `spec-adversary` |
| `charter` | yes (its ADR) | `conformance` (→ ADR, `adr-0006` dec 8; no charter-layer quality specialist is chartered) |
| *no frontmatter* ⇒ `code` | yes (its spec, via the `adr-0006` test-deps ledger) | `conformance` (→ spec) + `code-reviewer` |

- **Fail-closed override (INV7/AC4) is an explicit check rule, not an
  assembly output.** Pure assembly would leave an *unknown or unclaimed*
  `type` with an empty owed-set (no reviewer claims it) — i.e.
  fail-**open**. So the check applies a stated rule on top: a changed
  file whose `type` is claimed by **no** reviewer declaration owes the
  **full set**, never nothing.
- A PR's owed-set is the **union** over all changed files of each file's
  owed reviews (S12); green requires every element satisfied at HEAD.
- *(Former Open Q4 resolved 2026-07-16: the amended `adr-0012` pins the
  `charter → conformance (→ its ADR)` projection explicitly, consistent
  with `adr-0006` dec 8 — the tension that question recorded is gone.)*

---

## §C — The check

### C.0 Trust boundary (the check trusts no agent-emitted value it can recompute)

| Value | Source | Trusted? |
|---|---|---|
| owed-map (**assembled** from reviewer-charter declarations), PASS-class table, allowlist, artifact dirs | charters + policy on **protected branch** | policy, not agent-at-PR-HEAD |
| diff, `type` of each changed file | **HEAD** content | recomputed |
| verdict records | the PR's **record stream**, read via the platform API | read as claims; every derivable property below recomputed |
| latest-covering selection per owed pair | platform comment creation order | **computed by the check** — never an agent's claim about which record is current |
| fingerprint | recomputed via `grove-fp-1` over the review-class basis at HEAD | **never trusted** (AC2) |
| upstream set `U` (fidelity) | derived from HEAD frontmatter / the test-deps ledger | derived, not read from the record |
| recorded `manifest_hashes` | verdict record | used **only** to name §D stale reasons; never for the verdict |
| coverage (does `S` contain the changed file) | recomputed from diff ∩ `S` | recomputed (AC3) |
| `verdict` token | verdict record | **trusted** (genuineness = Layer B, §E) |
| `author` / `reviewer` tags | verdict record (+ frontmatter cross-check) | **trusted, disclosed** (accidental-case only, AC7/§E) |
| human approval of a decision | artifact `status` at HEAD | recomputed from frontmatter |

### C.1 Resolve policy (AC5)

**Assemble** the owed-map from the reviewer charters' declarations, and
load the PASS-class table, artifact-dir list, and the non-behavioral
**allowlist** — all from the **protected branch** commit, not from PR
HEAD. A PR that edits a reviewer charter's declarations (or any policy
input) on its own branch does **not** change the rules its own gate runs
under (S6). The allowlist is the **only** path exemption that exists —
with verdicts living as PR records, **no verdict path exists in the tree
to exempt or defend** (AC5).

### C.2 Derive the owed-coverage set (AC1, AC3, AC4)

For each file `f` in the diff:

1. Classify `type(f)` from HEAD frontmatter (§B); no frontmatter ⇒ `code`;
   unclaimed/unrecognized ⇒ full set.
2. Allowlisted non-behavioral paths (README-class) owe nothing **except**
   that a code-bearing path can never be exempted — the allowlist is an
   allowlist, never a review-free zone for code (S11, AC5).
3. Emit an owed pair `(f, R)` for each `R ∈ owed(type(f))`.

The **owed-coverage set** is the union of all such pairs.

### C.3 Match records (AC1, AC2, AC3)

For each owed pair `(f, R)`: from the record stream, take the **latest
schema-valid record** for `R` whose subject manifest contains `f`
(§A.1's selection rule). The pair is satisfied iff that record is
**all** of:

- **covering** — `f ∈ S` (by selection) (AC3);
- **fresh** — recomputed `grove-fp-1` over the review-class basis at
  HEAD equals the recorded `fingerprint` (AC2, §A.3);
- **passing** — `verdict ∈ PASS-class(R)` (AC1);
- **separated** — passes §C.4;
- **non-vacuous** — `findings` is non-empty (§A.2, §D).

No such record, or the latest covering record failing any condition ⇒
**red** for that pair (AC1), with the §D reason(s).

### C.4 Separation (AC7 — accidental case only)

- **Primary (deterministic):** for each matched record, `reviewer ≠
  author` ⇒ else **red** (S5).
- **Cross-check:** where the subject carries a frontmatter `author`
  field, require `record.author == subject.frontmatter.author` ⇒ else
  **red**. Code (no frontmatter) has no cross-check source; the record's
  self-report stands alone — a **disclosed** Layer B gap (§E).
- Deliberate forgery of either tag is **out of scope** (Layer B, §E,
  AC8).

### C.5 Decision-layer human gate (AC9)

For any changed file whose owed set includes `decision-adversary`, the
check additionally requires the artifact's `status` **at HEAD** to be in
the approved class (the recorded **human intent gate**, `lifecycle.md`).
A bundled *draft* upstream keeps the gate **red** until the human
approves it in-PR (`adr-0012` Consequences; this enforces staged approval
through the existing gate, adds no new rule) (S9). If the
`decision-adversary` PASS-class is not yet available in policy (Open Q1),
a decision-layer change **cannot go green** — fail-closed (S10).

### C.6 Verdict of the check

Green **iff** every owed pair is satisfied (C.3), every separation check
holds (C.4), and every decision-layer human gate is satisfied (C.5).
Otherwise red, naming each failing pair with its §D reason(s). **Green
is non-authorizing** (§D, AC6).

---

## §D — The rendered status view and the reason grammar (AC6)

The check renders one **read-only** status view each run, computed
entirely from the record stream + the check's own recomputation —
**computed, never stored**; no agent writes or mutates it.

- **Per-row** (one per owed pair `(f, R)`): `review | subject | latest
  verdict | fresh? | covers? | separated? | reason(s) if un-green |
  findings`.
- **Append-only visibility:** the view links each pair's full record
  sequence (e.g. FAIL → PASS), never only the latest — a superseded FAIL
  stays readable (S14).
- **Header banner, verbatim intent:** *"Bookkeeping complete — a human
  still judges genuineness and merges. This is NOT approval."* on green;
  the failing pairs + reasons on red.
- The view never carries the words "approved," "reviewed," or "safe to
  merge" for a green result (AC6, S8).

**The reason grammar.** For every un-green pair the view states **why**,
from this enum (all applicable reasons, in this order):

| Reason | Fires when | Payload |
|---|---|---|
| `never-reviewed` | No schema-valid record for `R` covers `f` — including a review run only in session (S15) or a malformed block (S7). | — |
| `changed-since-review` | Latest covering record is stale and a **subject** path's HEAD hash differs from its recorded `manifest_hashes` entry (or attribution is impossible — the unattributed fallback). | The changed subject path(s). |
| `upstream-<path>-changed` | Latest covering record (fidelity) is stale and an **upstream** path's content or membership differs at HEAD. | The upstream file, **named** (e.g. `upstream-decisions/adr-0012….md-changed`). |
| `review-failed` | Latest covering record is fresh but `verdict ∉ PASS-class(R)`. | A link/anchor to that record's inline findings. |
| `self-reviewed` | Latest covering record fails §C.4 (`reviewer == author`, or the cross-check). | The shared tag. |
| `vacuous` | Latest covering record parses, covers, and is fresh, but its `findings` body is empty — a bare token with no evidence to read. | — |

Reason **naming** uses the record's `manifest_hashes` and the check's
own recomputation; the **verdict** never depends on the recorded hashes
(§A.3). *(`vacuous` is a concretization, flagged: `adr-0012`'s
Consequences enumerate the first five; the vacuity backstop closes the
empty-evidence rubber-stamp the five cannot name — disclosed in the
Rubric check.)*

**One derivation, four consumers.** The per-pair rows + reasons are
emitted as the check's structured output (machine-readable alongside the
rendered summary). The same single derivation serves: the **check**'s
red/green, the human-facing **view**, **dispatch** (which reviewer to
re-run), and the re-run reviewer's **scoped work order** (exactly which
pairs and why) — never re-derived divergently, per `adr-0012`'s
computed-never-stored principle.

---

## §E — Non-goals (Layer B — explicitly out of scope)

This spec does **not** specify, and its check does **not** provide
(`adr-0012` Decision-in-brief 3, AC8, Consequences "deferred to Layer B"):

| Non-goal | Why out of scope (Layer A limit disclosed) |
|---|---|
| **Run-attestation / genuineness** | The check trusts the `verdict` token; it cannot prove a genuine non-producer review actually ran. An agent could post a fake passing verdict record. |
| **Forgery-proof separation** | `author`/`reviewer` are self-reported; the check catches **accidental** fusion, never a deliberately forged tag. |
| **Forge-resistant verdict store** | The store is the PR's comment stream; the platform lets a comment's author edit or delete it. Append-only is the convention the check's sequence view makes **visible**, not a tamper-proof guarantee — deliberate edit/delete gaming is Layer B. |
| **Autonomous loop-bounding** | A non-converging revise ↔ re-review cycle is bounded by the **human** (v1); a force-push-stable mechanical bound is Layer B (E7). |

These are named, not pretended. Authenticity and policy changes remain
**human-owned** (AC8).

---

## Acceptance criteria

### Invariants (EARS)

- **INV1 (policy integrity, AC5).** The check **shall** assemble the
  owed-map from the reviewer charters' declarations and **shall**
  resolve the PASS-class table, allowlist, and artifact-dir list from
  the protected default branch, and **shall not** read any of them from
  PR HEAD.
- **INV2 (content basis).** The check **shall** classify each changed
  file's `type`, compute the diff, and recompute fingerprints from PR
  HEAD content.
- **INV3 (freshness by review class, AC2).** The check **shall**
  recompute each matched record's fingerprint via `grove-fp-1` over the
  review-class basis at HEAD — the subject alone for a quality review,
  `S ∪ U(S, HEAD)` for a fidelity review — and **shall** treat any
  mismatch as stale, never trusting the recorded fingerprint or
  `manifest_hashes` for the verdict.
- **INV4 (derived upstream, fidelity).** For fidelity records, the check
  **shall** derive the upstream set `U` itself — from HEAD frontmatter
  `depends_on` for artifacts, from the `adr-0006` per-package test-deps
  ledger for code — and **shall not** read the upstream membership from
  the record.
- **INV5 (completeness, AC1).** The check **shall** go red if any owed
  `(file, review)` pair lacks a latest covering record that is
  schema-valid, fresh, PASS-class, separated, and non-vacuous.
- **INV6 (coverage, AC3).** For a record to cover an owed pair `(f, R)`,
  the check **shall** require `f` to be a member of that record's
  subject manifest `S` — existence alone **shall not** suffice.
- **INV7 (fail-closed type, AC4).** Where a changed file's `type` is
  new, undefined, or claimed by no reviewer declaration, the check
  **shall** assign the full review set as an explicit rule on top of the
  assembly (which alone would fail open); where a file has no
  frontmatter, the check **shall** classify it as `code`.
- **INV8 (separation, AC7).** The check **shall** go red if a matched
  record's `reviewer` equals its `author`, and, where the subject
  carries a frontmatter `author`, if `record.author` differs from it.
- **INV9 (record channel, AC10).** The check **shall** read verdict
  records only from the PR's comment stream via the platform API;
  **shall** treat any content that does not parse against the §A.2
  schema as inert; **shall** itself select the latest covering record
  per owed pair from the platform's comment order; **shall not** count
  any review not recorded on the PR (session context is never a record);
  and **shall not** mutate, or require mutation of, any existing record.
- **INV10 (decision human gate, AC9).** For a changed decision-layer
  artifact, the check **shall** require a PASS-class `decision-adversary`
  record **and** the artifact's `status` at HEAD to be in the approved
  class.
- **INV11 (non-authorizing, AC6).** On green, the check **shall** present
  the result as "bookkeeping complete," and **shall not** label it
  "approved," "reviewed," or "safe to merge."
- **INV12 (no unbuilt infra, AC10).** The check **shall** use only git
  content and existing platform primitives — protected branches, CI, and
  the PR record stream via the platform API — and **shall not** depend
  on run-attestation, an identity service, or a forge-resistant store.
- **INV13 (union owed-set).** For a PR touching multiple files, the check
  **shall** require the union of every changed file's owed reviews, all
  satisfied at HEAD.
- **INV14 (sole path exemption, AC5).** The declared non-behavioral
  allowlist **shall** be the only path exemption the check honors, and
  the check **shall not** exempt any code-bearing path through it.
- **INV15 (reason grammar, AC6).** For every un-green owed pair, the
  check **shall** emit at least one reason from the §D enum —
  `never-reviewed`, `changed-since-review`, `upstream-<path>-changed`
  (naming the file), `review-failed` (linking the record's findings),
  `self-reviewed`, `vacuous` — and **shall** emit the per-pair derivation
  as structured output so the view, dispatch, and the reviewer's scoped
  work order consume the same derivation rather than re-deriving it.

### Scenarios (GWT)

- **S1 (completeness miss, AC1).** *Given* a PR changing `specs/foo.md`
  (type `spec`, owes `spec-adversary` + `conformance`) *and* only a
  passing `conformance` record exists in the stream, *When* the check
  runs, *Then* it goes **red**, naming the `(specs/foo.md,
  spec-adversary)` pair with reason `never-reviewed`.
- **S2 (freshness / spec-revised-underneath, AC2).** *Given* a passing
  `conformance` (fidelity) record over code whose derived upstream
  includes `specs/foo.md`, *When* `specs/foo.md` is edited later in the
  same PR, *Then* the recomputed `grove-fp-1` differs from the recorded
  fingerprint and the check goes **red** (stale) with reason
  `upstream-specs/foo.md-changed`, without anyone re-flagging it by
  hand.
- **S3 (coverage gap, AC3).** *Given* a PR changing `specs/foo.md` and
  `specs/bar.md` *and* a fresh passing `spec-adversary` record whose
  subject manifest lists only `specs/foo.md`, *When* the check runs,
  *Then* it goes **red** on the uncovered `(specs/bar.md, spec-adversary)`
  pair.
- **S4 (fail-closed undefined type, AC4).** *Given* a PR adding
  `x/thing.md` with frontmatter `type: widget` (claimed by no reviewer
  declaration), *When* the check runs, *Then* it requires the **full**
  review set for it and goes red until all are present, fresh, and
  passing.
- **S5 (accidental fusion, AC7).** *Given* a matched `conformance`
  record whose `author` equals its `reviewer`, *When* the check runs,
  *Then* it goes **red** on separation with reason `self-reviewed`,
  regardless of the verdict token.
- **S6 (policy from main, AC5).** *Given* a PR that edits a reviewer
  charter's machine-readable declaration on its own branch so `spec` no
  longer owes `conformance`, *When* the check runs, *Then* it still
  assembles the owed-map from the protected-branch charters and the
  dropped review is still owed.
- **S7 (non-record content is inert, AC10/AC1).** *Given* a PR comment
  containing prose claiming "conformance passed" plus a malformed
  `grove-verdict` block that fails the §A.2 parse, *When* the check
  runs, *Then* neither counts as a record and the owed pair stays
  **red** with reason `never-reviewed` (fail-closed by non-recognition).
  *And given* a schema-valid PASS record whose `findings` body is empty,
  *Then* it satisfies nothing and the pair's reason is `vacuous`.
- **S8 (green non-authorizing, AC6).** *Given* every owed pair satisfied
  at HEAD, *When* the check renders the status view, *Then* the banner
  reads "bookkeeping complete — a human still judges genuineness and
  merges" and nowhere says "approved / reviewed / safe to merge."
- **S9 (bundled draft decision, AC9).** *Given* a PR bundling a new
  decision at `status: draft` with a spec that depends on it, *When* the
  check runs, *Then* the decision-layer human-gate condition is unmet and
  the check is **red** until the human approves the decision in-PR — no
  new bundling rule, the existing gate enforces the ordering.
- **S10 (decision-adversary pass-class unavailable, AC9).** *Given* the
  `decision-adversary` PASS-class is not yet defined in policy, *When* a
  PR changes a decision, *Then* the check **cannot** go green for it
  (fail-closed), never defaulting the decision review to satisfied.
- **S11 (allowlist can't exempt code, AC5).** *Given* a code-bearing path
  listed in the non-behavioral allowlist, *When* the check runs, *Then*
  it still owes `code-reviewer` (+ `conformance`) — the allowlist does
  not exempt code.
- **S12 (union owed-set, INV13).** *Given* a PR carrying one spec, one
  code file, and one research note, *When* the check runs, *Then* the
  owed-set is `{spec: conformance+spec-adversary} ∪ {code:
  conformance+code-reviewer} ∪ {research: none}` and green requires all
  of it at HEAD. *And* a pure deletion whose path appears in a fresh
  record's fingerprint basis recomputes to `ABSENT`, changing the
  fingerprint and marking that record stale.
- **S13 (quality survives an upstream edit; fidelity does not, AC2).**
  *Given* `specs/foo.md` (`depends_on: adr-x`) with a fresh passing
  `spec-adversary` record (basis: the spec alone) *and* a fresh passing
  `conformance` record (basis: spec + `adr-x`), *When* `adr-x` is edited
  in the same PR, *Then* the `conformance` record goes stale with reason
  `upstream-decisions/adr-x….md-changed` **and** the `spec-adversary`
  record remains fresh — the upstream edit invalidates only the fidelity
  verdict, never the quality one.
- **S14 (append-only re-review, AC10).** *Given* the stream holds a
  `conformance` FAIL record for `specs/foo.md` and, later, a fresh
  passing record for the same subject (separated, non-vacuous), *When*
  the check runs, *Then* the latest record counts and the pair is
  satisfied, *and* the status view still shows the FAIL → PASS sequence
  — nothing overwritten, edited, or deleted.
- **S15 (session is not a record, AC1/AC10).** *Given* a `spec-adversary`
  ran in-session and its transcript shows `APPROVE-READY` but no record
  was posted to the PR, *When* the check runs, *Then* the
  `(spec, spec-adversary)` pair is **red** with reason `never-reviewed`
  — the posted record is the commit point; session context never counts.

### Traceability

| adr-0012 AC | Covered by |
|---|---|
| AC1 completeness | INV5, S1, S7, S15 |
| AC2 freshness | INV3, INV4, §A.3, S2, S13 |
| AC3 coverage | INV6, §C.3, S3 |
| AC4 fail-closed | INV7, §B, S4 |
| AC5 policy integrity | INV1, INV14, §C.1/§C.2, S6, S11 |
| AC6 non-authorizing + reasons surfaced | INV11, INV15, §D, S8 |
| AC7 separation | INV8, §C.4, S5 |
| AC8 honest disclosure | §E |
| AC9 decision-adversary | INV10, §B, §C.5, S9, S10 |
| AC10 no infra pretence | INV9, INV12, §A.1, S7, S14, S15 |
| AC11 adr-0006 pointer | Open Q4 (resolved) records the per-layer conformance consistency; §A.3 step 3 consumes `adr-0006` dec 4 as-is; no supersession |

---

## Open questions

1. **`decision-adversary` verdict grammar (blocks S10 resolution).**
   `adr-0012` AC9 charters the `decision-adversary` role but does not pin
   its verdict grammar; the PASS-class table (§A.2) therefore leaves it
   **to be authored** with that charter. This spec pins the **fail-closed
   behavior** (S10) but not the token set. The charter authoring (a
   separate `adr-0012` deliverable) must declare it before the
   decision-layer gate can ever go green. Not invented here.
2. **Code → upstream resolution — RESOLVED (2026-07-16).** Code files carry
   no frontmatter `depends_on`, so the check cannot derive their upstream
   from the code itself. Resolved by folding in the **per-package test-deps
   ledger** (`adr-0006` dec 4, already approved): code's upstream is read from
   the ledger the `executor` maintains (§A.3 step 3), so `U` for code is
   check-derived from a durable, reviewable artifact — not the reviewer's
   per-verdict manifest — and the spec-revised-underneath case (S2) fires for
   code too. A package with no ledger entry falls to the fail-closed FAIL
   backstop (`adr-0005` dec 3). No new machinery: the `executor`'s existing
   ledger duty is the stamping mechanism. The amended `adr-0012` now names
   this resolution itself ("code → conformance (→ its spec, resolved via the
   `adr-0006` test-deps ledger)"). (Note: fundamentally *some* declaration is
   required — code cannot self-describe which spec it implements — so this
   moves the declaration to the best available home, a maintained artifact,
   rather than eliminating it.)
3. **Direct vs. transitive upstream closure (§A.3 step 2).** `U` (fidelity
   basis only, post-split) is pinned to **direct** `depends_on`, to keep
   freshness bounded and match "the review judged against its direct
   upstream." A change two hops up (a spec's decision) does not stale a
   code fidelity record via this check — it is caught by `adr-0006`'s
   pin/version machinery when the intermediate artifact is itself
   re-touched. If experience shows distant-upstream drift must stale
   records directly, this is the dial to revisit. `adr-0012` does not pin
   the depth; direct is this spec's fail-bounded choice, surfaced not
   hidden.
4. **`charter` owed set — RESOLVED (2026-07-16) by the `adr-0012`
   amendment.** The earlier tension (no `charter` row in the owed-map vs.
   `adr-0006` dec 8's charter→ADR conformance review) is gone: the amended
   decision's one-rule projection pins `charter → conformance (→ its
   ADR)` explicitly, exactly `adr-0006` dec 8's review. No charter-layer
   quality specialist exists, and none is invented here. This is also the
   AC11 forward-pointer touchpoint: extension recorded as consistent, no
   supersession.
5. **Provisional upstream — `adr-0012` is `gated`, not `approved`.** The
   contract-author charter derives specs from **approved** decisions; the
   maintainer explicitly authorized proceeding **provisionally** on the
   `gated` `adr-0012` (a disclosed deviation, recorded here). This spec
   must be **re-checked** — and its `depends_on` pin re-confirmed — once
   `adr-0012` is approved, and re-derived if `adr-0012` is amended before
   approval. *(The 2026-07-16 amendment triggered exactly that
   re-derivation; this revision is it — the obligation continues until
   `adr-0012` is approved.)* It must **not** promote past `gated` into any
   executor build while its authorizing decision is still `gated`.
6. **`author` frontmatter field is a new convention (§C.4 cross-check).**
   The separation cross-check reads a frontmatter `author` field on the
   subject; `adr-0012` authorizes "each produced artifact carries a
   self-reported author tag" but does not pin the field name or the
   producers'-charters change that stamps it. The name `author` is this
   spec's concretization; the producer-charter stamping duty is a
   separate `adr-0012` deliverable and is out of this spec's scope.

---

## Rubric check

No project spec-quality rubric is materialized at `<SPEC_RUBRIC_PATH>`
(the repo has no `rubrics/`); this self-check is against the
`contract-author` charter's intrinsic quality bar (testable ACs, both
grammars, non-empty Open questions, no invented scope, deliberate
`depends_on`).

| Criterion | Result | Note |
|---|---|---|
| Frontmatter complete & well-typed | PASS | `id/type/status/depends_on/owner/updated/version`. |
| Versioning discipline | PASS-DISCLOSED | `version` held at 1 through this significant revision — deliberately: the spec is `gated`, pre-approval, never consumed at v1 (pre-gate convergence, the same footing as `adr-0006`'s pre-ratification revisions); the durable decision the change requires **is** the amended `adr-0012` itself. Counter starts moving once the artifact has consumers to pin it. |
| Both grammars present (`adr-0004`) | PASS | 15 EARS invariants + 15 GWT scenarios; neither stands in for the other. |
| ACs testable | PASS | Every INV/S is a deterministic, observable check outcome; the fingerprint algorithm, review-class bases, selection rule, and reason enum are fully specified. |
| Traceability to authorizing decision | PASS | Amended AC1–AC11 mapped (AC5 and AC10 re-mapped to the record-stream model); every pinned mechanism traces to the amended `adr-0012`. |
| Delta note (`adr-0004`, revise-in-place) | PASS | Section-level five-field blockquote + VALUE + CONFIDENCE at the top; prior file-based truth recoverable from it and from `adr-0012`'s Considered-and-rejected. |
| Open questions non-empty & honest | PASS | 6 recorded; Q2 and Q4 marked resolved (with what resolved them), not deleted; the rest are genuine gaps parked, not guessed. |
| No invented scope beyond decision | PARTIAL-DISCLOSED | Four concretizations extend the decision's shorthand in service of its stated rationale, each flagged in place: the `grove-verdict` fenced-block carrier (§A.1); the **latest-covering** selection rule refining "latest per review" for multi-subject PRs (§A.1); recorded `manifest_hashes` powering the reason attribution the decision's grammar requires, never the verdict (§A.2/§A.3); and the `vacuous` reason extending the decision's five enumerated reasons as an empty-evidence backstop (§D). The `decision-adversary` grammar and `author` field remain **parked** (Q1, Q6), not invented. |
| Constrains via tables/enumerations, not prose | PASS | Owed-map, schema, trust boundary, PASS-class, review-class basis, reason grammar, traceability all tabular. |
| Layer B named as non-goal, not specified | PASS | §E enumerates all four Layer B non-goals, updated for the comment-stream store (editable comments disclosed). |
| Provisional-upstream deviation disclosed | PASS | Open Q5 records the `gated`-not-`approved` deviation, this re-derivation, and the standing re-check obligation. |

**Self-check verdict: PASS with disclosures.** The one non-clean line
(invented scope) is disclosed, not silently passed: everything the
amended decision pins is pinned; everything it leaves genuinely open is
an Open question or a flagged concretization, not a silent guess.
Remaining `gated`. `approved` is the human's to give (`lifecycle.md`,
`floor-intent-gate`) — and, per Open Q5, this spec's own authorizing
decision is still `gated`, so it must not be built against until both it
and `adr-0012` clear the human gate.

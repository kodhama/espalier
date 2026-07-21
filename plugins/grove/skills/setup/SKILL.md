---
name: setup
description: Compose grove onto this project — pick which agent roles to install, resolve every placeholder to this project's real conventions, and wire the managed CLAUDE.md block (augment-never-clobber). Use when the user asks to set up, add, install, or compose grove in their repo.
---

# Compose grove into this project

You are composing **grove** — a portable agent-swarm operating model — onto the user's project.
This is **composition, not code generation**: you copy vendored, ready-to-run agent definitions
out of this plugin's `reference/` payload and resolve their placeholders to this project's real
values. Nothing here is invented from scratch, and nothing outside what's listed below is touched
(augment, never clobber — the same discipline Trellis's own `/trellis:setup` uses).

## 1. Pick which agent roles to compose

Ask which of the thirteen agent roles to install; default to **all thirteen** if the user has no
preference. Show the roster (from `${CLAUDE_PLUGIN_ROOT}/reference/agents/README.md`) so they can
pick a subset if they want a lighter install:

`divergent-researcher`, `shaper`, `decision-adversary`, `contract-author`, `spec-adversary`,
`executor`, `conformance-reviewer`, `code-reviewer`, `validator`, `dispatcher`, `run-resumer`,
`propagation-remediator`, `corpus-reviewer`.

## 2. Copy the chosen agent definitions

For each chosen role, copy `${CLAUDE_PLUGIN_ROOT}/reference/agents/<role>.md` into this project's
`.claude/agents/<role>.md`, **stripping the vendoring header** (the first line, a
`<!-- vendored from ... -->` HTML comment — it exists only so the payload inside this plugin stays
traceable to grove's own canonical copy; the file Claude Code loads as a subagent must start with
its `---` frontmatter delimiter, not a comment above it).

Also copy `reference/agents/README.md` into `.claude/agents/README.md` (same header-stripping),
adapted in step 3 below along with everything else. And copy
`${CLAUDE_PLUGIN_ROOT}/reference/lifecycle.md` into `.grove/internal/lifecycle.md` (same
header-stripping; create the `.grove/internal/` directory if it doesn't exist) — the lifecycle
companion (`adr-0008`, as amended by `adr-0018` D5): the artifact-lifecycle state enum, stated once,
that every role and the `corpus-reviewer`'s lifecycle check source. It lands in grove's own
**`.grove/internal/`** namespace — the grove-authoritative subtree (copied/regenerated verbatim on
update; `adr-0018` D5), kept apart from the consumer-authoritative `.grove/` root (`gates.toml`)
and from `.claude/agents/`, which is Claude Code's loader directory and parses files
as subagents (the same overlay move as trellis's `.trellis/`). It is not an agent role and is not
optional per role — every install gets it. Likewise copy
`${CLAUDE_PLUGIN_ROOT}/reference/versioning.md` into
`.grove/internal/versioning.md` (same header-stripping) — the versioning
companion (`adr-0010`): the conformance-detection semantics (version
kinds and forms, `@version` pins, the `changes:` cross-check), stated
once, that the versioning-touching roles source. Likewise copy
`${CLAUDE_PLUGIN_ROOT}/reference/relations.md` into
`.grove/internal/relations.md` (same header-stripping) — the relations companion
(`adr-0011`): the artifact **edge taxonomy** (`depends_on`, `informed_by`,
`superseded_by`/`superseded_in_part_by`, `changes:` — which is flow,
which bears drift), stated once, that `shaper`, `corpus-reviewer`,
`conformance-reviewer`, and `validator` source. If any copied file (a role's, the README, or a
companion — lifecycle, versioning, relations) already exists at the destination, **never overwrite it silently** — ask
the user whether to overwrite, skip, or diff first, and honor their answer per file.

### 2a. The gate-profile — every install gets one (`adr-0018`)

The **gate-profile** assigns **C2** — who is *required* at each of grove's four
gates (`intent` / `spec` / `build` / `ship`), `human` or `agent` — and is core,
not optional: every install gets it (like the companions above). Three pieces:

1. **The floor-guard machinery.** Copy `${CLAUDE_PLUGIN_ROOT}/gates/` — its
   `lib/`, `bin/`, and `package.json` — into this project's
   **`.grove/internal/gates/`** (grove-authoritative; regenerated on update).
   Zero-dependency, so **no `npm install`**. Do **not** copy grove's own `test/`
   dir or `test-deps.md`. This is the load-time floor-guard (`adr-0018` D8):
   whatever sequences a run reads `.grove/gates.toml` through
   `node .grove/internal/gates/bin/resolve-profile.mjs` and gets a `guardian`
   fallback + loud warning on any missing / unreadable / floor-violating profile.

2. **The C1 enforcement defaults.** Copy
   `${CLAUDE_PLUGIN_ROOT}/reference/gates/enforcement.toml` into
   **`.grove/internal/enforcement.toml`** (grove-managed C1; `adr-0018` D4 — the
   profile configures only C2, C1 is grove-fixed and not a user surface).

3. **The gate-profile itself — ask ONE optional question, then write the rows.**
   The preset choice is an **optional question with `steward` as the default** —
   **never a forced pick** (honors `adr-0014`: install is invisible and ungated;
   `adr-0018` D1/D6). Offer the three, one line each, and take `steward` if the
   user has no preference:

   - **steward** *(default)* — "you approve direction + final result; agents
     handle spec and build";
   - **guardian** — "you also approve the spec before build";
   - **initiator** — "you kick off intent and approve only the final result".

   Then write **`.grove/gates.toml`** (consumer-authoritative — the `.grove/`
   root, not `internal/`) as an **explicit full table** seeded from the chosen
   preset (`adr-0018` D7). Use `${CLAUDE_PLUGIN_ROOT}/reference/gates/gates.toml`
   as the shape and set the four `[gates]` rows + `seeded_from` to the chosen
   preset's values:

   | Preset | intent | spec | build | ship |
   |---|---|---|---|---|
   | **steward** | human | agent | agent | human |
   | **guardian** | human | human | agent | human |
   | **initiator** | agent | agent | agent | human |

   Keep the template's `[trigger]` and `[intent_external]` sections verbatim.
   The four rows are the **source of truth**; `seeded_from` is provenance only.
   **Non-clobber:** if `.grove/gates.toml` already exists, ask before
   overwriting (same discipline as the companions). Then **validate the write**
   with `node .grove/internal/gates/bin/resolve-profile.mjs .grove/gates.toml` —
   it must exit `0` (a clean, floor-satisfying profile); exit `2` means the
   guard fell back to `guardian`, which a fresh preset seed should never trigger
   — fix the file rather than leave it. Tell the user they can switch presets
   later with **`/grove:set-profile <preset>`** or hand-edit a single row, and
   that the **floor** (`adr-0018`) always holds: at least one human intent-locus
   gate (`intent = human` OR `ship = human`), enforced on every run-sequencing
   read.

## 3. Resolve every placeholder, interactively

Grep the freshly copied files for every remaining angle-bracket placeholder:

```sh
grep -rn '<[A-Z_]\+>' .claude/agents/
```

This project's copies carry these tokens (not all appear in every file):

| Token | Appears in | What to ask |
|---|---|---|
| `<TEST_CMD>` | `executor.md`, `conformance-reviewer.md` | this project's test command |
| `<TYPECHECK_CMD>` | `executor.md`, `conformance-reviewer.md` | this project's typecheck command (or "none — untyped" if genuinely none) |
| `<PR_CONTRACT_SECTIONS>` | `conformance-reviewer.md`, `propagation-remediator.md`, `run-resumer.md` | which sections a PR body must carry (e.g. `## Propagation`, `## Recommended next task`) — first ask which VCS/host and issue tracker this project uses (GitHub PRs, GitLab MRs, plain git + no tracker, …), since the answer shapes how this resolves |
| `<PARKED_ITEM_STORE>` | `conformance-reviewer.md`, `propagation-remediator.md` | where this project tracks deferred/parked items (a TODO/ROADMAP file, a `decisions/` entry, issue labels, …) |
| `<CONVENTIONS_PATH>` | `code-reviewer.md` | where this project declares its code conventions — its CLAUDE.md, a style guide, or equivalent ("none exists yet" is a valid honest resolution; the charter's language-agnostic fallback then applies, and the role flags the absence as a finding) |
| `<LINT_CMD>` | `code-reviewer.md` | this project's lint/formatter command (or "none — no linter configured" if genuinely none) |
| `<QUALITY_RUBRIC_PATH>` | `code-reviewer.md` | this project's code-quality rubric path — optional by charter, so "none exists yet" is a fully valid resolution |
| `<SPEC_RUBRIC_PATH>` | `contract-author.md` | this project's spec-quality rubric path |
| `<RESEARCH_RUBRIC_PATH>` | `divergent-researcher.md` | this project's research-quality rubric path |
| `<ARTIFACT_DIRS>` | `corpus-reviewer.md` | this project's corpus directories (family default: `decisions/`, `specs/`; add what the project keeps) |
| `<ARTIFACT_CONTRACT_PATHS>` | `corpus-reviewer.md` | where this project declares its artifact contract (family default: `decisions/README.md` + `specs/README.md`) |
| `<REPO_TYPED_CHECKS>` | `corpus-reviewer.md` | any repo-typed extra checks this project declares beyond the family core ("none" is a valid resolution) |

Ask about each token **once** (the same answer applies everywhere it appears), then edit it inline
in every file that carries it — the resolved value replaces the token, in place, in running prose.

**Where the project genuinely has no such convention, write an explicit honest statement instead of
inventing process** — e.g. "this project has no CI-enforced PR-body contract as of this writing (no
`.github/workflows`, no PR template) — flagged here rather than silently assumed; check this by hand
until one exists." This is not a fallback of last resort — it is the correct resolution whenever the
convention genuinely doesn't exist yet. The precedent for this exact move is
[wisp's own B4 install](https://github.com/kodhama/wisp) (grove composed onto wisp itself,
lane B4 of the suite-lift plan): several of its resolved placeholders read exactly this way.

**`.claude/agents/README.md` needs the same treatment, but in prose, not tokens.** Its own text
mentions placeholder tokens illustratively (e.g. "angle-bracketed tokens like `<TEST_CMD>`") — once
real values are resolved, rewrite that sentence to describe what was resolved (test command,
typecheck command, spec-rubric path, parked-item store, PR-contract sections, and so on — named in
words, not repeating the bracket syntax) rather than leaving a literal token sitting in a file that
claims to be fully resolved. Follow wisp's own vendored `README.md` as the model for this rewrite.

**Zero literal `<[A-Z_]+>` markers may remain in `.claude/agents/` when this step is done.** Re-run
the grep above to confirm.

## 4. Drop the `## Placeholders` section from each resolved file

Once a file's placeholders are all resolved inline, delete its trailing `## Placeholders` section
entirely (the wisp/math-quest precedent: a fully resolved file doesn't carry a section listing
tokens that no longer exist in it).

## 5. Seed minimal `decisions/` and `specs/` stores, if missing

If this project has no `decisions/README.md` or `specs/README.md`, seed minimal ones — model:
grove's own (`decisions/README.md`, `specs/README.md` in the grove repo). Each should cover: the
shared artifact frontmatter (`id/type/status/depends_on/owner/updated`) and — for `decisions/` —
the append-only rule (never edit a ratified decision in place; supersede with a forward pointer).
Do **not** seed the lifecycle state enum or its state semantics — those live in the lifecycle
companion this install already landed at `.grove/internal/lifecycle.md` (step 2, `adr-0008` as amended); a
seeded README points there instead of restating them. Adapt, don't invent a heavier process than
grove's own.

## 6. Compose the managed block into `CLAUDE.md`

Append this block to the project's `CLAUDE.md` (create the file if it doesn't exist). Touch
**nothing else** in the file. **Before editing, save a pre-write copy** of the existing `CLAUDE.md`
somewhere temporary (skip if the file doesn't exist yet) — the verification below diffs against it.
Fill in `<ROLES_LIST>` with the roles actually installed (e.g. "all fourteen roles" or a named
subset) and `<SHA>` with the output of
`git -C "${CLAUDE_PLUGIN_ROOT}" rev-parse --short HEAD` (if that command fails — not a git checkout
— use `unknown`; an honest stamp beats none):

```
<!-- grove:begin (managed by grove — edit .claude/agents/, not this block) -->
Work items matching a grove workflow (W1–W6 — e.g. a bug report → the bug pipeline, a
research ask → divergent research) run as grove runs, sequenced through the chartered
agent roles in `.claude/agents/` (<ROLES_LIST>). Anything else — conversation, trivial
asks, out-of-scope questions — proceeds normally.
grove plugin@<SHA>
<!-- grove:end -->
```

If a `grove:begin … grove:end` block already exists (a re-run), **replace only what is between the
markers** — idempotent, never a second block, never a change outside the markers.

**Verify the write.** After composing the block, check both of these:

1. **Exactly one block**: `grep -c 'grove:begin' CLAUDE.md` and `grep -c 'grove:end' CLAUDE.md`
   must each print `1`.
2. **Nothing outside the markers changed**: `diff` the pre-write copy against the new file — every
   changed or added line must lie between the markers (on a first install: one appended block and
   nothing else; on a file grove created: the block is the whole file).

If either check fails, **fix it before moving on**: restore from the pre-write copy and re-attempt
the edit once. If it fails again, stop — show the user the pre-write copy's location, the exact
diff, and the intended block, and say plainly that the write misfired. **Never leave a mangled
`CLAUDE.md` silently in place.** A misfire here — observed by you or reported by a user — fires the
armed trigger in grove's `decisions/adr-0003-managed-block-routing-rule.md`: report it as an issue
on `kodhama/grove`, so this prose edit gets replaced by a bundled deterministic upsert script.

## 7. Offer to make grove invisible to the consumer's tooling (whole `.grove/`)

`.grove/` is grove's vendored namespace — the companions and the gate-profile machinery. It is a
**dependency, not the consumer's own source**, so the consumer's linters and formatters have no
business reading it. A *formatter* is the acute danger, not just lint noise: `.grove/`'s companions
are **markdown**, and a formatter that rewrites vendored files **corrupts** them rather than merely
flagging them. So **offer** — never impose — to add the whole `.grove/` namespace to each detected
tool's ignore.

**Detect** which of these the project uses, by config presence. Report each honestly: a tool whose
config is genuinely absent is **"none found,"** never a false claim of having ignored it.

| Tool | Detect by | Where `.grove/` goes |
|---|---|---|
| ESLint | `.eslintrc*`, `eslint.config.*`, or an `eslintConfig` key in `package.json` | `.eslintignore` if it exists; else the `ignores` field of `eslint.config.*`; else create `.eslintignore` |
| Prettier | `.prettierrc*` or `.prettierignore` | `.prettierignore` (create it if only a `.prettierrc*` exists) |
| Biome | `biome.json` | the `files.ignore` array in `biome.json` |
| markdownlint | `.markdownlint*` (e.g. `.markdownlintrc`, `.markdownlint.json`, `.markdownlint.yaml`) | `.markdownlintignore` if it exists; else create it |

For each **detected** tool, ask the user whether to add `.grove/` to its ignore (one grouped offer
naming each found tool is fine). Only on a **yes** do you write — **consent is required; write
nothing without it.** If declined, note that plainly and move on; nothing is changed.

**Augment-never-clobber, the same discipline as everywhere else in setup:**

- If `.grove/` (or a glob that already covers it, e.g. `.grove/**`) is already ignored, it is
  already done — **skip it, touch nothing.**
- Add the single `.grove/` entry and **touch no other line** of the file.
- Create an ignore file **only** when the tool uses a dedicated one and none exists (per the table
  above); never create config a tool doesn't already use.

**This is the one place setup writes outside grove's own footprint** — outside the `.grove/` overlay
and the managed `CLAUDE.md` block. Treat it as exactly that: an **offered, consented,
augment-never-clobber exception**, and in the step 10 confirm name precisely which ignore file and
which line you touched (or that none were, or that the offer was declined). Never a silent write.

## 8. Telemetry (optional — grove never requires it)

Ask whether [wisp](https://github.com/kodhama/wisp) is vendored or otherwise available in this
project.

- **If yes:** copy `${CLAUDE_PLUGIN_ROOT}/reference/skills/grove-status/SKILL.md` into this
  project's `.claude/skills/grove-status/SKILL.md` (stripping the vendoring header, same as step 2),
  resolve `<WISP_VENDOR_PATH>` to wherever wisp actually lives in this project (e.g. `tools/wisp/`,
  or `.` if this project *is* wisp), and drop its own `## Placeholders` section once resolved.
- **If no:** don't install the skill. Mention `github.com/kodhama/wisp` as where it lives if they
  want live dashboard telemetry later, and move on — grove's agent roles work fully without it.

## 9. Recommend, don't install, Trellis

Close by telling the user grove pairs with the governance layer it runs under, but do **not**
install it yourself:

> grove composes the swarm; [Trellis](https://github.com/kodhama/trellis) is the governance layer
> it runs under. If you want that too: `/plugin install trellis@kodhama` then `/trellis:setup`.
> Recommended, not required — grove works standalone.

## 10. Confirm

Tell the user exactly what you wrote: which roles landed in `.claude/agents/` (and which existing
files, if any, you skipped rather than overwrote), every placeholder you resolved and to what value
(or the honest "none exists yet" statements you wrote instead), the **gate-profile** — which preset
you seeded `.grove/gates.toml` from (or `steward` by default) and that the floor-guard machinery
(`.grove/internal/gates/`) and C1 defaults (`.grove/internal/enforcement.toml`) landed — whether
`decisions/`/`specs/` were seeded, the `CLAUDE.md` block, whether the
telemetry skill was composed, and **which tooling-ignore files and lines step 7 touched** (naming
each `.grove/` line and its file — or that no linter/formatter was found, or that the offer was
declined). They can remove all of it any time with `/grove:remove`.

## 11. Hand back — grove wrote no git; landing is yours

Setup composes files; it does **not** land them. Perform **no git** of your own — no `add`, no
`commit`, no branch, no push, no PR — and **recommend no landing approach**: not a direct commit,
not a PR, not committing anywhere. **Never** commit onto the current branch (least of all
`main`/`master`). Instead, surface the uncommitted state plainly (run `git status --short`) and hand
the decision back:

> Setup is done — and I performed no git: no add, no commit, no branch, no push, no PR. Here is
> what is now uncommitted in your working tree: **[list the changed/added paths]**. Landing these is
> yours, your project's own way — I'm not recommending a direct commit, a PR, or committing
> anywhere. Setup runs inline in this session, so any landing opinion here would bias how you handle
> git for your own unrelated work; that call is yours, not grove's.

**Why the restraint, stated (not just done):** setup runs inline in the consumer's own session, so
a landing recommendation ("commit it to `main`," "open a PR") injects grove's git preference into a
project that has its own conventions. The neutral hand-back points back at *their* defaults; the
recommendation is the opinion setup must not carry.

**On an autonomous run with no human to answer** (an unattended session), do not improvise a
landing: leave the change in the working tree, report what is uncommitted, and stop. Never land
unasked.

---
name: check-install
description: Install grove's GitHub review-bookkeeping check standalone — the check runtime, the workflow, the policy carrier, and the recorded scope mode — without re-running the rest of grove setup. Use when the user asks to install, add, or enable the grove CI check / bookkeeping check, including after declining it during /grove:setup.
---

# Install the GitHub bookkeeping check (standalone)

This is `/grove:setup` **step 7 on its own**: install the
review-bookkeeping check (`spec-0002`, `adr-0012` Layer A) into a
project where grove is (or will be) composed, **without re-running the
rest of setup** — no role picking, no placeholder pass, no `CLAUDE.md`
block. What the check is and what its green/red mean is written up in
`${CLAUDE_PLUGIN_ROOT}/reference/ci/README.md` — offer it to a user who
wants the orientation first.

**Invoking this skill IS the opt-in.** Do not re-ask whether they want
the check (setup's offer/decline gate does not apply here); every other
gate and discipline below still does. If the user changes their mind
mid-way, stop cleanly and say exactly what was and wasn't written.

## 1. Gate: GitHub Actions only

Setup step 3's VCS answer isn't available in a standalone run, so
establish it yourself: check `git remote -v` for a `github.com` remote
(or ask if it's ambiguous — e.g. no remote yet). If this project won't
run GitHub Actions — GitLab, plain git, anything else — **stop and say
so plainly**: the check is GitHub-only today, nothing else in this
skill applies, and nothing was written.

## 2. Preflight, honestly stated

- Create `.grove/` if it doesn't exist (a check-only install into a
  project that hasn't run `/grove:setup` yet is legitimate).
- Check `.claude/agents/` for composed reviewer agents. If none exist,
  **warn before proceeding**: the check assembles its owed-review map
  live from those declarations, so with none installed it runs
  fail-closed (red on decision-layer changes, full owed set on
  unclaimed types) until `/grove:setup` composes the roles. Proceed
  only if the user still wants the check first.

## 3. Run setup's own install procedure

Read `${CLAUDE_PLUGIN_ROOT}/skills/setup/SKILL.md`, **step 7 only**,
and execute its opt-in path: all **four pieces** — the `.grove/check/`
runtime copy, the workflow copy with its `<INSTALL_PATH>` /
`<NODE_VERSION>` resolution (ask for the Node version, same as there),
the `.grove/review-policy.md` policy carrier, and **the scope question
with its three-key write** (`scope` + `check_runtime_dir` +
`check_workflow_path` — every install writes all three explicitly,
`adr-0013` AC5). That step's text is the **canonical install
procedure**; this skill deliberately executes it by reference rather
than carrying a second copy, so the two entry points can never drift.

Standalone deltas — the only ways this run differs from running step 7
inside setup:

- Step 7's opening gate paragraph (the host check and the opt-in offer,
  including its decline branch) is replaced by steps 1–2 above.
- References to earlier setup steps (e.g. "you already learned the
  VCS/host in step 3") don't hold — you resolved those in step 1 here.
- Same **ask-before-overwrite** discipline, per file: a re-run over an
  existing install (repair, update) is a normal use of this skill, and
  nothing is ever clobbered silently.

## 4. Confirm

Confirm exactly what was written — the `.grove/check/` runtime, the
workflow file, and `.grove/review-policy.md` including the recorded
`scope` mode and the two carrier-path keys (and which existing files,
if any, were skipped rather than overwritten). Name the exits too, so
the user isn't left hunting: removal is **`/grove:remove`** (its
check-removal step reverses exactly these pieces and only them), and
the full grove composition — the agent roles this check reads its
owed-map from — is **`/grove:setup`**.

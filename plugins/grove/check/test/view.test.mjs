// The rendered status view + reason grammar (spec-0002 §D; INV11, INV15; S8,
// S14). One derivation, four consumers: the rendered text and the structured
// output are the SAME single derivation. Green is non-authorizing — the view
// never carries "approved" / "reviewed" / "safe to merge".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderView, render } from '../lib/view.mjs';

const GREEN_BANNER = 'Bookkeeping complete — a human still judges genuineness and merges. This is NOT approval.';
const FORBIDDEN = ['approved', 'reviewed', 'safe to merge'];

test('S8 — green renders the verbatim non-authorizing banner', () => {
  const text = renderView({ green: true, rows: [], rejectedRecords: [] });
  assert.ok(text.includes(GREEN_BANNER));
});

test('S8 — a green view never says approved / reviewed / safe to merge (AC6)', () => {
  const derivation = {
    green: true,
    rows: [
      { kind: 'pair', review: 'conformance', subject: 'specs/foo.md', latestVerdict: 'PASS', fresh: true, covers: true, separated: true, recordSequence: [{ verdict: 'PASS' }], reasons: [] },
      { kind: 'pair', review: 'spec-adversary', subject: 'specs/foo.md', latestVerdict: 'APPROVE-READY', fresh: true, covers: true, separated: true, recordSequence: [{ verdict: 'APPROVE-READY' }], reasons: [] },
    ],
    rejectedRecords: [],
  };
  const lower = renderView(derivation).toLowerCase();
  for (const w of FORBIDDEN) assert.ok(!lower.includes(w), `must not contain "${w}"`);
});

test('S14 — the append-only FAIL → PASS sequence stays readable (even on green)', () => {
  const derivation = {
    green: true,
    rows: [
      { kind: 'pair', review: 'conformance', subject: 'specs/foo.md', latestVerdict: 'PASS', fresh: true, covers: true, separated: true, recordSequence: [{ verdict: 'FAIL' }, { verdict: 'PASS' }], reasons: [] },
    ],
    rejectedRecords: [],
  };
  const text = renderView(derivation);
  assert.ok(text.includes('FAIL → PASS'));
  // still non-authorizing
  const lower = text.toLowerCase();
  for (const w of FORBIDDEN) assert.ok(!lower.includes(w));
});

test('red — each un-green row states its reason token(s) from the §D enum', () => {
  const derivation = {
    green: false,
    rows: [
      { kind: 'pair', review: 'spec-adversary', subject: 'specs/bar.md', latestVerdict: null, fresh: null, covers: false, separated: null, recordSequence: [], reasons: [{ code: 'never-reviewed', token: 'never-reviewed' }] },
      { kind: 'pair', review: 'conformance', subject: 'specs/foo.md', latestVerdict: 'PASS', fresh: false, covers: true, separated: true, recordSequence: [], reasons: [{ code: 'upstream-changed', token: 'upstream-decisions/adr-x.md-changed' }] },
    ],
    rejectedRecords: [],
  };
  const text = renderView(derivation);
  assert.ok(text.includes('never-reviewed'));
  assert.ok(text.includes('upstream-decisions/adr-x.md-changed'));
  assert.ok(text.includes('specs/bar.md'));
});

test('rejected records are surfaced in the rendered view with their cause (§A.4)', () => {
  const derivation = {
    green: false,
    rows: [{ kind: 'pair', review: 'conformance', subject: 'specs/foo.md', latestVerdict: null, fresh: null, covers: false, separated: null, recordSequence: [], reasons: [{ code: 'record-rejected', token: 'record-rejected' }] }],
    rejectedRecords: [{ cause: 'edited', review: 'conformance', author: 'mallory', id: 7 }],
  };
  const text = renderView(derivation);
  assert.ok(text.toLowerCase().includes('edited'));
});

test('render() emits the SAME single derivation as structured output alongside the text', () => {
  const derivation = { green: true, rows: [], rejectedRecords: [] };
  const out = render(derivation);
  assert.equal(out.structured, derivation);
  assert.equal(typeof out.text, 'string');
});

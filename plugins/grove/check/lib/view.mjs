// The rendered status view + reason grammar (spec-0002 §D; INV11, INV15).
//
// ONE derivation, four consumers: the check's red/green, the human-facing view,
// dispatch routing, and the reviewer's scoped work order all consume the SAME
// structure. `render()` returns the rendered text alongside that structure
// verbatim — never a divergent re-derivation.
//
// Green is NON-AUTHORIZING: the banner is verbatim and the view never carries
// "approved" / "reviewed" / "safe to merge" (AC6, S8).

const GREEN_BANNER =
  'Bookkeeping complete — a human still judges genuineness and merges. This is NOT approval.';

function fmt(v) {
  if (v === null || v === undefined) return '—';
  return v ? 'yes' : 'no';
}

function renderRow(row) {
  const rev = row.review || '(file)';
  const parts = [
    `${rev} | ${row.subject}`,
    `verdict=${row.latestVerdict == null ? '—' : row.latestVerdict}`,
    `fresh=${fmt(row.fresh)}`,
    `covers=${fmt(row.covers)}`,
    `separated=${fmt(row.separated)}`,
    `reasons: ${row.reasons.map((r) => r.token).join(', ')}`,
  ];
  return '- ' + parts.join(' | ');
}

// renderView(derivation) -> the human-facing text summary.
export function renderView(derivation) {
  const { green, rows = [], rejectedRecords = [] } = derivation;
  const out = [];

  if (green) {
    out.push(GREEN_BANNER);
  } else {
    out.push('Bookkeeping incomplete — the following owed rows are not satisfied:');
    for (const row of rows) {
      if (row.reasons.length === 0) continue;
      out.push(renderRow(row));
    }
  }

  // Append-only visibility (S14): the full record sequence per pair stays
  // readable — a superseded FAIL never disappears behind the latest.
  const seqLines = [];
  for (const row of rows) {
    if (row.recordSequence && row.recordSequence.length > 1) {
      const seq = row.recordSequence.map((s) => s.verdict).join(' → ');
      seqLines.push(`- ${row.review || '(file)'} | ${row.subject}: ${seq}`);
    }
  }
  if (seqLines.length) out.push('', 'Record history (append-only):', ...seqLines);

  // Rejected records are ALWAYS surfaced (§A.4), blocking or not.
  if (rejectedRecords.length) {
    out.push('', 'Rejected records (surfaced integrity findings):');
    for (const rej of rejectedRecords) {
      out.push(`- ${rej.cause}: ${rej.review || '?'} by ${rej.author || '?'} (comment ${rej.id == null ? '?' : rej.id})`);
    }
  }

  return out.join('\n');
}

// render(derivation) -> { text, structured }. The structured output IS the
// derivation, unchanged (INV15: the view and dispatch consume one derivation).
export function render(derivation) {
  return { text: renderView(derivation), structured: derivation };
}

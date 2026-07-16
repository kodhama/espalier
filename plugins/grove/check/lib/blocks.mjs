// Shared fenced-block extraction. grove's machine-readable surfaces are all
// fenced blocks with a tag info-string (grove-verdict, grove-review-policy,
// grove-review-declaration, grove-test-deps).

export function extractFencedBlocks(body, tag) {
  if (body == null) return [];
  const open = new RegExp('^\\s*`{3,}' + tag + '\\s*$');
  const anyFence = /^\s*`{3,}\s*$/;
  const lines = String(body).replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    if (open.test(lines[i])) {
      const inner = [];
      i++;
      let closed = false;
      while (i < lines.length) {
        if (anyFence.test(lines[i])) { closed = true; i++; break; }
        inner.push(lines[i]);
        i++;
      }
      if (closed) blocks.push(inner.join('\n'));
    } else {
      i++;
    }
  }
  return blocks;
}

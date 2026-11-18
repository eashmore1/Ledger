#!/usr/bin/env node
// Checks one question file without building anything:
//   node scripts/check-qbank-file.js qbank/src/FAR/leases-asc-842.json
'use strict';
const fs = require('fs');
const { validQ, dedupe } = require('../api/generate-bank.js')._test;
const POS = /\b(choice|option|answer)\s*\(?[A-D]\)?(?![a-z])|\([A-D]\)|\b(all|none|both) of the (above|following|choices)\b/i;
const file = process.argv[2];
let list;
try { list = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.error('NOT VALID JSON: ' + e.message); process.exit(1); }
if (!Array.isArray(list)) { console.error('Top level must be an array'); process.exit(1); }
let bad = 0;
list.forEach((x, i) => {
  if (!validQ(x)) { bad++; console.error('#' + i + ' invalid (needs q, exactly 4 distinct non-empty choices, correct 0-3, exp)'); }
  else if (POS.test(x.exp) || x.choices.some(c => POS.test(c))) { bad++; console.error('#' + i + ' refers to a choice by letter or uses all/none of the above'); }
});
const counts = [0, 0, 0, 0]; list.forEach(x => { if (x && x.correct >= 0 && x.correct <= 3) counts[x.correct]++; });
const dupes = list.length - dedupe([], list.filter(validQ)).length - bad;
console.log(list.length + ' questions, ' + bad + ' problems, ' + Math.max(0, dupes) + ' near-duplicates, correct positions ' + counts.join('/'));
process.exit(bad ? 1 : 0);

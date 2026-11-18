#!/usr/bin/env node
// Builds the question files that ship with the app.
//
//   qbank/src/{SECTION}/{topic-slug}.json   source: an array of {q, choices[4], correct, exp}
//   qbank/{SECTION}.json                    built:  {section, count, topics:[{topic, slug, questions}]}
//
// Each question is checked (4 distinct choices, a valid answer index, an
// explanation), near-duplicates within a section are dropped, and answer
// positions are shuffled where nothing refers to a letter. The shuffle is
// seeded so rebuilding gives the same file. Run: node scripts/build-qbank.js
'use strict';
const fs = require('fs');
const path = require('path');
const { TOPICS, slugify, dedupe, validQ, shuffleChoices } = require('../api/generate-bank.js')._test;

const ROOT = path.join(__dirname, '..', 'qbank');

function seeded(seed){
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1e9) / 1e9; };
}

function build(root = ROOT, { write = true } = {}){
  const report = {}, built = {};
  let problems = 0;
  for (const section of Object.keys(TOPICS)) {
    const dir = path.join(root, 'src', section);
    if (!fs.existsSync(dir)) continue;
    const names = new Map(TOPICS[section].map(t => [slugify(t), t]));
    const out = { section, count: 0, topics: [] };
    const sectionSoFar = [];
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
      const slug = file.replace(/\.json$/, '');
      let raw;
      try { raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')); }
      catch (e) { console.error(section + '/' + file + ': not valid JSON (' + e.message + ')'); problems++; continue; }
      const list = Array.isArray(raw) ? raw : raw.questions;
      if (!Array.isArray(list)) { console.error(section + '/' + file + ': expected an array'); problems++; continue; }
      const valid = list.map(validQ).filter(Boolean);
      const bad = list.length - valid.length;
      const fresh = dedupe(sectionSoFar, valid);
      sectionSoFar.push(...fresh);
      const rnd = seeded(section + '/' + slug);
      const questions = fresh.map(x => shuffleChoices(x, rnd));
      out.topics.push({ topic: names.get(slug) || slug, slug, questions });
      out.count += questions.length;
      report[section + '/' + slug] = { kept: questions.length, invalid: bad, duplicates: valid.length - fresh.length };
    }
    built[section] = out;
    if (write) {
      fs.writeFileSync(path.join(root, section + '.json'), JSON.stringify(out));
      console.log(section + ': ' + out.count + ' questions in ' + out.topics.length + ' topics');
    }
  }
  return { report, problems, built };
}

if (require.main === module) {
  const { report, problems } = build();
  for (const [k, v] of Object.entries(report)) if (v.invalid || v.duplicates) console.log('  ' + k + ': dropped ' + v.invalid + ' invalid, ' + v.duplicates + ' duplicate');
  process.exit(problems ? 1 : 0);
}
module.exports = { build };

// The app's code lives in js/*.js and css/app.css, loaded in order by index.html.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { build } = require('../scripts/stamp-assets');
const { check, appScripts } = require('../scripts/check-load-order');

const ROOT = path.join(__dirname, '..');

test('every app file is loaded by index.html, once', () => {
  const loaded = appScripts();
  assert.ok(loaded.length > 10, 'index.html loads the js/ files');
  assert.equal(new Set(loaded).size, loaded.length, 'no file is loaded twice');
  const onDisk = fs.readdirSync(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js')).map((f) => 'js/' + f).sort();
  assert.deepEqual([...loaded].sort(), onDisk, 'every js/ file is in index.html, and nothing missing is');
});

test('no file runs code from a file that loads after it', () => {
  assert.deepEqual(check().problems, []);
});

test('asset ?v= stamps in index.html and sw.js match the files (run node scripts/stamp-assets.js)', () => {
  const r = build();
  assert.equal(r.newHtml, r.html, 'index.html stamps are stale');
  assert.equal(r.newSw, r.sw, 'sw.js shell list is stale');
});

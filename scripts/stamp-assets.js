#!/usr/bin/env node
// Stamps every local script and stylesheet in index.html with a hash of its
// contents (?v=1a2b3c4d), and lists the same URLs in sw.js's offline shell.
//
// Why: the service worker answers .js/.css from cache first. When a file's
// contents change, its URL has to change too, or returning visitors would run
// the old file next to a new index.html. Run this after editing anything in
// js/ or css/ (npm test fails if you forget):
//
//   node scripts/stamp-assets.js          rewrite index.html and sw.js
//   node scripts/stamp-assets.js --check  exit 1 if they're out of date
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const SW = path.join(ROOT, 'sw.js');
// Shell entries that aren't stamped assets.
const SHELL_EXTRA_HEAD = ['/', '/logo.svg'];
const SHELL_EXTRA_TAIL = ['/fonts/fonts.css', '/fonts/libre-franklin-latin-wght-normal.woff2', '/fonts/fraunces-latin-opsz-normal.woff2', '/fonts/fraunces-latin-opsz-italic.woff2', '/manifest.json', '/icons/icon-192.png'];

const ASSET_RE = /((?:src|href)=")(\/[\w./-]+\.(?:js|css))(?:\?v=[\w-]*)?(")/g;

function hashOf(urlPath) {
  const file = path.join(ROOT, urlPath);
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 8);
}

function build() {
  const html = fs.readFileSync(INDEX, 'utf8');
  const assets = [];
  const newHtml = html.replace(ASSET_RE, (all, pre, p, post) => {
    // vendor/ files carry their version in the file name; fonts/ is listed below.
    if (/^\/(_vercel|vendor|fonts)\//.test(p) || !fs.existsSync(path.join(ROOT, p))) return all;
    const url = p + '?v=' + hashOf(p);
    assets.push(url);
    return pre + url + post;
  });
  const shell = [...SHELL_EXTRA_HEAD, ...assets, ...SHELL_EXTRA_TAIL];
  const sw = fs.readFileSync(SW, 'utf8');
  const shellLine = 'const SHELL = ' + JSON.stringify(shell).replace(/"/g, "'").replace(/','/g, "', '") + ';';
  if (!/^const SHELL = \[.*\];$/m.test(sw)) throw new Error('sw.js: no single-line "const SHELL = [...]" to replace');
  const newSw = sw.replace(/^const SHELL = \[.*\];$/m, shellLine);
  return { html, newHtml, sw, newSw, assets };
}

if (require.main === module) {
  const r = build();
  if (process.argv.includes('--check')) {
    const stale = [r.html !== r.newHtml && 'index.html', r.sw !== r.newSw && 'sw.js'].filter(Boolean);
    if (stale.length) { console.error(stale.join(' and ') + ' out of date: run node scripts/stamp-assets.js'); process.exit(1); }
    console.log('asset stamps up to date (' + r.assets.length + ' files)');
  } else {
    fs.writeFileSync(INDEX, r.newHtml);
    fs.writeFileSync(SW, r.newSw);
    console.log('stamped ' + r.assets.length + ' files');
  }
}
module.exports = { build };

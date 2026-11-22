#!/usr/bin/env node
// The app is split across js/*.js, loaded by index.html as ordinary <script>s in
// a fixed order. They share one global scope, so a function in one file can call
// one in another, but only once that file has loaded. This check catches code
// that runs while the page loads (not inside an event handler or a function
// called later) and needs a function from a file further down the list.
//
//   node scripts/check-load-order.js
'use strict';
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const ROOT = path.join(__dirname, '..');

function appScripts() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return [...html.matchAll(/<script src="\/(js\/[\w-]+\.js)(?:\?v=\w+)?"><\/script>/g)].map((m) => m[1]);
}

const isFn = (n) => n && /^(FunctionExpression|ArrowFunctionExpression|FunctionDeclaration)$/.test(n.type);

// Names called while `node` runs: skips function bodies, except ones called on the spot.
function callsNow(node, out) {
  if (!node || typeof node.type !== 'string') return out;
  if (node.type === 'CallExpression' || node.type === 'NewExpression') {
    if (node.callee.type === 'Identifier') out.add(node.callee.name);
    if (isFn(node.callee)) { callsNow(node.callee.body, out); node.arguments.forEach((a) => callsNow(a, out)); return out; }
  }
  for (const k in node) {
    if (k === 'loc') continue;
    const v = node[k];
    if (Array.isArray(v)) v.forEach((x) => { if (x && typeof x.type === 'string' && !isFn(x)) callsNow(x, out); });
    else if (v && typeof v.type === 'string' && !isFn(v)) callsNow(v, out);
  }
  return out;
}

function check(files = appScripts()) {
  const problems = [];
  const decl = new Map();
  const asts = files.map((f, i) => {
    const ast = acorn.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'), { ecmaVersion: 'latest', locations: true });
    for (const s of ast.body) if (s.type === 'FunctionDeclaration') decl.set(s.id.name, { i, s });
    return ast;
  });
  asts.forEach((ast, i) => {
    for (const s of ast.body) {
      if (s.type === 'FunctionDeclaration') continue;
      const todo = [...callsNow(s, new Set())];
      const seen = new Set();
      while (todo.length) {
        const n = todo.pop();
        if (seen.has(n) || !decl.has(n)) continue;
        seen.add(n);
        todo.push(...callsNow(decl.get(n).s.body, new Set()));
      }
      for (const n of seen) {
        const d = decl.get(n);
        if (d.i > i) problems.push(`${files[i]}:${s.loc.start.line} runs ${n}() while loading, but ${n} is in ${files[d.i]}, which loads later`);
      }
    }
  });
  return { files, problems };
}

if (require.main === module) {
  const { files, problems } = check();
  if (problems.length) { problems.forEach((p) => console.error(p)); process.exit(1); }
  console.log('load order OK (' + files.length + ' files)');
}
module.exports = { check, appScripts };

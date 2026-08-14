#!/usr/bin/env node
/* =====================================================================
   TEXTBOOK VALIDATOR

     node tools/validate-textbook.js [--json]

   The textbook is authored, so it can now be wrong in ways a derived
   structure could not: an id that does not exist, a card placed twice, a
   chapter no unit claims, a card appearing before one it requires.

   Reads card fields ONLY to validate. It never uses a card field to decide
   structure — that is the layer rule this version exists to enforce.
   ===================================================================== */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.dirname(__dirname);
global.window = globalThis;
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'library.js'), 'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'textbook.js'), 'utf8'));
const LIB = window.LIBRARY, TB = window.TEXTBOOK;
const AS_JSON = process.argv.includes('--json');

const errors = [], warnings = [];
const chapters = Object.fromEntries(TB.chapters.map(c => [c.id, c]));

/* ---- structure ---- */
const claimed = new Set();
TB.units.forEach(u => u.chapters.forEach(cid => {
  if (!chapters[cid]) errors.push(`unit ${u.number}: chapter "${cid}" does not exist`);
  if (claimed.has(cid)) errors.push(`chapter "${cid}" claimed by more than one unit`);
  claimed.add(cid);
}));
TB.chapters.forEach(c => {
  if (!claimed.has(c.id)) warnings.push(`chapter "${c.id}" belongs to no unit — it will not appear`);
  if (!c.title) errors.push(`chapter "${c.id}": no title`);
  if (!c.cards || !c.cards.length) warnings.push(`chapter "${c.id}": no cards`);
});

/* ---- card ids ---- */
const seen = {};
TB.chapters.forEach(c => (c.cards || []).forEach(cid => {
  if (!LIB[cid]) errors.push(`chapter "${c.id}": card "${cid}" is not in the library`);
  (seen[cid] = seen[cid] || []).push(c.id);
}));
Object.entries(seen).forEach(([cid, where]) => {
  if (where.length > 1) warnings.push(`card "${cid}" appears in ${where.length} chapters: ${where.join(', ')}`);
});

/* ---- cards the library holds but this book declines ----
   Not an error. A textbook declining a card is now a legitimate decision
   rather than something only a filter could express. */
const placed = new Set(Object.keys(seen));
const declined = Object.keys(LIB).filter(cid => !placed.has(cid) && LIB[cid].scope !== 'lesson-only');
if (declined.length) {
  warnings.push(`${declined.length} library cards not in this textbook: `
    + declined.slice(0, 6).join(', ') + (declined.length > 6 ? ' …' : ''));
}

/* ---- dependency order ---- */
const order = {};
let n = 0;
TB.units.forEach(u => u.chapters.forEach(chid => {
  const ch = chapters[chid];
  if (ch) (ch.cards || []).forEach(cid => { order[cid] = n++; });
}));
Object.entries(order).forEach(([cid, pos]) => {
  if (!LIB[cid]) return;
  (LIB[cid].requires || []).forEach(req => {
    if (!(req in order)) warnings.push(`"${cid}" requires "${req}", which is not in this textbook`);
    else if (order[req] > pos) errors.push(`"${cid}" appears before "${req}", which it requires`);
  });
});

/* ---- coverage ---- */
const cov = {};
Object.keys(order).forEach(cid => {
  if (!LIB[cid]) return;
  (LIB[cid].standards || []).forEach(s => {
    (cov[s.code] = cov[s.code] || new Set()).add(s.engagement);
  });
});
const thin = Object.entries(cov).filter(([, e]) => !e.has('lesson')).map(([c]) => c);

if (AS_JSON) {
  console.log(JSON.stringify({
    textbook: TB.meta.id, units: TB.units.length, chapters: TB.chapters.length,
    cardsPlaced: Object.keys(order).length, libraryCards: Object.keys(LIB).length,
    declined: declined.length,
    coverage: Object.fromEntries(Object.entries(cov).map(([k, v]) => [k, [...v].sort()])),
    thinStandards: thin, errors, warnings
  }, null, 1));
  process.exit(errors.length ? 1 : 0);
}

console.log(`${TB.meta.course} — ${TB.meta.title}  (${TB.meta.status})`);
console.log(`${TB.units.length} unit${TB.units.length === 1 ? '' : 's'} · ${TB.chapters.length} chapters · `
  + `${Object.keys(order).length} of ${Object.keys(LIB).length} library cards placed`);
console.log(`standards: ${Object.keys(cov).sort().join(', ')}`
  + (thin.length ? `  — ${thin.join(', ')} not at lesson depth` : ' — all at lesson depth'));
errors.forEach(e => console.log(`   ✖  ${e}`));
warnings.forEach(w => console.log(`   ⚠  ${w}`));
console.log(errors.length || warnings.length
  ? `\n${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`
  : '\nvalid');
process.exit(errors.length ? 1 : 0);

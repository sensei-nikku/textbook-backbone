#!/usr/bin/env node
/* =====================================================================
   BOOK BUILDER — renders the authored textbook.

     node tools/build-book.js [-o outdir]

   THE LAYER RULE: this reads a card to RENDER it. It never reads a card
   field to decide structure. Chapter membership, chapter order and unit
   order all come from textbook.js and nowhere else.

   v1 grouped cards by `c.topic` to invent chapters. That meant a card could
   only live in one book, and a textbook author could not decline a card.
   ===================================================================== */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const HERE = __dirname, ROOT = path.dirname(HERE);
global.window = globalThis;
vm.runInThisContext(fs.readFileSync(path.join(HERE, 'cards.js'), 'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'library.js'), 'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'textbook.js'), 'utf8'));
const LIB = window.LIBRARY, TB = window.TEXTBOOK;

const argOf = f => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : null; };
const OUT = argOf('-o') || ROOT;
const esc = s => String(s == null ? '' : s).replace(/&(?![a-zA-Z#][a-zA-Z0-9]*;)/g, '&amp;').replace(/</g, '&lt;');

const shell = fs.readFileSync(path.join(HERE, 'book-shell.html'), 'utf8');
const css = fs.readFileSync(path.join(HERE, 'lesson.css'), 'utf8').trim();
const chapters = Object.fromEntries(TB.chapters.map(c => [c.id, c]));

/* Numbering comes from the authored order. */
const seq = [];
TB.units.forEach(u => u.chapters.forEach((cid, i) => {
  if (chapters[cid]) seq.push({ ch: chapters[cid], unit: u, number: `${u.number}.${i + 1}` });
}));
const posOf = Object.fromEntries(seq.map((s, i) => [s.ch.id, i]));

/* Cards are grouped for display by the part they play. This is a RENDERING
   decision made from card type and slot — it does not affect what is in the
   chapter or what order the chapter holds them in. */
const PARTS = [
  ['opening',   '',                     c => c.type === 'vignette' || c.slot === 'objective'],
  ['concepts',  'Definitions and rules', c => ['rule','table','refresher','math','prose','figure'].includes(c.type)],
  ['examples',  'Worked examples',       c => c.type === 'example'],
  ['watch',     'Common traps',          c => c.type === 'trap'],
  ['practice',  'Practice',              c => c.type === 'practice'],
  ['tools',     'Try it',                c => ['interactive','handoff','note'].includes(c.type)],
];

function bookNav(entry) {
  const i = posOf[entry.ch.id];
  const prev = seq[i - 1], next = seq[i + 1];
  const step = (e, dir) => e
    ? `<a class="bn-step" href="${e.ch.id}.html" rel="${dir}">`
      + (dir === 'prev' ? '&lsaquo; ' : '')
      + `<span class="bn-num">${e.number}</span><span class="bn-name">${esc(e.ch.title)}</span>`
      + (dir === 'next' ? ' &rsaquo;' : '') + '</a>'
    : '';
  return '<nav class="booknav" aria-label="Book navigation">'
    + `<div class="bn-modes"><a href="index.html#back=${entry.ch.id}">Lessons</a>`
    + '<span class="bn-mode-on" aria-current="true">Textbook</span></div>'
    + '<div class="bn-trail"><a href="book.html">Contents</a>'
    + '<span class="bn-sep" aria-hidden="true">\u203a</span>'
    + `<span>Unit ${entry.unit.number} &middot; ${esc(entry.unit.title)}</span></div>`
    + `<div class="bn-steps">${step(prev,'prev')}${step(next,'next')}</div></nav>`;
}

let total = 0;
const built = [];

seq.forEach(entry => {
  const ch = entry.ch;
  /* The chapter's card list is the truth. Cards are bucketed for display in
     the order the chapter declares them. */
  const cards = ch.cards.filter(cid => LIB[cid]).map(cid => Object.assign({ id: cid }, LIB[cid]));
  const used = new Set();
  const sections = [];
  PARTS.forEach(([key, heading, test]) => {
    const group = cards.filter(c => !used.has(c.id) && test(c));
    group.forEach(c => used.add(c.id));
    if (group.length) sections.push({ id: `${ch.id}-${key}`, title: heading, cards: group });
  });
  const leftover = cards.filter(c => !used.has(c.id));
  if (leftover.length) sections.push({ id: `${ch.id}-more`, title: 'More', cards: leftover });

  const lesson = new window.Cards.Lesson({ meta: {}, sections });
  const body = lesson.render({});

  const nav = '<nav class="toc" aria-label="On this page">\n  <ol>\n'
    + sections.filter(s => s.title).map(s => `    <li><a href="#${s.id}">${esc(s.title)}</a></li>`).join('\n')
    + '\n  </ol>\n</nav>';

  const scripts = [];
  if (/id="exp-ui"/.test(body)) scripts.push(fs.readFileSync(path.join(HERE, 'explorer.js'), 'utf8'));
  if (sections.length > 1) scripts.push(fs.readFileSync(path.join(HERE, 'nav-highlight.js'), 'utf8'));

  const cov = {};
  cards.forEach(c => (c.standards || []).forEach(s => { (cov[s.code] = cov[s.code] || new Set()).add(s.engagement); }));

  const html = shell
    .replace('{{TITLE}}', `${entry.number} ${esc(ch.title)} — ${esc(TB.meta.title)} | ${esc(TB.meta.site)}`)
    .replace('{{STYLES}}', css)
    .replace('{{NAV}}', nav)
    .replace('{{BOOKNAV}}', bookNav(entry))
    .replace('{{EYEBROW}}', `${esc(TB.meta.site)} &middot; ${esc(TB.meta.course)} &middot; Unit ${entry.unit.number}`)
    .replace('{{H1}}', `${entry.number} ${esc(ch.title)}`)
    .replace('{{SUBTITLE}}', esc(ch.subtitle || ''))
    .replace('{{STANDARDS}}', '<strong>Standards:</strong> '
      + Object.keys(cov).sort().map(c => `<code>${c}</code>`).join(' &middot; '))
    .replace('{{BODY}}', body)
    .replace('{{SOURCES}}', '    <li>National Governors Association Center for Best Practices &amp; Council of '
      + 'Chief State School Officers. (2010). <em>Common Core State Standards for Mathematics.</em></li>')
    .replace('{{FOOTER_LINE}}', `${esc(TB.meta.site)} &middot; ${esc(TB.meta.course)} &middot; ${entry.number} ${esc(ch.title)}`)
    .replace('{{SCRIPTS}}', scripts.length ? '<script>\n' + scripts.join('\n\n') + '</script>' : '');

  const file = path.join(OUT, `${ch.id}.html`);
  fs.writeFileSync(file, html);
  total += html.length;
  built.push({ entry, cards: cards.length, bytes: html.length });
});

/* ---- contents ---- */
const toc = TB.units.map(u => {
  const rows = u.chapters.filter(cid => chapters[cid]).map((cid, i) => {
    const ch = chapters[cid];
    return `    <li><a class="row" href="${cid}.html">`
      + `<span class="n">${u.number}.${i + 1}</span>`
      + `<span class="t">${esc(ch.title)}<span class="d">${esc(ch.subtitle || '')}</span></span></a></li>`;
  }).join('\n');
  return `<h2>Unit ${u.number} &mdash; ${esc(u.title)}</h2>\n`
    + (u.subtitle ? `<p class="sub">${esc(u.subtitle)}</p>\n` : '')
    + `<ol class="contents">\n${rows}\n</ol>`;
}).join('\n\n');

fs.writeFileSync(path.join(OUT, 'book.html'), shell
  .replace('{{TITLE}}', `${esc(TB.meta.title)} — ${esc(TB.meta.course)} | ${esc(TB.meta.site)}`)
  .replace('{{STYLES}}', css + `
.contents{list-style:none;padding:0;margin:0 0 1.4rem}
.contents li{margin:0 0 .1rem}
.contents .row{display:flex;gap:.7rem;align-items:baseline;padding:.5rem .55rem;
  border-radius:6px;text-decoration:none;color:var(--ink)}
.contents .row:hover{background:var(--accent-soft)}
.contents .n{font-variant-numeric:tabular-nums;font-weight:700;color:var(--muted);min-width:2.6rem;font-size:.85rem}
.contents .t{font-weight:600;font-size:.98rem}
.contents .d{display:block;font-weight:400;font-size:.82rem;color:var(--muted);margin-top:.1rem}`)
  .replace('{{NAV}}', '')
  .replace('{{BOOKNAV}}', '<nav class="booknav" aria-label="Book navigation">'
    + '<div class="bn-modes"><a href="index.html">Lessons</a>'
    + '<span class="bn-mode-on" aria-current="true">Textbook</span></div>'
    + '<div class="bn-trail"><span class="bn-here">Contents</span></div>'
    + (seq.length ? `<div class="bn-steps"><a class="bn-step" href="${seq[0].ch.id}.html" rel="next">`
        + `<span class="bn-num">${seq[0].number}</span><span class="bn-name">${esc(seq[0].ch.title)}</span> &rsaquo;</a></div>` : '')
    + '</nav>')
  .replace('{{EYEBROW}}', `${esc(TB.meta.site)} &middot; ${esc(TB.meta.course)} &middot; ${esc(TB.meta.edition)}`)
  .replace('{{H1}}', esc(TB.meta.title))
  .replace('{{SUBTITLE}}', 'Contents')
  .replace('{{STANDARDS}}', '')
  .replace('{{BODY}}', toc)
  .replace('{{SOURCES}}', '    <li>National Governors Association Center for Best Practices &amp; Council of '
    + 'Chief State School Officers. (2010). <em>Common Core State Standards for Mathematics.</em></li>')
  .replace('{{FOOTER_LINE}}', `${esc(TB.meta.site)} &middot; ${esc(TB.meta.course)} &middot; ${esc(TB.meta.edition)}`)
  .replace('{{SCRIPTS}}', ''));

console.log(`${TB.meta.title} — ${TB.units.length} unit${TB.units.length===1?'':'s'}, `
  + `${built.length} chapters, ${((total)/1024).toFixed(0)} KB`);
built.forEach(b => console.log(`  ${b.entry.number.padEnd(5)}${b.entry.ch.title.padEnd(30)} `
  + `${String(b.cards).padStart(2)} cards  ${(b.bytes/1024).toFixed(0)} KB`));

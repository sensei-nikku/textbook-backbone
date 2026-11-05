/* =====================================================================
   CARD SYSTEM — data in, HTML out.

   Content supplies DATA and a PURPOSE. The engine picks the card type,
   and the card type owns everything about how its content is formatted.

     { id, type, standards, data }   ->   Card.render()  ->  HTML

   Consequences that matter:

   - A practice card and a worked example are structurally identical by
     CONSTRUCTION, because both render their working through the same
     card-type code. The taught form cannot drift from the assessed form,
     because neither is hand-written.
   - The library can list, filter and sort cards without rendering a page,
     because cards are objects before they are markup.
   - Presentation is resolved per class at render time and never baked in.
   ===================================================================== */
(function (root) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&(?![a-zA-Z#][a-zA-Z0-9]*;)/g, '&amp;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function raw(s) { return s == null ? '' : String(s); }   // pre-escaped content

  /* Cross-references are written as {{card:some-id}} and resolved at build.
     A card that says "the example above" breaks the moment anything moves;
     a card that names another card survives any ordering. Unresolvable ids
     are left visible rather than silently dropped - a broken reference should
     be loud. */
  var REF_RESOLVER = null;
  function resolveRefs(html) {
    if (!REF_RESOLVER) { return html; }
    return String(html).replace(/\{\{card:([\w-]+)\}\}/g, function (m, id) {
      var t = REF_RESOLVER(id);
      return t == null ? '<mark>[missing reference: ' + esc(id) + ']</mark>' : t;
    });
  }
  function attr(name, val) { return val ? ' ' + name + '="' + esc(val) + '"' : ''; }

  /* ---------- presentation resolution (unchanged semantics) ---------- */
  /* Part states:
       shown      plain, no wrapper                  (prose, questions)
       open       visible but foldable by the LEARNER (answers, working)
       collapsed  folded by default                   (teacher chose to gate it)
       hidden     absent                              (teacher curation)

     'open' is the important one. The learner can fold an answer away to
     self-test, or fold the working away once they no longer need it, without
     anyone gating it from them. Default visible, learner-controlled. */
  var DEFAULT_PRESENTATION = {
    /* Worked examples teach, so their working is open: a novice learns more
       from studying a full solution than from attempting one cold.

       Practice invites an attempt first, so its answer and working start
       folded. This is NOT the gate we removed earlier - the content is on the
       page, one tap away, with no warning against looking. A learner who is
       stuck opens it; a learner who wants to try first is not staring at the
       answer while they think. */
    practice: { card: 'shown', question: 'shown', answer: 'collapsed', work: 'collapsed' },
    example:  { card: 'shown', question: 'shown', work: 'open' },
    _fallback:{ card: 'shown' }
  };

  /* A fold needs a name whether it is open or closed. An unlabelled
     disclosure is a mystery box either way. */
  var LABELS = { answer: 'Answer', work: 'Suggested work',
                 question: 'Question', body: 'More' };
  var CLOSED_HINT = { answer: 'Answer \u2014 tap to show',
                      work: 'Suggested work \u2014 tap to show' };
  /* A worked example's working is its solution: published texts head it
     "Solution". Practice working stays "Suggested work" (2.1.0). */
  var TYPE_LABELS = { example: { work: 'Solution' } };

  function resolve(cfg, id, type, key) {
    var byCard = (cfg.cards || {})[id] || {};
    if (byCard[key] !== undefined) { return byCard[key]; }
    var byType = (cfg.types || {})[type] || {};
    if (byType[key] !== undefined) { return byType[key]; }
    var base = DEFAULT_PRESENTATION[type] || DEFAULT_PRESENTATION._fallback;
    return base[key] !== undefined ? base[key] : 'shown';
  }

  /* ---------- base card ---------- */
  function Card(spec) {
    this.id = spec.id;
    this.type = spec.type;
    this.standards = spec.standards || [];   // [{code, engagement}]
    this.data = spec.data || {};
    this.title = spec.title || '';
  }

  Card.prototype.standardsAttr = function () {
    return this.standards.map(function (s) { return s.code + ':' + s.engagement; }).join(',');
  };

  /* A part is wrapped only if this class collapsed it. Labels are never
     optional - a disclosure with no label is a mystery box. */
  Card.prototype.part = function (key, html, cfg) {
    var state = resolve(cfg, this.id, this.type, key);
    if (state === 'hidden') { return ''; }

    /* An absent part is not an empty part. A practice card written without
       working must not ship a fold labelled "Suggested work" that opens onto
       nothing - that reads as a bug to a learner and there is no way for them
       to tell it is not one. */
    if (html == null || String(html).trim() === '') { return ''; }

    var inner = '<div data-part="' + esc(key) + '" data-part-state="' + esc(state) + '">' + html + '</div>';
    if (state === 'shown') { return inner; }

    var own = (TYPE_LABELS[this.type] || {})[key];
    var label = state === 'collapsed'
      ? (own ? own + ' \u2014 tap to show' : (CLOSED_HINT[key] || LABELS[key] || LABELS.body))
      : (own || LABELS[key] || LABELS.body);
    return '<details class="fold fold-' + esc(key) + '"' + (state === 'open' ? ' open' : '') +
           '><summary>' + esc(label) + '</summary>' + inner + '</details>';
  };

  /* Cards that belong in a list declare it here. Consecutive cards sharing a
     wrapper are grouped by the section, so practice items keep their numbers. */
  Card.prototype.wrapper = null;          // e.g. { tag:'ol', className:'checks' }

  Card.prototype.render = function (cfg) {
    cfg = cfg || {};
    if (resolve(cfg, this.id, this.type, 'card') === 'hidden') { return ''; }
    var tag = this.wrapper ? 'li' : 'section';
    return '<' + tag + ' class="card card-' + esc(this.type) + '"' +
      attr('data-card', this.id) + attr('data-card-type', this.type) +
      attr('data-standards', this.standardsAttr()) +
      ' data-card-state="shown">' + resolveRefs(this.body(cfg)) + '</' + tag + '>';
  };

  Card.prototype.body = function () { return ''; };   // subclasses implement

  function extend(ctor) {
    ctor.prototype = Object.create(Card.prototype);
    ctor.prototype.constructor = ctor;
    return ctor;
  }

  /* ---------- shared formatter: the working ----------
     Used by BOTH ExampleCard and PracticeCard. This is the single reason
     the taught form and the assessed form cannot diverge.

     Two shapes (contract 2.1.0):

     four-part  {givens, tools, primitives, computation}      (2.0.0, unchanged)

     solve      {goal, facts, steps, answer, check?}           (2.1.0)
       goal     the unknowns, each defined with := ("h := the rise, in inches")
       facts    [[quote, math], ...]: a given quoted as written, then the math
                statement it becomes. A plain string is a fact with no quote.
       steps    [{find?, math}, ...]: one step per unknown, in solving order.
                `find` is plain words ("the slope of the new line").
       answer   the result, on its own line
       check    shown apart from the working, so a check never reads as a step

     A solve working prints NO process labels by default: it reads as an
     ordinary textbook solution. cfg.workLabels === 'process' prints the
     course's step names (Goal, Facts, 5 or 5a/5b..., Answer) for a facilitator
     view of the same card. "Check" is always labelled. */
  function workBlock(work, cfg) {
    if (!work) { return ''; }
    if (work.goal || work.steps || work.facts) { return solveBlock(work, cfg || {}); }
    var order = ['givens', 'tools', 'primitives', 'computation'];
    var head = { givens: 'Givens', tools: 'Tools',
                 primitives: 'Primitives', computation: 'Computation' };
    return '<div class="sw">' + order.map(function (k) {
      if (!work[k]) { return ''; }
      return '<div class="sw-part"><p class="sw-h">' + head[k] + '</p>' +
             '<div class="math">' + raw(work[k]) + '</div></div>';
    }).join('') + '</div>';
  }

  function solveBlock(w, cfg) {
    var named = cfg.workLabels === 'process';
    var steps = w.steps || [];
    function label(t) { return named ? '<p class="sv-h">' + esc(t) + '</p>' : ''; }
    function stepLabel(i) {
      if (steps.length === 1) { return '5'; }
      return '5' + String.fromCharCode(97 + i);
    }
    var facts = (w.facts || []).map(function (f) {
      if (typeof f === 'string') { return '<p class="sv-fact">' + raw(f) + '</p>'; }
      return '<p class="sv-fact"><q>' + raw(f[0]) + '</q> <span class="sv-to">&rarr;</span> ' +
             '<span class="sv-m">' + raw(f[1]) + '</span></p>';
    }).join('');
    var out = '<div class="sv">' +
      (w.goal ? '<div class="sv-chunk sv-goal">' + label('Goal') + '<p>' + raw(w.goal) + '</p></div>' : '') +
      (facts ? '<div class="sv-chunk sv-facts">' + label('Facts') + facts + '</div>' : '') +
      steps.map(function (st, i) {
        var lead = st.find ? '<p class="sv-lead">' + (named ? '' : 'Find ') + raw(st.find) + '</p>' : '';
        return '<div class="sv-chunk sv-step">' +
          (named ? '<p class="sv-h">' + stepLabel(i) + (st.find ? ' &middot; ' + raw(st.find) : '') + '</p>' : lead) +
          '<div class="math">' + raw(st.math) + '</div></div>';
      }).join('') +
      (w.answer ? '<div class="sv-chunk sv-answer">' + label('Answer') +
                  '<div class="math"><strong>' + raw(w.answer) + '</strong></div></div>' : '') +
      '</div>';
    if (w.check) {
      out += '<div class="sv-check"><p class="sv-h">Check</p><div class="math">' + raw(w.check) + '</div></div>';
    }
    return out;
  }

  /* ---------- card types ---------- */

  var ExampleCard = extend(function (s) { Card.call(this, s); this.type = 'example'; });

  /* The word "Example" and its number are STRUCTURAL - they describe where the
     card sits, not what it says. An author writing "Example 2" into a title
     welds the card to a position; move it and the title lies. The card supplies
     only the descriptive half, and the section supplies the number. */
  ExampleCard.prototype.heading = function () {
    var n = this.ordinal ? ' ' + this.ordinal : '';
    var desc = this.title ? ' \u2014 ' + esc(this.title) : '';
    return '<h3>Example' + n + desc + '</h3>';
  };

  ExampleCard.prototype.body = function (cfg) {
    var d = this.data;
    return this.heading() +
      this.part('question', '<p>' + raw(d.question) + '</p>', cfg) +
      this.part('work', workBlock(d.work, cfg), cfg) +
      (d.notice ? '<p><strong>Notice:</strong> ' + raw(d.notice) + '</p>' : '') +
      this.why();
  };

  var PracticeCard = extend(function (s) { Card.call(this, s); this.type = 'practice'; });
  PracticeCard.prototype.wrapper = { tag: 'ol', className: 'checks' };
  PracticeCard.prototype.body = function (cfg) {
    var d = this.data;
    return this.part('question', '<p>' + raw(d.question) + '</p>', cfg) +
      this.part('answer', '<p class="given">' + raw(d.answer) + '</p>', cfg) +
      this.part('work', workBlock(d.work, cfg), cfg);
  };

  var TrapCard = extend(function (s) { Card.call(this, s); this.type = 'trap'; });
  TrapCard.prototype.body = function (cfg) {
    return '<div class="trap"><p class="label">' + esc(this.title || 'Common trap') + '</p>' +
      this.part('body', '<p style="margin-bottom:0">' + raw(this.data.body) + '</p>', cfg) + '</div>';
  };

  var RuleCard = extend(function (s) { Card.call(this, s); this.type = 'rule'; });
  RuleCard.prototype.body = function (cfg) {
    var d = this.data;
    return '<div class="rulebox"><p class="label">' + esc(this.title) + '</p>' +
      '<div class="math">' + raw(d.statement) + '</div>' +
      (d.notes ? '<p>' + raw(d.notes) + '</p>' : '') +
      (d.reason ? '<p style="margin-bottom:0"><strong>Why it has to be this:</strong> ' +
                  raw(d.reason) + '</p>' : '') + '</div>' +
      whyBlock(d.why);
  };

  var ProseCard = extend(function (s) { Card.call(this, s); this.type = 'prose'; });
  ProseCard.prototype.body = function (cfg) {
    var d = this.data;
    var html = d.paragraphs
      ? d.paragraphs.map(function (t) { return '<p' + attr('class', d.className) + '>' + raw(t) + '</p>'; }).join('\n')
      : raw(d.body);
    return this.part('body', html, cfg) + this.why();
  };


  /* ---------- shared: an optional ⓘ depth disclosure on any card ---------- */
  function whyBlock(why) {
    if (!why) { return ''; }
    /* A plain string was rendered as an empty fold before 2.1.0. */
    if (typeof why === 'string') { why = { label: 'Why this matters', body: why }; }
    return '<details class="why"><summary>' + esc(why.label) + '</summary>' +
           '<div class="why-body">' + raw(why.body) + '</div></details>';
  }
  Card.prototype.why = function () { return whyBlock(this.data.why); };

  var VignetteCard = extend(function (s) { Card.call(this, s); this.type = 'vignette'; });
  VignetteCard.prototype.body = function (cfg) {
    var paras = (this.data.paragraphs || []).map(function (t, i, a) {
      return '<p' + (i === a.length - 1 ? ' style="margin-bottom:0"' : '') + '>' + raw(t) + '</p>';
    }).join('\n  ');
    return this.part('body', '<div class="vignette">' + paras + '</div>', cfg) + this.why();
  };

  var RefresherCard = extend(function (s) { Card.call(this, s); this.type = 'refresher'; });
  RefresherCard.prototype.body = function (cfg) {
    var d = this.data;
    return '<div class="ref-item"><p class="ref-h">' + esc(this.title) + '</p>' +
      (d.math ? '<div class="math">' + raw(d.math) + '</div>' : '') +
      (d.html ? raw(d.html) : '') +
      (d.note ? '<p style="margin-bottom:0">' + raw(d.note) + '</p>' : '') +
      this.why() + '</div>';
  };

  var TableCard = extend(function (s) { Card.call(this, s); this.type = 'table'; });
  TableCard.prototype.body = function (cfg) {
    var d = this.data;
    var head = '<thead><tr>' + (d.headers || []).map(function (h) {
      return '<th scope="col">' + raw(h) + '</th>'; }).join('') + '</tr></thead>';
    var rows = '<tbody>' + (d.rows || []).map(function (r) {
      return '<tr>' + r.map(function (c, i) {
        return '<td' + (i === 0 && d.firstCellClass ? ' class="' + esc(d.firstCellClass) + '"' : '') +
               '>' + raw(c) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody>';
    return this.part('body',
      '<table' + attr('class', d.className) + '><caption>' + raw(d.caption) + '</caption>' +
      head + rows + '</table>', cfg);
  };

  var FigureCard = extend(function (s) { Card.call(this, s); this.type = 'figure'; });
  FigureCard.prototype.body = function (cfg) {
    return this.part('body', '<figure>' + raw(this.data.svg) +
      (this.data.caption ? '<figcaption>' + raw(this.data.caption) + '</figcaption>' : '') +
      '</figure>', cfg);
  };

  var InteractiveCard = extend(function (s) { Card.call(this, s); this.type = 'interactive'; });
  InteractiveCard.prototype.body = function (cfg) {
    return this.part('body', raw(this.data.html), cfg);
  };

  var HandoffCard = extend(function (s) { Card.call(this, s); this.type = 'handoff'; });
  HandoffCard.prototype.body = function (cfg) {
    var d = this.data;
    return this.part('body', '<div class="handoff"><p class="handoff-h">' + esc(this.title) + '</p>' +
      '<p>' + raw(d.body) + '</p>' +
      '<p style="margin-bottom:0"><a class="button" href="' + esc(d.href) + '">' +
      esc(d.linkLabel) + '</a></p></div>', cfg);
  };

  var MathCard = extend(function (s) { Card.call(this, s); this.type = 'math'; });
  MathCard.prototype.body = function (cfg) {
    var d = this.data;
    return (d.intro ? (Array.isArray(d.intro) ? d.intro : [d.intro]).map(function (t) {
        return '<p>' + raw(t) + '</p>'; }).join('') : '') +
      this.part('body', '<div class="math">' + raw(d.math) + '</div>', cfg) + this.why();
  };

  var NoteCard = extend(function (s) { Card.call(this, s); this.type = 'note'; });
  NoteCard.prototype.body = function (cfg) {
    return this.part('body', '<div class="' + esc(this.data.className || 'nextup') + '">' +
      raw(this.data.body) + '</div>', cfg);
  };

  var SourcesCard = extend(function (s) { Card.call(this, s); this.type = 'sources'; });
  SourcesCard.prototype.body = function (cfg) {
    return this.part('body', '<ul>' + (this.data.items || []).map(function (i) {
      return '<li>' + raw(i) + '</li>'; }).join('') + '</ul>', cfg);
  };

  var TYPES = { example: ExampleCard, practice: PracticeCard, trap: TrapCard,
                rule: RuleCard, prose: ProseCard, vignette: VignetteCard,
                refresher: RefresherCard, table: TableCard, figure: FigureCard,
                interactive: InteractiveCard, handoff: HandoffCard,
                math: MathCard, note: NoteCard, sources: SourcesCard };

  /* ---------- factory + collection ---------- */
  function create(spec) {
    var Ctor = TYPES[spec.type];
    if (!Ctor) { throw new Error('Unknown card type: ' + spec.type); }
    return new Ctor(spec);
  }

  /* ---------- sections ----------
     A section groups cards and is itself curatable. Simple edit mode toggles
     sections; advanced mode toggles the cards inside them. Hiding a section
     hides its cards for coverage too. */
  function Section(spec) {
    this.id = spec.id;
    this.title = spec.title;
    this.standards = spec.standards || [];
    this.cards = (spec.cards || []).map(create);
  }

  Section.prototype.hidden = function (cfg) {
    return ((cfg.sections || {})[this.id] || {}).state === 'hidden' ||
           (cfg.sections || {})[this.id] === 'hidden';
  };

  Section.prototype.render = function (cfg) {
    if (this.hidden(cfg)) { return ''; }

    /* Number the examples that survive curation, in the order they survive.
       Hide the second of three and the third becomes Example 2 - which is what
       a learner needs, and what an authored number could never do. */
    var seen = 0;
    this.cards.forEach(function (c) {
      if (c.type !== 'example') { return; }
      if (resolve(cfg, c.id, c.type, 'card') === 'hidden') { c.ordinal = null; return; }
      c.ordinal = ++seen;
    });
    if (seen < 2) { this.cards.forEach(function (c) { if (c.type === 'example') { c.ordinal = null; } }); }

    var parts = [], run = null, runWrap = null;
    function flush() {
      if (!run || !run.length) { run = null; return; }
      parts.push('<' + runWrap.tag + attr('class', runWrap.className) + '>\n' +
                 run.join('\n') + '\n</' + runWrap.tag + '>');
      run = null; runWrap = null;
    }
    this.cards.forEach(function (c) {
      var html = c.render(cfg);
      if (!html) { return; }
      var w = c.wrapper;
      if (w) {
        if (runWrap && runWrap.tag === w.tag && runWrap.className === w.className) { run.push(html); }
        else { flush(); runWrap = w; run = [html]; }
      } else { flush(); parts.push(html); }
    });
    flush();

    var inner = parts.join('\n\n');
    if (!inner) { return ''; }
    return '<h2 id="' + esc(this.id) + '" data-section="' + esc(this.id) + '"' +
      (this.standards.length ? attr('data-standards',
        this.standards.map(function (x) { return x.code + ':' + x.engagement; }).join(',')) : '') +
      '>' + esc(this.title) + '</h2>\n\n' + inner;
  };

  function Deck(specs) { this.cards = (specs || []).map(create); }

  Deck.prototype.render = function (cfg) {
    return this.cards.map(function (c) { return c.render(cfg); }).filter(Boolean).join('\n');
  };

  /* Library operations - available WITHOUT rendering anything, which is
     the point of cards being objects first. */
  Deck.prototype.byType = function (t) {
    return this.cards.filter(function (c) { return c.type === t; });
  };
  Deck.prototype.byStandard = function (code) {
    return this.cards.filter(function (c) {
      return c.standards.some(function (s) { return s.code === code; });
    });
  };
  Deck.prototype.coverage = function (cfg) {
    cfg = cfg || {};
    var cov = {};
    this.cards.forEach(function (c) {
      if (resolve(cfg, c.id, c.type, 'card') === 'hidden') { return; }
      c.standards.forEach(function (s) {
        (cov[s.code] = cov[s.code] || []);
        if (cov[s.code].indexOf(s.engagement) === -1) { cov[s.code].push(s.engagement); }
      });
    });
    return cov;
  };
  Deck.prototype.shortfall = function (required, cfg) {
    var cov = this.coverage(cfg), out = [];
    Object.keys(cov).forEach(function (code) {
      var missing = required.filter(function (r) { return cov[code].indexOf(r) === -1; });
      if (missing.length) { out.push({ code: code, has: cov[code], missing: missing }); }
    });
    return out;
  };

  function Lesson(spec) {
    this.meta = spec.meta || {};
    this.sections = (spec.sections || []).map(function (x) { return new Section(x); });
  }

  Lesson.prototype.allCards = function () {
    return this.sections.reduce(function (acc, s) { return acc.concat(s.cards); }, []);
  };


  /* Coverage over the whole lesson, honouring both section and card curation. */
  Lesson.prototype.coverage = function (cfg) {
    cfg = cfg || {};
    var cov = {};
    function add(list) {
      list.forEach(function (x) {
        (cov[x.code] = cov[x.code] || []);
        if (cov[x.code].indexOf(x.engagement) === -1) { cov[x.code].push(x.engagement); }
      });
    }
    this.sections.forEach(function (sec) {
      if (sec.hidden(cfg)) { return; }
      add(sec.standards);
      sec.cards.forEach(function (c) {
        if (resolve(cfg, c.id, c.type, 'card') === 'hidden') { return; }
        add(c.standards);
      });
    });
    return cov;
  };

  /* Shortfall compares the CURATED lesson against the UNCURATED one.

     Iterating only over standards still present has a hole: curate away every
     card for a standard and it vanishes from coverage entirely, so a loop over
     what is covered never sees it. The teacher's actual question is "did my
     trim break anything", which needs the before as well as the after. */
  Lesson.prototype.shortfall = function (required, cfg) {
    var cov = this.coverage(cfg);
    var baseline = this.coverage({});          // nothing hidden
    var out = [];

    Object.keys(baseline).forEach(function (code) {
      var has = cov[code] || [];
      var missing = required.filter(function (r) { return has.indexOf(r) === -1; });
      if (!missing.length) { return; }
      // Only a shortfall if the uncurated lesson could actually have met it.
      var baseMissing = required.filter(function (r) { return baseline[code].indexOf(r) === -1; });
      out.push({ code: code, has: has, missing: missing,
                 removedByCuration: baseMissing.length < missing.length,
                 lost: has.length === 0 });
    });
    return out;
  };

  Lesson.prototype.byStandard = function (code) {
    return this.allCards().filter(function (c) {
      return c.standards.some(function (s) { return s.code === code; });
    });
  };

  /* An external catalogue the resolver falls back to. A book renders one
     section at a time, but most references point at OTHER sections — without
     this the resolver sees only the current one and reports every cross-section
     reference as missing. Set once, before rendering anything. */
  var CATALOGUE = null;
  root.CardsSetCatalogue = function (byId) { CATALOGUE = byId || null; };

  Lesson.prototype.render = function (cfg) {
    cfg = cfg || {};
    var byId = {};
    this.allCards().forEach(function (c) { byId[c.id] = c; });
    REF_RESOLVER = function (id) {
      var c = byId[id] || (CATALOGUE && CATALOGUE[id]);
      if (!c) { return null; }
      if (c.type === 'example') {
        return 'Example' + (c.ordinal ? ' ' + c.ordinal : '') + (c.title ? ' (' + c.title + ')' : '');
      }
      /* Not every type carries a title. A table's name is its caption; a
         vignette's is its first line. Falling through to the raw id shows a
         reader a slug, which is worse than a broken reference because it looks
         deliberate. */
      if (c.title) { return c.title; }
      var d = c.data || {};
      if (d.caption)  { return String(d.caption).replace(/<[^>]+>/g, ''); }
      if (d.statement){ return String(d.statement).replace(/<[^>]+>/g, ''); }
      if (d.paragraphs && d.paragraphs.length) {
        return String(d.paragraphs[0]).replace(/<[^>]+>/g, '').slice(0, 60);
      }
      if (d.question) { return String(d.question).replace(/<[^>]+>/g, '').slice(0, 60); }
      return id;
    };
    var out = this.sections.map(function (s) { return s.render(cfg); }).filter(Boolean).join('\n\n');
    REF_RESOLVER = null;
    return out;
  };

  root.Cards = { Card: Card, create: create, Deck: Deck, Section: Section,
                 Lesson: Lesson, types: TYPES, resolve: resolve };

})(typeof window !== 'undefined' ? window : globalThis);

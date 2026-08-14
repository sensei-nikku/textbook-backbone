/* =====================================================================
   LESSON TAXONOMY — the shape a lesson is allowed to take.

   Two levels, because a teacher needs both:

     PHASE  the part of the lesson  (bellringer, primer, lesson, ...)
     SLOT   the job inside it       (do-now, definitions, modeling, ...)

   A card declares its SLOT. A section declares its PHASE. The engine checks
   that the slot belongs to the phase and that the card's TYPE is allowed in
   that slot. An author who cannot place a card has usually written two cards.

   Grounded in Hunter's eight elements (anticipatory set, objective, input,
   modeling, checking for understanding, guided practice, independent
   practice, closure) with the retrieval-practice research layered on:
   spaced, low-stakes, and followed by feedback (Roediger & Karpicke 2006;
   Rowland 2014). Classroom retrieval programmes also REDUCE test anxiety
   (Agarwal et al. 2014), which is why the bellringer and exit slots are
   built around recall rather than review.
   ===================================================================== */
(function (root) {
  'use strict';

  var TAXONOMY = {

    /* ---------------- 1. BELLRINGER ---------------- */
    bellringer: {
      label: 'Bellringer',
      hunter: 'anticipatory set',
      purpose: 'Focus attention and pull prior learning out of memory before anything new arrives.',
      slots: {
        'do-now': {
          label: 'Do Now',
          purpose: 'A short task a learner can start alone, before instruction begins.',
          types: ['practice', 'prose', 'math', 'vignette'],
          notes: 'Answerable from prior learning. If it needs today\u2019s lesson it belongs in the lesson.',
          max: 2
        },
        'context-reading': {
          label: 'Context Reading',
          purpose: 'A real situation the day\u2019s tool actually solves.',
          types: ['vignette', 'prose'],
          notes: 'End on a question. A vignette that resolves itself hands over the insight and leaves nothing.',
          max: 1
        },
        'context-review': {
          label: 'Context Review',
          purpose: 'Surface what the reading was about, before naming the mathematics.',
          types: ['prose', 'practice'],
          max: 1
        },
        'retrieval': {
          label: 'Spaced Retrieval',
          purpose: 'Recall from an EARLIER lesson, not this one.',
          types: ['practice', 'flashcards'],
          notes: 'Ask for recall in a different format from the one it was taught in. '
               + 'Recapping in the same format is not retrieval.',
          spacedFrom: true      // engine flags if it references only the previous day
        }
      }
    },

    /* ---------------- 2. PRIMER ---------------- */
    primer: {
      label: 'Lesson Primer',
      hunter: 'objective / purpose + input',
      purpose: 'Say what today is for, and put the vocabulary and tools within reach.',
      slots: {
        'objective': {
          label: 'Objective',
          purpose: 'What a learner will be able to do, observably, by the end.',
          types: ['prose', 'note'],
          max: 1
        },
        'definitions': {
          label: 'Definitions',
          purpose: 'The words this lesson uses, defined before they are used.',
          types: ['table', 'refresher', 'prose', 'trap'],
          notes: 'Fully populated. Never a table with blanks to fill in during the lesson. '
               + 'A trap belongs here when it disambiguates notation rather than diagnosing a '
               + 'method error \u2014 misconceptions are cheapest to correct before they are used.'
        },
        'tools': {
          label: 'Tools',
          purpose: 'The rules and notation the lesson will apply.',
          types: ['rule', 'refresher', 'math', 'table', 'trap'],
          notes: 'A rule needs its one-line reason. A rule with nothing underneath it has a shelf life.'
        },
        'prerequisite-check': {
          label: 'Prerequisite Check',
          purpose: 'Find where a learner should start.',
          types: ['handoff'],
          notes: 'Tests prerequisites, never the lesson\u2019s own objective.',
          max: 1
        }
      }
    },

    /* ---------------- 3. LESSON ---------------- */
    lesson: {
      label: 'Lesson',
      hunter: 'input + modeling + guided practice',
      purpose: 'Show the method worked, then work it together.',
      slots: {
        'lecture': {
          label: 'Lecture',
          purpose: 'The explanation: where the rule comes from and why it holds.',
          types: ['prose', 'math', 'rule', 'figure', 'table']
        },
        'modeling': {
          label: 'Worked Examples',
          purpose: 'A full solution, method selection visible.',
          types: ['example'],
          hourglass: 'complex-first',
          notes: 'Full worked examples, not partial. For fragmented prior knowledge the '
               + 'worked-example effect outweighs completion tasks.',
          min: 1
        },
        'trap': {
          label: 'Common Trap',
          purpose: 'A named misconception, diagnosed rather than warned against.',
          types: ['trap'],
          notes: 'Correct misconceptions early. An uncorrected error gets reinforced.'
        },
        'structured-practice': {
          label: 'Structured Practice',
          purpose: 'Guided attempt with the scaffold still present.',
          types: ['practice', 'interactive'],
          hourglass: 'essential-first'
        }
      }
    },

    /* ---------------- 4. PRACTICE / CFU ---------------- */
    practice: {
      label: 'Practice and Check for Understanding',
      hunter: 'checking for understanding + independent practice',
      purpose: 'Independent work, and evidence of whether it landed.',
      slots: {
        'free-practice': {
          label: 'Free Practice',
          purpose: 'Independent items, scaffold withdrawn.',
          types: ['practice'],
          hourglass: 'essential-first',
          min: 1
        },
        'error-analysis': {
          label: 'Error Analysis',
          purpose: 'Diagnose someone else\u2019s wrong answer.',
          types: ['practice'],
          notes: 'The one item type that only works when the answer is visible.'
        },
        'review': {
          label: 'Review',
          purpose: 'Interleaved items from earlier lessons.',
          types: ['practice', 'flashcards'],
          spacedFrom: true
        },
        'flashcards': {
          label: 'Flashcards',
          purpose: 'Recall of terms and rules, spaced.',
          types: ['flashcards'],
          notes: 'Correct cards space out; missed cards come back sooner (Leitner).'
        },
        'checkpoint': {
          label: 'Checkpoint',
          purpose: 'A low-stakes check the learner can act on.',
          types: ['handoff', 'interactive', 'practice']
        }
      }
    },

    /* ---------------- 5. EXIT ---------------- */
    exit: {
      label: 'Exit Ticket',
      hunter: 'closure',
      purpose: 'Retrieval, not a summary. Generation, not recognition.',
      slots: {
        'retrieval-check': {
          label: 'Retrieval Check',
          purpose: 'Recall today\u2019s work from memory, notes closed.',
          types: ['practice'],
          notes: '\u201cWhat was the main idea?\u201d demands almost nothing. '
               + '\u201cWithout looking, explain why \u2026\u201d demands genuine retrieval.',
          min: 1
        },
        'reflection': {
          label: 'Reflection',
          purpose: 'What the learner noticed about their own thinking.',
          types: ['prose', 'practice']
        },
        'confidence': {
          label: 'Confidence',
          purpose: 'Self-rating, captured before any feedback.',
          types: ['interactive', 'practice'],
          notes: 'Captured, never used to gate anything.'
        },
        'looking-ahead': {
          label: 'Looking Ahead',
          purpose: 'Where this goes next.',
          types: ['note'],
          notes: 'Written by the engine from the textbook order. Authors do not supply it.',
          engineOwned: true,
          max: 1
        }
      }
    }
  };

  var PHASE_ORDER = ['bellringer', 'primer', 'lesson', 'practice', 'exit'];

  /* ---- lookups ---- */
  function slotsFor(phase) { return Object.keys((TAXONOMY[phase] || {}).slots || {}); }
  function spec(phase, slot) { return ((TAXONOMY[phase] || {}).slots || {})[slot]; }

  function whereCanThisGo(cardType) {
    var out = [];
    PHASE_ORDER.forEach(function (p) {
      slotsFor(p).forEach(function (s) {
        if (spec(p, s).types.indexOf(cardType) > -1) { out.push(p + '/' + s); }
      });
    });
    return out;
  }

  root.TAXONOMY = { phases: TAXONOMY, order: PHASE_ORDER,
                    slotsFor: slotsFor, spec: spec, whereCanThisGo: whereCanThisGo };

})(typeof window !== 'undefined' ? window : globalThis);

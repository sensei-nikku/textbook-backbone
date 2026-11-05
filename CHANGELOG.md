# Changelog

The point of this file is that two people working in two places can say a
number out loud and find out they disagree.

Every release states its `contractVersion`. It is also inside `contract.json`,
which is the authoritative copy.

**Version policy:** a change that invalidates existing cards is major. A change
that adds a type, slot or optional field is minor. Documentation and starter
changes are patch. Refuse a major mismatch, warn on minor.

---

## 2.1.0 — 2026-11-05

Minor: every 2.0.0 card is still valid.

- **Solve-shape working.** `data.work` may be `{goal, facts, steps, answer, check?}`
  instead of the four-part object. It prints as a plain textbook solution;
  `cfg.workLabels = 'process'` prints the course step names (Goal, Facts, 5a/5b,
  Answer) for a facilitator view of the same card. `check` always renders apart
  from the working. Contract: `workShapes`.
- **Step math is an aligned grid**: left side, =, right side. Equals signs line up
  in the body face; a long right side wraps inside its own column on a phone
  instead of scrolling. A line starting "= " continues the line above.
- **`card_tool.py` checks the working's shape.** A string, a mix of the two
  shapes, or a missing part is an error. The 2.0.0 starter had a practice card
  with string working, which rendered an empty fold; it is fixed.
- **Example working is headed "Solution"**, as in published texts. Practice
  working keeps "Suggested work".
- **Fix:** a `why` written as a plain string rendered an empty fold. It now
  renders under "Why this matters". The starter's rule `notes` array (rendered
  comma-joined) is now one string.

Requested by Nick for the Geometry book (Nov 5, 2026). Financial Math stays
pinned at 2.0.0 until it chooses to upgrade.

---

## 2.0.0 — 2026-07-31

First release with an authored textbook.

**Breaking.** Textbook structure moved off the card. Chapters were previously
derived by grouping cards on `topic`; they are now declared in `textbook.js` as
explicit lists of card ids. `topic` survives as a search facet and files
nothing. Any tool that read `card.topic` to decide placement is wrong now.

Added to the contract, all of which the library was already using:

- `requires` — cards this card cannot be read without, validated at the
  textbook layer
- `scope` — `library` | `textbook-only` | `lesson-only`, recording where a card
  was born
- `extensions` — passthrough, preserved untouched
- `idGrammar`, `allowedHtml`, `fractions`
- `textbookChanges` in both shapes, with replace semantics stated

Contract is now generated from the live taxonomy and renderer rather than
hand-written, so it cannot drift from what the engine does.

New: `validate-textbook.js`, `card_tool.py`, `card-editor.html`.

Verified: a second textbook built from the same library, with different
chapters, sharing cards with the first.

---

## Unreleased

- `starter/` — a four-card non-geometry course, validating and building clean
- `starter/index.html` — closes the dead link every built page carried
- `docs/FOR-AN-LLM.md`
- Engine extracted from the geometry site into a standalone repository

No engine files changed. `cards.js`, `taxonomy.js`, `build-book.js`,
`validate-textbook.js` and `card_tool.py` are byte-identical to what is running
in production.

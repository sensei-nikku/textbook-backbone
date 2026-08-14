# Changelog

The point of this file is that two people working in two places can say a
number out loud and find out they disagree.

Every release states its `contractVersion`. It is also inside `contract.json`,
which is the authoritative copy.

**Version policy:** a change that invalidates existing cards is major. A change
that adds a type, slot or optional field is minor. Documentation and starter
changes are patch. Refuse a major mismatch, warn on minor.

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

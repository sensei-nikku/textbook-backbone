# Card Engine

A static textbook engine. Content is written as **cards**; a **textbook**
declares which cards it contains and in what order; a builder renders it to
plain HTML with no runtime dependencies.

This repository holds the **engine only**. No course content lives here.

**Contract version 2.1.0.**

---

## Start here

| You are | Read |
|---|---|
| An LLM being asked to write cards | [`docs/FOR-AN-LLM.md`](docs/FOR-AN-LLM.md) |
| A teacher starting a course | [`starter/README.md`](starter/README.md) |
| Looking for the exact rules | `contract.json` — generated from live code |

---

## The idea

> **A layer may read a card to RENDER it.**
> **A layer may not read a card to decide STRUCTURE.**

A card knows what it is. It does not know which book, chapter or lesson it
appears in. That decision is recorded in `textbook.js` as explicit lists of
card ids.

An earlier version derived chapters by grouping cards on their `topic` field.
That meant a card could only ever live in one book, and a textbook author could
not decline a card. Now `topic` is a search facet and files nothing.

What this buys:

- two textbooks from one library, with different chapters
- one card in two books, or in neither
- reordering a chapter without editing a single card
- a second course reusing the engine with no engine changes

---

## Layers

```
1  LIBRARY    library.js      cards                          authored
2  TEXTBOOK   textbook.js     units -> chapters -> card ids  authored
3  LESSON     -                                              NOT BUILT
4  CLASS      -                                              NOT BUILT
5  STUDENT    -                                              NOT BUILT
```

Layers 1 and 2 are complete and in production. Layers 3–5 are not in this
release, and nothing here pretends otherwise.

---

## Commands

```bash
node tools/validate-textbook.js        # check structure; run this first
node tools/build-book.js               # textbook -> chapter pages + book.html
node tools/validate-textbook.js --json # machine-readable

python3 tools/card_tool.py types              # every type and its fields
python3 tools/card_tool.py slots [phase]      # every slot, with limits
python3 tools/card_tool.py new practice free-practice my-card-id
python3 tools/card_tool.py check cards.json   # validate
python3 tools/card_tool.py apply library.js package.json --out library.js
```

`card_tool.py apply` re-validates before merging, always, and says so loudly
when a package claimed it passed and did not. It merges **cards** and refuses
to touch the textbook — a package may propose chapter membership, a person
applies it.

Node 18+ and Python 3.8+. No install, no dependencies.

---

## card-editor.html

Open it in a browser. No server, no build step, works on a Chromebook.

- browse and filter the library by id, type, topic, slot or standard code
- write a card with a **live preview using the real renderer**
- "Copy the prompt for your LLM" — a complete authoring brief generated from
  the live taxonomy, so it cannot drift from the engine
- paste an LLM's JSON back in; every card is validated individually, broken
  ones are named with reasons and good ones are still offered
- merge, download `library.js`

It expects `library.js` beside it and `tools/` below it.

---

## Verified

The engine builds a subject it has never seen, with zero engine edits:

```
starter/ (simple interest, 4 cards)
  card_tool.py check      4 cards, 0 errors, 0 warnings
  validate-textbook.js    valid
  build-book.js           1 chapter, 23 KB
  HTML well-formed        clean
  broken links            none
  geometry leakage        none
```

---

## Known gaps

| gap | effect |
|---|---|
| **No Python renderer, no fixtures** | `card_tool.py` validates but cannot render. Preview only exists in `card-editor.html`. Two renderers were specified with golden files to keep them honest; the second was never written |
| **`flashcards`** | offered in 4 slots, is not one of the 14 card types. A card claiming it fails |
| **`sources`** | is a real type, allowed in no slot |
| **`scope: textbook-only`** | in the contract, not implemented in the builder |
| **`build-book.js` links `index.html`** | which it never writes. `starter/index.html` covers it |
| **Library search** | a filter box standing in for a real index; strained past a few hundred cards |
| **Lesson engine** | does not exist |

---

## Layout

```
contract.json          the spec, generated from taxonomy + renderer
card-editor.html       browser authoring UI
tools/
  cards.js             the renderer
  taxonomy.js          phases and slots
  lesson.css           inlined into every built page
  book-shell.html      page template
  explorer.js          interactive card behaviour
  nav-highlight.js     on-page nav
  build-book.js        textbook -> HTML
  validate-textbook.js structural validation
  card_tool.py         card authoring and validation
  contract.json        copy, where card_tool.py looks
starter/               a working four-card course to copy
docs/FOR-AN-LLM.md     orientation for a model with no context
```

Paths are relative and load-bearing. `build-book.js` expects `library.js` and
`textbook.js` one level above `tools/`. Keep the shape.

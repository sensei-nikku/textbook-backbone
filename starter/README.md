# Starting a new course

Four cards on simple interest, a one-chapter textbook, and a landing page. All
of it works. Copy it, then replace it.

Nothing here is geometry. That is on purpose — it is the proof that the engine
does not care what subject you teach.

---

## 1. Set up

From the repository root:

```bash
mkdir ../my-course
cp -r tools contract.json card-editor.html ../my-course/
cp starter/library.js starter/textbook.js starter/index.html ../my-course/
cd ../my-course
```

The layout matters. `build-book.js` expects `library.js` and `textbook.js` one
level above `tools/`.

## 2. Confirm it works before you change anything

```bash
node tools/validate-textbook.js
node tools/build-book.js
```

You should get `valid`, then one chapter built. Open `index.html`. If that
works, every later failure is something you changed, which is a much shorter
list to search.

## 3. Name your course

Edit `meta` at the top of `textbook.js` — `course`, `site`, `title`, `edition`.
Leave `status` as `draft` until it is not.

## 4. Write cards

Open `card-editor.html` in a browser. Use **Copy the prompt for your LLM**,
paste that into whichever model you use, ask for the cards you want, paste the
result back into the import box, press Check.

Broken cards are named with reasons. Good ones merge anyway. Then download
`library.js` and replace yours.

Before you accept anything, **look at the preview.** Cards that validate can
still render wrong, and the preview is the only place that shows up.

## 5. Put them in the book

Card ids do not place themselves. Open `textbook.js` and list them:

```json
{
  "id": "compound-interest",
  "title": "Compound Interest",
  "subtitle": "Interest that earns interest",
  "cards": ["compound-context", "compound-rule", "compound-annual"]
}
```

Then add `"compound-interest"` to a unit's `chapters` array. A chapter no unit
claims will not appear, and the validator warns you about it.

## 6. Build

```bash
node tools/validate-textbook.js && node tools/build-book.js
```

Validate first, always. It catches an id that does not exist, a card placed
twice, a chapter no unit claims, and a card appearing before one it `requires`.

## 7. Publish

Upload every `.html` file plus `book.html` and `index.html` to any static host.
Built pages inline their own CSS and load nothing external, so they work from a
folder, a shared drive, or a school intranet.

**Do not upload `library.js`, `textbook.js`, `tools/` or `card-editor.html` to a
public folder.** Built pages do not need them, and together they are your whole
authoring system, readable by anyone with the URL.

---

## Adapting the rules to your subject

Some of what the validator enforces is universal and some is one school's house
style. Both live in `contract.json`.

| Probably yours to change | Leave alone |
|---|---|
| `standards` codes — CCSS-M, state, or your own | the type and slot taxonomy |
| `vocabulary.banned` | the four-part `work` shape |
| `topic` values | id grammar, entities, allowed HTML |
| `complexity` labels, if your course genuinely uses other words | the layer rule |

The taxonomy is Hunter's lesson elements. It is not subject-specific, and if
you find yourself needing a new phase or slot to express an ordinary lesson in
your subject, that is worth reporting rather than working around.

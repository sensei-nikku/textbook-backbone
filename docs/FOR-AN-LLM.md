# Read this first

You are being asked to write course content for a system you have not seen.
This file is the whole orientation. It takes about four minutes.

**Do not infer the rules from the existing cards.** Read `contract.json`. It is
generated from the live renderer and taxonomy, so it cannot drift from what the
engine actually does. Anything in this file that disagrees with `contract.json`
is out of date, and `contract.json` wins.

---

## 1. What you are writing

Not pages. Not lessons. **Cards.**

A card is one self-contained piece of content — a worked example, a rule, a
practice item, a story that sets up a problem. It is a JSON object. It renders
to a block of HTML.

```json
"simple-interest-one-year": {
  "type": "practice",
  "slot": "free-practice",
  "complexity": "essential",
  "topic": "simple-interest",
  "standards": [{ "code": "FM.1", "engagement": "exercise" }],
  "data": {
    "question": "You borrow $500 at 6% for 1 year. What is the interest?",
    "answer": "$30."
  }
}
```

That is the entire unit of work. You write a pile of these. Someone else
decides what order they go in.

---

## 2. The one rule that explains every other rule

> **A card knows what it IS. It does not know where it LIVES.**

A card carries no chapter, no unit, no page, no position, no "this is the third
example." Structure lives in `textbook.js`, which holds explicit lists of card
ids. The engine refuses fields like `ordinal`, `position`, `order` and `number`
for exactly this reason.

Consequences you will feel immediately while writing:

- **Never write "the example above", "as we saw earlier", "in Section 2".** You
  do not know what is above. Use `{{card:some-card-id}}` and the engine writes
  the reference for you.
- **Never write "Example 3" in a title.** The engine numbers examples. Your
  title is the description only: `"A rate given per year, over a number of
  months"`.
- **Never number practice items.** The engine does that too.

`topic` is a **search facet**. It does not file the card into a chapter. Two
cards sharing a topic may end up in different chapters, or one of them nowhere.

---

## 3. Type and slot

Every card declares a `type` (what it is) and a `slot` (the job it does in a
lesson). The slot constrains the type — you cannot put an `example` in
`free-practice`.

**14 types:** `example` `figure` `handoff` `interactive` `math` `note`
`practice` `prose` `refresher` `rule` `sources` `table` `trap` `vignette`

**5 phases, 21 slots:**

| phase | slots |
|---|---|
| `bellringer` | do-now, context-reading, context-review, retrieval |
| `primer` | objective, definitions, tools, prerequisite-check |
| `lesson` | lecture, modeling, trap, structured-practice |
| `practice` | free-practice, error-analysis, review, flashcards, checkpoint |
| `exit` | retrieval-check, reflection, confidence, looking-ahead |

Run `python3 tools/card_tool.py slots` for the exact type list per slot, with
limits. Run `card_tool.py types` for required and optional fields per type.
**Do not guess these.** Guessing is the failure mode this tool exists to stop.

---

## 4. The four-part working

An `example` card requires `data.work` with exactly four parts. This is not
decoration; it is the pedagogy the course is built on.

```json
"work": {
  "givens":      "What the problem hands you.",
  "tools":       "The rule or formula being invoked.",
  "primitives":  "The reasoning that turns givens into something the tool accepts. Unit conversions, rewrites, why this tool and not another.",
  "computation": "The arithmetic, once everything is ready."
}
```

`primitives` is the part that matters and the part LLMs skip. It is where the
thinking is. If your `primitives` says "plug in the values", you have written
nothing and the card should be rewritten.

---

## 5. Complexity, and ordering

`example` and `practice` cards need `complexity`: `essential`, `developing`, or
`complex`.

- **essential** — the core skill, fewest steps
- **complex** — most steps, edge cases

**Never write "easy" or "hard"**, including in comments. These are banned words
and the validator rejects them. The vocabulary is deliberate: difficulty framed
as a property of the problem, not of the learner.

Ordering, called the hourglass:

- **worked examples run complex first** — see the hard case modelled before the
  simple one
- **practice runs essential first** — succeed before you are stretched

---

## 6. House rules that will trip you

| rule | why |
|---|---|
| Use HTML entities: `&minus;` `&deg;` `&#8242;` `&rarr;` `&#10216;` `&#10217;` | A plain hyphen looks identical and behaves differently |
| Banned: *easy, hard, subtract, divide, obvious, simply, clearly* | Multiplicative inverse language: "multiply by 1/15", never "divide by 15" |
| Ids: lowercase words joined by hyphens | `simple-interest-one-year` |
| Fractions as strings: `"3/2"` | No entity needed |
| Allowed HTML only: `span strong em p br code sup sub q` | |
| Write in second person, terse | Adult learners. No motivational filler, no "don't worry!" |

The engine owns, and you must never write: the word "Example" and its number,
practice numbering, next/previous, navigation, standards summaries, fold
labels, chapter numbering.

---

## 7. Tag standards honestly

```json
"standards": [{ "code": "FM.1", "engagement": "warmup" }]
```

`engagement` is one of `warmup`, `lesson`, `exercise`, `assessment`. It is how
deeply the card engages that standard. **Inflating everything to `lesson` makes
the coverage report worthless**, and the coverage report is how the teacher
knows what they have actually taught.

---

## 8. How to check your work

```bash
python3 tools/card_tool.py check my-cards.json
```

This is the same validator the receiving side runs. If it passes here, it
passes there. It catches wrong type for slot, missing required fields,
"Example 2" welded into a title, positional references, literal characters
where entities are required, banned vocabulary, invalid complexity, and
hourglass inversions.

**Validation is not enough.** A card can validate and still render wrong — an
example with a `notice` and no `work`, a table whose first header swallowed a
tag, a fold containing nothing. Every one of those passed validation and was
caught only by looking at it. Open `card-editor.html` in a browser, paste your
JSON into the import box, and **look at the preview.** The editor renders with
the same `cards.js` the site builds with, so what you see there is what ships.

---

## 9. What you are not being asked to do

- Decide chapters or order — that is `textbook.js`, authored by a person
- Write lesson pages — the lesson engine does not exist yet
- Touch `cards.js` or `taxonomy.js` — **if you find yourself needing to, stop
  and say so.** Needing an engine change to write content means the engine has
  a subject-specific assumption baked in, and that is worth knowing about, not
  worth working around.

---

## 10. Say which version you are on

State the `contractVersion` from `contract.json` when you hand work over. Two
people authoring against different versions is the failure this repo exists to
prevent, and it is silent unless someone says a number out loud.

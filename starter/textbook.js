/* STARTER TEXTBOOK — authored, not derived.

   A textbook holds units, chapters, and lists of card ids. It knows nothing
   about what a card contains. Membership is a decision recorded HERE, not a
   property a card carries.

   That is the rule the whole engine exists to enforce:

       A layer may read a card to RENDER it.
       A layer may not read a card to decide STRUCTURE.

   So a card's `topic` field does not put it in a chapter. This file does.
   The same card may appear in two books, or in none, and the card never
   changes.

   Copy this to textbook.js in your course folder and edit `meta` first. */
window.TEXTBOOK = {

 "meta": {
  "id": "your-course-unit-1",
  "course": "Your Course",
  "site": "Your Site",
  "title": "Your First Unit",
  "edition": "Term 1, 2026",
  "status": "draft"
 },

 "units": [
  {
   "id": "money-basics",
   "number": 1,
   "title": "Money Basics",
   "subtitle": "What borrowing costs",
   "chapters": ["simple-interest"]
  }
 ],

 "chapters": [
  {
   "id": "simple-interest",
   "title": "Simple Interest",
   "subtitle": "A rate you were told, turned into a cost you were not",
   "cards": [
    "simple-interest-context",
    "simple-interest-rule",
    "simple-interest-partial-year",
    "simple-interest-one-year"
   ]
  }
 ]

};

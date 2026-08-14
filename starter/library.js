/* STARTER LIBRARY — four cards, deliberately not geometry.

   These exist to prove two things:

     1. the engine renders a subject it has never seen
     2. a new author can read four cards and infer the shape

   Copy this to library.js in your course folder, then replace every card.
   Nothing here is geometry-specific, and nothing here is required. */
window.LIBRARY = {

 "simple-interest-context": {
  "type": "vignette",
  "slot": "context-reading",
  "topic": "simple-interest",
  "standards": [{ "code": "FM.1", "engagement": "warmup" }],
  "data": {
   "paragraphs": [
    "A furniture store offers a couch for $900 with no payment for a year. The sign says the interest rate is 14%.",
    "Nothing is hidden. The store has told you the price, the rate, and the time. What it has not told you is the number that actually matters: what the couch costs you if you take the year."
   ],
   "why": "The rate is public and the cost is not. Reading one from the other is the whole skill."
  }
 },

 "simple-interest-rule": {
  "type": "rule",
  "slot": "tools",
  "title": "Simple interest",
  "topic": "simple-interest",
  "standards": [{ "code": "FM.1", "engagement": "lesson" }],
  "data": {
   "statement": "<em>I</em> = <em>Prt</em>, where <em>P</em> is the amount borrowed, <em>r</em> is the yearly rate written as a decimal, and <em>t</em> is the time in years.",
   "notes": [
    "<em>r</em> is a rate per year, so <em>t</em> is measured in years. Six months is <em>t</em> = 1/2.",
    "<em>I</em> is the interest alone. What you hand over is <em>P</em> + <em>I</em>."
   ],
   "reason": "Interest is a fraction of the amount borrowed, charged again for each year you hold it. Multiplying by <em>r</em> takes the fraction; multiplying by <em>t</em> charges it for each year."
  }
 },

 "simple-interest-partial-year": {
  "type": "example",
  "slot": "modeling",
  "title": "A rate given per year, over a number of months",
  "complexity": "complex",
  "topic": "simple-interest",
  "standards": [{ "code": "FM.1", "engagement": "lesson" }],
  "data": {
   "question": "You borrow $900 at 14% for 8 months. What is the interest?",
   "work": {
    "givens": "<em>P</em> = 900, rate = 14% per year, time = 8 months.",
    "tools": "<em>I</em> = <em>Prt</em>.",
    "primitives": "14% means 14 per hundred, so <em>r</em> = 0.14. The rate is per year and the time is in months, so the time must be rewritten in years: 8 months is 8 twelfths of a year, or <em>t</em> = 8 &times; 1/12.",
    "computation": "<em>I</em> = 900 &times; 0.14 &times; 8/12 = 900 &times; 0.14 &times; 2/3 = $84."
   },
   "notice": "The units are the whole problem. A rate per year multiplied by a time in months returns a number that means nothing."
  }
 },

 "simple-interest-one-year": {
  "type": "practice",
  "slot": "free-practice",
  "complexity": "essential",
  "topic": "simple-interest",
  "standards": [{ "code": "FM.1", "engagement": "exercise" }],
  "data": {
   "question": "You borrow $500 at 6% for 1 year. What is the interest?",
   "answer": "$30.",
   "work": "<em>r</em> = 0.06 and <em>t</em> = 1, so <em>I</em> = 500 &times; 0.06 &times; 1 = 30."
  }
 }

};

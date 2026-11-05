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
   "notes": "<em>r</em> is a rate per year, so <em>t</em> is measured in years. Six months is <em>t</em> = 1/2.<br><em>I</em> is the interest alone. What you hand over is <em>P</em> + <em>I</em>.",
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
    "goal": "<em>I</em> := the interest, in dollars.",
    "facts": [
     ["borrow $900", "<em>P</em> = 900"],
     ["at 14%", "<em>r</em> = 14 &times; 1/100 = 0.14 per year"],
     ["for 8 months", "<em>t</em> = 8 &times; 1/12 = 2/3 of a year"]
    ],
    "steps": [
     { "find": "<em>I</em>", "math": "<em>I</em> = <em>Prt</em>\n  = 900 &times; 0.14 &times; 2/3\n  = 84" }
    ],
    "answer": "<em>I</em> = $84",
    "check": "84 &times; 1/900 = 0.0933..., and 0.14 &times; 2/3 = 0.0933...: the interest is the right share of the loan."
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
   "work": {
    "goal": "<em>I</em> := the interest, in dollars.",
    "facts": [["borrow $500", "<em>P</em> = 500"], ["at 6%", "<em>r</em> = 0.06"], ["for 1 year", "<em>t</em> = 1"]],
    "steps": [{ "find": "<em>I</em>", "math": "<em>I</em> = 500 &times; 0.06 &times; 1\n  = 30" }],
    "answer": "<em>I</em> = $30"
   }
  }
 }

};

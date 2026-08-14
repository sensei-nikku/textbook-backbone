/* Highlight the current section in the sticky nav. */
(function () {
  'use strict';
  var links = Array.prototype.slice.call(document.querySelectorAll('nav.toc a'));
  var sections = links.map(function (l) { return document.querySelector(l.getAttribute('href')); });
  if (!('IntersectionObserver' in window)) { return; }

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) { return; }
      var i = sections.indexOf(en.target);
      links.forEach(function (l, j) { l.classList.toggle('here', i === j); });
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  sections.forEach(function (s) { if (s) { obs.observe(s); } });
})();

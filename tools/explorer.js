(function () {
  'use strict';

  var XMIN = -10, XMAX = 10, YMIN = -10, YMAX = 10, U = 22, PAD = 24;
  var W = (XMAX - XMIN) * U + 2 * PAD;
  var H = (YMAX - YMIN) * U + 2 * PAD;

  // Preimage: deliberately NOT the worked-example triangle, so exploring is
  // a fresh case rather than replaying an answer already on the page.
  var PRE = [{n:'P', x:1, y:1}, {n:'Q', x:4, y:1}, {n:'R', x:1, y:3}];

  // Bounds derived from the shape's own extents, not a fixed number: the
  // image must stay fully on the visible plane, and a wide shape can travel
  // less far right than a narrow one before running off the edge.
  var xs = PRE.map(function (v) { return v.x; });
  var ys = PRE.map(function (v) { return v.y; });
  var A_MIN = XMIN - Math.min.apply(null, xs), A_MAX = XMAX - Math.max.apply(null, xs);
  var B_MIN = YMIN - Math.min.apply(null, ys), B_MAX = YMAX - Math.max.apply(null, ys);

  var a = 3, b = -2;
  var target = null;

  var ui       = document.getElementById('exp-ui');
  var outA     = document.getElementById('out-a');
  var outB     = document.getElementById('out-b');
  var ruleEl   = document.getElementById('live-rule');
  var svgMount = document.getElementById('exp-svg');
  var rowsEl   = document.getElementById('exp-rows');
  var fbEl     = document.getElementById('exp-feedback');

  if (!ui) { return; }
  ui.hidden = false;

  function sx(x) { return PAD + (x - XMIN) * U; }
  function sy(y) { return PAD + (YMAX - y) * U; }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;' }[c]; }); }

  function signed(n) { return n < 0 ? '\u2212' + Math.abs(n) : String(n); }

  function addStr(v, d) {
    return d < 0 ? v + ' \u2212 ' + Math.abs(d) : v + ' + ' + d;
  }

  function gridSvg() {
    var p = [], x, y;
    for (x = XMIN; x <= XMAX; x++) {
      p.push('<line class="g" x1="'+sx(x)+'" y1="'+sy(YMIN)+'" x2="'+sx(x)+'" y2="'+sy(YMAX)+'"/>');
    }
    for (y = YMIN; y <= YMAX; y++) {
      p.push('<line class="g" x1="'+sx(XMIN)+'" y1="'+sy(y)+'" x2="'+sx(XMAX)+'" y2="'+sy(y)+'"/>');
    }
    p.push('<line class="ax" x1="'+sx(XMIN)+'" y1="'+sy(0)+'" x2="'+sx(XMAX)+'" y2="'+sy(0)+'"/>');
    p.push('<line class="ax" x1="'+sx(0)+'" y1="'+sy(YMIN)+'" x2="'+sx(0)+'" y2="'+sy(YMAX)+'"/>');
    for (x = XMIN; x <= XMAX; x += 5) {
      if (x !== 0) { p.push('<text class="tick" x="'+sx(x)+'" y="'+(sy(0)+14)+'">'+x+'</text>'); }
    }
    for (y = YMIN; y <= YMAX; y += 5) {
      if (y !== 0) { p.push('<text class="tick tr" x="'+(sx(0)-8)+'" y="'+(sy(y)+4)+'">'+y+'</text>'); }
    }
    return p.join('');
  }

  function polyOf(pts, cls) {
    return '<polygon class="'+cls+'" points="' +
      pts.map(function (v) { return sx(v.x) + ',' + sy(v.y); }).join(' ') + '"/>';
  }

  function image() {
    return PRE.map(function (v) { return { n: v.n + '\u2032', x: v.x + a, y: v.y + b }; });
  }

  function render() {
    var img = image();

    outA.textContent = signed(a);
    outB.textContent = signed(b);
    ruleEl.innerHTML = 'T\u27E8' + signed(a) + ', ' + signed(b) + '\u27E9(x, y) = (' +
      addStr('x', a).replace(/-/g, '\u2212') + ', ' + addStr('y', b).replace(/-/g, '\u2212') + ')';

    var parts = ['<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" role="img" ' +
      'aria-label="Coordinate plane. Triangle P Q R translated by a equals ' + a +
      ' and b equals ' + b + '.">'];
    parts.push(gridSvg());
    if (target) { parts.push(polyOf(target, 'target')); }
    parts.push(polyOf(PRE, 'pre'));
    parts.push(polyOf(img, 'img'));
    PRE.forEach(function (v) {
      parts.push('<circle class="pre" cx="'+sx(v.x)+'" cy="'+sy(v.y)+'" r="3.5"/>');
    });
    img.forEach(function (v) {
      parts.push('<circle class="img" cx="'+sx(v.x)+'" cy="'+sy(v.y)+'" r="3.5"/>');
    });
    parts.push('</svg>');
    svgMount.innerHTML = parts.join('');

    rowsEl.innerHTML = PRE.map(function (v, i) {
      var q = img[i];
      return '<tr><td>' + esc(v.n) + '</td>' +
        '<td>(' + v.x + ', ' + v.y + ')</td>' +
        '<td>(' + addStr(String(v.x), a).replace(/-/g,'\u2212') + ', ' +
                  addStr(String(v.y), b).replace(/-/g,'\u2212') + ')</td>' +
        '<td>(' + signed(q.x) + ', ' + signed(q.y) + ')</td></tr>';
    }).join('');

    // Grey out a control once moving further would push the image off the
    // plane — silently ignoring the click would just look broken.
    document.querySelectorAll('[data-step]').forEach(function (btn) {
      var d = parseInt(btn.dataset.delta, 10);
      var atLimit = btn.dataset.step === 'a'
        ? (d > 0 ? a >= A_MAX : a <= A_MIN)
        : (d > 0 ? b >= B_MAX : b <= B_MIN);
      btn.disabled = atLimit;
      btn.style.opacity = atLimit ? '.4' : '';
    });

    if (target) { checkTarget(); }
  }

  function checkTarget() {
    var img = image();
    var hit = img.every(function (v, i) {
      return v.x === target[i].x && v.y === target[i].y;
    });
    if (hit) {
      fbEl.className = 'feedback hit';
      fbEl.textContent = 'Matched. The vector that lands on the target is \u27E8' +
        signed(a) + ', ' + signed(b) + '\u27E9.';
      target = null;
    } else {
      fbEl.className = 'feedback miss';
      fbEl.textContent = 'Not yet \u2014 the green outline is where you need to land.';
    }
  }

  function newTarget() {
    var ta, tb;
    do {
      ta = A_MIN + Math.floor(Math.random() * (A_MAX - A_MIN + 1));
      tb = B_MIN + Math.floor(Math.random() * (B_MAX - B_MIN + 1));
    } while ((ta === a && tb === b) || (ta === 0 && tb === 0));

    target = PRE.map(function (v) { return { x: v.x + ta, y: v.y + tb }; });
    fbEl.className = 'feedback miss';
    fbEl.textContent = 'Set a and b so the red triangle lands on the green outline.';
    render();
  }

  document.addEventListener('click', function (e) {
    var step = e.target.closest('[data-step]');
    if (step) {
      var d = parseInt(step.dataset.delta, 10);
      if (step.dataset.step === 'a') { a = Math.max(A_MIN, Math.min(A_MAX, a + d)); }
      else                           { b = Math.max(B_MIN, Math.min(B_MAX, b + d)); }
      render();
      return;
    }
    if (e.target.id === 'btn-challenge') { newTarget(); return; }
    if (e.target.id === 'btn-reset') {
      a = 3; b = -2; target = null;
      fbEl.textContent = ''; fbEl.className = 'feedback';
      render();
    }
  });

  render();
})();

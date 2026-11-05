#!/usr/bin/env python3
"""
card_tool.py — the card authoring engine.

Run this instead of guessing. It reads contract.json and knows every card
type, every slot, every required field, and every house rule.

    python3 card_tool.py types                       list card types
    python3 card_tool.py slots [phase]               list slots
    python3 card_tool.py new TYPE SLOT ID            scaffold a card
    python3 card_tool.py check FILE                  validate cards or a package
    python3 card_tool.py build-package --cards F --textbook F --out F
    python3 card_tool.py inspect FILE                summarise a package
    python3 card_tool.py apply LIBRARY PACKAGE --out F

`new` emits a card with every required field present and every optional field
listed as a comment, so an author fills blanks rather than inventing shape.

`check` is the same validator the receiving side runs. A package that passes
here passes there.
"""
import json, sys, re, os, argparse, collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

def load_contract():
    for p in (os.path.join(HERE, 'contract.json'), os.path.join(ROOT, 'contract.json')):
        if os.path.exists(p):
            return json.load(open(p, encoding='utf-8'))
    sys.exit("contract.json not found next to card_tool.py or one level up")

C = load_contract()
TYPES = C['cardTypes']
SLOTS = C['slots']

BANNED = C.get('vocabulary', {}).get('banned', [])
ENTITY = C.get('entities', {})
LITERALS = {'\u2212': '&minus;', '\u27e8': '&#10216;', '\u27e9': '&#10217;',
            '\u2032': '&#8242;', '\u00b0': '&deg;', '\u2192': '&rarr;'}
POSITIONAL = [r'\babove\b', r'\bbelow\b', r'\bearlier\b', r'\bSection \d',
              r'\bProblem \d', r'\bDay\s*\d', r'\bExample \d']
TITLE_REQUIRED = {'refresher', 'rule', 'example', 'trap', 'handoff'}
COMPLEXITY_TYPES = {'example', 'practice'}
COMPLEXITY = ['essential', 'developing', 'complex']
ENGAGEMENT = ['warmup', 'lesson', 'exercise', 'assessment']


# ---------------------------------------------------------------- helpers
def slot_spec(slot):
    for phase, ph in SLOTS.items():
        if slot in ph['slots']:
            return phase, ph['slots'][slot]
    return None, None


def plain(obj):
    """Text with markup and entities stripped, for word-level rules."""
    s = json.dumps(obj, ensure_ascii=False)
    s = re.sub(r'<[^>]+>', ' ', s)
    s = re.sub(r'&[a-zA-Z#0-9]+;', ' ', s)
    return s


# ---------------------------------------------------------------- validate
FOUR_PART = ('givens', 'tools', 'primitives', 'computation')
SOLVE_REQ = ('goal', 'facts', 'steps', 'answer')
SOLVE_OPT = ('check',)


def check_work(cid, w):
    """contract 2.1.0: work is the four-part object or the solve object, never a mix."""
    if not isinstance(w, dict):
        return [f'{cid}: work must be an object (a string renders an empty fold)']
    keys = set(w)
    if keys & set(FOUR_PART) and keys & set(SOLVE_REQ + SOLVE_OPT):
        return [f'{cid}: work mixes the four-part and solve shapes']
    if keys & set(SOLVE_REQ + SOLVE_OPT):
        out = [f'{cid}: solve work needs {k}' for k in SOLVE_REQ if not w.get(k)]
        out += [f'{cid}: solve work has unknown field {k}' for k in keys - set(SOLVE_REQ + SOLVE_OPT)]
        for i, f in enumerate(w.get('facts') or []):
            if not (isinstance(f, str) or (isinstance(f, list) and len(f) == 2 and all(f))):
                out.append(f'{cid}: facts[{i}] must be "text" or [quote, math]')
        for i, st in enumerate(w.get('steps') or []):
            if not isinstance(st, dict) or not st.get('math') or set(st) - {'find', 'math'}:
                out.append(f'{cid}: steps[{i}] must be {{find?, math}}')
        return out
    return [f'{cid}: four-part work needs {k}' for k in FOUR_PART if not w.get(k)] + \
           [f'{cid}: work has unknown field {k}' for k in keys - set(FOUR_PART)]


def check_card(cid, c):
    out = []
    t, slot = c.get('type'), c.get('slot')

    if not t:
        return [f'{cid}: no type']
    if t not in TYPES:
        return [f'{cid}: unknown type "{t}" (valid: {", ".join(sorted(TYPES))})']
    if not slot:
        out.append(f'{cid}: no slot')
    else:
        phase, spec = slot_spec(slot)
        if not spec:
            allslots = sorted({s for ph in SLOTS.values() for s in ph['slots']})
            out.append(f'{cid}: unknown slot "{slot}" (valid: {", ".join(allslots)})')
        elif t not in spec['types']:
            out.append(f'{cid}: type "{t}" not allowed in {phase}/{slot} '
                       f'(allowed: {", ".join(spec["types"])})')

    if 'data' not in c:
        out.append(f'{cid}: no data')
    else:
        req = TYPES[t].get('dataFields', {}).get('required', [])
        for f in req:
            if f not in c['data'] or c['data'][f] in (None, '', [], {}):
                out.append(f'{cid}: data.{f} is required for type "{t}"')

    if t in TITLE_REQUIRED and not c.get('title'):
        out.append(f'{cid}: type "{t}" requires a title')
    if re.match(r'^Example\s*\d?\b', str(c.get('title') or '')):
        out.append(f'{cid}: title carries the structural word "Example" — supply only the description')

    if t in COMPLEXITY_TYPES:
        if 'complexity' not in c:
            out.append(f'{cid}: {t} needs complexity ({" | ".join(COMPLEXITY)})')
        elif c['complexity'] not in COMPLEXITY:
            out.append(f'{cid}: complexity "{c["complexity"]}" invalid')

    for s in c.get('standards', []):
        if not isinstance(s, dict) or 'code' not in s or 'engagement' not in s:
            out.append(f'{cid}: standards entries need code and engagement')
        elif s['engagement'] not in ENGAGEMENT:
            out.append(f'{cid}: engagement "{s["engagement"]}" invalid ({" | ".join(ENGAGEMENT)})')

    work = (c.get('data') or {}).get('work')
    if work is not None and t in COMPLEXITY_TYPES:
        out += check_work(cid, work)

    blob = json.dumps(c, ensure_ascii=False)
    txt = plain(c)
    for w in BANNED:
        if re.search(rf'\b{re.escape(w)}\b', txt, re.I):
            out.append(f'{cid}: banned word "{w}"')
    for pat in POSITIONAL:
        m = re.search(pat, txt, re.I)
        if m:
            out.append(f'{cid}: positional reference "{m.group(0)}" — use {{{{card:id}}}}')
    for lit, ent in LITERALS.items():
        if lit in blob:
            out.append(f'{cid}: literal "{lit}" — use {ent}')
    for bad in ('ordinal', 'position', 'lessonId', 'order', 'number'):
        if bad in c:
            out.append(f'{cid}: forbidden field "{bad}" — position belongs to the textbook')
    return out


def check_payload(obj):
    """Accepts a bare card map, or a full content-package."""
    errs, warns = [], []
    cards = obj.get('cards', obj if all(isinstance(v, dict) and 'type' in v
                                        for v in obj.values()) else {})
    if not cards:
        return ['no cards found — expected {"cards": {...}} or a bare card map'], []

    for cid, c in cards.items():
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', cid):
            warns.append(f'{cid}: id should be lowercase words joined by hyphens')
        errs += check_card(cid, c)

    # cross-references
    for cid, c in cards.items():
        for ref in re.findall(r'\{\{card:([\w-]+)\}\}', json.dumps(c)):
            if ref not in cards:
                warns.append(f'{cid}: reference "{ref}" is not in this package '
                             f'(fine if it exists in the library)')

    # hourglass, within topic
    RANK = {'complex': 0, 'developing': 1, 'essential': 2}
    for kind, ascending in (('example', True), ('practice', False)):
        by = collections.defaultdict(list)
        for cid, c in cards.items():
            if c.get('type') == kind:
                by[c.get('topic', '—')].append((cid, RANK.get(c.get('complexity'), 1)))
        for topic, items in by.items():
            order = [r for _, r in items]
            ok = order == sorted(order) if ascending else order == sorted(order, reverse=True)
            if not ok:
                want = 'complex → essential' if ascending else 'essential → complex'
                warns.append(f'hourglass: {kind} in "{topic}" is not {want} '
                             f'(package order; the textbook decides final sequence)')
    return errs, warns


# ---------------------------------------------------------------- commands
def cmd_types(a):
    for t in sorted(TYPES):
        f = TYPES[t].get('dataFields', {})
        req = ', '.join(f.get('required', [])) or '—'
        opt = ', '.join(f.get('optional', [])) or '—'
        where = [f'{p}/{s}' for p, ph in SLOTS.items() for s in ph['slots']
                 if t in ph['slots'][s]['types']]
        print(f'{t}')
        print(f'   required : {req}')
        print(f'   optional : {opt}')
        print(f'   slots    : {", ".join(where) or "none"}')
        if f.get('note'):
            print(f'   note     : {f["note"]}')


def cmd_slots(a):
    phases = [a.phase] if a.phase else C['phases']
    for p in phases:
        ph = SLOTS.get(p)
        if not ph:
            sys.exit(f'unknown phase "{p}" (valid: {", ".join(C["phases"])})')
        print(f'\n{p} — {ph["label"]}  [{ph["hunter"]}]')
        print(f'  {ph["purpose"]}')
        for s, spec in ph['slots'].items():
            lim = ' '.join(x for x in [
                f'min {spec["min"]}' if spec.get('min') else '',
                f'max {spec["max"]}' if spec.get('max') else '',
                spec.get('hourglass') or '',
                'ENGINE WRITES THIS' if spec.get('engineOwned') else ''] if x)
            print(f'    {s:<20} {", ".join(spec["types"]):<42}{lim}')
            if spec.get('notes'):
                print(f'      {spec["notes"]}')


def cmd_new(a):
    if a.type not in TYPES:
        sys.exit(f'unknown type "{a.type}" — run: card_tool.py types')
    phase, spec = slot_spec(a.slot)
    if not spec:
        sys.exit(f'unknown slot "{a.slot}" — run: card_tool.py slots')
    if a.type not in spec['types']:
        sys.exit(f'type "{a.type}" not allowed in {phase}/{a.slot} '
                 f'(allowed: {", ".join(spec["types"])})')

    f = TYPES[a.type].get('dataFields', {})
    card = {'type': a.type, 'slot': a.slot}
    if a.type in TITLE_REQUIRED:
        card['title'] = 'TODO — description only, never the word Example'
    if a.type in COMPLEXITY_TYPES:
        card['complexity'] = 'TODO — essential | developing | complex'
    card['topic'] = 'TODO — a search facet, not a filing instruction'
    card['standards'] = [{'code': 'TODO', 'engagement': 'TODO — ' + ' | '.join(ENGAGEMENT)}]
    data = {}
    for fld in f.get('required', []):
        data[fld] = ({'givens': 'TODO', 'tools': 'TODO', 'primitives': 'TODO',
                      'computation': 'TODO'} if fld == 'work' else 'TODO — required')
    card['data'] = data

    print(json.dumps({a.id: card}, ensure_ascii=False, indent=2))
    print(f'\n// optional for {a.type}: {", ".join(f.get("optional", [])) or "none"}', file=sys.stderr)
    if f.get('note'):
        print(f'// {f["note"]}', file=sys.stderr)
    print(f'// entities: ' + '  '.join(f'{v}' for v in LITERALS.values()), file=sys.stderr)


def cmd_check(a):
    obj = json.load(open(a.file, encoding='utf-8'))
    errs, warns = check_payload(obj)
    n = len(obj.get('cards', obj))
    for e in errs:
        print(f'  ✖  {e}')
    for w in warns:
        print(f'  ⚠  {w}')
    print(f'\n{n} cards · {len(errs)} errors · {len(warns)} warnings')
    sys.exit(1 if errs else 0)


def cmd_build_package(a):
    cards = json.load(open(a.cards, encoding='utf-8'))
    cards = cards.get('cards', cards)
    changes = json.load(open(a.textbook, encoding='utf-8')) if a.textbook else {}
    errs, warns = check_payload({'cards': cards})
    pkg = {
        'packageVersion': '1.0',
        'packageId': a.id or 'package',
        'createdWith': {'toolVersion': C.get('toolVersion', '0.2.0'),
                        'contractVersion': C['contractVersion']},
        'cards': cards,
        'textbookChanges': changes,
        'validation': {
            'structural': 'fail' if errs else 'pass',
            'strict': 'fail' if errs or warns else 'pass',
            'references': 'pass',
            'sequence': 'pass',
        },
        'intentionalWarnings': [],
        'notes': [],
    }
    json.dump(pkg, open(a.out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{a.out}  {len(cards)} cards · {len(errs)} errors · {len(warns)} warnings')
    if errs:
        print('validation recorded as FAIL — fix before sending')
        sys.exit(1)


def cmd_inspect(a):
    p = json.load(open(a.file, encoding='utf-8'))
    cards = p.get('cards', {})
    print(f'package : {p.get("packageId")}')
    print(f'built by: {p.get("createdWith")}')
    print(f'claims  : {p.get("validation")}')
    print(f'cards   : {len(cards)}')
    print('  types :', dict(collections.Counter(c.get('type') for c in cards.values())))
    print('  slots :', dict(collections.Counter(c.get('slot') for c in cards.values())))
    print('  topics:', dict(collections.Counter(c.get('topic') for c in cards.values())))
    print(f'notes   : {len(p.get("notes", []))}')
    print(f'warnings: {len(p.get("intentionalWarnings", []))}')


def cmd_apply(a):
    """Merge a package into a library. Re-validates first, always."""
    raw = open(a.library, encoding='utf-8').read()
    lib = json.loads(raw[raw.index('{'):raw.rindex(';')] if raw.lstrip().startswith('/*')
                     or 'window.' in raw[:200] else raw)
    if 'library' in lib and 'cards' not in lib:
        lib = lib['library']
    pkg = json.load(open(a.package, encoding='utf-8'))
    cards = pkg.get('cards', {})

    errs, warns = check_payload({'cards': cards})
    claimed = pkg.get('validation', {}).get('structural')
    if claimed == 'pass' and errs:
        print(f'  ⚠  package claimed structural PASS; {len(errs)} errors found on re-validation')
    if errs and not a.force:
        for e in errs[:10]:
            print(f'  ✖  {e}')
        sys.exit(f'\n{len(errs)} errors — not applied. Use --force to override.')

    added = [c for c in cards if c not in lib]
    replaced = [c for c in cards if c in lib]
    merged = dict(lib)
    merged.update(cards)

    out = a.out or 'library-updated.json'
    if out.endswith('.js'):
        open(out, 'w', encoding='utf-8').write(
            '/* CONTENT LIBRARY — cards only. */\nwindow.LIBRARY = '
            + json.dumps(merged, ensure_ascii=False, indent=1) + ';\n')
    else:
        json.dump(merged, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    print(f'{out}')
    print(f'  {len(added)} added · {len(replaced)} replaced · '
          f'{len(lib) - len(replaced)} unchanged · {len(merged)} total')
    if replaced:
        print(f'  replaced: {", ".join(replaced[:8])}{" …" if len(replaced) > 8 else ""}')
    if warns:
        print(f'  {len(warns)} warnings (applied anyway)')
    tc = pkg.get('textbookChanges')
    if tc:
        print('  textbookChanges present — NOT applied. The textbook is authored;')
        print('  edit textbook.js and run tools/validate-textbook.js.')


def main():
    ap = argparse.ArgumentParser(prog='card_tool.py', description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)

    sub.add_parser('types').set_defaults(fn=cmd_types)
    s = sub.add_parser('slots'); s.add_argument('phase', nargs='?'); s.set_defaults(fn=cmd_slots)
    s = sub.add_parser('new'); s.add_argument('type'); s.add_argument('slot'); s.add_argument('id')
    s.set_defaults(fn=cmd_new)
    s = sub.add_parser('check'); s.add_argument('file'); s.set_defaults(fn=cmd_check)
    s = sub.add_parser('build-package')
    s.add_argument('--cards', required=True); s.add_argument('--textbook')
    s.add_argument('--out', required=True); s.add_argument('--id')
    s.set_defaults(fn=cmd_build_package)
    s = sub.add_parser('inspect'); s.add_argument('file'); s.set_defaults(fn=cmd_inspect)
    s = sub.add_parser('apply'); s.add_argument('library'); s.add_argument('package')
    s.add_argument('--out'); s.add_argument('--force', action='store_true')
    s.set_defaults(fn=cmd_apply)

    a = ap.parse_args()
    a.fn(a)


if __name__ == '__main__':
    main()

"""Collect existing booth renders, keep unique files, and build the static catalog."""
from pathlib import Path
from bs4 import BeautifulSoup
import hashlib, json, shutil, subprocess

ROOT = Path(__file__).parent
SOURCE = Path.home() / 'Downloads/TARGI STOISKO'
OLD = SOURCE / '15_KONCEPCJI_2026-09-08'
FIRST = SOURCE / '5_KONCEPCJI_2026-09-08'
NEW = SOURCE / '10_NOWYCH_KONCEPCJI_3_RZUTY_2026-09-08'
(ROOT / 'assets').mkdir(exist_ok=True)
(ROOT / 'thumbs').mkdir(exist_ok=True)
items, seen = [], set()
mapping = {'04': 1, '05': 2, '07': 3}
def asset(file, thumbnail=False):
    digest = hashlib.sha256(file.read_bytes()).hexdigest()[:20]
    target = ROOT / 'assets' / (digest + file.suffix.lower())
    if not target.exists(): shutil.copy2(file, target)
    thumb = ROOT / 'thumbs' / (digest + '.jpg')
    if thumbnail and not thumb.exists():
        subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', '-Z', '900', str(file), '--out', str(thumb)], check=True, capture_output=True)
    return str(target.relative_to(ROOT)), str(thumb.relative_to(ROOT)), digest
originals = {mapping[v]: asset(NEW / 'MATERIALY' / f'ORYGINAL_{v}.jpeg')[0] for v in mapping}
def add(file, n, title, description, view, series, attachments=None):
    if not file.exists(): raise FileNotFoundError(file)
    url, thumb, digest = asset(file, True)
    if digest in seen: return
    seen.add(digest)
    items.append(dict(id=digest, concept=n, title=title, description=description, view=view, series=series,
                      src=url, thumb=thumb, original=originals[view], attachments=attachments or []))

# Complete three-camera concepts first; never publish broken image references.
for folder in sorted(NEW.glob('[0-9]*')):
    c = json.loads((folder / 'KONCEPCJA.json').read_text())
    for v, name in [(1, '01_NAROZNIK_PORTAL.png'), (2, '02_WNETRZE_TOP1.png'), (3, '03_STRONA_ELBA.png')]:
        add(folder / name, c['n'], c['title'], c['short'], v, 'Trzy rzuty')

html = BeautifulSoup((OLD / 'START.html').read_text(), 'html.parser')
for card in html.select('article'):
    n, v = int(card['data-n']), mapping[card['data-view']]
    file = OLD / card.select_one('.image-button img')['src']
    attachments = []
    if n <= 5:
        folder = next(FIRST.glob(f'{n:02}_*'))
        preferred = folder / f'WIZUALIZACJA{n}.png'
        if preferred.exists(): file = preferred
        for name in ['PORTFOLIO.svg', 'TOP1_3W1.svg', 'PORTFOLIO.png', 'TOP1_3W1.png']:
            f = folder / name
            if f.exists(): attachments.append(dict(name=name, src=asset(f)[0]))
    add(file, n, card.h2.text, card.select_one('.card-head p').text, v, 'Pierwsze koncepcje', attachments)
    # Preserve genuinely different previous variants, without repeated copies.
    prior = OLD / card.select_one('.image-button img')['src']
    if prior != file: add(prior, n, card.h2.text, 'Wcześniejszy wariant tej koncepcji.', v, 'Wcześniejsze warianty', attachments)

PREMIUM = ROOT.parent / 'output/targi-2026-09-08/premium'
if (PREMIUM / 'concepts.json').exists():
    premium = json.loads((PREMIUM / 'concepts.json').read_text())
    for c in premium['concepts']:
        attachments = [
            dict(name='Oryginalne logotypy.png', src=asset(PREMIUM / 'logos.png')[0]),
            dict(name='Wykorzystane zdjęcia i wizualizacje.png', src=asset(PREMIUM / (c['board']+'.png'))[0]),
        ]
        for v in [1,2,3]:
            add(PREMIUM / f'{c["n"]}-rzut-{v}.png', c['n'], c['title'], c['short'], v, 'Nowe · spójna seria', attachments)
items.sort(key=lambda x: (0 if x['concept']>=16 else 1, x['concept'], x['view'], x['series']))
data = dict(items=items, originals=originals, updated='2026-09-08')
(ROOT / 'catalog.js').write_text('window.TARGI_CATALOG = ' + json.dumps(data, ensure_ascii=False) + ';\n')
(ROOT / '.nojekyll').touch()
shutil.copy2(ROOT / 'index.html', ROOT / 'start.html')
print(json.dumps(dict(total=len(items), views={v:sum(i['view']==v for i in items) for v in [1,2,3]})))

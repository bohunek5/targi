"""Browser checks: run against a local server, or pass a deployed base URL."""
from pathlib import Path
import json, sys, zipfile, hashlib
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent
OUT = ROOT / 'test-results'
OUT.mkdir(exist_ok=True)
URL = sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width':1600,'height':1100}, accept_downloads=True)
    page = context.new_page()
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(URL,wait_until='networkidle')
    data = page.evaluate('window.TARGI_CATALOG')
    total = len(data['items'])
    assert total >= 45
    assert page.locator('.card').count()==total
    # Every gallery file is reachable, including images lazy-loaded below the fold.
    paths = {item[k] for item in data['items'] for k in ['src','thumb','original']}
    paths.update(a['src'] for i in data['items'] for a in i['attachments'])
    for path in paths:
        assert context.request.get(URL+path).ok, path
    widths=page.locator('.card').evaluate_all('(cards)=>cards.slice(0,5).map(c=>({x:c.offsetLeft,y:c.offsetTop}))')
    assert len({c['y'] for c in widths[:4]})==1 and widths[4]['y']>widths[0]['y']
    img=page.locator('.image-button img').first.bounding_box()
    assert abs(img['width']/img['height']-16/9)<.03
    for view in [1,2,3]:
        page.locator(f'[data-view="{view}"]').click()
        assert page.locator('.card').count()==sum(i['view']==view for i in data['items'])
    page.locator('[data-view="all"]').click()
    page.locator('[data-layout="list"]').click()
    assert page.locator('.gallery.list').count()==1
    page.reload(wait_until='networkidle')
    assert page.locator('.gallery.list').count()==1
    page.locator('[data-layout="grid"]').click()
    id=page.locator('.card').first.get_attribute('data-id')
    page.locator('.star').first.click()
    page.reload(wait_until='networkidle')
    assert page.locator(f'[data-id="{id}"] .star').get_attribute('aria-pressed')=='true'
    page.locator('#favorites').click()
    assert page.locator('.card').count()==1
    page.locator('.image-button').first.click()
    assert page.locator('#viewer').is_visible()
    original=page.locator('#viewer-image').get_attribute('src')
    page.locator('#compare').click()
    assert page.locator('#viewer-image').get_attribute('src')!=original
    page.keyboard.press('Escape')
    assert not page.locator('#viewer').is_visible()
    with page.expect_download() as download:
        page.locator('#download-visible').click()
    zip_path=OUT/'favorites.zip';download.value.save_as(zip_path)
    with zipfile.ZipFile(zip_path) as z:
        assert len(z.namelist())==1
        assert z.testzip() is None
        item=next(i for i in data['items'] if i['id']==id)
        assert hashlib.sha256(z.read(z.namelist()[0])).digest()==hashlib.sha256(context.request.get(URL+item['src']).body()).digest()
    page.locator('#favorites').click()
    page.locator('#search').fill('nieistniejąca-koncepcja-xyz')
    assert page.locator('#empty').is_visible()
    page.locator('#reset').click()
    # Upload, persist, export, delete and recover one image with its favorite.
    fixture=next(ROOT.glob('thumbs/*.jpg'))
    page.locator('#add').click()
    page.locator('#upload-view').select_option('2')
    page.locator('#upload-title-input').fill('Test importu — własny rzut')
    page.locator('#upload-files').set_input_files(str(fixture))
    page.locator('#upload-submit').click()
    page.wait_for_selector('#upload-dialog',state='hidden')
    assert page.locator('.card').count()==1
    custom_id=page.locator('.card').first.get_attribute('data-id')
    assert custom_id.startswith('custom-')
    page.locator('.star').first.click()
    with page.expect_download() as download:
        page.locator('#export').click()
    backup=OUT/'backup.json';download.value.save_as(backup)
    assert len(json.loads(backup.read_text())['images'])==1
    page.reload(wait_until='networkidle')
    page.locator('#mine').click()
    assert page.locator('.card').count()==1
    page.once('dialog',lambda d:d.accept())
    page.locator('[data-action="delete"]').click()
    page.wait_for_selector('.card',state='detached')
    page.locator('#import-file').set_input_files(str(backup))
    page.wait_for_selector('.card')
    assert page.locator('.card').first.get_attribute('data-id')==custom_id
    assert page.locator('.star').first.get_attribute('aria-pressed')=='true'
    # Clean test-only state before screenshots.
    page.evaluate('localStorage.clear()')
    page.evaluate('''()=>new Promise((resolve,reject)=>{const r=indexedDB.open('prescot-targi',1);r.onsuccess=()=>{const t=r.result.transaction('images','readwrite');t.objectStore('images').clear();t.oncomplete=resolve;t.onerror=reject;};})''')
    page.goto(URL,wait_until='networkidle')
    if any(i['concept']>=16 for i in data['items']):
        page.locator('#latest').click()
        assert page.locator('.card').count()==sum(i['concept']>=16 for i in data['items'])
        for view in [1,2,3]:
            page.locator(f'[data-view="{view}"]').click()
            assert page.locator('.card').count()==sum(i['concept']>=16 and i['view']==view for i in data['items'])
        page.locator('[data-view="all"]').click()
        page.locator('#latest').click()
    page.screenshot(path=str(OUT/'desktop.png'))
    for width in [390,768,1024]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
        if width==390:page.screenshot(path=str(OUT/'mobile.png'))
    assert not errors,errors
    browser.close()
    print(json.dumps({'status':'passed','visualizations':total,'reachable_files':len(paths),'filters':True,'favorites_persist':True,'zip_integrity':True,'upload_backup_restore':True,'mobile_overflow':False,'javascript_errors':errors}))

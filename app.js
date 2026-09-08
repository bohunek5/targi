'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const catalog = window.TARGI_CATALOG;
const labels = {1:'Narożnik i portal',2:'Wnętrze i strefa rozmów',3:'Druga strona · KLUŚ / ELBA',4:'Portal — środek'};
const key = 'targi-gallery-v1';
let preferences = {};
try { preferences = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
let favorites = new Set(Array.isArray(preferences.favorites) ? preferences.favorites : []);
let layout = preferences.layout === 'list' ? 'list' : 'grid';
let selectedView = ['1','2','3','4'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'all';
let onlyFavorites = false, onlyMine = false, onlyTablets = new URLSearchParams(location.search).get('tablety')==='1', onlyLatest = new URLSearchParams(location.search).get('nowe')==='1', uploads = [], items = [...catalog.items], visible = [];
let db, currentId, comparing = false, toastTimer;
const urls = new Map();
function toast(message) { $('#toast').textContent=message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),5000); }
function savePreferences() { try { localStorage.setItem(key,JSON.stringify({favorites:[...favorites],layout})); } catch { toast('Przeglądarka nie zapisała ustawień. Wyeksportuj kopię danych.'); } }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function source(item) { if (!item.custom) return item.src; if (!urls.has(item.id)) urls.set(item.id,URL.createObjectURL(item.blob)); return urls.get(item.id); }
function downloadName(item) { return `${item.view===4?'portal-srodek':'rzut-'+item.view}_${String(item.number || item.concept || 'moje').padStart(2,'0')}_${item.title.replace(/[^\p{L}\p{N} -]/gu,'').replace(/\s+/g,'-').slice(0,65)}_${item.id.slice(-6)}.${item.custom ? ({'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[item.blob.type] || 'png') : item.src.split('.').pop()}`; }
function rebuild() { items=[...uploads,...catalog.items]; render(); }
function render() {
  visible=items.filter(i=>(selectedView==='all'||String(i.view)===selectedView)&&(!onlyFavorites||favorites.has(i.id))&&(!onlyMine||i.custom)&&(!onlyLatest||i.concept>=16)&&(!onlyTablets||i.concept===19||i.concept===20)&&($('#concept').value==='all'||String(i.concept)===$('#concept').value));
  $('#gallery').className=`gallery ${layout}`;
  const cardHTML=i=>`<article class="card ${i.view===4?'portal-card':''}" data-id="${i.id}"><button class="image-button" data-action="open" aria-label="Powiększ: ${escapeHTML(i.title)} — ${i.view===4?'portal — środek':'rzut '+i.view}"><img src="${escapeHTML(i.custom?source(i):i.thumb)}" alt="${escapeHTML(i.title)} — ${labels[i.view]}" loading="lazy" width="900" height="506"></button><button class="star ${favorites.has(i.id)?'on':''}" data-action="favorite" aria-pressed="${favorites.has(i.id)}" aria-label="${favorites.has(i.id)?'Usuń z':'Dodaj do'} ulubionych: ${escapeHTML(i.title)}">${favorites.has(i.id)?'★':'☆'}</button><div class="card-body"><div class="card-meta">${i.custom?'MOJE':String(i.number || i.concept).padStart(2,'0')} / ${i.view===4?'PORTAL — ŚRODEK':'RZUT '+i.view} · ${escapeHTML(i.series)}</div><h3>${escapeHTML(i.title)}</h3><p>${escapeHTML(i.description)}</p><div class="card-actions"><button data-action="open">Powiększ ↗</button><a href="${escapeHTML(source(i))}" download="${escapeHTML(downloadName(i))}">↓ Pobierz</a>${i.custom?'<button class="delete" data-action="delete">Usuń</button>':''}</div>${i.attachments?.length?`<details><summary>Materiały i plansze</summary>${i.attachments.map(a=>`<a href="${escapeHTML(a.src)}" data-action="material" data-name="${escapeHTML(a.name)}">${escapeHTML(a.name)} ↗</a>`).join('')}</details>`:''}</div></article>`;
  const groups=new Map();
  const seriesOrder={'Nowe · spójna seria':0,'Trzy rzuty':0,'Warianty z tabletami':0,'Pierwsze koncepcje':1,'Wcześniejsze warianty':2};
  const ordered=[...visible].sort((a,b)=>(a.custom?0:1)-(b.custom?0:1)||(a.concept>=19?0:a.concept>=16?1:2)-(b.concept>=19?0:b.concept>=16?1:2)||(a.concept||0)-(b.concept||0)||(seriesOrder[a.series]??3)-(seriesOrder[b.series]??3)||a.view-b.view);
  visible=ordered;
  for(const i of ordered){const groupKey=i.custom?'custom':`${i.concept}:${i.series}`;if(!groups.has(groupKey))groups.set(groupKey,[]);groups.get(groupKey).push(i);}
  $('#gallery').innerHTML=[...groups.values()].map(group=>{const i=group[0];return `<h3 class="concept-heading">${i.custom?'Moje obrazy':`Wariant ${String(i.number || i.concept).padStart(2,'0')} · ${escapeHTML(i.title)}`}<span>${escapeHTML(i.custom?'Własna kolekcja':i.series)}</span></h3>`+group.map(cardHTML).join('');}).join('');
  $('#empty').hidden=visible.length>0;
  $('#visible-count').textContent=`(${visible.length})`;
  $('#section-title').firstChild.textContent=selectedView==='all'?'Wszystkie wizualizacje ':selectedView==='4'?'Portal — środek ':`Rzut ${selectedView} · ${labels[selectedView]} `;
  $('#section-label').textContent=onlyFavorites?'TWOJE ULUBIONE':onlyMine?'TWOJE WIZUALIZACJE':onlyTablets?'TABLETY · DWIE OPCJE · RZUTY 1–3 + PORTAL':onlyLatest?'NOWE KONCEPCJE · REKLAMY, SZUFLADY I TABLETY':selectedView==='all'?'CAŁA KOLEKCJA':'RÓŻNE KONCEPCJE TEJ SAMEJ STRONY';
  $('#total-count').textContent=items.length;
  $('#concept-count').textContent=new Set(catalog.items.map(i=>i.concept)).size;
  $('#favorite-count').textContent=items.filter(i=>favorites.has(i.id)).length;
  $('#favorites').setAttribute('aria-pressed',onlyFavorites);
  $('#mine').setAttribute('aria-pressed',onlyMine);
  $('#latest').setAttribute('aria-pressed',onlyLatest);
  $('#tablets').setAttribute('aria-pressed',onlyTablets);
  $$('[data-view]').forEach(b=>{const active=b.dataset.view===selectedView;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  $$('[data-layout]').forEach(b=>{b.classList.toggle('active',b.dataset.layout===layout);b.setAttribute('aria-pressed',b.dataset.layout===layout);});
  $$('[data-count]').forEach(e=>e.textContent=items.filter(i=>e.dataset.count==='all'||String(i.view)===e.dataset.count).length);
  $('#download-visible').disabled=!visible.length;
}
function toggleFavorite(id) { favorites.has(id)?favorites.delete(id):favorites.add(id);savePreferences();render();if($('#viewer').open) paintViewer(); }
function syncURL(){history.replaceState(null,'',location.pathname+(onlyTablets?'?tablety=1':onlyLatest?'?nowe=1':'')+(selectedView==='all'?'':'#'+selectedView));}
$$('[data-view]').forEach(b=>b.onclick=()=>{selectedView=b.dataset.view;syncURL();render();});
$$('[data-layout]').forEach(b=>b.onclick=()=>{layout=b.dataset.layout;savePreferences();render();});
$('#favorites').onclick=()=>{onlyFavorites=!onlyFavorites;render();};
$('#mine').onclick=()=>{onlyMine=!onlyMine;render();};
$('#latest').onclick=()=>{onlyLatest=!onlyLatest;onlyMine=onlyTablets=false;syncURL();render();};
$('#tablets').onclick=()=>{onlyTablets=!onlyTablets;onlyMine=onlyLatest=false;$('#concept').value='all';syncURL();render();};
$('#concept').onchange=render;
$$('[data-reset]').forEach(button=>button.onclick=()=>{selectedView='all';onlyFavorites=onlyMine=onlyLatest=onlyTablets=false;$('#concept').value='all';history.replaceState(null,'',location.pathname);render();});
$('#gallery').onclick=async e=>{const b=e.target.closest('[data-action]');if(!b)return;const id=b.closest('.card').dataset.id;
  if(b.dataset.action==='material'){e.preventDefault();openMaterial(b.getAttribute('href'),b.dataset.name);return;}
  if(b.dataset.action==='favorite')toggleFavorite(id);
  if(b.dataset.action==='open')openViewer(id);
  if(b.dataset.action==='delete'){
    const removed=uploads.find(i=>i.id===id);if(!removed)return;
    b.disabled=true;b.textContent='Usuwanie…';
    try {
      await writeDB('delete',[id]);uploads=uploads.filter(i=>i.id!==id);favorites.delete(id);
      if(urls.has(id)){URL.revokeObjectURL(urls.get(id));urls.delete(id);}
      savePreferences();rebuild();
      toast('Usunięto obraz.');
    } catch { b.disabled=false;b.textContent='Usuń';toast('Nie udało się usunąć obrazu. Spróbuj ponownie.'); }
  }
};
function openMaterial(src,name) {
  $('#material-title').textContent=name;
  $('#material-image').src=src;
  $('#material-image').alt=name;
  $('#material-download').href=src;
  $('#material-download').download=name;
  $('#material-viewer').showModal();
}
$('#close-material').onclick=()=>$('#material-viewer').close();
let viewerOrder=[];
function openViewer(id) { currentId=id;comparing=false;viewerOrder=visible.map(i=>i.id);paintViewer();$('#viewer').showModal(); }
function paintViewer() {
  const i=items.find(i=>i.id===currentId);if(!i)return;
  $('#viewer-title').textContent=i.title;
  $('#viewer-label').textContent=`${i.view===4?labels[4]:'RZUT '+i.view+' · '+labels[i.view]}${comparing?' · ORYGINALNY PROJEKT KLUŚ':''}`;
  $('#viewer-image').src=comparing?i.original:source(i);
  $('#viewer-image').alt=`${i.title} — ${comparing?'oryginalny projekt':labels[i.view]}`;
  $('#viewer-position').textContent=`${viewerOrder.indexOf(i.id)+1} / ${viewerOrder.length} · ← → zmień obraz`;
  $('#compare').hidden=!i.original;
  $('#compare').textContent=comparing?'Pokaż wizualizację':'Pokaż oryginał';
  $('#viewer-favorite').textContent=favorites.has(i.id)?'★ W ulubionych':'☆ Do ulubionych';
  $('#viewer-favorite').classList.toggle('on',favorites.has(i.id));
  $('#viewer-favorite').setAttribute('aria-pressed',favorites.has(i.id));
  $('#viewer-download').href=comparing?i.original:source(i);
  $('#viewer-download').download=comparing?`oryginal-rzut-${i.view}.jpeg`:downloadName(i);
}
function moveViewer(direction) {currentId=viewerOrder[(viewerOrder.indexOf(currentId)+direction+viewerOrder.length)%viewerOrder.length];comparing=false;paintViewer();}
$('#close-viewer').onclick=()=>$('#viewer').close();
$('#previous').onclick=()=>moveViewer(-1);$('#next').onclick=()=>moveViewer(1);
$('#compare').onclick=()=>{comparing=!comparing;paintViewer();};
$('#viewer-favorite').onclick=()=>toggleFavorite(currentId);
document.addEventListener('keydown',e=>{if(!$('#viewer').open)return;if(e.key==='ArrowLeft')moveViewer(-1);if(e.key==='ArrowRight')moveViewer(1);});

function openDB() {return new Promise((resolve,reject)=>{const req=indexedDB.open('prescot-targi',1);req.onupgradeneeded=()=>req.result.createObjectStore('images',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function readDB() {return new Promise((resolve,reject)=>{const req=db.transaction('images').objectStore('images').getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function writeDB(operation,values) {return new Promise((resolve,reject)=>{if(!db)return reject(new Error('Pamięć przeglądarki jest niedostępna.'));const tx=db.transaction('images','readwrite');values.forEach(v=>tx.objectStore('images')[operation](v));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
$('#add').onclick=()=>{$('#upload-view').value=selectedView==='all'?'1':selectedView;$('#upload-error').textContent='';$('#upload-dialog').showModal();};
$('#cancel-upload').onclick=()=>$('#upload-dialog').close();
async function validateImage(blob) {if(!['image/png','image/jpeg','image/webp'].includes(blob.type)||blob.size>20*1024*1024)throw new Error('Wybierz PNG, JPG lub WebP do 20 MB na plik.');const image=await createImageBitmap(blob);if(!image.width||!image.height)throw new Error('Nieprawidłowy obraz.');image.close();}
async function imageId(blob) {const hash=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());return 'custom-'+[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');}
$('#upload-form').onsubmit=async e=>{
  e.preventDefault();const button=$('#upload-submit');button.disabled=true;
  try {
    const batch=[];const view=Number($('#upload-view').value);
    for(const file of $('#upload-files').files){await validateImage(file);const id=await imageId(file);if(uploads.some(i=>i.id===id)||batch.some(i=>i.id===id))continue;
      batch.push({id,custom:true,blob:file,title:$('#upload-title-input').value.trim()||file.name.replace(/\.[^.]+$/,''),description:file.name,view,series:'Dodane przeze mnie',original:catalog.originals[view],created:Date.now()});
    }
    await writeDB('put',batch);uploads.unshift(...batch);selectedView=String(view);onlyFavorites=onlyLatest=onlyTablets=false;onlyMine=true;$('#concept').value='all';rebuild();$('#upload-dialog').close();$('#upload-form').reset();toast(batch.length?`Dodano ${batch.length} obrazów. Zapisano w tej przeglądarce.`:'Te obrazy są już w galerii.');
  } catch(e){$('#upload-error').textContent=e.message||'Nie udało się zapisać plików. Sprawdź wolne miejsce w przeglądarce.';} finally{button.disabled=false;}
};
function downloadBlob(blob,name) {const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function dataURL(blob) {return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}
$('#export').onclick=async()=>{
  const button=$('#export');button.disabled=true;
  try{const images=await Promise.all(uploads.map(async i=>{const {blob,...meta}=i;return {...meta,data:await dataURL(blob)};}));downloadBlob(new Blob([JSON.stringify({format:'prescot-targi',version:1,favorites:[...favorites],layout,images})],{type:'application/json'}),'targi-moje-dane.json');toast('Pobrano kopię ulubionych i własnych obrazów.');}catch{toast('Eksport nie powiódł się. Spróbuj ponownie.');}finally{button.disabled=false;}
};
$('#import').onclick=()=>$('#import-file').click();
$('#import-file').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    if(file.size>250*1024*1024)throw new Error('Kopia jest zbyt duża (maks. 250 MB).');
    const data=JSON.parse(await file.text());
    if(data.format!=='prescot-targi'||data.version!==1||!Array.isArray(data.images)||!Array.isArray(data.favorites))throw new Error('Nieprawidłowa kopia danych targi.');
    const batch=[];
    for(const i of data.images){
      if(![1,2,3,4].includes(i.view)||typeof i.title!=='string'||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(i.data))throw new Error('Kopia zawiera nieprawidłowy obraz.');
      const blob=await (await fetch(i.data)).blob();await validateImage(blob);const id=await imageId(blob);
      if(id!==i.id)throw new Error('Zawartość obrazu nie zgadza się z kopią.');
      if(!uploads.some(u=>u.id===id)&&!batch.some(u=>u.id===id))batch.push({id,custom:true,blob,title:i.title.slice(0,120),description:String(i.description||'').slice(0,300),view:i.view,series:'Dodane przeze mnie',original:catalog.originals[i.view],created:Date.now()});
    }
    await writeDB('put',batch);uploads.push(...batch);const known=new Set([...catalog.items,...uploads].map(i=>i.id));data.favorites.filter(id=>known.has(id)).forEach(id=>favorites.add(id));if(['grid','list'].includes(data.layout))layout=data.layout;savePreferences();rebuild();toast(`Wczytano kopię. Nowe obrazy: ${batch.length}.`);
  }catch(e){toast(e.message||'Nie udało się wczytać kopii.');}finally{e.target.value='';}
};
// Uncompressed ZIP: no external library, all images retain their original bytes.
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let crc=0xffffffff;for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function zipHeader(size){const bytes=new Uint8Array(size);return {bytes,view:new DataView(bytes.buffer)};}
async function makeZip(list,onProgress){
  const parts=[],central=[];let offset=0;
  for(let index=0;index<list.length;index++){
    const item=list[index];onProgress(index+1,list.length);let blob=item.blob;
    if(!blob){const response=await fetch(item.src);if(!response.ok)throw new Error(`Nie udało się pobrać: ${item.title}`);blob=await response.blob();}
    const bytes=new Uint8Array(await blob.arrayBuffer()),name=new TextEncoder().encode(downloadName(item)),crc=crc32(bytes);
    const h=zipHeader(30);h.view.setUint32(0,0x04034b50,true);h.view.setUint16(4,20,true);h.view.setUint16(6,0x800,true);h.view.setUint16(12,33,true);h.view.setUint32(14,crc,true);h.view.setUint32(18,bytes.length,true);h.view.setUint32(22,bytes.length,true);h.view.setUint16(26,name.length,true);
    parts.push(h.bytes,name,bytes);
    const c=zipHeader(46);c.view.setUint32(0,0x02014b50,true);c.view.setUint16(4,20,true);c.view.setUint16(6,20,true);c.view.setUint16(8,0x800,true);c.view.setUint16(14,33,true);c.view.setUint32(16,crc,true);c.view.setUint32(20,bytes.length,true);c.view.setUint32(24,bytes.length,true);c.view.setUint16(28,name.length,true);c.view.setUint32(42,offset,true);central.push(c.bytes,name);offset+=30+name.length+bytes.length;
  }
  const centralLength=central.reduce((n,b)=>n+b.length,0),end=zipHeader(22);end.view.setUint32(0,0x06054b50,true);end.view.setUint16(8,list.length,true);end.view.setUint16(10,list.length,true);end.view.setUint32(12,centralLength,true);end.view.setUint32(16,offset,true);return new Blob([...parts,...central,end.bytes],{type:'application/zip'});
}
$('#download-visible').onclick=async()=>{
  const button=$('#download-visible'),list=[...visible];button.disabled=true;
  try{downloadBlob(await makeZip(list,(n,total)=>button.textContent=`Pobieranie ${n} / ${total}…`),`targi-${onlyFavorites?'ulubione-':''}${selectedView==='all'?'wszystkie':'rzut-'+selectedView}.zip`);toast(`Gotowe: ${list.length} obrazów w ZIP.`);}catch(e){toast(e.message||'Pobieranie nie powiodło się. Spróbuj ponownie.');}finally{button.disabled=false;button.textContent='↓ Pobierz widoczne ZIP';}
};
async function init(){
  for(const v of [1,2,3])$('#reference-'+v).src=catalog.originals[v];
  $('#reference-4').src=catalog.items.find(i=>i.view===4).thumb;
  const concepts=new Map(catalog.items.map(i=>[i.concept,i.title]));
  [...concepts].sort((a,b)=>catalog.items.find(i=>i.concept===a[0]).number-catalog.items.find(i=>i.concept===b[0]).number).forEach(([n,title])=>{const option=document.createElement('option');option.value=n;option.textContent=String(catalog.items.find(i=>i.concept===n).number).padStart(2,'0')+' · '+title;$('#concept').append(option);});
  render();
  try{db=await openDB();uploads=await readDB();rebuild();}catch{toast('Pamięć przeglądarki jest niedostępna. Dodawanie obrazów wymaga zapisu lokalnego.');}
}
init();

'use strict';
/* Reiseatelier Web – Speicherschicht.
   Reihenfolge: gemeinsamer Cloud-Speicher (eingeladene Bearbeiter*innen) → eigener Cloud-Speicher → dieses Gerät (IndexedDB).
   Alle drei bieten dieselbe kleine Dokument-Schnittstelle, damit Reise, Tagebuch, Sicherungen und Abgleich überall gleich laufen. */
(function(root){
const DRAFT='reiseatelier.web.pending.v1',SYNC_STATUS='reiseatelier.web.syncstatus.v1';
const CHUNK=80000,MAX_BACKUPS=15;
let revision=0,meta=null,tail=Promise.resolve(),pending=0,blocked=false,mode=null,base=null,remoteRev=0,dl=null,initP=null;
const C=()=>root.TravelCore;
const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((a,k)=>(a[k]=v[k],a),{}):v);
const rand=()=>Math.random().toString(36).slice(2,8);
const stamp=()=>new Date().toISOString();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function withTimeout(p,ms,msg){let t;return Promise.race([p,new Promise((_,rej)=>{t=setTimeout(()=>rej(Error(msg)),ms);})]).finally(()=>clearTimeout(t));}
async function retry(fn){try{return await fn();}catch(e){if(e&&e.code==='unavailable'){await sleep(400+Math.random()*600);return fn();}throw e;}}
function errText(e){if(!e)return 'Unbekannter Fehler.';if(e.code==='quota_exceeded')return 'Speicherplatz ist voll. Bitte Reise exportieren und alte Fotos entfernen.';if(e.code==='invalid_argument')return 'Keine Schreibrechte für diese Reise.';if(e.code==='revoked'||e.code==='not_granted')return 'Kein Zugriff mehr auf den Cloud-Speicher. Seite neu öffnen.';return e.message||String(e);}
function split(json){const out=[];let i=0;while(i<json.length){let end=Math.min(i+CHUNK,json.length);const c=json.charCodeAt(end-1);if(end<json.length&&c>=0xD800&&c<=0xDBFF)end--;out.push(json.slice(i,end));i=end;}return out.length?out:[''];}

/* ---------- Gerätespeicher mit derselben Schnittstelle wie der Cloud-Speicher ---------- */
function makeKV(){
  let dbp=null;const mem=new Map();
  try{if(root.indexedDB)dbp=new Promise((res,rej)=>{const r=indexedDB.open('reiseatelier-web',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}catch{dbp=null;}
  const tx=async(m,fn)=>{const db=await dbp;return new Promise((res,rej)=>{const t=db.transaction('kv',m),s=t.objectStore('kv'),r=fn(s);t.oncomplete=()=>res(r&&r.result);t.onerror=()=>rej(t.error||Error('Gerätespeicher-Fehler'));t.onabort=()=>rej(t.error||Error('Gerätespeicher voll'));});};
  const ok=async()=>{if(!dbp)return false;try{await dbp;return true;}catch{return false;}};
  return {
    async get(k){if(await ok())return tx('readonly',s=>s.get(k));if(mem.has(k))return mem.get(k);try{const v=localStorage.getItem('ra.'+k);return v?JSON.parse(v):undefined;}catch{return undefined;}},
    async set(k,v){if(await ok())return tx('readwrite',s=>s.put(v,k));mem.set(k,v);try{localStorage.setItem('ra.'+k,JSON.stringify(v));}catch{}},
    async del(k){if(await ok())return tx('readwrite',s=>s.delete(k));mem.delete(k);try{localStorage.removeItem('ra.'+k);}catch{}},
    async keys(){if(await ok())return tx('readonly',s=>s.getAllKeys());const out=new Set(mem.keys());try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('ra.'))out.add(k.slice(3));}}catch{}return [...out];},
  };
}
function localDoc(kv,path){
  const snap=(id,v)=>({id,exists:v!==undefined,data:()=>v,metadata:{fromCache:false,hasPendingWrites:false}});
  const id=path.split('/').pop();
  return {id,path,
    async get(){return snap(id,await kv.get(path));},
    async set(v){await kv.set(path,JSON.parse(JSON.stringify(v)));},
    async update(v){const cur=await kv.get(path);await kv.set(path,{...(cur||{}),...v});},
    async delete(){await kv.del(path);},
    onSnapshot(){return ()=>{};},
    collection(c){return localCol(kv,path+'/'+c);}};
}
function localCol(kv,path,order){
  const depth=path.split('/').length+1;
  const run=async()=>{const ks=(await kv.keys()).filter(k=>k.startsWith(path+'/')&&k.split('/').length===depth);let docs=[];for(const k of ks){const v=await kv.get(k);if(v!==undefined)docs.push({id:k.split('/').pop(),exists:true,data:()=>v,metadata:{fromCache:false,hasPendingWrites:false}});}
    if(order){const [f,dir]=order;docs.sort((a,b)=>String(a.data()[f]).localeCompare(String(b.data()[f]))*(dir==='desc'?-1:1));}else docs.sort((a,b)=>a.id.localeCompare(b.id));
    return {docs,size:docs.length,empty:!docs.length,metadata:{fromCache:false,hasPendingWrites:false}};};
  return {path,doc:id=>localDoc(kv,path+'/'+(id||crypto.randomUUID())),get:run,orderBy:(f,dir)=>localCol(kv,path,[f,dir]),onSnapshot(){return ()=>{};}};
}

/* ---------- Datei speichern ohne Claude: Teilen-Menü (iPhone/iPad: „In Dateien sichern“) oder normaler Download ---------- */
async function saveFile(filename,text){const blob=new Blob([text],{type:'application/json'});
  try{const file=new File([blob],filename,{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[file]})&&/iPhone|iPad|Macintosh/.test(navigator.userAgent)&&'ontouchend' in document){await navigator.share({files:[file],title:filename});return true;}}
  catch(e){if(e&&e.name==='AbortError')return false;
    if(e&&e.name==='NotAllowedError'&&typeof confirmAction==='function'){/* Vorbereitung hat zu lange gedauert: erneut antippen lassen */
      const go=await confirmAction('Datei ist bereit',`„${filename}“ (${Math.max(1,Math.round(text.length/1024))} KB) kann jetzt gesichert werden. Im Teilen-Menü „In Dateien sichern“ wählen.`,[{label:'Abbrechen',value:false},{label:'Jetzt sichern',value:true,className:'primary'}]);
      if(!go)return false;try{await navigator.share({files:[new File([blob],filename,{type:'application/json'})],title:filename});return true;}catch(e2){if(e2&&e2.name==='AbortError')return false;}}}
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);return true;}
/* ---------- Start: welcher Speicher ist erlaubt? ---------- */
async function canWrite(ref){try{await ref.collection('probe').doc('p').set({t:stamp()});return true;}catch{return false;}}
async function init(){
  if(initP)return initP;
  initP=(async()=>{
    let d=null,u=null,id=null,can=null;
    try{if(root.claude&&root.claude.use){[d,u,dl]=await Promise.all([root.claude.use('db'),root.claude.use('user'),root.claude.use('downloads')]);}}catch{d=null;}
    try{id=u?await u.id():null;}catch{id=null;}
    try{can=u?await u.can('data.write'):null;}catch{can=null;}
    if(d){
      const shared=d.doc('shared/travel');
      if(can!==false&&await canWrite(shared)){base=shared;mode='shared';if(id)try{await migrate(d.doc('data/users/'+id+'/travel'));}catch{}}
      else if(id){const own=d.doc('data/users/'+id+'/travel');if(await canWrite(own)){base=own;mode='own';}}
    }
    if(!base){base=localDoc(makeKV(),'device/travel');mode='device';try{navigator.storage?.persist?.();}catch{}}
    base.onSnapshot(s=>{const m=s.exists?s.data():null;remoteRev=m?m.revision:0;if(remoteRev>revision&&!pending)root.dispatchEvent(new CustomEvent('travel-external-update'));},()=>{});
  })();
  return initP;
}

/* ---------- Reise lesen/schreiben (in Teilstücken) ---------- */
async function readParts(col,key,n,ref=base){const snaps=await Promise.all(Array.from({length:n},(_,i)=>retry(()=>ref.collection(col).doc(key+'-'+i).get())));return snaps.map(s=>{if(!s.exists)throw Error('Gespeicherte Reisedaten sind unvollständig.');return s.data().s;}).join('');}
async function writeParts(col,key,json){const parts=split(json);for(let i=0;i<parts.length;i++)await retry(()=>base.collection(col).doc(key+'-'+i).set({s:parts[i]}));return parts.length;}
function dropParts(col,key,n){for(let i=0;i<n;i++)Promise.resolve().then(()=>base.collection(col).doc(key+'-'+i).delete()).catch(()=>{});}
async function migrate(priv){
  const shared=await retry(()=>base.get());if(shared.exists)return;
  const pm=await retry(()=>priv.get());if(!pm.exists)return;const md=pm.data();
  const json=await readParts('parts',md.key,md.parts,priv);const key='r'+md.revision+'-'+rand();const n=await writeParts('parts',key,json);
  const diary=await retry(()=>priv.collection('diary').get());
  for(const e of diary.docs){const body=e.data();for(const p of body.photos||[]){const ph=await retry(()=>priv.collection('photos').doc(p).get());if(ph.exists)await retry(()=>base.collection('photos').doc(p).set(ph.data()));}await retry(()=>base.collection('diary').doc(e.id).set(body));}
  await retry(()=>base.set({revision:md.revision,key,parts:n,updated_at:stamp()}));
}
async function current(){const m=await retry(()=>base.get());if(!m.exists)return {revision:0,state:C().blank(),updated_at:null,meta:null};const md=m.data();return {revision:md.revision,state:JSON.parse(await readParts('parts',md.key,md.parts)),updated_at:md.updated_at,meta:md};}
async function persist(state,cur){const rev=(cur.meta?cur.meta.revision:0)+1,key='r'+rev+'-'+rand();const n=await writeParts('parts',key,JSON.stringify(state));const md={revision:rev,key,parts:n,updated_at:stamp()};await retry(()=>base.set(md));if(cur.meta)dropParts('parts',cur.meta.key,cur.meta.parts);meta=md;return {revision:rev,updated_at:md.updated_at};}

/* ---------- Änderungszeitpunkte je Eintrag (für den Abgleich) ---------- */
const syncDoc=()=>base.collection('meta').doc('sync');
async function getStamps(){const s=await retry(()=>syncDoc().get());const v=s.exists?s.data():{};return {items:{...(v.items||{})},tomb:{...(v.tomb||{})}};}
let stampTail=Promise.resolve();
function changeStamps(fn){const job=stampTail.then(async()=>{const st=await getStamps();fn(st,stamp());await retry(()=>syncDoc().set(st));});stampTail=job.catch(()=>{});return job;}
/* Einreise-Haken werden einzeln abgeglichen (x:<aufgabe>|<person>), damit gleichzeitiges Abhaken beider Personen erhalten bleibt. */
function splitSettings(settings){const s={...(settings||{})},checks=s.entry?.checks||{};if(s.entry)s.entry={...s.entry,checks:{}};return {s,checks};}
function tripKeys(state){const m=new Map();for(const d of state.destinations||[])m.set('d:'+d.id,canonical(d));const {s,checks}=splitSettings(state.settings);m.set('s',canonical({settings:s,routeMode:state.routeMode}));for(const [k,v] of Object.entries(checks))m.set('x:'+k,v);return m;}
function stampTrip(before,after){const a=tripKeys(before),b=tripKeys(after);return changeStamps((st,now)=>{for(const [k,v] of b)if(a.get(k)!==v){st.items[k]=now;delete st.tomb[k];}for(const k of a.keys())if(!b.has(k)){st.tomb[k]=now;delete st.items[k];}});}

/* ---------- Sicherungen ---------- */
async function makeBackup(state,reason){
  const name='reiseatelier-'+reason+'-'+stamp().replace(/[:.]/g,'-')+'.json';
  const key='b'+Date.now()+'-'+rand();const n=await writeParts('bparts',key,JSON.stringify({...state,exportedAt:stamp()}));
  await retry(()=>base.collection('backups').doc(key).set({name,created:stamp(),key,parts:n}));
  const all=(await base.collection('backups').orderBy('created','desc').get()).docs;
  for(const s of all.slice(MAX_BACKUPS)){const b=s.data();dropParts('bparts',b.key,b.parts);Promise.resolve().then(()=>base.collection('backups').doc(s.id).delete()).catch(()=>{});}
  return name;
}

/* Merkt sich, wann auf diesem Gerät zuletzt etwas geändert wurde (für den Hinweis „noch nicht gespeichert“). */
function markChange(){try{const s=JSON.parse(localStorage.getItem(SYNC_STATUS)||'{}');s.changed=stamp();localStorage.setItem(SYNC_STATUS,JSON.stringify(s));}catch{}root.dispatchEvent(new CustomEvent('travel-sync-status'));}
function draft(snapshot){try{localStorage.setItem(DRAFT,JSON.stringify({state:snapshot,revision}));}catch{}}
function signal(){root.dispatchEvent(new CustomEvent('travel-storage-status',{detail:{pending,blocked,revision}}));}
function ids(state){const out=new Set();for(const d of state.destinations||[]){out.add('d:'+d.id);for(const day of d.planning?.days||[]){out.add('t:'+day.id);for(const t of day.excursions||[])out.add('x:'+t.id);}}return out;}

const Store={
get revision(){return revision;},get pending(){return pending;},get blocked(){return blocked;},
get mode(){return mode;},
async load(){await withTimeout(init(),20000,'Speicher antwortet nicht.');const r=await withTimeout(current(),20000,'Speicher nicht erreichbar.');revision=r.revision;meta=r.meta||null;return r.state;},
save(snapshot,confirmed=false){draft(snapshot);pending++;signal();const job=tail.then(async()=>{
  if(blocked)throw Error('Speichern angehalten. Entwurf exportieren oder wiederherstellen.');
  let cur;try{cur=await current();}catch(e){blocked=true;throw Error(errText(e));}
  if(cur.revision!==revision){if(canonical(cur.state)===canonical(snapshot)){revision=cur.revision;meta=cur.meta||null;return cur;}blocked=true;throw Error('Die Reise wurde gerade von jemand anderem oder auf einem anderen Gerät geändert. Deine letzte Änderung ist als Entwurf gesichert.');}
  const before=ids(cur.state),after=ids(snapshot);const removed=[...before].some(x=>!after.has(x));
  if(removed&&!confirmed)throw Error('Entfernen wurde nicht bestätigt.');
  try{if(removed)await makeBackup(cur.state,'vor-loeschen');const r=await persist(snapshot,cur);revision=r.revision;await stampTrip(cur.state,snapshot).catch(()=>{});markChange();return {revision,state:snapshot};}
  catch(e){blocked=true;throw Error(errText(e));}
});tail=job.catch(()=>{});return job.finally(()=>{pending--;if(!pending&&!blocked)try{localStorage.removeItem(DRAFT);}catch{}signal();});},
async flush(){await tail;if(blocked)throw Error('Nicht alle Änderungen sind gespeichert.');},
async _replace(raw,importMode,reason='vor-import'){const cur=await current();const incoming=C().validateState(raw);let next=incoming;
  if(importMode==='merge'){next=C().validateState({...cur.state,destinations:[...cur.state.destinations,...incoming.destinations.map(d=>({...d,id:crypto.randomUUID()}))]});}
  const backup=await makeBackup(cur.state,reason);const r=await persist(next,cur);revision=r.revision;await stampTrip(cur.state,next).catch(()=>{});return {revision,state:next,backup};},
async import(raw,importMode){await this.flush();const r=await this._replace(raw,importMode);markChange();return r;},
async restore(raw,importMode){await tail;const r=await this._replace(raw,importMode);markChange();blocked=false;try{localStorage.removeItem(DRAFT);}catch{}signal();return r;},
async backup(){await this.flush();const cur=await current();return {backup:await makeBackup(cur.state,'manuell')};},
async backups(){const s=await base.collection('backups').orderBy('created','desc').get();return {backups:s.docs.map(d=>({name:d.data().name,id:d.id}))};},
async backupText(id){const s=await base.collection('backups').doc(id).get();if(!s.exists)throw Error('Sicherung nicht gefunden.');const b=s.data();return readParts('bparts',b.key,b.parts);},
async exportText(){await this.flush();const cur=await current();return JSON.stringify({...cur.state,exportedAt:stamp()},null,2);},
canDownload(){return true;},
async download(filename,text){if(!dl)return saveFile(filename,text);try{await dl.save({filename,data:text});return true;}catch(e){if(e&&e.code==='declined')return false;throw Error('Datei konnte nicht gespeichert werden ('+(e&&e.code||'Fehler')+').');}},
getDraft(){try{return JSON.parse(localStorage.getItem(DRAFT)||'null');}catch{return null;}},
async refresh(){if(pending||blocked)return null;if(mode!=='device'&&remoteRev<=revision)return null;const r=await current();if(r.revision===revision)return null;revision=r.revision;meta=r.meta||null;return r.state;},
};

/* ---------- Reisetagebuch ---------- */
const Diary={
  async list(){await init();const s=await retry(()=>base.collection('diary').get());return s.docs.map(d=>({...d.data(),id:d.id}));},
  async save(entry,keepStamp=false){await init();const e={...entry,updated:keepStamp&&entry.updated?entry.updated:stamp()};await retry(()=>base.collection('diary').doc(e.id).set(e));changeStamps(st=>{delete st.tomb['e:'+e.id];}).catch(()=>{});markChange();return e;},
  async remove(id){await init();await retry(()=>base.collection('diary').doc(id).delete());await changeStamps((st,now)=>{st.tomb['e:'+id]=now;}).catch(()=>{});markChange();},
  async putPhoto(id,dataUrl){await init();if(dataUrl.length>240000)throw Error('Foto ist zu groß.');await retry(()=>base.collection('photos').doc(id).set({d:dataUrl}));},
  async getPhoto(id){await init();const s=await retry(()=>base.collection('photos').doc(id).get());return s.exists?s.data().d:null;},
  async dropPhoto(id){await init();try{await base.collection('photos').doc(id).delete();}catch{}},
  watch(cb){init().then(()=>{base.collection('diary').onSnapshot(s=>{if(!s.metadata.hasPendingWrites)cb(s.docs.map(d=>({...d.data(),id:d.id})));},()=>{});});},
};

/* ---------- Abgleich über eine Datei (z. B. geteilter iCloud-Drive-Ordner) ---------- */
const t=x=>x?Date.parse(x)||0:0;
function syncStatus(){try{return JSON.parse(localStorage.getItem(SYNC_STATUS)||'{}');}catch{return {};}}
function setSyncStatus(k){try{const s=syncStatus();s[k]=stamp();localStorage.setItem(SYNC_STATUS,JSON.stringify(s));}catch{}root.dispatchEvent(new CustomEvent('travel-sync-status'));}
const Sync={
  status:syncStatus,
  /* Änderungen auf diesem Gerät, die noch nicht in einer gespeicherten Abgleich-Datei stecken? */
  dirty(){const s=syncStatus();return !!s.changed&&(!s.saved||Date.parse(s.changed)>Date.parse(s.saved));},
  async exportFile(){await Store.flush();const cur=await current(),st=await getStamps(),entries=await Diary.list();const photos={};
    for(const e of entries)for(const p of e.photos||[]){if(!photos[p]){const d=await Diary.getPhoto(p);if(d)photos[p]=d;}}
    const text=JSON.stringify({type:'reiseatelier-abgleich',version:1,exportedAt:stamp(),trip:cur.state,stamps:st,diary:entries,photos});
    const ok=await Store.download('reiseatelier-abgleich.json',text);if(ok)setSyncStatus('saved');return {ok,size:text.length,entries:entries.length,photos:Object.keys(photos).length};},
  /* Plant das Zusammenführen, ohne etwas zu schreiben. */
  async plan(file){await Store.flush();
    if(!file||file.type!=='reiseatelier-abgleich'||!file.trip||!Array.isArray(file.diary))throw Error('Das ist keine Abgleich-Datei des Reiseateliers.');
    const R=C().validateState(file.trip),RS={items:{...(file.stamps?.items||{})},tomb:{...(file.stamps?.tomb||{})}};
    const cur=await current(),L=cur.state,LS=await getStamps();
    const Lm=new Map(L.destinations.map(d=>[d.id,d]));
    /* Gleiche Station mit unterschiedlicher Kennung (z. B. Route auf beiden Geräten getrennt eingetragen) zusammenführen. */
    const nat=d=>[d.name,d.country,d.start].join('|').toLowerCase(),Lnat=new Map(L.destinations.filter(d=>!R.destinations.some(r=>r.id===d.id)).map(d=>[nat(d),d.id]));
    const Rm=new Map(R.destinations.map(d=>{if(!Lm.has(d.id)&&Lnat.has(nat(d))){const id=Lnat.get(nat(d));Lnat.delete(nat(d));const k='d:'+d.id;if(RS.items[k]){RS.items['d:'+id]=RS.items[k];delete RS.items[k];}return [id,{...d,id}];}return [d.id,d];}));
    const out=[],stamps={items:{},tomb:{}},n={tripNew:0,tripUpd:0,tripDel:0,diaryNew:0,diaryUpd:0,diaryDel:0};
    const keyT=(S,k)=>t(S.items[k]),tombT=(S,k)=>t(S.tomb[k]);
    const allIds=[...Lm.keys(),...[...Rm.keys()].filter(id=>!Lm.has(id))];
    for(const id of allIds){const k='d:'+id,l=Lm.get(id),r=Rm.get(id),ls=keyT(LS,k),rs=keyT(RS,k),lt=tombT(LS,k),rt=tombT(RS,k);
      if(l&&r){const take=rs>ls?r:l;if(take===r&&canonical(r)!==canonical(l))n.tripUpd++;out.push(take);stamps.items[k]=new Date(Math.max(ls,rs)||Date.now()).toISOString();}
      else if(r){if(lt&&lt>=rs){stamps.tomb[k]=LS.tomb[k];}else{out.push(r);n.tripNew++;stamps.items[k]=RS.items[k]||stamp();}}
      else if(l){if(rt&&rt>=ls){stamps.tomb[k]=RS.tomb[k];n.tripDel++;}else{out.push(l);stamps.items[k]=LS.items[k]||stamp();}}}
    for(const S of [LS,RS])for(const [k,v] of Object.entries(S.tomb))if(k.startsWith('d:')&&!stamps.items[k]&&(!stamps.tomb[k]||t(v)>t(stamps.tomb[k])))stamps.tomb[k]=v;
    const sl=keyT(LS,'s'),sr=keyT(RS,'s'),useR=sr>sl;stamps.items.s=new Date(Math.max(sl,sr)||Date.now()).toISOString();
    const Lc=splitSettings(L.settings).checks,Rc=splitSettings(R.settings).checks,checks={};
    for(const c of new Set([...Object.keys(Lc),...Object.keys(Rc)])){const k='x:'+c,l=Lc[c],r=Rc[c],ls=keyT(LS,k),rs=keyT(RS,k),lt=tombT(LS,k),rt=tombT(RS,k);
      if(l&&r){checks[c]=rs>ls?r:l;stamps.items[k]=new Date(Math.max(ls,rs)||Date.now()).toISOString();}
      else if(r){if(lt&&lt>=rs)stamps.tomb[k]=LS.tomb[k];else{checks[c]=r;stamps.items[k]=RS.items[k]||stamp();n.tripUpd++;}}
      else if(l){if(rt&&rt>=ls){stamps.tomb[k]=RS.tomb[k];n.tripUpd++;}else{checks[c]=l;stamps.items[k]=LS.items[k]||stamp();}}}
    for(const S of [LS,RS])for(const [k,v] of Object.entries(S.tomb))if(k.startsWith('x:')&&!stamps.items[k]&&(!stamps.tomb[k]||t(v)>t(stamps.tomb[k])))stamps.tomb[k]=v;
    const baseSettings=splitSettings(useR?R.settings:L.settings).s;
    const merged=C().validateState({version:1,settings:{...baseSettings,entry:{...(baseSettings.entry||{}),checks}},routeMode:useR?R.routeMode:L.routeMode,destinations:out});
    if(useR&&canonical({s:splitSettings(R.settings).s,m:R.routeMode})!==canonical({s:splitSettings(L.settings).s,m:L.routeMode}))n.tripUpd++;
    const local=await Diary.list(),Ld=new Map(local.map(e=>[e.id,e])),Rd=new Map(file.diary.filter(e=>e&&typeof e.id==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)).map(e=>[e.id,e]));
    const diaryPut=[],diaryDel=[];
    for(const [id,r] of Rd){const l=Ld.get(id),k='e:'+id,lt=tombT(LS,k);
      if(l){if(t(r.updated)>t(l.updated)&&canonical(r)!==canonical(l)){diaryPut.push(r);n.diaryUpd++;}}
      else if(!(lt&&lt>=t(r.updated))){diaryPut.push(r);n.diaryNew++;}}
    for(const [id,l] of Ld){const k='e:'+id,rt=tombT(RS,k);if(!Rd.has(id)&&rt&&rt>=t(l.updated)){diaryDel.push(l);n.diaryDel++;}}
    for(const S of [LS,RS])for(const [k,v] of Object.entries(S.tomb))if(k.startsWith('e:')&&(!stamps.tomb[k]||t(v)>t(stamps.tomb[k])))stamps.tomb[k]=v;
    for(const e of [...local.filter(e=>!diaryDel.includes(e)),...diaryPut])delete stamps.tomb['e:'+e.id];
    const tripChanged=canonical(merged)!==canonical(L);
    return {n,tripChanged,merged,stamps,diaryPut,diaryDel,photos:file.photos||{},exportedAt:file.exportedAt,anything:tripChanged||diaryPut.length>0||diaryDel.length>0};},
  async apply(p){let backup=null;
    if(p.tripChanged){const r=await Store._replace(p.merged,'replace','vor-abgleich');backup=r.backup;}
    await retry(()=>syncDoc().set(p.stamps));
    for(const e of p.diaryPut){const ids=[];for(const pid of (e.photos||[]).slice(0,12)){const d=p.photos[pid];if(typeof d==='string'&&d.startsWith('data:image/')&&d.length<=240000){await Diary.putPhoto(pid,d);ids.push(pid);}else if(await Diary.getPhoto(pid))ids.push(pid);}
      const clean={id:e.id,date:e.date,time:/^\d{2}:\d{2}$/.test(e.time||'')?e.time:'',title:String(e.title||'').slice(0,200),text:String(e.text||'').slice(0,20000),mood:String(e.mood||'').slice(0,20),weather:String(e.weather||'').slice(0,20),temp:Number.isFinite(e.temp)?e.temp:null,place:String(e.place||'').slice(0,200),destinationId:String(e.destinationId||''),photos:ids,created:e.created||stamp(),updated:e.updated||stamp()};
      await retry(()=>base.collection('diary').doc(clean.id).set(clean));}
    for(const e of p.diaryDel){await retry(()=>base.collection('diary').doc(e.id).delete());for(const pid of e.photos||[])Diary.dropPhoto(pid);}
    setSyncStatus('loaded');const cur=await current();revision=cur.revision;meta=cur.meta;return {state:cur.state,backup};},
};

Store.diary=Diary;Store.sync=Sync;
root.TravelStore=Store;
root.addEventListener('beforeunload',e=>{if(pending||blocked){e.preventDefault();e.returnValue='';}});
})(globalThis);
